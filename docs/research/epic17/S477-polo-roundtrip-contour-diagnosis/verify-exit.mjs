import { readFile, writeFile } from "node:fs/promises";
import { DEFAULT_BOARD_PATH, readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const board = await readBoardFile(DEFAULT_BOARD_PATH);
const epic = board.epics.find((item) => item.id === "EPIC-17");
const v03 = board.workItems.find((item) => item.id === "G04-V03");
const start = JSON.parse(await readFile(new URL("./S477-exit-preflight.json", import.meta.url), "utf8"));
const result = {
  revision: board.revision,
  preflightStartRevision: start.startRevision,
  expectedExitRevision: start.exitRevision,
  epicStatus: epic?.status,
  v03Status: v03?.status,
  v03ExitEvidencePresent: v03?.evidenceRefs?.includes("E-G04-S477-EXIT") ?? false,
  epicExitEvidencePresent: epic?.evidenceRefs?.includes("E-EPIC17-S477-EXIT") ?? false,
  packetUri: "docs/research/epic17/S477-polo-roundtrip-contour-diagnosis/S477-exit-packet.md",
};
if (result.revision !== 2951 || result.preflightStartRevision !== 2947 || result.expectedExitRevision !== 2951 || result.epicStatus !== "In Progress" || result.v03Status !== "In Progress" || !result.v03ExitEvidencePresent || !result.epicExitEvidencePresent) {
  throw new Error(`Unexpected S477 exit board state: ${JSON.stringify(result)}`);
}
await writeFile(new URL("./S477-exit-verification.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
