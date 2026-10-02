import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { executeBoardCommand, readBoardFile } from "../../../../ops/control-center/board-store.mjs";
const commandFile = process.argv[2];
if (!commandFile) throw new Error("Provide the saved command array JSON path.");
const commands = JSON.parse(await readFile(commandFile, "utf8"));
let shadow = await readBoardFile();
const preflightRevision = shadow.revision;
for (const command of commands) shadow = applyBoardCommand(shadow, command);
let saved = await readBoardFile();
if (saved.revision !== preflightRevision) throw new Error("Board changed during preflight: " + preflightRevision + " -> " + saved.revision);
for (const command of commands) {
  saved = await executeBoardCommand({ ...command, expectedRevision: saved.revision });
  console.log(command.type + ": revision " + saved.revision);
}
console.log("Preflighted " + commands.length + " commands at " + preflightRevision + "; final revision " + saved.revision + ".");
