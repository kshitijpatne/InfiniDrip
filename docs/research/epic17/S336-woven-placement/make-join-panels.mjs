import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../../..");
const matrix = JSON.parse(await readFile(resolve(root, "docs/research/epic17/S336-woven-placement/source-assembly-matrix.json"), "utf8"));
const record = matrix.records.find((entry) => entry.caseId === "woven-shirt-default");
const transforms = record.transforms.candidate;
const d = record.sourceEdges;
const p = (q, transform) => {
  const a = transform.rotationDegrees * Math.PI / 180;
  const x = transform.mirrorX ? -q.x : q.x;
  return { x: x * Math.cos(a) - q.y * Math.sin(a) + transform.offset.x,
    y: x * Math.sin(a) + q.y * Math.cos(a) + transform.offset.y };
};
const line = (a, b) => `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
const edgePath = (edge) => edge.kind === "line"
  ? line(edge.start, edge.end)
  : `M ${edge.curve.start.x} ${edge.curve.start.y} C ${edge.curve.control1.x} ${edge.curve.control1.y} ${edge.curve.control2.x} ${edge.curve.control2.y} ${edge.curve.end.x} ${edge.curve.end.y}`;
const matrixAttr = (t) => {
  const a = t.rotationDegrees * Math.PI / 180;
  const s = t.mirrorX ? -1 : 1;
  return `matrix(${Math.cos(a) * s} ${Math.sin(a) * s} ${-Math.sin(a)} ${Math.cos(a)} ${t.offset.x} ${t.offset.y})`;
};
const actualEdge = (roleId, edgeId, transformId = roleId, face) => ({
  roleId, edgeId, transformId, transform: transforms[face][transformId], geometry: d[roleId][edgeId],
});
const edgeEnds = (item) => item.geometry.kind === "line"
  ? [p(item.geometry.start, item.transform), p(item.geometry.end, item.transform)]
  : [p(item.geometry.curve.start, item.transform), p(item.geometry.curve.end, item.transform)];
const segment = (geometry, from, to) => ({ kind: "line", start: {
  x: geometry.start.x + (geometry.end.x - geometry.start.x) * from,
  y: geometry.start.y + (geometry.end.y - geometry.start.y) * from,
}, end: {
  x: geometry.start.x + (geometry.end.x - geometry.start.x) * to,
  y: geometry.start.y + (geometry.end.y - geometry.start.y) * to,
} });
const frontShare = record.directlyEncoded.frontNecklineLengthCm
  / (record.directlyEncoded.frontNecklineLengthCm + record.directlyEncoded.backNecklineLengthCm);
const panels = [
  { id: "front-sleeve", title: "Front sleeve-cap join (default revision)", face: "front",
    edges: [actualEdge("front", "armhole", "front", "front"), actualEdge("sleeve", "capLeft", "sleeve", "front")],
    gaps: [["sleeve", "capLeft", "start", "front", "armhole", "end", "underarm"],
      ["sleeve", "capLeft", "end", "front", "armhole", "start", "cap crown / shoulder"]] },
  { id: "back-sleeve", title: "Back sleeve-cap join across yoke (default revision)", face: "back",
    edges: [actualEdge("yoke", "armholeUpper", "yoke", "back"), actualEdge("back", "armholeLower", "back", "back"),
      actualEdge("sleeve", "capRight", "sleeve", "back")],
    gaps: [["sleeve", "capRight", "start", "yoke", "armholeUpper", "start", "cap crown / yoke shoulder"],
      ["sleeve", "capRight", "end", "back", "armholeLower", "end", "underarm"]] },
  { id: "front-collar", title: "Front outer stand to front neckline (default revision)", face: "front",
    edges: [actualEdge("front", "neckline", "front", "front"),
      { ...actualEdge("outerStand", "neckline", "outerStand", "front"), geometry: segment(d.outerStand.neckline, 0, frontShare) }],
    gaps: [["outerStand", "neckline", "start", "front", "neckline", "start", "center-front join"],
      ["outerStand", "neckline", "station", "front", "neckline", "end", "shoulder station"]] },
  { id: "back-collar", title: "Reversed back outer stand to yoke neckline (default revision)", face: "back",
    edges: [actualEdge("yoke", "neckline", "yoke", "back"),
      { ...actualEdge("outerStand", "neckline", "outerStand", "back"), geometry: segment(d.outerStand.neckline, frontShare, 1) }],
    gaps: [["outerStand", "neckline", "station", "yoke", "neckline", "end", "shoulder station"],
      ["outerStand", "neckline", "end", "yoke", "neckline", "start", "center-back join"]] },
];
function pointAt(item, selector) {
  if (selector === "station") {
    const fraction = item.edgeId === "neckline" && item.roleId === "outerStand"
      ? frontShare : 1;
    const g = d.outerStand.neckline;
    return p({ x: g.start.x + (g.end.x - g.start.x) * fraction, y: g.start.y + (g.end.y - g.start.y) * fraction }, item.transform);
  }
  const g = item.geometry;
  const q = g.kind === "line" ? g[selector] : g.curve[selector];
  return p(q, item.transform);
}
function svgFor(panel) {
  const bounds = [];
  const drawn = panel.edges.map((item, index) => {
    const t = item.transform;
    const geometry = item.geometry;
    const local = geometry.kind === "line" ? [geometry.start, geometry.end]
      : [geometry.curve.start, geometry.curve.control1, geometry.curve.control2, geometry.curve.end];
    bounds.push(...local.map((q) => p(q, t)));
    const className = item.roleId === "sleeve" ? "sleeve" : item.roleId === "outerStand" ? "stand" : "body";
    return `<path class="${className}" d="${edgePath(geometry)}" transform="${matrixAttr(t)}"/>`;
  }).join("");
  const gaps = panel.gaps.map(([ra, ea, enda, rb, eb, endb, label], index) => {
    const itemA = panel.edges.find((item) => item.roleId === ra && item.edgeId === ea);
    const itemB = panel.edges.find((item) => item.roleId === rb && item.edgeId === eb);
    if (!itemA || !itemB) return "";
    const a = pointAt(itemA, enda);
    const b = pointAt(itemB, endb);
    const gap = Math.hypot(a.x - b.x, a.y - b.y);
    const lx = Math.max(a.x, b.x) + 1.2;
    const ly = (a.y + b.y) / 2 + (index === 0 ? -0.7 : 0.7);
    bounds.push(a, b);
    return `<line class="gap" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/><circle class="dot" cx="${a.x}" cy="${a.y}" r=".18"/><circle class="dot" cx="${b.x}" cy="${b.y}" r=".18"/><text class="gapLabel" x="${lx}" y="${ly}">${label}: ${gap.toFixed(3)} cm</text>`;
  }).join("");
  const minX = Math.min(...bounds.map((q) => q.x)) - 2;
  const maxX = Math.max(...bounds.map((q) => q.x)) + 17;
  const minY = Math.min(...bounds.map((q) => q.y)) - 3;
  const maxY = Math.max(...bounds.map((q) => q.y)) + 3;
  const style = `<style>.body{fill:none;stroke:#1d4ed8;stroke-width:.11}.sleeve{fill:none;stroke:#ea580c;stroke-width:.11}.stand{fill:none;stroke:#7c3aed;stroke-width:.11}.gap{stroke:#dc2626;stroke-width:.08;stroke-dasharray:.2 .12}.dot{fill:#dc2626}.gapLabel{font:.32px sans-serif;fill:#b91c1c;font-weight:bold}.title{font:.52px sans-serif;fill:#111827;font-weight:bold}</style>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="700" viewBox="${minX} ${minY - 1.5} ${maxX - minX} ${maxY - minY + 1.5}">${style}<text class="title" x="${minX + .5}" y="${minY - .3}">${panel.title} — source edges after rigid placement</text>${drawn}${gaps}</svg>`;
}
const folder = resolve(root, "docs/research/epic17/S336-woven-placement");
await mkdir(folder, { recursive: true });
for (const panel of panels) await writeFile(resolve(folder, `${panel.id}.svg`), svgFor(panel));
console.log(JSON.stringify({ caseId: record.caseId, panels: panels.map((panel) => `${panel.id}.svg`),
  classification: "directly authored edges and stitches; current same-revision source coordinates; S321-approved view mappings" }, null, 2));
