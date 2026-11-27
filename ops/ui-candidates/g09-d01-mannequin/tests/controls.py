"""Independently decode weights and test the sampled D01 control envelope."""
from itertools import product
from tempfile import TemporaryDirectory
from pathlib import Path
from hashlib import sha256
import json
import struct
import sys

import numpy as np

import bpy
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree
sys.path.insert(0, str(Path(__file__).resolve().parent))
from readback import ROOT, PATH, read, require
from junctions import extra_contact, section_clearance, shared_features

CONTROL_PATH = ROOT / "assets/mannequin-controls-v1.glb"
NAMES = (
    "torsoLength+", "torsoLength-", "shoulderBreadth+", "shoulderBreadth-",
    "chestGirth+", "chestGirth-", "seatGirth+", "seatGirth-",
)
MIXED = (.375, -.625, .875, -.25)


def decode(raw):
    meta, vertices, normals, faces, doc, accessor = read(raw, with_accessors=True)
    mesh, = doc["meshes"]
    require(tuple(mesh["extras"]["targetNames"]) == NAMES, "target identities")
    w = np.asarray(mesh["weights"],dtype=float)
    require(w.shape == (8,) and np.isfinite(w).all() and np.all((0<=w)&(w<=1))
            and not np.any(w[::2]*w[1::2]), "encoded weights")
    targets = mesh["primitives"][0]["targets"]
    require([t["POSITION"] for t in targets] == list(range(3,11)), "target accessors")
    delta = np.stack([accessor(t["POSITION"],5126,"VEC3","<f4",3) for t in targets])
    require(delta.shape == (8,*vertices.shape) and np.isfinite(delta).all(), "target vectors")
    require(np.array_equal(delta[::2], -delta[1::2]), "reversible target pair")
    require(abs(delta).max() <= .030001, "displacement bound")
    return meta, vertices.astype(float), faces, delta, w


def with_json(raw, change):
    end = 20 + struct.unpack_from("<I",raw,12)[0]
    doc = json.loads(raw[20:end])
    change(doc["meshes"][0])
    data = json.dumps(doc,separators=(",",":")).encode()
    data += b" " * (-len(data)%4)
    return struct.pack("<4sII",b"glTF",2,20+len(data)+len(raw)-end) + struct.pack("<I4s",len(data),b"JSON")+data+raw[end:]


def signed_to_paired(signed):
    return [a for v in signed for a in (max(v,0),max(-v,0))]


def bake(vertices, delta, weights):
    return vertices + np.einsum("i,ijk->jk",weights,delta,dtype=float)


def metrics(vertices, meta):
    l = {key:vertices[i] for key,i in meta["landmarks"].items()}
    def perimeter(role):
        p = vertices[meta["rings"][role]]
        return float(np.linalg.norm(p - np.roll(p,1,axis=0),axis=1).sum())
    return np.array([
        (l["neck-left"][1]+l["neck-right"][1]-l["hip-left"][1]-l["hip-right"][1])/2,
        l["shoulder-left"][0]-l["shoulder-right"][0], perimeter("chest"), perimeter("seat"),
    ])


def blender_reopen(path, vertices, expected, w):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(path),merge_vertices=False)
    obj, = [o for o in bpy.context.scene.objects if o.type=="MESH"]
    keys = list(obj.data.shape_keys.key_blocks)[1:]
    require(tuple(k.name for k in keys)==NAMES, "Blender target identity")
    stored = np.array([k.value for k in keys])
    require(np.max(np.abs(stored-w))<1e-7, "Blender weights")
    def world_positions(mesh):
        world = [obj.matrix_world @ a.co for a in mesh.vertices]
        return np.array([(a.x,a.z,-a.y) for a in world])
    reference = world_positions(obj.data)
    tree = KDTree(len(reference))
    for j,p in enumerate(reference):
        tree.insert(p,j)
    tree.balance()
    order = [tree.find(p)[1] for p in vertices]
    require(len(set(order))==len(vertices), "Blender bijection")
    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    try:
        aligned = world_positions(mesh)[order]
    finally:
        evaluated.to_mesh_clear()
    err = np.linalg.norm(aligned-expected,axis=1)
    require(err.max()<=.0001, "Blender effective transport")
    return aligned, float(err.max())


def conservative_orientation(base, faces, delta):
    # In the signed domain each position is affine. The projected cross
    # product is quadratic. Subtracting all absolute nonconstant terms
    # from the neutral term bounds it for every weight in [-1,1].
    a,b,c = base[faces].transpose(1,0,2)
    e,f = b-a,c-a
    na = np.cross(e,f)
    squared = np.einsum("ij,ij->i",na,na)
    d = delta[::2].astype(float)[:,faces]
    u,v = d[:,:,1]-d[:,:,0], d[:,:,2]-d[:,:,0]
    projection = lambda x: np.einsum("ij,ij->i",x,na)
    bound = squared.copy()
    for i in range(4):
        bound -= abs(projection(np.cross(u[i],f)+np.cross(e,v[i])))
        bound -= abs(projection(np.cross(u[i],v[i])))
        for j in range(i):
            bound -= abs(projection(np.cross(u[i],v[j])+np.cross(u[j],v[i])))
    return float((bound/squared).min())


def require_orientation(bound):
    require(np.isfinite(bound) and bound > 0, "positive finite orientation bound required")
    return bound


def check_samples(meta, base, faces, delta):
    edge_features,tip_features = shared_features(faces)
    a,b,c = base[faces].transpose(1,0,2)
    normal = np.cross(b-a,c-a)
    area = np.einsum("ij,ij->i",normal,normal)
    samples = ([(0,)*4] + [tuple(s*np.eye(4)[i]) for i in range(4) for s in (-1,1)]
               + list(product((-1,1),repeat=4)) + [MIXED, tuple(-np.array(MIXED))]
               + [tuple(np.array(c)*[.93,.77,.85,.91]) for c in product((-1,1),repeat=4)])
    rows = []
    for signed in samples:
        q = bake(base,delta,signed_to_paired(signed))
        a,b,c = q[faces].transpose(1,0,2)
        cross = np.cross(b-a,c-a)
        oriented = np.einsum("ij,ij->i",cross,normal)/area
        require(oriented.min()>0 and q[:,1].min()==0, f"sample orientation or floor {signed}")
        directions = cross / np.linalg.norm(cross,axis=1)[:,None]
        smooth_normals = np.zeros_like(q)
        for indices in faces.T:
            np.add.at(smooth_normals,indices,cross)
        smooth_normals /= np.linalg.norm(smooth_normals,axis=1)[:,None]
        normal_dot = np.einsum("ij,ikj->ik",directions,smooth_normals[faces]).min()
        require(normal_dot>0, f"sample normal agreement {signed}")
        tree = BVHTree.FromPolygons(q.tolist(),faces.tolist(),all_triangles=True)
        pairs = np.asarray([(i,j) for i,j in tree.overlap(tree) if i<j])
        if pairs.size:
            shared = (faces[pairs[:,0],:,None] == faces[pairs[:,1],None,:]).any(axis=(1,2))
            require(shared.all(), f"sample non-adjacent overlap {signed}")
        require(extra_contact(q,edge_features,tip_features)==(0,0), f"sample shared feature overlap {signed}")
        arm = section_clearance(q,faces,1.12,3)
        leg = section_clearance(q,faces,.65,2)
        require(min(arm,leg)>0, f"sample clearance {signed}")
        rows.append(dict(signed=signed,minProjectedAreaRatio=float(oriented.min()),
                         minFaceNormalDot=float(normal_dot), armGapM=arm, legGapM=leg))
    # Sweep 9 levels with each other control fixed at ±1, checking intended responses.
    slopes = []
    for i in range(4):
        gains = []
        for background in product((-1.,1.),repeat=3):
            values = []
            for t in np.linspace(-1,1,9):
                signed = list(background)
                signed.insert(i,t)
                values.append(metrics(bake(base,delta,signed_to_paired(signed)),meta)[i])
            gains.extend(np.diff(values))
        require(min(gains)>0, f"non-monotone control {i}")
        slopes.append(float(min(gains)))
    return rows, slopes


if __name__ == "__main__":
    raw = CONTROL_PATH.read_bytes()
    meta, base, faces, delta, w = decode(raw)
    neutral_meta, neutral, _, neutral_faces = read(PATH.read_bytes())
    require(meta == neutral_meta and np.array_equal(base,neutral)
            and np.array_equal(faces,neutral_faces) and not np.any(w), "neutral preservation")
    controls = []
    def reject(label, modified, error):
        try:
            decode(modified)
        except ValueError as exc:
            require(str(exc)==error, f"{label}: {exc}")
            controls.append(label)
        else:
            raise ValueError("accepted " + label)
    reject("renamed target",with_json(raw,lambda m:m["extras"]["targetNames"].__setitem__(3,"other")),"target identities")
    reject("nonfinite weight",with_json(raw,lambda m:m["weights"].__setitem__(0,float("nan"))),"encoded weights")
    reject("out of range weight",with_json(raw,lambda m:m["weights"].__setitem__(0,1.01)),"encoded weights")
    reject("both signed targets active",with_json(raw,lambda m:m["weights"].__setitem__(slice(0,2),[.2,.3])),"encoded weights")
    reject("truncation", raw[:-8],"GLB header")
    bad = bytearray(raw)
    end = 20 + struct.unpack_from("<I",bad,12)[0]
    doc = json.loads(bad[20:end])
    struct.pack_into("<f",bad,end+8+doc["bufferViews"][3]["byteOffset"],.01)
    reject("altered target payload",bytes(bad),"reversible target pair")

    # Two deliberate local overlaps exercise both shared-feature predicates.
    test_points = np.array([[0,0,0],[1,0,0],[0,1,0],[.2,.3,0],[.4,.1,0]])
    require(extra_contact(test_points,np.array([[0,1,2,3]]),np.array([[0,1,2,3,4]]))==(1,1),
            "adjacent overlap controls")
    bound = require_orientation(conservative_orientation(base,faces,delta))
    for invalid in (0, -.01, float("nan"), float("inf")):
        try:
            require_orientation(invalid)
        except ValueError:
            continue
        raise RuntimeError("unsafe orientation bound accepted")
    rows, slopes = check_samples(meta,base,faces,delta)
    w = signed_to_paired(MIXED)
    mixed = with_json(raw,lambda m:m.update(weights=w))
    with TemporaryDirectory(dir=ROOT / "evidence") as directory:
        edited = Path(directory)/"edited.glb"
        edited.write_bytes(mixed)
        _, origin, _, vectors, reopened_weights = decode(edited.read_bytes())
        q = bake(origin,vectors,reopened_weights)
        reference = bake(base,delta,w)
        decoded_error = float(np.linalg.norm(q-reference,axis=1).max())
        require(np.array_equal(w,reopened_weights) and decoded_error<=.0001, "reopened effective shape")
        aligned, blender_error = blender_reopen(edited,base,reference,w)
    from capture import capture
    def surface_normals(p):
        a,b,c = p[faces].transpose(1,0,2)
        result = np.zeros_like(p)
        for idx in faces.T:
            np.add.at(result,idx,np.cross(b-a,c-a))
        return result / np.linalg.norm(result,axis=1)[:,None]
    for name, weights in (("mixed",w),("corner",signed_to_paired((-1,1,1,-1)))):
        p = bake(base,delta,weights)
        capture(p,surface_normals(p),faces,38).save(ROOT / f"evidence/{name}-oblique.png")
    extrema = lambda p: np.array([p.min(axis=0),p.max(axis=0)])
    report = dict(assetSha256=sha256(raw).hexdigest(), assetBytes=len(raw),
                  samples=rows, conservativeProjectedAreaLowerRatio=bound,
                  monotoneMinimumStepM=slopes, negativeCases=controls,
                  reopenSigned=MIXED, decoderMaxM=decoded_error, blenderMaxM=blender_error,
                  blenderLandmarkMaxM=float(np.linalg.norm((aligned-reference)[list(meta["landmarks"].values())],axis=1).max()),
                  blenderBoundsMaxM=float(np.linalg.norm(extrema(aligned)-extrema(reference),axis=1).max()))
    (ROOT / "evidence/controls.json").write_text(json.dumps(report,indent=2)+"\n")
    print(f"{len(rows)} weighted samples passed with Blender transport {blender_error:g} m")
