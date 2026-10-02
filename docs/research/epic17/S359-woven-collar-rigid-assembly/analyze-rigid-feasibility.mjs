import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const folder = dirname(fileURLToPath(import.meta.url));
const input = join(folder, '..', 'S342-woven-collar', 'source-assembly-matrix-s336.json');
const { records: rows } = JSON.parse(await readFile(input, 'utf8'));
const point = (curve, t) => {
  const u = 1 - t;
  const c = (a, b, c, d) => u ** 3 * a + 3 * u ** 2 * t * b + 3 * u * t ** 2 * c + t ** 3 * d;
  return { x: c(curve.start.x, curve.control1.x, curve.control2.x, curve.end.x),
    y: c(curve.start.y, curve.control1.y, curve.control2.y, curve.end.y) };
};
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const nearest = (a, b) => Math.min(...a.map(x => dist(x, b)));
const metrics = rows.map(row => {
  const f = row.sourceEdges.front.neckline.curve;
  const y = row.sourceEdges.yoke.neckline.curve;
  const fArc = row.directlyEncoded.frontNecklineLengthCm;
  const yArc = row.directlyEncoded.backNecklineLengthCm;
  const fChord = dist(f.start, f.end);
  const yChord = dist(y.start, y.end);
  const fResidual = (fArc - fChord) / 2;
  const yResidual = (yArc - yChord) / 2;
  return { caseId: row.caseId, options: row.resolvedOptions,
    revision: row.revision,
    front: { edge: 'front.neckline', from: 'front.centerFront.end', to: 'front.shoulder.start',
      arcCm: fArc, endpointChordCm: fChord, straightStandEdgeCm: fArc,
      minimumSymmetricEndpointResidualCm: fResidual, residualOver025: fResidual > 0.25 },
    back: { edge: 'yoke.neckline', from: 'yoke.centerBack.end', to: 'yoke.shoulder.start',
      arcCm: yArc, endpointChordCm: yChord, straightStandEdgeCm: yArc,
      minimumSymmetricEndpointResidualCm: yResidual, residualOver025: yResidual > 0.25 },
  };
});
const range = selector => {
  const values = metrics.map(selector);
  return [Math.min(...values), Math.max(...values)];
};
const output = { generatedFrom: input, configurations: metrics.length,
  method: 'For a straight rigid source edge with the same length as a curved receiver, the minimum equalized endpoint gap after orienting to the receiver chord is (receiver arc length - endpoint chord length) / 2. This is a geometric lower bound; it does not alter the source or the existing residual gate.',
  frontResidualCm: range(x => x.front.minimumSymmetricEndpointResidualCm),
  backResidualCm: range(x => x.back.minimumSymmetricEndpointResidualCm),
  frontFacesAbove025: metrics.filter(x => x.front.residualOver025).length,
  backFacesAbove025: metrics.filter(x => x.back.residualOver025).length,
  cases: metrics };
await writeFile(join(folder, 'rigid-endpoint-feasibility-matrix.json'), JSON.stringify(output, null, 2) + '\n');
const row = metrics.find(x => x.caseId === 'woven-shirt-default');
const source = rows.find(x => x.caseId === 'woven-shirt-default');
const f = source.sourceEdges.front.neckline.curve;
const y = source.sourceEdges.yoke.neckline.curve;
const mkCurve = c => `M ${c.start.x} ${c.start.y} C ${c.control1.x} ${c.control1.y} ${c.control2.x} ${c.control2.y} ${c.end.x} ${c.end.y}`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="620" viewBox="-2 -3 31 17"><style>text{font:0.38px sans-serif;fill:#111}.title{font-weight:bold;font-size:.55px}.body{fill:none;stroke:#2563eb;stroke-width:.08}.line{fill:none;stroke:#dc2626;stroke-width:.08;stroke-dasharray:.3 .14}.chord{stroke:#6b7280;stroke-width:.045;stroke-dasharray:.12 .1}.gap{stroke:#b91c1c;stroke-width:.07}.panel{fill:none;stroke:#94a3b8;stroke-width:.025}</style><text class="title" x="-1" y="-2.3">S359 source-bound endpoint feasibility — default Woven draft (diagnostic, held)</text><g transform="translate(1 0)"><text x="0" y="-1.55">FRONT: arc ${row.front.arcCm.toFixed(3)} cm; chord ${row.front.endpointChordCm.toFixed(3)} cm</text><text x="0" y="-1.0">Rigid endpoint gap ≥ ${row.front.minimumSymmetricEndpointResidualCm.toFixed(3)} cm</text><path class="body" d="${mkCurve(f)}"/><line class="chord" x1="${f.start.x}" y1="${f.start.y}" x2="${f.end.x}" y2="${f.end.y}"/><line class="line" x1="${f.start.x}" y1="${f.start.y + row.front.minimumSymmetricEndpointResidualCm}" x2="${f.end.x}" y2="${f.end.y + row.front.minimumSymmetricEndpointResidualCm}"/><line class="gap" x1="${f.start.x}" y1="${f.start.y}" x2="${f.start.x}" y2="${f.start.y + row.front.minimumSymmetricEndpointResidualCm}"/><line class="gap" x1="${f.end.x}" y1="${f.end.y}" x2="${f.end.x}" y2="${f.end.y + row.front.minimumSymmetricEndpointResidualCm}"/></g><g transform="translate(16 0)"><text x="0" y="-1.55">BACK: arc ${row.back.arcCm.toFixed(3)} cm; chord ${row.back.endpointChordCm.toFixed(3)} cm</text><text x="0" y="-1.0">Rigid endpoint gap ≥ ${row.back.minimumSymmetricEndpointResidualCm.toFixed(3)} cm</text><path class="body" d="${mkCurve(y)}"/><line class="chord" x1="${y.start.x}" y1="${y.start.y}" x2="${y.end.x}" y2="${y.end.y}"/><line class="line" x1="${y.start.x}" y1="${y.start.y + row.back.minimumSymmetricEndpointResidualCm}" x2="${y.end.x}" y2="${y.end.y + row.back.minimumSymmetricEndpointResidualCm}"/><line class="gap" x1="${y.start.x}" y1="${y.start.y}" x2="${y.start.x}" y2="${y.start.y + row.back.minimumSymmetricEndpointResidualCm}"/><line class="gap" x1="${y.end.x}" y1="${y.end.y}" x2="${y.end.x}" y2="${y.end.y + row.back.minimumSymmetricEndpointResidualCm}"/></g><text x="1" y="13">Blue = source curve; red = unchanged source-length stand edge aligned by chord; red end marks = unavoidable rigid endpoint mismatch.</text></svg>`;
await writeFile(join(folder, 'rigid-endpoint-feasibility-overlay.svg'), svg);
console.log(JSON.stringify({ configurations: output.configurations, frontResidualCm: output.frontResidualCm,
  backResidualCm: output.backResidualCm, frontFacesAbove025: output.frontFacesAbove025,
  backFacesAbove025: output.backFacesAbove025 }, null, 2));
