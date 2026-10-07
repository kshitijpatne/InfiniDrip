import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const board = JSON.parse(await readFile(new URL('../../../../ops/control-center/data/board.json', import.meta.url), 'utf8'));
const startRevision = board.revision;
const epic = board.epics.find((entry) => entry.id === 'EPIC-17');
if (!epic) throw new Error('EPIC-17 not found in canonical board');
const append = ' S411 reconciles the latest S399 actual Polo output across the same 17 options: zero keyed renderer failures, with three separate unkeyed collar-point fallback errors; approved keyed C output is clean. A/B/C contacts are source-backed station interfaces. FG and H remain visually crowded at fixed source stations, including distinct H shoulder marks. S392 confirms 34/34 sleeve-cap ease residuals remain 0.68 cm above 0.25 cm. All 34 Polo faces remain held. See docs/research/epic17/S411-polo-post-S399-blocker-audit/.';
const commands = [
  { type: 'addEvidence', itemId: 'G04-V02', evidence: { id: 'E-G04-S411-EXIT', kind: 'document', uri: 'docs/research/epic17/S411-polo-post-S399-blocker-audit/G04-V02-POLO-POST-S399-BLOCKER-AUDIT-S411.md', verified: true, note: 'Current S399 keyed-output audit across 17 options separates source-backed contacts from fallback errors and reconfirms all 34 residual holds.' } },
  { type: 'addEvidence', itemId: 'G04-V02', evidence: { id: 'E-G04-S411-MATRIX', kind: 'document', uri: 'docs/research/epic17/S411-polo-post-S399-blocker-audit/polo-post-S399-current-blockers.json', verified: true, note: 'Exact 17-option S399/POM/topology/residual reconciliation; zero keyed errors, three unkeyed C fallback errors, and 34/34 faces above the fixed gate.' } },
  { type: 'addEpicEvidence', actor: 'Codex', role: 'maintainer', epicId: 'EPIC-17', evidenceId: 'E-G04-S411-EXIT' },
  { type: 'addEpicEvidence', actor: 'Codex', role: 'maintainer', epicId: 'EPIC-17', evidenceId: 'E-G04-S411-MATRIX' },
  { type: 'addComment', itemId: 'G04-V02', actor: 'Codex', text: 'S411 reconciles the latest S399 17-option Polo output. All keyed renders pass their collision check; the three C text errors are only unkeyed fallback rows. FG/H source stations remain visually crowded, and the independent 0.68 cm sleeve residual exceeds the unchanged 0.25 cm gate on all 34 faces. No views released.' },
  { type: 'editEpic', actor: 'Codex', role: 'maintainer', epicId: 'EPIC-17', reason: 'Append the verified S411 current-output reconciliation without changing historical summary evidence or G04 acceptance.', patch: { description: `${epic.description}${append}` } },
].map((command, index) => ({ ...command, expectedRevision: startRevision + index }));
await writeFile(new URL('./S411-exit-board-commands.json', import.meta.url), `${JSON.stringify(commands, null, 2)}\n`, 'utf8');
console.log(`generated six validated commands from board revision ${startRevision} through ${startRevision + commands.length}`);
