"""Fixed orthographic captures of decoded GLB triangles using a CPU depth buffer."""
from math import cos, radians, sin

import numpy as np
from PIL import Image

from readback import PATH, ROOT, read

SIZE = 768
PIXELS_PER_METRE = 395


def capture(vertices, normals, faces, azimuth):
    angle = radians(azimuth)
    right = np.array([cos(angle), 0, -sin(angle)])
    toward = np.array([sin(angle), 0, cos(angle)])
    pixels = np.column_stack((SIZE/2 + vertices @ right * PIXELS_PER_METRE,
                              SIZE/2 - (vertices[:,1] - .85) * PIXELS_PER_METRE))
    depths = vertices @ toward
    light = right * -.39 + [0, .65, 0] + toward * .65
    shades = .37 + .63 * np.clip(normals @ light, 0, 1)
    image = np.full((SIZE, SIZE, 3), [238, 241, 240], dtype=np.uint8)
    depth_buffer = np.full((SIZE, SIZE), -np.inf)
    floor = round(SIZE/2 + .85 * PIXELS_PER_METRE)
    image[floor:floor+1, 110:-110] = [168, 181, 182]
    for face in faces:
        a,b,c = pixels[face]
        left, top = np.maximum(np.floor(np.min([a,b,c], axis=0)).astype(int), 0)
        right_edge, bottom = np.minimum(np.ceil(np.max([a,b,c], axis=0)).astype(int)+1, SIZE)
        y,x = np.mgrid[top:bottom, left:right_edge] + .5
        ab, ac = b-a, c-a
        det = ab[0]*ac[1] - ab[1]*ac[0]
        if det >= -1e-9:
            continue
        u = ((x-a[0])*ac[1] - (y-a[1])*ac[0])/det
        v = (ab[0]*(y-a[1]) - ab[1]*(x-a[0]))/det
        w = 1-u-v
        z0,z1,z2 = depths[face]
        z = w*z0+u*z1+v*z2
        tile = np.s_[top:bottom,left:right_edge]
        selected = (u>=0) & (v>=0) & (w>=0) & (z>depth_buffer[tile])
        depth_buffer[tile][selected] = z[selected]
        s0,s1,s2 = shades[face]
        brightness = w*s0+u*s1+v*s2
        image[tile][selected] = brightness[selected, None] * [133, 169, 173]
    return Image.fromarray(image)


if __name__ == "__main__":
    _, vertices, normals, faces = read(PATH.read_bytes())
    for label, angle in (("front", 0), ("side", 90), ("back", 180), ("oblique", 38)):
        capture(vertices, normals, faces, angle).save(ROOT / f"evidence/{label}.png")
