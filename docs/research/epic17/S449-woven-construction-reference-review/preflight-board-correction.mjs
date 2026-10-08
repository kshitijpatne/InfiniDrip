import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const start = await readBoardFile();
const command = JSON.parse(await readFile(new URL('./S449-board-regression-correction-command.json', import.meta.url), 'utf8'));
const next = applyBoardCommand(start, command);
if (start.revision !== 2706 || next.revision !== 2707) throw new Error(`Unexpected transition ${start.revision}->${next.revision}`);
if (!next.epics.find(item => item.id === 'EPIC-17')?.description.includes('docs/planning/EPIC-17-ADMISSION.md')) throw new Error('Admission link missing');
console.log(JSON.stringify({ from: start.revision, to: next.revision, admissionLink: true }));
