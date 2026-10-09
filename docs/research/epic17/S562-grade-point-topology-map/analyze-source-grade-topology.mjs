import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const output = 'C:/G04-CLO-DXF-Exchange/S562-grade-point-topology-map/source-grade-topology.json';
const sourcePaths = [
  'src/drafting/grading.ts',
  'src/drafting/piece.ts',
  'src/drafting/block.ts',
  'src/drafting/recipe.ts',
  'src/export/dxf.ts',
];
const server = await createServer({
  configFile: `${process.cwd()}/vite.config.ts`,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const drafting = await server.ssrLoadModule('/src/drafting/index.ts');
  const recipesModule = await server.ssrLoadModule('/src/drafting/recipe.ts');
  const outlineModule = await server.ssrLoadModule('/src/render/allowance.ts');
  const layoutModule = await server.ssrLoadModule('/src/export/layout.ts');
  const dxfModule = await server.ssrLoadModule('/src/export/dxf.ts');
  const manifest = JSON.parse(await readFile('C:/G04-CLO-DXF-Exchange/S559-source-backed-grade-fixture/fixture-manifest.json', 'utf8'));
  const recipeByName = new Map(recipesModule.GARMENTS.map((recipe) => [recipe.name, recipe]));
  const recipes = [];
  const summary = [];

  for (const manifestRecipe of manifest.selectedRecipes) {
    const recipe = recipeByName.get(manifestRecipe.id);
    assert.ok(recipe, `missing current recipe ${manifestRecipe.id}`);
    const options = drafting.defaultGarmentOptions(recipe.options ?? []);
    const run = drafting.gradeRun(drafting.STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, options);
    const manifestRows = new Map(manifestRecipe.sizes.map((row) => [row.label, row]));
    const perSize = run.map((size) => {
      const pieces = drafting.blockPieces(size.block);
      const generatedDxf = dxfModule.exportDxf(pieces, recipe.allowances);
      const expectedManifest = manifestRows.get(size.label);
      assert.ok(expectedManifest, `${recipe.name}/${size.label} missing from S559 manifest`);
      const dxfHash = createHash('sha256').update(generatedDxf).digest('hex');
      const sourceHashMatchesS559 = dxfHash === expectedManifest.sha256;
      const flats = pieces.map((piece) => layoutModule.flattenPiece(piece, recipe.allowances));
      const layout = layoutModule.layoutPieces(flats);
      const pairLines = generatedDxf.trimEnd().split(/\r?\n/);
      const pairs = [];
      for (let i = 0; i < pairLines.length; i += 2) pairs.push([Number(pairLines[i]), pairLines[i + 1]]);
      const dxfSewPolylines = [];
      for (let i = 0; i < pairs.length; i++) {
        if (pairs[i][0] !== 0 || pairs[i][1] !== 'POLYLINE') continue;
        let layer = '';
        const vertices = [];
        for (let j = i + 1; j < pairs.length && !(pairs[j][0] === 0 && pairs[j][1] === 'SEQEND'); j++) {
          if (pairs[j][0] === 8 && layer === '') layer = pairs[j][1];
          if (pairs[j][0] === 0 && pairs[j][1] === 'VERTEX') {
            let x = null, y = null;
            for (let k = j + 1; k < pairs.length && pairs[k][0] !== 0; k++) {
              if (pairs[k][0] === 10) x = Number(pairs[k][1]);
              if (pairs[k][0] === 20) y = Number(pairs[k][1]);
            }
            vertices.push({ x, y });
          }
        }
        if (layer === 'SEW') dxfSewPolylines.push(vertices);
      }
      const sourceSewVerticesMapExactly = pieces.length === dxfSewPolylines.length &&
        layout.pieces.every((placed, pieceIndex) => placed.sew.length === dxfSewPolylines[pieceIndex]?.length &&
          placed.sew.every((point, vertexIndex) => {
            const received = dxfSewPolylines[pieceIndex][vertexIndex];
            return received.x === Math.round(point.x * 1000) / 1000 && received.y === Math.round((layout.height - point.y) * 1000) / 1000;
          }));
      const roles = Object.entries(size.block.roles).map(([role, piece]) => ({
        role,
        pieceName: piece.name,
        onFold: piece.onFold,
        edges: piece.edges.map((edge) => ({ name: edge.name, kind: edge.kind })),
        pointKeys: piece.edges.flatMap((edge) => edge.kind === 'line'
          ? [`${role}/${edge.name}/start`, `${role}/${edge.name}/end`]
          : [`${role}/${edge.name}/start`, `${role}/${edge.name}/control1`, `${role}/${edge.name}/control2`, `${role}/${edge.name}/end`]),
      }));
      const points = {};
      const sewSamples = {};
      for (const [role, piece] of Object.entries(size.block.roles)) {
        for (const edge of piece.edges) {
          const controlPoints = edge.kind === 'line'
            ? [['start', edge.start], ['end', edge.end]]
            : [['start', edge.curve.start], ['control1', edge.curve.control1], ['control2', edge.curve.control2], ['end', edge.curve.end]];
          for (const [label, point] of controlPoints) points[`${role}/${edge.name}/${label}`] = point;
        }
        const edgeOccurrence = new Map();
        sewSamples[role] = outlineModule.outlineSamples(piece).map(({ point, edgeName }, vertexIndex) => {
          const sampleIndex = edgeOccurrence.get(edgeName) ?? 0;
          edgeOccurrence.set(edgeName, sampleIndex + 1);
          return { vertexIndex, edgeName, sampleIndex, point };
        });
      }
      return { label: size.label, step: size.step, roles, points, sewSamples, dxf: { sha256: dxfHash, matchesS559Manifest: sourceHashMatchesS559, sourceSewVerticesMapExactly } };
    });

    const base = perSize.find(({ step }) => step === 0);
    assert.ok(base, `${recipe.name} is missing the base size`);
    const roleSignature = JSON.stringify(base.roles.map(({ role, pieceName, onFold, edges }) => ({ role, pieceName, onFold, edges })));
    const sizeChecks = perSize.map((size) => {
      const signature = JSON.stringify(size.roles.map(({ role, pieceName, onFold, edges }) => ({ role, pieceName, onFold, edges })));
      const baseKeys = Object.keys(base.points).sort();
      const keys = Object.keys(size.points).sort();
      const samePointKeys = JSON.stringify(baseKeys) === JSON.stringify(keys);
      const sameSewVertexPath = JSON.stringify(Object.fromEntries(Object.entries(base.sewSamples).map(([role, points]) => [role, points.map(({ vertexIndex, edgeName, sampleIndex }) => ({ vertexIndex, edgeName, sampleIndex }))]))) ===
        JSON.stringify(Object.fromEntries(Object.entries(size.sewSamples).map(([role, points]) => [role, points.map(({ vertexIndex, edgeName, sampleIndex }) => ({ vertexIndex, edgeName, sampleIndex }))])));
      return {
        label: size.label,
        step: size.step,
        dxf: size.dxf,
        stableRoleAndEdgeTopology: signature === roleSignature,
        sameNamedSourcePointKeys: samePointKeys,
        pointCount: keys.length,
        sameSewVertexPath,
        sewVertexCounts: Object.fromEntries(Object.entries(size.sewSamples).map(([role, samples]) => [role, samples.length])),
        sewVertexDeltasFromBase: sameSewVertexPath ? Object.fromEntries(Object.entries(size.sewSamples).map(([role, samples]) => [role, samples.map(({ vertexIndex, edgeName, sampleIndex, point }) => ({ vertexIndex, edgeName, sampleIndex, dx: Number((point.x - base.sewSamples[role][vertexIndex].point.x).toFixed(6)), dy: Number((point.y - base.sewSamples[role][vertexIndex].point.y).toFixed(6)) }))])) : null,
        pointDeltasFromBase: samePointKeys ? Object.fromEntries(keys.map((key) => [key, {
          dx: Number((size.points[key].x - base.points[key].x).toFixed(6)),
          dy: Number((size.points[key].y - base.points[key].y).toFixed(6)),
        }])) : null,
      };
    });
      recipes.push({
      recipe: recipe.name,
      sourceGradeRuleCmPerStep: recipe.grade,
      sizes: sizeChecks,
      stableAcrossRun: sizeChecks.every(({ stableRoleAndEdgeTopology, sameNamedSourcePointKeys, sameSewVertexPath }) => stableRoleAndEdgeTopology && sameNamedSourcePointKeys && sameSewVertexPath),
      dxfChecks: run.map(({ label }) => {
        const checked = perSize.find(({ label: candidate }) => candidate === label);
        return { label, sha256: checked.dxf.sha256, matchesS559Manifest: checked.dxf.matchesS559Manifest, sourceSewVerticesMapExactly: checked.dxf.sourceSewVerticesMapExactly };
      }),
    });
    summary.push({ recipe: recipe.name, stableAcrossRun: sizeChecks.every(({ stableRoleAndEdgeTopology, sameNamedSourcePointKeys, sameSewVertexPath }) => stableRoleAndEdgeTopology && sameNamedSourcePointKeys && sameSewVertexPath), sourceHashMatches: perSize.every(({ dxf }) => dxf.matchesS559Manifest), sourceSewVerticesMapExactly: perSize.every(({ dxf }) => dxf.sourceSewVerticesMapExactly) });
  }

  const report = {
    generatedAt: 'deterministic-source-analysis',
    sourceRevision: 'S562 start commit',
    inputs: { baseMeasurements: drafting.STANDARD_M, sizeManifest: manifest.selectedRecipes.map(({ id, sizes }) => ({ id, sizes: sizes.map(({ label, step }) => ({ label, step })) })) },
    sourceFiles: await Promise.all(sourcePaths.map(async (path) => ({ path, sha256: createHash('sha256').update(await readFile(path)).digest('hex') }))),
    recipes,
  };
  assert.equal(recipes.length, 7);
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await server.close();
}
