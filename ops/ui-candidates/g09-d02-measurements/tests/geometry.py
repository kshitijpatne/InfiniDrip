"""Verify exact JavaScript-produced D02 meshes, using Blender only for transport and collision."""
import json
import sys
from collections import defaultdict
from pathlib import Path
import numpy as np
from mathutils.bvhtree import BVHTree

sys.dont_write_bytecode = True
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root.parent / 'g09-d01-mannequin/tests'))
import controls as d01
from junctions import shared_features, extra_contact, section_clearance


def require(ok, reason):
    if not ok:
        raise ValueError(reason)


def contour(vertices, faces, y):
    """Intersect triangle edges with a plane and return the loop enclosing the torso axis."""
    segments = set()
    points = {}
    offsets = vertices[:,1] - y
    for tri in faces[(offsets[faces].min(axis=1)<=0) & (offsets[faces].max(axis=1)>=0)]:
        nodes = set()
        for a,b in zip(tri,np.roll(tri,-1)):
            a,b = int(a),int(b)
            if offsets[a]==0:
                nodes.add((a,a))
                points[a,a]=vertices[a,[0,2]]
            if offsets[a]*offsets[b]<0:
                k=tuple(sorted((a,b)))
                nodes.add(k)
                points[k]=(vertices[a]+(vertices[b]-vertices[a])*(-offsets[a])/(offsets[b]-offsets[a]))[[0,2]]
        require(len(nodes)<=2,'face lies in section plane')
        if len(nodes)==2:
            segments.add(tuple(sorted(nodes)))
    adjacency=defaultdict(set)
    for a,b in segments:
        adjacency[a].add(b)
        adjacency[b].add(a)
    require(all(len(ns)==2 for ns in adjacency.values()),'section is not closed loops')
    remaining=set(adjacency)
    torso=[]
    while remaining:
        start=min(remaining)
        loop=[start]
        before,current=start,min(adjacency[start])
        while current!=start:
            require(current in remaining and current not in loop,'section loop repeats')
            loop.append(current)
            before,current=current,next(iter(adjacency[current]-{before}))
        remaining.difference_update(loop)
        p=np.array([points[k] for k in loop])
        q=np.roll(p,-1,axis=0)
        crossings=(p[:,1]>0)!=(q[:,1]>0)
        a,b=p[crossings],q[crossings]
        if np.count_nonzero(a[:,0]-a[:,1]*(b[:,0]-a[:,0])/(b[:,1]-a[:,1])>0)%2:
            torso.append(loop)
    require(len(torso)==1,'expected exactly one torso contour')
    return torso[0]


def perimeter(vertices, loop, y):
    a,b=np.array(loop).T
    p,q=vertices[a],vertices[b]
    t=np.divide(y-p[:,1],q[:,1]-p[:,1],out=np.zeros(len(a)),where=a!=b)
    p=p+t[:,None]*(q-p)
    return np.linalg.norm(p-np.roll(p,-1,axis=0),axis=1).sum()


def cross(p,f):
    a,b,c=p[f].transpose(1,0,2)
    return np.cross(b-a,c-a)


def collisions(p, f, features):
    tree=BVHTree.FromPolygons(p.tolist(),f.tolist(),all_triangles=True)
    pairs=np.array([(i,j) for i,j in tree.overlap(tree) if i<j])
    if pairs.size:
        require((f[pairs[:,0],:,None]==f[pairs[:,1],None,:]).any(axis=(1,2)).all(),'disjoint faces collide')
    require(extra_contact(p,*features)==(0,0),'shared feature overlap')


def main():
    pose_path,weight_path,reopen_path=sys.argv[sys.argv.index('--')+1:]
    meta,base,faces,delta,_=d01.decode(d01.CONTROL_PATH.read_bytes())
    states=json.loads(Path(weight_path).read_text())
    require([(c,s) for c,s,_ in states]==[(c,s) for c in range(78,92) for s in range(81,96)],'grid inventory')
    poses=np.memmap(pose_path,dtype='<f4',mode='r',shape=(len(states),*base.shape))
    ys=[float(np.float32(1.222430944442749)),float(np.float32(.9404627084732056))]
    loops=[contour(base,faces,y) for y in ys]
    # The verifier derives rings solely from the triangle plane intersection.
    fields=delta[[4,6]].astype(float)
    require(not np.any(fields[:,:,1]),'vertical displacements')
    active=np.any(fields!=0,axis=2)
    support=np.any(active[:,faces],axis=2)
    height=base[faces,1]
    separation=height[support[0]].min()-height[support[1]].max()
    require(separation>.017,'triangle slabs overlap')
    require(not np.any(active[0]&active[1]),'vertex support overlaps')
    require(not np.intersect1d(faces[support[0]],faces[support[1]]).size,'normal fans overlap')
    reference=cross(base,faces)
    denominator=(reference*reference).sum(axis=1)
    features=shared_features(faces)
    measured_error=0
    min_area=np.inf
    min_dot=np.inf
    measured_gaps=np.full(2,np.inf)
    checked=[set(),set()]
    collisions(base,faces,features)
    for p,(chest,seat,weights) in zip(poses,states):
        w=np.array(weights)
        require(not w[:4].any() and np.isfinite(w).all() and ((0<=w)&(w<=1)).all()
                and not np.any(w[::2]*w[1::2]), 'unsupported weight state')
        signed=w[4::2]-w[5::2]
        expected=(base+signed[0]*fields[0]+signed[1]*fields[1]).astype('<f4')
        require(np.array_equal(p,expected),'combined runtime mesh does not compose under support proof')
        # Plane topology/interpolation parameters are invariant because every vertex Y is fixed.
        p=p.astype(float)
        error=max(abs(perimeter(p,loop,y)-cm/100) for loop,y,cm in zip(loops,ys,(chest,seat)))
        require(error<=1e-5,f'plane residual {(chest,seat,error)}')
        measured_error=max(measured_error,error)
        n=cross(p,faces)
        ratio=((n*reference).sum(axis=1)/denominator).min()
        require(ratio>0,f'orientation {(chest,seat)}')
        min_area=min(min_area,ratio)
        smooth=np.zeros_like(p)
        for ids in faces.T:
            np.add.at(smooth,ids,n)
        smooth/=np.linalg.norm(smooth,axis=1)[:,None]
        cosine=np.einsum('ij,ikj->ik',n/np.linalg.norm(n,axis=1)[:,None],smooth[faces]).min()
        require(cosine>0,f'normals {(chest,seat)}')
        min_dot=min(min_dot,cosine)
        for i,cm in enumerate((chest,seat)):
            key=cm,signed[i]
            if key in checked[i]:
                continue
            checked[i].add(key)
            solo=(base+signed[i]*fields[i]).astype('<f4').astype(float)
            # Test every changed face against the full otherwise-neutral mesh, and every shared feature.
            collisions(solo,faces,features)
            gaps=[section_clearance(solo,faces,y,n) for y,n in ((1.12,3),(.65,2))]
            measured_gaps=np.minimum(measured_gaps,gaps)
    require(list(map(len,checked))==[14,15],'single-field coverage')
    # One direct mixed-extreme check supplements the compositional proof.
    collisions(poses[-15].astype(float),faces,features)
    data=Path(reopen_path).read_bytes()
    _,_,_,_,w=d01.decode(data)
    expected=poses[(82-78)*15+(91-81)]
    aligned,err=d01.blender_reopen(Path(reopen_path),base,expected,w)
    bounds=max(np.linalg.norm(fn(aligned,axis=0)-fn(expected,axis=0)) for fn in (np.min,np.max))
    landmarks=max(np.linalg.norm(aligned[j]-expected[j]) for j in meta['landmarks'].values())
    require(max(err,bounds,landmarks)<=.0001,'GLB transport')
    print(json.dumps(dict(pairs=len(states),single_fields=list(map(len,checked)),slab_gap_mm=separation*1000,
          residual_mm=measured_error*1000,min_area_ratio=min_area,min_normal_dot=min_dot,
          component_section_gaps_mm=(measured_gaps*1000).tolist(),transport_mm=err*1000,
          bounds_mm=bounds*1000,landmarks_mm=landmarks*1000)))


if __name__=='__main__':
    main()
