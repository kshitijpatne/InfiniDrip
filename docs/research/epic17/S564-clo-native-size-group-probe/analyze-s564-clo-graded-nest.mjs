import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const folder = 'C:/G04-CLO-DXF-Exchange/S564-clo-native-size-group-probe';
const sizes = ['XS', 'S', 'M', 'L', 'XL'];
const inputPaths = sizes.map(size => `${folder}/skirt-${size}.dxf`);
const outputPath = process.argv[2] ?? `${folder}/s564-intermediate-native-group-test.dxf`;
const reportPath = process.argv[3] ?? `${folder}/s564-intermediate-analysis.json`;
const additionalOutputPaths = process.argv.slice(4);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function parseDxf(bytes) {
  const lines = bytes.toString('utf8').trimEnd().split(/\r?\n/);
  if (lines.length % 2) throw new Error('DXF has an incomplete group-code/value pair');
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    if (!/^\d+$/.test(lines[i].trim())) throw new Error(`Invalid DXF group code at line ${i + 1}`);
    pairs.push([Number(lines[i].trim()), lines[i + 1].trim()]);
  }
  const sections = new Map();
  let section = null;
  for (let i = 0; i < pairs.length; i++) {
    const [code, value] = pairs[i];
    if (code === 0 && value === 'SECTION') {
      section = pairs[++i][1];
      sections.set(section, []);
    } else if (code === 0 && value === 'ENDSEC') section = null;
    else if (section && code === 0) {
      const record = [[code, value]];
      while (i + 1 < pairs.length && pairs[i + 1][0] !== 0) record.push(pairs[++i]);
      sections.get(section).push(record);
    }
  }
  const field = (record, code) => record.filter(([c]) => c === code).map(([, v]) => v);
  const summarize = records => records.flatMap((record, index) => {
    if (record[0]?.[1] !== 'POLYLINE') return [];
    const vertices = [];
    for (let j = index + 1; j < records.length && records[j][0]?.[1] !== 'SEQEND'; j++) {
      if (records[j][0]?.[1] !== 'VERTEX') continue;
      const get = code => Number(records[j].find(([c]) => c === code)?.[1]);
      vertices.push({ x: get(10), y: get(20) });
    }
    return [{
      layer: field(record, 8)[0] ?? '(none)',
      closed: (Number(field(record, 70)[0] ?? 0) & 1) === 1,
      vertices,
    }];
  });
  const entities = summarize(sections.get('ENTITIES') ?? []);
  const blocks = [];
  let current = null;
  for (const record of sections.get('BLOCKS') ?? []) {
    if (record[0]?.[1] === 'BLOCK') {
      current = { name: field(record, 2)[0] ?? field(record, 3)[0] ?? '(unnamed)', records: [] };
      blocks.push(current);
    } else if (record[0]?.[1] === 'ENDBLK') current = null;
    else if (current) current.records.push(record);
  }
  return {
    entities,
    blocks: blocks.map(({ name, records }) => ({ name, polylines: summarize(records) })),
    inserts: (sections.get('ENTITIES') ?? []).filter(r => r[0]?.[1] === 'INSERT').map(r => ({
      name: field(r, 2)[0] ?? '(unnamed)',
      layer: field(r, 8)[0] ?? '(none)',
    })),
  };
}

const pointSegmentDistance = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, d = dx * dx + dy * dy;
  if (!d) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / d));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
};
const anchorAtFirstVertex = contour => {
  const origin = contour.vertices[0];
  return {
    ...contour,
    vertices: contour.vertices.map(({ x, y }) => ({ x: x - origin.x, y: y - origin.y })),
  };
};
const contourResidual = (source, candidate) => {
  // Per-size source files are laid out at different absolute DXF coordinates.
  // S562 establishes stable ordered source-point correspondence; align each
  // closed contour at its own first source vertex before comparing its shape.
  const a = anchorAtFirstVertex(source);
  const b = anchorAtFirstVertex(candidate);
  let maximum = 0;
  for (const points of [[a.vertices, b.vertices], [b.vertices, a.vertices]]) {
    for (const point of points[0]) {
      let minimum = Infinity;
      for (let i = 0; i < points[1].length; i++) {
        minimum = Math.min(minimum, pointSegmentDistance(point, points[1][i], points[1][(i + 1) % points[1].length]));
      }
      maximum = Math.max(maximum, minimum);
    }
  }
  return maximum;
};

const inputs = [];
for (let i = 0; i < sizes.length; i++) {
  const bytes = await readFile(inputPaths[i]);
  inputs.push({ size: sizes[i], path: inputPaths[i], sha256: sha256(bytes), ...parseDxf(bytes) });
}
const outputFiles = [];
for (const path of [outputPath, ...additionalOutputPaths]) {
  const bytes = await readFile(path);
  outputFiles.push({ path, bytes: bytes.length, sha256: sha256(bytes), ...parseDxf(bytes) });
}
const output = {
  files: outputFiles.map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 })),
  bytes: outputFiles.reduce((sum, file) => sum + file.bytes, 0),
  sha256: outputFiles.length === 1 ? outputFiles[0].sha256 : null,
  entities: outputFiles.flatMap(file => file.entities),
  blocks: outputFiles.flatMap(file => file.blocks),
  inserts: outputFiles.flatMap(file => file.inserts),
};
const sizeMatches = inputs.map(input => {
  const closedSource = input.entities.filter(polyline => polyline.closed);
  const contours = closedSource.map((source, index) => {
    const roleBlock = `${Math.floor(index / 2)}_${input.size}`;
    const candidates = output.blocks.find(block => block.name === roleBlock)?.polylines.filter(polyline => polyline.closed) ?? [];
    const candidateChecks = candidates.map((candidate, candidateIndex) => ({
      candidateIndex,
      layer: candidate.layer,
      vertexCount: candidate.vertices.length,
      residualCm: contourResidual(source, candidate),
      vertices: candidate.vertices,
    })).sort((a, b) => a.residualCm - b.residualCm);
    return {
      sourceIndex: index,
      sourceLayer: source.layer,
      sourceVertexCount: source.vertices.length,
      sourceVertices: source.vertices,
      expectedRoleBlock: roleBlock,
      nearest: candidateChecks[0] ?? null,
      candidateChecks,
    };
  });
  return {
    size: input.size,
    sourceClosedContours: closedSource.length,
    contoursWithin001cm: contours.filter(item => item.nearest?.residualCm <= 0.001).length,
    unmatchedContours: contours.filter(item => !item.nearest).length,
    maxNearestResidualCm: contours.every(item => Number.isFinite(item.nearest?.residualCm))
      ? Math.max(...contours.map(item => item.nearest.residualCm))
      : null,
    contours,
  };
});
const report = {
  title: 'CLO 2026.1.310 native Size Group DXF-ASTM graded-nest probe',
  receiver: 'CLO 2026.1.310 (r58944)',
  sourceFixtures: inputs.map(({ size, path, sha256 }) => ({ size, path, sha256 })),
  sourceContourOrder: inputs[0].entities.filter(polyline => polyline.closed).map((polyline, index) => ({
    sourceIndex: index, sourceLayer: polyline.layer, vertexCount: polyline.vertices.length,
  })),
  export: {
    format: 'DXF-ASTM', sizeFormat: 'Graded Nest', scale: 'Centimeter', scalePercent: 100,
    rotation: 'Do Not Rotate', exportWithoutGrading: false, exportWithoutBaseSizes: false,
    exportWithoutSeamAllowance: false, duplicateNotchOnSeamAllowance: true,
    convertCurvePointsToStraight: false, optimizeAllCurvePoints: false,
  },
  output,
  sizeMatches,
  profileObservations: {
    blockNames: output.blocks.map(block => block.name),
    inserts: output.inserts,
    closedPolylinesPerBlock: output.blocks.map(block => ({ name: block.name, count: block.polylines.filter(p => p.closed).length })),
  },
  limitations: [
    'Each receiver file was selected from the CLO UI size-group selector. Multiple groups can be analyzed together by passing additional file paths after the report path; this does not merge or rewrite the files.',
    'This analyzer aligns each source and output contour at its own first vertex because S559 per-size DXFs have different absolute layout origins; it then compares same-role contour shape at the unchanged 0.001 cm tolerance using S562 ordered point correspondence.',
    'DXF-ASTM selector acceptance and block naming do not alone establish normative standard conformance or industrial receiver acceptance.',
  ],
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  bytes: output.bytes, files: output.files, sha256: output.sha256, blockNames: report.profileObservations.blockNames,
  inserts: output.inserts, closedPolylinesPerBlock: report.profileObservations.closedPolylinesPerBlock,
    sizeMatches: sizeMatches.map(({ size, sourceClosedContours, contoursWithin001cm, unmatchedContours, maxNearestResidualCm }) => ({ size, sourceClosedContours, contoursWithin001cm, unmatchedContours, maxNearestResidualCm })),
}, null, 2));
