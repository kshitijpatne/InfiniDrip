import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import {
  GARMENTS,
  STANDARD_M,
  blockPieces,
  gradeMeasurements,
} from "../../../../src/drafting";
import { exportDxf } from "../../../../src/export";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const fixtureDirectory = resolve(root, "fixtures");
await mkdir(fixtureDirectory, { recursive: true });

const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const sourceFiles = [
  "src/drafting/measurements.ts",
  "src/drafting/grading.ts",
  "src/drafting/tshirt-grade.ts",
  "src/drafting/recipe.ts",
  "src/drafting/tshirt.ts",
  "src/drafting/polo.ts",
  "src/drafting/shirt.ts",
  "src/drafting/block.ts",
  "src/drafting/allowance.ts",
  "src/export/dxf.ts",
  "src/export/layout.ts",
  "src/export/pattern-mark.ts",
];

const sha256 = (text: string | Uint8Array) => createHash("sha256").update(text).digest("hex");
const recipes = new Map(GARMENTS.map((recipe) => [recipe.name, recipe]));
const cases: Array<{ file: string; recipe: string; measurements: typeof STANDARD_M; size?: string; step?: number }> = [];

for (const recipeName of ["tee", "polo", "woven-shirt"]) {
  cases.push({ file: `${recipeName}-standard-m.dxf`, recipe: recipeName, measurements: STANDARD_M, size: "M", step: 0 });
}

const tee = recipes.get("tee");
if (!tee) throw new Error("Expected source recipe tee is missing");
for (const sizeLabel of ["XS", "M", "XL"]) {
  const size = tee.sizes.find((candidate) => candidate.label === sizeLabel);
  if (!size) throw new Error(`Expected Tee grade size ${sizeLabel} is missing`);
  cases.push({
    file: `tee-grade-${sizeLabel.toLowerCase()}.dxf`,
    recipe: "tee",
    measurements: gradeMeasurements(STANDARD_M, tee.grade, size.step),
    size: size.label,
    step: size.step,
  });
}

const entries = [];
for (const testCase of cases) {
  const recipe = recipes.get(testCase.recipe);
  if (!recipe) throw new Error(`Expected source recipe ${testCase.recipe} is missing`);
  const options = Object.fromEntries((recipe.options ?? []).map((option) => [option.id, option.defaultValue]));
  const block = recipe.draft(testCase.measurements, options);
  const pieces = blockPieces(block);
  const dxf = exportDxf(pieces, recipe.allowances);
  const lines = dxf.trimEnd().split(/\r?\n/);
  if (lines.length % 2 !== 0) throw new Error(`${testCase.file} has an incomplete DXF code/value pair`);
  const pairs = [];
  for (let index = 0; index < lines.length; index += 2) {
    const code = Number(lines[index]);
    if (!Number.isInteger(code)) throw new Error(`${testCase.file} contains a nonnumeric DXF group code`);
    pairs.push([code, lines[index + 1]] as const);
  }
  if (pairs[0]?.[0] !== 0 || pairs[0]?.[1] !== "SECTION" || pairs.at(-1)?.[1] !== "EOF") {
    throw new Error(`${testCase.file} does not have the generic export section/EOF envelope`);
  }
  const entities = pairs.filter(([code]) => code === 0).map(([, value]) => value);
  const expectedOutlines = pieces.length * 2;
  const closedPolylines = pairs.filter(([code, value], index) =>
    code === 0 && value === "POLYLINE" && pairs.slice(index, index + 5).some(([pairCode, pairValue]) => pairCode === 70 && pairValue === "1"),
  ).length;
  const layers = [...new Set(pairs.filter(([code]) => code === 8).map(([, value]) => value))].sort();
  const entityCounts = Object.fromEntries([...new Set(entities)].sort().map((entity) => [entity, entities.filter((candidate) => candidate === entity).length]));
  if (entityCounts.POLYLINE !== expectedOutlines || closedPolylines !== expectedOutlines) {
    throw new Error(`${testCase.file} expected ${expectedOutlines} closed CUT/SEW contours; got ${closedPolylines}`);
  }
  if (!layers.includes("CUT") || !layers.includes("SEW")) throw new Error(`${testCase.file} is missing CUT or SEW layer`);

  const path = resolve(fixtureDirectory, testCase.file);
  await writeFile(path, dxf, "utf8");
  entries.push({
    file: `fixtures/${testCase.file}`,
    sha256: sha256(dxf),
    bytes: Buffer.byteLength(dxf),
    recipe: recipe.name,
    label: recipe.label,
    size: testCase.size,
    gradeStep: testCase.step,
    measurements: testCase.measurements,
    options,
    pieceNames: pieces.map((piece) => piece.name),
    pieceCount: pieces.length,
    expectedClosedOutlineCount: expectedOutlines,
    observedClosedPolylineCount: closedPolylines,
    layers,
    entityCounts,
  });
}

const teeBase = await readFile(resolve(fixtureDirectory, "tee-standard-m.dxf"), "utf8");
const negative = teeBase.replace(/\n0\nEOF\n$/, "\n0\n");
if (negative === teeBase) throw new Error("Negative-control mutation did not find the terminal EOF value");
const negativeFile = resolve(fixtureDirectory, "negative-truncated-group-value.dxf");
await writeFile(negativeFile, negative, "utf8");
const negativeLines = negative.trimEnd().split(/\r?\n/);
if (negativeLines.length % 2 === 0 || negativeLines.at(-1) !== "0") {
  throw new Error("Negative control must end with an unmatched DXF group code");
}
entries.push({
  file: "fixtures/negative-truncated-group-value.dxf",
  sha256: sha256(negative),
  bytes: Buffer.byteLength(negative),
  expected: "Reject as malformed: the file has an unmatched DXF group code with no value. Do not silently repair or accept it as a garment pattern.",
  invalidPairCount: 1,
  sourceFixture: "fixtures/tee-standard-m.dxf",
});

const manifest = {
  manifestVersion: 1,
  generatedFromCommit: sourceCommit,
  status: "receiver-independent test inputs; no CAD compatibility claim",
  unitsDisclosure: "The generic writer uses centimeter coordinates but does not declare DXF drawing units.",
  sourceFiles: Object.fromEntries(await Promise.all(sourceFiles.map(async (file) => [file, sha256(await readFile(resolve(root, "../../../../", file)))]))),
  fixtures: entries,
};
await writeFile(resolve(root, "fixture-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ generatedFromCommit: sourceCommit, fixtureCount: entries.length, files: entries.map((entry) => entry.file) }, null, 2));
