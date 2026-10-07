import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';
const start = await readBoardFile();
const command = JSON.parse(await readFile(new URL('./S448-epic-card-history-command.json', import.meta.url), 'utf8'));
const next = applyBoardCommand(start, command);
if (start.revision !== 2698 || next.revision !== 2699) throw new Error(`Unexpected transition ${start.revision}->${next.revision}`);
if (!next.workItems.find(item => item.id === 'EPIC-17').description.includes("S406's approved Woven collar-over-plackets display remains implemented")) throw new Error('Historical Woven decision missing');
console.log(JSON.stringify({ from: start.revision, to: next.revision, historicalWovenDecision: 'preserved' }));
