import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, gradeRun } from "../drafting";
import { createDxfInterchangePackage } from "./dxf-interchange-package";
import { auditDxfInterchangeRoundTrip as auditRawDxfInterchangeRoundTrip } from "./dxf-interchange-roundtrip";

const auditDxfInterchangeRoundTrip: typeof auditRawDxfInterchangeRoundTrip = async (...args) => {
  const result = await auditRawDxfInterchangeRoundTrip(...args);
  if (!result.passed) {
    expect(result.reason).toBeTruthy();
    expect(result).toMatchObject({
      pieceCount: 0,
      outlineCount: 0,
      markEntityCount: 0,
      maxGeometryDeltaCm: 0,
    });
  }
  return result;
};
import { dxfEntityTypeAndLayer, readNamedDxfDrawing } from "./named-dxf-blocks";

function replaceEntity(dxf: string, entity: string, replacement: (value: string) => string): string {
  const start = dxf.indexOf(entity);
  if (start < 0) throw new Error("Test entity not found");
  return `${dxf.slice(0, start)}${replacement(entity)}${dxf.slice(start + entity.length)}`;
}

function replaceFirstInsertGroup(dxf: string, code: number, value: string): string {
  const section = dxf.indexOf("0\nSECTION\n2\nENTITIES\n");
  const insert = dxf.indexOf("0\nINSERT\n", section);
  const nextInsert = dxf.indexOf("0\nINSERT\n", insert + 2);
  const nextEnd = dxf.indexOf("0\nENDSEC\n", insert + 2);
  const next = nextInsert < 0 ? nextEnd : nextEnd < 0 ? nextInsert : Math.min(nextInsert, nextEnd);
  const end = next < 0 ? dxf.length : next;
  const entity = dxf.slice(insert, end);
  const group = new RegExp(`\\n${code}\\n[^\\n]+\\n`, "u");
  if (!group.test(entity)) return `${dxf.slice(0, end)}${code}\n${value}\n${dxf.slice(end)}`;
  return `${dxf.slice(0, insert)}${entity.replace(group, `\n${code}\n${value}\n`)}${dxf.slice(end)}`;
}

function renameDxfPiece(dxf: string, from: string, to: string): string {
  const reference = `2\n${from}\n`;
  if (dxf.split(reference).length < 3) throw new Error("Test piece identity is missing its block or INSERT reference");
  return dxf.split(reference).join(`2\n${to}\n`);
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`,
    ).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

async function sha256(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toLwPolyline(entity: string): string {
  const lines = entity.split("\n");
  const pairs = Array.from({ length: Math.floor(lines.length / 2) }, (_, index) => [Number(lines[index * 2]), lines[index * 2 + 1]!] as const);
  const layer = dxfEntityTypeAndLayer(entity).layer;
  const flags = pairs.find(([code]) => code === 70)?.[1] ?? "0";
  const vertices: Array<readonly [number, number]> = [];
  for (let index = 0; index < pairs.length; index += 1) {
    if (pairs[index]![0] !== 0 || pairs[index]![1] !== "VERTEX") continue;
    const x = pairs.slice(index + 1).find(([code]) => code === 10)?.[1];
    const y = pairs.slice(index + 1).find(([code]) => code === 20)?.[1];
    if (x !== undefined && y !== undefined) vertices.push([Number(x), Number(y)]);
  }
  return ["0", "LWPOLYLINE", "8", layer, "90", String(vertices.length), "70", flags,
    ...vertices.flatMap(([x, y]) => ["10", String(x), "20", String(y)]), ""].join("\n");
}

function shiftMiddleVertex(entity: string, amount: number): string {
  const lines = entity.split("\n");
  const vertices = lines.flatMap((line, index) => line === "0" && lines[index + 1] === "VERTEX" ? [index] : []);
  const vertex = vertices.length ? vertices[Math.floor(vertices.length / 2)]! : -1;
  const x = lines.findIndex((line, index) => index > vertex && line === "10");
  lines[x + 1] = String(Number(lines[x + 1]) + amount);
  return lines.join("\n");
}

describe("G04 receiver-return manifest audit", () => {
  it("binds returned piece identities, outlines, marks, units and relations to the intact source package", async () => {
    const recipe = GARMENTS.find((entry) => entry.name === "polo")!;
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2]!;
    const source = await createDxfInterchangePackage(recipe, graded);
    const result = await auditDxfInterchangeRoundTrip(source, source.dxf);

    expect(result).toEqual({
      passed: true,
      pieceCount: source.manifest.pieces.length,
      outlineCount: source.manifest.pieces.length * 2,
      markEntityCount: expect.any(Number),
      maxGeometryDeltaCm: 0,
    });
  }, 30_000);

  it("accepts only the selected-grade suffix while preserving unique source identities", async () => {
    const recipe = GARMENTS.find((entry) => entry.name === "polo")!;
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2]!;
    const source = await createDxfInterchangePackage(recipe, graded);
    const names = source.manifest.pieces.map((piece) => piece.blockName);
    let suffixed = source.dxf;
    for (const name of names) suffixed = renameDxfPiece(suffixed, name, `${name}_M`);
    expect((await auditDxfInterchangeRoundTrip(source, suffixed)).passed).toBe(true);

    const wrongGrade = source.manifest.pieces.reduce((dxf, piece) =>
      renameDxfPiece(dxf, piece.blockName, `${piece.blockName}_L`), source.dxf);
    expect((await auditDxfInterchangeRoundTrip(source, wrongGrade)).passed).toBe(false);

    const collision = renameDxfPiece(
      renameDxfPiece(source.dxf, names[1]!, `${names[0]}_M`),
      names[0]!,
      `${names[0]}_M`,
    );
    expect((await auditDxfInterchangeRoundTrip(source, collision)).passed).toBe(false);

    const { revisionId: _revisionId, ...sourceCore } = source.manifest;
    const emptyGradeCore = {
      ...sourceCore,
      grade: { ...source.manifest.grade, selectedSize: { ...source.manifest.grade.selectedSize, label: "" } },
    };
    const emptyGradeSource = {
      ...source,
      manifest: { ...emptyGradeCore, revisionId: await sha256(canonicalJson(emptyGradeCore)) },
    } as typeof source;
    const emptyGradeSuffix = names.reduce((dxf, name) => renameDxfPiece(dxf, name, `${name}_`), source.dxf);
    expect((await auditDxfInterchangeRoundTrip(emptyGradeSource, emptyGradeSuffix)).passed).toBe(false);
  }, 30_000);

  it("accepts a zero Z scale for planar pieces and rejects moved or repeated instances", async () => {
    const recipe = GARMENTS.find((entry) => entry.name === "tee")!;
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2]!;
    const source = await createDxfInterchangePackage(recipe, graded);
    const planar = replaceFirstInsertGroup(source.dxf, 43, "0");
    expect((await auditDxfInterchangeRoundTrip(source, planar)).passed).toBe(true);
    for (const [code, value] of [[30, "1"], [71, "2"], [210, "0.1"], [43, "NaN"]] as const) {
      const changed = replaceFirstInsertGroup(source.dxf, code, value);
      expect((await auditDxfInterchangeRoundTrip(source, changed)).passed).toBe(false);
    }
  }, 30_000);

  it("accepts equivalent returned LWPOLYLINE outlines", async () => {
    const recipe = GARMENTS.find((entry) => entry.name === "tee")!;
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2]!;
    const source = await createDxfInterchangePackage(recipe, graded);
    let returned = source.dxf;
    for (const block of readNamedDxfDrawing(source.dxf).blocks) {
      for (const layer of ["CUT", "SEW"] as const) {
        const entity = block.entities.find((item) => dxfEntityTypeAndLayer(item).layer === layer)!;
        returned = replaceEntity(returned, entity, toLwPolyline);
      }
    }
    const result = await auditDxfInterchangeRoundTrip(source, returned);
    expect(result.passed, result.reason).toBe(true);
    const firstLwOutline = readNamedDxfDrawing(returned).blocks[0]!.entities
      .find((entity) => dxfEntityTypeAndLayer(entity).layer === "CUT")!;
    const changedArcAndWidths = replaceEntity(returned, firstLwOutline, (entity) =>
      entity.replace(/\n20\n([^\n]+)\n/u, "\n20\n$1\n40\n0.1\n41\n0.1\n42\n0.1\n"),
    );
    expect((await auditDxfInterchangeRoundTrip(source, changedArcAndWidths)).passed).toBe(false);
    const changedOutline = readNamedDxfDrawing(changedArcAndWidths).blocks[0]!.entities
      .find((entity) => dxfEntityTypeAndLayer(entity).layer === "CUT")!;
    const malformedWidth = replaceEntity(changedArcAndWidths, changedOutline, (entity) => entity.replace("40\n0.1\n", "40\nNaN\n"));
    expect((await auditDxfInterchangeRoundTrip(source, malformedWidth)).passed).toBe(false);
    const missingVertices = replaceEntity(returned, firstLwOutline,
      () => ["0", "LWPOLYLINE", "8", "CUT", "90", "0", "70", "1", ""].join("\n"));
    expect((await auditDxfInterchangeRoundTrip(source, missingVertices)).passed).toBe(false);
    const missingCoordinate = replaceEntity(returned, firstLwOutline,
      (entity) => entity.replace(/\n10\n([^\n]+)\n20\n[^\n]+\n/u, "\n10\n$1\n"));
    expect((await auditDxfInterchangeRoundTrip(source, missingCoordinate)).passed).toBe(false);
  }, 30_000);

  it("allows sub-threshold coordinate rounding but rejects geometry beyond 0.001 cm", async () => {
    const recipe = GARMENTS.find((entry) => entry.name === "tee")!;
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2]!;
    const source = await createDxfInterchangePackage(recipe, graded);
    const block = readNamedDxfDrawing(source.dxf).blocks[0]!;
    const cut = block.entities.find((entity) => dxfEntityTypeAndLayer(entity).layer === "CUT")!;
    const rounded = replaceEntity(source.dxf, cut, (entity) => shiftMiddleVertex(entity, 0.0005));
    const accepted = await auditDxfInterchangeRoundTrip(source, rounded);
    expect(accepted.passed, accepted.reason).toBe(true);
    expect(accepted.maxGeometryDeltaCm).toBeCloseTo(0.0005, 8);

    const outsideTolerance = replaceEntity(source.dxf, cut, (entity) => shiftMiddleVertex(entity, 0.01));
    expect((await auditDxfInterchangeRoundTrip(source, outsideTolerance)).passed).toBe(false);

    const changedArc = replaceEntity(source.dxf, cut, (entity) => entity.replace("0\nVERTEX\n", "0\nVERTEX\n42\n0.2\n"));
    expect((await auditDxfInterchangeRoundTrip(source, changedArc)).passed).toBe(false);
    const firstVertex = cut.indexOf("0\nVERTEX\n");
    const firstX = cut.indexOf("10\n", firstVertex);
    const firstY = cut.indexOf("20\n", firstX);
    const closingPointWithArc = replaceEntity(source.dxf, cut, (entity) => {
      const close = entity.indexOf("0\nSEQEND\n");
      return `${entity.slice(0, close)}0\nVERTEX\n8\nCUT\n${entity.slice(firstX, firstY + "20\n".length)}${Number(entity.slice(firstY + "20\n".length).split("\n", 1)[0])}\n42\n0.2\n${entity.slice(close)}`;
    });
    expect((await auditDxfInterchangeRoundTrip(source, closingPointWithArc)).passed).toBe(false);
    const invalidThickness = replaceEntity(source.dxf, cut,
      (entity) => entity.replace("0\nVERTEX\n", "39\nNaN\n0\nVERTEX\n"));
    expect((await auditDxfInterchangeRoundTrip(source, invalidThickness)).passed).toBe(false);
    const invalidBulge = replaceEntity(source.dxf, cut,
      (entity) => entity.replace("0\nVERTEX\n", "0\nVERTEX\n42\nNaN\n"));
    expect((await auditDxfInterchangeRoundTrip(source, invalidBulge)).passed).toBe(false);
  }, 30_000);

  it("fails closed for absent or malformed returns and invalid source packages", async () => {
    const recipe = GARMENTS.find((entry) => entry.name === "tee")!;
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2]!;
    const source = await createDxfInterchangePackage(recipe, graded);
    const wrongSchema = { ...source, manifest: { ...source.manifest, schemaVersion: "infinidrip.g04.dxf-package/4" } };
    expect((await auditDxfInterchangeRoundTrip(wrongSchema as never, source.dxf)).reason)
      .toBe("Round-trip audit requires a current schema-v5 source package");
    expect((await auditDxfInterchangeRoundTrip(source, undefined as never)).passed).toBe(false);
    expect((await auditDxfInterchangeRoundTrip(source, " ")).reason).toBe("Returned DXF is empty");
    expect((await auditDxfInterchangeRoundTrip({ ...source, dxf: `${source.dxf}0\nEOF\n` }, source.dxf)).reason)
      .toBe("Source package failed its integrity check");
    expect((await auditDxfInterchangeRoundTrip(source, source.dxf.replace("9\n$INSUNITS\n70\n5\n", ""))).reason)
      .toBe("Returned DXF does not declare centimeters");
    const malformed = source.dxf.replace("0\nSECTION\n2\nBLOCKS\n", "0\nSECTION\n2\nBROKEN\n");
    expect((await auditDxfInterchangeRoundTrip(source, malformed)).reason)
      .toBe("DXF return could not be safely parsed or compared");
    const insertSection = source.dxf.indexOf("0\nSECTION\n2\nENTITIES\n");
    const insertAt = source.dxf.indexOf("0\nINSERT\n", insertSection);
    const insertionPoint = source.dxf.indexOf("10\n0\n", insertAt);
    const translated = `${source.dxf.slice(0, insertionPoint)}10\n1\n${source.dxf.slice(insertionPoint + "10\n0\n".length)}`;
    expect((await auditDxfInterchangeRoundTrip(source, translated)).passed).toBe(false);
  }, 30_000);

  it("rejects missing identity, altered marks/layers, non-finite coordinates, and changed outline closure", async () => {
    const recipe = GARMENTS.find((entry) => entry.name === "polo")!;
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2]!;
    const source = await createDxfInterchangePackage(recipe, graded);
    const pieceName = source.manifest.pieces[0]!.blockName;
    const insertSection = source.dxf.indexOf("0\nSECTION\n2\nENTITIES\n");
    const insertNameAt = source.dxf.indexOf(`2\n${pieceName}\n`, insertSection);
    const missingIdentity = `${source.dxf.slice(0, insertNameAt)}2\nIDR_MISSING\n${source.dxf.slice(insertNameAt + `2\n${pieceName}\n`.length)}`;
    expect((await auditDxfInterchangeRoundTrip(source, missingIdentity)).passed).toBe(false);

    const firstBlock = readNamedDxfDrawing(source.dxf).blocks[0]!;
    const mark = firstBlock.entities.find((entity) => dxfEntityTypeAndLayer(entity).layer.startsWith("MARK_"))!;
    expect((await auditDxfInterchangeRoundTrip(source, replaceEntity(source.dxf, mark,
      (entity) => entity.replace(/MARK_[A-Z]+/u, "MARK_WRONG")))).passed).toBe(false);

    const cut = firstBlock.entities.find((entity) => dxfEntityTypeAndLayer(entity).layer === "CUT")!;
    const nonFinite = replaceEntity(source.dxf, cut, (entity) => {
      const lines = entity.split("\n");
      const vertex = lines.findIndex((line, index) => line === "0" && lines[index + 1] === "VERTEX");
      const x = lines.findIndex((line, index) => index > vertex && line === "10");
      lines[x + 1] = "NaN";
      return lines.join("\n");
    });
    expect((await auditDxfInterchangeRoundTrip(source, nonFinite)).passed).toBe(false);
    const invalidY = replaceEntity(source.dxf, cut, (entity) => {
      const lines = entity.split("\n");
      const vertex = lines.findIndex((line, index) => line === "0" && lines[index + 1] === "VERTEX");
      const y = lines.findIndex((line, index) => index > vertex && line === "20");
      lines[y + 1] = "Infinity";
      return lines.join("\n");
    });
    expect((await auditDxfInterchangeRoundTrip(source, invalidY)).passed).toBe(false);

    const closure = replaceEntity(source.dxf, cut, (entity) => entity.replace(/\n70\n1\n/u, "\n70\n0\n"));
    expect((await auditDxfInterchangeRoundTrip(source, closure)).passed).toBe(false);
    const invalidClosure = replaceEntity(source.dxf, cut, (entity) => entity.replace(/\n70\n1\n/u, "\n70\ninvalid\n"));
    expect((await auditDxfInterchangeRoundTrip(source, invalidClosure)).passed).toBe(false);
    const missingClosureFlag = replaceEntity(source.dxf, cut, (entity) => entity.replace(/\n70\n[^\n]+\n/u, "\n"));
    expect((await auditDxfInterchangeRoundTrip(source, missingClosureFlag)).passed).toBe(false);
  }, 30_000);

  it("rejects missing outlines and added block entities", async () => {
    const recipe = GARMENTS.find((entry) => entry.name === "tee")!;
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2]!;
    const source = await createDxfInterchangePackage(recipe, graded);
    const block = readNamedDxfDrawing(source.dxf).blocks[0]!;
    const cut = block.entities.find((entity) => dxfEntityTypeAndLayer(entity).layer === "CUT")!;
    const wrongLayer = replaceEntity(source.dxf, cut, (entity) => entity.replace("\n8\nCUT\n", "\n8\nOTHER\n"));
    expect((await auditDxfInterchangeRoundTrip(source, wrongLayer)).passed).toBe(false);

    const blocksSection = source.dxf.indexOf("0\nSECTION\n2\nBLOCKS\n");
    const blockNameAt = source.dxf.indexOf(`2\n${block.name}\n`, blocksSection);
    const endBlockAt = source.dxf.indexOf("0\nENDBLK\n", blockNameAt);
    const extraEntity = `${source.dxf.slice(0, endBlockAt)}${cut}${source.dxf.slice(endBlockAt)}`;
    expect((await auditDxfInterchangeRoundTrip(source, extraEntity)).passed).toBe(false);
  }, 30_000);

  it("rejects a shortened contour, altered derived notch, and duplicate returned inserts", async () => {
    const recipe = GARMENTS.find((entry) => entry.name === "polo")!;
    const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2]!;
    const source = await createDxfInterchangePackage(recipe, graded);
    const block = readNamedDxfDrawing(source.dxf).blocks[0]!;
    const cut = block.entities.find((entity) => dxfEntityTypeAndLayer(entity).layer === "CUT")!;
    const firstVertex = cut.indexOf("0\nVERTEX\n");
    const secondVertex = cut.indexOf("0\nVERTEX\n", firstVertex + 1);
    const sequenceEnd = cut.indexOf("0\nSEQEND\n", secondVertex);
    const shortened = replaceEntity(source.dxf, cut, (entity) =>
      `${entity.slice(0, secondVertex)}${entity.slice(sequenceEnd)}`,
    );
    expect((await auditDxfInterchangeRoundTrip(source, shortened)).passed).toBe(false);

    const markedOrdinals = new Set(source.manifest.patternMarks
      .filter((mark) => mark.blockName === block.name)
      .flatMap((mark) => Array.from({ length: mark.entityCount ?? 1 }, (_, offset) => mark.entityOrdinal - 1 + offset)));
    const notchIndex = block.entities.findIndex((entity, index) =>
      dxfEntityTypeAndLayer(entity).layer === "MARK_NOTCH" && !markedOrdinals.has(index),
    );
    expect(notchIndex).toBeGreaterThanOrEqual(0);
    const notch = block.entities[notchIndex]!;
    const movedNotch = replaceEntity(source.dxf, notch, (entity) => {
      const lines = entity.split("\n");
      const x = lines.findIndex((line) => line === "10");
      lines[x + 1] = String(Number(lines[x + 1]) + 0.01);
      return lines.join("\n");
    });
    expect((await auditDxfInterchangeRoundTrip(source, movedNotch)).passed).toBe(false);
    const patternMark = source.manifest.patternMarks.find((entry) => entry.blockName === block.name)!;
    const sourceMark = block.entities[patternMark.entityOrdinal - 1]!;
    const nonFiniteMark = replaceEntity(source.dxf, sourceMark, (entity) => entity.replace(/\n10\n[^\n]+\n/u, "\n10\nNaN\n"));
    expect((await auditDxfInterchangeRoundTrip(source, nonFiniteMark)).passed).toBe(false);

    const insertSection = source.dxf.indexOf("0\nSECTION\n2\nENTITIES\n");
    const names = source.manifest.pieces.slice(0, 2).map((piece) => piece.blockName);
    let duplicateInsert = source.dxf;
    for (const name of names) {
      const at = duplicateInsert.indexOf(`2\n${name}\n`, insertSection);
      duplicateInsert = `${duplicateInsert.slice(0, at)}2\n${names[0]}\n${duplicateInsert.slice(at + `2\n${name}\n`.length)}`;
    }
    expect((await auditDxfInterchangeRoundTrip(source, duplicateInsert)).passed).toBe(false);
  }, 30_000);
});
