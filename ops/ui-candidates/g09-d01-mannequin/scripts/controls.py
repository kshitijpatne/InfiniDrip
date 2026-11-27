"""Bounded neutral-pose shape fields in metres."""
import numpy as np

CONTROLS = ("torsoLength", "shoulderBreadth", "chestGirth", "seatGirth")
TARGETS = tuple(name + suffix for name in CONTROLS for suffix in ("+", "-"))


def weights(values):
    signed = np.asarray(values, dtype=float)
    if signed.shape != (4,) or not np.isfinite(signed).all() or np.any(abs(signed) > 1):
        raise ValueError("four finite shape controls in [-1, 1] required")
    return np.maximum(np.column_stack((signed, -signed)), 0).ravel()


def smooth(start, end, value):
    t = np.clip((value - start) / (end - start), 0, 1)
    return t*t*(3-2*t)


def shape_fields(vertices):
    x, y, z = vertices.T
    zero = np.zeros_like(x)
    outer_arm = smooth(.18, .31, abs(x)) * smooth(.70, .80, y)
    lift = np.maximum(smooth(1.01, 1.38, y), outer_arm)
    upper = smooth(1.16, 1.39, y) * (1-smooth(1.43, 1.52, y))
    breadth = np.tanh(x/.073) * np.maximum(upper, outer_arm)

    def girth(height, z_center, span):
        direction = np.column_stack((x, zero, z-z_center))
        radius = np.linalg.norm(direction, axis=1)
        direction /= np.maximum(radius, .03)[:,None]
        envelope = (1-smooth(0, span, abs(y-height))) * (1-smooth(.175, .236, abs(x)))
        return .012 * direction * envelope[:,None]

    return np.stack((
        np.column_stack((zero, .030*lift, zero)),
        np.column_stack((.015*breadth, zero, zero)),
        girth(1.22243, .007, .125),
        girth(.94046, -.013, .12),
    ))
