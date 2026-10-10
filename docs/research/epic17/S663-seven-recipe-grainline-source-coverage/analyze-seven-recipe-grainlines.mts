import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { blockPieces, GARMENTS, STANDARD_M } from "../../../../src/drafting/index";
import { flattenPiece, layoutPieces } from "../../../../src/export/layout";
import { resolveGrainline } from "../../../../src/render/notch";

const here = new URL("./", import.meta.url);
const matrixUrl = new URL("../S330-integrated-browser/matrix.json", here);
const outputUrl = new URL("./S663-grainline-coverage.json", here);
const matrixBytes = await readFile(matrixUrl);
const matrix = JSON.parse(matrixBytes.toString("utf8")) as {
  cases: Array<{ caseId: string; recipeId: string; options: Record<string, unknown> }>;
  recipes: string[];
};
const expectedRecipes = ["tee", "fitted", "tank", "polo", "woven-shirt", "skirt", "trouser"];
if (matrix.cases.length !== 73) throw new Error(`expected 73 matrix cases; found ${matrix.cases.length}`);
if (JSON.stringify(matrix.recipes) !== JSON.stringify(expectedRecipes)) throw new Error("S330 recipe order/scope changed");

const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const round3 = (n: number) => Math.round(n * 1000) / 1000;
const onSegment = (p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): boolean => {
  const cross = (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x);
  return Math.abs(cross) <= 1e-7 && p.x >= Math.min(a.x, b.x) - 1e-7 && p.x <= Math.max(a.x, b.x) + 1e-7 &&
    p.y >= Math.min(a.y, b.y) - 1e-7 && p.y <= Math.max(a.y, b.y) + 1e-7;
};
const inside = (p: { x: number; y: number }, polygon: readonly { x: number; y: number }[]): boolean => {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j]!;
    const b = polygon[i]!;
    if (onSegment(p, a, b)) return true;
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
};

const rows: Array<Record<string, unknown>> = [];
const roleContracts = new Map<string, { recipeId: string; role: string; pieceName: string; rule: string; configurations: number }>();
const recipeStats: Record<string, { configurations: number; pieces: number; rules: Record<string, number>; outsideSamples: number }> = {};
const failureLog: string[] = [];
for (const testCase of matrix.cases) {
  const recipe = GARMENTS.find((candidate) => candidate.name === testCase.recipeId);
  if (!recipe) throw new Error(`matrix recipe missing from current source: ${testCase.recipeId}`);
  const block = recipe.draft(STANDARD_M, testCase.options);
  const pieces = blockPieces(block);
  const flats = pieces.map((piece) => flattenPiece(piece, recipe.allowances));
  const layout = layoutPieces(flats);
  const stats = recipeStats[testCase.recipeId] ??= { configurations: 0, pieces: 0, rules: {}, outsideSamples: 0 };
  stats.configurations++;
  if (pieces.length !== Object.keys(block.roles).length) throw new Error(`${testCase.caseId}: piece/role count mismatch`);
  if (new Set(pieces.map((piece) => piece.name)).size !== pieces.length) throw new Error(`${testCase.caseId}: duplicate piece names`);
  const ruledNames = recipe.notches.map((entry) => entry.pieceName);
  for (const piece of pieces) {
    const rules = recipe.notches.filter((entry) => entry.pieceName === piece.name);
    if (rules.length !== 1) throw new Error(`${testCase.caseId}/${piece.name}: expected exactly one grainline rule, found ${rules.length}`);
    const role = Object.entries(block.roles).find(([, rolePiece]) => rolePiece === piece)?.[0];
    if (!role) throw new Error(`${testCase.caseId}/${piece.name}: no stable block role`);
    const index = pieces.indexOf(piece);
    const localFlat = flats[index]!;
    const placedFlat = layout.pieces[index]!;
    const localCut = localFlat.cut;
    const localLine = resolveGrainline(piece, rules[0]!.grainline);
    const localTop = { x: round3(localLine.top.x), y: round3(localLine.top.y) };
    const localBottom = { x: round3(localLine.bottom.x), y: round3(localLine.bottom.y) };
    const localCutBounds = {
      minX: Math.min(...localCut.map((p) => p.x)),
      minY: Math.min(...localCut.map((p) => p.y)),
    };
    const placedCutBounds = {
      minX: Math.min(...placedFlat.cut.map((p) => p.x)),
      minY: Math.min(...placedFlat.cut.map((p) => p.y)),
    };
    const dx = placedCutBounds.minX - localCutBounds.minX;
    const dy = placedCutBounds.minY - localCutBounds.minY;
    const dxf = (p: { x: number; y: number }) => ({ x: round3(p.x + dx), y: round3(layout.height - (p.y + dy)) });
    const dxfTop = dxf(localLine.top);
    const dxfBottom = dxf(localLine.bottom);
    let insideSamples = 0;
    for (let sample = 0; sample <= 500; sample++) {
      const t = sample / 500;
      const p = { x: localTop.x + (localBottom.x - localTop.x) * t, y: localTop.y + (localBottom.y - localTop.y) * t };
      if (inside(p, localCut)) insideSamples++;
    }
    if (insideSamples !== 501) {
      stats.outsideSamples += 501 - insideSamples;
      failureLog.push(`${testCase.caseId}/${role}/${piece.name}: grainline inside ${insideSamples}/501`);
    }
    const rule = rules[0]!.grainline;
    const ruleKey = `${rule.topEdge}@${rule.topT}→${rule.bottomEdge}@${rule.bottomT}`;
    const roleKey = `${testCase.recipeId}/${role}`;
    const contract = roleContracts.get(roleKey);
    if (contract && (contract.pieceName !== piece.name || contract.rule !== ruleKey)) {
      throw new Error(`${roleKey}: piece identity or grainline rule changes across the supported option matrix`);
    }
    if (contract) contract.configurations++;
    else roleContracts.set(roleKey, { recipeId: testCase.recipeId, role, pieceName: piece.name, rule: ruleKey, configurations: 1 });
    stats.rules[ruleKey] = (stats.rules[ruleKey] ?? 0) + 1;
    stats.pieces++;
    rows.push({
      caseId: testCase.caseId,
      recipeId: testCase.recipeId,
      role,
      pieceName: piece.name,
      rule,
      sourcePieceCm: { top: localTop, bottom: localBottom },
      laidOutDxfCm: { top: dxfTop, bottom: dxfBottom },
      cutVertexCount: localCut.length,
      roundedLineSamplesInsideCut: insideSamples,
      roundedLineSampleCount: 501,
    });
  }
  const extraRules = ruledNames.filter((name) => !pieces.some((piece) => piece.name === name));
  if (extraRules.length) throw new Error(`${testCase.caseId}: rules refer to absent pieces: ${extraRules.join(", ")}`);
}

if (Object.keys(recipeStats).length !== 7) throw new Error(`expected 7 recipes; found ${Object.keys(recipeStats).length}`);
if (rows.length < matrix.cases.length) throw new Error("at least one matrix case has no grainline rows");
const report = {
  scope: "Read-only current-source grainline derivation; not receiver evidence or profile approval",
  matrix: { path: fileURLToPath(matrixUrl), sha256: sha256(matrixBytes), configurations: matrix.cases.length, recipes: matrix.recipes },
  source: { revision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), size: "STANDARD_M", note: "Each matrix row uses its canonical options from S330 and the current recipe draft/notch rules." },
  totals: { configurations: matrix.cases.length, recipes: Object.keys(recipeStats).length, pieceInstances: rows.length, checkedLineSamples: rows.length * 501, outsideSamples: recipeStats ? Object.values(recipeStats).reduce((sum, stat) => sum + stat.outsideSamples, 0) : 0, stableRecipeRoleContracts: roleContracts.size },
  byRecipe: recipeStats,
  roleContracts: [...roleContracts.values()].sort((a, b) => a.recipeId.localeCompare(b.recipeId) || a.role.localeCompare(b.role)),
  failures: failureLog,
  rows,
};
if (failureLog.length) throw new Error(`source grainline containment failed: ${failureLog.slice(0, 10).join("; ")}`);
await writeFile(outputUrl, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...report, rows: `[${rows.length} detailed rows written to ${fileURLToPath(outputUrl)}]` }, null, 2));
