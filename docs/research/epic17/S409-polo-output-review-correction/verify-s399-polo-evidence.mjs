import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const dir = new URL('../S399-polo-fg-glyph-offset/', import.meta.url);
const matrix = JSON.parse(await readFile(new URL('polo-keyed-marker-trial-matrix.json', dir), 'utf8'));
const diff = JSON.parse(await readFile(new URL('fg-output-diff-verification.json', dir), 'utf8'));

assert.equal(matrix.rows.length, 17);
assert.equal(new Set(matrix.rows.map(row => row.caseId)).size, 17);
assert(matrix.rows.every(row => row.status === 'rendered'));
assert(matrix.rows.every(row => row.revisionId.startsWith('live-draft:polo:S399:')));
assert(matrix.rows.every(row => row.fullScheduleRows === 11 && row.sourceCenteredMarker));
assert(matrix.rows.every(row => row.sourceId === 'pom:polo:collar-point-extension'));
assert(matrix.rows.every(row => row.pairedBackUnchanged && row.colorwayFillRendered));

assert.equal(diff.keyedFronts, 17);
assert.equal(diff.colorwayFronts, 17);
assert.equal(diff.unchangedPairedBacks, 17);
assert.equal(diff.browserErrors, 0);
assert.equal(diff.sleeveResidualCm, 0.68);
assert.equal(diff.residualGateCm, 0.25);
assert.equal(diff.productionHoldsReleased, 0);
assert.equal(diff.rows.length, 17);
assert(diff.rows.every(row => row.ringUnchanged && row.scheduleRows === 11 && row.otherwiseByteIdenticalToS394));
assert(diff.result.includes('All 17 SVGs are byte-identical to S394 after restoring only the FG glyph x/y and normalizing the S399 revision/title token'));
assert(diff.result.includes('geometry are preserved'));

process.stdout.write('S399 Polo evidence: 17/17 revisions, schedules and immutable-output comparisons; zero holds released; 0.68 cm residual remains above 0.25 cm.\n');
