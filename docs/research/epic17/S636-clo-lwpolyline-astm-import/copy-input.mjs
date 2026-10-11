import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const source = "C:/G04-CLO-DXF-Exchange/S635-cut-lwpolyline-import/Output/polo-cm-header-cut-lwpolyline.dxf";
const root = "C:/G04-CLO-DXF-Exchange/S636-lwpolyline-astm-import";
const input = `${root}/Input/polo-cm-header-cut-lwpolyline.dxf`;
const expected = "606316F41F22E3AE930E2DE404B62AD4F6186120CEC0643A90EB96EA63D9F360";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const bytes = await readFile(source);
assert.equal(sha(bytes), expected, "S635 derivative hash changed");
await Promise.all(["Input", "Output", "Evidence"].map((part) => mkdir(`${root}/${part}`, { recursive: true })));
await writeFile(input, bytes);
const copied = await readFile(input);
assert.equal(sha(copied), expected, "S636 input copy is not byte-identical");
const manifest = { slice: "S636", source, input, bytes: copied.length, sha256: sha(copied), copyIsByteIdentical: true };
await writeFile(`${root}/Evidence/input-manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify(manifest, null, 2));
