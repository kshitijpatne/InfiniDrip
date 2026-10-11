import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const folder = new URL('./', import.meta.url);
const cases = JSON.parse(await readFile(new URL('../S406-woven-approved-view-conventions/production-replay/matrix.json', import.meta.url), 'utf8'))
  .cases.filter(row => row.caseId.startsWith('woven-shirt-'));
const layout = JSON.parse(await readFile(new URL('../S370-woven-band-detail-feasibility/detached-band-layout-matrix.json', import.meta.url), 'utf8'));
assert.equal(cases.length, 28);
const taperValues = Array.from({ length: 13 }, (_, i) => i * 0.5);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on('pageerror', error => browserErrors.push(error.message));
page.on('console', message => { if (message.type() === 'error') browserErrors.push(message.text()); });
await page.goto('http://127.0.0.1:4191/', { waitUntil: 'networkidle' });
const outputs = await page.evaluate(async ({ cases, taperValues }) => {
  const [{ GARMENTS }, { STANDARD_M }, { defaultGarmentOptions }, { compileTechnicalFlatLiveView },
    { renderTechnicalFlatSvg, createBrowserTechnicalFlatTextMeasurer }] = await Promise.all([
    import('/src/drafting/recipe.ts'), import('/src/drafting/measurements.ts'), import('/src/drafting/options.ts'),
    import('/src/render/technical-flat-live.ts'), import('/src/render/technical-flat-svg.ts'),
  ]);
  const recipe = GARMENTS.find(item => item.name === 'woven-shirt');
  if (!recipe) throw new Error('Woven recipe missing');
  const revisionId = 'live-draft:woven-shirt:14:14';
  const measureText = createBrowserTechnicalFlatTextMeasurer(document);
  const render = (block, options, kind, caseId, taper) => {
    const live = compileTechnicalFlatLiveView({ recipe, block, revisionId, kind, placements: [],
      colorHex: '#3669a4', texture: 'woven', shine: 24 });
    if (!live.view) return { kind, compileIssues: live.issues, rendererIssues: [], svg: null };
    const result = renderTechnicalFlatSvg(live.view, { measureText, colorway: live.colorway,
      title: `S447 diagnostic taper ${taper} cm ${kind} — ${caseId}` });
    return { kind, compileIssues: live.issues, rendererIssues: result.issues, svg: result.svg,
      options, caseId, taper, revisionId };
  };
  const result = [];
  for (const taper of taperValues) for (const row of cases) {
    const options = { ...defaultGarmentOptions(recipe.options ?? []), ...row.options };
    const block = recipe.draft(STANDARD_M, options);
    const sleeve = block.roles.sleeve;
    const band = block.roles.sleeveBand;
    const width = sleeve.edges.find(edge => edge.name === 'capRight').curve.end.x;
    const rightHem = sleeve.edges.find(edge => edge.name === 'sideRight').end;
    const leftHem = sleeve.edges.find(edge => edge.name === 'sideLeft').start;
    const hem = sleeve.edges.find(edge => edge.name === 'hem');
    const hemY = hem.start.y;
    Object.assign(rightHem, { x: width - taper });
    Object.assign(leftHem, { x: taper });
    Object.assign(hem.start, { x: width - taper });
    Object.assign(hem.end, { x: taper });
    const top = band.edges.find(edge => edge.name === 'top');
    const bandSideRight = band.edges.find(edge => edge.name === 'sideRight');
    const bottom = band.edges.find(edge => edge.name === 'bottom');
    const fold = band.marks.find(mark => mark.name === 'bandFold');
    const finishedOpening = width - 2 * taper;
    Object.assign(top.start, { x: 0, y: 0 }); Object.assign(top.end, { x: finishedOpening, y: 0 });
    Object.assign(bandSideRight.start, { x: finishedOpening, y: 0 });
    Object.assign(bandSideRight.end, { x: finishedOpening, y: bandSideRight.end.y });
    Object.assign(bottom.start, { x: finishedOpening }); Object.assign(bottom.end, { x: 0 });
    Object.assign(fold.start, { x: 0, y: fold.start.y }); Object.assign(fold.end, { x: finishedOpening, y: fold.end.y });
    const exactHemLength = Math.hypot(hem.start.x - hem.end.x, hem.start.y - hem.end.y);
    const exactBandTopLength = Math.hypot(top.start.x - top.end.x, top.start.y - top.end.y);
    result.push({ taper, caseId: row.caseId, options, hemY, finishedOpening,
      hemLength: exactHemLength, bandTopLength: exactBandTopLength,
      faces: ['FRONT_FLAT', 'BACK_FLAT'].map(kind => render(block, options, kind, row.caseId, taper)) });
  }
  return result;
}, { cases, taperValues });
await browser.close();

function flatten(d, n = 48) {
  const tokens = d.match(/[MLCZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g) ?? [];
  const segs = [], polys = []; let i = 0, cmd = '', cur = null, start = null, poly = [];
  while (i < tokens.length) {
    const token = tokens[i++];
    if (/^[MLCZ]$/.test(token)) { cmd = token; if (token === 'Z' && cur && start) { segs.push({ a: cur, b: start }); poly.push(start); polys.push(poly); poly = []; cur = start; } continue; }
    const point = { x: +token, y: +tokens[i++] };
    if (cmd === 'M') { cur = point; start = point; poly = [point]; cmd = 'L'; }
    else if (cmd === 'L') { segs.push({ a: cur, b: point }); poly.push(point); cur = point; }
    else if (cmd === 'C') {
      const c1 = point, c2 = { x: +tokens[i++], y: +tokens[i++] }, end = { x: +tokens[i++], y: +tokens[i++] }, s = cur;
      let prev = s;
      for (let k = 1; k <= n; k++) { const t = k / n, u = 1 - t, q = { x: u ** 3 * s.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t ** 3 * end.x, y: u ** 3 * s.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t ** 3 * end.y }; segs.push({ a: prev, b: q }); poly.push(q); prev = q; }
      cur = end;
    } else throw new Error(`Unsupported SVG path command ${cmd}`);
  }
  if (poly.length) polys.push(poly);
  return { segs, polys };
}
function proper(a, b) {
  const rx = a.b.x - a.a.x, ry = a.b.y - a.a.y, sx = b.b.x - b.a.x, sy = b.b.y - b.a.y;
  const det = rx * sy - ry * sx; if (Math.abs(det) < 1e-10) return undefined;
  const qx = b.a.x - a.a.x, qy = b.a.y - a.a.y, t = (qx * sy - qy * sx) / det, u = (qx * ry - qy * rx) / det;
  return t > 1e-7 && t < 1 - 1e-7 && u > 1e-7 && u < 1 - 1e-7 ? { x: a.a.x + t * rx, y: a.a.y + t * ry } : undefined;
}
function crossings(a, b) { let n = 0; for (const x of a) for (const y of b) if (proper(x, y)) n++; return n; }
function pointSegment(p, a, b) { const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1))); return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy); }
function segDistance(a,b) { if (proper(a,b)) return 0; return Math.min(pointSegment(a.a,b.a,b.b),pointSegment(a.b,b.a,b.b),pointSegment(b.a,a.a,a.b),pointSegment(b.b,a.a,a.b)); }
function hit(a,b,c,d) { const rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y,det=rx*sy-ry*sx; if(Math.abs(det)<1e-10)return undefined;const qx=c.x-a.x,qy=c.y-a.y;return {t:(qx*sy-qy*sx)/det,u:(qx*ry-qy*rx)/det}; }
function inside(p, poly) { let result=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[j],b=poly[i];const c=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);if(Math.abs(c)<1e-8&&p.x>=Math.min(a.x,b.x)-1e-8&&p.x<=Math.max(a.x,b.x)+1e-8&&p.y>=Math.min(a.y,b.y)-1e-8&&p.y<=Math.max(a.y,b.y)+1e-8)return false;if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)result=!result;}return result; }
function enters(seg, poly) { if (inside(seg.a,poly)||inside(seg.b,poly)) return true; const cuts=[0,1],dx=seg.b.x-seg.a.x,dy=seg.b.y-seg.a.y; for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],h=hit(seg.a,seg.b,a,b);if(h&&h.t>=-1e-10&&h.t<=1+1e-10&&h.u>=-1e-10&&h.u<=1+1e-10)cuts.push(Math.max(0,Math.min(1,h.t)));}cuts.sort((a,b)=>a-b);for(let i=1;i<cuts.length;i++){const t=(cuts[i-1]+cuts[i])/2;if(inside({x:seg.a.x+t*dx,y:seg.a.y+t*dy},poly))return true;}return false; }
function crossesRect(seg, box, pad = 0.05) { const r={minX:box.minX-pad,maxX:box.maxX+pad,minY:box.minY-pad,maxY:box.maxY+pad};let lo=0,hi=1,dx=seg.b.x-seg.a.x,dy=seg.b.y-seg.a.y;for(const [p,q] of [[-dx,seg.a.x-r.minX],[dx,r.maxX-seg.a.x],[-dy,seg.a.y-r.minY],[dy,r.maxY-seg.a.y]]){if(Math.abs(p)<1e-12){if(q<0)return false;continue;}const v=q/p;if(p<0)lo=Math.max(lo,v);else hi=Math.min(hi,v);if(lo>hi)return false;}return true; }
const parser = new JSDOM().window.DOMParser;
const analysis = [];
for (const candidate of outputs) {
  const back = candidate.faces.find(face => face.kind === 'BACK_FLAT');
  const front = candidate.faces.find(face => face.kind === 'FRONT_FLAT');
  const rowLayout = layout.rows.find(row => row.caseId === candidate.caseId);
  const base = { taper: candidate.taper, caseId: candidate.caseId, finishedOpening: candidate.finishedOpening,
    hemLength: candidate.hemLength, bandTopLength: candidate.bandTopLength,
    seamLengthDelta: Math.abs(candidate.hemLength - candidate.bandTopLength),
    compileIssues: [...front.compileIssues, ...back.compileIssues], rendererIssues: [...front.rendererIssues, ...back.rendererIssues] };
  for (const [kind, face] of [['FRONT_FLAT', front], ['BACK_FLAT', back]]) {
    if (!face.svg) { base[kind] = { emitted: false }; continue; }
    const document = new parser().parseFromString(face.svg, 'image/svg+xml');
    const sleeves = [...document.querySelectorAll('path[data-entity-id*="component:sleeve:outline"]')].map(node => flatten(node.getAttribute('d')));
    const bodyNodes = [...document.querySelectorAll(kind === 'BACK_FLAT'
      ? 'path[data-entity-id*="component:back:outline"],path[data-entity-id*="component:yoke:outline"]'
      : 'path[data-entity-id*="component:front:outline"],path[data-entity-id*="component:yoke:outline"]')]
      .filter(node => !node.getAttribute('data-entity-id').includes('fold-reflection'));
    const pair = sleeves.length === 2 ? crossings(sleeves[0].segs, sleeves[1].segs) : null;
    const bodyCrossings = bodyNodes.map(node => ({ id: node.getAttribute('data-entity-id'), count: sleeves.reduce((sum, sleeve) => sum + crossings(sleeve.segs, flatten(node.getAttribute('d')).segs), 0) }));
    const fills = [...document.querySelectorAll('path[data-colorway-fill-for*="component:back:outline"],path[data-colorway-fill-for*="component:yoke:outline"],path[data-colorway-fill-for*="component:front:outline"]')]
      .map(node => ({ id: node.getAttribute('data-colorway-fill-for'), polys: flatten(node.getAttribute('d'), 48).polys }));
    const penetrations = sleeves.reduce((sum, sleeve) => sum + sleeve.segs.reduce((n, segment) => n + fills.reduce((f, fill) => f + fill.polys.reduce((pn, poly) => pn + (enters(segment, poly) ? 1 : 0), 0), 0), 0), 0);
    const viewBox = face.svg.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
    const points = sleeves.flatMap(sleeve => sleeve.segs.flatMap(segment => [segment.a, segment.b]));
    const frameOK = Boolean(viewBox) && points.every(p => p.x >= viewBox[0] - 1e-5 && p.x <= viewBox[0] + viewBox[2] + 1e-5 && p.y >= viewBox[1] - 1e-5 && p.y <= viewBox[1] + viewBox[3] + 1e-5);
    const detailNodes = [...document.querySelectorAll('path[data-entity-id*="detached-detail"]')].filter(node => node.getAttribute('data-entity-id').includes('sleeveBand:outline:detached-detail'));
    const bandClearance = detailNodes.length ? Math.min(...sleeves.flatMap(sleeve => sleeve.segs.flatMap(seg => detailNodes.flatMap(node => flatten(node.getAttribute('d')).segs.map(detail => segDistance(seg, detail)))))) : null;
    const boxes = [rowLayout?.detailPlacementCm?.leftBandBox, rowLayout?.detailPlacementCm?.rightBandBox].filter(Boolean);
    const bandBoxHits = sleeves.reduce((sum, sleeve) => sum + sleeve.segs.reduce((n, seg) => n + boxes.filter(box => crossesRect(seg, box, 0.05)).length, 0), 0);
    base[kind] = { emitted: true, sleeveOutlineCount: sleeves.length, sleevePairCrossings: pair, bodyCrossings,
      fillPenetrations: penetrations, s370BandMinimumClearance: bandClearance, s370BoxHitsAt005cm: bandBoxHits,
      frameOK, svgLength: face.svg.length, svg: face.svg };
  }
  analysis.push(base);
}

const groupBy = (key, kind, mapper) => Object.fromEntries(taperValues.map(t => {
  const rows = analysis.filter(row => row.taper === t);
  return [String(t), rows.filter(row => mapper(row[kind])).length];
}));
const summary = taperValues.map(t => {
  const rows = analysis.filter(row => row.taper === t);
  const back = rows.map(row => row.BACK_FLAT);
  const front = rows.map(row => row.FRONT_FLAT);
  const baselineFailures = rows.filter(row => row.compileIssues.length || row.rendererIssues.length).length;
  const viableRows = rows.filter(row => {
    const b = row.BACK_FLAT, f = row.FRONT_FLAT;
    return !row.compileIssues.length && !row.rendererIssues.length && b?.emitted && f?.emitted &&
      b.sleeveOutlineCount === 2 && f.sleeveOutlineCount === 2 && b.sleevePairCrossings === 0 && f.sleevePairCrossings === 0 &&
      b.bodyCrossings.every(item => item.count === 0) && f.bodyCrossings.every(item => item.count === 0) &&
      b.fillPenetrations === 0 && f.fillPenetrations === 0 && b.s370BoxHitsAt005cm === 0 && f.s370BoxHitsAt005cm === 0 &&
      b.frameOK && f.frameOK && row.seamLengthDelta < 1e-8;
  });
  return { taperCm: t, finishedOpeningRangeCm: [Math.min(...rows.map(row => row.finishedOpening)), Math.max(...rows.map(row => row.finishedOpening))],
    changedFromAuthoredCm: t - 3, backPairCrossingOptions: back.filter(face => face?.sleevePairCrossings > 0).length,
    backBodyCrossingOptions: back.filter(face => face?.bodyCrossings?.some(item => item.count > 0)).length,
    backFillPenetrationOptions: back.filter(face => face?.fillPenetrations > 0).length,
    backS370BoxCollisionOptions: back.filter(face => face?.s370BoxHitsAt005cm > 0).length,
    backFrameFailures: back.filter(face => !face?.frameOK).length,
    frontCrossingOptions: front.filter(face => face?.sleevePairCrossings > 0 || face?.bodyCrossings?.some(item => item.count > 0)).length,
    compilerOrRendererIssueOptions: baselineFailures, exactHemBandJoinRows: rows.filter(row => row.seamLengthDelta < 1e-8).length,
    fullyViableOptions: viableRows.length };
});
const allClear = summary.filter(row => row.fullyViableOptions === 28).map(row => row.taperCm);
const candidates = analysis.filter(row => allClear.includes(row.taper)).map(row => ({ ...row,
  BACK_FLAT: { ...row.BACK_FLAT, svg: undefined }, FRONT_FLAT: { ...row.FRONT_FLAT, svg: undefined } }));
await mkdir(new URL('./candidate-output/', import.meta.url), { recursive: true });
if (allClear.length) {
  const eligible = analysis.filter(row => allClear.includes(row.taper));
  for (const row of eligible) for (const face of [row.FRONT_FLAT, row.BACK_FLAT]) {
    await writeFile(new URL(`./candidate-output/${row.caseId}-taper-${row.taper}-${face.kind.toLowerCase()}.svg`, import.meta.url), face.svg);
  }
  const screenshots = await chromium.launch({ headless: true });
  const shotPage = await screenshots.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 1 });
  for (const row of eligible.filter(item => ['woven-shirt-default','woven-shirt-collarLeafDepth-min','woven-shirt-collarLeafDepth-max','woven-shirt-combined-supported'].includes(item.caseId))) {
    for (const face of [row.FRONT_FLAT, row.BACK_FLAT]) {
      await shotPage.setContent(face.svg, { waitUntil: 'load' });
      await shotPage.screenshot({ path: new URL(`./candidate-output/${row.caseId}-taper-${row.taper}-${face.kind.toLowerCase()}.png`, import.meta.url).pathname, fullPage: true });
    }
  }
  await screenshots.close();
}
const result = { sourceRevision: 'live-draft:woven-shirt:14:14', candidateParameter: 'wovenSleeve taper', authoredValueCm: 3,
  candidateValuesCm: taperValues, optionsPerValue: 28, facesPerValue: 56, browserErrors, all28OptionSolutions: allClear,
  summary, rows: analysis.map(row => ({ ...row, FRONT_FLAT: { ...row.FRONT_FLAT, svg: undefined }, BACK_FLAT: { ...row.BACK_FLAT, svg: undefined } })) };
await writeFile(new URL('./S447-taper-candidate-matrix.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ sourceRevision: result.sourceRevision, candidateValuesCm: taperValues,
  optionsPerValue: 28, facesPerValue: 56, browserErrors, all28OptionSolutions: allClear, summary }, null, 2));
assert.equal(analysis.length, 13 * 28);
assert.equal(browserErrors.length, 0);
