import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createServer } from "vite";

const root = "C:/G04-CLO-DXF-Exchange/S624-opencadstudio-desktop-r14-receiver";
const names = ["tee", "fitted", "polo", "woven-shirt", "tank", "trouser", "skirt"];
const server = await createServer({
  configFile: "vite.config.ts",
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: "custom",
});
try {
  const { GARMENTS, STANDARD_M, blockPieces, gradeMeasurements } = await server.ssrLoadModule("/src/drafting/index.ts");
  const { exportDxf } = await server.ssrLoadModule("/src/export/index.ts");
  for (const subdir of ["Input", "Output", "Evidence", "Renders"]) await mkdir(`${root}/${subdir}`, { recursive: true });
  const recipes = new Map(GARMENTS.map((recipe) => [recipe.name, recipe]));
  const tee = recipes.get("tee");
  if (!tee) throw new Error("Current recipe source lacks Tee");
  const cases = names.map((recipe) => ({ recipe, size: "M", measurements: STANDARD_M, family: "seven-base-M" }));
  for (const label of ["XS", "XL"]) {
    const size = tee.sizes.find((candidate) => candidate.label === label);
    if (!size) throw new Error(`Current Tee grade lacks ${label}`);
    cases.push({ recipe: "tee", size: label, measurements: gradeMeasurements(STANDARD_M, tee.grade, size.step), family: "tee-grade" });
  }
  const hash = (value) => createHash("sha256").update(value).digest("hex");
  const fixtures = [];
  for (const testCase of cases) {
    const recipe = recipes.get(testCase.recipe);
    if (!recipe) throw new Error(`Current recipe source lacks ${testCase.recipe}`);
    const options = Object.fromEntries((recipe.options ?? []).map(({ id, defaultValue }) => [id, defaultValue]));
    const pieces = blockPieces(recipe.draft(testCase.measurements, options));
    const dxf = exportDxf(pieces, recipe.allowances);
    const file = `${testCase.recipe}-${testCase.size.toLowerCase()}.dxf`;
    const path = `${root}/Input/${file}`;
    await writeFile(path, dxf, "utf8");
    fixtures.push({
      family: testCase.family,
      recipe: recipe.name,
      label: recipe.label,
      size: testCase.size,
      measurements: testCase.measurements,
      options,
      file,
      path,
      bytes: Buffer.byteLength(dxf),
      sha256: hash(dxf),
      pieceCount: pieces.length,
      pieceNames: pieces.map(({ name }) => name),
      expectedClosedOutlineCount: pieces.length * 2,
      sourceLayers: ["CUT", "SEW"],
    });
  }
  const teeM = await import("node:fs/promises").then(({ readFile }) => readFile(`${root}/Input/tee-m.dxf`, "utf8"));
  const malformed = teeM.replace(/\n0\nEOF\n$/, "\n0\n");
  if (malformed === teeM) throw new Error("Could not construct malformed unmatched-group control");
  await writeFile(`${root}/Input/negative-truncated-group-value.dxf`, malformed, "utf8");
  const manifest = {
    generatedAtCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    source: "live current recipe, grading, block, allowance and generic DXF export modules loaded by Vite SSR",
    unitsDisclosure: "Generic DXF coordinate values use the product's centimeter convention; the legacy generic writer does not declare drawing units.",
    scope: "Seven default-option base-M recipes plus Tee XS and XL; Tee M is shared with the base-M set. This is not an exhaustive recipe-option Cartesian matrix.",
    negativeControl: {
      file: "negative-truncated-group-value.dxf",
      path: `${root}/Input/negative-truncated-group-value.dxf`,
      bytes: Buffer.byteLength(malformed),
      sha256: hash(malformed),
      mutation: "remove the terminal EOF group value, leaving unmatched group code 0",
    },
    fixtures,
  };
  await writeFile(`${root}/Evidence/fixture-manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ generatedAtCommit: manifest.generatedAtCommit, fixtureCount: fixtures.length, fixtures: fixtures.map(({ recipe, size, file, bytes, sha256, pieceCount }) => ({ recipe, size, file, bytes, sha256, pieceCount })), negativeControl: manifest.negativeControl }, null, 2));
} finally {
  await server.close();
}
