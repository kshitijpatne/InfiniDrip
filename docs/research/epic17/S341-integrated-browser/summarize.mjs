import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const folder = dirname(fileURLToPath(import.meta.url));
const current = JSON.parse(await readFile(join(folder, "production-replay/matrix.json"), "utf8"));
const previous = JSON.parse(await readFile(new URL("../S330-integrated-browser/matrix.json", import.meta.url), "utf8"));
const previousFaces = new Map(previous.faces.map((face) => [`${face.caseId}|${face.face === "FRONT_FLAT" ? "FRONT_FLAT" : "BACK_FLAT"}`, face]));
const recipes = {};
const issueCounts = new Map();
const changes = [];

for (const testCase of current.cases) {
  const recipe = recipes[testCase.recipeId] ??= { configurations: 0, accepted: 0, held: 0, faces: { FRONT_FLAT: { accepted: 0, held: 0 }, BACK_FLAT: { accepted: 0, held: 0 } } };
  recipe.configurations += 1;
  for (const face of testCase.faces) {
    const accepted = face.svgCount > 0;
    const faceCounts = recipe.faces[face.kind];
    faceCounts[accepted ? "accepted" : "held"] += 1;
    recipe[accepted ? "accepted" : "held"] += 1;
    const oldKey = `${testCase.caseId}|${face.kind}`;
    const old = previousFaces.get(oldKey);
    if (!old) changes.push({ key: oldKey, previous: "missing", current: accepted ? "accepted" : "held" });
    else if ((!old.blocked) !== accepted) changes.push({ key: oldKey, previous: old.blocked ? "held" : "accepted", current: accepted ? "accepted" : "held" });
    if (accepted) continue;

    for (const line of face.guidance.split(/\n+/u).map((part) => part.trim()).filter(Boolean)) {
      const identity = /^([a-z-]+) · (.+?):\s/u.exec(line);
      const stage = identity?.[1] ?? "unknown";
      const sourceId = identity?.[2] ?? line.slice(0, 100);
      const key = `${testCase.recipeId}|${face.kind}|${stage}|${sourceId}`;
      const item = issueCounts.get(key) ?? { recipeId: testCase.recipeId, face: face.kind, stage, sourceId, count: 0, examples: [], residualsCm: [] };
      item.count += 1;
      if (item.examples.length < 3) item.examples.push(line);
      for (const match of line.matchAll(/([0-9]+(?:\.[0-9]+)?) cm apart/gu)) item.residualsCm.push(Number(match[1]));
      issueCounts.set(key, item);
    }
  }
}

const inventory = {
  generatedAt: current.generatedAt,
  sourceMatrix: "../S330-integrated-browser/matrix.json",
  currentMatrix: "production-replay/matrix.json",
  configurations: current.configurations,
  faceRequests: current.faceRequests,
  optionFieldCount: previous.summary.optionFieldCount,
  browserErrors: current.browserErrors,
  recipes,
  statusChangesFromS330: changes,
  blockers: [...issueCounts.values()].map((item) => ({
    ...item,
    residualRangeCm: item.residualsCm.length
      ? [Math.min(...item.residualsCm), Math.max(...item.residualsCm)] : null,
  })).sort((a, b) => a.recipeId.localeCompare(b.recipeId) || a.face.localeCompare(b.face) || a.sourceId.localeCompare(b.sourceId)),
};
await writeFile(join(folder, "hold-inventory.json"), `${JSON.stringify(inventory, null, 2)}\n`);
console.log(JSON.stringify({ configurations: inventory.configurations, faceRequests: inventory.faceRequests,
  recipeTallies: recipes, statusChanges: changes.length, distinctBlockers: inventory.blockers.length }, null, 2));
