import { describe, expect, it } from "vitest";
import { cubicLength, distance } from "../geometry";
import { GARMENTS } from "../drafting/recipe";
import { STANDARD_M } from "../drafting/measurements";
import { defaultGarmentOptions } from "../drafting/options";
import type { FlatPathPrimitive, TechnicalFlatPrimitive } from "./technical-flat";
import {
  technicalFlatTransformError,
  transformFlatPoint,
  transformFlatPrimitive,
  type TechnicalFlatTransform,
} from "./technical-flat-transform";

const source = { sourceClass: "PATTERN_DERIVED" as const, sourceId: "pattern:front", revisionId: "rev-1" };
const identity: TechnicalFlatTransform = { offset: { x: 0, y: 0 }, rotationDegrees: 0, mirrorX: false };
const rotateMirror: TechnicalFlatTransform = { offset: { x: 10, y: 20 }, rotationDegrees: 90, mirrorX: true };

const outline: FlatPathPrimitive = {
  kind: "path", id: "front-outline", layer: "GARMENT_SILHOUETTE", feature: "silhouette", source,
  commands: [
    { op: "move", point: { x: 0, y: 0 } },
    { op: "line", point: { x: 2, y: 0 } },
    { op: "cubic", control1: { x: 3, y: 0 }, control2: { x: 3, y: 2 }, point: { x: 2, y: 2 } },
    { op: "close" },
  ],
};

describe("technical-flat rigid transforms", () => {
  it("validates transform input and rejects invalid values without clamping", () => {
    expect(technicalFlatTransformError(null)).toBe("Expected a transform object.");
    expect(technicalFlatTransformError([])).toBe("Expected a transform object.");
    expect(technicalFlatTransformError({ offset: { x: Number.NaN, y: 0 }, rotationDegrees: 0, mirrorX: false }))
      .toBe("Transform offset must contain finite x and y coordinates.");
    expect(technicalFlatTransformError({ offset: { x: 0, y: 0 }, rotationDegrees: Number.POSITIVE_INFINITY, mirrorX: false }))
      .toBe("Transform rotation must be a finite degree value.");
    expect(technicalFlatTransformError({ offset: { x: 0, y: 0 }, rotationDegrees: 0, mirrorX: "yes" }))
      .toBe("Transform mirrorX must be true or false.");
    expect(technicalFlatTransformError({ ...identity, scale: 2 }))
      .toBe("Rigid transforms accept only offset, rotationDegrees, and mirrorX; scaling is not supported.");
    expect(technicalFlatTransformError(identity)).toBeNull();
    expect(() => transformFlatPoint({ x: 1, y: 2 }, { ...identity, rotationDegrees: Number.NaN }))
      .toThrow("Transform rotation must be a finite degree value.");
    expect(() => transformFlatPoint({ x: Number.NaN, y: 2 }, identity))
      .toThrow("Source point must contain finite x and y coordinates.");
    expect(() => transformFlatPoint({ x: Number.MAX_VALUE, y: 0 }, {
      ...identity, offset: { x: Number.MAX_VALUE, y: 0 },
    })).toThrow("Rigid transform produced non-finite coordinates.");
  });

  it("mirrors, rotates and translates points in the declared order while preserving lengths", () => {
    expect(transformFlatPoint({ x: 2, y: 3 }, rotateMirror)).toEqual({ x: 7, y: 18 });
    const transformed = transformFlatPrimitive(outline, rotateMirror) as FlatPathPrimitive;
    expect(transformed.commands[0]).toEqual({ op: "move", point: { x: 10, y: 20 } });
    expect(transformed.commands[1]).toEqual({ op: "line", point: { x: 10, y: 18 } });
    const originalCurve = outline.commands[2];
    const transformedCurve = transformed.commands[2];
    const originalStart = outline.commands[1];
    const transformedStart = transformed.commands[1];
    if (originalCurve.op !== "cubic" || transformedCurve.op !== "cubic"
      || originalStart.op !== "line" || transformedStart.op !== "line") throw new Error("Expected cubic fixture.");
    expect(transformedCurve).toEqual({
      op: "cubic", control1: { x: 10, y: 17 }, control2: { x: 8, y: 17 }, point: { x: 8, y: 18 },
    });
    expect(cubicLength({ start: transformedStart.point, control1: transformedCurve.control1,
      control2: transformedCurve.control2, end: transformedCurve.point })).toBeCloseTo(
      cubicLength({ start: originalStart.point, control1: originalCurve.control1, control2: originalCurve.control2, end: originalCurve.point }),
    );
    expect(transformed.commands[3]).toEqual({ op: "close" });
    expect(transformed.id).toBe(outline.id);
    expect(transformed.source).toEqual(source);
  });

  it("transforms non-path anchors while preserving radius and source identity", () => {
    const circle: TechnicalFlatPrimitive = { kind: "circle", id: "button", layer: "CLOSURE", feature: "closure", source,
      center: { x: 2, y: 3 }, radius: 0.25 };
    const text: TechnicalFlatPrimitive = { kind: "text", id: "note", layer: "ANNOTATION", feature: "annotation", source,
      at: { x: 2, y: 3 }, text: "Button" };
    expect(transformFlatPrimitive(circle, rotateMirror)).toMatchObject({ center: { x: 7, y: 18 }, radius: 0.25, id: "button" });
    expect(transformFlatPrimitive(text, rotateMirror)).toMatchObject({ at: { x: 7, y: 18 }, text: "Button", id: "note" });
    const mark: TechnicalFlatPrimitive = { kind: "mark", id: "button-mark", layer: "CLOSURE", feature: "closure", source,
      markKind: "button", markName: "button-1", at: { x: 2, y: 3 } };
    expect(transformFlatPrimitive(mark, rotateMirror)).toMatchObject({ at: { x: 7, y: 18 }, markName: "button-1" });
  });

  it("transforms artwork placement and preserves its true scale and paint order", () => {
    const artwork: TechnicalFlatPrimitive = { kind: "artwork", id: "placement", layer: "ARTWORK", feature: "artwork", source,
      artworkKind: "print", placementId: "place-1", assetId: "asset-1", sourceName: "Graphic", targetRoleId: "front",
      widthCm: 5, heightCm: 4, transform: { dx: 2, dy: 3, scale: 1.5, rotationDegrees: 30 }, zOrder: 4 };
    expect(transformFlatPrimitive(artwork, rotateMirror)).toMatchObject({
      id: "placement", widthCm: 5, heightCm: 4, zOrder: 4,
      transform: { dx: 7, dy: 18, scale: 1.5, rotationDegrees: 60 },
    });
    expect(transformFlatPrimitive(artwork, { ...rotateMirror, mirrorX: false })).toMatchObject({
      transform: { dx: 7, dy: 22, rotationDegrees: 120 },
    });
  });

  it("transforms callout anchors and labels without changing their geometry target", () => {
    const callout: TechnicalFlatPrimitive = { kind: "callout", id: "pom-chest", layer: "CALLOUT", feature: "pom", source,
      text: "Chest width", anchor: { primitiveId: "front-outline", point: { x: 2, y: 3 } }, labelAt: { x: 6, y: 3 },
      dimensionReferences: { kind: "vertical-levels", references: [
        { point: { x: 2, y: 2 }, sourceEntityId: "pattern:polo:role:front:edge:hem" },
        { point: { x: 2, y: 4 }, sourceEntityId: "pattern:polo:role:back:edge:hem" },
      ] } };
    expect(transformFlatPrimitive(callout, rotateMirror)).toMatchObject({
      id: "pom-chest", text: "Chest width", anchor: { primitiveId: "front-outline", point: { x: 7, y: 18 } },
      labelAt: { x: 7, y: 14 }, dimensionReferences: { references: [
        { point: { x: 8, y: 18 } }, { point: { x: 6, y: 18 } },
      ] },
    });
    const ordinaryCallout = { ...callout, dimensionReferences: undefined };
    expect(transformFlatPrimitive(ordinaryCallout, rotateMirror)).toMatchObject({
      labelAt: { x: 7, y: 14 }, dimensionReferences: undefined,
    });
  });

  it("rejects a primitive containing invalid source coordinates", () => {
    const invalid = { ...outline, commands: [{ op: "move", point: { x: Number.NaN, y: 0 } }, { op: "close" }] } as unknown as FlatPathPrimitive;
    expect(() => transformFlatPrimitive(invalid, identity)).toThrow("Source point must contain finite x and y coordinates.");
  });

  it("preserves drafted edge lengths across all seven recipes", () => {
    const transform: TechnicalFlatTransform = { offset: { x: 17, y: -8 }, rotationDegrees: 37, mirrorX: true };
    for (const recipe of GARMENTS) {
      const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
      for (const [role, piece] of Object.entries(block.roles)) {
        for (const edge of piece.edges) {
          const commands = edge.kind === "line"
            ? [{ op: "move" as const, point: edge.start }, { op: "line" as const, point: edge.end }]
            : [
                { op: "move" as const, point: edge.curve.start },
                { op: "cubic" as const, control1: edge.curve.control1, control2: edge.curve.control2, point: edge.curve.end },
              ];
          const primitive: FlatPathPrimitive = {
            kind: "path", id: `${recipe.name}:${role}:${edge.name}`, layer: "SEAM", feature: "seam", source,
            commands,
          };
          const transformed = transformFlatPrimitive(primitive, transform) as FlatPathPrimitive;
          if (edge.kind === "line") {
            const start = transformed.commands[0];
            const end = transformed.commands[1];
            if (start.op !== "move" || end.op !== "line") throw new Error("Line edge path changed command type.");
            expect(distance(start.point, end.point), `${recipe.name}.${role}.${edge.name}`).toBeCloseTo(distance(edge.start, edge.end), 8);
          } else {
            const start = transformed.commands[0];
            const curve = transformed.commands[1];
            if (start.op !== "move" || curve.op !== "cubic") throw new Error("Curve edge path changed command type.");
            expect(cubicLength({ start: start.point, control1: curve.control1, control2: curve.control2, end: curve.point }),
              `${recipe.name}.${role}.${edge.name}`).toBeCloseTo(cubicLength(edge.curve), 7);
          }
        }
      }
    }
  });
});
