import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dir = fileURLToPath(new URL('./', import.meta.url));
const sourceDir = fileURLToPath(new URL('../S399-polo-fg-glyph-offset/rendered/', import.meta.url));
const s399 = JSON.parse(await readFile(new URL('../S399-polo-fg-glyph-offset/polo-keyed-marker-trial-matrix.json', import.meta.url), 'utf8'));
const sourceFiles = await readdir(sourceDir);
const candidates = [
  { id: 'west-up-0.8', dx: -0.8, dy: -0.8 }, { id: 'east-up-0.8', dx: 0.8, dy: -0.8 },
  { id: 'west-down-0.8', dx: -0.8, dy: 0.8 }, { id: 'east-down-0.8', dx: 0.8, dy: 0.8 },
  { id: 'west-up-1.2', dx: -1.2, dy: -1.2 }, { id: 'east-up-1.2', dx: 1.2, dy: -1.2 },
  { id: 'west-down-1.2', dx: -1.2, dy: 1.2 }, { id: 'east-down-1.2', dx: 1.2, dy: 1.2 },
];
const svgFor = (caseId) => {
  const file = sourceFiles.find((name) => name === `${caseId}-collar-point.svg`);
  assert.ok(file, `missing S399 SVG for ${caseId}`);
  return join(sourceDir, file);
};
const cases = [];
const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 2400, height: 1800 }, deviceScaleFactor: 1 });
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
try {
  for (const sourceRow of s399.rows) {
    const svg = await readFile(svgFor(sourceRow.caseId), 'utf8');
    assert.equal(sourceRow.revisionId, `live-draft:polo:S399:${sourceRow.caseId}`);
    const markerAt = svg.indexOf('data-entity-id="H:key-marker"');
    assert.notEqual(markerAt, -1, `${sourceRow.caseId}: H group missing`);
    const groupStart = svg.lastIndexOf('<g ', markerAt);
    const groupEnd = svg.indexOf('</g>', markerAt) + 4;
    const group = svg.slice(groupStart, groupEnd);
    const circle = group.match(/<circle\b[^>]*\bcx="([^"]+)"[^>]*\bcy="([^"]+)"[^>]*\br="([^"]+)"[^>]*\/>/u);
    const text = group.match(/<text\b[^>]*\bx="([^"]+)"[^>]*\by="([^"]+)"[^>]*>[\s\S]*?<\/text>/u);
    assert.ok(circle && text, `${sourceRow.caseId}: H geometry missing`);
    assert.deepEqual([Number(circle[1]), Number(circle[2]), Number(circle[3]), Number(text[1]), Number(text[2])], [7, 0, 0.22, 7.45, 0.52]);
    await page.setContent(svg, { waitUntil: 'load' });
    const measurements = await page.evaluate((trialCandidates) => {
      const svgRoot = document.querySelector('svg');
      const marker = svgRoot.querySelector('[data-entity-id="H:key-marker"]');
      const ring = marker.querySelector('circle');
      const glyph = marker.querySelector('text');
      const toRoot = (element, x, y) => {
        const screen = new DOMPoint(x, y).matrixTransform(element.getScreenCTM());
        const p = screen.matrixTransform(svgRoot.getScreenCTM().inverse());
        return { x: p.x, y: p.y };
      };
      const pointSegmentDistance = (p, a, b) => {
        const vx = b.x - a.x; const vy = b.y - a.y;
        const d2 = vx * vx + vy * vy;
        const t = d2 ? Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / d2)) : 0;
        return { distance: Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy)), t };
      };
      const componentPaths = [...svgRoot.querySelectorAll('path[data-entity-id^="flat:polo:FRONT_FLAT:component:"]')].map((path) => {
        const length = path.getTotalLength();
        const count = Math.max(2, Math.ceil(length / 0.05));
        const points = [];
        for (let i = 0; i <= count; i += 1) {
          const p = path.getPointAtLength(length * i / count);
          points.push(toRoot(path, p.x, p.y));
        }
        return { id: path.getAttribute('data-entity-id'), sourceId: path.getAttribute('data-source-id'), width: Number(path.getAttribute('stroke-width') ?? 0.035), points };
      });
      const marks = [...svgRoot.querySelectorAll('g[data-entity-id*="mark:"] circle')].map((circleElement) => {
        const p = toRoot(circleElement, Number(circleElement.getAttribute('cx')), Number(circleElement.getAttribute('cy')));
        return { id: circleElement.parentElement.getAttribute('data-entity-id'), x: p.x, y: p.y, r: Number(circleElement.getAttribute('r')) };
      });
      const texts = [...svgRoot.querySelectorAll('text')].filter((element) => !element.closest('[data-entity-id="H:key-marker"]') && !element.hasAttribute('data-schedule-for'));
      const originalRing = { x: Number(ring.getAttribute('cx')), y: Number(ring.getAttribute('cy')), r: Number(ring.getAttribute('r')) };
      const originalText = { x: Number(glyph.getAttribute('x')), y: Number(glyph.getAttribute('y')) };
      const viewBox = svgRoot.viewBox.baseVal;
      return trialCandidates.map((candidate) => {
        const cx = originalRing.x + candidate.dx; const cy = originalRing.y + candidate.dy;
        const distance = Math.hypot(candidate.dx, candidate.dy);
        const ux = candidate.dx / distance; const uy = candidate.dy / distance;
        const anchor = toRoot(ring, originalRing.x, originalRing.y);
        const edge = toRoot(ring, cx - ux * (originalRing.r + 0.02), cy - uy * (originalRing.r + 0.02));
        const otherPathHits = [];
        const anchorPathContacts = [];
        let minLeaderPathGap = Infinity;
        for (const path of componentPaths) {
          let min = Infinity;
          let nearest = null;
          let anchorDistance = Infinity;
          for (const p of path.points) {
            anchorDistance = Math.min(anchorDistance, Math.hypot(p.x - anchor.x, p.y - anchor.y));
            const result = pointSegmentDistance(p, anchor, edge);
            if (result.t * Math.hypot(edge.x - anchor.x, edge.y - anchor.y) < 0.05) continue;
            if (result.distance < min) { min = result.distance; nearest = { sourcePoint: p, leaderT: result.t }; }
          }
          if (anchorDistance < path.width / 2 + 0.035 / 2 + 0.02) anchorPathContacts.push({ entityId: path.id, sourceId: path.sourceId, centerGapCm: Number(anchorDistance.toFixed(4)) });
          const clearance = min - path.width / 2 - 0.035 / 2;
          if (clearance < minLeaderPathGap) minLeaderPathGap = clearance;
          if (clearance < 0.02) otherPathHits.push({ entityId: path.id, sourceId: path.sourceId, clearanceCm: Number(clearance.toFixed(4)), nearestSourcePointCm: nearest?.sourcePoint, leaderT: Number((nearest?.leaderT ?? 0).toFixed(4)) });
        }
        const movedRing = toRoot(ring, cx, cy);
        const markHits = marks.map((mark) => ({ ...mark, clearanceCm: Math.hypot(mark.x - movedRing.x, mark.y - movedRing.y) - mark.r - originalRing.r - 0.035 })).filter((mark) => mark.clearanceCm < 0.02).map((mark) => ({ entityId: mark.id, clearanceCm: Number(mark.clearanceCm.toFixed(4)) }));
        glyph.setAttribute('x', String(originalText.x + candidate.dx));
        glyph.setAttribute('y', String(originalText.y + candidate.dy));
        const candidateTextBox = glyph.getBoundingClientRect();
        const textHits = texts.filter((other) => {
          const box = other.getBoundingClientRect();
          return candidateTextBox.left < box.right + 2 && candidateTextBox.right > box.left - 2 && candidateTextBox.top < box.bottom + 2 && candidateTextBox.bottom > box.top - 2;
        }).map((other) => ({ entityId: other.getAttribute('data-entity-id'), sourceId: other.getAttribute('data-source-id'), text: other.textContent?.trim() }));
        glyph.setAttribute('x', String(originalText.x)); glyph.setAttribute('y', String(originalText.y));
        const inFrame = cx >= viewBox.x && cx <= viewBox.x + viewBox.width && cy >= viewBox.y && cy <= viewBox.y + viewBox.height;
        return { ...candidate, ringCenter: { x: cx, y: cy }, leaderStart: { x: 7, y: 0 }, leaderEnd: { x: Number((cx - ux * (originalRing.r + 0.02)).toFixed(4)), y: Number((cy - uy * (originalRing.r + 0.02)).toFixed(4)) }, minimumLeaderPathClearanceCm: Number(minLeaderPathGap.toFixed(4)), leaderPathContacts: otherPathHits, anchorPathContacts, ringMarkContacts: markHits, glyphTextContacts: textHits, inFrame };
      });
    }, candidates);
    cases.push({ caseId: sourceRow.caseId, options: sourceRow.options, revisionId: sourceRow.revisionId, candidates: measurements });
  }
} finally {
  await browser.close();
}
assert.deepEqual(errors, []);
const summary = candidates.map((candidate) => {
  const perOption = cases.map((row) => row.candidates.find((entry) => entry.id === candidate.id));
  return {
    id: candidate.id,
    offsetCm: [candidate.dx, candidate.dy],
    options: cases.length,
    optionsWithClearLeader: perOption.filter((entry) => entry.leaderPathContacts.length === 0).length,
    optionsWithOnlyDeclaredSourceStationContacts: perOption.filter((entry) => entry.anchorPathContacts.length > 0 && entry.leaderPathContacts.length === 0).length,
    optionsWithClearRing: perOption.filter((entry) => entry.ringMarkContacts.length === 0).length,
    optionsWithClearGlyph: perOption.filter((entry) => entry.glyphTextContacts.length === 0).length,
    optionsInFrame: perOption.filter((entry) => entry.inFrame).length,
    worstLeaderClearanceCm: Math.min(...perOption.map((entry) => entry.minimumLeaderPathClearanceCm)),
  };
});
const out = { source: 'S399 saved production SVGs; no production mapping changes', configurations: cases.length, browserErrors: errors, candidateOffsetsCm: candidates, summary, cases };
await writeFile(new URL('./h-route-candidate-matrix.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(summary, null, 2));
