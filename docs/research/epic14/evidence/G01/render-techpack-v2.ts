import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FITTED, POLO, SKIRT, STANDARD_M, TANK, TEE, TROUSER, WOVEN_SHIRT } from "../../../../../src/drafting/index.ts";
import { exportTechPackV2 } from "../../../../../src/export/techpack.ts";

const outputDirectory = new URL("./techpack-v2/", import.meta.url);
mkdirSync(fileURLToPath(outputDirectory), { recursive: true });

const recipes = [
  ["tee", TEE],
  ["darted-tee", FITTED],
  ["tank", TANK],
  ["polo", POLO],
  ["woven-shirt", WOVEN_SHIRT],
  ["skirt", SKIRT],
  ["trouser", TROUSER],
] as const;

for (const [name, recipe] of recipes) {
  const pdf = exportTechPackV2(recipe, STANDARD_M);
  writeFileSync(fileURLToPath(new URL(`./techpack-v2/${name}.pdf`, import.meta.url)), Buffer.from(pdf, "binary"));
}
