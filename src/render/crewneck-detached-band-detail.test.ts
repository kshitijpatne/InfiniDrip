import { describe, expect, it } from "vitest";
import type { FlatPathPrimitive, TechnicalFlatPrimitive } from "./technical-flat";
import { composeCrewneckDetachedBandDetails, type CrewneckDetachedBandRole } from "./crewneck-detached-band-detail";

const revisionId = "crewneck-detached-test-r1";
const roles: readonly CrewneckDetachedBandRole[] = ["neckband", "cuffLeft", "cuffRight", "hemBand"];
const edgeNames = ["join", "sideRight", "joinLayer", "sideLeft"] as const;

function sources(roleId: CrewneckDetachedBandRole, width: number, depth: number): TechnicalFlatPrimitive[] {
  const outline: FlatPathPrimitive = { kind: "path", id: `source:${roleId}:outline`, layer: "GARMENT_SILHOUETTE",
    feature: "silhouette", source: { sourceClass: "PATTERN_DERIVED", sourceId: `pattern:crewneck:role:${roleId}`, revisionId },
    sourceEdgeIds: edgeNames.map((edgeId) => `pattern:crewneck:role:${roleId}:edge:${edgeId}`), commands: [
      { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: width, y: 0 } },
      { op: "move", point: { x: width, y: 0 } }, { op: "line", point: { x: width, y: depth } },
      { op: "move", point: { x: width, y: depth } }, { op: "line", point: { x: 0, y: depth } },
      { op: "move", point: { x: 0, y: depth } }, { op: "line", point: { x: 0, y: 0 } },
    ] };
  const marks = ["bandFold", "greatestStretchDirection"] as const;
  return [outline, ...marks.map((markName) => ({ kind: "path" as const, id: `source:${roleId}:${markName}`,
    layer: "ANNOTATION" as const, feature: "annotation" as const,
    source: { sourceClass: "PATTERN_DERIVED" as const, sourceId: `pattern:crewneck:mark:${roleId}:${markName}`, revisionId },
    patternMark: { kind: "foldLine" as const, name: markName, label: markName },
    commands: [{ op: "move" as const, point: { x: 0, y: depth / 2 } },
      { op: "line" as const, point: { x: width, y: depth / 2 } }],
  }))];
}

const bandPrimitives = {
  neckband: sources("neckband", 40.5, 5),
  cuffLeft: sources("cuffLeft", 31.5, 12),
  cuffRight: sources("cuffRight", 31.5, 12),
  hemBand: sources("hemBand", 93.5, 12),
} satisfies Record<CrewneckDetachedBandRole, TechnicalFlatPrimitive[]>;
const body: FlatPathPrimitive = { kind: "path", id: "body", layer: "GARMENT_SILHOUETTE", feature: "silhouette",
  source: { sourceClass: "PATTERN_DERIVED", sourceId: "pattern:crewneck:role:front", revisionId },
  commands: [{ op: "move", point: { x: -28, y: 0 } }, { op: "line", point: { x: 28, y: 70 } }] };
const build = (overrides: Partial<Parameters<typeof composeCrewneckDetachedBandDetails>[0]> = {}) =>
  composeCrewneckDetachedBandDetails({ occupiedPrimitives: [body], bandPrimitives, axisX: 0, revisionId, ...overrides });

describe("composeCrewneckDetachedBandDetails", () => {
  it("keeps all four exact source details at source scale below the occupied assembled view", () => {
    const result = build();
    expect(result.issue).toBeUndefined();
    expect(result.primitives).toHaveLength(16);
    const outlines = result.primitives.filter((primitive): primitive is FlatPathPrimitive => primitive.kind === "path"
      && primitive.source.sourceId.startsWith("pattern:crewneck:role:"));
    expect(outlines).toHaveLength(4);
    for (const roleId of roles) {
      const outline = outlines.find((primitive) => primitive.source.sourceId === `pattern:crewneck:role:${roleId}`)!;
      expect(outline.id).toContain(":detached-detail");
      expect(outline.source.revisionId).toBe(revisionId);
      expect(outline.sourceEdgeIds).toEqual(edgeNames.map((edgeId) => `pattern:crewneck:role:${roleId}:edge:${edgeId}`));
    }
    const hem = outlines.find((primitive) => primitive.source.sourceId === "pattern:crewneck:role:hemBand")!;
    expect(hem.commands[0]).toEqual({ op: "move", point: { x: -46.75, y: 90 } });
    expect(hem.commands[1]).toEqual({ op: "line", point: { x: 46.75, y: 90 } });
    expect(result.primitives.filter((primitive) => primitive.kind === "text")).toHaveLength(4);
    expect(result.primitives.filter((primitive) => primitive.kind === "text").map((primitive) => primitive.text))
      .toEqual(expect.arrayContaining([
        "DETAIL ONLY—not at assembly location · neckband · source scale",
        "DETAIL ONLY—not at assembly location · left cuff · source scale",
        "DETAIL ONLY—not at assembly location · right cuff · source scale",
        "DETAIL ONLY—not at assembly location · hem band · source scale",
      ]));
    expect(result.primitives.filter((primitive) => primitive.source.sourceId.startsWith("pattern:crewneck:mark:"))).toHaveLength(8);
  });

  it("rejects invalid axes, missing revisions, and occupied views with no finite extent", () => {
    expect(build({ axisX: Number.NaN }).issue).toContain("finite assembled center axis");
    expect(build({ revisionId: " " }).issue).toContain("finite assembled center axis");
    expect(build({ occupiedPrimitives: [] }).issue).toContain("determine clear space");
  });

  it("rejects incomplete, malformed, and stale source details", () => {
    const missingRole = { ...bandPrimitives, hemBand: [] };
    expect(build({ bandPrimitives: missingRole }).issue).toContain("all four exact same-revision");
    const brokenOutline = { ...bandPrimitives, cuffLeft: bandPrimitives.cuffLeft.slice(1) };
    expect(build({ bandPrimitives: brokenOutline }).issue).toContain("all four exact same-revision");
    const staleMark = bandPrimitives.cuffRight.map((primitive) => primitive.source.sourceId.endsWith(":bandFold")
      ? { ...primitive, source: { ...primitive.source, revisionId: "stale" } } : primitive);
    expect(build({ bandPrimitives: { ...bandPrimitives, cuffRight: staleMark } }).issue)
      .toContain("all four exact same-revision");
    const invalidMarkPrimitive: TechnicalFlatPrimitive = { kind: "circle", id: "source:cuffRight:unexpected-mark",
      layer: "ANNOTATION", feature: "annotation",
      source: { sourceClass: "PATTERN_DERIVED", sourceId: "pattern:crewneck:mark:cuffRight:unexpected", revisionId },
      center: { x: 0, y: 0 }, radius: 1 };
    const nonPathMark = bandPrimitives.cuffRight.map((primitive) => primitive.source.sourceId.endsWith(":bandFold")
      ? invalidMarkPrimitive : primitive);
    expect(build({ bandPrimitives: { ...bandPrimitives, cuffRight: nonPathMark } }).issue)
      .toContain("all four exact same-revision");
    const markPrimitive: TechnicalFlatPrimitive = { kind: "mark", id: "source:cuffRight:bandFold",
      layer: "ANNOTATION", feature: "annotation",
      source: { sourceClass: "PATTERN_DERIVED", sourceId: "pattern:crewneck:mark:cuffRight:bandFold", revisionId },
      markKind: "placementPoint", markName: "bandFold", at: { x: 0, y: 6 }, label: "bandFold" };
    const pointMark = bandPrimitives.cuffRight.map((primitive) => primitive.source.sourceId.endsWith(":bandFold")
      ? markPrimitive : primitive);
    expect(build({ bandPrimitives: { ...bandPrimitives, cuffRight: pointMark } }).issue).toBeUndefined();

    const emptyOutline = bandPrimitives.cuffLeft.map((primitive) => primitive.kind === "path"
      && primitive.source.sourceId === "pattern:crewneck:role:cuffLeft" ? { ...primitive, commands: [] } : primitive);
    expect(build({ bandPrimitives: { ...bandPrimitives, cuffLeft: emptyOutline } }).issue)
      .toContain("all four exact same-revision");
  });
});
