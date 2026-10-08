import { readFile, writeFile } from "node:fs/promises";

const paths = [
  "docs/research/epic17/S460-v03-rights-and-receiver-review/control-center-initial-failure.log",
  "docs/research/epic17/S460-v03-rights-and-receiver-review/control-center-summary-failure.log"
];
for (const path of paths) {
  const before = await readFile(path, "utf8");
  const after = before.replace(/[\t ]+(?=\r?$)/gm, "");
  await writeFile(path, after);
  console.log(`${path}: removed trailing horizontal whitespace; text bytes before=${Buffer.byteLength(before)}, after=${Buffer.byteLength(after)}`);
}
