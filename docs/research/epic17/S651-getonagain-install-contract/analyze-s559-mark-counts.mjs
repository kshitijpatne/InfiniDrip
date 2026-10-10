import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const fixtureDir = process.argv[2] ?? "C:\\G04-CLO-DXF-Exchange\\S559-source-backed-grade-fixture";
const files = readdirSync(fixtureDir)
  .filter((name) => name.toLowerCase().endsWith(".dxf") && !name.includes("clo-output"))
  .sort();
if (files.length !== 35) throw new Error(`Expected 35 S559 source fixtures, found ${files.length}`);

const records = files.map((file) => {
  const lines = readFileSync(join(fixtureDir, file), "utf8").split(/\r?\n/);
  const counts = { MARK_BUTTON: 0, MARK_BUTTONHOLE: 0, MARK_DRILL: 0 };
  for (let i = 0; i + 1 < lines.length; i += 2) {
    if (lines[i].trim() !== "0") continue;
    for (let j = i + 2; j + 1 < lines.length && lines[j].trim() !== "0"; j += 2) {
      if (lines[j].trim() !== "8") continue;
      const layer = lines[j + 1].trim().toUpperCase();
      if (Object.hasOwn(counts, layer)) counts[layer] += 1;
      break;
    }
  }
  return { file, ...counts };
});

const byRecipe = Object.groupBy(records, ({ file }) => file.replace(/-(XS|S|M|L|XL)\.dxf$/i, ""));
for (const [recipe, rows] of Object.entries(byRecipe)) {
  for (const key of Object.keys(rows[0]).filter((field) => field.startsWith("MARK_"))) {
    const values = [...new Set(rows.map((row) => row[key]))];
    if (values.length !== 1) throw new Error(`${recipe} varies in ${key}: ${values.join(",")}`);
  }
}

process.stdout.write(`${JSON.stringify({ fixtureDir, fixtureCount: files.length, records }, null, 2)}\n`);
