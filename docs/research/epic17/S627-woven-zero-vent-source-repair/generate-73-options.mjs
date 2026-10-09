import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";

const root = "C:/G04-CLO-DXF-Exchange/S627-woven-zero-vent-source-repair";
const matrixPath = "docs/research/epic17/S330-integrated-browser/matrix.json";
const copiedMatrixPath = `${root}/Input/canonical-73-option-matrix.json`;
const matrixSha = "69627e68f8d8e1c724c91d23fb885cbbc6b9fbccc42512d1d4c3e19ef14d8739";
const sha = (value) => createHash("sha256").update(value).digest("hex");
const matrixBytes = await readFile(matrixPath);
assert.equal(sha(matrixBytes), matrixSha, "canonical S330 matrix hash changed");
await writeFile(copiedMatrixPath, matrixBytes);
assert.equal(sha(await readFile(copiedMatrixPath)), matrixSha, "C: option matrix copy hash mismatch");
const matrix = JSON.parse(matrixBytes.toString("utf8"));
assert.equal(matrix.cases.length, 73);
const server = await createServer({ configFile: "vite.config.ts", server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" });
try {
  const { GARMENTS, STANDARD_M, blockPieces } = await server.ssrLoadModule("/src/drafting/index.ts");
  const { exportDxf } = await server.ssrLoadModule("/src/export/index.ts");
  for (const directory of ["Input", "Output", "Evidence", "Renders"]) await mkdir(`${root}/${directory}`, { recursive: true });
  const recipes = new Map(GARMENTS.map((recipe) => [recipe.name, recipe]));
  const sourceModules = {};
  async function hashTree(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const entryPath = path.join(folder, entry.name);
      if (entry.isDirectory()) await hashTree(entryPath);
      else if (entry.isFile() && entry.name.endsWith(".ts")) {
        sourceModules[entryPath.replaceAll("\\", "/")] = sha(await readFile(entryPath));
      }
    }
  }
  await hashTree("src/drafting");
  for (const relative of ["src/export/dxf.ts", "src/export/layout.ts", "src/export/pattern-mark.ts", "src/export/index.ts"]) {
    sourceModules[relative] = sha(await readFile(relative));
  }
  const generatedAtCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const generatedFromWorkingTree = execFileSync("git", ["status", "--porcelain", "--", "src/drafting", "src/export"], { encoding: "utf8" }).trim().length > 0;
  const cases = [];
  for (const testCase of matrix.cases) {
    const recipe = recipes.get(testCase.recipeId);
    assert(recipe, `missing recipe ${testCase.recipeId} for ${testCase.caseId}`);
    const definitions = new Map((recipe.options ?? []).map((option) => [option.id, option]));
    const options = Object.fromEntries((recipe.options ?? []).map(({ id, defaultValue }) => [id, defaultValue]));
    for (const candidate of [testCase.options ?? {}, testCase.optionValues ?? {}]) {
      for (const [id, value] of Object.entries(candidate)) {
        assert(definitions.has(id), `${testCase.caseId}: unsupported option ${id}`);
        assert.equal(typeof value, "number", `${testCase.caseId}.${id} must be numeric`);
        const definition = definitions.get(id);
        assert(value >= definition.min && value <= definition.max, `${testCase.caseId}.${id} outside declared range`);
        options[id] = value;
      }
    }
    const pieces = blockPieces(recipe.draft(STANDARD_M, options));
    assert(pieces.length > 0, `${testCase.caseId}: no pattern pieces`);
    const dxf = exportDxf(pieces, recipe.allowances);
    const file = `${testCase.caseId}.dxf`;
    const outPath = `${root}/Input/${file}`;
    const bytes = Buffer.from(dxf, "utf8");
    const dxfPairs = dxf.trimEnd().split(/\r?\n/);
    for (let i = 0; i < dxfPairs.length; i += 2) {
      const code = Number(dxfPairs[i].trim());
      if ([10, 20, 11, 21, 40].includes(code)) {
        assert(Number.isFinite(Number(dxfPairs[i + 1]?.trim())), `${testCase.caseId}: non-finite DXF coordinate/radius at pair ${i / 2}`);
      }
    }
    await writeFile(outPath, bytes);
    const pairs = dxf.trimEnd().split(/\r?\n/);
    assert.equal(pairs.length % 2, 0, `${testCase.caseId}: malformed group pairs`);
    const entityInventory = {};
    for (let i = 0; i < pairs.length; i += 2) {
      if (Number(pairs[i].trim()) !== 0) continue;
      const type = pairs[i + 1].trim();
      if (!["POLYLINE", "LINE", "POINT", "CIRCLE"].includes(type)) continue;
      const layer = Number(pairs[i + 2]?.trim()) === 8 ? pairs[i + 3]?.trim() ?? "<none>" : "<none>";
      const key = `${type}/${layer}`;
      entityInventory[key] = (entityInventory[key] ?? 0) + 1;
    }
    cases.push({
      caseId: testCase.caseId,
      recipeId: testCase.recipeId,
      kind: testCase.kind,
      measurements: "STANDARD_M",
      optionValues: testCase.optionValues ?? {},
      completeOptions: options,
      file,
      bytes: bytes.length,
      sha256: sha(bytes),
      pieceCount: pieces.length,
      pieceNames: pieces.map((piece) => piece.name),
      expectedClosedOutlineCount: pieces.length * 2,
      sourceEntityInventory: entityInventory,
      sourceLayers: [...new Set(Object.keys(entityInventory).map((key) => key.slice(key.indexOf("/") + 1)))].sort(),
    });
  }
  assert.equal(cases.length, 73);
  const manifest = {
    slice: "S627",
    generatedAtCommit,
    generatedFromWorkingTree,
    sourceSnapshotSha256: sha(JSON.stringify(Object.fromEntries(Object.entries(sourceModules).sort(([a], [b]) => a.localeCompare(b))))).toUpperCase(),
    source: "Current repository drafting, block, allowances and generic DXF exporter loaded through Vite SSR; no source mutation.",
    sourceModules,
    canonicalMatrix: "docs/research/epic17/S330-integrated-browser/matrix.json",
    canonicalMatrixSha256: sha(matrixBytes).toUpperCase(),
    copiedMatrix: copiedMatrixPath,
    copiedMatrixSha256: sha(await readFile(copiedMatrixPath)).toUpperCase(),
    measurementBasis: "STANDARD_M for all option rows; this is not a graded-size exchange test.",
    optionCaseCount: cases.length,
    supportedRecipes: Object.fromEntries([...new Set(cases.map((item) => item.recipeId))].map((id) => [id, cases.filter((item) => item.recipeId === id).length])),
    markContract: "Source generic writer emits only the mark kinds represented by each recipe as named MARK_* DXF entities; no POM schedule, stable piece/revision ID, or grading rules are implied.",
    cases,
  };
  await writeFile(`${root}/Evidence/fixture-manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ manifest: `${root}/Evidence/fixture-manifest.json`, commit: generatedAtCommit, cases: cases.length, recipes: manifest.supportedRecipes, sourceEntityCount: cases.reduce((n, item) => n + Object.values(item.sourceEntityInventory).reduce((a, b) => a + b, 0), 0), markEntityCount: cases.reduce((n, item) => n + Object.entries(item.sourceEntityInventory).filter(([key]) => key.includes("/MARK_")).reduce((a, [, b]) => a + b, 0), 0) }, null, 2));
} finally {
  await server.close();
}
