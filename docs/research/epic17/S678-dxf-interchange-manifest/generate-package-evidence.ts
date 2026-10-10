import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { STANDARD_M, GARMENTS, gradeRun } from "../../../../src/drafting";
import { createDxfInterchangePackage, verifyDxfInterchangePackage } from "../../../../src/export/dxf-interchange-package";

const output = resolve(process.argv[2] ?? "C:/G04-CAD-Interchange/S678-package");
await mkdir(output, { recursive: true });
const evidence = [];

for (const recipe of GARMENTS) {
  const options = Object.fromEntries((recipe.options ?? []).map((option) => [option.id, option.defaultValue]));
  const run = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, options);
  const graded = run.find((size) => size.label === "M") ?? run[Math.floor(run.length / 2)];
  const candidate = await createDxfInterchangePackage(recipe, graded, options);
  if (!await verifyDxfInterchangePackage(candidate)) throw new Error(`Manifest verification failed for ${recipe.name}`);

  const baseName = `${recipe.name}-${graded.label}`;
  const dxfPath = resolve(output, `${baseName}.dxf`);
  const manifestPath = resolve(output, `${baseName}.manifest.json`);
  await writeFile(dxfPath, candidate.dxf, "utf8");
  const manifestBytes = `${JSON.stringify(candidate.manifest, null, 2)}\n`;
  await writeFile(manifestPath, manifestBytes, "utf8");
  evidence.push({
    recipe: recipe.name,
    size: graded.label,
    dxfPath,
    manifestPath,
    drawingSha256: candidate.manifest.drawingSha256,
    packageRevisionId: candidate.manifest.revisionId,
    manifestFileSha256: createHash("sha256").update(manifestBytes).digest("hex"),
    pieceCount: candidate.manifest.pieces.length,
    stitchCount: candidate.manifest.stitches.length,
    verified: true,
  });
}

await writeFile(resolve(output, "S678-generated-evidence.json"), JSON.stringify({ schemaVersion: 1, packages: evidence }, null, 2) + "\n", "utf8");
console.log(`Wrote and verified ${evidence.length} DXF/manifest packages in ${output}`);
