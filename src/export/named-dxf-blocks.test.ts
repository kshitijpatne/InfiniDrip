import { describe, expect, it } from "vitest";
import { dxfEntityTypeAndLayer, expandNamedDxfDrawing, readNamedDxfDrawing, wrapDxfEntitiesInNamedBlocks } from "./named-dxf-blocks";

const header = "0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n5\n0\nENDSEC\n";
const sourceEntities = [
  "0\nLINE\n8\nCUT\n10\n0\n20\n0\n11\n1\n21\n1\n",
  "0\nPOINT\n8\nMARK_BUTTONHOLE\n10\n0.5\n20\n0.5\n",
  "0\nPOLYLINE\n8\nCUT\n66\n1\n70\n1\n0\nVERTEX\n8\nCUT\n10\n0\n20\n0\n0\nVERTEX\n8\nCUT\n10\n1\n20\n1\n0\nSEQEND\n",
  "0\nLINE\n8\nSEW\n10\n0\n20\n0\n11\n1\n21\n1\n",
  "0\nLINE\n8\nMARK_NOTCH\n10\n0.5\n20\n0.5\n11\n0.5\n21\n0.9\n",
];
const entities = sourceEntities.join("");
const flatDrawing = `${header}0\nSECTION\n2\nENTITIES\n${entities}0\nENDSEC\n0\nEOF\n`;
const groups = [
  { name: "IDR_TEE_FRONT_A1", leadingEntityCount: 2, trailingEntityCount: 1 },
  { name: "IDR_TEE_BACK_B2", leadingEntityCount: 2, trailingEntityCount: 0 },
];

describe("named DXF piece blocks", () => {
  it("wraps each piece's original entities and trailing construction marks without changing their payload", () => {
    const wrapped = wrapDxfEntitiesInNamedBlocks(flatDrawing, groups);
    const drawing = readNamedDxfDrawing(wrapped);
    expect(drawing.blocks.map(({ name }) => name)).toEqual(groups.map(({ name }) => name));
    expect(drawing.inserts.map(({ name }) => name)).toEqual(groups.map(({ name }) => name));
    expect(drawing.blocks[0]?.entities).toEqual([sourceEntities[0], sourceEntities[1], sourceEntities[4]]);
    expect(drawing.blocks[1]?.entities).toEqual([sourceEntities[2], sourceEntities[3]]);
    expect(drawing.blocks[0]?.entities.map((entity) => entity.split("\n")[1])).toEqual(["LINE", "POINT", "LINE"]);
    expect(drawing.blocks[1]?.entities.map((entity) => entity.split("\n")[1])).toEqual(["POLYLINE", "LINE"]);
    expect(expandNamedDxfDrawing(wrapped)).toEqual([
      ...drawing.blocks[0]!.entities,
      ...drawing.blocks[1]!.entities,
    ]);
    expect(wrapped).toContain("9\n$INSUNITS\n70\n5\n");
    expect(wrapped.indexOf("2\nTABLES\n")).toBeLessThan(wrapped.indexOf("2\nBLOCKS\n"));
    const tableStart = wrapped.indexOf("2\nTABLES\n");
    const tableEnd = wrapped.indexOf("0\nENDSEC\n", tableStart);
    const table = wrapped.slice(tableStart, tableEnd);
    const declaredLayers = [...table.matchAll(/\n2\n([^\n]+)\n70\n0\n62\n7\n6\nCONTINUOUS\n/gu)].map((match) => match[1]);
    expect(declaredLayers).toEqual(["0", "CUT", "MARK_BUTTONHOLE", "MARK_NOTCH", "SEW"]);
    const tablePairs = table.trimEnd().split(/\r?\n/u);
    const handles = tablePairs.flatMap((code, index) => code === "5" && index % 2 === 0 ? [tablePairs[index + 1]] : []);
    expect(new Set(handles).size).toBe(6);
  });

  it("rejects invalid group names, counts, and source entity streams", () => {
    expect(() => wrapDxfEntitiesInNamedBlocks(flatDrawing, [])).toThrow("at least one piece");
    expect(() => wrapDxfEntitiesInNamedBlocks(flatDrawing, [{ ...groups[0]!, name: "bad name" }])).toThrow("ASCII identifiers");
    expect(() => wrapDxfEntitiesInNamedBlocks(flatDrawing, [groups[0]!, { ...groups[1]!, name: groups[0]!.name }])).toThrow("unique");
    expect(() => wrapDxfEntitiesInNamedBlocks(flatDrawing, [{ ...groups[0]!, leadingEntityCount: 1 }])).toThrow("counts are invalid");
    expect(() => wrapDxfEntitiesInNamedBlocks(flatDrawing, [{ ...groups[0]!, leadingEntityCount: 99 }])).toThrow("expected 100 entities");
    expect(() => wrapDxfEntitiesInNamedBlocks("0\nSECTION\n2\nEOF\n", groups)).toThrow("no ENTITIES section");
    expect(() => wrapDxfEntitiesInNamedBlocks(`${header}0\nSECTION\n2\nENTITIES\n9\nstray\n0\nENDSEC\n0\nEOF\n`, groups)).toThrow("outside an entity");
    expect(() => wrapDxfEntitiesInNamedBlocks(`${header}0\nSECTION\n2\nENTITIES\n0\nPOLYLINE\n8\nCUT\n0\nENDSEC\n0\nEOF\n`, [{ ...groups[0]!, leadingEntityCount: 2, trailingEntityCount: 0 }])).toThrow("no SEQEND");
    expect(() => wrapDxfEntitiesInNamedBlocks(`${header}0\nSECTION\n2\nENTITIES\n0\nLINE\n8\nCUT\n10\n0\n20\n0\n11\n1\n21\n1\n0\nPOLYLINE\n8\nCUT\n0\nENDSEC\n0\nSEQEND\n0\nEOF\n`, [{ ...groups[0]!, leadingEntityCount: 2, trailingEntityCount: 0 }])).toThrow("extends beyond its section");
    expect(() => wrapDxfEntitiesInNamedBlocks(`${header}0\nSECTION\n2\nENTITIES\n0\nEOF\n`, groups)).toThrow("unterminated");
    expect(() => wrapDxfEntitiesInNamedBlocks(`${header}x\nBAD\n`, groups)).toThrow("not an integer");
    expect(() => wrapDxfEntitiesInNamedBlocks("0\nSECTION\n2\nENTITIES\n0\nLINE\n8\nCUT\n10\n", groups)).toThrow("incomplete group-code/value pair");
    const unnamedLayer = `${header}0\nSECTION\n2\nENTITIES\n0\nLINE\n10\n0\n20\n0\n11\n1\n21\n1\n${entities.slice(sourceEntities[0]!.length)}0\nENDSEC\n0\nEOF\n`;
    expect(() => wrapDxfEntitiesInNamedBlocks(unnamedLayer, groups)).toThrow("must name their layers");
    expect(() => wrapDxfEntitiesInNamedBlocks(`${header}0\nSECTION\n2\nTABLES\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${entities}0\nENDSEC\n0\nEOF\n`, groups)).toThrow("must not already contain a TABLES section");
    expect(dxfEntityTypeAndLayer("0\nPOINT\n10\n0\n20\n0\n")).toEqual({ type: "POINT", layer: "" });
  });

  it("rejects unresolved blocks, non-identity inserts, and malformed block sections", () => {
    const wrapped = wrapDxfEntitiesInNamedBlocks(flatDrawing, groups);
    expect(() => expandNamedDxfDrawing(wrapped.replace("IDR_TEE_FRONT_A1", "IDR_UNKNOWN_FRONT"))).toThrow("missing block");
    expect(() => expandNamedDxfDrawing(wrapped.replace("41\n1\n", "41\n2\n"))).toThrow("non-identity transform");
    expect(() => readNamedDxfDrawing(wrapped.replace("0\nBLOCK\n", "0\nLINE\n"))).toThrow("invalid record");
    expect(() => readNamedDxfDrawing(wrapped.replace("2\nIDR_TEE_FRONT_A1\n", "70\n0\n"))).toThrow("no name");
    expect(() => readNamedDxfDrawing(wrapped.replace("0\nENDBLK\n", "0\nENDSEC\n"))).toThrow("no ENDBLK");
    expect(() => readNamedDxfDrawing(wrapped.replace("0\nINSERT\n", "0\nLINE\n"))).toThrow("only INSERT");
    const insertNameStart = wrapped.indexOf("2\nIDR_TEE_FRONT_A1\n", wrapped.indexOf("0\nSECTION\n2\nENTITIES\n"));
    const emptyInsertName = `${wrapped.slice(0, insertNameStart)}2\n\n${wrapped.slice(insertNameStart + "2\nIDR_TEE_FRONT_A1\n".length)}`;
    expect(() => expandNamedDxfDrawing(emptyInsertName)).toThrow('missing block ""');
    const missingInsertName = `${wrapped.slice(0, insertNameStart)}${wrapped.slice(insertNameStart + `2\nIDR_TEE_FRONT_A1\n`.length)}`;
    expect(() => expandNamedDxfDrawing(missingInsertName)).toThrow('missing block ""');
  });
});
