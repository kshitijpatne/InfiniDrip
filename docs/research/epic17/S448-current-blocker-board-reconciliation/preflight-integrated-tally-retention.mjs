import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';
const start = await readBoardFile();
const command = JSON.parse(await readFile(new URL('./S448-integrated-tally-retention-command.json', import.meta.url), 'utf8'));
const next = applyBoardCommand(start, command);
if (start.revision !== 2693 || next.revision !== 2694) throw new Error(`Unexpected transition ${start.revision}->${next.revision}`);
if (!next.workItems.find(item => item.id === 'G04-V02').description.includes('latest verified integrated tally is 56 accepted')) throw new Error('Historical integrated tally missing');
console.log(JSON.stringify({ from: start.revision, to: next.revision, integratedTally: 'preserved' }));
