import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const folder = fileURLToPath(new URL("./", import.meta.url));
const matrix = JSON.parse(await readFile(new URL("./production-rendered/matrix.json", import.meta.url), "utf8"));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const rows = [];
for (const item of matrix.cases) {
  const face = item.faces.find((candidate) => candidate.kind === "FRONT_FLAT");
  await page.setContent(face.svg, { waitUntil: "load" });
  const audit = await page.locator("svg").evaluate((root) => {
    const paths = [...root.querySelectorAll('path[data-entity-id^="flat:woven-shirt:FRONT_FLAT:view-seam:front:neckline"]')]
      .filter((path) => !path.getAttribute("data-entity-id")?.includes("view-seam-boundary"));
    return paths.map((path) => {
      const maskRef = path.getAttribute("mask") ?? "";
      const maskId = maskRef.match(/#([^)]*)/u)?.[1] ?? "";
      const mask = root.querySelector(`[id="${CSS.escape(maskId)}"]`);
      const maskPath = mask?.querySelector('path[fill="#000"]');
      if (!maskPath) return { entityId: path.getAttribute("data-entity-id"), maskId, missingMask: true };
      const length = path.getTotalLength();
      const sampleCount = 2000;
      let firstCovered = -1;
      for (let index = 0; index <= sampleCount; index += 1) {
        const at = path.getPointAtLength(length * index / sampleCount);
        const point = root.createSVGPoint();
        point.x = at.x; point.y = at.y;
        if (maskPath.isPointInFill(point)) { firstCovered = index; break; }
      }
      const next = firstCovered >= 0 ? path.getPointAtLength(length * Math.min(1, (firstCovered + 3) / sampleCount)) : null;
      const nextPoint = next ? root.createSVGPoint() : null;
      if (nextPoint && next) { nextPoint.x = next.x; nextPoint.y = next.y; }
      return { entityId: path.getAttribute("data-entity-id"), sourceId: path.getAttribute("data-source-id"),
        revisionId: path.getAttribute("data-revision-id"), maskId, lengthCm: length,
        firstLeafCoverageDistanceCm: firstCovered < 0 ? null : length * firstCovered / sampleCount,
        transitionsIntoLeafMask: !!nextPoint && maskPath.isPointInFill(nextPoint),
        exactDecisionMask: maskId.includes("G04-S457-WOVEN-NECKLINE-LEAF-MASK-underCollar-upperCollar") };
    });
  });
  rows.push({ caseId: item.caseId, revisionId: face.revisionId, necklinePaths: audit });
}
await browser.close();
const distances = rows.flatMap((row) => row.necklinePaths.map((path) => path.firstLeafCoverageDistanceCm).filter(Number.isFinite));
const summary = { sourceRevision: "live-draft:woven-shirt:14:14", configurations: rows.length,
  necklineStrokeInstances: rows.reduce((sum, row) => sum + row.necklinePaths.length, 0),
  exactDecisionMaskInstances: rows.reduce((sum, row) => sum + row.necklinePaths.filter((path) => path.exactDecisionMask).length, 0),
  missingMaskInstances: rows.reduce((sum, row) => sum + row.necklinePaths.filter((path) => path.missingMask).length, 0),
  minVisibleOpenVLengthCm: Math.min(...distances), maxVisibleOpenVLengthCm: Math.max(...distances), rows };
assert.equal(rows.length, 28);
assert.equal(summary.necklineStrokeInstances, 56);
assert.equal(summary.exactDecisionMaskInstances, 56);
assert.equal(summary.missingMaskInstances, 0);
assert.ok(rows.every((row) => row.revisionId === summary.sourceRevision
  && row.necklinePaths.every((path) => path.revisionId === summary.sourceRevision && path.transitionsIntoLeafMask)));
await writeFile(join(folder, "front-leaf-mask-audit.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ ...summary, rows: undefined }, null, 2));
