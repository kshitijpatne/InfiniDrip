import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "C:/G04-CLO-DXF-Exchange/S628-named-block-piece-identity-pilot/Input/woven-zero-vent-named-piece-blocks.dxf";
const root = "C:/G04-CLO-DXF-Exchange/S637-woven-circle-arc-trial";
const sourceCopyPath = `${root}/Input/woven-source-circles.dxf`;
const derivativePath = `${root}/Input/woven-four-arcs-per-button.dxf`;
const reportPath = `${root}/Evidence/derivative-report.json`;
const expectedSourceSha = "DFF3C0A680976D620510AAF502FA109021BD7B7DAE9B6F0EAAB1A794D20CDFB6";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();

const sourceBytes = await readFile(sourcePath);
assert.equal(sha(sourceBytes), expectedSourceSha, "S628 source input hash changed");
const text = sourceBytes.toString("utf8").replace(/^\uFEFF/u, "");
const newline = text.includes("\r\n") ? "\r\n" : "\n";
const lines = text.trimEnd().split(/\r?\n/u);
assert.equal(lines.length % 2, 0, "DXF source has incomplete code/value pair");
const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[2 * i].trim()), lines[2 * i + 1]]);

let section = "";
const entities = [];
for (let i = 0; i < pairs.length;) {
  if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
    assert.equal(pairs[i + 1]?.[0], 2, "SECTION missing name");
    section = pairs[i + 1][1];
  } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") {
    section = "";
  }
  if (pairs[i][0] !== 0) { i += 1; continue; }
  const start = i;
  const type = pairs[i++][1];
  while (i < pairs.length && pairs[i][0] !== 0) i += 1;
  entities.push({ section, type, pairs: pairs.slice(start, i) });
}

const circles = entities.filter(({ type, pairs: entity }) =>
  type === "CIRCLE" && entity.find(([code]) => code === 8)?.[1] === "MARK_BUTTON");
assert.equal(circles.length, 8, "expected exactly the eight S629 Woven button circles");
assert(circles.every(({ section: name }) => name === "BLOCKS"), "each target mark must stay in its source block");
const targets = new Set(circles.map(({ pairs: entity }) => entity));
const outputs = [];
for (const entity of entities) {
  if (!targets.has(entity.pairs)) { outputs.push(...entity.pairs); continue; }
  const value = (code) => entity.pairs.find(([c]) => c === code)?.[1];
  const layer = value(8);
  const cx = value(10);
  const cy = value(20);
  const cz = value(30) ?? "0";
  const radius = Number(value(40));
  assert(Number.isFinite(Number(cx)) && Number.isFinite(Number(cy)) && radius > 0, "circle center/radius invalid");
  for (let quadrant = 0; quadrant < 4; quadrant += 1) {
    const arcPairs = [
      [0, "ARC"], [8, layer], [10, cx], [20, cy], [30, cz], [40, value(40)],
      [50, String(quadrant * 90)], [51, String((quadrant + 1) * 90)],
    ];
    const numericStart = quadrant * 90 * Math.PI / 180;
    const numericEnd = (quadrant + 1) * 90 * Math.PI / 180;
    assert.equal(Math.hypot(Math.cos(numericStart), Math.sin(numericStart)), 1);
    assert.equal(Math.hypot(Math.cos(numericEnd), Math.sin(numericEnd)), 1);
    outputs.push(...arcPairs);
  }
}

const sourceUntargeted = entities.filter(({ pairs: entity }) => !targets.has(entity)).map(({ pairs: entity }) => entity).flat();
const outputEntities = [];
for (let i = 0; i < outputs.length;) {
  assert.equal(outputs[i][0], 0, "derivative entity stream lost its group-0 boundary");
  let j = i + 1;
  while (j < outputs.length && outputs[j][0] !== 0) j += 1;
  outputEntities.push(outputs.slice(i, j));
  i = j;
}
const outputUntargeted = outputEntities.filter((entity) => entity[0]?.[1] !== "ARC").flat();
assert.deepEqual(outputUntargeted, sourceUntargeted, "non-target DXF entities changed");
assert.equal(outputEntities.filter((entity) => entity[0]?.[1] === "ARC").length, 32);
assert.equal(outputEntities.filter((entity) => entity[0]?.[1] === "CIRCLE").length, 0);

await writeFile(sourceCopyPath, sourceBytes);
const derivative = `${outputs.map(([code, value]) => `${code}${newline}${value}`).join(newline)}${newline}`;
await writeFile(derivativePath, derivative, "utf8");
const sourceCopy = await readFile(sourceCopyPath);
const derivativeBytes = await readFile(derivativePath);
const report = {
  source: { path: sourcePath, sha256: sha(sourceBytes), bytes: sourceBytes.length },
  sourceCopy: { path: sourceCopyPath, sha256: sha(sourceCopy), bytes: sourceCopy.length },
  derivative: { path: derivativePath, sha256: sha(derivativeBytes), bytes: derivativeBytes.length },
  transform: { sourceCircleCount: circles.length, derivativeArcCount: 32, sourceCircleCountRemaining: 0, targetLayer: "MARK_BUTTON", arcsPerCircle: 4, angles: [[0, 90], [90, 180], [180, 270], [270, 360]], allNonTargetEntityPairsUnchanged: true },
  limits: "Mathematical locus is preserved by four same-center/radius quarter-arcs. This does not establish that the receiver preserves arcs, treats them as a single button mark, or carries semantic MARK_BUTTON identity.",
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
