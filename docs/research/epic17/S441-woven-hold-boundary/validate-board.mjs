import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';
const board = await readBoardFile();
const epic = board.epics.find(item => item.id === 'EPIC-17');
const v02 = board.workItems.find(item => item.id === 'G04-V02');
const expected = ['E-G04-S441-EXIT', 'E-G04-S441-RENDER-MATRIX', 'E-G04-S441-GEOMETRY', 'E-G04-S441-RENDER-CROP', 'E-G04-S441-OPUS-ATTEMPT', 'E-G04-S441-BUILD-BASELINE'];
if (board.revision !== 2652 || epic.status !== 'In Progress' || v02.status !== 'In Progress') throw new Error('Unexpected board revision or status');
if (expected.some(id => !v02.evidenceRefs.includes(id))) throw new Error('Missing S441 evidence reference');
console.log(JSON.stringify({ revision: board.revision, epic: epic.status, v02: v02.status, s441Evidence: expected.length }));
