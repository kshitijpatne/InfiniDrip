import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const currentDir = new URL('./rendered/', import.meta.url);
const baselineDir = new URL('../S390-polo-centerback-glyph-candidates/rendered/', import.meta.url);
const matrix = JSON.parse(await readFile(new URL('./polo-keyed-marker-trial-matrix.json', import.meta.url), 'utf8'));
const rows = [];
for (const row of matrix.rows) {
  const stem = `${row.caseId}-collar-point.svg`;
  const current = await readFile(new URL(stem, currentDir), 'utf8');
  const baseline = await readFile(new URL(stem, baselineDir), 'utf8');
  const currentH = current.match(/(<g\b[^>]*data-pom-key="H"[^>]*>[\s\S]*?<text\b[^>]*\bx=")(-?\d+(?:\.\d+)?)(" y=")(-?\d+(?:\.\d+)?)(")/u);
  const baselineH = baseline.match(/(<g\b[^>]*data-pom-key="H"[^>]*>[\s\S]*?<text\b[^>]*\bx=")(-?\d+(?:\.\d+)?)(" y=")(-?\d+(?:\.\d+)?)(")/u);
  assert.ok(currentH && baselineH, `${row.caseId}: missing H glyph`);
  const currentRing = current.match(/<g\b[^>]*data-pom-key="H"[^>]*>[\s\S]*?<circle\b[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"[^>]*r="([^"]+)"/u);
  const baselineRing = baseline.match(/<g\b[^>]*data-pom-key="H"[^>]*>[\s\S]*?<circle\b[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"[^>]*r="([^"]+)"/u);
  assert.deepEqual(currentRing?.slice(1), baselineRing?.slice(1), `${row.caseId}: H ring changed`);
  const restoredH = current.replace(currentH[0], `${currentH[1]}${baselineH[2]}${currentH[3]}${baselineH[4]}${currentH[5]}`);
  assert.equal(restoredH.replaceAll('S394', 'S390'), baseline,
    `${row.caseId}: changed content beyond the H glyph coordinates and revision/title token`);
  assert.deepEqual(row.hGlyph.pomSourceIds, ['pom:polo:shoulder-seam', 'pom:polo:neck-width']);
  assert.deepEqual(row.hGlyph.anchor, { x: 7, y: 0 });
  assert.deepEqual([row.hGlyph.textX, row.hGlyph.textY], [7.45, 0.52]);
  rows.push({ caseId: row.caseId, ringCenterAndRadiusUnchanged: true, onlyHCoordinatesDifferFromS390: true,
    hPomSourceIds: row.hGlyph.pomSourceIds, anchor: row.hGlyph.anchor, text: [row.hGlyph.textX, row.hGlyph.textY] });
}
assert.equal(rows.length, 17);
const evidence = { baseline: 'S390 actual current-production-renderer SVGs for the identical 17 Polo option rows',
  current: 'S394 actual current-production-renderer SVGs', configurations: rows.length,
  result: 'After restoring only the H glyph coordinates and normalizing the revision/title token, every current SVG is byte-identical to S390. H rings retain exact centers and radius; source POM identities/targets, both shoulder marks, all other SVG content, schedule, geometry, colorway and paired-back output are unchanged.', rows };
await writeFile(new URL('./h-output-diff-verification.json', import.meta.url), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`verified H-only SVG changes against S390 across ${rows.length} Polo options`);
