"""Neutral geometric witnesses expressed in metres, independent of generator indices."""
import numpy as np

# Rounded neutral fixture positions in millimetres. Different roles are separated
# by centimetres. Individual witness allowance is 2 mm, bilaterally 2 mm.
WITNESSES_MM = {
    "crown": (0,1700,6), "crotch": (0,775,-15),
    "neck-front": (1,1495,60), "neck-back": (-1,1495,-43),
    "neck-left": (57,1495,6), "neck-right": (-57,1495,7),
    "shoulder-left": (177,1410,1), "shoulder-right": (-177,1410,1),
    "axilla-left": (181,1276,0), "axilla-right": (-181,1276,1),
    "waist-left": (137,1086,-1), "waist-right": (-137,1086,-1),
    "hip-left": (171,940,-11), "hip-right": (-171,940,-10),
    "sole-left": (104,0,19), "sole-right": (-104,0,19),
}
SECTIONS_MM = {"chest": (1222,332,200), "waist": (1086,275,170), "seat": (940,343,210)}


def verify(meta, vertices):
    landmarks, rings = meta["landmarks"], meta["rings"]
    if landmarks.keys() != WITNESSES_MM.keys() or rings.keys() != SECTIONS_MM.keys():
        raise ValueError("named geometry inventory")
    for part in ("neck", "shoulder", "axilla", "waist", "hip", "sole"):
        left = vertices[landmarks[part+"-left"]]
        right = vertices[landmarks[part+"-right"]] * [-1,1,1]
        if np.linalg.norm(left-right) > .002:
            raise ValueError("bilateral " + part)
    for role, point in WITNESSES_MM.items():
        if np.linalg.norm(vertices[landmarks[role]] * 1000 - point) > 2:
            raise ValueError("landmark " + role)
    for role, (height,width,depth) in SECTIONS_MM.items():
        r = vertices[rings[role]] * 1000
        section_width, _, section_depth = np.ptp(r,axis=0)
        signed_xz_area = np.sum(r[:,0] * np.roll(r[:,2],-1) - r[:,2] * np.roll(r[:,0],-1))/2
        if (np.max(np.abs(r[:,1]-height)) > 1 or np.ptp(r[:,1]) > .01
                or abs(section_width-width) > 2 or abs(section_depth-depth) > 2
                or signed_xz_area <= 0 or r[0,0] < section_width/2-1):
            raise ValueError("section " + role)
