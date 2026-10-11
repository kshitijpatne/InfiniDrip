import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const matrix = JSON.parse(await readFile(new URL('./h-ring-radius-matrix.json', import.meta.url), 'utf8'));
assert.equal(matrix.configurations, 17);
assert.equal(matrix.browserErrors.length, 0);
assert.equal(matrix.revisionIds.length, 17);
assert.deepEqual(matrix.summary.map(({ radiusCm }) => radiusCm), [0.1, 0.12, 0.14, 0.16, 0.18]);
assert.ok(matrix.summary.every((candidate) => candidate.options === 17 && candidate.optionsWithClearPaths === 0));
assert.equal(matrix.summary.at(-1).optionsWithClearMarks, 16);
assert.equal(matrix.rows.find((row) => row.caseId === 'polo-default').revisionId, 'live-draft:polo:S399:polo-default');
console.log('All five diagnostic radii fail the all-17 path-clearance criterion; no production candidate is approved.');
