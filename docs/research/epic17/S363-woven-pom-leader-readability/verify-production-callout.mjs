import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");
const current = join(import.meta.dirname, "production-replay", "woven-shirt-combined-supported-front_flat.svg");
const prior = join(import.meta.dirname, "..", "S362-woven-full-collar", "woven-shirt-combined-supported-front.svg");
const expectedEntity = "pattern:woven-shirt:role:buttonPlacket:edge:top";

async function callout(path) {
  const svg = await readFile(path, "utf8");
  const document = new JSDOM(svg, { contentType: "image/svg+xml" }).window.document;
  const group = [...document.querySelectorAll("g[data-source-id]")]
    .find((candidate) => candidate.getAttribute("data-source-id") === "pom:woven-shirt:finished-placket-width");
  assert.ok(group, `missing finished-placket-width callout in ${path}`);
  assert.equal(group.getAttribute("data-callout-source-entity"), expectedEntity);
  assert.equal(group.getAttribute("data-callout-target"), "flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline");
  const leader = [...group.querySelectorAll("path")]
    .find((candidate) => candidate.getAttribute("d")?.startsWith("M"));
  assert.ok(leader, `missing leader in ${path}`);
  const match = /^M(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) L/u.exec(leader.getAttribute("d"));
  assert.ok(match, `leader does not start at a serialized source point in ${path}`);
  return { path, revisionId: document.documentElement.getAttribute("data-revision-id"),
    sourceEntityId: group.getAttribute("data-callout-source-entity"), targetId: group.getAttribute("data-callout-target"),
    anchor: { x: Number(match[1]), y: Number(match[2]) }, leaderPath: leader.getAttribute("d") };
}

const [before, after] = await Promise.all([callout(prior), callout(current)]);
assert.equal(after.revisionId, before.revisionId);
assert.deepEqual(after.anchor, before.anchor, "S363 changed the exact same-revision POM source anchor");
const report = { comparison: "S362 vs S363 production SVG, Woven combined-supported front",
  sourceAnchorUnchanged: true, sameRevision: true, before, after };
const out = join(import.meta.dirname, "production-callout-anchor-comparison.json");
await writeFile(out, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ sourceAnchorUnchanged: true, sameRevision: true, anchor: after.anchor, out }, null, 2));
