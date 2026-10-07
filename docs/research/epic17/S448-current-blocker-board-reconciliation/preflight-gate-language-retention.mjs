import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';
const start = await readBoardFile();
const command = JSON.parse(await readFile(new URL('./S448-gate-language-retention-command.json', import.meta.url), 'utf8'));
const next = applyBoardCommand(start, command);
if (start.revision !== 2692 || next.revision !== 2693) throw new Error(`Unexpected transition ${start.revision}->${next.revision}`);
if (!next.workItems.find(item => item.id === 'G04-V02').description.includes('Preserve all-seven V02, keep V03 gated')) throw new Error('Gate language missing');
console.log(JSON.stringify({ from: start.revision, to: next.revision, gateLanguage: 'preserved' }));
