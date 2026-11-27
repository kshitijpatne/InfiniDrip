"""Sampled intersection checks, including contact beyond common mesh features."""
from collections import defaultdict
from itertools import combinations
import numpy as np

ANGLE_EPS = 2e-7  # radians, dimensionless predicates on unit directions
DIST_EPS = 2e-7   # metres, section span merging


def unit(v):
    return v / np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-30)


def shared_features(faces):
    incident = defaultdict(list)
    for i, tri in enumerate(faces.tolist()):
        for vertex in tri:
            incident[vertex].append(i)
    edges, tips = [], []
    for common, around in incident.items():
        for i,j in combinations(around,2):
            a,b = set(faces[i])-{common}, set(faces[j])-{common}
            overlap = a & b
            if not overlap:
                tips.append([common,*sorted(a),*sorted(b)])
            elif common < (other := next(iter(overlap))):
                edges.append([common,other,*sorted(a-overlap),*sorted(b-overlap)])
    return np.asarray(edges), np.asarray(tips)


def extra_contact(vertices, edges, tips):
    # A shared edge permits extra intersection only if the planes coincide
    # and both opposite vertices lie on the same side of the common line.
    p,q,a,b = vertices[edges].transpose(1,0,2)
    direction = unit(q-p)
    side_a,side_b = unit(np.cross(direction,a-p)),unit(np.cross(direction,b-p))
    bad_edge = np.linalg.norm(side_a-side_b,axis=1) <= ANGLE_EPS

    # For a shared vertex, triangles intersect away from it iff their
    # positive ray cones intersect. For coplanar cones test their boundary
    # rays. Otherwise their planes share just the two line directions.
    p,a,b,c,d = vertices[tips].transpose(1,0,2)
    a,b,c,d = (unit(q-p) for q in (a,b,c,d))
    n,m = unit(np.cross(a,b)),unit(np.cross(c,d))
    line = np.cross(n,m)
    coplanar = np.linalg.norm(line,axis=1) <= ANGLE_EPS
    line = unit(line)
    dot = lambda u,v: np.einsum("ij,ij->i",u,v)

    def inside(r, u, v, normal):
        return ((abs(dot(r,normal)) <= ANGLE_EPS)
                & (dot(np.cross(u,r),normal) >= -ANGLE_EPS)
                & (dot(np.cross(r,v),normal) >= -ANGLE_EPS))

    bad_tip = np.where(
        coplanar,
        inside(a,c,d,m) | inside(b,c,d,m) | inside(c,a,b,n) | inside(d,a,b,n),
        (inside(line,a,b,n) & inside(line,c,d,m)) |
        (inside(-line,a,b,n) & inside(-line,c,d,m)),
    )
    return int(bad_edge.sum()), int(bad_tip.sum())


def section_clearance(vertices, faces, height, expected_islands):
    triangles = vertices[faces]
    y = triangles[:,:,1] - height
    sliced = triangles[(y.min(axis=1) < 0) & (y.max(axis=1) > 0)]
    spans = []
    for tri in sliced:
        x = []
        for a,b in zip(tri,np.roll(tri,-1,axis=0)):
            if (a[1]-height)*(b[1]-height) < 0:
                x.append(a[0] + (b[0]-a[0])*(height-a[1])/(b[1]-a[1]))
        if len(x) == 2:
            spans.append(sorted(x))
    islands = []
    for lo,hi in sorted(spans):
        if islands and lo <= islands[-1][1]+DIST_EPS:
            islands[-1][1] = max(hi,islands[-1][1])
        else:
            islands.append([lo,hi])
    if len(islands) != expected_islands:
        raise ValueError(f"section at {height} m has {len(islands)} spans")
    return min(b[0]-a[1] for a,b in zip(islands,islands[1:]))
