"""Author the neutral D01 dress form and serialize the indexed surface to GLB."""
from collections import defaultdict, deque
from hashlib import sha256
import json
from math import cos, pi, sin
from pathlib import Path
import struct

import numpy as np

from controls import TARGETS, shape_fields, weights

ROOT = Path(__file__).resolve().parents[1]
N = 32
SECTIONS = [
    # height, half width, anterior and posterior depths, sagittal center
    (.829, .133, .086, .092, -.015),
    (.882, .172, .102, .116, -.013),
    (.945, .178, .105, .113, -.010),
    (1.025, .148, .090, .086, -.007),
    (1.095, .133, .087, .080, 0),
    (1.163, .151, .099, .087, 0),
    (1.231, .167, .109, .094, 0),
    (1.304, .182, .114, .092, 0),
    (1.379, .192, .106, .089, 0),
    (1.435, .169, .081, .072, 0),
    (1.474, .092, .066, .060, .004),
    (1.505, .051, .052, .048, .006),
    (1.544, .049, .049, .046, .010),
    (1.571, .060, .063, .056, .014),
    (1.609, .072, .081, .072, .010),
    (1.657, .074, .079, .074, .007),
    (1.694, .059, .065, .060, .006),
    (1.709, .032, .038, .036, .006),
]


def make_cage():
    vertices, faces = [], []

    def vertex(x, y, z):
        vertices.append((x, y, z))
        return len(vertices) - 1

    def join(a, b):
        for j in range(len(a)):
            k = (j + 1) % len(a)
            faces.extend([(a[j], a[k], b[k]), (a[j], b[k], b[j])])

    def cap(ring, point):
        tip = vertex(*point)
        faces.extend((a, ring[(j + 1) % len(ring)], tip) for j, a in enumerate(ring))
        return tip

    body = []
    for y, width, front, back, center in SECTIONS:
        ring = []
        for j in range(N):
            angle = j * 2 * pi / N
            depth = front if sin(angle) >= 0 else back
            ring.append(vertex(width * cos(angle), y, center + depth * sin(angle)))
        body.append(ring)

    for i, (lower, upper) in enumerate(zip(body, body[1:])):
        for j in range(N):
            if 7 <= i < 9 and (j in (28,29,30,31,0,1,2,3) or 12 <= j < 20):
                continue
            k = (j + 1) % N
            faces.extend([(lower[j], lower[k], upper[k]), (lower[j], upper[k], upper[j])])

    def socket(center):
        left, right = center - 4, center + 4
        return (
            [body[7][j % N] for j in range(left, right + 1)]
            + [body[8][right % N]]
            + [body[9][j % N] for j in range(right, left - 1, -1)]
            + [body[8][left % N]]
        )

    crown = cap(body[-1], (0, 1.715, .006))
    landmarks = {
        "crown": crown, "neck-front": body[11][8], "neck-back": body[11][24],
        "neck-left": body[11][0], "neck-right": body[11][16],
        "waist-left": body[4][0], "waist-right": body[4][16],
        "hip-left": body[2][0], "hip-right": body[2][16],
    }
    for side, sign, center in (("left", 1, 0), ("right", -1, 16)):
        ring = socket(center)
        angle = 25 * pi / 180
        origin = np.array([sign * .212, 1.365, 0])
        axis = np.array([sign * sin(angle), -cos(angle), 0])
        transverse = np.array([sign * cos(angle), sin(angle), 0])
        # Map the socket perimeter monotonically onto the limb cross-section.
        bottom = [225 - j * 90 / 8 for j in range(9)]
        top = [45 - j * 90 / 8 for j in range(9)]
        phases = [sign * a * pi / 180 for a in (*bottom, 90, *top, -90)]
        landmarks[f"shoulder-{side}"] = body[9][center]
        landmarks[f"axilla-{side}"] = body[7][center]
        for travel, width, depth in (
            (.089, .057, .055), (.143, .054, .049), (.224, .046, .044),
            (.288, .039, .037), (.333, .043, .038), (.414, .034, .028),
            (.486, .025, .024), (.523, .033, .022), (.572, .027, .017),
            (.603, .016, .011),
        ):
            next_ring = [
                vertex(*(origin + travel * axis + width * cos(a) * transverse + [0, 0, depth * sin(a)]))
                for a in phases
            ]
            join(ring, next_ring)
            ring = next_ring
        cap(ring, origin + .612 * axis)

    # A shared saddle edge splits the pelvic ring into two leg boundaries.
    saddle = [body[0][8], vertex(0, .805, .037), vertex(0, .791, -.016),
              vertex(0, .807, -.068), body[0][24]]
    landmarks["crotch"] = saddle[2]
    for side, sign in (("left", 1), ("right", -1)):
        if sign == 1:
            ring = [body[0][j % N] for j in range(24, 41)] + saddle[1:-1]
        else:
            ring = body[0][8:25] + saddle[-2:0:-1]
        # Angularly uniform sections use the saddle order and a side-specific phase.
        phase = -4 * pi / 5 if sign == 1 else pi / 5
        angles = [phase + j * 2 * pi / len(ring) for j in range(len(ring))]
        for y, x, width, front, back, z in (
            (.751, .091, .082, .084, .081, -.012),
            (.657, .093, .073, .073, .070, -.014),
            (.541, .097, .059, .060, .058, -.011),
            (.463, .101, .049, .052, .051, -.004),
            (.407, .102, .050, .050, .053, -.014),
            (.340, .103, .053, .052, .062, -.025),
            (.260, .104, .045, .044, .052, -.027),
            (.165, .104, .034, .035, .037, -.024),
            (.092, .104, .033, .058, .037, -.022),
            (.047, .104, .047, .123, .041, -.021),
            (.012, .104, .045, .132, .042, -.021),
            (0, .104, .041, .126, .038, -.021),
        ):
            next_ring = [
                vertex(sign * x + width * cos(a), y, z + (front if sin(a) >= 0 else back) * sin(a))
                for a in angles
            ]
            join(ring, next_ring)
            ring = next_ring
        landmarks[f"sole-{side}"] = cap(ring, (sign * .104, 0, .019))
    return vertices, faces, landmarks, {"chest": body[6], "waist": body[4], "seat": body[2]}


def orient(vertices, faces):
    incidence = defaultdict(list)
    for i, face in enumerate(faces):
        for a, b in zip(face, (*face[1:], face[0])):
            incidence[tuple(sorted((a, b)))].append((i, a < b))
    adjacency = defaultdict(list)
    for uses in incidence.values():
        (i, left), (j, right) = uses
        adjacency[i].append((j, left == right))
        adjacency[j].append((i, left == right))
    flips = {0: False}
    pending = deque([0])
    while pending:
        i = pending.popleft()
        for j, different in adjacency[i]:
            value = flips[i] ^ different
            if j not in flips:
                flips[j] = value
                pending.append(j)
            elif flips[j] != value:
                raise ValueError("Non-orientable cage")
    ordered = np.array([face[::-1] if flips[i] else face for i, face in enumerate(faces)])
    a, b, c = np.asarray(vertices)[ordered].transpose(1, 0, 2)
    return ordered if np.sum(a * np.cross(b, c)) > 0 else ordered[:, ::-1]


def subdivide(vertices, faces, soles):
    """One Loop pass. The sole landmark and the original floor patch stay planar."""
    edges, neighbors = defaultdict(list), defaultdict(set)
    for a, b, c in faces:
        for x, y, opposite in ((a, b, c), (b, c, a), (c, a, b)):
            edges[tuple(sorted((x, y)))].append(opposite)
            neighbors[x].add(y)
            neighbors[y].add(x)
    points = vertices.copy().tolist()
    floor = set(np.flatnonzero(vertices[:, 1] == 0))
    for i, indices in sorted(neighbors.items()):
        if i in soles:
            continue
        n = len(indices)
        beta = (5 / 8 - (3 / 8 + cos(2 * pi / n) / 4) ** 2) / n
        points[i] = (1 - n * beta) * vertices[i] + beta * vertices[sorted(indices)].sum(axis=0)
        if i in floor:
            points[i][1] = 0
    midpoint = {}
    for (a, b), (c, d) in sorted(edges.items()):
        p = (3 * (vertices[a] + vertices[b]) + vertices[c] + vertices[d]) / 8
        if a in floor and b in floor:
            p[1] = 0
        midpoint[a, b] = midpoint[b, a] = len(points)
        points.append(p)
    output = []
    for a, b, c in faces:
        ab, bc, ca = midpoint[a,b], midpoint[b,c], midpoint[c,a]
        output.extend(((a, ab, ca), (ab, b, bc), (ca, bc, c), (ab, bc, ca)))
    return np.asarray(points), np.asarray(output), midpoint


def neutral():
    vertices, faces, landmarks, rings = make_cage()
    faces = orient(vertices, faces)
    vertices = np.asarray(vertices)
    # Remove cage vertices swallowed by the shoulder openings.
    used = np.unique(faces)
    remap = {old: new for new, old in enumerate(used)}
    vertices = vertices[used]
    faces = np.array([[remap[j] for j in face] for face in faces])
    landmarks = {key: remap[i] for key, i in landmarks.items()}
    rings = {key: [remap[i] for i in ring] for key, ring in rings.items()}
    for _ in range(2):
        vertices, faces, edges = subdivide(vertices, faces, {landmarks["sole-left"], landmarks["sole-right"]})
        rings = {
            key: [k for j, i in enumerate(ring) for k in (i, edges[i, ring[(j+1) % len(ring)]])]
            for key, ring in rings.items()
        }
    # Preserve metre units while setting the fixture's authored crown to exactly 1.700 m.
    vertices[:, 1] *= 1.7 / vertices[landmarks["crown"], 1]
    return vertices, faces, landmarks, rings


def write_glb(path, signed=None):
    vertices, faces, landmarks, rings = neutral()
    points = vertices.astype("<f4")
    a, b, c = points[faces].transpose(1, 0, 2)
    directions = np.cross(b - a, c - a)
    normals = np.zeros_like(points)
    for corner in faces.T:
        np.add.at(normals, corner, directions)
    normals /= np.linalg.norm(normals, axis=1)[:, None]
    indices = faces.astype("<u2")
    arrays = [points, normals, indices]
    doc = {
        "asset": {"version": "2.0", "generator": "InfiniDrip D01 neutral source v1"},
        "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"mesh": 0, "name": "D01 Neutral"}],
        "meshes": [{"primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1}, "indices": 2, "material": 0}]}],
        "materials": [{"pbrMetallicRoughness": {"baseColorFactor": [.47,.59,.61,1], "metallicFactor": 0, "roughnessFactor": .77}}],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": len(points), "type": "VEC3",
             "min": points.min(axis=0).tolist(), "max": points.max(axis=0).tolist()},
            {"bufferView": 1, "componentType": 5126, "count": len(points), "type": "VEC3"},
            {"bufferView": 2, "componentType": 5123, "count": indices.size, "type": "SCALAR"},
        ],
        "extras": {"interface": "infinidrip-mannequin-v1", "unit": "metre", "up": "+Y",
                   "front": "+Z", "anatomicalLeft": "+X", "groundY": 0, "height": 1.7,
                   "landmarks": landmarks, "rings": rings, "indexSha256": sha256(indices.tobytes()).hexdigest()},
    }
    if signed is not None:
        mesh = doc["meshes"][0]
        mesh["weights"] = weights(signed).tolist()
        mesh["extras"] = {"targetNames": list(TARGETS)}
        targets = []
        for field in shape_fields(vertices):
            for delta in (field, -field):
                i = len(arrays)
                value = delta.astype("<f4")
                arrays.append(value)
                doc["accessors"].append({
                    "bufferView": i, "componentType": 5126, "count": len(points), "type": "VEC3",
                    "min": value.min(axis=0).tolist(), "max": value.max(axis=0).tolist(),
                })
                targets.append({"POSITION": i})
        mesh["primitives"][0]["targets"] = targets
    sizes = [array.nbytes for array in arrays]
    blob = b"".join(array.tobytes() for array in arrays)
    doc["buffers"] = [{"byteLength": len(blob)}]
    doc["bufferViews"] = [{"buffer": 0, "byteOffset": sum(sizes[:i]), "byteLength": size,
                           "target": 34963 if i == 2 else 34962} for i, size in enumerate(sizes)]
    encoded = json.dumps(doc, separators=(",", ":")).encode()
    encoded += b" " * (-len(encoded) % 4)
    blob += b"\0" * (-len(blob) % 4)
    path.write_bytes(struct.pack("<4sII", b"glTF", 2, 28 + len(encoded) + len(blob))
                     + struct.pack("<I4s", len(encoded), b"JSON") + encoded
                     + struct.pack("<I4s", len(blob), b"BIN\0") + blob)
    return vertices, faces, landmarks


if __name__ == "__main__":
    write_glb(ROOT / "assets/mannequin-v1.glb")
    write_glb(ROOT / "assets/mannequin-controls-v1.glb", [0, 0, 0, 0])
