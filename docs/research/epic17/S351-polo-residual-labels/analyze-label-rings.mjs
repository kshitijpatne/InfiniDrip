import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const folder = fileURLToPath(new URL(".", import.meta.url));
const matrix = JSON.parse(await readFile(join(folder, "current-source-matrix.json"), "utf8"));
const width = (text) => Math.max(2.4, text.length * 0.18);
const box = (at, text) => ({ minX: at.x - width(text) / 2, minY: at.y - 0.225,
  maxX: at.x + width(text) / 2, maxY: at.y + 0.225 });
const overlap = (a, b) => a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;
const orient = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
function crosses(a, b, c, d) {
  const abc = orient(a, b, c), abd = orient(a, b, d), cda = orient(c, d, a), cdb = orient(c, d, b);
  if (((abc > 0 && abd < 0) || (abc < 0 && abd > 0)) && ((cda > 0 && cdb < 0) || (cda < 0 && cdb > 0))) return true;
  const on = (u, v, p) => Math.min(u.x, v.x) <= p.x && p.x <= Math.max(u.x, v.x)
    && Math.min(u.y, v.y) <= p.y && p.y <= Math.max(u.y, v.y);
  return (abc === 0 && on(a, b, c)) || (abd === 0 && on(a, b, d))
    || (cda === 0 && on(c, d, a)) || (cdb === 0 && on(c, d, b));
}
function crossesBox(start, end, target) {
  if (start.x >= target.minX && start.x <= target.maxX && start.y >= target.minY && start.y <= target.maxY) return true;
  const corners = [{ x: target.minX, y: target.minY }, { x: target.maxX, y: target.minY },
    { x: target.maxX, y: target.maxY }, { x: target.minX, y: target.maxY }];
  return corners.some((point, index) => crosses(start, end, point, corners[(index + 1) % corners.length]));
}
const directions = [{ x: 1, y: -0.4 }, { x: 1, y: 0.4 }, { x: -1, y: -0.4 }, { x: -1, y: 0.4 },
  { x: 0.4, y: -1 }, { x: -0.4, y: -1 }, { x: 0.4, y: 1 }, { x: -0.4, y: 1 }];
const precedingByPom = {
  "pom:polo:sleeve-bicep-width": [
    "body-chest-finished", "body-length-hps-hem", "across-shoulder", "shoulder-seam",
    "armhole-front-back", "neck-width", "front-neck-drop", "sleeve-length-cap-hem",
  ].map((id) => `pom:polo:${id}`),
  "pom:polo:finished-collar-stand-height": [
    "body-chest-finished", "body-length-hps-hem", "across-shoulder", "shoulder-seam",
    "armhole-front-back", "neck-width", "front-neck-drop", "sleeve-length-cap-hem",
    "sleeve-bicep-width", "sleeve-hem", "finished-placket-length", "finished-placket-width", "button-spacing",
  ].map((id) => `pom:polo:${id}`),
  "pom:polo:stand-front-rise": [
    "body-chest-finished", "body-length-hps-hem", "across-shoulder", "shoulder-seam",
    "armhole-front-back", "neck-width", "front-neck-drop", "sleeve-length-cap-hem",
    "sleeve-bicep-width", "sleeve-hem", "finished-placket-length", "finished-placket-width", "button-spacing",
    "finished-pointed-collar-leaf",
  ].map((id) => `pom:polo:${id}`),
};

const rows = [];
for (const configuration of matrix.rows) {
  for (const face of configuration.faces) {
  for (const target of face.blockedPoms) {
    const pomId = target.sourceId;
    const allowedBeforeTarget = new Set(precedingByPom[pomId]);
    const constraints = face.emittedCallouts.filter((callout) => allowedBeforeTarget.has(callout.sourceId)).map((callout) => ({
      anchor: callout.anchor, labelAt: callout.labelAt, box: box(callout.labelAt, callout.text),
      text: callout.text, sourceId: callout.sourceId,
    }));
    const pomText = target.text;
    let first = null;
    for (let ring = 0; ring < 80 && !first; ring += 1) {
      const radius = 1.5 + ring * 0.75;
      for (const direction of directions) {
        const magnitude = Math.hypot(direction.x, direction.y);
        const labelAt = { x: target.anchor.x + direction.x / magnitude * radius,
          y: target.anchor.y + direction.y / magnitude * radius };
        const candidateBox = box(labelAt, pomText);
        if (constraints.some((placed) => overlap(placed.box, candidateBox)
          || crossesBox(target.anchor, labelAt, placed.box)
          || crossesBox(placed.anchor, placed.labelAt, candidateBox)
          || ((target.anchor.x !== placed.anchor.x || target.anchor.y !== placed.anchor.y)
            && crosses(target.anchor, labelAt, placed.anchor, placed.labelAt)))) continue;
        first = { radiusCm: radius, ringIndex: ring, direction, labelAt,
          box: candidateBox, text: pomText,
          constraintCount: constraints.length };
        break;
      }
    }
    rows.push({ caseId: configuration.caseId, face: face.kind, pomId,
      sourceEntityId: target.anchorSourceEntityId, sourcePoint: target.sourcePoint, anchor: target.anchor,
      currentSearchMaximumRadiusCm: 6.75, currentSearchFails: true,
      conservativeFirstFree: first });
  }
  }
}
const result = { basis: "Current S351 HEAD re-drafts all exact S331 Polo option cases; exact production label-box dimensions, direction order, overlap and leader-crossing tests; only callouts preceding each target in recipe POM order are retained as placement obstacles.",
  configurations: new Set(rows.map((row) => row.caseId)).size, anchors: rows.length,
  maximumRingRadiusTestedCm: 60.75, rows };
await writeFile(join(folder, "label-ring-expansion-analysis.json"), `${JSON.stringify(result, null, 2)}\n`);
const radii = rows.map((row) => row.conservativeFirstFree?.radiusCm).filter(Number.isFinite);
console.log(JSON.stringify({ configurations: result.configurations, anchors: rows.length,
  unresolved: rows.filter((row) => !row.conservativeFirstFree).length,
  minFirstFreeCm: Math.min(...radii), maxFirstFreeCm: Math.max(...radii),
  atCurrentLimit: rows.filter((row) => row.conservativeFirstFree?.radiusCm <= 6.75).length,
  outputs: "label-ring-expansion-analysis.json" }, null, 2));
