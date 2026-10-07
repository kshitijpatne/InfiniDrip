import { readFile, writeFile } from 'node:fs/promises';

const board = JSON.parse(await readFile(new URL('../../../../ops/control-center/data/board.json', import.meta.url), 'utf8'));
const startRevision = board.revision;
const epic = board.epics.find((entry) => entry.id === 'EPIC-17');
if (!epic) throw new Error('EPIC-17 missing from canonical board');
const base = 'docs/research/epic17/S412-polo-h-station-ring-trial/';
const evidence = [
  { id: 'E-G04-S412-EXIT', kind: 'document', uri: `${base}G04-V02-POLO-H-STATION-RING-LAYER-TRIAL-S412.md`, note: 'All-option H ring paint-order trial is visually ineffective; no source geometry or production mapping changed. All Polo views remain held.' },
  { id: 'E-G04-S412-MATRIX', kind: 'document', uri: `${base}h-ring-layer-trial-matrix.json`, note: 'Exact 17-option S399 circle-only trial preserves POM IDs, anchor/radius, marks, paths and schedule; zero Chromium errors.' },
  { id: 'E-G04-S412-DEFAULT-CURRENT', kind: 'rendered-output', uri: `${base}rendered/polo-polo-default-H-ring-current-detail.png`, note: 'Actual S399 default H source station, current foreground ring; compared with the exact same-renderer trial crop.' },
  { id: 'E-G04-S412-DEFAULT-TRIAL', kind: 'rendered-output', uri: `${base}rendered/polo-polo-default-H-ring-behind-source-detail.png`, note: 'Actual Chromium default S399 H ring behind source silhouettes; no useful visual readability improvement.' },
  { id: 'E-G04-S412-LIMIT-CURRENT', kind: 'rendered-output', uri: `${base}rendered/polo-polo-standFrontRise-max-H-ring-current-detail.png`, note: 'Actual S399 standFrontRise-max H source station, current foreground ring.' },
  { id: 'E-G04-S412-LIMIT-TRIAL', kind: 'rendered-output', uri: `${base}rendered/polo-polo-standFrontRise-max-H-ring-behind-source-detail.png`, note: 'Actual Chromium standFrontRise-max S399 trial; distinct marks and contours remain crowded.' },
];
const commands = evidence.map((entry) => ({ type: 'addEvidence', itemId: 'G04-V02', evidence: { ...entry, verified: true } }));
commands.push(
  { type: 'addEpicEvidence', actor: 'Codex', role: 'maintainer', epicId: 'EPIC-17', evidenceId: 'E-G04-S412-EXIT' },
  { type: 'addEpicEvidence', actor: 'Codex', role: 'maintainer', epicId: 'EPIC-17', evidenceId: 'E-G04-S412-MATRIX' },
  { type: 'addComment', itemId: 'G04-V02', actor: 'Codex', text: 'S412 trialed moving only the exact H ring behind source silhouettes in all 17 S399 Polo outputs. Rendering shows no useful readability gain because two independent shoulder marks remain nearly co-located at the source station. No production mapping or geometry changed; all Polo views remain held.' },
  { type: 'editEpic', actor: 'Codex', role: 'maintainer', epicId: 'EPIC-17', reason: 'Append S412 result while retaining all prior evidence and acceptance gates.', patch: { description: `${epic.description} S412's exact 17-option H-ring-under-source trial shows no useful readability improvement; source marks and paths remain unchanged, and all 34 Polo faces stay held. See docs/research/epic17/S412-polo-h-station-ring-trial/.` } },
);
const indexed = commands.map((command, index) => ({ ...command, expectedRevision: startRevision + index }));
await writeFile(new URL('./S412-exit-board-commands.json', import.meta.url), `${JSON.stringify(indexed, null, 2)}\n`, 'utf8');
console.log(`generated ${indexed.length} validated commands from ${startRevision} through ${startRevision + indexed.length}`);
