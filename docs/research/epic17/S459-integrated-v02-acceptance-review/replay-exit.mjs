import { copyFile, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";
const here=dirname(fileURLToPath(import.meta.url));const commands=JSON.parse(await readFile(resolve(here,"S459-exit-board-commands.json"),"utf8"));const boardPath=resolve(process.argv[2]??"ops/control-center/data/board.json");
for(const command of commands){const result=await executeBoardCommand(command,{boardPath});console.log(JSON.stringify({type:command.type,revision:result.revision}));}
