import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";

const root = new URL(".", import.meta.url);
const manifestPath = new URL("../S463-v03-receiver-fixture-pack/fixture-manifest.json", root);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const fixture = manifest.fixtures.find((item) => item.file === "fixtures/tee-standard-m.dxf");
assert.ok(fixture, "S463 Tee fixture is present in its manifest");
const sourcePath = new URL(`../S463-v03-receiver-fixture-pack/${fixture.file}`, root);
const copyPath = new URL("./inputs/tee-standard-m.dxf", root);
const source = await readFile(sourcePath);
const copy = await readFile(copyPath);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
assert.equal(sha256(source), fixture.sha256);
assert.equal(sha256(copy), fixture.sha256);
assert.equal(copy.byteLength, fixture.bytes);

const screenshotNames = ["clo-import-menu.png", "clo-export-menu.png"];
const screenshots = [];
for (const name of screenshotNames) {
  const path = new URL(`./evidence/${name}`, root);
  const bytes = await readFile(path);
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${name} PNG signature`);
  screenshots.push({ file: `evidence/${name}`, bytes: bytes.byteLength, sha256: sha256(bytes) });
}
const outputs = await stat(new URL("./receiver-outputs/.gitkeep", root));
assert.equal(outputs.isFile(), true);
const evidence = {
  fixture: { file: "inputs/tee-standard-m.dxf", bytes: copy.byteLength, sha256: sha256(copy), matchesS463: true },
  screenshots,
  receiverOutputsReady: true,
  receiverOutputReturned: false,
  observedImportMenu: "File > Import > DXF",
  observedExportMenu: "File > Export > DXF",
  profileAndUnitsObserved: false,
};
await writeFile(new URL("./preflight-evidence.json", root), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
