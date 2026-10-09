import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const outputRoot = 'C:/G04-CLO-DXF-Exchange/S559-source-backed-grade-fixture';
const repoRoot = process.cwd();
const server = await createServer({
  configFile: `${repoRoot}/vite.config.ts`,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const drafting = await server.ssrLoadModule('/src/drafting/index.ts');
  const recipes = await server.ssrLoadModule('/src/drafting/recipe.ts');
  const dxf = await server.ssrLoadModule('/src/export/dxf.ts');
  const sourceFiles = await Promise.all([
    'src/drafting/grading.ts', 'src/drafting/tshirt-grade.ts',
    'src/drafting/recipe.ts', 'src/drafting/fitted-tables.ts',
    'src/drafting/trouser-tables.ts', 'src/drafting/shirt.ts',
    'src/drafting/skirt.ts', 'src/export/dxf.ts',
  ].map(async (path) => ({ path, sha256: createHash('sha256').update(await (await import('node:fs/promises')).readFile(path)).digest('hex') })));
  const selected = recipes.GARMENTS;
  const manifest = {
    generatedFrom: 'current source code at S559 start',
    baseMeasurementClass: 'STANDARD_M',
    scope: 'per-size DXFs; no grading-rule record is encoded by legacy exporter',
    selectedRecipes: [],
    sourceFiles,
  };
  await mkdir(outputRoot, { recursive: true });

  for (const recipe of selected) {
    const options = drafting.defaultGarmentOptions(recipe.options ?? []);
    const run = drafting.gradeRun(drafting.STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, options);
    const recipeRow = {
      id: recipe.name,
      baseMeasurements: drafting.STANDARD_M,
      gradeRuleCmPerStep: recipe.grade,
      sizes: [],
    };
    for (const size of run) {
      const checks = recipe.checks(size.block, size.measurements);
      assert.ok(checks.every(({ ok }) => ok), `${recipe.name}/${size.label} has a failed recipe check`);
      const pieces = drafting.blockPieces(size.block);
      const content = dxf.exportDxf(pieces, recipe.allowances);
      const name = `${recipe.name}-${size.label}.dxf`;
      await writeFile(`${outputRoot}/${name}`, content, 'utf8');
      recipeRow.sizes.push({
        label: size.label,
        step: size.step,
        measurements: size.measurements,
        pieceRoles: Object.keys(size.block.roles),
        pieceCount: pieces.length,
        checkCount: checks.length,
        checks,
        sha256: createHash('sha256').update(content).digest('hex'),
        byteLength: Buffer.byteLength(content),
        geometryHash: createHash('sha256').update(JSON.stringify(pieces)).digest('hex'),
      });
    }
    manifest.selectedRecipes.push(recipeRow);
  }
  await writeFile(`${outputRoot}/fixture-manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ outputRoot, recipes: manifest.selectedRecipes.map(({ id, sizes }) => ({ id, sizes: sizes.map(({ label, step, pieceCount, checkCount, sha256 }) => ({ label, step, pieceCount, checkCount, sha256 })) })) }, null, 2));
} finally {
  await server.close();
}
