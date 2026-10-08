import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applyBoardCommand} from '../../../../ops/control-center/commands.mjs';
let board=JSON.parse(await readFile('ops/control-center/data/board.json','utf8'));
for(const name of ['S549-map-add-evidence.json','S549-map-add-comment.json']){const c=JSON.parse(await readFile(new URL(`./${name}`,import.meta.url),'utf8'));assert.equal(c.expectedRevision,board.revision);board=applyBoardCommand(board,c,{now:'2026-10-08T23:01:20.000Z'});}
assert.equal(board.revision,3313);assert.ok(board.workItems.find(({id})=>id==='G04-V03')?.evidenceRefs.includes('E-G04-S549-POINT-MAP'));console.log('S549 supplemental mapping preflight passed at 3313; no file written.');
