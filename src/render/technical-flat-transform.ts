import { point, rotatePoint } from "../geometry";
import type { FlatPoint, TechnicalFlatPrimitive } from "./technical-flat";

/** Rigid source-to-view transform. Order is mirror across local Y, rotate,
 * then translate; no scale is allowed so drafted dimensions stay true. */
export interface TechnicalFlatTransform {
  readonly offset: FlatPoint;
  readonly rotationDegrees: number;
  readonly mirrorX: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFinitePoint = (value: unknown): value is FlatPoint =>
  isRecord(value) && typeof value.x === "number" && Number.isFinite(value.x)
  && typeof value.y === "number" && Number.isFinite(value.y);

/** Return an actionable reason for invalid rigid transform input. */
export function technicalFlatTransformError(value: unknown): string | null {
  if (!isRecord(value)) return "Expected a transform object.";
  if (Object.keys(value).some((key) => !["offset", "rotationDegrees", "mirrorX"].includes(key))) {
    return "Rigid transforms accept only offset, rotationDegrees, and mirrorX; scaling is not supported.";
  }
  if (!isFinitePoint(value.offset)) return "Transform offset must contain finite x and y coordinates.";
  if (typeof value.rotationDegrees !== "number" || !Number.isFinite(value.rotationDegrees)) {
    return "Transform rotation must be a finite degree value.";
  }
  if (typeof value.mirrorX !== "boolean") return "Transform mirrorX must be true or false.";
  return null;
}

function requireTransform(transform: TechnicalFlatTransform): void {
  const error = technicalFlatTransformError(transform);
  if (error) throw new RangeError(error);
}

function mapPoint(pointValue: FlatPoint, transform: TechnicalFlatTransform): FlatPoint {
  if (!isFinitePoint(pointValue)) throw new RangeError("Source point must contain finite x and y coordinates.");
  const mirrored = transform.mirrorX ? point(-pointValue.x, pointValue.y) : point(pointValue.x, pointValue.y);
  const angle = (transform.rotationDegrees * Math.PI) / 180;
  const rotated = rotatePoint(mirrored, point(0, 0), angle);
  const result = point(rotated.x + transform.offset.x, rotated.y + transform.offset.y);
  if (!isFinitePoint(result)) throw new RangeError("Rigid transform produced non-finite coordinates.");
  return result;
}

/** Transform a centimetre coordinate without changing scale or edge length. */
export function transformFlatPoint(pointValue: FlatPoint, transform: TechnicalFlatTransform): FlatPoint {
  requireTransform(transform);
  return mapPoint(pointValue, transform);
}

/** Apply a rigid view transform to one vector primitive. Source IDs, revision
 * bindings, layers, labels and placement identity remain stable. */
export function transformFlatPrimitive(
  primitive: TechnicalFlatPrimitive,
  transform: TechnicalFlatTransform,
): TechnicalFlatPrimitive {
  requireTransform(transform);
  switch (primitive.kind) {
    case "path":
      return {
        ...primitive,
        commands: primitive.commands.map((command) => {
          switch (command.op) {
            case "move":
            case "line":
              return { ...command, point: mapPoint(command.point, transform) };
            case "cubic":
              return {
                ...command,
                control1: mapPoint(command.control1, transform),
                control2: mapPoint(command.control2, transform),
                point: mapPoint(command.point, transform),
              };
            case "close":
              return command;
          }
        }),
      };
    case "circle":
      return { ...primitive, center: mapPoint(primitive.center, transform) };
    case "mark":
      return { ...primitive, at: mapPoint(primitive.at, transform) };
    case "text":
      return { ...primitive, at: mapPoint(primitive.at, transform) };
    case "artwork": {
      const { dx, dy, scale, rotationDegrees } = primitive.transform;
      const artworkOffset = mapPoint({ x: dx, y: dy }, transform);
      return {
        ...primitive,
        transform: {
          dx: artworkOffset.x,
          dy: artworkOffset.y,
          scale,
          rotationDegrees: transform.rotationDegrees + (transform.mirrorX ? -rotationDegrees : rotationDegrees),
        },
      };
    }
    case "callout":
      return {
        ...primitive,
        anchor: { ...primitive.anchor, point: mapPoint(primitive.anchor.point, transform) },
        labelAt: mapPoint(primitive.labelAt, transform),
      };
  }
}
