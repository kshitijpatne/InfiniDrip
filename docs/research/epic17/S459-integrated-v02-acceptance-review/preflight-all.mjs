import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
const root=process.cwd();const dir="docs/research/epic17/S459-integrated-v02-acceptance-review";const clone=join(root,dir,"preflight","board-from-s458.json");const raw=execFileSync("git",["show","HEAD:ops/control-center/data/board.json"],{encoding:"utf8",maxBuffer:32*1024*1024});await writeFile(clone,raw);let board=JSON.parse(raw);const files=["S459-start-board-commands.json","S459-exit-board-commands.json","S459-board-summary-reconciliation.json","S459-board-woven-summary-reconciliation.json","S459-board-final-summary-reconciliation.json","S459-v02-final-description-command.json"];
for(const file of files){const value=JSON.parse(await readFile(join(root,dir,file),"utf8"));for(const command of Array.isArray(value)?value:[value])board=applyBoardCommand(board,command);}
if(board.revision!==2795||board.workItems.find(x=>x.id==="G04-V02")?.status!=="Done")throw Error(`preflight ended at ${board.revision}`);await writeFile(clone,JSON.stringify(board,null,2)+"\n");console.log(JSON.stringify({commands:files,preflightRevision:board.revision,v02:board.workItems.find(x=>x.id==="G04-V02").status,epic:board.epics.find(x=>x.id==="EPIC-17").status}));

