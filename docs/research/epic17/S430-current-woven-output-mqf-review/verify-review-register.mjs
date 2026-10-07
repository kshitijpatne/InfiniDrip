import { readFile, writeFile } from 'node:fs/promises';

const findings = await readFile(new URL('../../../../docs/research/UI-MANUAL-QUALITY-FINDINGS-2026-09.md', import.meta.url), 'utf8');
const ids = ['MQF-004', 'MQF-005', 'MQF-006', 'MQF-007', 'MQF-011', 'MQF-012', 'MQF-015'];
const rows = Object.fromEntries(ids.map((id) => {
  const row = findings.split('\n').find((line) => line.startsWith(`| ${id} |`));
  return [id, { present: Boolean(row), toBeReviewed: Boolean(row?.includes('To be reviewed')) }];
}));
const matrix = JSON.parse(await readFile(new URL('../S429-woven-pom-output-readability/S429-woven-callout-readability-matrix.json', import.meta.url), 'utf8'));
const result = { findings: rows, allToBeReviewed: Object.values(rows).every(({ present, toBeReviewed }) => present && toBeReviewed),
  outputEvidence: { revision: matrix.sourceRevision, configurations: matrix.configurationCount, faces: matrix.faceCount,
    exactBoundCallouts: matrix.exactBoundCalloutInstances, textOverlapCount: matrix.textOverlapCount,
    unrelatedMarkerOverlapCount: matrix.keyedRingTextOverlapCount, allHeld: matrix.allRowsHeld } };
if (!result.allToBeReviewed || result.outputEvidence.revision !== 'live-draft:woven-shirt:14:14'
  || result.outputEvidence.configurations !== 28 || result.outputEvidence.faces !== 56
  || result.outputEvidence.exactBoundCallouts !== 223 || result.outputEvidence.textOverlapCount !== 0
  || result.outputEvidence.unrelatedMarkerOverlapCount !== 0 || !result.outputEvidence.allHeld) {
  throw new Error(`S430 register/evidence check failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL('./S430-review-register-result.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
