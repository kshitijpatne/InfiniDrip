import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../drafting";
import { edgeEnd, edgeLength, edgeStart, pieceEdge, type Edge } from "../drafting/piece";
import { assembleTechnicalFlatRoles } from "./technical-flat-assembly";
import { compileTechnicalFlatSourceGeometry } from "./technical-flat-geometry";
import { createG04TechnicalFlatProjectionMap } from "./technical-flat-projection";
import { transformFlatPoint, transformFlatPrimitive } from "./technical-flat-transform";
import { createWovenCollarProjector, orientedPointAndTangent, projectWovenCollarPrimitive } from "./woven-collar-view-projection";
import type { FlatPoint, FlatPathPrimitive, TechnicalFlatPrimitive } from "./technical-flat";

const revisionId = "woven-collar-projection-r1";
const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
const pointDistance = (a: FlatPoint, b: FlatPoint) => Math.hypot(a.x - b.x, a.y - b.y);

describe("source-bound Woven full-collar projection", () => {
  it("resolves line and curve arclength stations, including bounded endpoint extrapolation", () => {
    const line: Edge = { kind: "line", name: "line", start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
    expect(orientedPointAndTangent(line, false, 0.25)).toEqual({ point: { x: 2.5, y: 0 }, tangent: { x: 1, y: 0 } });
    expect(orientedPointAndTangent(line, false, 1.2)).toEqual({ point: { x: 12, y: 0 }, tangent: { x: 1, y: 0 } });
    const reversedExtrapolation = orientedPointAndTangent(line, true, 1.2)!;
    expect(reversedExtrapolation.point.x).toBeCloseTo(-2, 10);
    expect(reversedExtrapolation.tangent).toEqual({ x: -1, y: -0 });
    const curve: Edge = { kind: "curve", name: "curve", curve: { start: { x: 0, y: 0 },
      control1: { x: 0, y: 5 }, control2: { x: 5, y: 5 }, end: { x: 5, y: 0 } } };
    expect(orientedPointAndTangent(curve, false, 0.5)?.point.x).toBeGreaterThan(0);
    expect(orientedPointAndTangent(curve, true, 0.25)?.tangent.y).toBeGreaterThan(0);
    const degenerate: Edge = { kind: "line", name: "degenerate", start: { x: 1, y: 1 }, end: { x: 1, y: 1 } };
    expect(orientedPointAndTangent(degenerate, false, 0.5)).toBeUndefined();
    expect(orientedPointAndTangent(degenerate, false, 1.2)).toBeUndefined();
  });

  it("maps all joined collar interfaces to the same assembled receiver stations", () => {
    for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
      const assembly = assembleTechnicalFlatRoles("woven-shirt", block, kind);
      const outer = createWovenCollarProjector(block, revisionId, "outerStand", kind, assembly.transforms)!;
      const upper = createWovenCollarProjector(block, revisionId, "upperCollar", kind, assembly.transforms)!;
      const under = createWovenCollarProjector(block, revisionId, "underCollar", kind, assembly.transforms)!;
      const endpoint = kind === "FRONT_FLAT" ? "end" : "start";
      const outerCollar = pieceEdge(block.roles.outerStand!, "collar");
      const underStand = pieceEdge(block.roles.underCollar!, "stand");
      const upperStand = pieceEdge(block.roles.upperCollar!, "stand");
      if (outerCollar.kind !== "line" || underStand.kind !== "line" || upperStand.kind !== "line") {
        throw new Error("Woven collar stitch interfaces must be source lines.");
      }
      const sourceAt = (edge: typeof outerCollar, end: "start" | "end") => end === "start" ? edge.start : edge.end;
      const donorPoint = outer.projectSourcePoint(sourceAt(outerCollar, endpoint));
      const underPoint = under.projectSourcePoint(sourceAt(underStand, endpoint));
      const upperPoint = upper.projectSourcePoint(sourceAt(upperStand, endpoint));
      expect(donorPoint).toBeDefined();
      expect(underPoint).toBeDefined();
      expect(upperPoint).toBeDefined();
      expect(pointDistance(underPoint!, donorPoint!)).toBeLessThan(1e-7);
      expect(pointDistance(upperPoint!, underPoint!)).toBeLessThan(1e-7);
      const outerBase = pieceEdge(block.roles.outerStand!, "neckline");
      if (outerBase.kind !== "line") throw new Error("Outer stand neckline must be a line.");
      const receiverRole = kind === "FRONT_FLAT" ? "front" : "yoke";
      const receiver = pieceEdge(block.roles[receiverRole]!, "neckline");
      const receiverPlacement = assembly.transforms[receiverRole]!;
      const baseEndpoint = kind === "FRONT_FLAT" ? outerBase.start : outerBase.end;
      const mappedBase = outer.projectSourcePoint(baseEndpoint);
      const receiverBase = transformFlatPoint(edgeStart(receiver), {
        ...receiverPlacement, mirrorX: receiverPlacement.mirrorX ?? false,
      });
      expect(mappedBase).toBeDefined();
      expect(pointDistance(mappedBase!, receiverBase)).toBeLessThan(1e-6);
      expect(outer.revisionId).toBe(revisionId);
    }
  });

  it("keeps the collar front-tip vertex identical across its shared seam and exterior edges", () => {
    const assembly = assembleTechnicalFlatRoles("woven-shirt", block, "FRONT_FLAT");
    const projector = createWovenCollarProjector(block, revisionId, "upperCollar", "FRONT_FLAT", assembly.transforms)!;
    const tip = pieceEdge(block.roles.upperCollar!, "frontTip");
    const exterior = pieceEdge(block.roles.upperCollar!, "outer");
    const sourceTip = edgeEnd(tip);
    expect(pointDistance(sourceTip, edgeStart(exterior))).toBeLessThan(1e-8);
    const mappedTipEdge = projector.projectSourcePoint(sourceTip,
      "pattern:woven-shirt:role:upperCollar:edge:frontTip");
    const mappedExteriorEdge = projector.projectSourcePoint(sourceTip,
      "pattern:woven-shirt:role:upperCollar:edge:outer");
    expect(mappedTipEdge).toBeDefined();
    expect(mappedExteriorEdge).toBeDefined();
    expect(pointDistance(mappedTipEdge!, mappedExteriorEdge!)).toBeLessThan(1e-8);
  });

  it("samples straight collar seams along the curved receiver instead of drawing a chord", () => {
    const kind = "FRONT_FLAT" as const;
    const assembly = assembleTechnicalFlatRoles("woven-shirt", block, kind);
    const roleTransform = assembly.transforms.upperCollar!;
    const projector = createWovenCollarProjector(block, revisionId, "upperCollar", kind, assembly.transforms)!;
    const stand = pieceEdge(block.roles.upperCollar!, "stand");
    if (stand.kind !== "line") throw new Error("The collar base seam must be a source line.");
    const backLength = edgeLength(pieceEdge(block.roles.yoke!, "neckline"));
    const source: FlatPathPrimitive = { kind: "path", id: "upper-collar-base", layer: "SEAM", feature: "seam",
      source: { sourceClass: "PATTERN_DERIVED", sourceId: "pattern:woven-shirt:role:upperCollar", revisionId },
      sourceEdgeIds: ["pattern:woven-shirt:role:upperCollar:edge:stand"],
      commands: [{ op: "move", point: { x: backLength, y: stand.start.y } }, { op: "line", point: stand.end }] };
    const placed = transformFlatPrimitive(source, { ...roleTransform, mirrorX: roleTransform.mirrorX ?? false });
    const mapped = projectWovenCollarPrimitive(placed, projector, roleTransform);
    expect(mapped?.kind).toBe("path");
    if (mapped?.kind !== "path") throw new Error("The collar base seam should project.");
    const points = mapped.commands.flatMap((command) => command.op === "close" ? [] : [command.point]);
    expect(points).toHaveLength(17);
    const start = points[0]!;
    const middle = points[8]!;
    const end = points[16]!;
    const chordMiddle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    expect(pointDistance(middle, chordMiddle)).toBeGreaterThan(0.001);
  });

  it("warps source curves and marks while preserving provenance and rejecting callout geometry", () => {
    const assembly = assembleTechnicalFlatRoles("woven-shirt", block, "FRONT_FLAT");
    const projector = createWovenCollarProjector(block, revisionId, "upperCollar", "FRONT_FLAT", assembly.transforms)!;
    const roleTransform = assembly.transforms.upperCollar!;
    const source: FlatPathPrimitive = { kind: "path", id: "upper-collar-test", layer: "GARMENT_SILHOUETTE",
      feature: "silhouette", source: { sourceClass: "PATTERN_DERIVED", sourceId: "pattern:woven-shirt:role:upperCollar",
        revisionId }, sourceEdgeIds: ["pattern:woven-shirt:role:upperCollar:edge:outer"], commands: [
        { op: "move", point: { x: 0, y: 0 } },
        { op: "cubic", control1: { x: 1, y: 0 }, control2: { x: 2, y: 1 }, point: { x: 3, y: 1 } },
        { op: "close" },
      ] };
    const result = projectWovenCollarPrimitive(source, projector, roleTransform);
    expect(result?.kind).toBe("path");
    if (result?.kind !== "path") throw new Error("Projected collar path is required.");
    expect(result.source).toEqual(source.source);
    expect(result.sourceEdgeIds).toEqual(source.sourceEdgeIds);
    expect(result.commands).toHaveLength(18);
    expect(result.commands[result.commands.length - 1]).toEqual({ op: "close" });

    const mark: TechnicalFlatPrimitive = { kind: "mark", id: "mark", layer: "ANNOTATION", feature: "annotation",
      source: source.source, markKind: "placementPoint", markName: "test", at: { x: 1, y: 2 } };
    expect(projectWovenCollarPrimitive(mark, projector, roleTransform)?.kind).toBe("mark");
    const text: TechnicalFlatPrimitive = { kind: "text", id: "text", layer: "ANNOTATION", feature: "annotation",
      source: source.source, at: { x: 1, y: 2 }, text: "source" };
    expect(projectWovenCollarPrimitive(text, projector, roleTransform)?.kind).toBe("text");
    const circle: TechnicalFlatPrimitive = { kind: "circle", id: "circle", layer: "ANNOTATION", feature: "annotation",
      source: source.source, center: { x: 1, y: 2 }, radius: 0.1 };
    expect(projectWovenCollarPrimitive(circle, projector, roleTransform)?.kind).toBe("circle");
    const artwork: TechnicalFlatPrimitive = { kind: "artwork", id: "art", layer: "ARTWORK", feature: "artwork",
      source: source.source, artworkKind: "print", placementId: "p", sourceName: "print", targetRoleId: "upperCollar",
      widthCm: 1, heightCm: 1, transform: { dx: 1, dy: 2, scale: 1, rotationDegrees: 0 }, zOrder: 0 };
    expect(projectWovenCollarPrimitive(artwork, projector, roleTransform)).toBeUndefined();
    const callout: TechnicalFlatPrimitive = { kind: "callout", id: "callout", layer: "ANNOTATION", feature: "annotation",
      source: source.source, text: "POM", anchor: { primitiveId: "source", point: { x: 1, y: 2 } }, labelAt: { x: 2, y: 3 } };
    expect(projectWovenCollarPrimitive(callout, projector, roleTransform)).toBeUndefined();
    expect(projector.projectSourcePoint({ x: Number.NaN, y: 0 })).toBeUndefined();
  });

  it("maps each endpoint of the approved collar area closure through its own source edge", () => {
    const kind = "BACK_FLAT" as const;
    const assembly = assembleTechnicalFlatRoles("woven-shirt", block, kind);
    const projectionMap = createG04TechnicalFlatProjectionMap("woven-shirt", block, revisionId)!;
    const geometry = compileTechnicalFlatSourceGeometry("woven-shirt", block, revisionId, kind, projectionMap);
    const source = geometry.primitives.find((primitive) => primitive.kind === "path"
      && primitive.id === "flat:woven-shirt:BACK_FLAT:component:underCollar:view-boundary:approved-woven-collar-area-closure");
    expect(source?.kind).toBe("path");
    if (source?.kind !== "path") throw new Error("The source-bound collar colorway closure is required.");
    expect(source.projectionEndpointEdgeIds).toEqual([
      "pattern:woven-shirt:role:underCollar:edge:outer", "pattern:woven-shirt:role:underCollar:edge:stand",
    ]);
    const roleTransform = assembly.transforms.underCollar!;
    const placed = transformFlatPrimitive(source, { ...roleTransform, mirrorX: roleTransform.mirrorX ?? false });
    const projector = createWovenCollarProjector(block, revisionId, "underCollar", kind, assembly.transforms)!;
    const mapped = projectWovenCollarPrimitive(placed, projector, roleTransform);
    expect(mapped?.kind).toBe("path");
    if (mapped?.kind !== "path") throw new Error("The approved closure endpoints must map.");
    expect(mapped.projectionEndpointEdgeIds).toBeUndefined();
    expect(mapped.commands.filter((command) => command.op !== "close")).toHaveLength(2);
    expect(mapped.commands.every((command) => command.op === "close"
      || (Number.isFinite(command.point.x) && Number.isFinite(command.point.y)))).toBe(true);
  });

  it("maps mirrored placements and rejects geometry outside the selected face", () => {
    const assembly = assembleTechnicalFlatRoles("woven-shirt", block, "FRONT_FLAT");
    const mirroredFront = { ...assembly.transforms.front!, mirrorX: true };
    const projector = createWovenCollarProjector(block, revisionId, "upperCollar", "FRONT_FLAT", {
      ...assembly.transforms, front: mirroredFront,
    })!;
    const collarBase = pieceEdge(block.roles.upperCollar!, "stand");
    if (collarBase.kind !== "line") throw new Error("The collar stand source interface must be a line.");
    const cfStation = edgeEnd(collarBase);
    expect(projector.projectSourcePoint(cfStation)).toBeDefined();
    const placed = transformFlatPoint(cfStation, { ...mirroredFront, mirrorX: true });
    expect(projector.projectPlacedPoint(placed, { ...mirroredFront, mirrorX: true })).toBeDefined();
    expect(projector.projectSourcePoint(edgeStart(collarBase))).toBeUndefined();
    const backAssembly = assembleTechnicalFlatRoles("woven-shirt", block, "BACK_FLAT");
    const backProjector = createWovenCollarProjector(block, revisionId, "upperCollar", "BACK_FLAT", backAssembly.transforms)!;
    expect(backProjector.projectSourcePoint(edgeEnd(collarBase))).toBeUndefined();
  });

  it("rejects malformed source edges, face axes, donor seams and receiver tangents", () => {
    const assembly = assembleTechnicalFlatRoles("woven-shirt", block, "BACK_FLAT");
    const transformSet = assembly.transforms;
    const rolesWithoutYoke = { ...block.roles };
    delete rolesWithoutYoke.yoke;
    const noYoke = { ...block, roles: rolesWithoutYoke };
    expect(createWovenCollarProjector(noYoke, revisionId, "outerStand", "BACK_FLAT", transformSet)).toBeUndefined();

    const missingFrontNeck = { ...block, roles: { ...block.roles, front: { ...block.roles.front!,
      edges: block.roles.front!.edges.filter((edge) => edge.name !== "neckline") } } };
    expect(createWovenCollarProjector(missingFrontNeck, revisionId, "outerStand", "FRONT_FLAT", transformSet)).toBeUndefined();

    const shortStand = { ...block, roles: { ...block.roles, outerStand: { ...block.roles.outerStand!, edges:
      block.roles.outerStand!.edges.map((edge) => edge.name === "neckline" && edge.kind === "line"
        ? { ...edge, end: { ...edge.end, x: edge.end.x + 0.25 } } : edge) } } };
    expect(createWovenCollarProjector(shortStand, revisionId, "outerStand", "BACK_FLAT", transformSet)).toBeUndefined();

    const missingYokeAxis = { ...block, roles: { ...block.roles, yoke: { ...block.roles.yoke!,
      edges: block.roles.yoke!.edges.filter((edge) => edge.name !== "centerBack") } } };
    expect(createWovenCollarProjector(missingYokeAxis, revisionId, "outerStand", "BACK_FLAT", transformSet)).toBeUndefined();

    const malformedAxis = { ...block, roles: { ...block.roles, yoke: { ...block.roles.yoke!, edges: block.roles.yoke!.edges.map((edge) =>
      edge.name === "centerBack" ? { kind: "line" as const, name: edge.name,
        start: edgeStart(pieceEdge(block.roles.yoke!, "neckline")), end: edgeEnd(pieceEdge(block.roles.yoke!, "neckline")) } : edge) } } };
    expect(createWovenCollarProjector(malformedAxis, revisionId, "outerStand", "BACK_FLAT", transformSet)).toBeUndefined();

    const reversedYoke = { ...block, roles: { ...block.roles, yoke: { ...block.roles.yoke!, edges: block.roles.yoke!.edges.map((edge) =>
      edge.name === "neckline" && edge.kind === "curve" ? { ...edge, curve: { start: edge.curve.end,
        control1: edge.curve.control2, control2: edge.curve.control1, end: edge.curve.start } } : edge) } } };
    expect(createWovenCollarProjector(reversedYoke, revisionId, "outerStand", "BACK_FLAT", transformSet)).toBeDefined();

    const badDonor = { ...block, roles: { ...block.roles, innerStand: { ...block.roles.innerStand!, edges: block.roles.innerStand!.edges.map((edge) =>
      edge.name === "collar" && edge.kind === "line" ? { ...edge, start: { ...edge.start, y: edge.start.y + 0.01 } } : edge) } } };
    expect(createWovenCollarProjector(badDonor, revisionId, "upperCollar", "BACK_FLAT", transformSet)).toBeUndefined();

    const infiniteBase = { ...block, roles: { ...block.roles, upperCollar: { ...block.roles.upperCollar!, edges:
      block.roles.upperCollar!.edges.map((edge) => edge.name === "stand" && edge.kind === "line"
        ? { ...edge, end: { ...edge.end, x: Number.POSITIVE_INFINITY } } : edge) } } };
    expect(createWovenCollarProjector(infiniteBase, revisionId, "upperCollar", "BACK_FLAT", transformSet)).toBeUndefined();

    const cuspFront = { ...block.roles.front!, edges: block.roles.front!.edges.map((edge) =>
      edge.name === "neckline" && edge.kind === "curve" ? { ...edge, curve: {
        ...edge.curve, control1: edge.curve.start, control2: edge.curve.start,
      } } : edge) };
    const newFrontLength = edgeLength(cuspFront.edges.find((edge) => edge.name === "neckline")!);
    const backLength = edgeLength(pieceEdge(block.roles.yoke!, "neckline"));
    const outerStand = { ...block.roles.outerStand!, edges: block.roles.outerStand!.edges.map((edge) =>
      edge.name === "neckline" && edge.kind === "line"
        ? { ...edge, end: { x: edge.start.x + newFrontLength + backLength, y: edge.start.y } } : edge) };
    const receiverCusp = { ...block, roles: { ...block.roles, front: cuspFront, outerStand } };
    const frontAssembly = assembleTechnicalFlatRoles("woven-shirt", block, "FRONT_FLAT");
    const frontProjector = createWovenCollarProjector(receiverCusp, revisionId, "outerStand", "FRONT_FLAT", frontAssembly.transforms)!;
    const outerNeckline = pieceEdge(receiverCusp.roles.outerStand!, "neckline");
    if (outerNeckline.kind !== "line") throw new Error("The stand base must be a line.");
    expect(frontProjector.projectSourcePoint(edgeStart(outerNeckline))).toBeUndefined();
  });

  it("fails closed for malformed exterior edges and mapped primitive coordinates", () => {
    const assembly = assembleTechnicalFlatRoles("woven-shirt", block, "FRONT_FLAT");
    const exterior = block.roles.upperCollar!.edges.find((edge) => edge.name === "outer")!;
    const curvedExterior = { ...block, roles: { ...block.roles, upperCollar: { ...block.roles.upperCollar!, edges:
      block.roles.upperCollar!.edges.map((edge) => edge.name === "outer" ? { kind: "curve" as const, name: "outer",
        curve: { start: edgeStart(edge), control1: edgeStart(edge), control2: edgeEnd(edge), end: edgeEnd(edge) } } : edge) } } };
    const curvedProjector = createWovenCollarProjector(curvedExterior, revisionId, "upperCollar", "FRONT_FLAT", assembly.transforms)!;
    expect(curvedProjector.projectSourcePoint(edgeStart(exterior), "pattern:woven-shirt:role:upperCollar:edge:outer")).toBeUndefined();

    const zeroExterior = { ...block, roles: { ...block.roles, upperCollar: { ...block.roles.upperCollar!, edges:
      block.roles.upperCollar!.edges.map((edge) => edge.name === "outer" ? { kind: "line" as const, name: "outer",
        start: edgeStart(edge), end: edgeStart(edge) } : edge) } } };
    const zeroProjector = createWovenCollarProjector(zeroExterior, revisionId, "upperCollar", "FRONT_FLAT", assembly.transforms)!;
    expect(zeroProjector.projectSourcePoint(edgeStart(zeroExterior.roles.upperCollar!.edges.find((edge) => edge.name === "outer")!),
      "pattern:woven-shirt:role:upperCollar:edge:outer")).toBeUndefined();

    const transform = assembly.transforms.upperCollar!;
    const projector = createWovenCollarProjector(block, revisionId, "upperCollar", "FRONT_FLAT", assembly.transforms)!;
    const source = { sourceClass: "PATTERN_DERIVED" as const, sourceId: "pattern:woven-shirt:role:upperCollar", revisionId };
    const backStation = edgeStart(pieceEdge(block.roles.upperCollar!, "stand"));
    const placedBack = transformFlatPoint(backStation, { ...transform, mirrorX: transform.mirrorX ?? false });
    expect(projectWovenCollarPrimitive({ kind: "circle", id: "hidden-circle", layer: "ANNOTATION", feature: "annotation",
      source, center: placedBack, radius: 0.1 }, projector, transform)).toBeUndefined();
    expect(projectWovenCollarPrimitive({ kind: "artwork", id: "hidden-art", layer: "ARTWORK", feature: "artwork",
      source, artworkKind: "print", placementId: "hidden", sourceName: "hidden", targetRoleId: "upperCollar", widthCm: 1,
      heightCm: 1, transform: { dx: placedBack.x, dy: placedBack.y, scale: 1, rotationDegrees: 0 }, zOrder: 0 }, projector, transform))
      .toBeUndefined();
    expect(projectWovenCollarPrimitive({ kind: "path", id: "cubic-without-move", layer: "GARMENT_SILHOUETTE", feature: "silhouette",
      source, commands: [{ op: "cubic", control1: placedBack, control2: placedBack, point: placedBack }] }, projector, transform)).toBeUndefined();
    const visibleEnd = edgeEnd(pieceEdge(block.roles.upperCollar!, "stand"));
    const placedVisible = transformFlatPoint(visibleEnd, { ...transform, mirrorX: transform.mirrorX ?? false });
    expect(projectWovenCollarPrimitive({ kind: "path", id: "cross-face-cubic", layer: "GARMENT_SILHOUETTE", feature: "silhouette",
      source, commands: [{ op: "move", point: placedVisible }, { op: "cubic", control1: placedBack, control2: placedBack, point: placedBack }] }, projector, transform))
      .toBeUndefined();
    expect(projectWovenCollarPrimitive({ kind: "path", id: "cross-face-line", layer: "GARMENT_SILHOUETTE", feature: "silhouette",
      source, sourceEdgeIds: ["pattern:woven-shirt:role:upperCollar:edge:stand"],
      commands: [{ op: "move", point: placedVisible }, { op: "line", point: placedBack }] }, projector, transform))
      .toBeUndefined();
    expect(projectWovenCollarPrimitive({ kind: "path", id: "hidden-first-point", layer: "GARMENT_SILHOUETTE", feature: "silhouette",
      source, commands: [{ op: "move", point: placedBack }] }, projector, transform)).toBeUndefined();
  });

  it("fails closed for stale topology, reversed source joins, missing transforms and invalid revisions", () => {
    const assembly = assembleTechnicalFlatRoles("woven-shirt", block, "FRONT_FLAT");
    expect(createWovenCollarProjector(block, " ", "outerStand", "FRONT_FLAT", assembly.transforms)).toBeUndefined();
    const missing = { ...block, stitches: block.stitches.filter((stitch) => stitch.label !== "Under collar ↔ outer stand") };
    expect(createWovenCollarProjector(missing, revisionId, "underCollar", "FRONT_FLAT", assembly.transforms)).toBeUndefined();
    const reversed = { ...block, stitches: block.stitches.map((stitch) => stitch.label === "Outer stand ↔ woven neckline"
      ? { ...stitch, a: { ...stitch.a, edges: stitch.a.edges.map((edge) => "edge" in edge ? { ...edge, reversed: true } : edge) } }
      : stitch) };
    expect(createWovenCollarProjector(reversed, revisionId, "outerStand", "FRONT_FLAT", assembly.transforms)).toBeUndefined();
    expect(createWovenCollarProjector(block, revisionId, "upperCollar", "FRONT_FLAT", { front: assembly.transforms.front! })).toBeUndefined();
    const malformed = { ...block, roles: { ...block.roles,
      underCollar: { ...block.roles.underCollar!, edges: block.roles.underCollar!.edges.filter((edge) => edge.name !== "stand") } } };
    expect(createWovenCollarProjector(malformed, revisionId, "underCollar", "FRONT_FLAT", assembly.transforms)).toBeUndefined();
  });
});
