import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const { JSDOM } = createRequire(import.meta.url)("jsdom");
const folder = fileURLToPath(new URL("./", import.meta.url));
const rendered = JSON.parse(await readFile(new URL("./production-rendered/matrix.json", import.meta.url), "utf8"));
const prior = JSON.parse(await readFile(new URL("../S370-woven-band-detail-feasibility/detached-band-layout-matrix.json", import.meta.url), "utf8"));

function box(d) {
  const values = (d.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/gu) ?? []).map(Number);
  const points = [];
  for (let i = 0; i + 1 < values.length; i += 2) points.push({ x: values[i], y: values[i + 1] });
  return { minX: Math.min(...points.map((p) => p.x)), maxX: Math.max(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)), maxY: Math.max(...points.map((p) => p.y)) };
}

const rows = await Promise.all(rendered.cases.map(async (item) => {
  const face = item.faces.find((candidate) => candidate.kind === "BACK_FLAT");
  const doc = new JSDOM(face.svg, { contentType: "image/svg+xml" }).window.document;
  const old = prior.rows.find((candidate) => candidate.caseId === item.caseId)?.detailPlacementCm;
  assert.ok(old, `${item.caseId}: missing S370 placement`);
  const paths = [...doc.querySelectorAll('path[data-entity-id*="sleeveBand:outline:detached-detail"]')];
  assert.equal(paths.length, 2, `${item.caseId}: expected exactly two rendered band outlines`);
  const actual = paths.map((path) => ({ id: path.getAttribute("data-entity-id"), ...box(path.getAttribute("d")) }));
  const left = actual.find((entry) => entry.id.endsWith(":left"));
  const right = actual.find((entry) => entry.id.endsWith(":right"));
  assert.ok(left && right, `${item.caseId}: missing left/right source instances`);
  const centerX = (entry) => (entry.minX + entry.maxX) / 2;
  const priorLeft = (old.leftBandBox.minX + old.leftBandBox.maxX) / 2;
  const priorRight = (old.rightBandBox.minX + old.rightBandBox.maxX) / 2;
  const svgViewBox = face.svg.match(/viewBox="([^"]+)"/u)?.[1].split(/\s+/u).map(Number);
  const baselineSvg = await readFile(new URL(`../S401-woven-paired-live-output-review/rendered/${item.caseId}-back_flat-current.svg`, import.meta.url), "utf8");
  const baselineViewBox = baselineSvg.match(/viewBox="([^"]+)"/u)?.[1].split(/\s+/u).map(Number);
  assert.equal(svgViewBox?.length, 4);
  assert.equal(baselineViewBox?.length, 4);
  assert.equal(face.revisionId, "live-draft:woven-shirt:14:14");
  return { caseId: item.caseId, revisionId: face.revisionId,
    leftOutwardMovementCm: Math.abs(centerX(left)) - Math.abs(priorLeft),
    rightOutwardMovementCm: Math.abs(centerX(right)) - Math.abs(priorRight),
    leftBox: { minX: left.minX, maxX: left.maxX, minY: left.minY, maxY: left.maxY },
    rightBox: { minX: right.minX, maxX: right.maxX, minY: right.minY, maxY: right.maxY },
    svgViewBoxWidthCm: svgViewBox[2],
    baselineS401ViewBoxWidthCm: baselineViewBox[2],
    viewBoxIncreaseOverS401Cm: svgViewBox[2] - baselineViewBox[2],
  };
}));
const summary = { revisionId: "live-draft:woven-shirt:14:14", configurations: rows.length,
  minimumLeftOutwardMovementCm: Math.min(...rows.map((r) => r.leftOutwardMovementCm)),
  maximumLeftOutwardMovementCm: Math.max(...rows.map((r) => r.leftOutwardMovementCm)),
  minimumRightOutwardMovementCm: Math.min(...rows.map((r) => r.rightOutwardMovementCm)),
  maximumRightOutwardMovementCm: Math.max(...rows.map((r) => r.rightOutwardMovementCm)),
  minimumViewBoxWidthCm: Math.min(...rows.map((r) => r.svgViewBoxWidthCm)),
  maximumViewBoxWidthCm: Math.max(...rows.map((r) => r.svgViewBoxWidthCm)),
  minimumViewBoxIncreaseOverS401Cm: Math.min(...rows.map((r) => r.viewBoxIncreaseOverS401Cm)),
  maximumViewBoxIncreaseOverS401Cm: Math.max(...rows.map((r) => r.viewBoxIncreaseOverS401Cm)),
  rows };
assert.equal(rows.length, 28);
await writeFile(join(folder, "back-band-layout-audit.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ ...summary, rows: undefined }, null, 2));
