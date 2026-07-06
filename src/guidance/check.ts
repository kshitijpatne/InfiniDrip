// The production-readiness checker — guidance grown up.
//
// Each guidance note answers one tape-measure question; the checker rolls those
// same facts into a single "can this be made?" verdict. A CheckResult is one
// pass/fail fact with a plain-English detail; a Report is all of them plus the
// overall verdict (every check must pass).
//
// This file is the *engine*: garment-agnostic primitives. Which edges pair up
// and what the thresholds are is the garment's business (see tshirt-check.ts).
// It verifies SEWABILITY (geometry), not fit — a muslin still decides fit — and
// it treats intentional ease as normal, not an error.

import { Point } from "../geometry";

export interface CheckResult {
  readonly name: string;
  readonly ok: boolean;
  readonly detail: string;
}

export interface Report {
  readonly ok: boolean; // true only if every check passes
  readonly checks: readonly CheckResult[];
}

/** Two seam edges that sew together must be the same length (within tol cm). */
export function matchLengths(name: string, aLen: number, bLen: number, tol = 0.1): CheckResult {
  const diff = Math.abs(aLen - bLen);
  return {
    name,
    ok: diff <= tol,
    detail:
      diff <= tol
        ? `lengths agree (${aLen.toFixed(1)} vs ${bLen.toFixed(1)} cm)`
        : `off by ${diff.toFixed(1)} cm (${aLen.toFixed(1)} vs ${bLen.toFixed(1)} cm)`,
  };
}

/** A measured value that must sit inside an allowed band (e.g. sleeve-cap ease). */
export function inBand(
  name: string,
  value: number,
  lo: number,
  hi: number,
  unit = "cm"
): CheckResult {
  const ok = value >= lo && value <= hi;
  return {
    name,
    ok,
    detail: `${value.toFixed(1)} ${unit} (${ok ? "within" : "outside"} ${lo}–${hi})`,
  };
}

/** The interior angle (degrees) at `corner`, between the edges to `a` and `b`. */
export function cornerAngle(a: Point, corner: Point, b: Point): number {
  const ux = a.x - corner.x;
  const uy = a.y - corner.y;
  const vx = b.x - corner.x;
  const vy = b.y - corner.y;
  const mag = Math.hypot(ux, uy) * Math.hypot(vx, vy);
  return (Math.acos((ux * vx + uy * vy) / mag) * 180) / Math.PI;
}

/** Two edges meeting at `corner` should be square (90° ± tolDeg) — e.g. at a fold. */
export function squareCorner(
  name: string,
  a: Point,
  corner: Point,
  b: Point,
  tolDeg = 2
): CheckResult {
  const angle = cornerAngle(a, corner, b);
  return { name, ok: Math.abs(angle - 90) <= tolDeg, detail: `${angle.toFixed(1)}° at the fold` };
}

/** A run of values (across sizes) that must strictly grow — no size crossing. */
export function strictlyIncreasing(name: string, values: readonly number[]): CheckResult {
  let ok = true;
  for (let i = 1; i < values.length; i++) if (values[i] <= values[i - 1]) ok = false;
  return {
    name,
    ok,
    detail: ok ? `${values.length} sizes grow in order` : `a size does not grow over the one below`,
  };
}

/** A named yes/no fact (e.g. "notches declared") folded into the report. */
export function present(name: string, ok: boolean, detail: string): CheckResult {
  return { name, ok, detail };
}

/** Fold a list of checks into one verdict: passes only if all of them pass. */
export function buildReport(checks: readonly CheckResult[]): Report {
  return { ok: checks.every((c) => c.ok), checks };
}
