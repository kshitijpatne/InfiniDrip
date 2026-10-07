import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';
const start = await readBoardFile();
const command = JSON.parse(await readFile(new URL('./S448-final-tally-phrase-command.json', import.meta.url), 'utf8'));
const next = applyBoardCommand(start, command);
if (start.revision !== 2696 || next.revision !== 2697) throw new Error(`Unexpected transition ${start.revision}->${next.revision}`);
if (!next.workItems.find(item => item.id === 'G04-V02').description.includes('latest verified integrated tally is 56 accepted')) throw new Error('Integrated tally context missing');
console.log(JSON.stringify({ from: start.revision, to: next.revision, compatibility: 'preserved' }));
