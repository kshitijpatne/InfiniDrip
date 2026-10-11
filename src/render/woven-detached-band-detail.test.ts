import { describe, expect, it } from "vitest";
import { composeWovenDetachedBandDetails } from "./woven-detached-band-detail";
import type { FlatPathPrimitive, TechnicalFlatPrimitive } from "./technical-flat";

const revisionId = "woven-detached-test-r1";
const outline: FlatPathPrimitive = { kind: "path", id: "band-outline", layer: "GARMENT_SILHOUETTE",
  feature: "silhouette", source: { sourceClass: "PATTERN_DERIVED", sourceId: "pattern:woven-shirt:role:sleeveBand", revisionId },
  sourceEdgeIds: ["top", "right", "bottom", "left"], commands: [
    { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 3, y: 0 } },
    { op: "line", point: { x: 3, y: 10 } }, { op: "line", point: { x: 0, y: 10 } }, { op: "close" },
  ] };
const fold: FlatPathPrimitive = { kind: "path", id: "band-fold", layer: "ANNOTATION", feature: "annotation",
  source: { sourceClass: "PATTERN_DERIVED", sourceId: "pattern:woven-shirt:mark:sleeveBand:bandFold", revisionId },
  patternMark: { kind: "foldLine", name: "bandFold", label: "FOLD" },
  commands: [{ op: "move", point: { x: 1.5, y: 0 } }, { op: "line", point: { x: 1.5, y: 10 } }] };
const body: FlatPathPrimitive = { kind: "path", id: "back-outline", layer: "GARMENT_SILHOUETTE",
  feature: "silhouette", source: { sourceClass: "PATTERN_DERIVED", sourceId: "pattern:woven-shirt:role:back", revisionId },
  commands: [{ op: "move", point: { x: -20, y: 0 } }, { op: "line", point: { x: 20, y: 40 } }] };
const build = (overrides: Partial<Parameters<typeof composeWovenDetachedBandDetails>[0]> = {}) =>
  composeWovenDetachedBandDetails({ bodyPrimitives: [body], bandPrimitives: [outline, fold], axisX: 0, revisionId, ...overrides });

describe("composeWovenDetachedBandDetails", () => {
  it("places two mirrored source-scale outlines and fold marks with a detached detail label", () => {
    const result = build();
    expect(result.issue).toBeUndefined();
    expect(result.primitives).toHaveLength(5);
    const paths = result.primitives.filter((primitive): primitive is FlatPathPrimitive => primitive.kind === "path");
    const outlines = paths.filter((primitive) => primitive.id.startsWith("band-outline:"));
    expect(outlines).toHaveLength(2);
    expect(outlines[0]!.commands).toEqual([
      { op: "move", point: { x: -21, y: 18.5 } }, { op: "line", point: { x: -21, y: 21.5 } },
      { op: "line", point: { x: -31, y: 21.5 } }, { op: "line", point: { x: -31, y: 18.5 } }, { op: "close" },
    ]);
    expect(outlines[1]!.commands).toEqual([
      { op: "move", point: { x: 21, y: 18.5 } }, { op: "line", point: { x: 21, y: 21.5 } },
      { op: "line", point: { x: 31, y: 21.5 } }, { op: "line", point: { x: 31, y: 18.5 } }, { op: "close" },
    ]);
    expect(paths.filter((primitive) => primitive.patternMark?.name === "bandFold")).toHaveLength(2);
    expect(result.primitives.find((primitive) => primitive.kind === "text")).toMatchObject({
      source: { revisionId }, text: expect.stringContaining("DETAIL ONLY—not at assembly location"),
    });
  });

  it("rejects invalid axes, missing source instances and stale revisions", () => {
    expect(build({ axisX: Number.NaN }).issue).toContain("same-revision outline");
    expect(build({ bandPrimitives: [outline] }).issue).toContain("same-revision outline");
    expect(build({ bandPrimitives: [outline, { ...fold, source: { ...fold.source, revisionId: "stale" } }] }).issue)
      .toContain("same-revision outline");
  });

  it("rejects absent source-bound body or band geometry", () => {
    expect(build({ bodyPrimitives: [{ kind: "text", id: "body-note", layer: "ANNOTATION", feature: "annotation",
      source: { sourceClass: "PATTERN_DERIVED", sourceId: "note", revisionId }, at: { x: 0, y: 0 }, text: "note" }] })
      .issue).toContain("source-bound body and band extents");
    const emptyOutline = { ...outline, commands: [] } as TechnicalFlatPrimitive;
    expect(build({ bandPrimitives: [emptyOutline, fold] }).issue).toContain("source-bound body and band extents");
  });

  it("keeps valid source details when other same-revision band annotations accompany them", () => {
    const note: TechnicalFlatPrimitive = { kind: "text", id: "band-note", layer: "ANNOTATION", feature: "annotation",
      source: { sourceClass: "PATTERN_DERIVED", sourceId: "pattern:woven-shirt:mark:sleeveBand:note", revisionId },
      at: { x: 1, y: 1 }, text: "source note" };
    const result = build({ bandPrimitives: [outline, fold, note] });
    expect(result.issue).toBeUndefined();
    expect(result.primitives.filter((primitive) => primitive.id.startsWith("band-note:"))).toHaveLength(2);
  });
});
