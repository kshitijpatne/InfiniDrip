import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const paths = [
  "docs/research/epic17/S460-v03-rights-and-receiver-review/control-center-initial-failure.log",
  "docs/research/epic17/S460-v03-rights-and-receiver-review/control-center-summary-failure.log"
];
const normalize = (value) => value.replace(/\r\n/g, "\n").replace(/[\t ]+(?=\n|$)/g, "");
for (const path of paths) {
  const committed = execFileSync("git", ["show", `HEAD:${path}`], { encoding: "utf8" });
  const current = await readFile(path, "utf8");
  if (normalize(current) !== normalize(committed)) throw new Error(`Unexpected diagnostic content change in ${path}`);
  const hash = createHash("sha256").update(normalize(current)).digest("hex");
  console.log(`${path}: exact text except line-ending normalization and trailing horizontal whitespace; normalized sha256=${hash}`);
}
