import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({ configFile: "vite.config.ts", server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" });
try {
  const { GARMENTS, STANDARD_M, blockPieces } = await server.ssrLoadModule("/src/drafting/index.ts");
  const { allowanceFor } = await server.ssrLoadModule("/src/drafting/allowance.ts");
  const { seamAllowance } = await server.ssrLoadModule("/src/render/allowance.ts");
  const recipe = GARMENTS.find((item) => item.name === "woven-shirt");
  assert(recipe, "woven-shirt recipe unavailable");
  const cases = [];
  for (const sideVentDepth of [0, 0.5]) {
    const options = Object.fromEntries(recipe.options.map(({ id, defaultValue }) => [id, defaultValue]));
    options.sideVentDepth = sideVentDepth;
    const pieces = blockPieces(recipe.draft(STANDARD_M, options));
    const details = pieces.map((piece) => {
      const vent = piece.edges.find((edge) => edge.name === "vent");
      const zeroVent = vent?.kind === "line" && vent.start.x === vent.end.x && vent.start.y === vent.end.y;
      const allowance = vent ? allowanceFor(recipe.allowances, vent.name, piece.name) : null;
      const cut = seamAllowance(piece, recipe.allowances);
      const nonFinite = cut.flatMap(({ x, y }) => [x, y]).filter((coordinate) => !Number.isFinite(coordinate)).length;
      return { piece: piece.name, hasVentEdge: Boolean(vent), ventStart: vent?.kind === "line" ? vent.start : null,
        ventEnd: vent?.kind === "line" ? vent.end : null, zeroLengthVent: Boolean(zeroVent), ventAllowanceCm: allowance,
        cutPointCount: cut.length, nonFiniteCutCoordinateCount: nonFinite };
    });
    cases.push({ sideVentDepth, pieces: details, pieceCount: pieces.length,
      nonFiniteCutCoordinates: details.reduce((sum, item) => sum + item.nonFiniteCutCoordinateCount, 0) });
  }
  assert(cases[0].pieces.some((piece) => piece.zeroLengthVent && piece.ventAllowanceCm === 1 && piece.nonFiniteCutCoordinateCount > 0),
    "expected the zero-depth vent/allowance failure was not reproduced");
  assert.equal(cases[1].nonFiniteCutCoordinates, 0, "0.5 cm control should keep finite CUT coordinates");
  console.log(JSON.stringify({ sourceCommit: "1317d5dd4d721edf5139cacd7f4c8bdd935b6217", cases }, null, 2));
} finally {
  await server.close();
}
