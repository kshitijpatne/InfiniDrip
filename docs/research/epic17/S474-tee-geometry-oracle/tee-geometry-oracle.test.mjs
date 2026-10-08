import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { extractTeeOracle } from "./build-tee-source-oracle.mjs";

const oraclePath = new URL("./tee-expected-geometry.json", import.meta.url);

test("Tee oracle binds exact S463 source bytes and piece order", async () => {
  const oracle = await extractTeeOracle();
  assert.equal(oracle.source.sha256, "0b6cba95c9afd4cc6f17a2171f67303e0891babb94828816c149767935165fc9");
  assert.equal(oracle.source.units, "centimeters by source contract; not declared in DXF stream");
  assert.deepEqual(oracle.outlines.map(({ sourcePieceName, layer }) => [sourcePieceName, layer]), [
    ["front", "CUT"], ["front", "SEW"], ["back", "CUT"], ["back", "SEW"], ["sleeve", "CUT"], ["sleeve", "SEW"],
  ]);
});

test("every serialized outline is closed, finite, and has exact stored bounds", async () => {
  const oracle = await extractTeeOracle();
  assert.equal(oracle.outlineCount, 6);
  for (const outline of oracle.outlines) {
    assert.equal(outline.entityType, "POLYLINE");
    assert.equal(outline.closed, true);
    assert.equal(outline.vertexCount, outline.vertices.length);
    assert.ok(outline.vertexCount >= 3);
    for (const vertex of outline.vertices) {
      assert.ok(Number.isFinite(vertex.x));
      assert.ok(Number.isFinite(vertex.y));
      assert.equal(Number(vertex.xText), vertex.x);
      assert.equal(Number(vertex.yText), vertex.y);
    }
    assert.deepEqual(outline.bounds, {
      minX: Math.min(...outline.vertices.map(({ x }) => x)),
      minY: Math.min(...outline.vertices.map(({ y }) => y)),
      maxX: Math.max(...outline.vertices.map(({ x }) => x)),
      maxY: Math.max(...outline.vertices.map(({ y }) => y)),
    });
  }
});

test("generated coordinate oracle reproduces the committed JSON exactly", async () => {
  const oracle = await extractTeeOracle();
  const stored = JSON.parse(await readFile(oraclePath, "utf8"));
  assert.deepEqual(oracle, stored);
});
