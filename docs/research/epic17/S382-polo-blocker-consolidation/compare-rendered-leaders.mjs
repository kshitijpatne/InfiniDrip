import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

const output = "docs/research/epic17/S382-polo-blocker-consolidation/render-comparison.json";
const currentRoot = "docs/research/epic17/S380-polo-collar-callout-key-implementation/rendered";
const priorRoot = "docs/research/epic17/S379-polo-front-callout-crossing-audit/annotated";
const keyed = JSON.parse(await readFile("docs/research/epic17/S380-polo-collar-callout-key-implementation/collar-point-callout-matrix.json", "utf8"));
const prior = JSON.parse(await readFile("docs/research/epic17/S379-polo-front-callout-crossing-audit/leader-crossing-matrix.json", "utf8"));
assert.equal(keyed.rows.length, 17);

function leaders(svg) {
  const doc = new JSDOM(svg, { contentType: "image/svg+xml" }).window.document;
  return [...doc.querySelectorAll('g[data-feature="pom"]')]
    .map(group => {
      const path = group.querySelector("path");
      return path && {
        sourceId: group.getAttribute("data-source-id"),
        targetId: group.getAttribute("data-callout-target"),
        sourceEntity: group.getAttribute("data-callout-source-entity"),
        revisionId: group.getAttribute("data-revision-id"),
        pathData: path.getAttribute("d"),
      };
    })
    .filter(Boolean);
}

const rows = [];
for (const row of keyed.rows) {
  const oldRow = prior.results.find(item => item.caseId === row.caseId);
  assert.ok(oldRow, `${row.caseId}: missing prior S379 row`);
  assert.deepEqual(row.options, oldRow.optionOverrides, `${row.caseId}: option values changed`);
  const currentSvg = await readFile(`${currentRoot}/${row.caseId}-collar-point.svg`, "utf8");
  const oldSvg = await readFile(`${priorRoot}/${row.caseId}-leader-overlay.svg`, "utf8");
  const current = leaders(currentSvg);
  const previous = new Map(leaders(oldSvg).map(item => [item.sourceId, item]));
  const compared = current.map(item => {
    assert.equal(item.revisionId, row.revisionId, `${row.caseId}/${item.sourceId}: stale current revision`);
    const old = previous.get(item.sourceId);
    assert.ok(old, `${row.caseId}/${item.sourceId}: missing previous path`);
    assert.equal(item.targetId, old.targetId, `${row.caseId}/${item.sourceId}: target changed`);
    assert.equal(item.sourceEntity, old.sourceEntity, `${row.caseId}/${item.sourceId}: source changed`);
    assert.equal(item.pathData, old.pathData, `${row.caseId}/${item.sourceId}: leader geometry changed`);
    return item.sourceId;
  });
  rows.push({ caseId: row.caseId, currentRevision: row.revisionId, priorRevision: oldRow.revisionId,
    optionValuesIdentical: true, currentNonCLeaders: current.length, pathIdentitiesAndGeometryEqual: current.length === compared.length,
    comparedSourceIds: compared.sort(), keyedC: { sourceId: row.sourceId, sourceEntityId: row.sourceEntityId,
      targetId: row.targetId, targetEdge: row.targetEdge, unchangedFullText: row.scheduleText,
      baseIssues: row.originalBaseIssues.map(issue => issue.code), keyedIssues: row.keyedRenderIssues.map(issue => issue.code) } });
}
const result = { configurations: rows.length, optionValuesIdenticalToS379: rows.every(row => row.optionValuesIdentical),
  nonCLeaderGeometryIdenticalToS379: rows.every(row => row.pathIdentitiesAndGeometryEqual),
  s380RevisionBoundPaths: rows.every(row => row.currentRevision.startsWith("live-draft:polo:S380:")), rows };
assert.ok(result.optionValuesIdenticalToS379 && result.nonCLeaderGeometryIdenticalToS379 && result.s380RevisionBoundPaths);
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ configurations: result.configurations, optionsMatch: result.optionValuesIdenticalToS379,
  nonCLeaderGeometryMatch: result.nonCLeaderGeometryIdenticalToS379, revisionBound: result.s380RevisionBoundPaths }));

