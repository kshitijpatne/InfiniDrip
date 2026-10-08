import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createServer } from "vite";

const root = "C:/G04-CLO-DXF-Exchange/S524-independent-local-aama-receiver";
const names = ["tee", "fitted", "polo", "woven-shirt", "tank", "trouser", "skirt"];
const server = await createServer({ configFile: "vite.config.ts", server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" });
try {
  const { GARMENTS, STANDARD_M, blockPieces } = await server.ssrLoadModule("/src/drafting/index.ts");
  const { exportDxf } = await server.ssrLoadModule("/src/export/index.ts");
  await mkdir(`${root}/Input`, { recursive: true });
  await mkdir(`${root}/Output`, { recursive: true });
  await mkdir(`${root}/Evidence`, { recursive: true });
  const recipes = new Map(GARMENTS.map((recipe) => [recipe.name, recipe]));
  const sha256 = (value) => createHash("sha256").update(value).digest("hex");
  const fixtures = [];
  for (const name of names) {
    const recipe = recipes.get(name);
    if (!recipe) throw new Error(`Current recipe source does not contain ${name}`);
    const options = Object.fromEntries((recipe.options ?? []).map(({ id, defaultValue }) => [id, defaultValue]));
    const pieces = blockPieces(recipe.draft(STANDARD_M, options));
    const dxf = exportDxf(pieces, recipe.allowances);
    const file = `${name}-standard-m.dxf`;
    const pairLines = dxf.trimEnd().split(/\r?\n/);
    if (pairLines.length % 2) throw new Error(`${name}: incomplete DXF group pair`);
    const pairs = [];
    for (let i = 0; i < pairLines.length; i += 2) pairs.push([Number(pairLines[i]), pairLines[i + 1]]);
    const entityTypes = pairs.filter(([code]) => code === 0).map(([, value]) => value);
    const closedPolylines = pairs.filter(([code, value], index) => code === 0 && value === "POLYLINE" && pairs.slice(index, index + 12).some(([nextCode, nextValue]) => nextCode === 70 && nextValue === "1")).length;
    if (closedPolylines !== pieces.length * 2) throw new Error(`${name}: expected ${pieces.length * 2} closed CUT/SEW outlines; got ${closedPolylines}`);
    await writeFile(`${root}/Input/${file}`, dxf, "utf8");
    fixtures.push({
      recipe: name, label: recipe.label, size: "M", measurements: STANDARD_M, options,
      file, bytes: Buffer.byteLength(dxf), sha256: sha256(dxf), pieceNames: pieces.map(({ name: pieceName }) => pieceName),
      pieceCount: pieces.length, closedCutSewOutlineCount: closedPolylines,
      entityCounts: Object.fromEntries([...new Set(entityTypes)].sort().map((type) => [type, entityTypes.filter((item) => item === type).length])),
    });
  }
  const tee = await readFile(`${root}/Input/tee-standard-m.dxf`, "utf8");
  const malformed = tee.replace(/\n0\nEOF\n$/, "\n0\n");
  if (malformed === tee) throw new Error("Malformed control did not find the terminal EOF group value");
  await writeFile(`${root}/Input/negative-truncated-group-value.dxf`, malformed, "utf8");
  const manifest = {
    generatedAtCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    units: "generic legacy DXF coordinate values use the InfiniDrip centimeter convention; no units header is emitted",
    profile: "current InfiniDrip legacy R12-style DXF input; not an AAMA/ASTM conformance claim",
    negativeControl: { file: "negative-truncated-group-value.dxf", bytes: Buffer.byteLength(malformed), sha256: sha256(malformed), derivedFrom: "tee-standard-m.dxf", mutation: "remove the terminal EOF group value" },
    fixtures,
  };
  await writeFile(`${root}/Evidence/fixture-manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ sourceCommit: manifest.generatedAtCommit, fixtures: fixtures.map(({ recipe, file, bytes, sha256: hash, pieceCount, closedCutSewOutlineCount }) => ({ recipe, file, bytes, sha256: hash, pieceCount, closedCutSewOutlineCount })), negativeControl: manifest.negativeControl }, null, 2));
} finally {
  await server.close();
}
