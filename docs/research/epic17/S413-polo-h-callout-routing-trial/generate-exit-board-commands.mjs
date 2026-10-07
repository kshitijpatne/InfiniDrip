import { readFile, writeFile } from 'node:fs/promises';

const board = JSON.parse(await readFile(new URL('../../../../ops/control-center/data/board.json', import.meta.url), 'utf8'));
const startRevision = board.revision;
const epic = board.epics.find((entry) => entry.id === 'EPIC-17');
if (!epic) throw new Error('EPIC-17 missing from canonical board');
const base = 'docs/research/epic17/S413-polo-h-callout-routing-trial/';
const artifacts = [
  { id: 'E-G04-S413-EXIT', kind: 'document', uri: `${base}G04-V02-POLO-H-CALLOUT-ROUTING-TRIAL-S413.md`, note: 'Eight shared H ring/label/leader translations were screened against 17 same-revision options; no candidate clears all path and label gates. All Polo faces remain held.' },
  { id: 'E-G04-S413-MATRIX', kind: 'document', uri: `${base}h-route-candidate-matrix.json`, note: 'Exact 8×17 path, mark and label route screen. Upper routes collide with labels; lower routes cross source contours.' },
  { id: 'E-G04-S413-REJECTED-MATRIX', kind: 'document', uri: `${base}h-route-west-down-0.8-output-matrix.json`, note: 'Actual rendered west-down trial with corrected all-option screen marking the leader as rejected; no production mapping changes.' },
  { id: 'E-G04-S413-DEFAULT', kind: 'rendered-output', uri: `${base}rendered/polo-default-H-route-west-down-0.8-detail.png`, note: 'Actual Chromium default rendering of rejected H leader candidate; marker moves but the leader enters collar/stand source paths.' },
  { id: 'E-G04-S413-RISE-MAX', kind: 'rendered-output', uri: `${base}rendered/polo-standFrontRise-max-H-route-west-down-0.8-detail.png`, note: 'Actual Chromium standFrontRise-max crop for rejected leader candidate; source path crossing remains visible.' },
  { id: 'E-G04-S413-RISE-MIN', kind: 'rendered-output', uri: `${base}rendered/polo-standFrontRise-min-H-route-west-down-0.8-detail.png`, note: 'Actual Chromium standFrontRise-min crop for rejected leader candidate with same source target and geometry.' },
];
const commands = artifacts.map((artifact) => ({ type: 'addEvidence', itemId: 'G04-V02', evidence: { ...artifact, verified: true } }));
for (const evidenceId of ['E-G04-S413-EXIT', 'E-G04-S413-MATRIX', 'E-G04-S413-REJECTED-MATRIX']) {
  commands.push({ type: 'addEpicEvidence', actor: 'Codex', role: 'maintainer', epicId: 'EPIC-17', evidenceId });
}
commands.push(
  { type: 'addComment', itemId: 'G04-V02', actor: 'Codex', text: 'S413 screened eight shared source-anchored H callout translations across all 17 Polo options. Downward leaders cross collar/stand paths; upward routes collide with source shoulder labels. No layout passes all options without another unresolved overlap. All 34 Polo faces remain held.' },
  { type: 'editEpic', actor: 'Codex', role: 'maintainer', epicId: 'EPIC-17', reason: 'Append the S413 bounded H-routing result and preserve all prior Epic evidence and acceptance gates.', patch: { description: `${epic.description} S413 tested eight shared H marker/leader translations across all 17 Polo outputs. Lower routes cross outer-stand/collar source paths; upper routes collide with source shoulder labels. No candidate passes option-wide. All 34 Polo faces remain held; no production mapping changed. See docs/research/epic17/S413-polo-h-callout-routing-trial/.` } },
);
const indexed = commands.map((command, index) => ({ ...command, expectedRevision: startRevision + index }));
await writeFile(new URL('./S413-exit-board-commands.json', import.meta.url), `${JSON.stringify(indexed, null, 2)}\n`, 'utf8');
console.log(`generated ${indexed.length} validated commands from ${startRevision} through ${startRevision + indexed.length}`);
