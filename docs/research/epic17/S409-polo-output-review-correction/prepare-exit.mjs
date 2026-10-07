import { readFile, writeFile } from 'node:fs/promises';
import { DEFAULT_BOARD_PATH } from '../../../../ops/control-center/board-store.mjs';

const board = JSON.parse(await readFile(DEFAULT_BOARD_PATH, 'utf8'));
if (board.revision !== 2354) throw new Error(`Expected S409 start revision 2354; got ${board.revision}`);
const epic = board.epics.find(item => item.id === 'EPIC-17');
if (!epic) throw new Error('EPIC-17 summary is missing');
const append = ' S409 corrects the Polo finding basis: S399 is the current 17-option production replay; its byte comparison uses S394 as baseline and isolates only the approved FG glyph plus revision/title tokens, preserving paths, schedules, colorway and paired backs. MQF-012 remains partial and To be reviewed; its concern remains unexplained, the 0.68 cm residual remains above 0.25 cm, and all 34 Polo faces remain held. See the S409 correction packet.';
const commands = [
  { type: 'addEvidence', expectedRevision: 2354, itemId: 'G04-V02', evidence: { id: 'E-G04-S409-EXIT', kind: 'document', uri: 'docs/research/epic17/S409-polo-output-review-correction/G04-V02-POLO-MQF-OUTPUT-REVIEW-CORRECTION-S409.md', verified: true, note: 'Corrects S408 Polo finding evidence to the current S399 17-option actual renderer output. S394 is used only as its byte-diff baseline; MQF-012 remains partial/To be reviewed and all Polo holds/gates remain.' } },
  { type: 'addEpicEvidence', expectedRevision: 2355, actor: 'Codex', role: 'maintainer', epicId: 'EPIC-17', evidenceId: 'E-G04-S409-EXIT' },
  { type: 'addComment', expectedRevision: 2356, itemId: 'G04-V02', actor: 'Codex', text: 'S409 confirms S399 is the current 17-option Polo output; S394 is the baseline for its FG-only byte comparison. MQF-012 remains partially reviewed and To be reviewed; no face/gate status changed.' },
  { type: 'editEpic', expectedRevision: 2357, actor: 'Codex', role: 'maintainer', epicId: 'EPIC-17', reason: 'Correct the Polo current-output version in the manual-finding evidence record while preserving S408 and all historical regression assertions.', patch: { description: epic.description + append } },
];
await writeFile(new URL('./S409-exit-board-commands.json', import.meta.url), `${JSON.stringify(commands, null, 2)}\n`, 'utf8');
process.stdout.write('Prepared additive S409 commands from validated board revision 2354.\n');
