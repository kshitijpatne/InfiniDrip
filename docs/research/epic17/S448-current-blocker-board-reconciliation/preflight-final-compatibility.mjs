import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';
const start = await readBoardFile();
const command = JSON.parse(await readFile(new URL('./S448-final-compatibility-command.json', import.meta.url), 'utf8'));
const next = applyBoardCommand(start, command);
if (start.revision !== 2690 || next.revision !== 2691) throw new Error(`Unexpected transition ${start.revision}->${next.revision}`);
if (!next.workItems.find(item => item.id === 'G04-V02').description.includes("S406's approved Woven collar-over-plackets order remains implemented")) throw new Error('Historical decision wording missing');
console.log(JSON.stringify({ from: start.revision, to: next.revision, historicalDecisionWording: 'preserved' }));
