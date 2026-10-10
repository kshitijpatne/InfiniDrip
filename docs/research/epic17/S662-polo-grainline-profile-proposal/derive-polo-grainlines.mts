import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { draftPolo, POLO_ALLOWANCES, POLO_NOTCHES, STANDARD_M, blockPieces } from "../../../../src/drafting/index";
import { flattenPiece, layoutPieces, polylineBounds } from "../../../../src/export/layout";
import { resolveGrainline } from "../../../../src/render/notch";

const inputPath = "C:/G04-CLO-DXF-Exchange/S648-getonagain-fixture-preflight/Input/polo-m-idr-profile-r14-first.dxf";
const expectedHash = "ABB6282723B9A4198F6DE54D5A1CFA70D5784455402D5FBD25E7791456B87461";
const revision = "ef28519c21314eed0280ed4e6982849284da16b6";
const parserRequire = createRequire(import.meta.url);
const DxfParser = parserRequire("C:/G04-CLO-DXF-Exchange/Tools/open-patterns-astm-parser/node_modules/dxf-parser");
const bytes = await readFile(inputPath);
const hash = createHash("sha256").update(bytes).digest("hex").toUpperCase();
if (hash !== expectedHash) throw new Error(`fixture hash mismatch: ${hash}`);
const parsed = new DxfParser().parseSync(bytes.toString("utf8"));
const roleToBlock: Record<string, string> = {
  front: "IDR_POLO_FRONT",
  back: "IDR_POLO_BACK",
  sleeve: "IDR_POLO_SLEEVE",
  buttonPlacket: "IDR_POLO_BUTTON_PLACKET",
  buttonholePlacket: "IDR_POLO_BUTTONHOLE_PLACKET",
  outerStand: "IDR_POLO_OUTER_COLLAR_STAND",
  innerStand: "IDR_POLO_INNER_COLLAR_STAND",
  upperCollar: "IDR_POLO_UPPER_POINTED_COLLAR",
  underCollar: "IDR_POLO_UNDER_POINTED_COLLAR",
};

function onSegment(point: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  const cross = (point.x - a.x) * (b.y - a.y) - (point.y - a.y) * (b.x - a.x);
  if (Math.abs(cross) > 1e-7) return false;
  return point.x >= Math.min(a.x, b.x) - 1e-7 && point.x <= Math.max(a.x, b.x) + 1e-7 &&
    point.y >= Math.min(a.y, b.y) - 1e-7 && point.y <= Math.max(a.y, b.y) + 1e-7;
}

function inside(point: { x: number; y: number }, polygon: readonly { x: number; y: number }[]): boolean {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j];
    const b = polygon[i];
    if (onSegment(point, a, b)) return true;
    if ((a.y > point.y) !== (b.y > point.y) &&
        point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

function cyclicResidual(a: readonly { x: number; y: number }[], b: readonly { x: number; y: number }[]): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let best = Number.POSITIVE_INFINITY;
  for (let offset = 0; offset < a.length; offset++) {
    for (const direction of [1, -1]) {
      let worst = 0;
      for (let i = 0; i < a.length; i++) {
        const j = (offset + direction * i + a.length * 2) % a.length;
        worst = Math.max(worst, Math.abs(a[i].x - b[j].x), Math.abs(a[i].y - b[j].y));
      }
      best = Math.min(best, worst);
    }
  }
  return best;
}

const block = draftPolo(STANDARD_M);
const pieces = blockPieces(block);
const flat = pieces.map((piece) => flattenPiece(piece, POLO_ALLOWANCES));
const layout = layoutPieces(flat);
const round3 = (value: number) => Math.round(value * 1000) / 1000;
const rows = pieces.map((piece, index) => {
  const recipe = POLO_NOTCHES.find((entry) => entry.pieceName === piece.name);
  if (!recipe) throw new Error(`missing Polo mark rules for ${piece.name}`);
  const resolved = resolveGrainline(piece, recipe.grainline);
  const sourceCut = polylineBounds(flat[index].cut);
  const placedCut = polylineBounds(layout.pieces[index].cut);
  const dx = placedCut.minX - sourceCut.minX;
  const dy = placedCut.minY - sourceCut.minY;
  const point = (p: { x: number; y: number }) => ({
    sourceCm: { x: round3(p.x), y: round3(p.y) },
    dxfCm: { x: round3(p.x + dx), y: round3(layout.height - (p.y + dy)) },
  });
  const role = Object.entries(block.roles).find(([, value]) => value === piece)?.[0];
  if (!role || !roleToBlock[role]) throw new Error(`fixture role mapping missing: ${piece.name}`);
  const blockName = roleToBlock[role];
  const dxfBlock = parsed.blocks[blockName];
  if (!dxfBlock) throw new Error(`fixture block missing: ${blockName}`);
  const cut = dxfBlock.entities.find((entity: any) => entity.type === "POLYLINE" && entity.layer === "CUT");
  if (!cut) throw new Error(`fixture CUT contour missing: ${blockName}`);
  const polygon = cut.vertices.map((vertex: any) => ({ x: vertex.x, y: vertex.y }));
  const modelCut = layout.pieces[index].cut.map((p) => ({ x: round3(p.x), y: round3(layout.height - p.y) }));
  const cutResidualCm = cyclicResidual(modelCut, polygon);
  if (cutResidualCm > 0.001) throw new Error(`${blockName} source CUT mismatch: ${cutResidualCm} cm`);
  const cadTop = point(resolved.top).dxfCm;
  const cadBottom = point(resolved.bottom).dxfCm;
  let insideSamples = 0;
  for (let sample = 0; sample <= 500; sample++) {
    const t = sample / 500;
    const p = { x: cadTop.x + (cadBottom.x - cadTop.x) * t, y: cadTop.y + (cadBottom.y - cadTop.y) * t };
    if (inside(p, polygon)) insideSamples++;
  }
  if (insideSamples !== 501) throw new Error(`${blockName} grainline leaves its CUT contour at ${insideSamples}/501 samples`);
  return {
    role,
    block: blockName,
    piece: piece.name,
    rule: recipe.grainline,
    top: point(resolved.top),
    bottom: point(resolved.bottom),
    layoutCutBoundsCm: {
      minX: round3(placedCut.minX), maxX: round3(placedCut.minX + placedCut.width),
      minY: round3(placedCut.minY), maxY: round3(placedCut.minY + placedCut.height),
    },
    onFold: piece.onFold,
    sourceCutVertexCount: polygon.length,
    sourceCutResidualCm: cutResidualCm,
    sourceDxfLineSamplesInsideCut: insideSamples,
    sourceDxfLineSamplesTotal: 501,
  };
});
console.log(JSON.stringify({ revision, inputPath, bytes: bytes.length, sha256: hash, count: rows.length, layout: { widthCm: round3(layout.width), heightCm: round3(layout.height) }, rows }, null, 2));
