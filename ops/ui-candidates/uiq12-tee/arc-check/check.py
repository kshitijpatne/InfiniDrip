"""Independent conservative audit of captured binary64 sewing curves."""
from fractions import Fraction
import json
import sys

from bounded_reference import bounds

TOLERANCE = Fraction(1, 1000)
IDENTITY = ("revision", "digest", "role", "name")

def compare(reference, observation, interval):
    if observation["path_kind"] != "sewing-cubic":
        return "non-sewing-path"
    if any(reference[k] != observation[k] for k in IDENTITY) or reference["c"] != observation["c"]:
        return "sewing-edge-mismatch"
    low, high = interval
    value = Fraction(observation["engine"])
    if max(abs(value - low), abs(value - high)) <= TOLERANCE:
        return "pass"
    if value < low - TOLERANCE or value > high + TOLERANCE:
        return "length-outside-tolerance"
    return "uncertain"

def audit(reference, observation):
    # Check oriented identity before evaluating the length or its bound.
    verdict = compare(reference, observation, (Fraction(0), Fraction(0)))
    if verdict in ("non-sewing-path", "sewing-edge-mismatch"):
        return {"result": verdict}
    for depth in (5, 8, 11, 14):
        low, high = bounds(reference, depth)
        verdict = compare(reference, observation, (low, high))
        if verdict != "uncertain":
            break
    value = Fraction(observation["engine"])
    return {"result": verdict, "depth": depth, "interval_cm": [str(low), str(high)],
            "worst_error_cm": float(max(abs(value - low), abs(value - high)))}

def controls(rows):
    first = next(row for row in rows if row["reference"]["name"] == "capLeft")
    ref, obs = first["reference"], first["observation"]
    opposite = next(row["observation"] for row in rows if
                    row["case"] == first["case"] and row["reference"]["name"] == "capRight")
    interval = bounds(ref, 8)
    midpoint = sum(interval) / 2
    if compare(ref, {**obs, "engine": opposite["engine"]}, interval) != "pass":
        raise ValueError("The alternate cap scalar must pass when paired with the correct identity")
    cases = [
        ("length-bias", {**obs, "engine": Fraction(obs["engine"]) + Fraction(2, 1000)}, "length-outside-tolerance"),
        ("wrong-half", opposite, "sewing-edge-mismatch"),
        ("cut-path", {**obs, "path_kind": "cut-contour", "c": first["cut"]}, "non-sewing-path"),
        ("boundary-straddling", {**obs, "engine": midpoint + TOLERANCE}, "uncertain"),
    ]
    results = []
    for label, observation, expected in cases:
        actual = compare(ref, observation, interval)
        if actual != expected:
            raise ValueError(f"{label}: got {actual}, expected {expected}")
        results.append({"control": label, "result": actual})
    return results

rows = json.load(sys.stdin)
results = []
for row in rows:
    reference = row["reference"]
    result = audit(reference, row["observation"])
    results.append({"case": row["case"], **{key: reference[key] for key in IDENTITY}, **result})
print(json.dumps({"tolerance_cm": "0.001", "comparisons": results, "controls": controls(rows)}, indent=2))
