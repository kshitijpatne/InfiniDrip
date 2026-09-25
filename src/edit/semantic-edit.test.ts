import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, TEE, gradeRun, type GarmentRecipe, type Measurements } from "../drafting";
import { point } from "../geometry";
import type { Block } from "../drafting/block";
import {
  appendSemanticEditOperations,
  createAnchorMoveOperation,
  emptySemanticEditDocument,
  evaluateSemanticEditDocument,
  inspectSemanticEditCandidate,
  mergeConcurrentEditOperations,
  rebaseSemanticEditDocument,
  redoSemanticEdit,
  SEMANTIC_EDIT_HISTORY_LIMIT,
  semanticAnchorCatalog,
  semanticEditSourceFingerprint,
  undoSemanticEdit,
  type SemanticEditOperation,
} from "./semantic-edit";

function optionsFor(recipe: GarmentRecipe): Record<string, number> {
  return Object.fromEntries((recipe.options ?? []).map((option) => [option.id, option.defaultValue]));
}

function sourceBlock(recipe: GarmentRecipe, measurements: Measurements = STANDARD_M): Block {
  return recipe.draft(measurements, optionsFor(recipe));
}

async function emptyDocument(recipe: GarmentRecipe, measurements: Measurements = STANDARD_M) {
  const fingerprint = await semanticEditSourceFingerprint(recipe.name, sourceBlock(recipe, measurements));
  return { fingerprint, document: emptySemanticEditDocument(recipe.name, fingerprint) };
}

function moveOperation(
  recipe: GarmentRecipe,
  block: Block,
  fingerprint: string,
  id: string,
  anchorId: string,
  dx: number,
  dy: number,
): SemanticEditOperation {
  return createAnchorMoveOperation(recipe.name, fingerprint, block, id, anchorId, { x: dx, y: dy });
}

describe("semantic edit anchors", () => {
  it.each(GARMENTS)("creates unique name-based anchors for all roles of $name across its size run", (recipe) => {
    const base = sourceBlock(recipe);
    const catalog = semanticAnchorCatalog(recipe.name, base);
    expect(catalog.length).toBeGreaterThan(0);
    expect(new Set(catalog.map((anchor) => anchor.id)).size).toBe(catalog.length);
    expect(catalog.every((anchor) => anchor.id.includes(`/${encodeURIComponent(recipe.name)}/`))).toBe(true);
    const expected = catalog.map((anchor) => [anchor.id, anchor.signature]).sort(([a], [b]) => a.localeCompare(b));
    for (const size of gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, optionsFor(recipe))) {
      expect(semanticAnchorCatalog(recipe.name, size.block)
        .map((anchor) => [anchor.id, anchor.signature]).sort(([a], [b]) => a.localeCompare(b))).toEqual(expected);
    }
  });

  it("addresses corners by neighboring edge names and curve controls by named edge", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const anchors = semanticAnchorCatalog(recipe.name, sourceBlock(recipe));
    expect(anchors.some((anchor) => anchor.id.endsWith("/junction/centerFront/neckline"))).toBe(true);
    expect(anchors.some((anchor) => anchor.id.endsWith("/edge/armhole/control/1"))).toBe(true);
    expect(anchors.some((anchor) => /\/junction\/\d+\//.test(anchor.id))).toBe(false);
  });

  it("rejects ambiguous duplicate edge names and open source junctions", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const block = sourceBlock(recipe);
    const front = block.roles.front;
    const duplicate: Block = { ...block, roles: { ...block.roles, front: { ...front, edges: front.edges.map((edge, index) => index === 1 ? { ...edge, name: front.edges[0].name } : edge) } } };
    expect(() => semanticAnchorCatalog(recipe.name, duplicate)).toThrow(/duplicate edge names/);
    const open: Block = { ...block, roles: { ...block.roles, front: { ...front, edges: front.edges.map((edge, index) => index === 0 && edge.kind === "curve" ? { ...edge, curve: { ...edge.curve, start: { x: 123, y: 456 } } } : edge) } } };
    expect(() => semanticAnchorCatalog(recipe.name, open)).toThrow(/open junction/);
  });
});

describe("semantic edit source and operations", () => {
  it("fingerprints canonical source blocks and fails closed without Web Crypto", async () => {
    const recipe = GARMENTS[0];
    const block = sourceBlock(recipe);
    const reordered: Block = { roles: Object.fromEntries(Object.entries(block.roles).reverse()), stitches: block.stitches };
    await expect(semanticEditSourceFingerprint(recipe.name, reordered)).resolves.toBe(await semanticEditSourceFingerprint(recipe.name, block));
    await expect(semanticEditSourceFingerprint(recipe.name, block, {} as Crypto)).rejects.toThrow(/SHA-256 is unavailable/);
    await expect(semanticEditSourceFingerprint("", block)).rejects.toThrow(/SHA-256 is unavailable/);
    await expect(semanticEditSourceFingerprint(recipe.name, { ...block, extra: Number.NaN } as never)).rejects.toThrow(/non-finite number/);
    await expect(semanticEditSourceFingerprint(recipe.name, { ...block, extra: () => undefined } as never)).rejects.toThrow(/canonical JSON data/);
    await expect(semanticEditSourceFingerprint(recipe.name, { ...block, extra: null } as never)).resolves.toContain("semantic-edit:v1:sha256:");
  });

  it("rejects empty recipe or source identity", () => {
    expect(() => emptySemanticEditDocument("", "source")).toThrow(/recipe and source fingerprint/);
    expect(() => emptySemanticEditDocument("tee", "")).toThrow(/recipe and source fingerprint/);
  });

  it("creates an exact centimetre move and rejects malformed or unknown requests", async () => {
    const recipe = GARMENTS[0];
    const block = sourceBlock(recipe);
    const { fingerprint } = await emptyDocument(recipe);
    const anchor = semanticAnchorCatalog(recipe.name, block)[0];
    const operation = moveOperation(recipe, block, fingerprint, "op-1", anchor.id, 0.125, -0.25);
    expect(operation.moves[0]).toMatchObject({ anchorId: anchor.id, signature: anchor.signature, deltaCm: { x: 0.125, y: -0.25 } });
    expect(() => createAnchorMoveOperation(recipe.name, fingerprint, block, " ", anchor.id, { x: 1, y: 0 })).toThrow(/stable ID/);
    expect(() => createAnchorMoveOperation(recipe.name, fingerprint, block, "op-bad", anchor.id, { x: Number.NaN, y: 0 })).toThrow(/finite centimetres/);
    expect(() => createAnchorMoveOperation(recipe.name, fingerprint, block, "op-missing", "not-an-anchor", { x: 1, y: 0 })).toThrow(/not present/);
  });

  it("appends atomically, bounds undo history, clears redo, and preserves immutable snapshots", async () => {
    const recipe = GARMENTS[0];
    const block = sourceBlock(recipe);
    const { fingerprint, document } = await emptyDocument(recipe);
    const anchor = semanticAnchorCatalog(recipe.name, block)[0];
    const first = moveOperation(recipe, block, fingerprint, "op-1", anchor.id, 0.1, 0);
    const second = moveOperation(recipe, block, fingerprint, "op-2", anchor.id, 0.2, 0);
    const next = appendSemanticEditOperations(document, [first, second]);
    expect(next.operations).toEqual([first, second]);
    expect(next.past).toEqual([[]]);
    expect(document.operations).toEqual([]);
    expect(undoSemanticEdit(next).operations).toEqual([]);
    const undone = undoSemanticEdit(next);
    expect(redoSemanticEdit(undone).operations).toEqual([first, second]);
    expect(redoSemanticEdit(next)).toBe(next);
    expect(undoSemanticEdit(document)).toBe(document);
    const branch = moveOperation(recipe, block, fingerprint, "branch", anchor.id, 0.4, 0);
    expect(appendSemanticEditOperations(undone, [branch]).future).toEqual([]);
    expect(() => appendSemanticEditOperations(document, [])).toThrow(/At least one/);
    expect(() => appendSemanticEditOperations(document, [{ ...first, sourceFingerprint: "other" }])).toThrow(/invalid or conflicts/);
    expect(() => appendSemanticEditOperations(next, [first])).toThrow(/invalid or conflicts/);
    expect(() => appendSemanticEditOperations(document, [{ ...first, moves: [{ ...first.moves[0], deltaCm: { x: Infinity, y: 0 } }] }])).toThrow(/invalid anchor data/);
    let bounded = document;
    for (let index = 0; index < SEMANTIC_EDIT_HISTORY_LIMIT + 2; index++) {
      bounded = appendSemanticEditOperations(bounded, [moveOperation(recipe, block, fingerprint, `op-${index}`, anchor.id, 0.01, 0)]);
    }
    expect(bounded.past).toHaveLength(SEMANTIC_EDIT_HISTORY_LIMIT);
    expect(appendSemanticEditOperations(document, [first], 0).past).toEqual([[]]);
  });

  it("replays a rigid translation on every size and keeps the source draft immutable", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const block = sourceBlock(recipe);
    const { fingerprint, document } = await emptyDocument(recipe);
    const sleeveAnchors = semanticAnchorCatalog(recipe.name, block).filter((anchor) => anchor.roleId === "sleeve");
    const operations = sleeveAnchors.map((anchor, index) => moveOperation(recipe, block, fingerprint, `sleeve-${index}`, anchor.id, 0.2, 0.1));
    const edited = appendSemanticEditOperations(document, operations);
    const result = evaluateSemanticEditDocument(recipe, STANDARD_M, optionsFor(recipe), edited, fingerprint);
    expect(result.status).toBe("ready");
    expect(result.canExportRun).toBe(true);
    expect(result.sizes).toHaveLength(recipe.sizes.length);
    expect(result.sizes.every((size) => size.canExport)).toBe(true);
    expect(result.sizes[0].block.roles.sleeve.edges[0]).not.toEqual(block.roles.sleeve.edges[0]);
    expect(block.roles.sleeve.edges[0]).toEqual(sourceBlock(recipe).roles.sleeve.edges[0]);
  });

  it("reports every unchanged recipe baseline as usable across its declared sizes", async () => {
    for (const recipe of GARMENTS) {
      const { fingerprint, document } = await emptyDocument(recipe);
      const result = evaluateSemanticEditDocument(recipe, STANDARD_M, optionsFor(recipe), document, fingerprint);
      expect(result.status, recipe.name).toBe("ready");
      expect(result.canExportRun, recipe.name).toBe(true);
      expect(result.sizes.map((size) => size.step)).toEqual(recipe.sizes.map((size) => size.step));
    }
  });

  it("retains a geometrically addressable seam-breaking move and blocks its dependent exports", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const block = sourceBlock(recipe);
    const { fingerprint, document } = await emptyDocument(recipe);
    const shoulderCorner = semanticAnchorCatalog(recipe.name, block).find((anchor) => anchor.id.endsWith("/junction/neckline/shoulder"))!;
    const operation = moveOperation(recipe, block, fingerprint, "break-join", shoulderCorner.id, 3, 0);
    const result = evaluateSemanticEditDocument(recipe, STANDARD_M, optionsFor(recipe), appendSemanticEditOperations(document, [operation]), fingerprint);
    expect(result.status).toBe("blocked");
    expect(result.canExportSize(0)).toBe(false);
    expect(result.canExportRun).toBe(false);
    expect(result.issues.some((issue) => issue.code === "stitch-invalid")).toBe(true);
    expect(result.sizes[0].block.roles.front.edges).not.toEqual(block.roles.front.edges);
    expect(result.canExportSize(recipe.sizes[0].step)).toBe(false);
    expect(result.canExportSize(999)).toBe(false);
    const staleSignature: SemanticEditOperation = { ...operation, moves: [{ ...operation.moves[0], signature: "changed-signature" }] };
    const signatureDoc = { ...document, operations: [staleSignature] };
    const signatureResult = evaluateSemanticEditDocument(recipe, STANDARD_M, optionsFor(recipe), signatureDoc, fingerprint);
    expect(signatureResult.issues.some((issue) => issue.code === "anchor-changed")).toBe(true);
  });

  it("blocks crossing, collapsed, open, non-finite, and ambiguous-fold geometry", async () => {
    const square: Block = { stitches: [], roles: { front: {
      name: "test square", onFold: false, edges: [
        { kind: "line", name: "top", start: point(0, 0), end: point(10, 0) },
        { kind: "line", name: "right", start: point(10, 0), end: point(10, 10) },
        { kind: "line", name: "bottom", start: point(10, 10), end: point(0, 10) },
        { kind: "line", name: "left", start: point(0, 10), end: point(0, 0) },
      ],
    } } };
    const squareRecipe: GarmentRecipe = { ...TEE, name: "test-square", draft: () => square, sizes: [{ label: "M", step: 0 }], grade: {}, checks: () => [] };
    const fingerprint = await semanticEditSourceFingerprint(squareRecipe.name, square);
    const document = emptySemanticEditDocument(squareRecipe.name, fingerprint);
    const corner = semanticAnchorCatalog(squareRecipe.name, square).find((anchor) => anchor.id.endsWith("/junction/top/right"))!;
    const crossing = createAnchorMoveOperation(squareRecipe.name, fingerprint, square, "cross", corner.id, { x: -20, y: 5 });
    const crossed = evaluateSemanticEditDocument(squareRecipe, STANDARD_M, {}, appendSemanticEditOperations(document, [crossing]), fingerprint);
    expect(crossed.issues.some((issue) => issue.code === "piece-self-intersection")).toBe(true);

    const collapsed: Block = { ...square, roles: { front: { ...square.roles.front, edges: square.roles.front.edges.map((edge) => ({ kind: "line" as const, name: edge.name, start: point(0, 0), end: point(0, 0) })) } } };
    const collapsedRecipe: GarmentRecipe = { ...squareRecipe, name: "collapsed", draft: () => collapsed };
    const collapsedResult = evaluateSemanticEditDocument(collapsedRecipe, STANDARD_M, {}, emptySemanticEditDocument("collapsed", "collapsed-source"), "collapsed-source");
    expect(collapsedResult.issues.some((issue) => issue.code === "piece-degenerate")).toBe(true);

    const teeBlock = sourceBlock(TEE);
    const teeFingerprint = "test-source";
    const openFront = { ...teeBlock.roles.front, edges: teeBlock.roles.front.edges.map((edge, index) => index === 0 && edge.kind === "curve" ? { ...edge, curve: { ...edge.curve, start: point(40, 40) } } : edge) };
    const openBlock: Block = { ...teeBlock, roles: { ...teeBlock.roles, front: openFront } };
    const openRecipe: GarmentRecipe = { ...TEE, draft: () => openBlock };
    const opened = evaluateSemanticEditDocument(openRecipe, STANDARD_M, {}, emptySemanticEditDocument(TEE.name, teeFingerprint), teeFingerprint);
    expect(opened.issues.some((issue) => issue.code === "piece-open")).toBe(true);

    const invalidFront = { ...teeBlock.roles.front, edges: teeBlock.roles.front.edges.map((edge, index) => index === 0 && edge.kind === "curve" ? { ...edge, curve: { ...edge.curve, control1: { x: Number.NaN, y: 0 } } } : edge) };
    const nonFiniteBlock: Block = { ...teeBlock, roles: { ...teeBlock.roles, front: invalidFront } };
    const nonFiniteRecipe: GarmentRecipe = { ...TEE, draft: () => nonFiniteBlock };
    const nonFinite = evaluateSemanticEditDocument(nonFiniteRecipe, STANDARD_M, {}, emptySemanticEditDocument(TEE.name, teeFingerprint), teeFingerprint);
    expect(nonFinite.issues.some((issue) => issue.code === "piece-non-finite")).toBe(true);

    const foldedSquare: Block = { stitches: [], roles: { front: { name: "folded", onFold: true, edges: [
      { kind: "line", name: "a", start: point(0, 0), end: point(10, 0) },
      { kind: "line", name: "b", start: point(10, 0), end: point(10, 10) },
      { kind: "line", name: "c", start: point(10, 10), end: point(0, 10) },
      { kind: "line", name: "d", start: point(0, 10), end: point(0, 0) },
    ] } } };
    const foldedRecipe: GarmentRecipe = { ...squareRecipe, name: "ambiguous-fold", draft: () => foldedSquare };
    const ambiguousFold = evaluateSemanticEditDocument(foldedRecipe, STANDARD_M, {}, emptySemanticEditDocument(foldedRecipe.name, "fold-source"), "fold-source");
    expect(ambiguousFold.issues.some((issue) => issue.code === "fold-edge-ambiguous")).toBe(true);
  });

  it("detects a per-size missing anchor and missing stitch references", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const base = sourceBlock(recipe);
    const { fingerprint, document } = await emptyDocument(recipe);
    const sleeveAnchor = semanticAnchorCatalog(recipe.name, base).find((anchor) => anchor.roleId === "sleeve")!;
    const operation = moveOperation(recipe, base, fingerprint, "size-anchor", sleeveAnchor.id, 0.1, 0);
    const withoutSleeve: Block = { ...base, roles: Object.fromEntries(Object.entries(base.roles).filter(([role]) => role !== "sleeve")) };
    const changingRecipe: GarmentRecipe = {
      ...recipe,
      sizes: [{ label: "M", step: 0 }, { label: "L", step: 1 }],
      grade: { chest: 1 },
      draft: (measurements) => measurements.chest === STANDARD_M.chest ? base : withoutSleeve,
    };
    const result = evaluateSemanticEditDocument(changingRecipe, STANDARD_M, optionsFor(recipe), appendSemanticEditOperations(document, [operation]), fingerprint);
    expect(result.issues.some((issue) => issue.code === "anchor-missing" && issue.sizeLabel === "L")).toBe(true);
    expect(result.sizes.find((size) => size.label === "M")?.canExport).toBe(true);
    expect(result.canExportRun).toBe(false);
    const brokenStitches: GarmentRecipe = { ...recipe, draft: () => withoutSleeve };
    const stitchResult = evaluateSemanticEditDocument(brokenStitches, STANDARD_M, optionsFor(recipe), emptySemanticEditDocument(recipe.name, "broken"), "broken");
    expect(stitchResult.issues.some((issue) => issue.code === "stitch-invalid")).toBe(true);
  });

  it("blocks duplicate edge names in drafted geometry and reports a failed anchor catalog", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const base = sourceBlock(recipe);
    const front = base.roles.front;
    const duplicateFront = {
      ...front,
      edges: front.edges.map((edge, index) => index === 1 ? { ...edge, name: front.edges[0].name } : edge),
    };
    const duplicateBlock: Block = { ...base, roles: { ...base.roles, front: duplicateFront } };
    expect(inspectSemanticEditCandidate(recipe, STANDARD_M, duplicateBlock)
      .some((issue) => issue.code === "piece-edge-name-duplicate")).toBe(true);
    const { fingerprint, document } = await emptyDocument(recipe);
    const duplicateNamesRecipe: GarmentRecipe = { ...recipe, draft: () => duplicateBlock };
    const duplicateNames = evaluateSemanticEditDocument(duplicateNamesRecipe, STANDARD_M, optionsFor(recipe), document, fingerprint);
    expect(duplicateNames.issues.some((issue) => issue.code === "piece-edge-name-duplicate")).toBe(true);

    const anchor = semanticAnchorCatalog(recipe.name, base)[0];
    const operation = moveOperation(recipe, base, fingerprint, "ambiguous-catalog", anchor.id, 0.1, 0);
    const withOperation = appendSemanticEditOperations(document, [operation]);
    const catalogFailure = evaluateSemanticEditDocument(duplicateNamesRecipe, STANDARD_M, optionsFor(recipe), withOperation, fingerprint);
    expect(catalogFailure.issues.some((issue) => issue.code === "anchor-changed" && issue.message.includes("duplicate edge names"))).toBe(true);
    expect(catalogFailure.canExportRun).toBe(false);

    let primitiveThrown = false;
    const onceFailingEdges = new Proxy(front.edges, {
      get(target, property, receiver) {
        if (property === "map" && !primitiveThrown) {
          primitiveThrown = true;
          throw "non-error anchor catalog failure";
        }
        return Reflect.get(target, property, receiver);
      },
    });
    const onceFailingBlock: Block = { ...base, roles: { ...base.roles, front: { ...front, edges: onceFailingEdges } } };
    const onceFailingRecipe: GarmentRecipe = { ...recipe, draft: () => onceFailingBlock };
    const primitiveCatalogFailure = evaluateSemanticEditDocument(onceFailingRecipe, STANDARD_M, optionsFor(recipe), withOperation, fingerprint);
    expect(primitiveCatalogFailure.issues.some((issue) => issue.code === "anchor-changed" && issue.message === "The semantic anchor catalog is invalid.")).toBe(true);
  });

  it("reports failed recipe checks and malformed edit document identity", async () => {
    const recipe = GARMENTS[0];
    const { fingerprint, document } = await emptyDocument(recipe);
    const mismatch = evaluateSemanticEditDocument(GARMENTS[1], STANDARD_M, optionsFor(GARMENTS[1]), document, fingerprint);
    expect(mismatch.status).toBe("blocked");
    expect(mismatch.canExportRun).toBe(false);
    const unknownVersion = evaluateSemanticEditDocument(recipe, STANDARD_M, optionsFor(recipe), { ...document, schemaVersion: 2 } as never, fingerprint);
    expect(unknownVersion.issues[0].code).toBe("invalid-operation");
    expect(unknownVersion.canExportSize(0)).toBe(false);
    expect(unknownVersion.canExportRun).toBe(false);
    expect(evaluateSemanticEditDocument(recipe, STANDARD_M, optionsFor(recipe), document, "changed").canExportSize(0)).toBe(false);
    const failingRecipe: GarmentRecipe = { ...TEE, checks: () => [{ name: "fixture", ok: false, detail: "forced failure" }] };
    const forced = evaluateSemanticEditDocument(failingRecipe, STANDARD_M, {}, emptySemanticEditDocument(TEE.name, fingerprint), fingerprint);
    expect(forced.issues.some((issue) => issue.code === "recipe-check-invalid")).toBe(true);
    expect(forced.canExportRun).toBe(false);
    const throwingRecipe: GarmentRecipe = { ...TEE, checks: () => { throw new Error("check exception"); } };
    const thrown = evaluateSemanticEditDocument(throwingRecipe, STANDARD_M, {}, emptySemanticEditDocument(TEE.name, fingerprint), fingerprint);
    expect(thrown.issues.some((issue) => issue.code === "recipe-check-invalid" && issue.message.includes("check exception"))).toBe(true);
    const nonErrorRecipe: GarmentRecipe = { ...TEE, checks: () => { throw "non-error check failure"; } };
    const nonErrorResult = evaluateSemanticEditDocument(nonErrorRecipe, STANDARD_M, {}, emptySemanticEditDocument(TEE.name, fingerprint), fingerprint);
    expect(nonErrorResult.issues.some((issue) => issue.code === "recipe-check-invalid" && issue.message === "Recipe checks could not be evaluated.")).toBe(true);

    const base = sourceBlock(TEE);
    const throwingStitches = new Proxy([] as Block["stitches"], {
      get(target, property, receiver) {
        if (property === "map") throw "non-error stitch failure";
        return Reflect.get(target, property, receiver);
      },
    });
    const invalidStitchBlock: Block = { ...base, stitches: throwingStitches };
    const invalidStitchRecipe: GarmentRecipe = { ...TEE, draft: () => invalidStitchBlock };
    const invalidStitches = evaluateSemanticEditDocument(invalidStitchRecipe, STANDARD_M, {}, emptySemanticEditDocument(TEE.name, fingerprint), fingerprint);
    expect(invalidStitches.issues.some((issue) => issue.code === "stitch-invalid" && issue.message === "Stitch references are invalid.")).toBe(true);
    const noSizes: GarmentRecipe = { ...TEE, sizes: [] };
    const noSizeResult = evaluateSemanticEditDocument(noSizes, STANDARD_M, {}, emptySemanticEditDocument(TEE.name, fingerprint), fingerprint);
    expect(noSizeResult.canExportRun).toBe(false);
    expect(noSizeResult.canExportSize(0)).toBe(false);
  });

  it("blocks non-finite graded measurements, rounded POMs, and tech-pack callouts", async () => {
    const block = sourceBlock(TEE);
    const fingerprint = await semanticEditSourceFingerprint(TEE.name, block);
    const document = emptySemanticEditDocument(TEE.name, fingerprint);
    const invalidPomRecipe: GarmentRecipe = {
      ...TEE,
      poms: [
        { label: "non-finite measurement", measure: () => Number.NaN },
        { label: "overflow after spec rounding", measure: () => Number.MAX_VALUE },
        { label: "non-finite callout", measure: () => 12, anchor: () => ({ x: Number.NaN, y: 0 }) },
        { label: "throwing measure", measure: () => { throw new Error("missing named POM edge"); } },
        { label: "non-error measure", measure: () => { throw "unknown POM failure"; } },
      ],
    };
    const invalidPoms = evaluateSemanticEditDocument(invalidPomRecipe, STANDARD_M, {}, document, fingerprint);
    const specIssues = invalidPoms.issues.filter((issue) => issue.code === "spec-invalid");
    expect(specIssues.some((issue) => issue.checkName === "non-finite measurement")).toBe(true);
    expect(specIssues.some((issue) => issue.checkName === "overflow after spec rounding")).toBe(true);
    expect(specIssues.some((issue) => issue.message.includes("callout") && issue.checkName === "non-finite callout")).toBe(true);
    expect(specIssues.some((issue) => issue.message.includes("missing named POM edge"))).toBe(true);
    expect(specIssues.some((issue) => issue.message === "Point of measure \"non-error measure\" could not be evaluated.")).toBe(true);
    expect(invalidPoms.canExportRun).toBe(false);

    const invalidMeasurements = { ...STANDARD_M, chest: Number.NaN };
    const invalidSource = evaluateSemanticEditDocument(TEE, invalidMeasurements, {}, document, fingerprint);
    expect(invalidSource.issues.some((issue) => issue.code === "measurement-non-finite" && issue.message.includes("chest"))).toBe(true);
    expect(invalidSource.canExportRun).toBe(false);
  });

  it("rejects imported malformed operations without applying or exporting them", async () => {
    const recipe = GARMENTS[0];
    const block = sourceBlock(recipe);
    const { fingerprint, document } = await emptyDocument(recipe);
    const anchor = semanticAnchorCatalog(recipe.name, block)[0];
    const valid = moveOperation(recipe, block, fingerprint, "imported", anchor.id, 0.1, 0);
    const malformed = [
      { ...valid, recipeId: "other" },
      { ...valid, kind: "unknown" },
      { ...valid, schemaVersion: 2 },
      { ...valid, sourceFingerprint: "stale" },
      { ...valid, moves: [] },
      { ...valid, moves: undefined },
      { ...valid, moves: [{ ...valid.moves[0], anchorId: "" }] },
      { ...valid, moves: [{ ...valid.moves[0], signature: "" }] },
      { ...valid, moves: [{ ...valid.moves[0], deltaCm: { x: Infinity, y: 0 } }] },
    ];
    for (const operation of malformed) {
      const result = evaluateSemanticEditDocument(recipe, STANDARD_M, optionsFor(recipe), { ...document, operations: [operation] } as never, fingerprint);
      expect(result.issues.some((issue) => issue.code === "invalid-operation")).toBe(true);
      expect(result.canExportRun).toBe(false);
    }
  });

  it("handles triangle and empty outlines deterministically", async () => {
    const triangle: Block = { stitches: [], roles: { front: { name: "triangle", onFold: false, edges: [
      { kind: "line", name: "a", start: point(0, 0), end: point(10, 0) },
      { kind: "line", name: "b", start: point(10, 0), end: point(5, 10) },
      { kind: "line", name: "c", start: point(5, 10), end: point(0, 0) },
    ] } } };
    const triangleRecipe: GarmentRecipe = { ...TEE, name: "triangle", draft: () => triangle, poms: [], sizes: [{ label: "M", step: 0 }], grade: {}, checks: () => [] };
    const triangleFingerprint = await semanticEditSourceFingerprint(triangleRecipe.name, triangle);
    expect(evaluateSemanticEditDocument(triangleRecipe, STANDARD_M, {}, emptySemanticEditDocument(triangleRecipe.name, triangleFingerprint), triangleFingerprint).status).toBe("ready");
    const empty: Block = { stitches: [], roles: { front: { name: "empty", onFold: false, edges: [] } } };
    const emptyRecipe: GarmentRecipe = { ...triangleRecipe, name: "empty", draft: () => empty };
    const emptyResult = evaluateSemanticEditDocument(emptyRecipe, STANDARD_M, {}, emptySemanticEditDocument("empty", "empty-source"), "empty-source");
    expect(emptyResult.issues.some((issue) => issue.code === "piece-degenerate")).toBe(true);
    expect(emptyResult.issues.some((issue) => issue.code === "piece-self-intersection")).toBe(true);
  });

  it("blocks a folded panel when an anchor moves the named fold off x=0", async () => {
    const recipe = GARMENTS[0];
    const block = sourceBlock(recipe);
    const { fingerprint, document } = await emptyDocument(recipe);
    const foldCorner = semanticAnchorCatalog(recipe.name, block).find((anchor) => anchor.id.endsWith("/junction/hem/centerFront"))!;
    const operation = moveOperation(recipe, block, fingerprint, "break-fold", foldCorner.id, 1, 0);
    const result = evaluateSemanticEditDocument(recipe, STANDARD_M, optionsFor(recipe), appendSemanticEditOperations(document, [operation]), fingerprint);
    expect(result.status).toBe("blocked");
    expect(result.issues.some((issue) => issue.code === "fold-edge-invalid" || issue.code === "fold-side-crossed")).toBe(true);
    expect(result.canExportRun).toBe(false);
    const crossFold = moveOperation(recipe, block, fingerprint, "cross-fold", foldCorner.id, -1, 0);
    const crossed = evaluateSemanticEditDocument(recipe, STANDARD_M, optionsFor(recipe), appendSemanticEditOperations(document, [crossFold]), fingerprint);
    expect(crossed.issues.some((issue) => issue.code === "fold-side-crossed")).toBe(true);
  });

  it("requires explicit rebase when source geometry changes and reapplies same-signature deltas", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const block = sourceBlock(recipe);
    const { fingerprint, document } = await emptyDocument(recipe);
    const sleeveAnchors = semanticAnchorCatalog(recipe.name, block).filter((anchor) => anchor.roleId === "sleeve");
    const operations = sleeveAnchors.map((anchor, index) => moveOperation(recipe, block, fingerprint, `sleeve-shift-${index}`, anchor.id, 0.2, 0.1));
    const edited = appendSemanticEditOperations(document, operations);
    const changedMeasurements = { ...STANDARD_M, chest: STANDARD_M.chest + 2 };
    const nextBlock = sourceBlock(recipe, changedMeasurements);
    const nextFingerprint = await semanticEditSourceFingerprint(recipe.name, nextBlock);
    expect(evaluateSemanticEditDocument(recipe, changedMeasurements, optionsFor(recipe), edited, nextFingerprint).status).toBe("rebase-required");
    const rebased = rebaseSemanticEditDocument(edited, recipe, nextBlock, nextFingerprint);
    expect(rebased.ok).toBe(true);
    expect(rebased.document.sourceFingerprint).toBe(nextFingerprint);
    expect(rebased.document.operations[0].moves[0].deltaCm).toEqual({ x: 0.2, y: 0.1 });
    expect(evaluateSemanticEditDocument(recipe, changedMeasurements, optionsFor(recipe), rebased.document, nextFingerprint).status).toBe("ready");
  });

  it("blocks rebase when a target is missing or its meaning changed", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const block = sourceBlock(recipe);
    const { fingerprint, document } = await emptyDocument(recipe);
    const anchor = semanticAnchorCatalog(recipe.name, block).find((candidate) => candidate.roleId === "sleeve")!;
    const edited = appendSemanticEditOperations(document, [moveOperation(recipe, block, fingerprint, "sleeve-edit", anchor.id, 0.2, 0)]);
    const withoutSleeve: Block = { ...block, roles: Object.fromEntries(Object.entries(block.roles).filter(([role]) => role !== "sleeve")) };
    const missing = rebaseSemanticEditDocument(edited, recipe, withoutSleeve, "next-source");
    expect(missing.ok).toBe(false);
    expect(missing.issues[0].code).toBe("anchor-missing");
    const changedRole: Block = { ...block, roles: { ...block.roles, sleeve: { ...block.roles.sleeve, name: "renamed sleeve" } } };
    const changed = rebaseSemanticEditDocument(edited, recipe, changedRole, "next-source");
    expect(changed.ok).toBe(false);
    expect(changed.issues[0].code).toBe("anchor-changed");
    expect(changed.document).toBe(edited);
    expect(rebaseSemanticEditDocument({ ...edited, recipeId: "wrong" }, recipe, block, "next-source").issues[0].code).toBe("invalid-source");
    expect(rebaseSemanticEditDocument(edited, recipe, block, "").issues[0].code).toBe("invalid-source");
    const duplicate: Block = { ...block, roles: { ...block.roles, sleeve: { ...block.roles.sleeve, edges: block.roles.sleeve.edges.map((edge, index) => index === 1 ? { ...edge, name: block.roles.sleeve.edges[0].name } : edge) } } };
    expect(rebaseSemanticEditDocument(edited, recipe, duplicate, "next-source").issues[0].code).toBe("anchor-changed");
    const throwingEdges = new Proxy(block.roles.sleeve.edges, {
      get(target, property, receiver) {
        if (property === "map") throw "non-error catalog failure";
        return Reflect.get(target, property, receiver);
      },
    });
    const throwingBase: Block = { ...block, roles: { ...block.roles, sleeve: { ...block.roles.sleeve, edges: throwingEdges } } };
    const nonErrorCatalog = rebaseSemanticEditDocument(edited, recipe, throwingBase, "next-source");
    expect(nonErrorCatalog.ok).toBe(false);
    expect(nonErrorCatalog.issues[0].message).toBe("The new source has ambiguous semantic anchors.");
  });
});

describe("semantic edit conflict resolution", () => {
  it("automatically combines distinct anchors and deduplicates an operation already on both sides", async () => {
    const recipe = GARMENTS[0];
    const block = sourceBlock(recipe);
    const { fingerprint } = await emptyDocument(recipe);
    const anchors = semanticAnchorCatalog(recipe.name, block).slice(0, 3);
    const remote = moveOperation(recipe, block, fingerprint, "remote-a", anchors[0].id, 0.1, 0);
    const common = moveOperation(recipe, block, fingerprint, "common", anchors[1].id, 0.1, 0);
    const local = moveOperation(recipe, block, fingerprint, "local-c", anchors[2].id, 0, 0.1);
    const merged = mergeConcurrentEditOperations([common, local], [remote, common]);
    expect(merged.ok).toBe(true);
    expect(merged.operations.map((operation) => operation.id)).toEqual(["remote-a", "common", "local-c"]);
  });

  it("requires keep-local or keep-remote for overlapping anchor targets", async () => {
    const recipe = GARMENTS[0];
    const block = sourceBlock(recipe);
    const { fingerprint } = await emptyDocument(recipe);
    const anchor = semanticAnchorCatalog(recipe.name, block)[0];
    const local = moveOperation(recipe, block, fingerprint, "local", anchor.id, 0.2, 0);
    const remote = moveOperation(recipe, block, fingerprint, "remote", anchor.id, 0, 0.2);
    const conflict = mergeConcurrentEditOperations([local], [remote]);
    expect(conflict.ok).toBe(false);
    expect(conflict.conflicts).toHaveLength(1);
    expect(mergeConcurrentEditOperations([local], [remote], { [anchor.id]: "keep-local" }).operations).toEqual([local]);
    expect(mergeConcurrentEditOperations([local], [remote], { [anchor.id]: "keep-remote" }).operations).toEqual([remote]);
  });

  it("rejects reused operation IDs with different contents", async () => {
    const recipe = GARMENTS[0];
    const block = sourceBlock(recipe);
    const { fingerprint } = await emptyDocument(recipe);
    const anchor = semanticAnchorCatalog(recipe.name, block)[0];
    const local = moveOperation(recipe, block, fingerprint, "same-id", anchor.id, 0.2, 0);
    const remote = moveOperation(recipe, block, fingerprint, "same-id", anchor.id, 0, 0.2);
    const result = mergeConcurrentEditOperations([local], [remote]);
    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("identity-conflict");
    expect(mergeConcurrentEditOperations([local, local], []).operations).toEqual([local]);
    expect(mergeConcurrentEditOperations([], [remote, remote]).operations).toEqual([remote]);
    const sameIdDifferentBody = moveOperation(recipe, block, fingerprint, "same-id", anchor.id, 0.3, 0);
    expect(mergeConcurrentEditOperations([local, sameIdDifferentBody], []).issues[0].code).toBe("identity-conflict");
    const distinctRemote = moveOperation(recipe, block, fingerprint, "remote-different-id", anchor.id, 0, 0.2);
    expect(mergeConcurrentEditOperations([local], [distinctRemote], { [anchor.id]: "guess" as never }).issues[0].code).toBe("target-conflict");
    expect(mergeConcurrentEditOperations([local], [{ ...distinctRemote, sourceFingerprint: "other-source" }]).issues[0].code).toBe("source-conflict");
    expect(mergeConcurrentEditOperations([local], [{ ...distinctRemote, recipeId: "other-recipe" }]).issues[0].code).toBe("source-conflict");
    expect(mergeConcurrentEditOperations([local], [{ ...distinctRemote, schemaVersion: 2 as never }]).issues[0].code).toBe("source-conflict");
    expect(mergeConcurrentEditOperations([], []).ok).toBe(true);
  });
});
