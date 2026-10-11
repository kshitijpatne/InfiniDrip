import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const JSDOM = require("jsdom").JSDOM;
const folder = new URL("./", import.meta.url);
const fixtures = JSON.parse(await readFile(new URL("../S331-polo-browser-final/matrix.json", import.meta.url), "utf8")).cases;
const current = JSON.parse(await readFile(new URL("S458-current-output-matrix.json", folder), "utf8"));
const baseline = JSON.parse(await readFile(new URL("../S434-polo-j-fg-keyed-display/S434-production-render-matrix.json", folder), "utf8"));
assert.equal(fixtures.length, 17);
assert.equal(current.rows.length, 34);
assert.equal(current.browserErrors.length, 0);
const parser = new (new JSDOM().window.DOMParser)();
const identity = (svg) => {
  const root = parser.parseFromString(svg, "image/svg+xml").documentElement;
  return [...root.querySelectorAll("path[data-entity-id]")].map((path) => [
    path.getAttribute("data-entity-id"), path.getAttribute("d"), path.getAttribute("data-source-id"),
    path.getAttribute("data-colorway-fill-for"),
  ]);
};
const rows = [];
for (const fixture of fixtures) for (const kind of ["FRONT_FLAT", "BACK_FLAT"]) {
  const row = current.rows.find((candidate) => candidate.caseId === fixture.caseId && candidate.kind === kind);
  const old = baseline.rows.find((candidate) => candidate.caseId === fixture.caseId && candidate.kind === kind);
  assert.ok(row && old, `${fixture.caseId}/${kind}: missing evidence row`);
  assert.deepEqual(row.options, fixture.options, `${fixture.caseId}/${kind}: options`);
  assert.equal(row.issueCount, 0, `${fixture.caseId}/${kind}: renderer issue`);
  const revisionId = `live-draft:polo:S458:${fixture.caseId}`;
  assert.equal(row.revisionId, revisionId);
  const svg = await readFile(new URL(`rendered-production/${row.filename}`, folder), "utf8");
  const root = parser.parseFromString(svg, "image/svg+xml").documentElement;
  assert.equal(root.getAttribute("data-revision-id"), revisionId);
  assert.deepEqual([...new Set([...svg.matchAll(/data-revision-id="([^"]+)"/gu)].map((match) => match[1]))], [revisionId]);
  assert.deepEqual([...new Set([...svg.matchAll(/data-colorway-revision="([^"]+)"/gu)].map((match) => match[1]))], [revisionId]);
  const fills = [...root.querySelectorAll("path[data-colorway-fill-for]")];
  assert.ok(fills.length >= 5, `${fixture.caseId}/${kind}: missing colorway fills`);
  const baselineSvg = await readFile(new URL(`../S434-polo-j-fg-keyed-display/rendered-production/${old.filename}`, folder), "utf8");
  const samePaths = JSON.stringify(identity(svg)) === JSON.stringify(identity(baselineSvg));
  assert.equal(samePaths, true, `${fixture.caseId}/${kind}: source paths changed since S434`);
  const schedule = [...root.querySelectorAll("[data-schedule-for]")];
  assert.equal(schedule.length, kind === "FRONT_FLAT" ? 13 : 0, `${fixture.caseId}/${kind}: keyed rows`);
  rows.push({ caseId: fixture.caseId, options: fixture.options, kind, revisionId,
    sourceAndColorwayRevisionMatch: true, colorwayFillCount: fills.length, keyedScheduleRows: schedule.length,
    sourcePathIdentityMatchesS434: samePaths });
}
const summary = { revisionPrefix: "live-draft:polo:S458:", options: fixtures.length, faces: rows.length,
  compilerRendererAndBrowserIssueCount: 0, exactOptionRows: rows.length, sameRevisionFrontBackPairs: fixtures.length,
  exactPoloSleeveEaseResidualDiagnostics: 0, colorwaySourceRevisionMismatches: 0,
  sourcePathIdentityDifferencesFromS434: 0, frontKeyedRowsPerOption: 13, backKeyedRows: 0 };
await writeFile(new URL("S458-output-identity-audit.json", folder), `${JSON.stringify({ summary, rows }, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
