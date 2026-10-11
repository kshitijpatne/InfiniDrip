import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import {
  GARMENTS,
  STANDARD_M,
  blockPieces,
} from "../../../../src/drafting";
import { exportDxf } from "../../../../src/export";

const root = "C:/G04-CLO-DXF-Exchange/S523-clo-remaining-recipe-roundtrip";
const inputDir = `${root}/Input`;
await mkdir(inputDir, { recursive: true });
await mkdir(`${root}/Output`, { recursive: true });
await mkdir(`${root}/Evidence`, { recursive: true });

const names = ["fitted", "tank", "skirt", "trouser"];
const recipes = new Map(GARMENTS.map((recipe) => [recipe.name, recipe]));
const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const entries = [];

for (const recipeName of names) {
  const recipe = recipes.get(recipeName);
  if (!recipe) throw new Error(`Current recipe source does not contain ${recipeName}`);
  const options = Object.fromEntries((recipe.options ?? []).map(({ id, defaultValue }) => [id, defaultValue]));
  const pieces = blockPieces(recipe.draft(STANDARD_M, options));
  const dxf = exportDxf(pieces, recipe.allowances);
  const lines = dxf.trimEnd().split(/\r?\n/);
  if (lines.length % 2 !== 0) throw new Error(`${recipeName}: incomplete DXF group pair`);
  const pairs = [];
  for (let index = 0; index < lines.length; index += 2) {
    const code = Number(lines[index]);
    if (!Number.isInteger(code)) throw new Error(`${recipeName}: invalid group code at line ${index + 1}`);
    pairs.push([code, lines[index + 1]] as const);
  }
  const entities = pairs.filter(([code]) => code === 0).map(([, value]) => value);
  const closedOutlines = pairs.filter(([code, value], index) =>
    code === 0 && value === "POLYLINE" && pairs.slice(index, index + 5).some(([pairCode, pairValue]) => pairCode === 70 && pairValue === "1"),
  ).length;
  if (closedOutlines !== pieces.length * 2) {
    throw new Error(`${recipeName}: expected ${pieces.length * 2} closed CUT/SEW outlines; found ${closedOutlines}`);
  }
  const file = `${recipeName}-standard-m.dxf`;
  await writeFile(`${inputDir}/${file}`, dxf, "utf8");
  entries.push({
    recipe: recipeName,
    label: recipe.label,
    size: "M",
    measurements: STANDARD_M,
    options,
    file,
    bytes: Buffer.byteLength(dxf),
    sha256: sha256(dxf),
    pieceNames: pieces.map(({ name }) => name),
    pieceCount: pieces.length,
    closedCutSewOutlineCount: closedOutlines,
    layerNames: [...new Set(pairs.filter(([code]) => code === 8).map(([, value]) => value))].sort(),
    entityCounts: Object.fromEntries([...new Set(entities)].sort().map((type) => [type, entities.filter((candidate) => candidate === type).length])),
  });
}

const manifest = {
  generatedAtCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  units: "generic DXF coordinate values follow InfiniDrip's centimeter convention; no DXF unit header is emitted",
  profile: "legacy generic R12-style DXF; not an AAMA/ASTM conformance claim",
  fixtures: entries,
};
await writeFile(`${root}/Evidence/fixture-manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify(entries.map(({ recipe, file, bytes, sha256: hash, pieceCount, closedCutSewOutlineCount }) => ({ recipe, file, bytes, sha256: hash, pieceCount, closedCutSewOutlineCount })), null, 2));
