// Read-only identity check. Never rewrites product files, inputs or baselines.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const manifest = JSON.parse(readFileSync("docs/research/uiq-clarity/BASELINE-IDENTITY.json", "utf8"));
const target = process.argv[2];
const entries = target ? manifest.readonlyContributorInputs : manifest.entries;
const root = resolve(target ?? ".");
const failures = [];
for (const entry of entries) {
  try {
    const actual = createHash("sha256").update(readFileSync(resolve(root, entry.path))).digest("hex");
    if (actual !== entry.sha256) failures.push({ path: entry.path, expected: entry.sha256, actual });
  } catch (error) { failures.push({ path: entry.path, error: error.message }); }
}
console.log(JSON.stringify({ kind: target ? "readonlyContributorInputs" : "protectedProductBaseline", root, checked: entries.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
