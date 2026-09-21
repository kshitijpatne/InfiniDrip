import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function filesUnder(root, relative = "") {
  const directory = path.join(root, relative);
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(root, child));
    else if (entry.isFile()) files.push(child.replaceAll(path.sep, "/"));
  }
  return files;
}

/** Create a stable manifest; it contains no clock, host or absolute path. */
export async function createManifest(distDirectory) {
  const root = path.resolve(distDirectory);
  const files = await filesUnder(root);
  const entries = [];
  for (const relativePath of files) {
    const bytes = await fs.readFile(path.join(root, relativePath));
    entries.push({ path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) });
  }
  return { schemaVersion: 1, base: "./", files: entries };
}

export async function writeManifest(distDirectory, outputPath) {
  const manifest = await createManifest(distDirectory);
  await fs.mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
  await fs.writeFile(path.resolve(outputPath), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const [distDirectory = "dist", outputPath = "ops/web/artifact-manifest.json"] = process.argv.slice(2);
  writeManifest(distDirectory, outputPath)
    .then((manifest) => console.log(`Manifested ${manifest.files.length} files at ${path.resolve(outputPath)}`))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
