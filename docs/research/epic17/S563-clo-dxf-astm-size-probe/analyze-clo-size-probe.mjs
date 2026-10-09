import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const dir = 'C:/G04-CLO-DXF-Exchange/S563-clo-dxf-astm-size-probe';
const sizes = ['XS', 'S', 'M', 'L', 'XL'];
const inputPaths = sizes.map(size => `${dir}/skirt-${size}.dxf`);
const outputPath = `${dir}/skirt-five-size-astm-export.dxf`;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function parseDxf(bytes) {
  const lines = bytes.toString('utf8').trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, 'DXF must contain complete group-code/value pairs');
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    assert.match(lines[i].trim(), /^\d+$/);
    pairs.push([Number(lines[i].trim()), lines[i + 1].trim()]);
  }
  const sections = new Map();
  let section = null;
  for (let i = 0; i < pairs.length; i++) {
    const [code, value] = pairs[i];
    if (code === 0 && value === 'SECTION') {
      section = pairs[++i][1];
      sections.set(section, []);
    } else if (code === 0 && value === 'ENDSEC') {
      section = null;
    } else if (section && code === 0) {
      const record = [[code, value]];
      while (i + 1 < pairs.length && pairs[i + 1][0] !== 0) record.push(pairs[++i]);
      sections.get(section).push(record);
    }
  }
  const field = (record, code) => record.filter(([c]) => c === code).map(([, v]) => v);
  const polylineSummary = records => records.flatMap((record, i) => {
    if (record[0]?.[1] !== 'POLYLINE') return [];
    let vertexCount = 0;
    for (let j = i + 1; j < records.length && records[j][0]?.[1] !== 'SEQEND'; j++) {
      if (records[j][0]?.[1] === 'VERTEX') vertexCount++;
    }
    const vertices = [];
    for (let j = i + 1; j < records.length && records[j][0]?.[1] !== 'SEQEND'; j++) {
      if (records[j][0]?.[1] !== 'VERTEX') continue;
      const get = code => Number(records[j].find(([c]) => c === code)?.[1]);
      vertices.push({ x: get(10), y: get(20) });
    }
    return [{
      layer: field(record, 8)[0] ?? '(none)',
      closed: (Number(field(record, 70)[0] ?? 0) & 1) === 1,
      vertexCount,
      vertices,
    }];
  });
  const entities = polylineSummary(sections.get('ENTITIES') ?? []);
  const blocks = [];
  let current = null;
  for (const record of sections.get('BLOCKS') ?? []) {
    const type = record[0]?.[1];
    if (type === 'BLOCK') {
      current = { name: field(record, 2)[0] ?? field(record, 3)[0] ?? '(unnamed)', records: [] };
      blocks.push(current);
    } else if (type === 'ENDBLK') {
      current = null;
    } else if (current) {
      current.records.push(record);
    }
  }
  return {
    sections: [...sections.keys()],
    entities,
    blocks: blocks.map(({ name, records }) => ({ name, polylines: polylineSummary(records) })),
    inserts: (sections.get('ENTITIES') ?? []).filter(r => r[0]?.[1] === 'INSERT').map(r => ({
      name: field(r, 2)[0] ?? '(unnamed)',
      layer: field(r, 8)[0] ?? '(none)',
    })),
  };
}

const inputs = [];
for (let i = 0; i < sizes.length; i++) {
  const bytes = await readFile(inputPaths[i]);
  const dxf = parseDxf(bytes);
  inputs.push({ size: sizes[i], path: inputPaths[i], bytes: bytes.length, sha256: sha256(bytes), ...dxf });
}
const outputBytes = await readFile(outputPath);
const output = { path: outputPath, bytes: outputBytes.length, sha256: sha256(outputBytes), ...parseDxf(outputBytes) };

const pointSegmentDistance = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, d = dx * dx + dy * dy;
  if (!d) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / d));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
};
const pathDistance = (p, q) => {
  let maximum = 0;
  for (const point of p.vertices) {
    let minimum = Infinity;
    for (let i = 0; i < q.vertices.length; i++) minimum = Math.min(minimum, pointSegmentDistance(point, q.vertices[i], q.vertices[(i + 1) % q.vertices.length]));
    maximum = Math.max(maximum, minimum);
  }
  for (const point of q.vertices) {
    let minimum = Infinity;
    for (let i = 0; i < p.vertices.length; i++) minimum = Math.min(minimum, pointSegmentDistance(point, p.vertices[i], p.vertices[(i + 1) % p.vertices.length]));
    maximum = Math.max(maximum, minimum);
  }
  return maximum;
};
const outputClosed = [...output.entities, ...output.blocks.flatMap(block => block.polylines.map(polyline => ({ ...polyline, block: block.name })))].filter(polyline => polyline.closed);
const geometryMatches = inputs.map(input => ({
  size: input.size,
  contours: input.entities.filter(polyline => polyline.closed).map((source, sourceIndex) => ({
    sourceIndex,
    best: outputClosed.map((candidate, index) => ({ index, block: candidate.block ?? '(ENTITIES)', layer: candidate.layer, vertexCount: candidate.vertexCount, residual: pathDistance(source, candidate) })).sort((a, b) => a.residual - b.residual)[0],
  })),
}));
const geometryDisposition = geometryMatches.map(({ size, contours }) => ({
  size,
  sourceContours: contours.length,
  within001cm: contours.filter(contour => contour.best.residual <= 0.001).length,
  minBestResidualCm: Math.min(...contours.map(contour => contour.best.residual)),
  maxBestResidualCm: Math.max(...contours.map(contour => contour.best.residual)),
  matchedOutputBlocks: [...new Set(contours.filter(contour => contour.best.residual <= 0.001).map(contour => contour.best.block))],
}));

const report = {
  title: 'CLO DXF-ASTM five-size Skirt probe',
  receiver: 'CLO 2026.1.310 (r58944)',
  import: { format: 'DXF-ASTM', unit: 'centimeter', scalePercent: 100, rotation: 'Do Not Rotate', loadType: 'Open', notch: 'Both at Ratio', importDrawCurvePoints: true, optimizeAllCurvePoints: false, swapCutAndSew: false },
  export: { format: 'DXF-ASTM', sizeFormat: 'Graded Nest', unit: 'centimeter', scalePercent: 100, rotation: 'Do Not Rotate', exportWithoutGrading: false, exportWithoutBaseSizes: false, exportWithoutSeamAllowance: false, duplicateNotchOnSeamAllowance: true, convertCurvesToStraightPoints: false, optimizeAllCurvePoints: false },
  reimport: { format: 'DXF-ASTM', unit: 'centimeter', scalePercent: 100, rotation: 'Do Not Rotate', importNotches: true, importDrawCurvePoints: true },
  inputs,
  output,
  geometryMatches,
  geometryDisposition,
  disposition: {
    inputSizeFiles: inputs.length,
    outputBlockCount: output.blocks.length,
    outputBlockNames: output.blocks.map(b => b.name),
    uniqueOutputSizeSuffixes: [...new Set(output.blocks.map(b => b.name.split('_').at(-1)))],
    outputClosedContourCount: output.entities.filter(e => e.closed).length + output.blocks.flatMap(b => b.polylines).filter(e => e.closed).length,
    allFiveSizeIdentitiesRecoverable: false,
    notes: [
      'The five source DXFs were separate per-size fixtures with no in-file size or grade-rule metadata.',
      'CLO import used Load Type Open for the multi-selection; the export contains three pattern-role blocks and all three are labeled M.',
      'Source geometry comparison at the unchanged 0.001 cm contour gate matches all six XS contours; zero of six contours match each S, M, L, or XL source fixture. The exported geometry therefore represents the XS source outlines while the block size suffix says M.',
      'The re-import dialog accepted the emitted file as DXF-ASTM and displayed a seam-allowance notice; CLO stated the outlines were imported in Custom mode to preserve their original shape.',
      'The rendered re-import display shows the three Skirt piece roles. Neither the renderer nor the DXF contains a recoverable five-size grade relationship.',
      'CLO accepting the DXF-ASTM selector and file is not proof of normative industrial profile conformance.',
    ],
  },
};
assert.equal(report.disposition.inputSizeFiles, 5);
assert.equal(report.disposition.outputBlockCount, 3);
assert.deepEqual(report.disposition.uniqueOutputSizeSuffixes, ['M']);
assert.equal(output.inserts.length, 3);
assert.deepEqual(geometryDisposition.map(({ within001cm }) => within001cm), [6, 0, 0, 0, 0]);
await writeFile(`${dir}/clo-size-probe-analysis.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.disposition, null, 2));
