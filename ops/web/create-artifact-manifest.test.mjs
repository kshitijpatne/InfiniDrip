import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createManifest, writeManifest } from "./create-artifact-manifest.mjs";

test("manifest is sorted, content-addressed and repeatable", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "infinidrip-manifest-"));
  try {
    await mkdir(path.join(root, "assets"));
    await writeFile(path.join(root, "z.txt"), "z");
    await writeFile(path.join(root, "assets", "a.js"), "a");
    const first = await createManifest(root);
    const second = await createManifest(root);
    assert.deepEqual(first, second);
    assert.deepEqual(first.files.map((file) => file.path), ["assets/a.js", "z.txt"]);
    assert.equal(first.files[0].bytes, 1);
    assert.match(first.files[0].sha256, /^[0-9a-f]{64}$/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("manifest writer creates a stable JSON artifact and rejects missing input", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "infinidrip-manifest-output-"));
  try {
    const dist = path.join(root, "dist");
    const output = path.join(root, "nested", "manifest.json");
    await mkdir(dist);
    await writeFile(path.join(dist, "index.html"), "<main />");
    await writeManifest(dist, output);
    const parsed = JSON.parse(await readFile(output, "utf8"));
    assert.equal(parsed.schemaVersion, 1);
    await assert.rejects(() => createManifest(path.join(root, "missing")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
