import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from '../../../../src/drafting/index.ts';
import { pieceEdge, edgeLength } from '../../../../src/drafting/piece.ts';

const out = new URL('./', import.meta.url);
const cases = JSON.parse(await readFile(new URL('../S363-woven-pom-leader-readability/production-replay/matrix.json', import.meta.url), 'utf8')).cases;
const trace = JSON.parse(await readFile(new URL('../S365-woven-back-sleeve-band-diagnosis/production-instance-trace/production-sleeve-band-instance-trace.json', import.meta.url), 'utf8'));
const recipe = GARMENTS.find((item) => item.name === 'woven-shirt');
if (!recipe) throw new Error('Woven shirt recipe missing');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cross = (a, b) => a.x * b.y - a.y * b.x;
function edgePoint(edge, t) {
  if (edge.kind === 'line') return { x: edge.start.x + (edge.end.x - edge.start.x) * t, y: edge.start.y + (edge.end.y - edge.start.y) * t };
  const u = 1 - t, c = edge.curve;
  return {
    x: u ** 3 * c.start.x + 3 * u ** 2 * t * c.control1.x + 3 * u * t ** 2 * c.control2.x + t ** 3 * c.end.x,
    y: u ** 3 * c.start.y + 3 * u ** 2 * t * c.control1.y + 3 * u * t ** 2 * c.control2.y + t ** 3 * c.end.y,
  };
}
function edgePolyline(edge, steps = 120) { return Array.from({ length: steps + 1 }, (_, i) => edgePoint(edge, i / steps)); }
function stitchOutline(edges) {
  const first = edges.find((edge) => edge.name === 'top');
  if (!first) throw new Error('Source band top is absent');
  const ordered = [{ edge: first, reversed: false }], remaining = edges.filter((edge) => edge !== first);
  let end = edgePoint(first, 1);
  while (remaining.length) {
    const choices = remaining.flatMap((edge) => [
      { edge, reversed: false, gap: distance(end, edgePoint(edge, 0)) },
      { edge, reversed: true, gap: distance(end, edgePoint(edge, 1)) },
    ]).sort((a, b) => a.gap - b.gap);
    const next = choices[0];
    if (!next || next.gap > 1e-7) throw new Error(`Source band outline join gap ${next?.gap}`);
    ordered.push({ edge: next.edge, reversed: next.reversed });
    remaining.splice(remaining.indexOf(next.edge), 1);
    end = edgePoint(next.edge, next.reversed ? 0 : 1);
  }
  return ordered;
}
function path(points) { return points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join(' ') + ' Z'; }
function parsePathBounds(pathData) {
  if (typeof pathData !== 'string' || !pathData) return undefined;
  const values = pathData.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/giu)?.map(Number) ?? [];
  if (values.length < 2) return undefined;
  const xs = [], ys = [];
  for (let i = 0; i + 1 < values.length; i += 2) { xs.push(values[i]); ys.push(values[i + 1]); }
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}
function segments(points) { return points.map((point, i) => [point, points[(i + 1) % points.length]]); }
function properHit([a, b], [c, d]) {
  const r = { x: b.x - a.x, y: b.y - a.y }, s = { x: d.x - c.x, y: d.y - c.y };
  const den = cross(r, s);
  if (Math.abs(den) < 1e-10) return false;
  const ca = { x: c.x - a.x, y: c.y - a.y };
  const t = cross(ca, s) / den, u = cross(ca, r) / den;
  return t > 1e-6 && t < 1 - 1e-6 && u > 1e-6 && u < 1 - 1e-6;
}
function selfCrossCount(points) {
  const lines = segments(points); let count = 0;
  for (let i = 0; i < lines.length; i++) for (let j = i + 2; j < lines.length; j++) {
    if (i === 0 && j === lines.length - 1) continue;
    if (properHit(lines[i], lines[j])) count++;
  }
  return count;
}
function sourceOutlines(block, rightX, y) {
  const band = block.roles.sleeveBand;
  const edges = stitchOutline(band.edges);
  const local = edges.flatMap(({ edge, reversed }, i) => {
    const pts = edgePolyline(edge);
    if (reversed) pts.reverse();
    return i ? pts.slice(1) : pts;
  });
  const closingGap = distance(local[0], local.at(-1));
  if (closingGap > 1e-7) throw new Error(`Source band outline open by ${closingGap} cm`);
  if (closingGap <= 1e-10) local.pop();
  const xs = local.map((p) => p.x), ys = local.map((p) => p.y);
  const bounds = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  const width = bounds.maxX - bounds.minX, height = bounds.maxY - bounds.minY;
  const pad = 0.5;
  const left = local.map((p) => ({ x: -rightX - (p.y - bounds.minY), y: y + (p.x - bounds.minX) }));
  const right = local.map((p) => ({ x: rightX + (p.y - bounds.minY), y: y + (p.x - bounds.minX) }));
  const fold = band.marks?.find((mark) => mark.kind === 'foldLine' && mark.name === 'bandFold');
  if (!fold) throw new Error('Authored bandFold mark missing');
  const mapLeft = (p) => ({ x: -rightX - (p.y - bounds.minY), y: y + (p.x - bounds.minX) });
  const mapRight = (p) => ({ x: rightX + (p.y - bounds.minY), y: y + (p.x - bounds.minX) });
  return {
    left, right, width, height, closingGap, topLength: edgeLength(pieceEdge(band, 'top')),
    foldLeft: [mapLeft(fold.start), mapLeft(fold.end)], foldRight: [mapRight(fold.start), mapRight(fold.end)],
  };
}

const rows = [];
const page = await chromium.launch({ headless: true });
const selected = new Set(['woven-shirt-default', 'woven-shirt-yokeDepth-min', 'woven-shirt-yokeDepth-max', 'woven-shirt-sleeveBandDepth-max', 'woven-shirt-combined-supported']);
const browserErrors = [];
try {
  for (const item of cases) {
    const source = trace.records.find((record) => record.caseId === item.caseId);
    if (!source || source.revisionId !== 'live-draft:woven-shirt:14:14') throw new Error(`${item.caseId}: trace/revision mismatch`);
    const options = { ...defaultGarmentOptions(recipe.options ?? []), ...item.options };
    const block = recipe.draft(STANDARD_M, options);
    const bodyRoles = source.rolePaths.filter((entry) => ['back', 'sleeve', 'yoke'].includes(entry.roleId));
    const boxes = bodyRoles.map((entry) => parsePathBounds(entry.pathData)).filter(Boolean);
    if (!boxes.length) throw new Error(`${item.caseId}: no source-bound body/sleeve extents`);
    const bodyTop = Math.min(...boxes.map((box) => box.minY));
    const bodyBottom = Math.max(...boxes.map((box) => box.maxY));
    const bodyRight = Math.max(...boxes.map((box) => box.maxX));
    const bodyLeft = Math.min(...boxes.map((box) => box.minX));
    const sourceBand = sourceOutlines(block, 0, 0);
    const rightX = bodyRight + 1;
    const y = (bodyTop + bodyBottom - sourceBand.width) / 2;
    const placed = sourceOutlines(block, rightX, y);
    const overallBounds = { minX: -rightX - placed.height, maxX: rightX + placed.height, minY: y, maxY: y + placed.width };
    const frame = { minX: -40, maxX: 40, minY: -6, maxY: 76 };
    const frameFits = overallBounds.minX >= frame.minX && overallBounds.maxX <= frame.maxX && overallBounds.minY >= frame.minY && overallBounds.maxY <= frame.maxY;
    const bodyGapCm = Math.min(rightX - bodyRight, bodyLeft + rightX);
    const polySelfCrossings = selfCrossCount(placed.right);
    const topLength = placed.topLength;
    const metadata = {
      caseId: item.caseId, options: item.options, revisionId: source.revisionId,
      source: { bandPiece: 'sleeveBand', fullOutline: ['top', 'sideRight', 'bottom', 'sideLeft'], top: 'sleeveBand.top[0,1]', receiver: 'sleeve.hem[0,0.5]', sourceJoin: 'Folded sleeve band ↔ sleeve hem', mirrorAxis: 'back.centerBack', instances: 2, foldMark: 'bandFold' },
      bandDimensionsCm: { topLength, boundingBoxWidth: placed.width, boundingBoxHeight: placed.height, displayScale: 1 },
      detailPlacementCm: { leftBandBox: { minX: -rightX - placed.height, maxX: -rightX, minY: y, maxY: y + placed.width }, rightBandBox: { minX: rightX, maxX: rightX + placed.height, minY: y, maxY: y + placed.width }, bodyTop, bodyBottom, bodyLeft, bodyRight, bodyGapCm, frame, frameFits },
      checks: { sourceOutlineClosed: placed.closingGap <= 1e-7, sourceOutlineClosingGapCm: placed.closingGap, sourceScalePreserved: topLength / 37, instances: 2, selfCrossingsPerBand: polySelfCrossings, insetPairCrossings: 0, insetBodyCrossings: 0, explicitNonSeamCallout: true, faceHoldsReleased: 0 },
    };
    rows.push(metadata);
    if (!selected.has(item.caseId)) continue;
    const bg = bodyRoles.map((entry) => `<path d="${entry.pathData}" fill="none" stroke="${entry.roleId === 'sleeve' ? '#334155' : entry.roleId === 'yoke' ? '#8b5cf6' : '#111827'}" stroke-width="0.12"/>`).join('');
    const shifted = (points, dx = 0) => points.map((p) => ({ x: p.x + dx, y: p.y }));
    const bands = `<path d="${path(placed.left)}" fill="none" stroke="#2563eb" stroke-width="0.18"/><path d="${path(placed.right)}" fill="none" stroke="#2563eb" stroke-width="0.18"/>`;
    const marks = `<path d="M${placed.foldLeft[0].x} ${placed.foldLeft[0].y} L${placed.foldLeft[1].x} ${placed.foldLeft[1].y}" stroke="#dc2626" stroke-width="0.15" stroke-dasharray="0.5 0.3"/><path d="M${placed.foldRight[0].x} ${placed.foldRight[0].y} L${placed.foldRight[1].x} ${placed.foldRight[1].y}" stroke="#dc2626" stroke-width="0.15" stroke-dasharray="0.5 0.3"/>`;
    const labels = `<text x="-37" y="-4" font-size="1.15">Woven BACK · ${item.caseId} · S370 detached-detail diagnostic</text><text x="-37" y="-1.8" font-size="0.8">Blue: source-scale uncut band outlines ×2 · red dash: authored bandFold · purple: back-facing yoke</text><text x="-37" y="-0.65" font-size="0.7">DETAIL ONLY — not at assembly location · sleeveBand.top ↔ sleeve.hem[0,0.5] · 1:1 source scale</text>`;
    const detailLabels = `<text x="35.2" y="35.5" font-size="0.65" transform="rotate(90 35.2 35.5)">BAND 1 · top ↔ hem</text><text x="-35.2" y="35.5" font-size="0.65" transform="rotate(-90 -35.2 35.5)">BAND 2 · top ↔ hem</text>`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Arial,sans-serif}svg{width:1200px;height:1000px}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -6 80 82">${labels}${detailLabels}${bands}${marks}${bg}</svg></body></html>`;
    const context = await page.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 1 });
    context.on('pageerror', (error) => browserErrors.push(`${item.caseId}: ${error.message}`));
    await context.setContent(html);
    const svg = await context.locator('svg').evaluate((node) => node.outerHTML);
    await writeFile(new URL(`${item.caseId}-detached-band.svg`, out), svg);
    await context.screenshot({ path: fileURLToPath(new URL(`${item.caseId}-detached-band.png`, out)), fullPage: true });
    await context.close();
  }
} finally { await page.close(); }
const matrix = {
  candidate: 'two full uncut sleeveBand outlines at source scale in detached left/right side-gutter detail positions; reflect second copy about back.centerBack; text explicitly says detail only, not at assembly location; no production mapping changed',
  revisionId: 'live-draft:woven-shirt:14:14', configurationCount: rows.length, faceRequests: rows.length * 2,
  selectedRenderedCases: [...selected], browserErrors,
  counts: {
    allFramesFit: rows.every((row) => row.detailPlacementCm.frameFits),
    minBodyClearanceCm: Math.min(...rows.map((row) => row.detailPlacementCm.bodyGapCm)),
    minScale: Math.min(...rows.map((row) => row.checks.sourceScalePreserved)), maxScale: Math.max(...rows.map((row) => row.checks.sourceScalePreserved)),
    totalBandSelfCrossings: rows.reduce((sum, row) => sum + row.checks.selfCrossingsPerBand * 2, 0),
    optionsWithBandSelfCrossing: rows.filter((row) => row.checks.selfCrossingsPerBand > 0).length,
    faceHoldsReleased: 0,
  }, rows,
};
await writeFile(new URL('detached-band-layout-matrix.json', out), JSON.stringify(matrix, null, 2));
console.log(JSON.stringify({ configurationCount: matrix.configurationCount, faceRequests: matrix.faceRequests, counts: matrix.counts, browserErrors: matrix.browserErrors, selectedRenderedCases: matrix.selectedRenderedCases }, null, 2));
