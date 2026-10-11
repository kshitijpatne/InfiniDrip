import { describe, expect, it } from "vitest";
import { STANDARD_M, GARMENTS, blockPieces, gradeRun } from "../drafting";
import optionMatrix from "../../docs/research/epic17/S330-integrated-browser/matrix.json";
import { exportDxfCentimeters } from "./dxf-centimeters";
import { adaptiveSeamAllowance, CUT_GEOMETRY_ALGORITHM } from "./adaptive-cut";
import {
  createDxfInterchangePackage,
  verifyDxfInterchangePackage,
} from "./dxf-interchange-package";
import { expandNamedDxfDrawing, readNamedDxfDrawing, wrapDxfEntitiesInNamedBlocks } from "./named-dxf-blocks";

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).filter((key) => record[key] !== undefined).sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  throw new Error("not JSON-compatible");
}

async function sha256(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

describe("C04-bounded DXF interchange package", () => {
  it("binds every registered recipe and grade row to an exact DXF and seam graph", async () => {
    for (const recipe of GARMENTS) {
      const run = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft);
      expect(run).toHaveLength(recipe.sizes.length);
      for (const graded of run) {
        const candidate = await createDxfInterchangePackage(recipe, graded);
        expect(candidate.manifest.recipe.id).toBe(recipe.name);
        expect(candidate.manifest.grade.selectedSize).toEqual({ label: graded.label, step: graded.step });
        expect(candidate.manifest.grade.sizeRun).toEqual(recipe.sizes);
        expect(candidate.manifest.units).toEqual({ length: "cm", dxfInsunits: 5 });
        expect(candidate.manifest.pieces.map((piece) => piece.role)).toEqual(Object.keys(graded.block.roles));
        expect(candidate.manifest.stitches).toEqual(graded.block.stitches);
        const expectedMarks = [];
        for (const [role, piece] of Object.entries(graded.block.roles)) {
          const identity = candidate.manifest.pieces.find((record) => record.role === role)!;
          let entityOrdinal = 3;
          for (const mark of piece.marks ?? []) {
            const isLine = "start" in mark;
            const isCross = !isLine && mark.kind === "buttonhole";
            const entityCount = isCross ? 2 : 1;
            expectedMarks.push({
              id: `${recipe.name}:${role}:mark:${mark.name}`,
              pieceId: `${recipe.name}:${role}`,
              entityOrdinal,
              blockName: identity.blockName,
              sourceRevisionId: identity.sourceRevisionId,
              name: mark.name,
              kind: mark.kind,
              entityType: isLine ? "LINE" : mark.kind === "button" ? "CIRCLE" : isCross ? "LINE" : "POINT",
              entityCount,
              ...(isCross ? { displayEncoding: "centered-cross/1" } : {}),
              layer: `MARK_${mark.kind.toUpperCase()}`,
              sourceGeometry: isLine
                ? { kind: "segment", start: mark.start, end: mark.end }
                : { kind: "point", at: mark.at },
              ...(mark.label !== undefined ? { label: mark.label } : {}),
              ...(mark.labelRole !== undefined ? { labelRole: mark.labelRole } : {}),
            });
            entityOrdinal += entityCount;
          }
        }
        expect(candidate.manifest.patternMarks).toEqual(expectedMarks);
        const candidatePieces = blockPieces(graded.block);
        expect(candidate.manifest.schemaVersion).toBe("infinidrip.g04.dxf-package/5");
        expect(candidate.manifest.cutGeometryAlgorithm).toBe(CUT_GEOMETRY_ALGORITHM);
        expect(candidate.manifest.pieces.every((piece) => piece.blockName.includes(piece.sourceRevisionId.slice(0, 16).toUpperCase()))).toBe(true);
        const drawing = readNamedDxfDrawing(candidate.dxf);
        expect(drawing.blocks.map((block) => block.name)).toEqual(candidate.manifest.pieces.map((piece) => piece.blockName));
        expect(drawing.inserts.map((insert) => insert.name)).toEqual(candidate.manifest.pieces.map((piece) => piece.blockName));
        expect(expandNamedDxfDrawing(candidate.dxf)).toHaveLength(drawing.blocks.reduce((total, block) => total + block.entities.length, 0));
        const candidateCuts = candidatePieces.map((piece) => adaptiveSeamAllowance(piece, recipe.allowances));
        const flatDxf = exportDxfCentimeters(candidatePieces, recipe.allowances, recipe.notches, candidateCuts, "cross");
        const expectedGroups = candidate.manifest.pieces.map((pieceRecord, index) => {
          const piece = candidatePieces[index]!;
          const notchTable = recipe.notches.find((table) => table.pieceName === piece.name);
          return {
            name: pieceRecord.blockName,
            leadingEntityCount: 2 + (piece.marks ?? []).reduce((total, mark) =>
              total + (!("start" in mark) && mark.kind === "buttonhole" ? 2 : 1), 0),
            trailingEntityCount: notchTable ? notchTable.notches.length + 5 : 0,
          };
        });
        expect(candidate.dxf).toBe(wrapDxfEntitiesInNamedBlocks(flatDxf, expectedGroups));
        expect(drawing.blocks.every((block) => {
          const roles = block.entities.map((entity) => entity.split("\n")[1]);
          return roles.includes("POLYLINE");
        })).toBe(true);
        expect(candidate.manifest.drawingSha256).toMatch(/^[0-9a-f]{64}$/);
        expect(candidate.manifest.revisionId).toMatch(/^[0-9a-f]{64}$/);
        expect(candidate.dxf).toContain("9\n$INSUNITS\n70\n5\n");
        expect(candidate.dxf).toContain("MARK_GRAINLINE");
        expect(candidate.dxf).toContain("MARK_NOTCH");
        expect(await verifyDxfInterchangePackage(candidate)).toBe(true);
      }
    }
  }, 60_000);

  it("uses canonical option-key ordering and changes package revision when option data changes", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const options = Object.fromEntries((recipe.options ?? []).slice(0, 2).map((option) => [option.id, option.defaultValue]));
    const reversedOptions = Object.fromEntries(Object.entries(options).reverse());
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, options)[2];
    const first = await createDxfInterchangePackage(recipe, graded, options);
    const reordered = await createDxfInterchangePackage(recipe, graded, reversedOptions);
    const firstDefinition = recipe.options![0]!;
    const changedOptions = { ...options, [firstDefinition.id]: firstDefinition.defaultValue + firstDefinition.step };
    const changedGraded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, changedOptions)[2];
    const changed = await createDxfInterchangePackage(recipe, changedGraded, changedOptions);

    expect(first.dxf).toBe(reordered.dxf);
    expect(first.manifest.revisionId).toBe(reordered.manifest.revisionId);
    expect(first.manifest.revisionId).not.toBe(changed.manifest.revisionId);
  }, 30_000);

  it("packages pieces with no explicit notch table and keeps a valid named drawing", async () => {
    const source = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const recipe = { ...source, notches: [] };
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2]!;
    const candidate = await createDxfInterchangePackage(recipe, graded);
    expect(await verifyDxfInterchangePackage(candidate)).toBe(true);
    expect(readNamedDxfDrawing(candidate.dxf).blocks.every((block) => block.entities.length >= 2)).toBe(true);
  });

  it("rejects piece roles that collide after safe block-name normalization", async () => {
    const sourceRecipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const recipe = {
      ...sourceRecipe,
      draft: (measurements: Parameters<typeof sourceRecipe.draft>[0], options: Parameters<typeof sourceRecipe.draft>[1]) => {
        const block = sourceRecipe.draft(measurements, options);
        const piece = Object.values(block.roles)[0]!;
        return { ...block, roles: { ...block.roles, "collision-role": piece, collision_role: piece } };
      },
    };
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2]!;
    await expect(createDxfInterchangePackage(recipe, graded)).rejects.toThrow("Piece block identity collision");
  });

  it("records every canonical S330 option configuration with fully resolved values", async () => {
    expect(optionMatrix.cases).toHaveLength(73);
    for (const testCase of optionMatrix.cases) {
      const recipe = GARMENTS.find((candidate) => candidate.name === testCase.recipeId)!;
      const options: Record<string, number> = {};
      Object.assign(options, testCase.options ?? {});
      Object.assign(options, testCase.optionValues ?? {});
      const resolvedOptions = Object.fromEntries((recipe.options ?? []).map((definition) => [
        definition.id,
        options[definition.id] ?? definition.defaultValue,
      ]));
      const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, resolvedOptions)[2];
      let candidate;
      try {
        candidate = await createDxfInterchangePackage(recipe, graded, options);
      } catch (error) {
        throw new Error(`${testCase.caseId}: ${error instanceof Error ? error.message : String(error)}`);
      }
      expect(candidate.manifest.options).toEqual(resolvedOptions);
      expect(await verifyDxfInterchangePackage(candidate)).toBe(true);
    }
  }, 60_000);

  it("materializes recipe defaults and rejects invalid or unsupported options", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const definitions = recipe.options ?? [];
    const fullDefaults = Object.fromEntries(definitions.map((definition) => [definition.id, definition.defaultValue]));
    const defaultGraded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2];
    const implicit = await createDxfInterchangePackage(recipe, defaultGraded);
    const explicit = await createDxfInterchangePackage(recipe, defaultGraded, fullDefaults);
    expect(implicit.manifest.options).toEqual(fullDefaults);
    expect(implicit.manifest.revisionId).toBe(explicit.manifest.revisionId);

    const option = definitions[0]!;
    await expect(createDxfInterchangePackage(recipe, defaultGraded, { unsupported: 1 }))
      .rejects.toThrow('Unsupported polo option "unsupported"');
    await expect(createDxfInterchangePackage(recipe, defaultGraded, { [option.id]: Number.NaN }))
      .rejects.toThrow(`polo option "${option.id}" must be a finite number`);
    await expect(createDxfInterchangePackage(recipe, defaultGraded, { [option.id]: option.max + option.step }))
      .rejects.toThrow(`polo option "${option.id}" must be between ${option.min} and ${option.max}`);
    await expect(createDxfInterchangePackage(recipe, defaultGraded, { [option.id]: option.min + option.step / 2 }))
      .rejects.toThrow(`polo option "${option.id}" must match its ${option.step} step`);
    await expect(createDxfInterchangePackage(recipe, defaultGraded, null as never))
      .rejects.toThrow("Package options must be a recipe option object");
    await expect(createDxfInterchangePackage(recipe, defaultGraded, [] as never))
      .rejects.toThrow("Package options must be a recipe option object");
    await expect(createDxfInterchangePackage(recipe, defaultGraded, "invalid" as never))
      .rejects.toThrow("Package options must be a recipe option object");
    await expect(createDxfInterchangePackage({
      ...recipe,
      options: [{ ...option, step: 0 }],
    }, defaultGraded))
      .rejects.toThrow(`polo option "${option.id}" must match its 0 step`);
  });

  it("rejects duplicate and empty source mark identities", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2];
    const [role, piece] = Object.entries(graded.block.roles).find(([, value]) => value.marks?.length)!;
    const marks = piece.marks ?? [];
    const tryMarks = (replacement: typeof marks) => {
      const block = { ...graded.block, roles: { ...graded.block.roles, [role]: { ...piece, marks: replacement } } };
      return createDxfInterchangePackage({ ...recipe, draft: () => block }, { ...graded, block });
    };
    await expect(tryMarks([{ ...marks[0]!, name: "" }, ...marks.slice(1)]))
      .rejects.toThrow("Pattern mark identity must be non-empty and unique");
    await expect(tryMarks([...marks, { ...marks[0]! }]))
      .rejects.toThrow("Pattern mark identity must be non-empty and unique");
    const optionalLabels = marks.map((mark, index) => ({
      ...mark,
      label: index === 0 ? undefined : "S681 review label",
      ...(index === 0 ? { labelRole: undefined } : { labelRole: "instruction" as const }),
    }));
    const packageWithOptionalLabels = await tryMarks(optionalLabels);
    const firstRecordId = `${recipe.name}:${role}:mark:${marks[0]!.name}`;
    const secondRecordId = `${recipe.name}:${role}:mark:${marks[1]!.name}`;
    expect(packageWithOptionalLabels.manifest.patternMarks.find((record) => record.id === firstRecordId))
      .not.toHaveProperty("label");
    expect(packageWithOptionalLabels.manifest.patternMarks.find((record) => record.id === secondRecordId)?.label)
      .toBe("S681 review label");
  });

  it("rejects a block drafted from a different option set", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const options = Object.fromEntries((recipe.options ?? []).slice(0, 2).map((option) => [option.id, option.defaultValue]));
    const otherOptions = { ...options, [Object.keys(options)[0]]: Object.values(options)[0] + 0.1 };
    const gradedWithOtherOptions = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, otherOptions)[2];

    await expect(createDxfInterchangePackage(recipe, gradedWithOtherOptions, options))
      .rejects.toThrow("Selected pattern block does not match the recipe, size and options");
  });

  it("rejects a size label or step that does not match the recipe grade table", async () => {
    const recipe = GARMENTS[0];
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[0];

    await expect(createDxfInterchangePackage(recipe, { ...graded, step: graded.step + 1 }))
      .rejects.toThrow(`Selected size "${graded.label}" does not match the recipe's grade table`);
    await expect(createDxfInterchangePackage(recipe, { ...graded, label: "Unknown" }))
      .rejects.toThrow('Selected size "Unknown" does not match the recipe\'s grade table');
  });

  it("rejects DXF, manifest, schema and malformed package tampering", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2];
    const candidate = await createDxfInterchangePackage(recipe, graded);
    const legacyDxf = exportDxfCentimeters(blockPieces(graded.block), recipe.allowances, recipe.notches);
    let legacyOrdinal = 1;
    const legacyPatternMarks = Object.entries(graded.block.roles).flatMap(([role, piece]) => {
      const marks = (piece.marks ?? []).map((mark, markIndex) => {
        const record = candidate.manifest.patternMarks.find((entry) => entry.id === `${recipe.name}:${role}:mark:${mark.name}`)!;
        const {
          blockName: _blockName, sourceRevisionId: _sourceRevisionId,
          entityCount: _entityCount, displayEncoding: _displayEncoding, ...legacyRecord
        } = record;
        return {
          ...legacyRecord,
          entityType: "start" in mark ? "LINE" : mark.kind === "button" ? "CIRCLE" : "POINT",
          entityOrdinal: legacyOrdinal + 2 + markIndex,
        };
      });
      legacyOrdinal += 2 + (piece.marks?.length ?? 0);
      return marks;
    });
    const legacyPieces = candidate.manifest.pieces.map(({ blockName: _blockName, sourceRevisionId: _sourceRevisionId, drawingTransform: _drawingTransform, ...piece }) => piece);
    const legacyBase: Record<string, unknown> = {
      ...candidate.manifest,
      pieces: legacyPieces,
      patternMarks: legacyPatternMarks,
      drawingSha256: await sha256(legacyDxf),
    };
    const v3Core: Record<string, unknown> = { ...legacyBase, schemaVersion: "infinidrip.g04.dxf-package/3" };
    delete v3Core.revisionId;
    const v3RevisionId = await sha256(canonicalJson(v3Core));
    expect(await verifyDxfInterchangePackage({ dxf: legacyDxf, manifest: { ...v3Core, revisionId: v3RevisionId } })).toBe(true);
    const v2Core: Record<string, unknown> = { ...legacyBase, schemaVersion: "infinidrip.g04.dxf-package/2" };
    delete v2Core.cutGeometryAlgorithm;
    delete v2Core.revisionId;
    const v2RevisionId = await sha256(canonicalJson(v2Core));
    expect(await verifyDxfInterchangePackage({ dxf: legacyDxf, manifest: { ...v2Core, revisionId: v2RevisionId } })).toBe(true);
    const rebindV2 = async (changes: Record<string, unknown>) => {
      const core: Record<string, unknown> = { ...v2Core, ...changes, drawingSha256: await sha256(legacyDxf) };
      delete core.revisionId;
      const revisionId = await sha256(canonicalJson(core));
      return { dxf: legacyDxf, manifest: { ...core, revisionId } };
    };
    const v2Marks = v2Core.patternMarks as Array<Record<string, unknown>>;
    expect(await verifyDxfInterchangePackage(await rebindV2({
      patternMarks: [v2Marks[0], { ...v2Marks[1], entityOrdinal: v2Marks[0]!.entityOrdinal }, ...v2Marks.slice(2)],
    }))).toBe(false);
    expect(await verifyDxfInterchangePackage(await rebindV2({
      patternMarks: [{ ...v2Marks[0], entityType: "INVALID" }, ...v2Marks.slice(1)],
    }))).toBe(false);
    const emptyLegacyDxf = "0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n5\n0\nENDSEC\n0\nEOF\n";
    const emptyLegacyCore = { ...v2Core, drawingSha256: await sha256(emptyLegacyDxf) };
    const emptyLegacyRevision = await sha256(canonicalJson(emptyLegacyCore));
    expect(await verifyDxfInterchangePackage({ dxf: emptyLegacyDxf, manifest: { ...emptyLegacyCore, revisionId: emptyLegacyRevision } })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, cutGeometryAlgorithm: "unknown" },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, schemaVersion: "infinidrip.g04.dxf-package/2" },
    })).toBe(false);
    const rebind = async (dxf: string, manifestChanges: Record<string, unknown>) => {
      const drawingSha256 = await sha256(dxf);
      const core: Record<string, unknown> = { ...candidate.manifest, ...manifestChanges, drawingSha256 };
      delete core.revisionId;
      const revisionId = await sha256(canonicalJson(core));
      return { dxf, manifest: { ...core, revisionId } };
    };

    const v4Dxf = wrapDxfEntitiesInNamedBlocks(legacyDxf, candidate.manifest.pieces.map((piece, index) => {
      const sourcePiece = blockPieces(graded.block)[index]!;
      const notchTable = recipe.notches.find((table) => table.pieceName === sourcePiece.name);
      return {
        name: piece.blockName,
        leadingEntityCount: 2 + (sourcePiece.marks?.length ?? 0),
        trailingEntityCount: notchTable ? notchTable.notches.length + 5 : 0,
      };
    }));
    const v4Pieces = candidate.manifest.pieces.map(({ drawingTransform: _drawingTransform, ...piece }) => piece);
    const v4Marks = Object.entries(graded.block.roles).flatMap(([role, piece]) => {
      let v4Ordinal = 3;
      return (piece.marks ?? []).map((mark) => {
        const record = candidate.manifest.patternMarks.find((entry) => entry.id === `${recipe.name}:${role}:mark:${mark.name}`)!;
        const { entityCount: _entityCount, displayEncoding: _displayEncoding, ...legacyRecord } = record;
        const result = {
          ...legacyRecord,
          entityType: "start" in mark ? "LINE" : mark.kind === "button" ? "CIRCLE" : "POINT",
          entityOrdinal: v4Ordinal,
        };
        v4Ordinal += 1;
        return result;
      });
    });
    const v4Core: Record<string, unknown> = {
      ...candidate.manifest,
      schemaVersion: "infinidrip.g04.dxf-package/4",
      pieces: v4Pieces,
      patternMarks: v4Marks,
      drawingSha256: await sha256(v4Dxf),
    };
    delete v4Core.revisionId;
    const v4RevisionId = await sha256(canonicalJson(v4Core));
    expect(await verifyDxfInterchangePackage({ dxf: v4Dxf, manifest: { ...v4Core, revisionId: v4RevisionId } })).toBe(true);

    expect(await verifyDxfInterchangePackage({ ...candidate, manifest: { ...candidate.manifest, recipe: { id: 42 } } })).toBe(false);
    expect(await verifyDxfInterchangePackage({ ...candidate, manifest: { ...candidate.manifest, pieces: [null] } })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, pieces: candidate.manifest.pieces.map((piece, index) => index === 0 ? { ...piece, blockName: "bad name" } : piece) },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, pieces: candidate.manifest.pieces.map((piece, index) => index === 0 ? { ...piece, sourceRevisionId: "short" } : piece) },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage(await rebind(candidate.dxf, {
      pieces: candidate.manifest.pieces.map((piece, index) => index === 0 ? { ...piece, drawingTransform: undefined } : piece),
    }))).toBe(false);
    const insertsAt = candidate.dxf.indexOf("0\nSECTION\n2\nENTITIES\n");
    const firstInsertName = candidate.manifest.pieces[0]!.blockName;
    const sourceNameAt = candidate.dxf.indexOf(`2\n${firstInsertName}\n`, insertsAt);
    const unknownInsert = `${candidate.dxf.slice(0, sourceNameAt)}2\nIDR_MISSING\n${candidate.dxf.slice(sourceNameAt + `2\n${firstInsertName}\n`.length)}`;
    expect(await verifyDxfInterchangePackage(await rebind(unknownInsert, {}))).toBe(false);
    const insertAt = candidate.dxf.indexOf("0\nINSERT\n", insertsAt);
    const transformAt = candidate.dxf.indexOf("10\n0\n", insertAt);
    const translatedInsert = `${candidate.dxf.slice(0, transformAt)}10\n1\n${candidate.dxf.slice(transformAt + "10\n0\n".length)}`;
    expect(await verifyDxfInterchangePackage(await rebind(translatedInsert, {}))).toBe(false);
    const firstPolyline = candidate.dxf.indexOf("0\nPOLYLINE\n");
    const firstSequenceEnd = candidate.dxf.indexOf("0\nSEQEND\n", firstPolyline) + "0\nSEQEND\n".length;
    const missingCut = `${candidate.dxf.slice(0, firstPolyline)}${candidate.dxf.slice(firstSequenceEnd)}`;
    expect(await verifyDxfInterchangePackage(await rebind(missingCut, {}))).toBe(false);
    const crossMark = candidate.manifest.patternMarks.find((mark) => mark.displayEncoding === "centered-cross/1")!;
    const crossPiece = readNamedDxfDrawing(candidate.dxf).blocks.find((block) => block.name === crossMark.blockName)!;
    const horizontalCross = crossPiece.entities[crossMark.entityOrdinal - 1]!;
    const shiftedCross = horizontalCross.replace(/(10\n)([-\d.]+)/u, (_match, prefix: string, value: string) => `${prefix}${Number(value) + 0.01}`);
    expect(await verifyDxfInterchangePackage(await rebind(candidate.dxf.replace(horizontalCross, shiftedCross), {}))).toBe(false);
    expect(await verifyDxfInterchangePackage(await rebind(candidate.dxf.replace(horizontalCross, horizontalCross.replace("8\nMARK_BUTTONHOLE", "8\nOTHER")), {}))).toBe(false);
    expect(await verifyDxfInterchangePackage(await rebind(candidate.dxf.replace(horizontalCross, ""), {}))).toBe(false);
    expect(await verifyDxfInterchangePackage(await rebind(candidate.dxf, {
      pieces: candidate.manifest.pieces.map((piece) => piece.blockName === crossMark.blockName
        ? { ...piece, drawingTransform: { ...piece.drawingTransform!, xOffset: piece.drawingTransform!.xOffset + 1 } }
        : piece),
    }))).toBe(false);
    expect(await verifyDxfInterchangePackage(await rebind(candidate.dxf, {
      patternMarks: candidate.manifest.patternMarks.map((mark) => mark.id === crossMark.id ? { ...mark, entityCount: 3 } : mark),
    }))).toBe(false);
    expect(await verifyDxfInterchangePackage(await rebind(candidate.dxf, {
      patternMarks: candidate.manifest.patternMarks.map((mark) => mark.id === crossMark.id
        ? { ...mark, entityCount: 1, displayEncoding: "unknown" as never }
        : mark),
    }))).toBe(false);
    expect(await verifyDxfInterchangePackage(await rebind(candidate.dxf, {
      patternMarks: candidate.manifest.patternMarks.map((mark) => mark.id === crossMark.id
        ? { ...mark, kind: "placementPoint" as never }
        : mark),
    }))).toBe(false);
    expect(await verifyDxfInterchangePackage(await rebind(candidate.dxf, {
      patternMarks: candidate.manifest.patternMarks.map((mark) => mark.id === crossMark.id
        ? { ...mark, sourceGeometry: { kind: "segment", start: { x: 1, y: 1 }, end: { x: 2, y: 2 } } }
        : mark),
    }))).toBe(false);
    expect(await verifyDxfInterchangePackage(await rebind(candidate.dxf, {
      patternMarks: candidate.manifest.patternMarks.map((mark) => mark.id === crossMark.id
        ? { ...mark, sourceGeometry: { kind: "point", at: { x: "bad", y: 1 } } }
        : mark),
    }))).toBe(false);

    expect(await verifyDxfInterchangePackage({ ...candidate, dxf: `${candidate.dxf}0\nEOF\n` })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      dxf: candidate.dxf.replace("9\n$INSUNITS\n70\n5\n", ""),
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, pieces: [] },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, patternMarks: candidate.manifest.patternMarks.slice(1) },
    })).toBe(false);
    const firstMark = candidate.manifest.patternMarks[0]!;
    const secondMark = candidate.manifest.patternMarks[1]!;
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, patternMarks: {} as never },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, patternMarks: [null] },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, patternMarks: [{ ...firstMark, id: "" }] },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, patternMarks: [firstMark, firstMark] },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, patternMarks: [firstMark, { ...secondMark, id: "distinct-mark", entityOrdinal: firstMark.entityOrdinal }] },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, patternMarks: [{ ...firstMark, pieceId: 42 }] },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, patternMarks: [{ ...firstMark, name: " " }] },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, patternMarks: [{ ...firstMark, entityOrdinal: 0 }] },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, patternMarks: [{ ...firstMark, entityOrdinal: 1.5 }] },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, patternMarks: [{ ...firstMark, entityOrdinal: undefined }] },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, patternMarks: [{ ...firstMark, entityType: 42 }] },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, patternMarks: [{ ...firstMark, layer: 42 }] },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, patternMarks: [{ ...firstMark, entityOrdinal: 1 }] },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, patternMarks: [{ ...firstMark, entityOrdinal: 99999 }] },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, patternMarks: [{ ...firstMark, blockName: undefined }] },
    })).toBe(false);
    const entitiesAt = candidate.dxf.indexOf("0\nSECTION\n2\nENTITIES\n");
    const headerOnly = `${candidate.dxf.slice(0, entitiesAt)}0\nEOF\n`;
    expect(await verifyDxfInterchangePackage(await rebind(headerOnly, {}))).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, units: { length: "in", dxfInsunits: 1 } },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, schemaVersion: "unsupported" },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, unsupported: () => "not JSON" },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage({
      ...candidate,
      manifest: { ...candidate.manifest, unsupported: null },
    })).toBe(false);
    expect(await verifyDxfInterchangePackage(null)).toBe(false);
    expect(await verifyDxfInterchangePackage("not a package")).toBe(false);
    expect(await verifyDxfInterchangePackage({ dxf: 42, manifest: {} })).toBe(false);
    expect(await verifyDxfInterchangePackage({ dxf: "", manifest: null })).toBe(false);
  });
});
