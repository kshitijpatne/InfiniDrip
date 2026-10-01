import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const folder = resolve(import.meta.dirname);
const matrix = JSON.parse(await readFile(resolve(folder, "source-transform-matrix.json"), "utf8"));
const record = matrix.cases.find((entry) => entry.caseId === "polo-default");
const apply = (p, t) => {
  const a = t.rotationDegrees * Math.PI / 180;
  const x = t.mirrorX ? -p.x : p.x;
  return { x: x * Math.cos(a) - p.y * Math.sin(a) + t.offset.x,
    y: x * Math.sin(a) + p.y * Math.cos(a) + t.offset.y };
};
const reflect = (p) => ({ x: -p.x, y: p.y });
const edge = (edges, id) => edges.find((item) => item.name === id);
const edgePath = (item, t, mirrored) => {
  const q = (source) => { const placed = apply(source, t); return mirrored ? reflect(placed) : placed; };
  const n = (p) => `${p.x.toFixed(4)} ${p.y.toFixed(4)}`;
  if (item.kind === "line") return `M ${n(q(item.start))} L ${n(q(item.end))}`;
  const c = item.curve;
  return `M ${n(q(c.start))} C ${n(q(c.control1))} ${n(q(c.control2))} ${n(q(c.end))}`;
};
const bodyEdges = record.directlyEncoded.frontArmhole;
const sleeveEdges = record.directlyEncoded.sleeveEdges;
const pieces = { front: bodyEdges, back: record.directlyEncoded.backArmhole, sleeve: sleeveEdges };
const panels = [];
for (const face of record.faces) {
  const front = face.kind === "FRONT_FLAT";
  const bodyId = front ? "front" : "back";
  const capId = front ? "capLeft" : "capRight";
  const arm = front ? pieces.front : pieces.back;
  const cap = edge(pieces.sleeve, capId);
  const tBody = face.transforms.body;
  const tSleeve = face.transforms.sleeve;
  const capStart = apply(cap.curve.start, tSleeve);
  const capEnd = apply(cap.curve.end, tSleeve);
  const armStart = apply(arm.curve.start, tBody);
  const armEnd = apply(arm.curve.end, tBody);
  const shoulder = front ? capEnd : capStart;
  const underarm = front ? capStart : capEnd;
  const shoulderTarget = armStart;
  const underarmTarget = armEnd;
  const dShoulder = Math.hypot(shoulder.x - shoulderTarget.x, shoulder.y - shoulderTarget.y);
  const dUnderarm = Math.hypot(underarm.x - underarmTarget.x, underarm.y - underarmTarget.y);
  const all = [capStart, capEnd, armStart, armEnd, reflect(capStart), reflect(capEnd), reflect(armStart), reflect(armEnd)];
  const minX = Math.min(...all.map((p) => p.x)) - 5, maxX = Math.max(...all.map((p) => p.x)) + 8;
  const minY = Math.min(...all.map((p) => p.y)) - 5, maxY = Math.max(...all.map((p) => p.y)) + 5;
  const labelX = -10, labelY = minY + 3;
  const title = front ? "Polo front sleeve-cap view" : "Polo back sleeve-cap view";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="${minX} ${minY} ${maxX-minX} ${maxY-minY}"><rect x="${minX}" y="${minY}" width="${maxX-minX}" height="${maxY-minY}" fill="white"/><style>.body{fill:none;stroke:#1d4ed8;stroke-width:.12}.cap{fill:none;stroke:#ea580c;stroke-width:.12}.gap{stroke:#dc2626;stroke-width:.09;stroke-dasharray:.25 .16}.dot{fill:#dc2626}.title{font: 1.15px Arial,sans-serif;font-weight:bold;fill:#111827}.label{font:.72px Arial,sans-serif;fill:#111827}.metric{font:.85px Arial,sans-serif;fill:#b91c1c;font-weight:bold}.legend{font:.68px Arial,sans-serif;fill:#111827}</style><text class="title" x="${minX+1}" y="${minY+1.3}">${title} — current default revision</text><path class="body" d="${edgePath(arm,tBody,false)}"/><path class="body" d="${edgePath(arm,tBody,true)}"/><path class="cap" d="${edgePath(cap,tSleeve,false)}"/><path class="cap" d="${edgePath(cap,tSleeve,true)}"/><line class="gap" x1="${shoulder.x}" y1="${shoulder.y}" x2="${shoulderTarget.x}" y2="${shoulderTarget.y}"/><line class="gap" x1="${reflect(shoulder).x}" y1="${reflect(shoulder).y}" x2="${reflect(shoulderTarget).x}" y2="${reflect(shoulderTarget).y}"/><circle class="dot" cx="${shoulder.x}" cy="${shoulder.y}" r=".16"/><circle class="dot" cx="${shoulderTarget.x}" cy="${shoulderTarget.y}" r=".16"/><text class="metric" x="${labelX}" y="${labelY}">Shoulder gap ${dShoulder.toFixed(3)} cm × 2 instances</text><text class="label" x="${labelX}" y="${labelY+1.1}">${bodyId}.armhole ↔ sleeve.${capId}</text><text class="label" x="${labelX}" y="${labelY+2.0}">Underarm endpoint gap ${dUnderarm.toFixed(3)} cm</text><text class="legend" x="${labelX}" y="${labelY+3.0}">Blue: source ${bodyId}.armhole; orange: source sleeve.${capId}.</text><text class="legend" x="${labelX}" y="${labelY+3.9}">Second instance is reflected across the source center fold.</text><text class="legend" x="${labelX}" y="${labelY+4.8}">Diagnostic only: production face remains fully withheld.</text></svg>`;
  const id = front ? "front" : "back";
  await writeFile(resolve(folder, `${id}-sleeve-join.svg`), svg);
  panels.push({ id, svg: `${id}-sleeve-join.svg`, selectedCap: capId, bodyEdge: `${bodyId}.armhole`,
    mappedRuns: face.runIds, multiplicity: 2, shoulderGapCm: dShoulder, underarmGapCm: dUnderarm,
    transform: tSleeve, collarRoleRuns: face.mappedCollars });
}
await writeFile(resolve(folder, "overlay-summary.json"), `${JSON.stringify({ basis: "exact current default source pattern and S333 approved mapping",
  classification: "source edges and stitch interfaces are direct facts; two-instance reflected face view is maintainer-approved; overlays show source rigid placement only",
  panels }, null, 2)}\n`);
console.log(JSON.stringify(panels.map(({ svg, id, shoulderGapCm, underarmGapCm }) => ({ id, svg, shoulderGapCm, underarmGapCm })), null, 2));
