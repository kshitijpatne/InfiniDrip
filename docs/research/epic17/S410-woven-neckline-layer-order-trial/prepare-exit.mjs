import { readFile, writeFile } from 'node:fs/promises';
import { DEFAULT_BOARD_PATH } from '../../../../ops/control-center/board-store.mjs';

const board = JSON.parse(await readFile(DEFAULT_BOARD_PATH, 'utf8'));
if (board.revision !== 2361) throw new Error(`Expected S410 start revision 2361; got ${board.revision}`);
const epic = board.epics.find(item => item.id === 'EPIC-17');
if (!epic) throw new Error('EPIC-17 summary is missing');
const append = ' S410 traced the exact S406 SVG paint order for all 28 Woven fronts: both full front-neckline strokes already paint after the four projected collar outlines, so the proposed continuous-neckline-over-collar reorder is a no-op. S407 changes only by clipping 0.8426–0.8433 cm of body neckline per side, exposing the collar through a base-seam interruption. The exact decision remains pending; collar-over-plackets approval does not settle it. All 56 Woven and 34 Polo faces remain held. See the S410 paint-order matrix.';
const commands = [
  { type: 'addEvidence', expectedRevision: 2361, itemId: 'G04-V02', evidence: { id: 'E-G04-S410-EXIT', kind: 'document', uri: 'docs/research/epic17/S410-woven-neckline-layer-order-trial/G04-V02-WOVEN-NECKLINE-LAYER-ORDER-TRIAL-S410.md', verified: true, note: 'All-28 S406 SVG entity-order check proves continuous front neckline is already painted above projected collar; the alternative is a no-op. S407 seam clip remains unapproved, no production changes or holds released.' } },
  { type: 'addEpicEvidence', expectedRevision: 2362, actor: 'Codex', role: 'maintainer', epicId: 'EPIC-17', evidenceId: 'E-G04-S410-EXIT' },
  { type: 'addComment', expectedRevision: 2363, itemId: 'G04-V02', actor: 'Codex', text: 'S410 confirms the full Woven neckline is already painted after collar outlines across all 28 options. Reordering is a no-op; clipping the 0.8426–0.8433 cm segments changes seam continuity. Its approval is separate from collar-over-plackets. All 56 Woven views stay held.' },
  { type: 'editEpic', expectedRevision: 2364, actor: 'Codex', role: 'maintainer', epicId: 'EPIC-17', reason: 'Append the verified all-option S410 paint-order finding while preserving the full historical Epic summary and its assertions.', patch: { description: epic.description + append } },
];
await writeFile(new URL('./S410-exit-board-commands.json', import.meta.url), `${JSON.stringify(commands, null, 2)}\n`, 'utf8');
process.stdout.write('Prepared additive S410 commands from validated board revision 2361.\n');
