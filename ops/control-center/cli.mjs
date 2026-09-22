import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { DEFAULT_BOARD_PATH, executeBoardCommand } from "./board-store.mjs";

export async function runCli(argv = process.argv.slice(2)) {
  const [commandPath, boardPath = DEFAULT_BOARD_PATH] = argv;
  if (!commandPath) throw new Error("usage: node ops/control-center/cli.mjs <command.json> [board.json]");
  const command = JSON.parse(await readFile(commandPath, "utf8"));
  const board = await executeBoardCommand(command, { boardPath });
  return `Saved ${command.type} at board revision ${board.revision}.`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().then((message) => console.log(message)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
