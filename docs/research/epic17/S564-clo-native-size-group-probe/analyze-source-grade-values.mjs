import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const outputPath = 'C:/G04-CLO-DXF-Exchange/S564-clo-native-size-group-probe/source-native-grade-values.json';
const repositoryFiles = ['src/drafting/grading.ts', 'src/drafting/recipe.ts', 'src/export/dxf.ts', 'src/export/layout.ts'];
const server = await createServer({
  configFile: `${process.cwd()}/vite.config.ts`,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

function parsePolylines(dxf) {
  const lines = dxf.trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0);
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) pairs.push([Number(lines[i]), lines[i + 1].trim()]);
  const output = [];
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] !== 0 || pairs[i][1] !== 'POLYLINE') continue;
    let layer = null;
    const vertices = [];
    for (let j = i + 1; j < pairs.length && !(pairs[j][0] === 0 && pairs[j][1] === 'SEQEND'); j++) {
      if (pairs[j][0] === 8 && layer === null) layer = pairs[j][1];
      if (pairs[j][0] !== 0 || pairs[j][1] !== 'VERTEX') continue;
      let x, y;
      for (let k = j + 1; k < pairs.length && pairs[k][0] !== 0; k++) {
        if (pairs[k][0] === 10) x = Number(pairs[k][1]);
        if (pairs[k][0] === 20) y = Number(pairs[k][1]);
      }
      vertices.push({ x, y });
    }
    output.push({ layer, vertices });
  }
  return output;
}

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
try {
  const drafting = await server.ssrLoadModule('/src/drafting/index.ts');
  const recipesModule = await server.ssrLoadModule('/src/drafting/recipe.ts');
  const outlineModule = await server.ssrLoadModule('/src/render/allowance.ts');
  const layoutModule = await server.ssrLoadModule('/src/export/layout.ts');
  const dxfModule = await server.ssrLoadModule('/src/export/dxf.ts');
  const manifest = JSON.parse(await readFile('C:/G04-CLO-DXF-Exchange/S559-source-backed-grade-fixture/fixture-manifest.json', 'utf8'));
  const manifestRecipe = manifest.selectedRecipes.find(row => row.id === 'skirt');
  const recipe = recipesModule.GARMENTS.find(row => row.name === 'skirt');
  assert.ok(manifestRecipe && recipe, 'Skirt must exist in source and S559 manifest');
  const options = drafting.defaultGarmentOptions(recipe.options ?? []);
  const sizes = drafting.gradeRun(drafting.STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, options);
  assert.deepEqual(sizes.map(({ label }) => label), ['XS', 'S', 'M', 'L', 'XL']);
  const manifestBySize = new Map(manifestRecipe.sizes.map(row => [row.label, row]));
  const copiedInputDXFs = await Promise.all(['XS', 'S', 'M', 'L', 'XL'].map(async label => {
    const path = `C:/G04-CLO-DXF-Exchange/S564-clo-native-size-group-probe/skirt-${label}.dxf`;
    const sha256 = hash(await readFile(path));
    assert.equal(sha256, manifestBySize.get(label).sha256, `${label} C-drive input DXF is S559-identical`);
    return { label, path, sha256 };
  }));
  const roleOrder = ['front', 'back', 'waistband'];
  const rows = [];

  for (const size of sizes) {
    const pieces = drafting.blockPieces(size.block);
    assert.deepEqual(Object.keys(size.block.roles), roleOrder, `${size.label} role order`);
    assert.equal(pieces.length, roleOrder.length);
    const flats = pieces.map(piece => layoutModule.flattenPiece(piece, recipe.allowances));
    const layout = layoutModule.layoutPieces(flats);
    const dxf = dxfModule.exportDxf(pieces, recipe.allowances);
    const manifestRow = manifestBySize.get(size.label);
    assert.equal(hash(Buffer.from(dxf)), manifestRow.sha256, `${size.label} source export is S559-identical`);
    const parsed = parsePolylines(dxf);
    assert.equal(parsed.length, 6, `${size.label} should export CUT/SEW for three piece roles`);
    const polylines = [];
    for (let i = 0; i < roleOrder.length; i++) {
      for (const [lineIndex, key, flatKey] of [[2 * i, 'CUT', 'cut'], [2 * i + 1, 'SEW', 'sew']]) {
        const received = parsed[lineIndex];
        assert.equal(received.layer, key, `${size.label}/${roleOrder[i]} DXF layer order`);
        const placed = layout.pieces[i][flatKey];
        assert.equal(received.vertices.length, placed.length, `${size.label}/${roleOrder[i]}/${key} vertex count`);
        for (let j = 0; j < placed.length; j++) {
          assert.equal(received.vertices[j].x, Math.round(placed[j].x * 1000) / 1000);
          assert.equal(received.vertices[j].y, Math.round((layout.height - placed[j].y) * 1000) / 1000);
        }
        polylines.push({ pieceRole: roleOrder[i], layer: key, vertexCount: placed.length });
      }
    }
    rows.push({ label: size.label, step: size.step, dxfSha256: manifestRow.sha256, polylines, pieces: roleOrder.map((role, i) => ({
      role,
      pieceName: size.block.roles[role].name,
      cut: flats[i].cut.map(({ x, y }) => ({ x, y })),
      sew: flats[i].sew.map(({ x, y }) => ({ x, y })),
      sewSourceEdgeSamples: outlineModule.outlineSamples(pieces[i]).map(({ point, edgeName }) => ({ edgeName, x: point.x, y: point.y })),
    })) });
  }

  const base = rows[0];
  const topology = rows.slice(1).map(row => ({
    label: row.label,
    samePieceRoles: row.pieces.every((piece, i) => piece.role === base.pieces[i].role && piece.pieceName === base.pieces[i].pieceName),
    sameCutVertexCounts: row.pieces.every((piece, i) => piece.cut.length === base.pieces[i].cut.length),
    sameSewVertexCounts: row.pieces.every((piece, i) => piece.sew.length === base.pieces[i].sew.length),
  }));
  assert.ok(topology.every(row => row.samePieceRoles && row.sameCutVertexCounts && row.sameSewVertexCounts), 'all size contour topology must match');
  const gradeValues = rows.map(row => ({
    size: row.label,
    step: row.step,
    pieces: row.pieces.map((piece, i) => ({
      role: piece.role,
      cut: piece.cut.map((point, j) => ({ vertex: j, dx: Number((point.x - base.pieces[i].cut[j].x).toFixed(6)), dyCad: Number((base.pieces[i].cut[j].y - point.y).toFixed(6)) })),
      sew: piece.sew.map((point, j) => ({ vertex: j, dx: Number((point.x - base.pieces[i].sew[j].x).toFixed(6)), dyCad: Number((base.pieces[i].sew[j].y - point.y).toFixed(6)) })),
    })),
  }));
  const report = {
    title: 'Source-exact CLO native Skirt size-group values',
    sourceCommit: '3a2a06bf796dfdabe09e4eba9e754163fad4fa7b',
    baseSize: 'XS',
    coordinateConvention: 'Grade deltas are computed between local `flattenPiece` contours before DXF layout. dx is source-right positive; dyCad negates source screen-y so positive is CAD-up. No layout translation is treated as garment grading.',
    sourceGradeRule: recipe.grade,
    sourceFileHashes: await Promise.all(repositoryFiles.map(async path => ({ path, sha256: hash(await readFile(path)) }))),
    copiedInputDXFs,
    sizeRows: rows.map(({ label, step, dxfSha256, polylines }) => ({ label, step, dxfSha256, polylines })),
    topology,
    gradeValues,
    limitations: ['Values are the current product source geometry differences, not a body-fit or industry-standard grade rule.', 'The report proves source-side point correspondence; CLO must still expose the same point order and accept these values before any export pass can be claimed.'],
  };
  assert.equal(rows.length, 5);
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ outputPath, topology, sizes: gradeValues.map(({ size, pieces }) => ({ size, cutVertices: pieces.reduce((sum, piece) => sum + piece.cut.length, 0), sewVertices: pieces.reduce((sum, piece) => sum + piece.sew.length, 0) })) }, null, 2));
} finally {
  await server.close();
}
