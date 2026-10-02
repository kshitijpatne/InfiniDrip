import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const evidence = JSON.parse(await readFile(new URL("./outward-normal-candidate-matrix.json", import.meta.url), "utf8"));

test("S366 outward-normal proposal stays held when band self-crossings remain", () => {
  assert.equal(evidence.disposition.startsWith("RETAIN_HOLD"), true);
  assert.equal(evidence.configurations, 28);
  assert.equal(evidence.faces, 56);
  assert.equal(evidence.frontRequests, 28);
  assert.equal(evidence.currentFrontEmitted, 3);
  assert.equal(evidence.allSameRevision, true);
  assert.ok(evidence.reports.every((row) => row.revisionId === "live-draft:woven-shirt:14:14"));
  assert.ok(evidence.reports.every((row) => row.intersections.bandSelf >= 20));
  assert.ok(evidence.reports.every((row) => row.instanceProjection.right.normalSign === 1 && row.instanceProjection.left.normalSign === -1));
  assert.ok(evidence.reports.every((row) => row.intersections.bandPair === 0));
  assert.ok(evidence.reports.every((row) => row.intersections.sleevePair === 0));
  assert.ok(evidence.reports.every((row) => row.intersections.sleeveToOppositeBand === 0));
  assert.ok(evidence.outputOptions.length === 5 && evidence.outputOptions.every((row) => row.pageErrors === 0));
  assert.ok(evidence.reports.every((row) => row.joinResidualCm.mappedJoinMethod.includes("not an independent measurement")));
});
