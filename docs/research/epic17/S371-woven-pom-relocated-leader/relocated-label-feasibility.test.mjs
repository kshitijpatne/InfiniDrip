import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const folder = dirname(fileURLToPath(import.meta.url));
const report = JSON.parse(await readFile(join(folder, "relocated-label-feasibility.json"), "utf8"));

test("S371 replay covers every current Woven option at one exact revision", () => {
  assert.equal(report.configurations, 28);
  assert.equal(report.cases.length, 28);
  assert.equal(new Set(report.cases.map((item) => item.caseId)).size, 28);
  assert.ok(report.cases.every((item) => item.revisionId === report.revisionId));
  assert.ok(report.cases.every((item) => item.backProductionRender.revisionId === report.revisionId));
  assert.ok(report.cases.every((item) => item.sourceEntityId === "pattern:woven-shirt:role:buttonPlacket:edge:top"));
  assert.ok(report.cases.every((item) => item.targetId === "flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline"));
});

test("S371 retains current fail-closed production output and finds no safe relocated label route", () => {
  assert.equal(report.browserErrors.length, 0);
  assert.equal(report.cases.filter((item) => item.candidateCount > 0).length, 0);
  assert.ok(report.cases.every((item) => item.rejectionCounts.routeTests > 0));
  assert.equal(report.cases.filter((item) => item.frontProductionRender.emitted).length, 3);
  assert.equal(report.cases.filter((item) => item.frontProductionRender.issueCodes.includes("TEXT_COLLISION")).length, 25);
  assert.equal(report.cases.filter((item) => item.backProductionRender.emitted).length, 28);
  assert.ok(report.fontMetrics.widthCm > 5 && report.fontMetrics.widthCm < 6);
});
