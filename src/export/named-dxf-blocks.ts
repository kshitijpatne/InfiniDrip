type Pair = readonly [number, string];

export interface NamedDxfPieceGroup {
  readonly name: string;
  readonly leadingEntityCount: number;
  readonly trailingEntityCount: number;
}

export interface NamedDxfBlock {
  readonly name: string;
  readonly entities: readonly string[];
}

export interface NamedDxfDrawing {
  readonly blocks: readonly NamedDxfBlock[];
  readonly inserts: readonly { readonly name: string; readonly entity: string }[];
}

const pair = (code: number, value: string | number): Pair => [code, String(value)];
const serialize = (pairs: readonly Pair[]): string => pairs.map(([code, value]) => `${code}\n${value}\n`).join("");

function parsePairs(dxf: string): Pair[] {
  const lines = dxf.replace(/^\uFEFF/u, "").replace(/\r\n?/gu, "\n").trimEnd().split("\n");
  if (lines.length % 2 !== 0) throw new Error("DXF has an incomplete group-code/value pair");
  return Array.from({ length: lines.length / 2 }, (_, index) => {
    const code = Number(lines[index * 2]);
    if (!Number.isInteger(code)) throw new Error("DXF group code is not an integer");
    return [code, lines[index * 2 + 1]!] as const;
  });
}

function sectionBounds(pairs: readonly Pair[], name: string): { start: number; body: number; end: number } {
  for (let index = 0; index + 2 < pairs.length; index += 1) {
    if (pairs[index]![0] !== 0 || pairs[index]![1] !== "SECTION" ||
        pairs[index + 1]![0] !== 2 || pairs[index + 1]![1] !== name) continue;
    const end = pairs.findIndex((entry, endIndex) => endIndex > index + 1 && entry[0] === 0 && entry[1] === "ENDSEC");
    if (end < 0) throw new Error(`DXF ${name} section is unterminated`);
    return { start: index, body: index + 2, end };
  }
  throw new Error(`DXF has no ${name} section`);
}

function entityEnd(pairs: readonly Pair[], start: number): number {
  const type = pairs[start]?.[1];
  if (type === "POLYLINE") {
    const sequenceEnd = pairs.findIndex((entry, index) => index > start && entry[0] === 0 && entry[1] === "SEQEND");
    if (sequenceEnd < 0) throw new Error("DXF POLYLINE has no SEQEND");
    let end = sequenceEnd + 1;
    while (end < pairs.length && pairs[end]![0] !== 0) end += 1;
    return end;
  }
  let end = start + 1;
  while (end < pairs.length && pairs[end]![0] !== 0) end += 1;
  return end;
}

function entityRanges(pairs: readonly Pair[], start: number, end: number): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];
  for (let index = start; index < end;) {
    if (pairs[index]![0] !== 0) throw new Error("DXF entity stream contains data outside an entity");
    const next = entityEnd(pairs, index);
    if (next > end) throw new Error("DXF entity extends beyond its section");
    ranges.push({ start: index, end: next });
    index = next;
  }
  return ranges;
}

function entityStrings(pairs: readonly Pair[], start: number, end: number): string[] {
  return entityRanges(pairs, start, end).map(({ start: entityStart, end: entityEndIndex }) =>
    serialize(pairs.slice(entityStart, entityEndIndex)),
  );
}

function valueOf(entity: string, code: number): string | undefined {
  const pairs = parsePairs(entity);
  return pairs.find(([candidate]) => candidate === code)?.[1];
}

function tableHeader(name: string, handle: string, count: number): Pair[] {
  return [pair(0, "TABLE"), pair(2, name), pair(5, handle), pair(330, "0"),
    pair(100, "AcDbSymbolTable"), pair(70, count)];
}

function ltypeTableSection(nextHandle: () => string): Pair[] {
  const table = nextHandle();
  const record = nextHandle();
  return [
    ...tableHeader("LTYPE", table, 1),
    pair(0, "LTYPE"), pair(5, record), pair(330, table),
    pair(100, "AcDbSymbolTableRecord"), pair(100, "AcDbLinetypeTableRecord"),
    pair(2, "CONTINUOUS"), pair(70, 0), pair(3, "Solid line"), pair(72, 65),
    pair(73, 0), pair(40, 0), pair(0, "ENDTAB"),
  ];
}

function layerTableSection(layers: readonly string[], nextHandle: () => string): Pair[] {
  const names = [...new Set(["0", ...layers])].sort((a, b) => a.localeCompare(b));
  const tableHandle = nextHandle();
  const records = names.flatMap((name) => [
    pair(0, "LAYER"), pair(5, nextHandle()), pair(330, tableHandle),
    pair(100, "AcDbSymbolTableRecord"), pair(100, "AcDbLayerTableRecord"),
    pair(2, name), pair(70, 0), pair(62, 7), pair(6, "CONTINUOUS"),
  ]);
  return [
    pair(0, "SECTION"), pair(2, "TABLES"),
    ...ltypeTableSection(nextHandle),
    ...tableHeader("LAYER", tableHandle, names.length),
    ...records, pair(0, "ENDTAB"), pair(0, "ENDSEC"),
  ];
}

function blockRecordTableSection(names: readonly string[], nextHandle: () => string): { pairs: Pair[]; records: ReadonlyMap<string, string> } {
  const table = nextHandle();
  const blockNames = ["*Model_Space", "*Paper_Space", ...names];
  const records = new Map(blockNames.map((name) => [name, nextHandle()]));
  return {
    records,
    pairs: [
      ...tableHeader("BLOCK_RECORD", table, blockNames.length),
      ...blockNames.flatMap((name) => [
        pair(0, "BLOCK_RECORD"), pair(5, records.get(name)!), pair(330, table),
        pair(100, "AcDbSymbolTableRecord"), pair(100, "AcDbBlockTableRecord"), pair(2, name),
      ]),
      pair(0, "ENDTAB"), pair(0, "ENDSEC"),
    ],
  };
}

function ownedEntity(entity: string, owner: string, nextHandle: () => string): Pair[] {
  const source = parsePairs(entity);
  const output: Pair[] = [];
  for (let index = 0; index < source.length; index += 1) {
    const current = source[index]!;
    output.push(current);
    if (current[0] === 0) output.push(pair(5, nextHandle()), pair(330, owner));
  }
  return output;
}

function blockDefinition(name: string, record: string, entities: readonly string[], nextHandle: () => string): Pair[] {
  const header = [pair(0, "BLOCK"), pair(5, nextHandle()), pair(330, record),
    pair(100, "AcDbEntity"), pair(8, "0"), pair(100, "AcDbBlockBegin"),
    pair(2, name), pair(70, 0), pair(10, 0), pair(20, 0), pair(30, 0), pair(3, name), pair(1, "")];
  const end = [pair(0, "ENDBLK"), pair(5, nextHandle()), pair(330, record),
    pair(100, "AcDbEntity"), pair(8, "0"), pair(100, "AcDbBlockEnd")];
  return [...header, ...entities.flatMap((entity) => ownedEntity(entity, record, nextHandle)), ...end];
}

function setHeaderHandseed(pairs: Pair[], handseed: string): Pair[] {
  const bounds = sectionBounds(pairs, "HEADER");
  const header = pairs.slice(bounds.body, bounds.end);
  for (let index = 0; index < header.length;) {
    if (header[index]![0] === 9 && header[index]![1] === "$HANDSEED") {
      header.splice(index, 2, pair(9, "$HANDSEED"), pair(5, handseed));
      return [...pairs.slice(0, bounds.body), ...header, ...pairs.slice(bounds.end)];
    }
    index += 2;
  }
  header.push(pair(9, "$HANDSEED"), pair(5, handseed));
  return [...pairs.slice(0, bounds.body), ...header, ...pairs.slice(bounds.end)];
}

export function dxfEntityTypeAndLayer(entity: string): { readonly type: string; readonly layer: string } {
  const pairs = parsePairs(entity);
  return { type: pairs[0]![1], layer: pairs.find(([code]) => code === 8)?.[1] ?? "" };
}

export function wrapDxfEntitiesInNamedBlocks(dxf: string, groups: readonly NamedDxfPieceGroup[]): string {
  if (groups.length === 0) throw new Error("DXF piece blocks require at least one piece");
  const names = groups.map(({ name }) => name);
  if (names.some((name) => !/^[A-Z0-9_]{1,200}$/u.test(name))) {
    throw new Error("DXF block names must be unique-safe ASCII identifiers");
  }
  if (new Set(names).size !== names.length) throw new Error("DXF block names must be unique");
  if (groups.some(({ leadingEntityCount, trailingEntityCount }) =>
    !Number.isInteger(leadingEntityCount) || leadingEntityCount < 2 ||
    !Number.isInteger(trailingEntityCount) || trailingEntityCount < 0)) {
    throw new Error("DXF piece block entity counts are invalid");
  }

  const pairs = parsePairs(dxf);
  if (pairs.some((entry, index) => entry[0] === 2 && entry[1] === "TABLES" &&
      pairs[index - 1]?.[0] === 0 && pairs[index - 1]?.[1] === "SECTION")) {
    throw new Error("DXF named-block source must not already contain a TABLES section");
  }
  const bounds = sectionBounds(pairs, "ENTITIES");
  const entities = entityStrings(pairs, bounds.body, bounds.end);
  const layers = entities.map((entity) => dxfEntityTypeAndLayer(entity).layer);
  if (layers.some((layer) => !layer)) throw new Error("DXF named-block entities must name their layers");
  const leadingCount = groups.reduce((total, group) => total + group.leadingEntityCount, 0);
  const trailingCount = groups.reduce((total, group) => total + group.trailingEntityCount, 0);
  if (leadingCount + trailingCount !== entities.length) {
    throw new Error(`DXF piece grouping expected ${leadingCount + trailingCount} entities but found ${entities.length}`);
  }

  const handles = { value: 0x100 };
  const nextHandle = (): string => (handles.value++).toString(16).toUpperCase();
  const { pairs: blockRecordTable, records: blockRecords } = blockRecordTableSection(names, nextHandle);
  const blocks = groups.map((group, index) => {
    const leadingStart = groups.slice(0, index).reduce((total, previous) => total + previous.leadingEntityCount, 0);
    const trailingStart = leadingCount + groups.slice(0, index).reduce((total, previous) => total + previous.trailingEntityCount, 0);
    const blockEntities = [
      ...entities.slice(leadingStart, leadingStart + group.leadingEntityCount),
      ...entities.slice(trailingStart, trailingStart + group.trailingEntityCount),
    ];
    return blockDefinition(group.name, blockRecords.get(group.name)!, blockEntities, nextHandle);
  });
  const tableSection = layerTableSection(layers, nextHandle);
  const modelSpace = blockDefinition("*Model_Space", blockRecords.get("*Model_Space")!, [], nextHandle);
  const paperSpace = blockDefinition("*Paper_Space", blockRecords.get("*Paper_Space")!, [], nextHandle);
  const blockSection = [pair(0, "SECTION"), pair(2, "BLOCKS"), ...modelSpace, ...paperSpace, ...blocks.flat(), pair(0, "ENDSEC")];
  const inserts = groups.flatMap(({ name }) => [
    pair(0, "INSERT"), pair(5, nextHandle()), pair(330, blockRecords.get("*Model_Space")!),
    pair(100, "AcDbEntity"), pair(8, "0"), pair(100, "AcDbBlockReference"), pair(2, name), pair(10, 0), pair(20, 0), pair(30, 0),
    pair(41, 1), pair(42, 1), pair(43, 1), pair(50, 0),
  ]);
  const entitySection = [pair(0, "SECTION"), pair(2, "ENTITIES"), ...inserts, pair(0, "ENDSEC")];
  const tables = [...tableSection.slice(0, -1), ...blockRecordTable.slice(0, -1), pair(0, "ENDSEC")];
  const withHandseed = setHeaderHandseed(pairs, handles.value.toString(16).toUpperCase());
  const outputBounds = sectionBounds(withHandseed, "ENTITIES");
  return serialize([
    ...withHandseed.slice(0, outputBounds.start), ...tables, ...blockSection, ...entitySection,
    ...withHandseed.slice(outputBounds.end + 1),
  ]);
}

export function readNamedDxfDrawing(dxf: string): NamedDxfDrawing {
  const pairs = parsePairs(dxf);
  const bounds = sectionBounds(pairs, "BLOCKS");
  const blocks: NamedDxfBlock[] = [];
  for (let index = bounds.body; index < bounds.end;) {
    if (pairs[index]![0] !== 0 || pairs[index]![1] !== "BLOCK") throw new Error("DXF BLOCKS section contains an invalid record");
    const headerEnd = entityEnd(pairs, index);
    const name = pairs.slice(index, headerEnd).find(([code]) => code === 2)?.[1];
    if (!name) throw new Error("DXF block has no name");
    let endBlock = headerEnd;
    while (endBlock < bounds.end && !(pairs[endBlock]![0] === 0 && pairs[endBlock]![1] === "ENDBLK")) endBlock += 1;
    if (endBlock >= bounds.end) throw new Error(`DXF block "${name}" has no ENDBLK`);
    if (name !== "*Model_Space" && name !== "*Paper_Space") {
      blocks.push({ name, entities: entityStrings(pairs, headerEnd, endBlock) });
    }
    index = entityEnd(pairs, endBlock);
  }

  const entityBounds = sectionBounds(pairs, "ENTITIES");
  const inserts = entityRanges(pairs, entityBounds.body, entityBounds.end).map(({ start, end }) => {
    const entity = serialize(pairs.slice(start, end));
    return { name: valueOf(entity, 2) ?? "", entity };
  });
  if (inserts.some(({ entity }) => valueOf(entity, 0) !== "INSERT")) throw new Error("DXF named drawing ENTITIES must contain only INSERT records");
  return { blocks, inserts };
}

export function expandNamedDxfDrawing(dxf: string): readonly string[] {
  const drawing = readNamedDxfDrawing(dxf);
  const blocks = new Map(drawing.blocks.map((block) => [block.name, block]));
  return drawing.inserts.flatMap(({ name, entity: insert }) => {
    const block = name ? blocks.get(name) : undefined;
    if (!block) throw new Error(`DXF INSERT refers to missing block "${name}"`);
    const transforms: ReadonlyArray<readonly [number, string]> = [[10, "0"], [20, "0"], [30, "0"], [41, "1"], [42, "1"], [43, "1"], [50, "0"]];
    if (transforms.some(([code, expected]) => {
      const raw = valueOf(insert, code);
      return raw !== undefined && Number(raw) !== Number(expected);
    })) throw new Error(`DXF INSERT "${name}" has a non-identity transform`);
    return [...block.entities];
  });
}
