import { readFile } from 'node:fs/promises';
import { executeBoardCommand, readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const command = JSON.parse(await readFile(new URL('./S449-board-regression-correction-command.json', import.meta.url), 'utf8'));
await executeBoardCommand(command);
const board = await readBoardFile();
console.log(JSON.stringify({ revision: board.revision, admissionLink: board.epics.find(item => item.id === 'EPIC-17').description.includes('docs/planning/EPIC-17-ADMISSION.md') }));
