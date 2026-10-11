import type { DxfInterchangePackage } from "./dxf-interchange-package";
import { verifyDxfInterchangePackage } from "./dxf-interchange-package";
import { dxfEntityTypeAndLayer, readNamedDxfDrawing } from "./named-dxf-blocks";

const GEOMETRY_TOLERANCE_CM = 0.001;
const CURRENT_PACKAGE_SCHEMA = "infinidrip.g04.dxf-package/5";

export interface DxfInterchangeRoundTripReport {
  readonly passed: boolean;
  readonly reason?: string;
  readonly pieceCount: number;
  readonly outlineCount: number;
  readonly markEntityCount: number;
  readonly maxGeometryDeltaCm: number;
}

type Pair = readonly [number, string];
type XY = readonly [number, number];

function fail(reason: string): DxfInterchangeRoundTripReport {
  return { passed: false, reason, pieceCount: 0, outlineCount: 0, markEntityCount: 0, maxGeometryDeltaCm: 0 };
}

function parsePairs(entity: string): Pair[] {
  const lines = entity.replace(/\r\n?/gu, "\n").trimEnd().split("\n");
  return Array.from({ length: Math.floor(lines.length / 2) }, (_, index) =>
    [Number(lines[index * 2]), lines[index * 2 + 1]!] as const,
  );
}

function hasCentimeterHeader(dxf: string): boolean {
  const lines = dxf.replace(/\r\n?/gu, "\n").split("\n").map((line) => line.trim());
  return lines.some((line, index) =>
    line === "$INSUNITS" && lines[index - 1] === "9" && lines[index + 1] === "70" && lines[index + 2] === "5",
  );
}

function hasIdentityPlanarInserts(inserts: ReturnType<typeof readNamedDxfDrawing>["inserts"]): boolean {
  return inserts.every(({ entity }) => {
    const pairs = parsePairs(entity);
    const values = new Map<number, string>();
    for (const [code, raw] of pairs) if (!values.has(code)) values.set(code, raw);
    const numeric = (code: number, fallback: number): number => {
      const raw = values.get(code);
      return raw === undefined ? fallback : Number(raw);
    };
    const is = (code: number, expected: number, fallback = expected): boolean => {
      const actual = numeric(code, fallback);
      return Number.isFinite(actual) && actual === expected;
    };
    const zScale = numeric(43, 1);
    return is(10, 0) && is(20, 0) && is(30, 0) && is(41, 1) && is(42, 1) &&
      Number.isFinite(zScale) && (zScale === 0 || zScale === 1) && is(50, 0) &&
      is(70, 1) && is(71, 1) && is(44, 0) && is(45, 0) &&
      is(210, 0, 0) && is(220, 0, 0) && is(230, 1, 1);
  });
}

function coordinates(entity: string): XY[] | undefined {
  const pairs = parsePairs(entity);
  const result: XY[] = [];
  let x: number | undefined;
  for (const [code, raw] of pairs) {
    if (code === 10) {
      x = Number(raw);
      if (!Number.isFinite(x)) return undefined;
    } else if (code === 20 && x !== undefined) {
      const y = Number(raw);
      if (!Number.isFinite(y)) return undefined;
      result.push([x, y]);
      x = undefined;
    }
  }
  return result;
}

function outlineGeometryMetadata(entity: string): readonly number[] | undefined {
  const pairs = parsePairs(entity);
  const type = dxfEntityTypeAndLayer(entity).type;
  const value = (entries: readonly Pair[], code: number, fallback = 0): number | undefined => {
    const raw = entries.find(([candidate]) => candidate === code)?.[1];
    const result = raw === undefined ? fallback : Number(raw);
    return Number.isFinite(result) ? result : undefined;
  };
  const firstVertex = pairs.findIndex(([code, raw]) => code === 0 && raw === "VERTEX");
  const header = firstVertex < 0 ? pairs : pairs.slice(0, firstVertex);
  const metadata = [
    value(header, type === "LWPOLYLINE" ? 38 : 30), value(header, 39),
    value(header, 43), value(header, 210, 0), value(header, 220, 0), value(header, 230, 1),
  ];
  if (metadata.some((entry) => entry === undefined)) return undefined;
  const vertices: number[][] = [];
  if (type === "POLYLINE") {
    for (let index = 0; index < pairs.length; index += 1) {
      if (pairs[index]![0] !== 0 || pairs[index]![1] !== "VERTEX") continue;
      // readNamedDxfDrawing has already required a terminating SEQEND, so
      // each POLYLINE vertex necessarily ends at another group-code zero.
      const end = pairs.findIndex((entry, next) => next > index && entry[0] === 0);
      const vertex = pairs.slice(index, end);
      const values = [value(vertex, 10), value(vertex, 20), value(vertex, 30), value(vertex, 40), value(vertex, 41), value(vertex, 42)];
      if (values.some((entry) => entry === undefined)) return undefined;
      vertices.push(values as number[]);
    }
  } else {
    let current: number[] | undefined;
    for (const [code, raw] of pairs) {
      if (code === 10) {
        if (current) vertices.push(current);
        const x = Number(raw);
        current = [x, 0, 0, 0, 0, 0];
      } else if ([20, 40, 41, 42].includes(code) && current) {
        const entry = Number(raw);
        if (!Number.isFinite(entry)) return undefined;
        current[code === 20 ? 1 : code === 40 ? 3 : code === 41 ? 4 : 5] = entry;
      }
    }
    if (current) vertices.push(current);
  }
  if (vertices.length === 0) return undefined;
  const normalized: number[][] = [];
  for (const vertex of vertices) {
    const previous = normalized[normalized.length - 1];
    if (previous?.[0] === vertex[0] && previous[1] === vertex[1]) {
      if (previous.some((entry, index) => entry !== vertex[index])) return undefined;
      continue;
    }
    normalized.push(vertex);
  }
  const first = normalized[0]!;
  const last = normalized[normalized.length - 1]!;
  if (normalized.length > 1 && first[0] === last[0] && first[1] === last[1]) {
    if (first.some((entry, index) => entry !== last[index])) return undefined;
    normalized.pop();
  }
  return [...metadata as number[], ...normalized.flatMap((vertex) => vertex.slice(2))];
}

function normalizePath(points: readonly XY[]): XY[] {
  const result: XY[] = [];
  for (const point of points) {
    const previous = result[result.length - 1];
    if (!previous || previous[0] !== point[0] || previous[1] !== point[1]) result.push(point);
  }
  const last = result[result.length - 1];
  if (result.length > 1 && result[0]![0] === last![0] && result[0]![1] === last![1]) result.pop();
  return result;
}

function closedFlag(entity: string): boolean | undefined {
  const pairs = parsePairs(entity);
  const raw = pairs.find(([code]) => code === 70)?.[1];
  if (raw === undefined) return false;
  const flags = Number(raw);
  return Number.isInteger(flags) && flags >= 0 ? (flags & 1) === 1 : undefined;
}

function outline(block: readonly string[], layer: "CUT" | "SEW"): string | undefined {
  const matches = block.filter((entity) => {
    const identity = dxfEntityTypeAndLayer(entity);
    return identity.layer === layer && (identity.type === "POLYLINE" || identity.type === "LWPOLYLINE");
  });
  return matches.length === 1 ? matches[0] : undefined;
}

function numericGeometry(entity: string): readonly (readonly [number, number])[] | undefined {
  const pairs = parsePairs(entity);
  const selected = pairs.filter(([code]) => (code >= 10 && code <= 39) || code === 40);
  const result: (readonly [number, number])[] = [];
  for (const [code, raw] of selected) {
    const value = Number(raw);
    if (!Number.isFinite(value)) return undefined;
    result.push([code, value]);
  }
  return result;
}

function entityMatches(expected: string, actual: string): boolean {
  const expectedIdentity = dxfEntityTypeAndLayer(expected);
  const actualIdentity = dxfEntityTypeAndLayer(actual);
  if (expectedIdentity.type !== actualIdentity.type || expectedIdentity.layer !== actualIdentity.layer) return false;
  const expectedGeometry = numericGeometry(expected);
  const actualGeometry = numericGeometry(actual);
  return Boolean(expectedGeometry && actualGeometry && expectedGeometry.length === actualGeometry.length &&
    expectedGeometry.every(([code, value], index) => {
      const actualValue = actualGeometry[index];
      return actualValue?.[0] === code && Math.abs(actualValue[1] - value) <= GEOMETRY_TOLERANCE_CM;
    }));
}

function marksMatch(
  sourceBlocks: ReadonlyMap<string, readonly string[]>,
  returnedBlocks: ReadonlyMap<string, readonly string[]>,
  manifest: DxfInterchangePackage["manifest"],
): boolean {
  const recordsByBlock = new Map<string, typeof manifest.patternMarks>();
  for (const record of manifest.patternMarks) {
    recordsByBlock.set(record.blockName, [...(recordsByBlock.get(record.blockName) ?? []), record]);
  }
  for (const piece of manifest.pieces) {
    const sourceEntities = sourceBlocks.get(piece.blockName)!;
    const returnedEntities = returnedBlocks.get(piece.blockName)!;
    const records = recordsByBlock.get(piece.blockName) ?? [];
    const used = new Set<number>();
    for (const mark of records) {
      const count = mark.entityCount!;
      for (let offset = 0; offset < count; offset += 1) used.add(mark.entityOrdinal - 1 + offset);
      for (let offset = 0; offset < count; offset += 1) {
        const sourceMark = sourceEntities[mark.entityOrdinal - 1 + offset];
        const returnedMark = returnedEntities[mark.entityOrdinal - 1 + offset];
        if (!sourceMark || !returnedMark || !entityMatches(sourceMark, returnedMark)) return false;
      }
    }
    const sourceOther = sourceEntities.filter((entity, index) => {
      const layer = dxfEntityTypeAndLayer(entity).layer;
      return layer !== "CUT" && layer !== "SEW" && !used.has(index);
    });
    const returnOther = returnedEntities.filter((entity, index) => {
      const layer = dxfEntityTypeAndLayer(entity).layer;
      return layer !== "CUT" && layer !== "SEW" && !used.has(index);
    });
    const unmatched = [...returnOther];
    for (const sourceEntity of sourceOther) {
      const match = unmatched.findIndex((returnedEntity) => entityMatches(sourceEntity, returnedEntity));
      if (match < 0) return false;
      unmatched.splice(match, 1);
    }
  }
  return true;
}

/**
 * Compare a receiver-rewritten named-block drawing to its unchanged source
 * package. This does not qualify a receiver or modify the source-hash verifier.
 */
export async function auditDxfInterchangeRoundTrip(
  sourcePackage: DxfInterchangePackage,
  returnedDxf: string,
): Promise<DxfInterchangeRoundTripReport> {
  try {
    if (!sourcePackage || sourcePackage.manifest?.schemaVersion !== CURRENT_PACKAGE_SCHEMA) {
      return fail("Round-trip audit requires a current schema-v5 source package");
    }
    if (typeof returnedDxf !== "string" || !returnedDxf.trim()) return fail("Returned DXF is empty");
    if (!await verifyDxfInterchangePackage(sourcePackage)) return fail("Source package failed its integrity check");
    if (!hasCentimeterHeader(returnedDxf)) return fail("Returned DXF does not declare centimeters");
    const sourceDrawing = readNamedDxfDrawing(sourcePackage.dxf);
    const returnedDrawing = readNamedDxfDrawing(returnedDxf);
    const manifest = sourcePackage.manifest;
    const expectedNames = manifest.pieces.map((piece) => piece.blockName).sort();
    const sourceNames = sourceDrawing.blocks.map((block) => block.name).sort();
    const returnedNames = returnedDrawing.blocks.map((block) => block.name).sort();
    const insertNames = returnedDrawing.inserts.map((insert) => insert.name).sort();
    if (new Set(returnedNames).size !== returnedNames.length ||
        expectedNames.join("\n") !== sourceNames.join("\n") ||
        expectedNames.join("\n") !== returnedNames.join("\n") ||
        !hasIdentityPlanarInserts(returnedDrawing.inserts) ||
        expectedNames.join("\n") !== insertNames.join("\n")) return fail("Returned piece names or INSERT identities do not match the source manifest");

    const sourceByName = new Map(sourceDrawing.blocks.map((block) => [block.name, block.entities]));
    const returnedByName = new Map(returnedDrawing.blocks.map((block) => [block.name, block.entities]));
    let maxGeometryDeltaCm = 0;
    let outlineCount = 0;
    let markEntityCount = 0;
    for (const piece of manifest.pieces) {
      const sourceBlock = sourceByName.get(piece.blockName);
      const returnedBlock = returnedByName.get(piece.blockName);
      if (!sourceBlock || !returnedBlock || sourceBlock.length !== returnedBlock.length) return fail("Returned block is missing or has extra entities");
      for (const layer of ["CUT", "SEW"] as const) {
        const sourceOutline = outline(sourceBlock, layer);
        const returnedOutline = outline(returnedBlock, layer);
        if (!sourceOutline || !returnedOutline) return fail(`Piece ${piece.role} must contain exactly one ${layer} outline`);
        const sourcePoints = coordinates(sourceOutline);
        const returnedPoints = coordinates(returnedOutline);
        const sourceClosed = closedFlag(sourceOutline);
        const returnedClosed = closedFlag(returnedOutline);
        const sourceMetadata = outlineGeometryMetadata(sourceOutline);
        const returnedMetadata = outlineGeometryMetadata(returnedOutline);
        if (!sourcePoints || !returnedPoints || sourceClosed === undefined || returnedClosed === undefined ||
            sourceClosed !== returnedClosed || !sourceMetadata || !returnedMetadata ||
            sourceMetadata.length !== returnedMetadata.length || sourceMetadata.some((value, index) => {
              const other = returnedMetadata[index]!;
              const isDirectionOrBulge = index === 3 || index === 4 || index === 5 ||
                (index >= 9 && (index - 9) % 4 === 0);
              return isDirectionOrBulge ? value !== other : Math.abs(value - other) > GEOMETRY_TOLERANCE_CM;
            })) return fail(`Piece ${piece.role} has malformed or changed ${layer} geometry`);
        const a = normalizePath(sourcePoints);
        const b = normalizePath(returnedPoints);
        for (let index = 0; index < a.length; index += 1) {
          const delta = Math.hypot(a[index]![0] - b[index]![0], a[index]![1] - b[index]![1]);
          maxGeometryDeltaCm = Math.max(maxGeometryDeltaCm, delta);
          if (delta > GEOMETRY_TOLERANCE_CM) return fail(`Piece ${piece.role} ${layer} geometry exceeds 0.001 cm`);
        }
        outlineCount += 1;
      }
      markEntityCount += returnedBlock.filter((entity) => {
        const layer = dxfEntityTypeAndLayer(entity).layer;
        return layer !== "CUT" && layer !== "SEW";
      }).length;
    }
    if (!marksMatch(sourceByName, returnedByName, manifest)) {
      return fail("Returned marks, layers, or mark identities differ from the source manifest");
    }
    return { passed: true, pieceCount: manifest.pieces.length, outlineCount, markEntityCount, maxGeometryDeltaCm };
  } catch {
    return fail("DXF return could not be safely parsed or compared");
  }
}
