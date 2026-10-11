import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const manifest = JSON.parse(await readFile(resolve(root, "fixture-manifest.json"), "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const positive = manifest.fixtures.filter((fixture) => fixture.expectedClosedOutlineCount !== undefined);
const negative = manifest.fixtures.filter((fixture) => fixture.invalidPairCount !== undefined);

assert.equal(positive.length, 6);
assert.equal(negative.length, 1);
assert.equal(manifest.unitsDisclosure.includes("does not declare DXF drawing units"), true);

for (const fixture of manifest.fixtures) {
  const bytes = await readFile(resolve(root, fixture.file));
  assert.equal(sha256(bytes), fixture.sha256, `${fixture.file} SHA-256`);
  assert.equal(bytes.byteLength, fixture.bytes, `${fixture.file} byte length`);
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  if (fixture.invalidPairCount !== undefined) {
    assert.equal(lines.length % 2, 1, "negative control must have an unmatched group code");
    assert.equal(lines.at(-1), "0", "negative control ends with a group code that has no value");
    continue;
  }

  assert.equal(lines.length % 2, 0, `${fixture.file} complete group pairs`);
  const pairs = [];
  for (let index = 0; index < lines.length; index += 2) {
    assert.match(lines[index], /^\d+$/, `${fixture.file} numeric group code`);
    pairs.push([Number(lines[index]), lines[index + 1]]);
  }
  assert.deepEqual(pairs.slice(0, 2), [[0, "SECTION"], [2, "ENTITIES"]]);
  assert.deepEqual(pairs.slice(-2), [[0, "ENDSEC"], [0, "EOF"]]);
  const entityStarts = pairs.map(([code, value], index) => code === 0 ? { value, index } : null).filter(Boolean);
  const observed = Object.fromEntries([...new Set(entityStarts.map((entry) => entry.value))]
    .sort().map((type) => [type, entityStarts.filter((entry) => entry.value === type).length]));
  assert.deepEqual(observed, fixture.entityCounts, `${fixture.file} entity inventory`);
  const layers = [...new Set(pairs.filter(([code]) => code === 8).map(([, value]) => value))].sort();
  assert.deepEqual(layers, fixture.layers, `${fixture.file} layer inventory`);

  const polylines = entityStarts.filter((entity) => entity.value === "POLYLINE");
  let closedCount = 0;
  for (const entity of polylines) {
    const nextEntity = entityStarts.find((candidate) => candidate.index > entity.index)?.index ?? pairs.length;
    const header = pairs.slice(entity.index, nextEntity);
    assert.equal(header.some(([code, value]) => code === 70 && value === "1"), true, `${fixture.file} closed polyline`);
    closedCount += 1;
  }
  assert.equal(closedCount, fixture.expectedClosedOutlineCount, `${fixture.file} cut/sew outline count`);
  assert.equal(fixture.observedClosedPolylineCount, closedCount, `${fixture.file} generator inventory agrees`);
}

const sizes = positive.filter((fixture) => fixture.file.startsWith("fixtures/tee-grade-") && fixture.gradeStep !== undefined)
  .map((fixture) => [fixture.size, fixture.gradeStep]);
assert.deepEqual(sizes, [["XS", -2], ["M", 0], ["XL", 2]]);
console.log(JSON.stringify({ positiveFixtures: positive.length, negativeFixtures: negative.length, sizeSeries: sizes, hashesAndStructure: "PASS" }, null, 2));
