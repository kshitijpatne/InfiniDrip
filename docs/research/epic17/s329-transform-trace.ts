import { writeFileSync } from "node:fs";
import { TEE, FITTED } from "../../../src/drafting/recipe";
import { STANDARD_M } from "../../../src/drafting/measurements";
import { defaultGarmentOptions } from "../../../src/drafting/options";
import { assembleTechnicalFlatRoles } from "../../../src/render/technical-flat-assembly";
import { transformFlatPoint } from "../../../src/render/technical-flat-transform";

const recipes = [TEE, FITTED];
const mirror = (p: any, x: number) => ({ ...p, x: 2 * x - p.x });
const mirrorPiece = (piece: any, x: number) => ({ ...piece, edges: piece.edges.map((e: any) => e.kind === "line"
  ? { ...e, start: mirror(e.start, x), end: mirror(e.end, x) }
  : { ...e, curve: { ...e.curve, start: mirror(e.curve.start, x), control1: mirror(e.curve.control1, x), control2: mirror(e.curve.control2, x), end: mirror(e.curve.end, x) } }) });
const n = (x: number) => Number(x.toFixed(3));
const p = (x: any) => `${n(x.x)} ${n(x.y)}`;
const segment = (e: any, t: (v: any) => any, reverse = false) => {
  if (e.kind === "line") return `L ${p(t(reverse ? e.start : e.end))}`;
  const c = e.curve;
  return reverse
    ? `C ${p(t(c.control2))} ${p(t(c.control1))} ${p(t(c.start))}`
    : `C ${p(t(c.control1))} ${p(t(c.control2))} ${p(t(c.end))}`;
};
const edgePath = (e: any, t: (v: any) => any, reverse = false) => `M ${p(t(reverse ? (e.kind === "line" ? e.end : e.curve.end) : (e.kind === "line" ? e.start : e.curve.start)))} ${segment(e, t, reverse)}`;
const piecePath = (piece: any, t: (v: any) => any) => {
  const first = piece.edges[0];
  let d = `M ${p(t(first.kind === "line" ? first.start : first.curve.start))}`;
  for (const e of piece.edges) d += ` ${segment(e, t)}`;
  return `${d} Z`;
};
const linePoint = (e: any, f: number) => ({ x: e.start.x + (e.end.x - e.start.x) * f, y: e.start.y + (e.end.y - e.start.y) * f });
for (const recipe of recipes) {
  const source = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
  for (const face of ["FRONT_FLAT", "BACK_FLAT"] as const) {
    const bodyRole = face === "FRONT_FLAT" ? "front" : "back";
    const body = source.roles[bodyRole]!;
    const sleeve = source.roles.sleeve!;
    const capName = face === "FRONT_FLAT" ? "capLeft" : "capRight";
    const sideName = face === "FRONT_FLAT" ? "sideLeft" : "sideRight";
    const cap: any = sleeve.edges.find((e: any) => e.name === capName);
    const side: any = sleeve.edges.find((e: any) => e.name === sideName);
    const hem: any = sleeve.edges.find((e: any) => e.name === "hem");
    const axisX = (sleeve.edges.find((e: any) => e.name === "capLeft") as any).curve.end.x;
    const localAxis = face === "BACK_FLAT" ? axisX : undefined;
    const roles = localAxis === undefined ? source.roles : { ...source.roles, sleeve: mirrorPiece(sleeve, localAxis) };
    const stitches = source.stitches.map((stitch) => stitch.label === "Sleeve-cap ease" && face === "FRONT_FLAT"
      ? { ...stitch, b: { edges: stitch.b.edges.map((ref: any) => ref.piece === "front" && ref.edge === "armhole" ? { ...ref, reversed: true } : ref) } } : stitch);
    const assembly = assembleTechnicalFlatRoles(recipe.name, { ...source, roles, stitches }, face);
    const tr = assembly.transforms.sleeve!;
    const bodyTransform = assembly.transforms[bodyRole]!;
    const placed = (q: any) => transformFlatPoint(q, { ...tr, mirrorX: false });
    const shell = piecePath(body, (q: any) => transformFlatPoint(q, { ...bodyTransform, mirrorX: false }));
    const shellPair = `<path d="${shell}" fill="#f1f3f6" stroke="#25324a" stroke-width="0.22"/><path d="${shell}" transform="scale(-1 1)" fill="#f1f3f6" stroke="#25324a" stroke-width="0.22"/>`;
    const sourcePoint = (q: any) => localAxis === undefined ? q : mirror(q, localAxis);
    const capD = edgePath(cap, (q: any) => placed(sourcePoint(q)));
    const sideD = edgePath(side, (q: any) => placed(sourcePoint(q)), face === "FRONT_FLAT");
    const hemMidSource = linePoint(hem, 0.5);
    const hemEndSource = face === "FRONT_FLAT" ? hem.end : hem.start;
    const hemMid = placed(sourcePoint(hemMidSource));
    const hemEnd = placed(sourcePoint(hemEndSource));
    const capEndSource = face === "FRONT_FLAT" ? cap.curve.end : cap.curve.end;
    const capEnd = placed(sourcePoint(capEndSource));
    const capStartSource = cap.curve.start;
    const capStart = placed(sourcePoint(capStartSource));
    let sleeveFill: string;
    let hemVisibleD: string;
    if (face === "FRONT_FLAT") {
      hemVisibleD = `M ${p(hemMid)} L ${p(hemEnd)}`;
      sleeveFill = `${capD} L ${p(hemMid)} L ${p(hemEnd)} ${segment(side, (q: any) => placed(sourcePoint(q)), true)} Z`;
    } else {
      hemVisibleD = `M ${p(hemEnd)} L ${p(hemMid)}`;
      sleeveFill = `${capD} ${segment(side, (q: any) => placed(sourcePoint(q)))} L ${p(hemMid)} L ${p(capStart)} Z`;
    }
    const visible = `<path d="${sleeveFill}" fill="#8db5df" fill-opacity="0.42" stroke="none"/><path d="${sleeveFill}" transform="scale(-1 1)" fill="#8db5df" fill-opacity="0.42" stroke="none"/>`;
    const edges = `<path d="${capD}" fill="none" stroke="#145ca8" stroke-width="0.28"/><path d="${sideD}" fill="none" stroke="#145ca8" stroke-width="0.28"/><path d="${hemVisibleD}" fill="none" stroke="#145ca8" stroke-width="0.28"/><path d="${capD}" transform="scale(-1 1)" fill="none" stroke="#145ca8" stroke-width="0.28"/><path d="${sideD}" transform="scale(-1 1)" fill="none" stroke="#145ca8" stroke-width="0.28"/><path d="${hemVisibleD}" transform="scale(-1 1)" fill="none" stroke="#145ca8" stroke-width="0.28"/>`;
    const diagnostics = `<text x="-55" y="-9" font-family="Arial" font-size="1.6" fill="#172033">${recipe.name.toUpperCase()} ${face} — S329 source-topology overlay</text><text x="-55" y="-6.5" font-family="Arial" font-size="1.15" fill="#4b5563">Pattern revision live-draft:${recipe.name}:1:1 · exact sleeve edges and body armhole · no source geometry edits</text><text x="-55" y="61" font-family="Arial" font-size="1.2" fill="#25324a">Gray: front/back body doubled across on-fold centerline · Blue: selected sleeve contour and paired instance</text><text x="-55" y="63" font-family="Arial" font-size="1.2" fill="#25324a">Hidden crown-to-hem closure is fill-only; it is not drawn as a physical seam or partition.</text>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="-58 -14 116 78"><rect x="-58" y="-14" width="116" height="78" fill="white"/>${diagnostics}${shellPair}${visible}${edges}</svg>`;
    const base = `S329-${recipe.name}-${face.toLowerCase().replace("_", "-")}-candidate`;
    writeFileSync(new URL(`./${base}.svg`, import.meta.url), svg);
    const anchors = face === "FRONT_FLAT" ? { sleeveUnderarm: placed(sourcePoint(capStartSource)), bodyUnderarm: transformFlatPoint((body.edges.find((e: any) => e.name === "armhole") as any).curve.end, { ...bodyTransform, mirrorX: false }), sleeveCrown: placed(sourcePoint(capEndSource)), bodyShoulder: transformFlatPoint((body.edges.find((e: any) => e.name === "armhole") as any).curve.start, { ...bodyTransform, mirrorX: false }) }
      : { sleeveUnderarm: placed(sourcePoint(capEndSource)), bodyUnderarm: transformFlatPoint((body.edges.find((e: any) => e.name === "armhole") as any).curve.end, { ...bodyTransform, mirrorX: false }), sleeveCrown: placed(sourcePoint(capStartSource)), bodyShoulder: transformFlatPoint((body.edges.find((e: any) => e.name === "armhole") as any).curve.start, { ...bodyTransform, mirrorX: false }) };
    writeFileSync(new URL(`./${base}.json`, import.meta.url), JSON.stringify({ recipe: recipe.name, revision: `live-draft:${recipe.name}:1:1`, face, sourceRole: bodyRole, selectedSourceEdges: [capName, sideName, "hem[0..0.5]", "hem[0.5..1]"], sourceSymmetryAxisX: localAxis ?? null, viewOrientation: face === "FRONT_FLAT" ? "front armhole traversal reversed to align source sleeve-underarm endpoint with body armhole underarm; unmirrored source placement" : "back source role reflected about exact cap crown/sleeve centerline before placement; back armhole traversal preserved", transform: tr, assemblyIssues: assembly.issues, anchors }, null, 2));
  }
}
