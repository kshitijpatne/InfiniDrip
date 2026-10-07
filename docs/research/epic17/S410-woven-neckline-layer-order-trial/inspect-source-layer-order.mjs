import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const { JSDOM } = createRequire(import.meta.url)('jsdom');
const matrix = JSON.parse(await readFile(new URL('../S406-woven-approved-view-conventions/production-replay/matrix.json', import.meta.url), 'utf8'));
const rows = [];
for (const row of matrix.cases) {
  const { caseId } = row;
  const front = row?.faces.find((face) => face.kind === 'FRONT_FLAT');
  if (!front) throw new Error(`Missing S406 front output for ${caseId}`);
  if (front.revisionId !== 'live-draft:woven-shirt:14:14') throw new Error(`Unexpected revision for ${caseId}: ${front.revisionId}`);
  const document = new JSDOM(front.svg, { contentType: 'image/svg+xml' }).window.document;
  const paths = [...document.querySelectorAll('path[data-entity-id]')];
  const entities = paths.map((path, index) => ({ index, id: path.getAttribute('data-entity-id'), source: path.getAttribute('data-source-id'), d: path.getAttribute('d') }))
    .filter((path) => /view-seam:front:neckline|component:(underCollar|upperCollar):outline/u.test(path.id));
  const collar = entities.filter((path) => /component:(underCollar|upperCollar):outline/u.test(path.id));
  const neckline = entities.filter((path) => /view-seam:front:neckline/u.test(path.id));
  if (collar.length !== 4 || neckline.length !== 2) throw new Error(`${caseId}: expected four collar outline paths and two neckline strokes; got ${collar.length}/${neckline.length}`);
  const sourceTopIndex = Math.max(...collar.map((path) => path.index));
  const necklineBottomIndex = Math.min(...neckline.map((path) => path.index));
  if (necklineBottomIndex <= sourceTopIndex) throw new Error(`${caseId}: production front neckline is not painted above the collar outlines`);
  rows.push({ caseId, revisionId: front.revisionId, collarOutlineEntityIds: collar.map(({ id }) => id),
    collarPaintIndices: collar.map(({ index }) => index), necklineEntityIds: neckline.map(({ id }) => id),
    necklinePaintIndices: neckline.map(({ index }) => index), necklinePathData: neckline.map(({ d }) => d),
    productionOrderAlreadyMatchesProposedOverdraw: true, proposedReorderWouldBeNoOp: true });
}
const report = { sourceRevision: 'live-draft:woven-shirt:14:14', configurations: rows.length,
  sourceLineCounts: { collarOutlinePaths: 4, frontNecklineStrokes: 2 },
  finding: 'The production SVG already paints both complete body-neckline paths after the four projected upper/under-collar outline paths in every option. Drawing the complete neckline over the collar is not a new layer-order solution; it is current behavior and leaves the two visible crossing/contact stations unchanged.',
  candidateSvgMutation: false, productionChanged: false, rows };
if (rows.length !== 28) throw new Error(`Expected all 28 Woven options; got ${rows.length}`);
await (await import('node:fs/promises')).writeFile(new URL('./woven-neckline-paint-order-matrix.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(JSON.stringify({ configurations: rows.length, sourceRevision: report.sourceRevision,
  productionOrderAlreadyMatchesProposedOverdraw: rows.every((row) => row.productionOrderAlreadyMatchesProposedOverdraw),
  proposedReorderWouldBeNoOp: rows.every((row) => row.proposedReorderWouldBeNoOp) }, null, 2));
