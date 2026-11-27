"""Independent neutral GLB fixture reader and Blender import check."""
from collections import defaultdict
from hashlib import sha256
import json
from pathlib import Path
import struct
import sys

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "assets/mannequin-v1.glb"
sys.path.insert(0, str(Path(__file__).resolve().parent))
from semantics import verify


def require(condition, reason):
    if not condition:
        raise ValueError(reason)


def read(raw, with_accessors=False):
    require(28 <= len(raw) <= 15 * 1024 * 1024, "file length")
    magic, version, size = struct.unpack_from("<4sII", raw)
    require((magic, version, size) == (b"glTF", 2, len(raw)), "GLB header")
    length, kind = struct.unpack_from("<I4s", raw, 12)
    end = 20 + length
    require(length % 4 == 0 and end + 8 <= size and kind == b"JSON", "JSON chunk")
    doc = json.loads(raw[20:end])
    length, kind = struct.unpack_from("<I4s", raw, end)
    binary = raw[end + 8:]
    require(kind == b"BIN\0" and length == len(binary) and length % 4 == 0, "BIN chunk")
    require(doc["buffers"] == [{"byteLength": length}], "embedded buffer")
    require(all(field not in doc for field in ("images", "extensions", "extensionsUsed")), "external content")
    require(doc["nodes"] == [{"mesh": 0, "name": "D01 Neutral"}], "identity node axes")
    primitive, = doc["meshes"][0]["primitives"]

    def accessor(index, component, kind, dtype, count):
        info = doc["accessors"][index]
        require((info["componentType"], info["type"]) == (component, kind), "accessor type")
        view = doc["bufferViews"][info["bufferView"]]
        start = view.get("byteOffset", 0)
        size = np.dtype(dtype).itemsize * count * info["count"]
        require(view["buffer"] == 0 and 0 <= start <= start + size <= len(binary)
                and view["byteLength"] == size and info.get("byteOffset", 0) == 0, "accessor bounds")
        return np.frombuffer(binary, dtype=dtype, offset=start, count=count * info["count"]).reshape(-1, count)

    vertices = accessor(primitive["attributes"]["POSITION"], 5126, "VEC3", "<f4", 3)
    normals = accessor(primitive["attributes"]["NORMAL"], 5126, "VEC3", "<f4", 3)
    triangles = accessor(primitive["indices"], 5123, "SCALAR", "<u2", 1).reshape(-1, 3)
    decoded = (doc["extras"], vertices, normals, triangles)
    return (*decoded, doc, accessor) if with_accessors else decoded


def geometry(meta, vertices, normals, faces):
    require(meta["interface"] == "infinidrip-mannequin-v1", "interface")
    require((meta["unit"], meta["up"], meta["front"], meta["anatomicalLeft"], meta["groundY"])
            == ("metre", "+Y", "+Z", "+X", 0), "coordinate contract")
    require(np.isfinite(vertices).all() and np.isfinite(normals).all(), "finite geometry")
    require(len(normals) == len(vertices) and faces.max() < len(vertices), "indices")
    points = {name: vertices[index] for name, index in meta["landmarks"].items()}
    require(abs(vertices[:, 1].max() - 1.7) <= .0001 and abs(points["crown"][1] - 1.7) <= .0001, "metre scale")
    require(vertices[:, 1].min() == points["sole-left"][1] == points["sole-right"][1] == 0, "ground")
    require(points["neck-front"][2] > .035 and points["neck-back"][2] < -.025
            and vertices[:, 2].max() > .09, "anterior geometry")
    for name in ("sole", "neck", "shoulder", "axilla", "waist", "hip"):
        require(points[name + "-left"][0] > .03 > points[name + "-right"][0]
                and points[name + "-right"][0] < -.03, "side identity")
    require(points["shoulder-left"][1] > points["axilla-left"][1] > points["waist-left"][1]
            > points["hip-left"][1] > points["crotch"][1], "landmark height order")
    require(sha256(faces.tobytes()).hexdigest() == meta["indexSha256"], "index identity")
    edges, neighbors, links = defaultdict(list), defaultdict(set), defaultdict(lambda: defaultdict(set))
    for a, b, c in faces.tolist():
        for i, j, k in ((a,b,c), (b,c,a), (c,a,b)):
            edges[min(i,j), max(i,j)].append(i < j)
            neighbors[i].add(j)
            neighbors[j].add(i)
            links[i][j].add(k)
            links[i][k].add(j)

    def reachable(start, graph):
        seen, pending = {start}, [start]
        while pending:
            for neighbor in graph[pending.pop()] - seen:
                seen.add(neighbor)
                pending.append(neighbor)
        return seen

    require(len(reachable(0, neighbors)) == len(vertices), "connected surface")
    require(all(sorted(uses) == [False, True] for uses in edges.values()), "oriented two-face edges")
    require(all(len(reachable(next(iter(link)), link)) == len(link) for link in links.values()), "single vertex fans")
    require(len(vertices) - len(edges) + len(faces) == 2, "Euler characteristic")
    for ring in meta["rings"].values():
        require(len(ring) == len(set(ring)) == 128 and all(
            (min(i,j), max(i,j)) in edges for i,j in zip(ring, ring[1:] + ring[:1])
        ), "connected measuring ring")
    verify(meta, vertices)
    a,b,c = vertices.astype(float)[faces].transpose(1,0,2)
    cross = np.cross(b-a, c-a)
    doubled_area = np.linalg.norm(cross, axis=1)
    volume = np.sum(a * cross) / 6
    require(doubled_area.min() > 1e-10 and volume > 0, "nondegenerate positive winding")
    normal_alignment = np.einsum("ij,ikj->ik", cross / doubled_area[:,None], normals[faces])
    require(abs(np.linalg.norm(normals, axis=1)-1).max() < 1e-6
            and normal_alignment.min() > 0, f"outward normals ({normal_alignment.min():g})")
    angles = []
    for p,q,r in ((a,b,c),(b,c,a),(c,a,b)):
        angles.append(np.degrees(np.arctan2(doubled_area, np.sum((q-p)*(r-p), axis=1))))
    all_angles = np.min(angles, axis=0)
    centers = (a+b+c)/3
    x,y,_ = centers.T
    junctions = {
        "shoulder-left": (x > .115) & (y > 1.30) & (y < 1.47),
        "shoulder-right": (x < -.115) & (y > 1.30) & (y < 1.47),
        "crotch": (abs(x) < .065) & (y > .75) & (y < .86),
    }
    junction_quality = {
        name: {"triangles": int(mask.sum()), "minAngleDeg": all_angles[mask].min(),
               "minNormalFaceDot": normal_alignment[mask].min()}
        for name, mask in junctions.items()
    }
    return dict(junctionQuality=junction_quality, vertices=len(vertices), edges=len(edges), triangles=len(faces), volumeM3=volume,
                minTriangleAreaM2=doubled_area.min()/2, minTriangleAngleDeg=all_angles.min(),
                minAngleTriangle=int(all_angles.argmin()), minNormalFaceDot=normal_alignment.min(),
                boundsM=[vertices.min(axis=0).tolist(), vertices.max(axis=0).tolist()],
                landmarksM={name: point.tolist() for name, point in points.items()})


def check_blender(vertices, faces, meta):
    import bpy
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree
    from mathutils.kdtree import KDTree

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(PATH), merge_vertices=False)
    mesh, = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    require(len(mesh.data.vertices) == len(vertices) and len(mesh.data.polygons) == len(faces), "Blender topology counts")
    world = [mesh.matrix_world @ v.co for v in mesh.data.vertices]
    # Blender's +Z is up and -Y is anterior after glTF axis conversion.
    imported = np.array([(v.x, v.z, -v.y) for v in world])
    tree = KDTree(len(world))
    for i,p in enumerate(imported):
        tree.insert(Vector(p), i)
    tree.balance()
    nearest = [tree.find(Vector(p)) for p in vertices]
    correspondence = [row[1] for row in nearest]
    require(len(set(correspondence)) == len(vertices), "bijective import")
    imported_faces = [list(poly.vertices) for poly in mesh.data.polygons]
    def cycle(face):
        i = face.index(min(face))
        return tuple(face[i:] + face[:i])
    require({cycle([correspondence[j] for j in face]) for face in faces} ==
            {cycle(face) for face in imported_faces}, "Blender oriented topology")
    floor_top_delta = max(np.linalg.norm(fn(imported, axis=0) - fn(vertices, axis=0))
                          for fn in (np.min,np.max))
    landmark_delta = max(np.linalg.norm(imported[correspondence[j]] - vertices[j])
                         for j in meta["landmarks"].values())
    full_delta = np.linalg.norm(imported[correspondence] - vertices, axis=1).max()
    require(max(full_delta, floor_top_delta, landmark_delta) <= .0001, "transport displacement")
    surface = BVHTree.FromPolygons(world, imported_faces, all_triangles=True)
    indices = [set(face) for face in imported_faces]
    overlaps = [(i,j) for i,j in surface.overlap(surface) if i<j and not indices[i] & indices[j]]
    require(not overlaps, f"non-adjacent triangle intersections: {len(overlaps)}, first {overlaps[:5]}")
    return dict(version=bpy.app.version_string, allVertexMaxM=full_delta, landmarkMaxM=landmark_delta,
                boxCornerMaxM=floor_top_delta, nonadjacentIntersections=len(overlaps))


if __name__ == "__main__":
    raw = PATH.read_bytes()
    meta, vertices, normals, faces = read(raw)
    result = geometry(meta, vertices, normals, faces)
    negatives = {}
    def reject(name, operation, expected):
        try:
            operation()
        except ValueError as exc:
            require(str(exc) == expected, f"unexpected rejection for {name}: {exc}")
            negatives[name] = str(exc)
        else:
            raise RuntimeError(f"accepted invalid fixture: {name}")
    reject("bad magic", lambda: read(b"BAD!" + raw[4:]), "GLB header")
    reject("wrong chunk size", lambda: read(raw[:12] + struct.pack("<I", len(raw)) + raw[16:]), "JSON chunk")
    reject("truncated binary", lambda: read(raw[:-4]), "GLB header")
    reject("centimetre scale", lambda: geometry(meta, vertices * 100, normals, faces), "metre scale")
    reject("wrong up", lambda: geometry(meta, vertices[:, [0,2,1]], normals, faces), "metre scale")
    reject("wrong anterior", lambda: geometry(meta, vertices * [1,1,-1], normals, faces), "anterior geometry")
    reject("reflected sides", lambda: geometry(meta, vertices * [-1,1,1], normals, faces), "side identity")
    from copy import deepcopy
    swapped = deepcopy(meta)
    swapped["rings"]["chest"], swapped["rings"]["seat"] = swapped["rings"]["seat"], swapped["rings"]["chest"]
    reject("swapped chest and seat", lambda: verify(swapped, vertices), "section chest")
    wrong = deepcopy(meta)
    wrong["landmarks"]["neck-front"] = wrong["landmarks"]["neck-left"]
    reject("wrong neck role", lambda: verify(wrong, vertices), "landmark neck-front")
    asymmetric = vertices.copy()
    asymmetric[meta["landmarks"]["axilla-right"],2] += .003
    reject("axilla asymmetry", lambda: verify(meta, asymmetric), "bilateral axilla")
    result.update(sha256=sha256(raw).hexdigest(), byteCount=len(raw), rejected=negatives)
    result["blender"] = check_blender(vertices, faces, meta)
    (ROOT / "evidence/neutral.json").write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")
    print("Neutral readback passed")
