import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const folder = "C:/G04-CLO-DXF-Exchange/S617-standard-dxf-units-header";
const sourcePath = "C:/G04-CLO-DXF-Exchange/S616-standard-dxf-units-sensitivity/Input/polo-standard-m.dxf";
const variantPath = `${folder}/Input/polo-standard-m-cm-units-header.dxf`;
const reportPath = `${folder}/Evidence/Analysis/source-variant-preflight.json`;
const expectedSource = "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

const source = await readFile(sourcePath);
assert.equal(digest(source), expectedSource, "pinned S616 source fixture changed");
const sourceText = source.toString("utf8");
assert(!sourceText.includes("$INSUNITS") && !sourceText.includes("$MEASUREMENT"), "fixture already declares units");
const newline = sourceText.includes("\r\n") ? "\r\n" : "\n";
const headerText = ["0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "AC1015", "9", "$INSUNITS", "70", "5", "0", "ENDSEC", ""].join(newline);
const header = Buffer.from(headerText, "ascii");
const variant = Buffer.concat([header, source]);
assert(variant.subarray(header.length).equals(source), "entity/body bytes changed while adding header");
const variantText = variant.toString("utf8");
assert.equal((variantText.match(/\$INSUNITS/g) ?? []).length, 1);
assert(variantText.includes("\n70\n5\n") || variantText.includes("\r\n70\r\n5\r\n"));

await mkdir(`${folder}/Input`, { recursive: true });
await mkdir(`${folder}/Evidence/Analysis`, { recursive: true });
await writeFile(variantPath, variant);
const report = {
  source: { path: sourcePath, sha256: digest(source), bytes: source.length },
  variant: { path: variantPath, sha256: digest(variant), bytes: variant.length },
  addedHeaderPairs: [[0, "SECTION"], [2, "HEADER"], [9, "$ACADVER"], [1, "AC1015"], [9, "$INSUNITS"], [70, "5"], [0, "ENDSEC"]],
  entityAndOriginalBytes: { unchanged: variant.subarray(header.length).equals(source), sha256: digest(source) },
  basis: "Only an AC1015 HEADER declaring the existing true-centimeter source coordinates as $INSUNITS=5 was prepended. Original entity/body bytes, vertices, layers and coordinates remain byte-identical."
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
