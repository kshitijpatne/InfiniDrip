import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { unzipSync } from "fflate";

const directory = new URL("./", import.meta.url);
const zipPath = new URL("reviewed-before-edit-tech-pack.zip", directory);
const pdfPath = new URL("reviewed-before-edit-tech-pack.pdf", directory);
const reportPath = new URL("pack-inspection.json", directory);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

const zipBytes = await readFile(zipPath);
const pdfBytes = await readFile(pdfPath);
const entries = unzipSync(zipBytes);
const pdfEntries = Object.entries(entries).filter(([name]) => name.toLowerCase().endsWith(".pdf"));
assert.equal(pdfEntries.length, 1, "The editable package must contain one production PDF.");
const [embeddedPdfName, embeddedPdfBytes] = pdfEntries[0];
assert.ok(Buffer.from(embeddedPdfBytes).equals(pdfBytes), "Embedded and standalone production PDFs must be byte-identical.");

const document = await PDFDocument.load(pdfBytes);
const pages = document.getPages().map((page, index) => ({
  page: index + 1,
  widthPoints: Number(page.getWidth().toFixed(2)),
  heightPoints: Number(page.getHeight().toFixed(2)),
}));
assert.equal(pages.length, 7, "The integrated production PDF should retain its seven-page section set.");
assert.ok(pages.every((page) => Math.abs(page.widthPoints - 595.28) < 2 && Math.abs(page.heightPoints - 841.89) < 2),
  "Every production PDF page must remain A4 portrait.");

const result = {
  outcome: "passed",
  standalonePdf: { path: "browser/reviewed-before-edit-tech-pack.pdf", byteLength: pdfBytes.length, sha256: hash(pdfBytes) },
  packageZip: { path: "browser/reviewed-before-edit-tech-pack.zip", byteLength: zipBytes.length, sha256: hash(zipBytes) },
  embeddedPdf: { name: embeddedPdfName, byteLength: embeddedPdfBytes.length, sha256: hash(embeddedPdfBytes), byteIdenticalToStandalone: true },
  pageCount: pages.length,
  pages,
  packageEntries: Object.keys(entries).sort().map((name) => ({ name, byteLength: entries[name].length })),
};
await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
