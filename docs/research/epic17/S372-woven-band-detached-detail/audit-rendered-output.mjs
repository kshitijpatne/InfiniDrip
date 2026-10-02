import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const folder = dirname(fileURLToPath(import.meta.url));
const output = join(folder, "production-replay");
const previous = join(dirname(folder), "S363-woven-pom-leader-readability", "production-replay");
const matrix = JSON.parse(await readFile(join(output, "matrix.json"), "utf8"));
assert.equal(matrix.configurations, 28);
assert.equal(matrix.faceRequests, 56);
assert.deepEqual(matrix.browserErrors, []);
const rows = [];
let frontEmitted = 0;
let frontHeld = 0;
let backEmitted = 0;
for (const item of matrix.cases) {
  const faceFiles = new Map();
  for (const face of item.faces) {
    const filename = `${item.caseId}-${face.kind.toLowerCase()}.json`;
    faceFiles.set(face.kind, JSON.parse(await readFile(join(output, filename), "utf8")));
  }
  const back = faceFiles.get("BACK_FLAT");
  assert.ok(back, `${item.caseId}: missing BACK_FLAT response`);
  if (back.svgCount > 0) {
    assert.equal(back.revisionId, "live-draft:woven-shirt:14:14");
    const svg = back.svg;
    const has = (value) => svg.includes(value);
    assert.ok(has('data-entity-id="flat:woven-shirt:BACK_FLAT:component:sleeveBand:outline:detached-detail:left"'));
    assert.ok(has('data-entity-id="flat:woven-shirt:BACK_FLAT:component:sleeveBand:outline:detached-detail:right"'));
    assert.ok(has('data-entity-id="flat:woven-shirt:BACK_FLAT:mark:sleeveBand:bandFold:detached-detail:left"'));
    assert.ok(has('data-entity-id="flat:woven-shirt:BACK_FLAT:mark:sleeveBand:bandFold:detached-detail:right"'));
    assert.ok(!has('data-entity-id="flat:woven-shirt:BACK_FLAT:component:sleeveBand:outline"'));
    assert.ok(has("DETAIL ONLY—not at assembly location"));
    assert.ok(has("source stitch: sleeveBand.top ↔ full sleeve.hem; BACK receiver interval [0,0.5]"));
    assert.equal((svg.match(/data-revision-id="live-draft:woven-shirt:14:14"/gu) ?? []).length > 0, true);
    assert.equal(back.issueCount, 0);
    backEmitted += 1;
  }
  const front = faceFiles.get("FRONT_FLAT");
  if (front.svgCount > 0) {
    frontEmitted += 1;
    const current = await readFile(join(output, `${item.caseId}-front_flat.svg`), "utf8");
    const baseline = await readFile(join(previous, `${item.caseId}-front_flat.svg`), "utf8");
    assert.equal(current, baseline, `${item.caseId}: front output changed`);
  } else frontHeld += 1;
  rows.push({ caseId: item.caseId, back: { status: back.svgCount > 0 ? "emitted" : "held",
    issues: back.issueCount, detachedOutlinePair: back.svgCount > 0, bandFoldPair: back.svgCount > 0 },
  front: { status: front.svgCount > 0 ? "emitted" : "held", issues: front.issueCount } });
}
assert.equal(backEmitted, 28);
assert.equal(frontEmitted, 3);
assert.equal(frontHeld, 25);
const audit = { revisionId: "live-draft:woven-shirt:14:14", configurations: 28, faceRequests: 56,
  back: { emitted: backEmitted, allHaveDetachedOutlineAndBandFoldPairs: true, allHaveSourceStitchDisclaimer: true },
  front: { emitted: frontEmitted, held: frontHeld, emittedSvgByteIdenticalToS363: true },
  browserErrors: 0, cases: rows };
await writeFile(join(folder, "rendered-output-audit.json"), `${JSON.stringify(audit, null, 2)}\n`);
console.log(JSON.stringify({ ...audit, cases: undefined }, null, 2));
