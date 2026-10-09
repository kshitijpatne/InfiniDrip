import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const root = 'C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation';
const inputPath = root + '/Input/polo-source-m.dxf';
const outputPath = root + '/Input/polo-source-m-cut-lines.dxf';
const reportPath = root + '/Evidence/line-chain-derivative-report.json';
const sourceText = await readFile(inputPath, 'utf8');
const newline = sourceText.includes('\r\n') ? '\r\n' : '\n';
const lines = sourceText.replace(/\r?\n$/, '').split(/\r?\n/);
if (lines.length % 2 !== 0) throw new Error('DXF code/value line count is odd');
const pairs = [];
for (let i = 0; i < lines.length; i += 2) pairs.push([lines[i].trim(), lines[i + 1].trim()]);
function entityLayer(items) { return items.find(([code]) => code === '8')?.[1]; }
const out = [];
const sourceCut = [];
const preservedPolylineRecords = [];
let convertedEdges = 0;
for (let i = 0; i < pairs.length;) {
  if (pairs[i][0] !== '0' || pairs[i][1] !== 'POLYLINE') { out.push(pairs[i]); i++; continue; }
  let end = i + 1;
  while (end < pairs.length && !(pairs[end][0] === '0' && pairs[end][1] === 'SEQEND')) end++;
  if (end >= pairs.length) throw new Error('unterminated POLYLINE');
  const entity = pairs.slice(i, end + 1);
  const layer = entityLayer(entity);
  if (layer !== 'CUT') { preservedPolylineRecords.push(entity); out.push(...entity); i = end + 1; continue; }
  const closed = entity.some(([c,v]) => c === '70' && (Number(v) & 1) === 1);
  const vertices = [];
  for (let j = i + 1; j < end; j++) if (pairs[j][0] === '0' && pairs[j][1] === 'VERTEX') {
    let k = j + 1; const fields = new Map();
    while (k < end && pairs[k][0] !== '0') { if (!fields.has(pairs[k][0])) fields.set(pairs[k][0], pairs[k][1]); k++; }
    vertices.push({ x: fields.get('10'), y: fields.get('20') });
  }
  if (!closed || vertices.length < 3 || vertices.some(v => v.x === undefined || v.y === undefined)) throw new Error('CUT contour is not a valid closed 2D polyline');
  sourceCut.push({ vertexCount: vertices.length, vertices });
  for (let j = 0; j < vertices.length; j++) {
    const a = vertices[j], b = vertices[(j + 1) % vertices.length];
    out.push(['0','LINE'],['8','CUT'],['10',a.x],['20',a.y],['11',b.x],['21',b.y]);
    convertedEdges++;
  }
  i = end + 1;
}
const outputText = out.map(([c,v]) => c + newline + v).join(newline) + newline;
const targetRoot = 'C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation/';
if (!outputPath.startsWith(targetRoot) || !reportPath.startsWith(targetRoot)) throw new Error('refusing write outside named C: evidence folder');
await writeFile(outputPath, outputText, 'utf8');
const outputPairs = [];
const outLines = outputText.replace(/\r?\n$/, '').split(/\r?\n/);
for (let i = 0; i < outLines.length; i += 2) outputPairs.push([outLines[i].trim(),outLines[i+1].trim()]);
const cutPolylineCount = sourceCut.length;
const lineEntityCount = outputPairs.filter(([c,v]) => c === '0' && v === 'LINE').length;
const report = {
  inputPath, outputPath,
  inputSha256: createHash('sha256').update(sourceText).digest('hex').toUpperCase(),
  outputSha256: createHash('sha256').update(outputText).digest('hex').toUpperCase(),
  sourceCutPolylineCount: cutPolylineCount,
  sourceCutVertexCount: sourceCut.reduce((n,p) => n + p.vertexCount, 0),
  emittedCutLineCount: convertedEdges,
  totalLineEntityCount: lineEntityCount,
  expectedNinePieces: cutPolylineCount === 9,
  lineEdgesCloseEverySourceContour: convertedEdges === sourceCut.reduce((n,p) => n + p.vertexCount, 0),
  convertedEdgesUseExactSourceEndpointStrings: true,
  preservedNonCutPolylineCount: preservedPolylineRecords.length,
  preservedNonCutPolylineCountAfter: outputPairs.filter(([c,v]) => c === '0' && v === 'POLYLINE').length,
  sourceCutContours: sourceCut.map(({vertexCount}) => ({vertexCount, emittedEdges:vertexCount})),
  outputEntityCounts: outputPairs.filter(([c]) => c === '0').reduce((o,[,v]) => (o[v]=(o[v]||0)+1,o),{}),
  scope: 'Only CUT POLYLINE/ VERTEX/SEQEND entity blocks were converted; other source pair order and values are copied. DXF/AAMA/CLO behavior is not claimed.'
};
if (!report.expectedNinePieces || !report.lineEdgesCloseEverySourceContour || report.preservedNonCutPolylineCountAfter !== report.preservedNonCutPolylineCount) throw new Error('derivative structural checks failed');
await writeFile(reportPath, JSON.stringify(report,null,2)+'\n', 'utf8');
console.log(JSON.stringify(report,null,2));
