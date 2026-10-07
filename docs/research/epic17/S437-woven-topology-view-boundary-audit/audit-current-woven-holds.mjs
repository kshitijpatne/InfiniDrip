import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");
const root = import.meta.dirname;
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const revision = "live-draft:woven-shirt:14:14";
const production = await readJson(join(root, "..", "S406-woven-approved-view-conventions", "production-replay", "matrix.json"));
const frontTrace = await readJson(join(root, "..", "S417-woven-front-post-clip-intersection-audit", "woven-collar-stack-crossings.json"));
const backTrace = await readJson(join(root, "..", "S373-woven-sleeve-crossing", "current-sleeve-crossing-trace.json"));
const source = await readFile(join(root, "..", "..", "..", "..", "src", "drafting", "shirt.ts"), "utf8");
const projection = await readFile(join(root, "..", "..", "..", "..", "src", "render", "technical-flat-projection.ts"), "utf8");

assert.equal(production.summary.sourceRevision, revision);
assert.equal(production.summary.configurations, 28);
assert.equal(production.summary.faceRequests, 56);
assert.equal(production.summary.frontEmitted, 28);
assert.equal(production.summary.backEmitted, 28);
assert.equal(production.summary.compileIssues, 0);
assert.equal(production.summary.rendererIssues, 0);
assert.equal(production.summary.browserErrors, 0);
assert.equal(production.summary.all56WovenViewsHeldPendingIntegratedGate, true);
assert.equal(frontTrace.sourceRevision, revision);
assert.equal(frontTrace.configurations, 28);
assert.equal(frontTrace.rows.length, 28);
assert.equal(backTrace.revisionId, revision);
assert.equal(backTrace.configurations, 28);
assert.equal(backTrace.records.length, 28);

const elementTag = (svg, selector) => {
  const document = new JSDOM(svg, { contentType: "image/svg+xml" }).window.document;
  return document.querySelector(selector);
};
const backs = [];
for (const row of production.cases) {
  const faces = new Map(row.faces.map((face) => [face.kind, face]));
  const front = faces.get("FRONT_FLAT");
  const back = faces.get("BACK_FLAT");
  assert.ok(front && back, `${row.caseId}: both faces emitted`);
  assert.equal(front.revisionId, revision);
  assert.equal(back.revisionId, revision);
  const frontRow = frontTrace.rows.find((entry) => entry.caseId === row.caseId);
  const backRow = backTrace.records.find((entry) => entry.caseId === row.caseId);
  assert.ok(frontRow && backRow, `${row.caseId}: exact front/back traces present`);

  const frontDocument = new JSDOM(front.svg, { contentType: "image/svg+xml" }).window.document;
  const frontPaths = [...frontDocument.querySelectorAll("path[data-entity-id]")];
  const frontEntities = frontPaths.map((path) => path.getAttribute("data-entity-id"));
  for (const required of [
    "flat:woven-shirt:FRONT_FLAT:view-seam:front:neckline",
    "flat:woven-shirt:FRONT_FLAT:component:upperCollar:outline",
    "flat:woven-shirt:FRONT_FLAT:component:underCollar:outline",
  ]) assert.ok(frontEntities.some((id) => id === required || id?.startsWith(`${required}:`)), `${row.caseId}: missing ${required}`);
  const collisionPairs = frontRow.crossings.filter((crossing) =>
    crossing.pair === "front <> upperCollar" || crossing.pair === "front <> underCollar");
  assert.equal(collisionPairs.length, 2, `${row.caseId}: upper and under collar comparisons retained`);
  const contacts = collisionPairs.map((crossing) => crossing.points.filter((point) =>
    Math.abs(point.x) < 2 && point.y > 7 && point.y < 9));
  assert.deepEqual(contacts.map((points) => points.length), [2, 2], `${row.caseId}: mirrored neckline contact in each collar contour`);
  assert.ok(Math.abs(contacts[0][0].x + contacts[0][1].x) < 1e-8);
  assert.ok(Math.abs(contacts[0][0].y - contacts[0][1].y) < 1e-8);

  const backDocument = new JSDOM(back.svg, { contentType: "image/svg+xml" }).window.document;
  const sleevePaths = [...backDocument.querySelectorAll('path[data-source-id="pattern:woven-shirt:role:sleeve"][data-entity-id]')];
  assert.equal(sleevePaths.length, 2, `${row.caseId}: two sleeve instances`);
  assert.deepEqual(sleevePaths.map((path) => path.getAttribute("d")), backRow.instances.map((instance) => instance.pathData));
  assert.ok(sleevePaths.every((path) => path.getAttribute("data-layer") === "GARMENT_SILHOUETTE"));
  assert.equal(backRow.crossing.sourceEdges.join("|"),
    "pattern:woven-shirt:role:sleeve:edge:hem|pattern:woven-shirt:role:sleeve:edge:hem");
  assert.equal(backRow.crossing.matchesS365, true);
  backs.push({ caseId: row.caseId, options: row.options, frontContacts: 2,
    frontContact: contacts[0].map(({ x, y }) => ({ x, y })),
    backCrossing: { x: backRow.crossing.x, y: backRow.crossing.y,
      sourceEdges: backRow.crossing.sourceEdges, instanceIds: backRow.instances.map((instance) => instance.entityId),
      layers: backRow.instances.map((instance) => instance.layer),
      completeHemContinuesIntoBand: backRow.placement.sourceStitches.some((stitch) =>
        stitch.label === "Folded sleeve band ↔ sleeve hem"
        && stitch.a.some((edge) => edge.piece === "sleeveBand" && edge.edge === "top")
        && stitch.b.some((edge) => edge.piece === "sleeve" && edge.edge === "hem")) },
  });
}

assert.match(source, /name: "hem", start: rightHem, end: leftHem/u);
assert.match(source, /label: "Folded sleeve band ↔ sleeve hem"[\s\S]*?edgeRef\("sleeveBand", "top"\)[\s\S]*?edgeRef\("sleeve", "hem"\)/u);
assert.match(source, /label: "Outer stand ↔ woven neckline"[\s\S]*?edgeRef\("outerStand", "neckline"\)[\s\S]*?edgeRef\("front", "neckline"\)/u);
assert.match(projection, /decisionId: "G04-S342-WOVEN-COLLAR-BASE-SEAM"/u);
assert.match(projection, /visibleEdgeId: "neckline"/u);

const result = {
  sourceRevision: revision,
  exactProductionReplay: { configurations: production.cases.length, faces: production.summary.faceRequests,
    emitted: production.summary.frontEmitted + production.summary.backEmitted,
    compileIssues: production.summary.compileIssues, rendererIssues: production.summary.rendererIssues,
    browserErrors: production.summary.browserErrors },
  frontHold: { configurations: frontTrace.rows.length, contactsPerConfiguration: 2,
    distinctContactBoundsCm: { absX: [Math.min(...backs.map((item) => Math.abs(item.frontContact[0].x))),
      Math.max(...backs.map((item) => Math.abs(item.frontContact[0].x)))],
      y: [Math.min(...backs.map((item) => item.frontContact[0].y)), Math.max(...backs.map((item) => item.frontContact[0].y))] },
    intersectionPairs: "front:neckline against upperCollar:outline and underCollar:outline; source body-to-collar contour crossing is not a direct body-to-collar stitch" },
  backHold: { configurations: backTrace.records.length, crossingsPerConfiguration: 1,
    distinctCrossingYcm: [...new Set(backs.map((item) => item.backCrossing.y.toFixed(9)))],
    sourceInstancesPerFace: 2, completeSourceSleeveHems: true, "sleeveToBandStitchEncoded": true,
    "sleeveToSleeveStitchEncoded": false, layerOrderEncoded: false },
  statuses: { all56WovenHeld: true, all34PoloHeld: true,
    currentIntegratedTally: "56 accepted / 90 held across 73 configurations / 146 faces" },
  rows: backs,
};
assert.ok(backs.every((item) => item.backCrossing.completeHemContinuesIntoBand));
await writeFile(join(root, "S437-woven-current-hold-trace.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ ...result, rows: `${backs.length} option rows saved` }, null, 2));
