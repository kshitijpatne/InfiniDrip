import { readFile } from 'node:fs/promises';
import { applyBoardCommand } from '../../../../ops/control-center/commands.mjs';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';
const start=await readBoardFile(); const commands=JSON.parse(await readFile(new URL('./S439-exit-board-commands.json',import.meta.url),'utf8')); let next=start;
for(const c of commands) next=applyBoardCommand(next,c);
const e=next.epics.find(x=>x.id==='EPIC-17');const w=next.workItems.find(x=>x.id==='G04-V02');
if(start.revision!==2625||next.revision!==2633||e.status!=='In Progress'||w.status!=='In Progress')throw new Error(`Invalid S439 preflight ${start.revision}->${next.revision}`);
if(next.evidence.filter(x=>x.id.startsWith('E-G04-S439')).length!==4)throw new Error('Expected four S439 board evidence records');
console.log(JSON.stringify({from:start.revision,to:next.revision,epic:e.status,v02:w.status,commandCount:commands.length,evidence:next.evidence.filter(x=>x.id.startsWith('E-G04-S439')).map(x=>x.id)}));
