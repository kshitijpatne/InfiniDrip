import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../S406-woven-approved-view-conventions/production-replay/matrix.json', import.meta.url);
const matrix = JSON.parse(await readFile(root, 'utf8'));
const expectedRevision = 'live-draft:woven-shirt:14:14';
const failures = [];
const faces = [];
for (const row of matrix.cases) {
  const byKind = new Map(row.faces.map((face) => [face.kind, face]));
  for (const kind of ['FRONT_FLAT', 'BACK_FLAT']) {
    const face = byKind.get(kind);
    if (!face) { failures.push(`${row.caseId}: missing ${kind}`); continue; }
    const svg = face.svg;
    if (face.revisionId !== expectedRevision || !svg.includes(`data-revision-id="${expectedRevision}"`)) failures.push(`${row.caseId}/${kind}: revision mismatch`);
    if (face.compileIssues.length || face.rendererIssues.length) failures.push(`${row.caseId}/${kind}: compile or renderer issues`);
    const seamPaths = [...svg.matchAll(/<path\b[^>]*data-feature="seam"[^>]*>/gu)].map(([tag]) => tag);
    const visibleRole = kind === 'FRONT_FLAT' ? 'front' : 'yoke';
    const visibleBaseCount = seamPaths.filter((tag) => tag.includes(`data-source-id="pattern:woven-shirt:role:${visibleRole}:edge:neckline"`)).length;
    const duplicateStandCount = seamPaths.filter((tag) => tag.includes('data-source-id="pattern:woven-shirt:role:outerStand:edge:neckline"')).length;
    if (visibleBaseCount === 0) failures.push(`${row.caseId}/${kind}: missing visible body base seam`);
    if (duplicateStandCount !== 0) failures.push(`${row.caseId}/${kind}: duplicate stand-base seam emitted`);
    faces.push({ caseId: row.caseId, kind, revisionId: face.revisionId, visibleBaseSeamStrokes: visibleBaseCount,
      duplicateStandBaseStrokes: duplicateStandCount, compileIssues: face.compileIssues.length,
      rendererIssues: face.rendererIssues.length, svgBytes: Buffer.byteLength(svg) });
  }
}
const result = {
  sourceRevision: matrix.summary.sourceRevision,
  configurations: matrix.cases.length,
  faceCount: faces.length,
  frontFaces: faces.filter(({ kind }) => kind === 'FRONT_FLAT').length,
  backFaces: faces.filter(({ kind }) => kind === 'BACK_FLAT').length,
  visibleBaseSeamStrokeCounts: [...new Set(faces.map(({ visibleBaseSeamStrokes }) => visibleBaseSeamStrokes))],
  duplicateStandBaseStrokeCount: faces.reduce((sum, face) => sum + face.duplicateStandBaseStrokes, 0),
  allBoundToRevision: faces.every(({ revisionId }) => revisionId === expectedRevision),
  compileIssues: faces.reduce((sum, face) => sum + face.compileIssues, 0),
  rendererIssues: faces.reduce((sum, face) => sum + face.rendererIssues, 0),
  backSvgByteIdentityMatchesS401: matrix.summary.backSvgByteIdentityMatchesS401,
  backPathIdentityMatchesS401: matrix.summary.backPathIdentityMatchesS401,
  allFacesRemainHeld: matrix.summary.all56WovenViewsHeldPendingIntegratedGate,
  failures,
  faceRows: faces,
};
if (result.sourceRevision !== expectedRevision || result.configurations !== 28 || result.faceCount !== 56
  || result.frontFaces !== 28 || result.backFaces !== 28 || result.duplicateStandBaseStrokeCount !== 0
  || result.compileIssues !== 0 || result.rendererIssues !== 0 || !result.allBoundToRevision
  || !result.allFacesRemainHeld || failures.length) throw new Error(JSON.stringify(result, null, 2));
await writeFile(new URL('./S428-current-woven-output-audit.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ ...result, faceRows: `${faces.length} row details saved` }, null, 2));
