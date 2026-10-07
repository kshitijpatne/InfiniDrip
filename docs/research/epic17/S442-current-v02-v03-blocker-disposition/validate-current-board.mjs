import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const board = await readBoardFile();
const epic = board.epics.find(item => item.id === 'EPIC-17');
const v01 = board.workItems.find(item => item.id === 'G04-V01');
const v02 = board.workItems.find(item => item.id === 'G04-V02');
const v03 = board.workItems.find(item => item.id === 'G04-V03');
if (board.revision !== 2657) throw new Error(`Unexpected board revision ${board.revision}`);
if (epic.status !== 'In Progress' || v01.status !== 'Done' || v02.status !== 'In Progress' || v03.status !== 'Backlog') throw new Error('Epic/V01/V02/V03 status changed');
if (!v02.description.includes('56 accepted / 90 held')) throw new Error('V02 tally text unexpectedly changed');
if (!v02.evidenceRefs.includes('E-G04-S442-EXIT') || !v02.evidenceRefs.includes('E-G04-S442-DECISION')) throw new Error('S442 exit evidence missing');
console.log(JSON.stringify({ revision: board.revision, epic: epic.status, v01: v01.status, v02: v02.status, v03: v03.status, tally: '56 accepted / 90 held' }));
