import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../drafting";
import { edgeEnd, edgeStart, pieceEdge } from "../drafting/piece";
import { appendApprovedViewPairReflection, appendOppositeSideReflection, appendPhysicalPairReflection, applyWovenFrontApprovedViewClips, compileTechnicalFlatLiveView, mapPoloCollarPointKeyedCallout, mapPoloSourceCenteredKeyedCallouts, mapPoloDimensionCallouts, mapWovenButtonSpacingKeyedCallout, mapWovenPlacketWidthKeyedCallout, placeTechnicalFlatPrimitive, projectPoloSleeveFillClosures, projectWovenSleeveFillClosures, reflectFoldPrimitive, reflectPhysicalPairPrimitive, reflectPrimitiveAcrossLine, technicalFlatAssemblyNotices, technicalFlatPrimitiveRole } from "./technical-flat-live";
import { assembleTechnicalFlatRoles } from "./technical-flat-assembly";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";
import { transformFlatPoint } from "./technical-flat-transform";
import type { FlatCalloutPrimitive, FlatPathPrimitive, TechnicalFlatPrimitive } from "./technical-flat";
import type { TechnicalFlatLiveIssue } from "./technical-flat-live";

describe("projectWovenSleeveFillClosures", () => {
  const point = (x: number, y = 0) => ({ x, y });
  const path = (id: string, commands: FlatPathPrimitive["commands"], colorwayBoundaryOnly = false): FlatPathPrimitive => ({
    kind: "path", id, layer: colorwayBoundaryOnly ? "GARMENT_SILHOUETTE" : "SEAM",
    feature: colorwayBoundaryOnly ? "silhouette" : "seam",
    source: { sourceClass: "PATTERN_DERIVED", sourceId: `source:${id}`, revisionId: "woven-r1" },
    commands, ...(colorwayBoundaryOnly ? { colorwayBoundaryOnly: true } : {}),
  });
  const seam = (start: number, end: number) => path("cap-seam:view-seam:woven-sleeve-cap:front", [
    { op: "move", point: point(start) }, { op: "line", point: point(end) },
  ]);
  const sleeve = (start: number, end: number) => path("flat:woven-shirt:FRONT_FLAT:component:sleeve:outline", [
    { op: "move", point: point(start) }, { op: "line", point: point(end) },
  ]);
  const closure = (commands: FlatPathPrimitive["commands"]) => path(
    "flat:woven-shirt:FRONT_FLAT:view-boundary:approved-woven-sleeve-area-closure", commands, true);

  it("closes a valid boundary to the other terminal of the same assembled body contour", () => {
    const boundary = closure([{ op: "move", point: point(5) }, { op: "line", point: point(99) }]);
    const primitives: TechnicalFlatPrimitive[] = [seam(0, 2), sleeve(0, 5), boundary];
    expect(projectWovenSleeveFillClosures(primitives)).toEqual([]);
    const commands = (primitives[2] as FlatPathPrimitive).commands;
    expect(commands[commands.length - 1]).toEqual({ op: "line", point: point(2) });
    expect(primitives.filter((primitive) => primitive.kind === "path" && primitive.colorwayBoundaryOnly)).toHaveLength(2);
  });

  it("holds a boundary with no same-instance hem endpoint or no usable body contour", () => {
    const noSleeve = [seam(0, 2), closure([{ op: "move", point: point(5) }, { op: "line", point: point(2) }])];
    expect(projectWovenSleeveFillClosures(noSleeve)).toContainEqual(expect.objectContaining({
      message: expect.stringContaining("no exact same-instance sleeve hem endpoint"),
    }));
    const noContour: TechnicalFlatPrimitive[] = [seam(0, Number.NaN),
      path("bad:view-seam:woven-sleeve-cap:empty", []),
      path("bad:view-seam:woven-sleeve-cap:closed", [{ op: "move", point: point(0) }, { op: "close" }]),
      sleeve(0, 5),
      closure([{ op: "move", point: point(5) }, { op: "line", point: point(2) }])];
    expect(projectWovenSleeveFillClosures(noContour)).toContainEqual(expect.objectContaining({
      message: expect.stringContaining("one unambiguous paired body contour"),
    }));
  });

  it("holds unpaired, distant, ambiguous and multiply claimed body components", () => {
    const makeClosure = () => closure([{ op: "move", point: point(5) }, { op: "line", point: point(2) }]);
    const distant: TechnicalFlatPrimitive[] = [seam(10, 12), sleeve(0, 5), makeClosure()];
    expect(projectWovenSleeveFillClosures(distant)).toContainEqual(expect.objectContaining({
      message: expect.stringContaining("one unambiguous paired body contour"),
    }));
    const ambiguous: TechnicalFlatPrimitive[] = [seam(-0.5, -1.5), seam(0.5, 1.5), sleeve(0, 5), makeClosure()];
    expect(projectWovenSleeveFillClosures(ambiguous)).toContainEqual(expect.objectContaining({
      message: expect.stringContaining("one unambiguous paired body contour"),
    }));
    const multiplyClaimed: TechnicalFlatPrimitive[] = [seam(0, 2), sleeve(0, 5), makeClosure(), makeClosure()];
    expect(projectWovenSleeveFillClosures(multiplyClaimed).length).toBeGreaterThan(0);
  });

  it("holds malformed boundary paths and reports missing one-to-one closure accounting", () => {
    const noStart: TechnicalFlatPrimitive[] = [seam(0, 2), sleeve(0, 5), closure([{ op: "line", point: point(5) }])];
    expect(projectWovenSleeveFillClosures(noStart).some((issue) => issue.message.includes("one-to-one"))).toBe(true);
    const closed: TechnicalFlatPrimitive[] = [seam(0, 2), sleeve(0, 5),
      closure([{ op: "move", point: point(5) }, { op: "close" }])];
    expect(projectWovenSleeveFillClosures(closed)).toContainEqual(expect.objectContaining({
      message: expect.stringContaining("must end at one exact line station"),
    }));
  });
});

describe("mapWovenPlacketWidthKeyedCallout", () => {
  const callout: FlatCalloutPrimitive = { kind: "callout", id: "woven-placket-width", layer: "CALLOUT", feature: "pom",
    source: { sourceClass: "PATTERN_DERIVED", sourceId: "pom:woven-shirt:finished-placket-width", revisionId: "woven-r1" },
    text: "Finished placket width: 3.0 cm (±0.2 cm)",
    anchor: { primitiveId: "flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline", point: { x: 3, y: 4 },
      sourceEntityId: "pattern:woven-shirt:role:buttonPlacket:edge:top" }, labelAt: { x: 8, y: 5 } };

  it("maps only the exact same-revision front POM and retains the source schedule text", () => {
    expect(mapWovenPlacketWidthKeyedCallout("BACK_FLAT", "woven-r1", [callout], true))
      .toEqual({ callouts: [callout], issues: [] });
    const absent = mapWovenPlacketWidthKeyedCallout("FRONT_FLAT", "woven-r1", [], false);
    expect(absent).toEqual({ callouts: [], issues: [] });
    expect(mapWovenPlacketWidthKeyedCallout("FRONT_FLAT", "woven-r1", [], true).issues).toHaveLength(1);
    const other = { ...callout, id: "other", source: { ...callout.source, sourceId: "pom:woven-shirt:other" } };
    const result = mapWovenPlacketWidthKeyedCallout("FRONT_FLAT", "woven-r1", [other, callout], true);
    expect(result.issues).toEqual([]);
    expect(result.callouts[0]).toEqual(other);
    expect(result.callouts[1]).toMatchObject({ ...callout, layer: "ANNOTATION",
      presentation: { kind: "keyed-marker-schedule", key: "W", markerRadiusCm: 0.22, markerStyle: "open-halo" } });
    expect(result.callouts[1]?.text).toBe(callout.text);
  });

  it("fails closed for duplicate or stale/mis-targeted Woven POM identity", () => {
    expect(mapWovenPlacketWidthKeyedCallout("FRONT_FLAT", "woven-r1", [callout, callout], true).issues).toHaveLength(1);
    for (const invalid of [
      { ...callout, source: { ...callout.source, revisionId: "stale" } },
      { ...callout, anchor: { ...callout.anchor, primitiveId: "wrong-target" } },
      { ...callout, anchor: { ...callout.anchor, sourceEntityId: "wrong-edge" } },
    ]) expect(mapWovenPlacketWidthKeyedCallout("FRONT_FLAT", "woven-r1", [invalid], true).issues).toHaveLength(1);
  });
});

describe("approved Woven front view conventions", () => {
  const revisionId = "woven-r1";
  const mark = (name: "button-1" | "button-2", x: number, y: number): TechnicalFlatPrimitive => ({
    kind: "mark", id: `flat:woven-shirt:FRONT_FLAT:mark:buttonPlacket:${name}`, layer: "CONSTRUCTION",
    feature: "closure", markKind: "button", markName: name,
    source: { sourceClass: "PATTERN_DERIVED", sourceId: `pattern:woven-shirt:mark:buttonPlacket:${name}`, revisionId }, at: { x, y },
  });

  it("keys only the unchanged source interval POM and records both marks at their derived midpoint", () => {
    const callout: FlatCalloutPrimitive = { kind: "callout", id: "spacing", layer: "CALLOUT", feature: "pom",
      source: { sourceClass: "PATTERN_DERIVED", sourceId: "pom:woven-shirt:front-button-spacing", revisionId },
      text: "Front button spacing: 8 cm (±0.2 cm)",
      anchor: { primitiveId: "flat:woven-shirt:FRONT_FLAT:mark:buttonPlacket:button-1", point: { x: 1.5, y: 13.2 },
        sourceEntityId: "pattern:woven-shirt:mark:buttonPlacket:button-1" }, labelAt: { x: 4, y: 8 } };
    const result = mapWovenButtonSpacingKeyedCallout("FRONT_FLAT", revisionId, [callout], [mark("button-1", 1.5, 13.2), mark("button-2", 1.5, 21.2)]);
    expect(result.issues).toEqual([]);
    expect(result.callouts[0]).toMatchObject({ ...callout, layer: "ANNOTATION", text: callout.text,
      presentation: { kind: "keyed-marker-schedule", key: "D", markerRadiusCm: 0.22, markerStyle: "open-halo",
        markerPoint: { point: { x: 1.5, y: 17.2 }, sourceEntityIds: [
          "pattern:woven-shirt:mark:buttonPlacket:button-1", "pattern:woven-shirt:mark:buttonPlacket:button-2",
        ] } } });
    expect(mapWovenButtonSpacingKeyedCallout("FRONT_FLAT", revisionId, [callout], [mark("button-1", 1.5, 13.2)]).issues).toHaveLength(1);
    expect(mapWovenButtonSpacingKeyedCallout("BACK_FLAT", revisionId, [], []).issues).toEqual([]);
  });

  it("clips only approved exact subpaths and retains the callout target identity", () => {
    const path = (id: string, role: string, edgeIds: string[]): FlatPathPrimitive => ({ kind: "path", id,
      layer: "GARMENT_SILHOUETTE", feature: "silhouette",
      source: { sourceClass: "PATTERN_DERIVED", sourceId: `pattern:woven-shirt:role:${role}`, revisionId },
      sourceEdgeIds: edgeIds, commands: edgeIds.flatMap((_, index) => [
        { op: "move" as const, point: { x: index, y: 0 } }, { op: "line" as const, point: { x: index + 1, y: 0 } },
      ]) });
    const frontEdge = "pattern:woven-shirt:role:front:edge:shoulder";
    const buttonTop = "pattern:woven-shirt:role:buttonPlacket:edge:top";
    const buttonOuter = "pattern:woven-shirt:role:buttonPlacket:edge:outerRaw";
    const buttonholeTop = "pattern:woven-shirt:role:buttonholePlacket:edge:top";
    const buttonholeOuter = "pattern:woven-shirt:role:buttonholePlacket:edge:outerRaw";
    const button = path("button", "buttonPlacket", [buttonTop, buttonOuter, "pattern:woven-shirt:role:buttonPlacket:edge:bottom"]);
    const buttonhole = path("buttonhole", "buttonholePlacket", [buttonholeTop, buttonholeOuter]);
    const shoulderA = path("shoulder-a", "front", [frontEdge]);
    const shoulderB = path("shoulder-b", "front", [frontEdge]);
    const callout: FlatCalloutPrimitive = { kind: "callout", id: "pom", layer: "CALLOUT", feature: "pom",
      source: { sourceClass: "PATTERN_DERIVED", sourceId: "pom:woven-shirt:finished-placket-width", revisionId }, text: "width",
      anchor: { primitiveId: "button", point: { x: 0, y: 0 }, sourceEntityId: buttonTop }, labelAt: { x: 2, y: 2 } };
    const unmapped = { ...shoulderA, id: "unmapped-path", sourceEdgeIds: undefined };
    const result = applyWovenFrontApprovedViewClips([button, buttonhole, shoulderA, shoulderB, unmapped, callout], revisionId);
    expect(result.issues).toEqual([]);
    const clipped = result.primitives.filter((primitive): primitive is FlatPathPrimitive => primitive.kind === "path" && primitive.viewClip !== undefined);
    expect(clipped).toHaveLength(6);
    expect(clipped.find((primitive) => primitive.viewClip?.decisionId === "G04-S404-WOVEN-SHOULDER-COLLAR-OCCLUSION")?.viewClip?.roleIds)
      .toEqual(["outerStand"]);
    expect(result.primitives.find((primitive) => primitive.id === "button")?.kind).toBe("path");
    const missingInput = [button, buttonhole, shoulderA];
    const missing = applyWovenFrontApprovedViewClips(missingInput, revisionId);
    expect(missing.issues.length).toBeGreaterThan(0);
    expect(missing.primitives).toBe(missingInput);
  });
});

describe("projectPoloSleeveFillClosures", () => {
  const revisionId = "polo-s353-r1";
  const path = (id: string, sourceId: string, start: { x: number; y: number }, end: { x: number; y: number }, colorwayBoundaryOnly = false) => ({
    kind: "path" as const, id, layer: colorwayBoundaryOnly ? "GARMENT_SILHOUETTE" as const : "SEAM" as const,
    feature: colorwayBoundaryOnly ? "silhouette" as const : "seam" as const, colorwayBoundaryOnly,
    source: { sourceClass: "PATTERN_DERIVED" as const, sourceId, revisionId },
    commands: [{ op: "move" as const, point: start }, { op: "line" as const, point: end }],
  });
  const create = () => [
    path("flat:polo:FRONT_FLAT:component:sleeve:outline", "pattern:polo:role:sleeve", { x: 0, y: 0 }, { x: 4, y: 0 }),
    path("flat:polo:BACK_FLAT:component:sleeve:outline:fold-reflection", "pattern:polo:role:sleeve", { x: 10, y: 0 }, { x: 14, y: 0 }),
    path("flat:polo:FRONT_FLAT:view-seam:polo-sleeve-cap:front:armhole", "pattern:polo:role:front:edge:armhole", { x: 4.5, y: 2 }, { x: 0, y: -2 }),
    path("flat:polo:BACK_FLAT:view-seam:polo-sleeve-cap:back:armhole", "pattern:polo:role:back:edge:armhole", { x: 14.5, y: 2 }, { x: 10, y: -2 }),
    path("flat:polo:FRONT_FLAT:component:sleeve:view-boundary:approved-sleeve-area-closure",
      "view:polo:role:sleeve:decision:G04-S351-POLO-CAP-ARMHOLE-ARCLENGTH:boundary", { x: 4, y: 0 }, { x: 4.4, y: 1.8 }, true),
    path("flat:polo:BACK_FLAT:component:sleeve:view-boundary:approved-sleeve-area-closure:fold-reflection",
      "view:polo:role:sleeve:decision:G04-S351-POLO-CAP-ARMHOLE-ARCLENGTH:boundary", { x: 14, y: 0 }, { x: 14.4, y: 1.8 }, true),
  ];

  it("moves both reflected sleeve closures to the exact receiving shoulder endpoints", () => {
    const primitives = create();
    expect(projectPoloSleeveFillClosures(primitives, revisionId)).toEqual([]);
    const closures = primitives.filter((primitive) => primitive.kind === "path" && primitive.colorwayBoundaryOnly);
    expect(closures.map((closure) => closure.commands[closure.commands.length - 1])).toEqual([
      { op: "line", point: { x: 4.5, y: 2 } }, { op: "line", point: { x: 14.5, y: 2 } },
    ]);
  });

  it("fails closed for stale revisions, missing contours, ambiguous shoulders, and malformed closures", () => {
    const stale = create();
    stale[4] = { ...stale[4]!, source: { ...stale[4]!.source, revisionId: "stale" } } as typeof stale[number];
    expect(projectPoloSleeveFillClosures(stale, revisionId).length).toBeGreaterThan(0);

    const missing = create().filter((primitive) => !primitive.id.includes("view-seam:polo-sleeve-cap"));
    expect(projectPoloSleeveFillClosures(missing, revisionId).some((issue) => issue.message.includes("unique receiving"))).toBe(true);

    const ambiguous = create();
    ambiguous.push(path("flat:polo:BACK_FLAT:view-seam:polo-sleeve-cap:duplicate", "pattern:polo:role:back:edge:armhole",
      { x: 4.5, y: 2 }, { x: 0, y: -2 }));
    expect(projectPoloSleeveFillClosures(ambiguous, revisionId).some((issue) => issue.message.includes("unique receiving"))).toBe(true);

    const malformed = create();
    malformed[4] = { ...malformed[4]!, commands: [{ op: "move", point: { x: 4, y: 0 } }, { op: "close" }] } as typeof malformed[number];
    expect(projectPoloSleeveFillClosures(malformed, revisionId).some((issue) => issue.message.includes("hem and shoulder"))).toBe(true);

    const closedSeam = create();
    closedSeam[2] = { ...closedSeam[2]!, commands: [{ op: "move", point: { x: 4.5, y: 2 } }, { op: "close" }] } as typeof closedSeam[number];
    expect(projectPoloSleeveFillClosures(closedSeam, revisionId).some((issue) => issue.message.includes("unique receiving"))).toBe(true);

    const staleSeam = create();
    staleSeam[2] = { ...staleSeam[2]!, source: { ...staleSeam[2]!.source, revisionId: "stale" } } as typeof staleSeam[number];
    expect(projectPoloSleeveFillClosures(staleSeam, revisionId).some((issue) => issue.message.includes("unique receiving"))).toBe(true);
  });
});

describe("compileTechnicalFlatLiveView", () => {
  it("fails closed when the approved detached-detail center axis is absent", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const authored = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const back = authored.roles.back!;
    const block = { ...authored, roles: { ...authored.roles, back: { ...back,
      edges: back.edges.filter((edge) => edge.name !== "centerBack") } } };
    const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: "woven-band-invalid-axis",
      kind: "BACK_FLAT", placements: [], colorHex: "#456789", texture: "woven", shine: 0 });
    expect(result.view).toBeNull();
    expect(result.issues).toContainEqual(expect.objectContaining({ stage: "transform",
      sourceId: "pattern:woven-shirt:role:sleeveBand", message: expect.stringContaining("vertical back.centerBack axis") }));
  });

  it("withholds detached band details when source edge geometry is invalid", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const authored = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const band = authored.roles.sleeveBand!;
    const block = { ...authored, roles: { ...authored.roles, sleeveBand: { ...band,
      edges: band.edges.map((edge) => edge.name === "top" && edge.kind === "line"
        ? { ...edge, start: { ...edge.start, x: Number.NaN } } : edge),
    } } };
    const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: "woven-band-invalid-edge",
      kind: "BACK_FLAT", placements: [], colorHex: "#456789", texture: "woven", shine: 0 });
    expect(result.view).toBeNull();
    expect(result.issues).toContainEqual(expect.objectContaining({ stage: "transform",
      sourceId: "pattern:woven-shirt:role:sleeveBand", message: expect.stringContaining("same-revision outline") }));
  });

  it("shows exact same-revision Woven band details twice on BACK_FLAT and suppresses the assembled band", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const revisionId = "live-draft:woven-shirt:14:14";
    const result = compileTechnicalFlatLiveView({ recipe, block, revisionId, kind: "BACK_FLAT",
      placements: [], colorHex: "#456789", texture: "woven", shine: 0 });
    expect(result.issues).toEqual([]);
    const details = result.view!.primitives.filter((primitive) => primitive.id.includes(":detached-detail:"));
    expect(details).toHaveLength(4);
    expect(details.map((primitive) => primitive.id)).toEqual(expect.arrayContaining([
      expect.stringContaining(":detached-detail:left"), expect.stringContaining(":detached-detail:right"),
    ]));
    expect(details.every((primitive) => primitive.source.revisionId === revisionId)).toBe(true);
    expect(details.filter((primitive) => primitive.kind === "path" && primitive.patternMark?.name === "bandFold")).toHaveLength(2);
    const outlines = details.filter((primitive) => primitive.kind === "path" && primitive.sourceEdgeIds?.length === 4);
    expect(outlines).toHaveLength(2);
    expect(outlines.every((primitive) => primitive.kind === "path" && primitive.sourceEdgeIds?.every((sourceId) =>
      sourceId.startsWith("pattern:woven-shirt:role:sleeveBand:edge:")))).toBe(true);
    expect(result.view!.primitives.filter((primitive) => primitive.source.sourceId === "pattern:woven-shirt:role:sleeveBand"
      && !primitive.id.includes(":detached-detail:") && primitive.kind === "path" && primitive.sourceEdgeIds?.length === 4)).toHaveLength(0);
    expect(result.view!.primitives.find((primitive) => primitive.id.endsWith(":source-stitch"))).toMatchObject({
      kind: "text", text: expect.stringContaining("source stitch: sleeveBand.top ↔ full sleeve.hem; BACK receiver interval [0,0.5]"),
      source: { revisionId },
    });
  });

  it("projects Woven collar POM mark and edge anchors onto the same displayed revision", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const markPomRecipe = { ...recipe, poms: [{ label: "Stand button source point", measure: () => 1,
      frontMarkAnchor: { roleId: "outerStand", markName: "stand-button", point: "at" as const } }] };
    const markResult = compileTechnicalFlatLiveView({ recipe: markPomRecipe, block, revisionId: "woven-pom-projection-1",
      kind: "FRONT_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(markResult.issues.filter((issue) => issue.stage === "pom")).toEqual([]);
    const markCallout = markResult.view?.primitives.find((primitive): primitive is FlatCalloutPrimitive =>
      primitive.kind === "callout");
    expect(markCallout?.anchor).toMatchObject({
      primitiveId: "flat:woven-shirt:FRONT_FLAT:mark:outerStand:stand-button",
      sourceEntityId: "pattern:woven-shirt:mark:outerStand:stand-button",
    });

    const edgePomRecipe = { ...recipe, poms: [{ label: "Stand base source point", measure: () => 1,
      anchor: (draft: typeof block) => edgeEnd(pieceEdge(draft.roles.outerStand!, "collar")),
      anchorRoleId: "outerStand", anchorEdgeId: "collar" }] };
    const edgeResult = compileTechnicalFlatLiveView({ recipe: edgePomRecipe, block, revisionId: "woven-pom-projection-1",
      kind: "FRONT_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    const edgeCallout = edgeResult.view?.primitives.find((primitive): primitive is FlatCalloutPrimitive => primitive.kind === "callout");
    expect(edgeCallout?.anchor.sourceEntityId).toBe("pattern:woven-shirt:role:outerStand:edge:collar");

    const hiddenEdgePomRecipe = { ...edgePomRecipe, poms: [{ ...edgePomRecipe.poms[0]!,
      anchor: (draft: typeof block) => edgeStart(pieceEdge(draft.roles.outerStand!, "collar")) }] };
    const hiddenResult = compileTechnicalFlatLiveView({ recipe: hiddenEdgePomRecipe, block, revisionId: "woven-pom-projection-1",
      kind: "FRONT_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(hiddenResult.issues).toContainEqual(expect.objectContaining({ stage: "pom",
      sourceId: "flat:woven-shirt:FRONT_FLAT:component:outerStand:outline",
      message: expect.stringContaining("exact mapped same-revision source entity") }));
  });

  it("fails closed when a source mark falls outside its approved Woven collar face map", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const authored = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const stand = authored.roles.outerStand!;
    const malformed = { ...authored, roles: { ...authored.roles, outerStand: { ...stand,
      marks: stand.marks!.map((mark) => mark.name === "stand-button" && "at" in mark
        ? { ...mark, at: { x: 0.1, y: mark.at.y } } : mark) } } };
    const result = compileTechnicalFlatLiveView({ recipe, block: malformed, revisionId: "woven-outside-mark-1",
      kind: "FRONT_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(result.view).toBeNull();
    expect(result.issues).toContainEqual(expect.objectContaining({ stage: "transform",
      sourceId: "pattern:woven-shirt:mark:outerStand:stand-button", message: expect.stringContaining("cannot map") }));
    const markedPomRecipe = { ...recipe, poms: [{ label: "Fold-side stand button", measure: () => 1,
      frontMarkAnchor: { roleId: "outerStand", markName: "stand-button", point: "at" as const } }] };
    const pomResult = compileTechnicalFlatLiveView({ recipe: markedPomRecipe, block: malformed, revisionId: "woven-outside-mark-pom-1",
      kind: "FRONT_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(pomResult.issues).toContainEqual(expect.objectContaining({ stage: "pom",
      sourceId: "pattern:woven-shirt:mark:outerStand:stand-button",
      message: expect.stringContaining("exact emitted mark entity") }));
  });

  it("binds Woven front and back POM anchors to their transformed source geometry", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const revisionId = "woven-live-pom-1";
    const front = compileTechnicalFlatLiveView({ recipe, block, revisionId, kind: "FRONT_FLAT",
      placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(front.issues.filter((issue) => issue.stage === "pom")).toEqual([]);
    const frontCalls = front.view!.primitives.filter((primitive): primitive is FlatCalloutPrimitive => primitive.kind === "callout");
    const chest = frontCalls.find((callout) => callout.source.sourceId === "pom:woven-shirt:body-chest-finished")!;
    const frontAssembly = assembleTechnicalFlatRoles("woven-shirt", block, "FRONT_FLAT");
    const chestPoint = recipe.poms!.find((pom) => pom.label === "Body chest (finished)")!.anchor!(block);
    expect(chest.anchor).toMatchObject({
      primitiveId: "flat:woven-shirt:FRONT_FLAT:component:front:outline",
      sourceEntityId: "pattern:woven-shirt:role:front:edge:sideUpper",
      point: transformFlatPoint(chestPoint, { ...frontAssembly.transforms.front!, mirrorX: frontAssembly.transforms.front!.mirrorX ?? false }),
    });
    const spacing = frontCalls.find((callout) => callout.source.sourceId === "pom:woven-shirt:front-button-spacing")!;
    const button = block.roles.buttonPlacket!.marks!.find((mark) => mark.name === "button-1")!;
    const buttonTransform = frontAssembly.transforms.buttonPlacket!;
    if (!("at" in button)) throw new Error("Woven button POM requires its source point mark.");
    expect(spacing.anchor).toMatchObject({
      primitiveId: "flat:woven-shirt:FRONT_FLAT:mark:buttonPlacket:button-1",
      sourceEntityId: "pattern:woven-shirt:mark:buttonPlacket:button-1",
      point: transformFlatPoint(button.at, { ...buttonTransform, mirrorX: buttonTransform.mirrorX ?? false }),
    });

    const back = compileTechnicalFlatLiveView({ recipe, block, revisionId, kind: "BACK_FLAT",
      placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(back.issues.filter((issue) => issue.stage === "pom")).toEqual([]);
    const yokeDepth = back.view!.primitives.find((primitive): primitive is FlatCalloutPrimitive => primitive.kind === "callout"
      && primitive.source.sourceId === "pom:woven-shirt:back-yoke-depth")!;
    const backAssembly = assembleTechnicalFlatRoles("woven-shirt", block, "BACK_FLAT");
    const yokePoint = edgeStart(pieceEdge(block.roles.back, "yokeSeam"));
    expect(yokeDepth.anchor).toMatchObject({
      primitiveId: "flat:woven-shirt:BACK_FLAT:component:back:outline",
      sourceEntityId: "pattern:woven-shirt:role:back:edge:yokeSeam",
      point: transformFlatPoint(yokePoint, { ...backAssembly.transforms.back!, mirrorX: backAssembly.transforms.back!.mirrorX ?? false }),
    });
    expect(frontCalls.every((callout) => callout.source.revisionId === revisionId)).toBe(true);
    expect(yokeDepth.source.revisionId).toBe(revisionId);

    const chestPom = recipe.poms!.find((pom) => pom.label === "Body chest (finished)")!;
    const fallbackRecipe = { ...recipe, poms: [{ ...chestPom, anchorRoleId: undefined }] };
    const fallback = compileTechnicalFlatLiveView({ recipe: fallbackRecipe, block, revisionId,
      kind: "FRONT_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(fallback.issues.filter((issue) => issue.stage === "pom")).toEqual([]);
    expect(fallback.view!.primitives.find((primitive) => primitive.kind === "callout")?.anchor.sourceEntityId)
      .toBe("pattern:woven-shirt:role:front:edge:sideUpper");

    const yokePom = recipe.poms!.find((pom) => pom.label === "Back yoke depth")!;
    const backFallbackRecipe = { ...recipe, poms: [{ ...yokePom, backAnchorRoleId: undefined }] };
    const backFallback = compileTechnicalFlatLiveView({ recipe: backFallbackRecipe, block, revisionId,
      kind: "BACK_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(backFallback.issues.filter((issue) => issue.stage === "pom")).toContainEqual(expect.objectContaining({
      sourceId: "pom:woven-shirt:back-yoke-depth", message: expect.stringContaining("no mapped source role"),
    }));

    const pointOnlyRecipe = { ...recipe, poms: [{ label: "Point anchor fixture", measure: () => 1,
      anchor: (source: typeof block) => edgeStart(pieceEdge(source.roles.front, "shoulder")), anchorRoleId: "front" }] };
    const pointOnly = compileTechnicalFlatLiveView({ recipe: pointOnlyRecipe, block, revisionId,
      kind: "FRONT_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(pointOnly.issues.filter((issue) => issue.stage === "pom")).toEqual([]);
    expect(pointOnly.view!.primitives.find((primitive) => primitive.kind === "callout")?.anchor.sourceEntityId).toBeUndefined();

    const markRecipe = { ...recipe, poms: [{ label: "Back mark fixture", measure: () => 1,
      backAnchorRoleId: "back", backMarkAnchor: { roleId: "back", markName: "ventTop" } }] };
    const backMark = compileTechnicalFlatLiveView({ recipe: markRecipe, block, revisionId,
      kind: "BACK_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(backMark.issues.filter((issue) => issue.stage === "pom")).toEqual([]);
    expect(backMark.view!.primitives.find((primitive) => primitive.kind === "callout")?.anchor).toMatchObject({
      primitiveId: "flat:woven-shirt:BACK_FLAT:mark:back:ventTop",
      sourceEntityId: "pattern:woven-shirt:mark:back:ventTop",
    });
  });

  it("maps the approved Polo dimensions to exact transformed sources across all 17 configurations", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const optionSets = [defaultGarmentOptions(recipe.options ?? []), ...(recipe.options ?? []).flatMap((option) => [
      { ...defaultGarmentOptions(recipe.options ?? []), [option.id]: option.min },
      { ...defaultGarmentOptions(recipe.options ?? []), [option.id]: option.max },
    ])];
    for (const options of optionSets) {
      const block = recipe.draft(STANDARD_M, options);
      for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
        const assembly = assembleTechnicalFlatRoles("polo", block, kind);
        const callouts = (recipe.poms ?? []).filter((pom) => pom.viewDimension?.view === kind).map((pom) => ({
          kind: "callout" as const, id: `flat:polo:${kind}:callout:${pom.label}`,
          layer: "CALLOUT" as const, feature: "pom" as const,
          source: { sourceClass: "PATTERN_DERIVED" as const,
            sourceId: `pom:polo:${pom.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
            revisionId: `polo-dimension:${JSON.stringify(options)}` }, text: `${pom.label}: ${pom.measure(block)} cm`,
          anchor: { primitiveId: "outline", point: { x: 0, y: 0 } }, labelAt: { x: 2, y: 2 },
        }));
        const mapped = mapPoloDimensionCallouts(block, kind, recipe.poms ?? [], callouts, assembly.transforms);
        expect(mapped.issues, kind).toEqual([]);
        if (kind === "FRONT_FLAT") {
          expect(mapped.callouts).toHaveLength(1);
          const collar = mapped.callouts[0]!;
          const edge = block.roles.upperCollar!.edges.find((candidate) => candidate.name === "centerBack")!;
          const transform = assembly.transforms.upperCollar!;
          expect(collar).toMatchObject({ layer: "ANNOTATION", dimensionReferences: {
            kind: "edge-length", references: [
              { sourceEntityId: "pattern:polo:role:upperCollar:edge:centerBack" },
              { sourceEntityId: "pattern:polo:role:upperCollar:edge:centerBack" },
            ],
          } });
          expect(collar.dimensionReferences?.references.map((reference) => reference.point)).toEqual([
            transformFlatPoint(edgeStart(edge), { ...transform, mirrorX: transform.mirrorX ?? false }),
            transformFlatPoint(edgeEnd(edge), { ...transform, mirrorX: transform.mirrorX ?? false }),
          ]);
        } else {
          expect(mapped.callouts).toHaveLength(1);
          const drop = mapped.callouts[0]!;
          const frontHem = block.roles.front!.edges.find((candidate) => candidate.name === "hem")!;
          const backHem = block.roles.back!.edges.find((candidate) => candidate.name === "hem")!;
          const refs = drop.dimensionReferences!.references;
          expect(drop).toMatchObject({ layer: "ANNOTATION", dimensionReferences: { kind: "vertical-levels" } });
          expect(refs.map((reference) => reference.sourceEntityId)).toEqual([
            "pattern:polo:role:front:edge:hem", "pattern:polo:role:back:edge:hem",
          ]);
          expect(Math.abs(refs[0]!.point.y - refs[1]!.point.y)).toBeCloseTo(recipe.poms!.find((pom) => pom.label === "Back hem drop")!.measure(block), 6);
          expect(refs[0]!.point.x).toBeCloseTo(refs[1]!.point.x, 8);
          expect(refs[0]!.point.x).toBeGreaterThan(transformFlatPoint(edgeStart(backHem), {
            ...assembly.transforms.back!, mirrorX: assembly.transforms.back!.mirrorX ?? false,
          }).x);
          expect(frontHem).toBeDefined();
        }
      }
    }
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const poms = recipe.poms ?? [];
    const calls = [{ kind: "callout" as const, id: "missing", layer: "CALLOUT" as const, feature: "pom" as const,
      source: { sourceClass: "PATTERN_DERIVED" as const, sourceId: "pom:polo:finished-pointed-collar-leaf", revisionId: "r1" },
      text: "leaf", anchor: { primitiveId: "outline", point: { x: 0, y: 0 } }, labelAt: { x: 1, y: 1 } }];
    expect(mapPoloDimensionCallouts(block, "FRONT_FLAT", poms, calls, {}).issues).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("no same-revision source edge or face transform") }));
    const hem = [{ ...calls[0]!, source: { ...calls[0]!.source, sourceId: "pom:polo:back-hem-drop" } }];
    expect(mapPoloDimensionCallouts(block, "BACK_FLAT", poms, hem, {}).issues).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("no same-revision source edges or back-face transform") }));
    expect(mapPoloDimensionCallouts(block, "BACK_FLAT", poms, calls, {}).callouts).toEqual(calls);
    const edge = block.roles.upperCollar!.edges.find((candidate) => candidate.name === "centerBack")!;
    const assembled = assembleTechnicalFlatRoles("polo", block, "FRONT_FLAT");
    const rolePlacement = assembled.transforms.upperCollar!;
    const noMirrorFlag = { ...assembled.transforms, upperCollar: { offset: rolePlacement.offset,
      rotationDegrees: rolePlacement.rotationDegrees } };
    const collarCallout = [{ ...calls[0]!, source: { ...calls[0]!.source,
      sourceId: "pom:polo:finished-pointed-collar-leaf" } }];
    const fallbackTransform = mapPoloDimensionCallouts(block, "FRONT_FLAT", poms, collarCallout, noMirrorFlag);
    expect(fallbackTransform.issues).toEqual([]);
    expect(fallbackTransform.callouts[0]?.dimensionReferences?.references.map((reference) => reference.point)).toEqual([
      transformFlatPoint(edgeStart(edge), { offset: rolePlacement.offset, rotationDegrees: rolePlacement.rotationDegrees, mirrorX: false }),
      transformFlatPoint(edgeEnd(edge), { offset: rolePlacement.offset, rotationDegrees: rolePlacement.rotationDegrees, mirrorX: false }),
    ]);
    const backAssembly = assembleTechnicalFlatRoles("polo", block, "BACK_FLAT");
    const backPlacement = backAssembly.transforms.back!;
    const noBackMirrorFlag = { ...backAssembly.transforms, back: { offset: backPlacement.offset,
      rotationDegrees: backPlacement.rotationDegrees } };
    const fallbackLevels = mapPoloDimensionCallouts(block, "BACK_FLAT", poms, hem, noBackMirrorFlag);
    expect(fallbackLevels.issues).toEqual([]);
    expect(fallbackLevels.callouts[0]?.dimensionReferences?.references.map((reference) => reference.point["y"]))
      .toEqual([70, 71.5]);
  });

  it("keys only the exact same-revision Polo front collar-point POM", () => {
    const callout: FlatCalloutPrimitive = { kind: "callout", id: "pom-collar", layer: "ANNOTATION", feature: "pom",
      source: { sourceClass: "PATTERN_DERIVED", sourceId: "pom:polo:collar-point-extension", revisionId: "polo-r1" },
      text: "Collar point extension: 6.2 cm (±0.2 cm)",
      anchor: { primitiveId: "flat:polo:FRONT_FLAT:component:upperCollar:outline", point: { x: 8, y: 4 },
        sourceEntityId: "pattern:polo:role:upperCollar:edge:frontTip" }, labelAt: { x: 9, y: 5 } };
    const other: FlatCalloutPrimitive = { ...callout, id: "other", source: { ...callout.source, sourceId: "pom:polo:other" } };
    expect(mapPoloCollarPointKeyedCallout("BACK_FLAT", "polo-r1", [callout]).callouts).toEqual([callout]);
    expect(mapPoloCollarPointKeyedCallout("FRONT_FLAT", "polo-r1", [other]).callouts).toEqual([other]);
    const mapped = mapPoloCollarPointKeyedCallout("FRONT_FLAT", "polo-r1", [other, callout]);
    expect(mapped.issues).toEqual([]);
    expect(mapped.callouts[0]).toEqual(other);
    expect(mapped.callouts[1]).toMatchObject({ ...callout,
      presentation: { kind: "keyed-marker-schedule", key: "C", markerRadiusCm: 0.22 } });
    expect(mapped.callouts[1]?.text).toBe(callout.text);
    for (const invalid of [
      { ...callout, source: { ...callout.source, revisionId: "stale" } },
      { ...callout, anchor: { ...callout.anchor, primitiveId: "wrong-target" } },
      { ...callout, anchor: { ...callout.anchor, sourceEntityId: "wrong-source" } },
    ]) {
      expect(mapPoloCollarPointKeyedCallout("FRONT_FLAT", "polo-r1", [invalid]).issues).toHaveLength(1);
    }
    expect(mapPoloCollarPointKeyedCallout("FRONT_FLAT", "polo-r1", [callout, callout]).issues).toHaveLength(1);
  });

  it("maps the ten approved Polo source POMs to exact source-centered keys and preserves distinct schedule rows", () => {
    const identities = [
      ["across-shoulder", "A", "front:outline", "pattern:polo:role:front:edge:shoulder"],
      ["body-chest-finished", "B", "front:outline", "pattern:polo:role:front:edge:side"],
      ["sleeve-bicep-width", "B", "sleeve:outline", "pattern:polo:role:sleeve:edge:sideLeft"],
      ["button-spacing", "D", "buttonPlacket:button-1", "pattern:polo:mark:buttonPlacket:button-1"],
      ["finished-placket-length", "E", "buttonPlacket:outline", "pattern:polo:role:buttonPlacket:edge:attachmentRaw"],
      ["finished-placket-width", "FG", "buttonPlacket:attachmentLine", "pattern:polo:mark:buttonPlacket:attachmentLine"],
      ["front-neck-drop", "FG", "front:outline", "pattern:polo:role:front:edge:neckline"],
      ["neck-width", "H", "front:outline", "pattern:polo:role:front:edge:shoulder"],
      ["shoulder-seam", "H", "front:outline", "pattern:polo:role:front:edge:shoulder"],
      ["finished-pointed-collar-leaf", "I", "upperCollar:outline", "pattern:polo:role:upperCollar:edge:centerBack"],
    ] as const;
    const callouts: FlatCalloutPrimitive[] = identities.map(([pom, , target, entity]) => ({
      kind: "callout", id: `pom-${pom}`, layer: "CALLOUT", feature: "pom",
      source: { sourceClass: "PATTERN_DERIVED", sourceId: `pom:polo:${pom}`, revisionId: "polo-r1" },
      text: `${pom}: 10.0 cm (±0.2 cm)`,
      anchor: { primitiveId: `flat:polo:FRONT_FLAT:${target.includes(":button-1") || target.includes(":attachmentLine") ? "mark" : "component"}:${target}`,
        point: { x: 1, y: 2 }, sourceEntityId: entity },
      labelAt: { x: 5, y: 6 },
    }));
    const result = mapPoloSourceCenteredKeyedCallouts("FRONT_FLAT", "polo-r1", callouts);
    expect(result.issues).toEqual([]);
    expect(result.callouts).toHaveLength(10);
    expect(result.callouts.map((callout) => callout.presentation?.key)).toEqual(identities.map(([, key]) => key));
    expect(result.callouts.every((callout) => callout.presentation?.markerStyle
      === (callout.presentation.key === "H" ? "segmented-open-halo" : "open-halo")
      && callout.presentation.markerRadiusCm === 0.22)).toBe(true);
    expect(mapPoloSourceCenteredKeyedCallouts("BACK_FLAT", "polo-r1", callouts).callouts).toEqual(callouts);
    expect(mapPoloSourceCenteredKeyedCallouts("FRONT_FLAT", "polo-r1", callouts.slice(1)).issues).toEqual([]);
    const required = identities.map(([pom]) => `pom:polo:${pom}`);
    expect(mapPoloSourceCenteredKeyedCallouts("FRONT_FLAT", "polo-r1", callouts.slice(1), required).issues)
      .toContainEqual(expect.objectContaining({ sourceId: "pom:polo:across-shoulder" }));
    expect(mapPoloSourceCenteredKeyedCallouts("FRONT_FLAT", "polo-r1", callouts, required).issues).toEqual([]);
    const stale = { ...callouts[0]!, source: { ...callouts[0]!.source, revisionId: "stale" } };
    expect(mapPoloSourceCenteredKeyedCallouts("FRONT_FLAT", "polo-r1", [stale, ...callouts.slice(1)]).issues).toHaveLength(1);
    const moved = { ...callouts[0]!, anchor: { ...callouts[0]!.anchor, sourceEntityId: "wrong-edge" } };
    expect(mapPoloSourceCenteredKeyedCallouts("FRONT_FLAT", "polo-r1", [moved, ...callouts.slice(1)]).issues).toHaveLength(1);
    expect(mapPoloSourceCenteredKeyedCallouts("FRONT_FLAT", "polo-r1", [...callouts, callouts[0]!]).issues).toHaveLength(2);
  });

  it("resolves role ownership for geometry, marks, darts, artwork and anchored callouts", () => {
    const base = { layer: "ANNOTATION" as const, feature: "annotation" as const,
      source: { sourceClass: "PATTERN_DERIVED" as const, sourceId: "pattern:tee:role:front", revisionId: "live" } };
    const outline: TechnicalFlatPrimitive = { ...base, kind: "path", id: "outline", commands: [
      { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 1, y: 0 } },
    ] };
    const mark: TechnicalFlatPrimitive = { ...base, kind: "mark", id: "mark", markKind: "button",
      markName: "button", at: { x: 0, y: 0 }, source: { ...base.source, sourceId: "pattern:tee:mark:front:button" } };
    const dart: TechnicalFlatPrimitive = { ...base, kind: "path", id: "dart", commands: outline.commands,
      source: { ...base.source, sourceId: "pattern:tee:dart:front:waist" } };
    const artwork: TechnicalFlatPrimitive = { ...base, kind: "artwork", id: "art", feature: "artwork",
      source: { ...base.source, sourceClass: "USER_REFERENCE", sourceId: "style:artwork:1" }, artworkKind: "print",
      placementId: "1", sourceName: "sample", targetRoleId: "front", widthCm: 1, heightCm: 1,
      transform: { dx: 0, dy: 0, scale: 1, rotationDegrees: 0 }, zOrder: 0 };
    const callout: TechnicalFlatPrimitive = { ...base, kind: "callout", id: "pom", feature: "pom", text: "Chest",
      anchor: { primitiveId: "outline", point: { x: 0, y: 0 } }, labelAt: { x: 2, y: 0 } };
    expect(technicalFlatPrimitiveRole(outline, [outline], ["front"])).toBe("front");
    expect(technicalFlatPrimitiveRole(mark, [mark], ["front"])).toBe("front");
    expect(technicalFlatPrimitiveRole(dart, [dart], ["front"])).toBe("front");
    expect(technicalFlatPrimitiveRole(artwork, [artwork], ["front"])).toBe("front");
    expect(technicalFlatPrimitiveRole(callout, [outline, callout], ["front"])).toBe("front");
    expect(technicalFlatPrimitiveRole(callout, [callout], ["front"])).toBe("");
    expect(technicalFlatPrimitiveRole({ ...outline, source: { ...base.source,
      sourceId: "pattern:woven-shirt:role:sleeveBand" } }, [outline], ["sleeve", "sleeveBand"]))
      .toBe("sleeveBand");
    expect(technicalFlatPrimitiveRole({ ...outline, source: { ...base.source,
      sourceId: "pattern:woven-shirt:role:sleeveBand:edge:top" } }, [outline], ["sleeve"]))
      .toBe("");
    expect(technicalFlatPrimitiveRole({ ...mark, source: { ...mark.source,
      sourceId: "pattern:tee:mark:frontier:button" } }, [], ["front"]))
      .toBe("");
    expect(technicalFlatPrimitiveRole({ ...outline, source: { ...base.source,
      sourceId: "pattern:tee:dart:front" } }, [outline], ["front"]))
      .toBe("");
    expect(technicalFlatPrimitiveRole({ ...base, kind: "text", id: "free-note", at: { x: 0, y: 0 }, text: "note",
      source: { ...base.source, sourceId: "style:note" } }, [], ["front"])).toBe("");
  });

  it("binds front/back primitives, overlays and callouts to one transformed draft revision", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tank")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const front = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-tank-42", kind: "FRONT_FLAT",
      placements: [], colorHex: "#456789", texture: "woven", shine: 12 });
    const back = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-tank-42", kind: "BACK_FLAT",
      placements: [], colorHex: "#456789", texture: "woven", shine: 12 });
    expect(front.issues).toEqual([]);
    expect(back.issues).toEqual([]);
    expect(front.view?.revisionId).toBe(back.view?.revisionId);
    expect(front.view?.primitives.every((primitive) => primitive.source.revisionId === "live-tank-42")).toBe(true);
    expect(back.view?.primitives.every((primitive) => primitive.source.revisionId === "live-tank-42")).toBe(true);
    expect(front.view?.primitives.some((primitive) => primitive.kind === "callout")).toBe(true);
    const tankBackCallouts = back.view?.primitives.filter((primitive) => primitive.kind === "callout") ?? [];
    expect(tankBackCallouts).toHaveLength(4);
    for (const sourceId of [
      "pom:tank:body-chest-finished", "pom:tank:body-length-hps-hem",
      "pom:tank:across-shoulder", "pom:tank:neck-width",
    ]) {
      const callout = tankBackCallouts.find((primitive) => primitive.source.sourceId === sourceId);
      const target = back.view?.primitives.find((primitive) => primitive.kind === "path"
        && primitive.id === "flat:tank:BACK_FLAT:component:back:outline");
      expect(callout).toMatchObject({ kind: "callout", source: { sourceId, revisionId: "live-tank-42" },
        anchor: { primitiveId: "flat:tank:BACK_FLAT:component:back:outline" } });
      if (callout?.kind !== "callout" || target?.kind !== "path") throw new Error("Expected exact Tank back POM geometry.");
      expect(target.commands.some((command) => command.op !== "close"
        && command.point.x === callout.anchor.point.x && command.point.y === callout.anchor.point.y)).toBe(true);
    }
    expect(tankBackCallouts.some((callout) => callout.source.sourceId === "pom:tank:front-neck-drop")).toBe(false);
    expect(back.view?.notices.some((notice) => notice.sourceId === "pom:tank:front-neck-drop"
      && notice.message.includes("no back anchor is inferred"))).toBe(true);
    expect(front.view?.primitives.find((primitive) => primitive.kind === "path")?.kind).toBe("path");
    expect(front.view?.primitives.filter((primitive) => primitive.kind === "path")
      .every((primitive) => primitive.sourceEdgeIds?.every((id) => id.startsWith("pattern:tank:role:")))).toBe(true);
    const artwork = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-tank-art", kind: "FRONT_FLAT",
      placements: [{ id: "chest-mark", kind: "print", pieceRole: "front", widthCm: 1, heightCm: 1,
        transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: 1, sourceName: "Chest mark" }],
      colorHex: "#456789", texture: "woven", shine: 12 });
    expect(artwork.issues).toEqual([]);
    expect(artwork.view?.primitives.some((primitive) => primitive.kind === "artwork")).toBe(true);
    expect(artwork.colorway).toMatchObject({ revisionId: "live-tank-art", colorHex: "#456789" });
  });

  it("attaches the Tee/Fitted front cap and side to the exact armhole underarm while retaining the eased-cap notice", () => {
    for (const recipeId of ["tee", "fitted"] as const) {
      const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
      const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
      for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
        const revisionId = `live-${recipeId}-${kind}`;
        const result = compileTechnicalFlatLiveView({ recipe, block, revisionId, kind,
          placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
        expect(result.issues, `${recipeId}.${kind}`).toEqual([]);
        expect(result.view?.revisionId).toBe(revisionId);
        const sleeve = result.view?.primitives.find((primitive) => primitive.kind === "path"
          && primitive.id === `flat:${recipeId}:${kind}:component:sleeve:outline`);
        const bodyRoleId = kind === "FRONT_FLAT" ? "front" : "back";
        const body = result.view?.primitives.find((primitive) => primitive.kind === "path"
          && primitive.id === `flat:${recipeId}:${kind}:component:${bodyRoleId}:outline`);
        if (sleeve?.kind !== "path" || body?.kind !== "path") throw new Error("Expected the live sleeve and body outlines.");
        const bodyArmholeIndex = body.sourceEdgeIds!.indexOf(`pattern:${recipeId}:role:${bodyRoleId}:edge:armhole`);
        const capId = kind === "FRONT_FLAT" ? "capLeft" : "capRight";
        const sleeveCapIndex = sleeve.sourceEdgeIds!.indexOf(`pattern:${recipeId}:role:sleeve:edge:${capId}`);
        const sleeveUnderarmCommand = sleeve.commands[sleeveCapIndex * 2 + (kind === "FRONT_FLAT" ? 0 : 1)]!;
        const bodyUnderarmCommand = body.commands[bodyArmholeIndex * 2 + 1]!;
        if (sleeveUnderarmCommand.op === "close" || bodyUnderarmCommand.op === "close") {
          throw new Error("Expected source endpoints on the sleeve and body outlines.");
        }
        const sleeveUnderarm = sleeveUnderarmCommand.point;
        const bodyUnderarm = bodyUnderarmCommand.point;
        expect(Math.hypot(sleeveUnderarm.x - bodyUnderarm.x, sleeveUnderarm.y - bodyUnderarm.y)).toBeLessThan(1e-8);
        expect(result.view?.notices.some((notice) => notice.sourceId === "stitch:Sleeve-cap ease"
          && notice.message.includes("RMS separation across matched seam landmarks"))).toBe(true);
        expect(result.view?.primitives.some((primitive) => primitive.id.endsWith(":approved-view-pair"))).toBe(true);
      }
    }
  });

  it("places paired Woven sleeves/bands and the left closure while keeping the right button layer above", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-woven-approved-view", kind: "FRONT_FLAT",
      placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(result.view).not.toBeNull();
    expect(result.issues).toEqual([]);
    expect(result.view?.primitives.filter((primitive) => primitive.kind === "path"
      && primitive.layer === "SEAM" && primitive.id.includes(":view-seam:woven-sleeve-cap:"))).toHaveLength(2);
    const sleeveOutline = result.view?.primitives.find((primitive) => primitive.kind === "path"
      && primitive.id === "flat:woven-shirt:FRONT_FLAT:component:sleeve:outline");
    expect(sleeveOutline?.kind === "path" ? sleeveOutline.sourceEdgeIds?.some((sourceId) =>
      sourceId.endsWith(":edge:capLeft") || sourceId.endsWith(":edge:capRight")) : false).toBe(false);
  });

  it("fails closed when the approved Woven left closure has no assembled center axis or cannot reflect", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const reflection = { axisRoleId: "front" as const, edgeId: "centerFront" as const,
      source: "MAINTAINER_VIEW_DECISION" as const, decisionId: "G04-S321-WOVEN-CLOSURE-A" as const,
      side: "LEFT" as const, quantity: 1 as const };
    const primitive: FlatPathPrimitive = { kind: "path", id: "buttonhole", layer: "CLOSURE", feature: "closure",
      source: { sourceClass: "PATTERN_DERIVED", sourceId: "pattern:woven-shirt:role:buttonholePlacket", revisionId: "r1" },
      commands: [{ op: "move", point: { x: 1, y: 0 } }, { op: "line", point: { x: 2, y: 0 } }] };
    const missingAxisIssues: TechnicalFlatLiveIssue[] = [];
    expect(appendOppositeSideReflection([], primitive, reflection, block, {}, missingAxisIssues)).toBe(true);
    expect(missingAxisIssues.some((issue) => issue.message.includes("no exact assembled front.centerFront axis"))).toBe(true);

    const front = block.roles.front!;
    const collapsed = { ...block, roles: { ...block.roles, front: { ...front, edges: front.edges.map((edge) =>
      edge.name === "centerFront" && edge.kind === "line" ? { ...edge, end: { ...edge.start } } : edge) } } };
    const transforms = assembleTechnicalFlatRoles("woven-shirt", collapsed, "FRONT_FLAT").transforms;
    const collapsedIssues: TechnicalFlatLiveIssue[] = [];
    expect(appendOppositeSideReflection([], primitive, reflection, collapsed, transforms, collapsedIssues)).toBe(true);
    expect(collapsedIssues.some((issue) => issue.message.includes("cannot be represented on its opposite front side"))).toBe(true);
    expect(appendOppositeSideReflection([], primitive, undefined, block, transforms, [])).toBe(false);
  });

  it("retains only the approved center-axis placket fill closure under reflection", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const reflection = { axisRoleId: "front" as const, edgeId: "centerFront" as const,
      source: "MAINTAINER_VIEW_DECISION" as const, decisionId: "G04-S321-WOVEN-CLOSURE-A" as const,
      side: "LEFT" as const, quantity: 1 as const };
    const transforms = assembleTechnicalFlatRoles("woven-shirt", block, "FRONT_FLAT").transforms;
    const axis = block.roles.front!.edges.find((edge) => edge.name === "centerFront")!;
    if (axis.kind !== "line") throw new Error("Expected the authored center-front axis line.");
    const placement = transforms.front!;
    const place = (point: { x: number; y: number }) => {
      const angle = placement.rotationDegrees * Math.PI / 180;
      return { x: point.x * Math.cos(angle) - point.y * Math.sin(angle) + placement.offset.x,
        y: point.x * Math.sin(angle) + point.y * Math.cos(angle) + placement.offset.y };
    };
    const points = [place(axis.start), place(axis.end)];
    const boundary: FlatPathPrimitive = { kind: "path", id: "buttonhole-boundary", layer: "GARMENT_SILHOUETTE",
      feature: "silhouette", colorwayBoundaryOnly: true,
      source: { sourceClass: "PATTERN_DERIVED", sourceId: "view:woven-shirt:role:buttonholePlacket:decision:G04-S321-WOVEN-CLOSURE-A:boundary:approved-woven-left-placket-area-closure", revisionId: "r1" },
      commands: [{ op: "move", point: points[0]! }, { op: "line", point: points[1]! }, { op: "close" }] };
    const output: TechnicalFlatPrimitive[] = [];
    const issues: TechnicalFlatLiveIssue[] = [];
    expect(appendOppositeSideReflection(output, boundary, reflection, block, transforms, issues)).toBe(true);
    expect(output).toEqual([{ ...boundary, id: "buttonhole-boundary:approved-left-closure" }]);
    expect(issues).toEqual([]);

    const cubicBoundary: FlatPathPrimitive = { ...boundary, id: "cubic-boundary", commands: [
      { op: "move", point: points[0]! },
      { op: "cubic", control1: { x: points[0]!.x + (points[1]!.x - points[0]!.x) / 3,
        y: points[0]!.y + (points[1]!.y - points[0]!.y) / 3 },
      control2: { x: points[0]!.x + (points[1]!.x - points[0]!.x) * 2 / 3,
        y: points[0]!.y + (points[1]!.y - points[0]!.y) * 2 / 3 }, point: points[1]! },
    ] };
    const cubicOutput: TechnicalFlatPrimitive[] = [];
    expect(appendOppositeSideReflection(cubicOutput, cubicBoundary, reflection, block, transforms, [])).toBe(true);
    expect(cubicOutput[0]?.id).toBe("cubic-boundary:approved-left-closure");

    const malformed: FlatPathPrimitive = { ...boundary, id: "malformed-boundary", sourceEdgeIds: ["one", "two"],
      commands: [{ op: "move", point: { x: 1000, y: 1000 } }, { op: "line", point: { x: 1001, y: 1000 } }] };
    const malformedIssues: TechnicalFlatLiveIssue[] = [];
    expect(appendOppositeSideReflection([], malformed, reflection, block, transforms, malformedIssues)).toBe(true);
    expect(malformedIssues.some((issue) => issue.message.includes("cannot be represented on its opposite front side"))).toBe(true);
  });

  it("withholds an approved sleeve pair when its assembled axis or overlay transform is unavailable", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const reflection = { axisRoleId: "front" as const, edgeId: "centerFront" as const,
      axis: "ASSEMBLED_BODY_CENTER" as const, source: "MAINTAINER_VIEW_DECISION" as const,
      decisionId: "G04-S321-TEE-FITTED-SLEEVE-VIEW-PAIR" as const, quantity: 2 as const };
    const issues: TechnicalFlatLiveIssue[] = [];
    const base = { layer: "ARTWORK" as const, feature: "artwork" as const,
      source: { sourceClass: "USER_REFERENCE" as const, sourceId: "style:artwork:sleeve", revisionId: "r1" } };
    const artwork: TechnicalFlatPrimitive = { ...base, kind: "artwork", id: "sleeve-art", artworkKind: "print",
      placementId: "sleeve-print", sourceName: "Print", targetRoleId: "sleeve", widthCm: 2, heightCm: 2,
      transform: { dx: 0, dy: 0, scale: 1, rotationDegrees: 0 }, zOrder: 0 };
    appendApprovedViewPairReflection([], artwork, reflection, block, {}, issues);
    expect(issues).toContainEqual(expect.objectContaining({ stage: "transform", message: expect.stringContaining("no exact assembled front.centerFront axis") }));
    issues.length = 0;
    const transforms = assembleTechnicalFlatRoles(recipe.name, block, "FRONT_FLAT").transforms;
    appendApprovedViewPairReflection([], artwork, reflection, block, transforms, issues);
    expect(issues).toContainEqual(expect.objectContaining({ stage: "overlay", message: expect.stringContaining("cannot mirror artwork content") }));
    issues.length = 0;
    const note: TechnicalFlatPrimitive = { ...base, kind: "text", id: "note", at: { x: 1, y: 1 }, text: "note" };
    appendApprovedViewPairReflection([], note, reflection, block, transforms, issues);
    expect(issues.some((issue) => issue.message.includes("cannot mirror text content"))).toBe(true);
    issues.length = 0;
    const callout: TechnicalFlatPrimitive = { ...base, kind: "callout", id: "callout", feature: "pom", text: "POM",
      anchor: { primitiveId: "target", point: { x: 1, y: 1 } }, labelAt: { x: 2, y: 2 } };
    appendApprovedViewPairReflection([], callout, reflection, block, transforms, issues);
    expect(issues.some((issue) => issue.message.includes("cannot mirror callout content"))).toBe(true);
    issues.length = 0;
    const centerPoint: TechnicalFlatPrimitive = { ...base, kind: "mark", id: "axis-mark", layer: "ANNOTATION",
      feature: "annotation", source: { ...base.source, sourceClass: "PATTERN_DERIVED" },
      markKind: "placementPoint", markName: "on-axis", at: { x: 0, y: 4 } };
    appendApprovedViewPairReflection([], centerPoint, reflection, block, transforms, issues);
    expect(issues).toEqual([]);
    const locallyMirroredFrontTransforms = { ...transforms, front: { ...transforms.front!, mirrorX: true } };
    const mirroredAxisResult: TechnicalFlatPrimitive[] = [];
    const offAxisMark = { ...centerPoint, id: "off-axis-mark", at: { x: 2, y: 4 } };
    appendApprovedViewPairReflection(mirroredAxisResult, offAxisMark, reflection, block, locallyMirroredFrontTransforms, issues);
    expect(mirroredAxisResult).toHaveLength(1);
    expect(issues).toEqual([]);
  });

  it("anchors existing Skirt waist and hip POMs to matching front/back outline vertices", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "skirt")!;
    const block = recipe.draft({ ...STANDARD_M, waist: 92, hip: 112, hipDepth: 22, length: 88, ease: 8 },
      defaultGarmentOptions(recipe.options ?? []));
    const views = (['FRONT_FLAT', 'BACK_FLAT'] as const).map((kind) => compileTechnicalFlatLiveView({
      recipe, block, revisionId: "live-skirt-poms-312", kind, placements: [],
      colorHex: "#456789", texture: "smooth", shine: 0,
    }));
    expect(views.map((result) => result.issues)).toEqual([[], []]);
    for (const [index, kind] of (["FRONT_FLAT", "BACK_FLAT"] as const).entries()) {
      const view = views[index].view!;
      expect(view.revisionId).toBe("live-skirt-poms-312");
      for (const [sourceId, targetGeometryId, expectedText] of [
        ["pom:skirt:waist-finished", `flat:skirt:${kind}:component:${kind === "FRONT_FLAT" ? "front" : "back"}:outline`, "Waist (finished): 100.0 cm (±1.0 cm)"],
        ["pom:skirt:hip-finished", `flat:skirt:${kind}:component:${kind === "FRONT_FLAT" ? "front" : "back"}:outline`, "Hip (finished): 120.0 cm (±1.3 cm)"],
      ]) {
        const callout = view.primitives.find((primitive) => primitive.kind === "callout"
          && primitive.source.sourceId === sourceId);
        const target = view.primitives.find((primitive) => primitive.id === targetGeometryId);
        expect(callout).toMatchObject({ kind: "callout", source: { sourceId, revisionId: view.revisionId }, text: expectedText,
          anchor: { primitiveId: targetGeometryId, point: { x: expect.any(Number), y: expect.any(Number) } } });
        expect(target?.kind).toBe("path");
        if (callout?.kind !== "callout" || target?.kind !== "path") throw new Error("Expected exact Skirt POM geometry.");
        expect(target.commands.some((command) => command.op !== "close"
          && command.point.x === callout.anchor.point.x && command.point.y === callout.anchor.point.y)).toBe(true);
      }
      expect(view.primitives.some((primitive) => primitive.kind === "callout"
        && primitive.source.sourceId === "pom:skirt:length-waist-hem")).toBe(false);
    }
    expect(views[0].view?.primitives.every((primitive) => primitive.source.revisionId === "live-skirt-poms-312")).toBe(true);
    expect(views[1].view?.primitives.every((primitive) => primitive.source.revisionId === "live-skirt-poms-312")).toBe(true);
  });

  it("renders source-bound Trouser waistband joins after the approved fly repair", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "trouser")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const back = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-trouser-s307", kind: "BACK_FLAT",
      placements: [], colorHex: "#456789", texture: "woven", shine: 0 });
    expect(back.issues).toEqual([]);
    expect(back.view?.revisionId).toBe("live-trouser-s307");
    expect(back.view?.primitives.filter((primitive) => primitive.id.includes(":waistband:")))
      .toHaveLength(6);
    expect(back.view?.primitives.some((primitive) => primitive.kind === "path"
      && primitive.id.endsWith("center-back-closure"))).toBe(true);
    expect(back.view?.primitives.some((primitive) => primitive.kind === "mark" && primitive.markName === "centerBack")).toBe(true);
    expect(back.view?.primitives.every((primitive) => primitive.source.revisionId === back.view!.revisionId)).toBe(true);
    const backRiseCallout = back.view?.primitives.find((primitive) => primitive.kind === "callout"
      && primitive.id.endsWith(":callout:back-rise-finished-incl-waistband"));
    const waistbandDepthCallout = back.view?.primitives.find((primitive) => primitive.kind === "callout"
      && primitive.id.endsWith(":callout:waistband-depth-finished"));
    const waistbandMark = back.view?.primitives.find((primitive) => primitive.kind === "mark"
      && primitive.id === "live-flat:trouser:BACK_FLAT:waistband:mark:centerBack");
    const backLeftOutline = back.view?.primitives.find((primitive) => primitive.kind === "path"
      && primitive.id === "flat:trouser:BACK_FLAT:component:backLeft:outline");
    expect(backRiseCallout).toMatchObject({
      kind: "callout",
      source: { sourceId: "pom:trouser:back-rise-finished-incl-waistband", revisionId: "live-trouser-s307" },
      anchor: { primitiveId: "flat:trouser:BACK_FLAT:component:backLeft:outline" },
    });
    expect(waistbandDepthCallout).toMatchObject({
      kind: "callout",
      source: { sourceId: "pom:trouser:waistband-depth-finished", revisionId: "live-trouser-s307" },
      text: "Waistband depth (finished): 4.0 cm (±0.2 cm)",
      anchor: { primitiveId: "live-flat:trouser:BACK_FLAT:waistband:mark:centerBack" },
    });
    expect(waistbandMark?.kind).toBe("mark");
    if (waistbandDepthCallout?.kind !== "callout" || waistbandMark?.kind !== "mark") {
      throw new Error("Expected the waistband depth callout and its exact emitted mark.");
    }
    expect(waistbandDepthCallout.anchor.point).toEqual(waistbandMark.at);
    expect(waistbandDepthCallout.labelAt).not.toEqual(backRiseCallout?.kind === "callout" ? backRiseCallout.labelAt : undefined);
    expect(backLeftOutline?.kind).toBe("path");
    if (backRiseCallout?.kind !== "callout" || backLeftOutline?.kind !== "path") {
      throw new Error("Expected the back-rise leader and its same-revision backLeft outline.");
    }
    const anchorIsOutlined = backLeftOutline.commands.some((command) => command.op !== "close"
      && command.point.x === backRiseCallout.anchor.point.x && command.point.y === backRiseCallout.anchor.point.y);
    expect(anchorIsOutlined).toBe(true);

    const front = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-trouser-s307", kind: "FRONT_FLAT",
      placements: [], colorHex: "#456789", texture: "woven", shine: 0 });
    expect(front.view).not.toBeNull();
    expect(front.issues).not.toContainEqual(expect.objectContaining({
      sourceId: "view:trouser:waistband:center-front",
    }));
    expect(front.issues.some((issue) => issue.sourceId.includes("role:waistband")
      && issue.message.includes("no sewn placement"))).toBe(false);

    const unattachedBand = { ...block, stitches: block.stitches.filter((stitch) =>
      stitch.label !== "Waistband (four legs ↔ separate waistband)") };
    const missingEmittedMark = compileTechnicalFlatLiveView({ recipe, block: unattachedBand,
      revisionId: "live-trouser-no-band-fragments", kind: "BACK_FLAT", placements: [],
      colorHex: "#456789", texture: "woven", shine: 0 });
    expect(missingEmittedMark.view).toBeNull();
    expect(missingEmittedMark.issues.some((issue) => issue.stage === "pom"
      && issue.message.includes("exact emitted mark entity"))).toBe(true);

  });

  it("fails closed when a source POM role has no view transform", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "trouser")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const mappings = G04_TECHNICAL_FLAT_MAPPINGS as unknown as Record<string, typeof G04_TECHNICAL_FLAT_MAPPINGS.trouser>;
    const saved = mappings.trouser;
    const edge = block.roles.waistband.edges[0]!;
    const anchor = edge.kind === "line" ? edge.start : edge.curve.start;
    try {
      mappings.trouser = { ...saved, backPomAnchorRole: "waistband" };
      const result = compileTechnicalFlatLiveView({ recipe: { ...recipe, poms: [
        { label: "Unplaced source POM", measure: () => 2, backAnchor: () => anchor },
      ] }, block, revisionId: "live-trouser-no-anchor-transform", kind: "BACK_FLAT",
      placements: [], colorHex: "#456789", texture: "woven", shine: 0 });
      expect(result.view).toBeNull();
      expect(result.issues).toContainEqual(expect.objectContaining({ stage: "pom",
        sourceId: "flat:trouser:BACK_FLAT:component:waistband:outline",
        message: expect.stringContaining("exact mapped same-revision source entity") }));
    } finally {
      mappings.trouser = saved;
    }
  });

  it("withholds Trouser waistband artwork until the source placement is fragment-clipped", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "trouser")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-trouser-band-art", kind: "BACK_FLAT",
      placements: [
        { id: "band-art", kind: "print", pieceRole: "waistband", widthCm: 1, heightCm: 1,
          transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: 1, sourceName: "Band artwork" },
        { id: "back-art", kind: "print", pieceRole: "backLeft", widthCm: 1, heightCm: 1,
          transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: 0, sourceName: "Back artwork" },
      ],
      colorHex: "#456789", texture: "woven", shine: 0 });
    expect(result.view).toBeNull();
    expect(result.issues).toContainEqual(expect.objectContaining({ stage: "overlay",
      message: expect.stringContaining("exact source placement can be clipped") }));
    expect(result.issues.some((issue) => issue.message.includes("no sewn placement"))).toBe(false);
  });

  it("keeps a recipe without an overlay face explicitly unsupported", () => {
    const base = GARMENTS.find((candidate) => candidate.name === "tank")!;
    const recipe = { ...base, name: "unmapped-recipe" };
    const block = base.draft(STANDARD_M, defaultGarmentOptions(base.options ?? []));
    const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-unmapped", kind: "FRONT_FLAT",
      placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(result.view).toBeNull();
    expect(result.issues.some((issue) => issue.message.includes("no admitted front flat mapping"))).toBe(true);

    const trouser = GARMENTS.find((candidate) => candidate.name === "trouser")!;
    const trouserBlock = trouser.draft(STANDARD_M, defaultGarmentOptions(trouser.options ?? []));
    const missingOverlay = compileTechnicalFlatLiveView({ recipe: trouser, block: trouserBlock,
      revisionId: "live-trouser-no-overlay-face", kind: "BACK_FLAT",
      placements: [{ id: "bad", kind: "print", pieceRole: "backLeft", widthCm: -1, heightCm: 1,
        transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: 0, sourceName: "Invalid" }],
      colorHex: "#456789", texture: "woven", shine: 0 });
    expect(missingOverlay.view).toBeNull();
    expect(missingOverlay.issues.some((issue) => issue.stage === "overlay")).toBe(true);
  });

  it("emits Tee/Fitted front and back sleeve candidates with source endpoint traversal", () => {
    for (const [recipeId, roleId] of [["tee", "sleeve"], ["fitted", "sleeve"]] as const) {
      const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
      const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
      for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
        const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: `live-${recipeId}-${kind}`, kind,
          placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
        expect(result.issues, `${recipeId}.${kind}`).toEqual([]);
        expect(result.view?.primitives.some((primitive) => primitive.kind === "path"
          && primitive.source.sourceId === `pattern:${recipeId}:role:${roleId}`), `${recipeId}.${kind}`).toBe(true);
        expect(result.view?.notices.some((notice) => notice.sourceId === "stitch:Sleeve-cap ease"
          && notice.message.includes("RMS separation across matched seam landmarks")), `${recipeId}.${kind}`).toBe(true);
      }
    }
  });

  it("emits source-segmented skirt waistbands and reflects each face segment across its panel axis", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "skirt")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    for (const [kind, segmentEdges] of [
      ["FRONT_FLAT", ["seam", "top", "end"]],
      ["BACK_FLAT", ["seam", "top"]],
    ] as const) {
      const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: `live-skirt-${kind}`, kind,
        placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
      expect(result.issues, kind).toEqual([]);
      expect(result.view, kind).not.toBeNull();
      const paths = result.view!.primitives.filter((primitive) => primitive.kind === "path"
        && primitive.source.sourceId.includes("role:waistband"));
      const outline = paths.find((primitive) => primitive.id.endsWith("component:waistband:outline"));
      const reflected = paths.find((primitive) => primitive.id.endsWith("component:waistband:outline:attached-fold-reflection"));
      const sideBoundary = paths.find((primitive) => primitive.id.endsWith("view-boundary:side-seam-outline"));
      const reflectedBoundary = paths.find((primitive) => primitive.id.endsWith("view-boundary:side-seam-outline:attached-fold-reflection"));
      expect(outline?.kind).toBe("path");
      expect(reflected?.kind).toBe("path");
      expect(sideBoundary).toMatchObject({ layer: "GARMENT_SILHOUETTE", feature: "silhouette" });
      expect(reflectedBoundary).toMatchObject({ layer: "GARMENT_SILHOUETTE", feature: "silhouette" });
      if (outline?.kind !== "path" || reflected?.kind !== "path") throw new Error("Expected waistband segment paths.");
      expect(outline.sourceEdgeIds?.map((sourceId) => sourceId.split(":edge:").pop())).toEqual(segmentEdges);
      expect(reflected.sourceEdgeIds).toEqual(outline.sourceEdgeIds?.filter((sourceId) =>
        !sourceId.endsWith(kind === "FRONT_FLAT" ? ":edge:end" : ":edge:fold")));
      expect(outline.commands).not.toEqual(reflected.commands);
      expect(paths.some((primitive) => primitive.kind === "path" && primitive.feature === "seam"
        && primitive.source.sourceId.includes("view-boundary"))).toBe(false);
    }
  });

  it("withholds artwork placed across the Skirt face-segment boundary", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "skirt")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-skirt-art", kind: "FRONT_FLAT",
      placements: [{ id: "art-band", pieceRole: "waistband", assetId: "print", x: 1, y: 1,
        width: 1, height: 1, rotation: 0 } as never], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(result.view).toBeNull();
    expect(result.issues).toContainEqual(expect.objectContaining({ stage: "overlay", sourceId: "style:artwork:waistband",
      message: expect.stringContaining("Reposition it on the front or back panel") }));
  });

  it("reflects attached source primitives across an arbitrary assembled axis and rejects malformed geometry", () => {
    const base = { layer: "ANNOTATION" as const, feature: "annotation" as const,
      source: { sourceClass: "PATTERN_DERIVED" as const, sourceId: "pattern:skirt:role:waistband", revisionId: "r1" } };
    const path: FlatPathPrimitive = { ...base, kind: "path", id: "band",
      sourceEdgeIds: ["pattern:skirt:role:waistband:edge:top", "pattern:skirt:role:waistband:edge:fold"],
      commands: [{ op: "move", point: { x: 0, y: 0 } }, { op: "cubic", control1: { x: 1, y: 0 },
        control2: { x: 1, y: 1 }, point: { x: 2, y: 1 } }, { op: "close" }, { op: "move", point: { x: 0, y: 0 } },
        { op: "line", point: { x: 0, y: 2 } }] };
    const placementIssues: TechnicalFlatLiveIssue[] = [];
    const missingPlacement = placeTechnicalFlatPrimitive(path, "waistband", undefined, placementIssues);
    expect(missingPlacement).toEqual([]);
    expect(placementIssues[0]?.message).toContain("no sewn placement");
    expect(placementIssues).toHaveLength(1);
    expect(placeTechnicalFlatPrimitive(path, "waistband", { offset: { x: 1, y: 2 }, rotationDegrees: 0 }))
      .toMatchObject([{ placed: { kind: "path", id: "band" } }]);
    const reflected = reflectPrimitiveAcrossLine(path, { x: 0, y: 0 }, { x: 0, y: 3 });
    expect(reflected).toMatchObject({ id: "band:attached-fold-reflection", kind: "path",
      sourceEdgeIds: ["pattern:skirt:role:waistband:edge:top"],
      commands: [{ op: "move", point: { x: 0, y: 0 } }, { op: "cubic", control1: { x: -1, y: 0 },
        control2: { x: -1, y: 1 }, point: { x: -2, y: 1 } }, { op: "close" }] });
    expect(reflectPrimitiveAcrossLine(path, { x: 2, y: 2 }, { x: 2, y: 2 })).toBeUndefined();
    expect(reflectPrimitiveAcrossLine({ ...path, sourceEdgeIds: ["wrong"] }, { x: 0, y: 0 }, { x: 0, y: 1 })).toBeUndefined();
    expect(reflectPrimitiveAcrossLine({ ...path, sourceEdgeIds: undefined, commands: [] }, { x: 0, y: 0 }, { x: 0, y: 1 })).toBeUndefined();
    const mark = { ...base, kind: "mark" as const, id: "mark", markKind: "button" as const,
      markName: "b", at: { x: 2, y: 1 } };
    expect(reflectPrimitiveAcrossLine(mark, { x: 0, y: 0 }, { x: 0, y: 2 })).toMatchObject({ at: { x: -2, y: 1 } });
    expect(reflectPrimitiveAcrossLine({ ...mark, at: { x: 0, y: 1 } }, { x: 0, y: 0 }, { x: 0, y: 2 })).toBeUndefined();
    const circle = { ...base, kind: "circle" as const, id: "circle", center: { x: 2, y: 1 }, radius: 1 };
    expect(reflectPrimitiveAcrossLine(circle, { x: 0, y: 0 }, { x: 0, y: 2 })).toMatchObject({ center: { x: -2, y: 1 } });
    expect(reflectPrimitiveAcrossLine({ ...circle, center: { x: 0, y: 1 } }, { x: 0, y: 0 }, { x: 0, y: 2 })).toBeUndefined();
    expect(reflectPrimitiveAcrossLine({ ...base, kind: "text", id: "text", at: { x: 1, y: 1 }, text: "note" },
      { x: 0, y: 0 }, { x: 0, y: 2 })).toBeUndefined();
  });

  it("compiles approved Polo collar geometry while keeping incoherent Woven faces held", () => {
    for (const recipeId of ["polo", "woven-shirt"]) {
      const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
      const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
      for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
        const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: `live-${recipeId}-${kind}`, kind,
          placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
        if (recipeId === "polo") {
          expect(result.issues.some((issue) => issue.stage === "assembly"
            && issue.sourceId === "stitch:Sleeve-cap ease")).toBe(false);
          const pomIssues = result.issues.filter((issue) => issue.stage === "pom");
          if (kind === "FRONT_FLAT") {
            expect(result.view).toBeNull();
            expect(result.colorway).toBeNull();
            expect(pomIssues.every((issue) => issue.message.includes("no readable label/leader position"))).toBe(true);
            expect(pomIssues.map((issue) => issue.sourceId)).toEqual([
              "pom:polo:finished-collar-stand-height", "pom:polo:stand-front-rise",
            ]);
          } else {
            expect(result.view).not.toBeNull();
            expect(result.colorway).not.toBeNull();
            expect(pomIssues).toEqual([]);
          }
          expect(result.issues.some((issue) => issue.stage === "geometry"
            && issue.message.includes("no authored front/back split landmark"))).toBe(false);
        } else {
          if (result.view) {
            expect(result.issues).toEqual([]);
            expect(result.colorway).not.toBeNull();
          } else {
            expect(result.colorway).toBeNull();
            expect(result.issues.some((issue) => issue.stage === "assembly" || issue.stage === "transform")).toBe(true);
          }
          expect(result.issues.some((issue) => issue.stage === "geometry"
            && issue.message.includes("no authored front/back split landmark"))).toBe(false);
        }
      }
    }
  });

  it("resolves Polo front mark and back edge POMs through their own same-face role transforms", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const shoulder = block.roles.front!.edges.find((edge) => edge.name === "shoulder")!;
    const shoulderPoint = edgeEnd(shoulder);
    const placketAttachment = block.roles.buttonPlacket!.edges.find((edge) => edge.name === "attachmentRaw")!;
    const placketPoint = edgeStart(placketAttachment);
    const backHem = block.roles.back!.edges.find((edge) => edge.name === "hem")!;
    const backHemPoint = edgeStart(backHem);
    const poms = [
      { label: "Front shoulder source", measure: () => 1, anchor: () => shoulderPoint,
        anchorRoleId: "front", anchorEdgeId: "shoulder" },
      { label: "Front button source", measure: () => 1,
        frontMarkAnchor: { roleId: "buttonPlacket", markName: "button-1", point: "at" as const } },
      { label: "Back hem source", measure: () => 1, backAnchor: () => backHemPoint,
        backAnchorRoleId: "back", backAnchorEdgeId: "hem" },
      { label: "Front fallback role", measure: () => 1, anchor: () => shoulderPoint },
      { label: "Back fallback role", measure: () => 1, backAnchor: () => backHemPoint },
      { label: "Missing view transform", measure: () => 1, anchor: () => placketPoint,
        anchorRoleId: "buttonPlacket" },
      { label: "Back point mark", measure: () => 1,
        backMarkAnchor: { roleId: "back", markName: "centerBack" } },
    ];
    const singleMapped = compileTechnicalFlatLiveView({ recipe: { ...recipe, poms: [{ label: "Single mapped shoulder",
      measure: () => 1, anchor: () => shoulderPoint, anchorRoleId: "front" }] }, block,
      revisionId: "polo-pom-single-mapped", kind: "FRONT_FLAT", placements: [],
      colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(singleMapped.issues.filter((issue) => issue.stage === "pom")).toEqual([]);
    const invalidPom = compileTechnicalFlatLiveView({ recipe: { ...recipe, poms: [{ label: "Invalid value",
      measure: () => -1, anchor: () => shoulderPoint, anchorRoleId: "front", anchorEdgeId: "shoulder" }] }, block,
      revisionId: "polo-pom-null-callouts", kind: "FRONT_FLAT", placements: [],
      colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(invalidPom.issues).toContainEqual(expect.objectContaining({ stage: "pom", sourceId: "pom:polo:invalid-value" }));
    for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
      const result = compileTechnicalFlatLiveView({ recipe: { ...recipe, poms }, block,
        revisionId: `polo-pom-role-${kind}`, kind, placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
      if (kind === "FRONT_FLAT") {
        expect(result.issues.filter((issue) => issue.stage === "pom")).toEqual([]);
      } else {
        expect(result.issues.filter((issue) => issue.stage === "pom")).toEqual([]);
      }
    }
    const mappings = G04_TECHNICAL_FLAT_MAPPINGS as unknown as Record<string, typeof G04_TECHNICAL_FLAT_MAPPINGS.polo>;
    const savedPoloMapping = mappings.polo;
    try {
      const [frontMapping, backMapping] = savedPoloMapping.faces;
      mappings.polo = { ...savedPoloMapping, faces: [{ ...frontMapping,
        roles: frontMapping.roles.filter((role) => role.roleId !== "buttonPlacket") }, backMapping] };
      const missingPlacement = compileTechnicalFlatLiveView({ recipe: { ...recipe, poms: [poms[1]] }, block,
        revisionId: "polo-pom-missing-placement", kind: "FRONT_FLAT", placements: [],
        colorHex: "#456789", texture: "smooth", shine: 0 });
      expect(missingPlacement.issues.filter((issue) => issue.stage === "pom")).toContainEqual(expect.objectContaining({
        message: expect.stringContaining("exact emitted mark entity"),
      }));
      mappings.polo = { ...savedPoloMapping, pomAnchorRole: undefined as unknown as string };
      const noMappedRole = compileTechnicalFlatLiveView({ recipe: { ...recipe, poms: [{ label: "No mapped role",
        measure: () => 1, anchor: () => placketPoint }] }, block, revisionId: "polo-pom-no-mapped-role",
        kind: "FRONT_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
      expect(noMappedRole.issues.filter((issue) => issue.stage === "pom").length).toBeGreaterThan(0);
    } finally {
      mappings.polo = savedPoloMapping;
    }

    const trouser = GARMENTS.find((candidate) => candidate.name === "trouser")!;
    const trouserBlock = trouser.draft(STANDARD_M, defaultGarmentOptions(trouser.options ?? []));
    const mappingsWithTrouser = G04_TECHNICAL_FLAT_MAPPINGS as unknown as Record<string,
      typeof G04_TECHNICAL_FLAT_MAPPINGS.trouser>;
    const savedTrouserMapping = mappingsWithTrouser.trouser;
    try {
      mappingsWithTrouser.trouser = { ...savedTrouserMapping, pomAnchorRole: "" };
      const trouserEdge = trouserBlock.roles.frontLeft!.edges.find((edge) => edge.name === "hem")!;
      const missingFallback = compileTechnicalFlatLiveView({ recipe: { ...trouser, poms: [{ label: "No fallback", measure: () => 1,
        anchor: () => edgeStart(trouserEdge), anchorRoleId: "frontLeft" }] }, block: trouserBlock,
        revisionId: "trouser-pom-no-fallback", kind: "FRONT_FLAT", placements: [],
        colorHex: "#456789", texture: "smooth", shine: 0 });
      expect(missingFallback.issues.filter((issue) => issue.stage === "pom")).toContainEqual(expect.objectContaining({
        message: expect.stringContaining("exact mapped same-revision source entity"),
      }));
    } finally {
      mappingsWithTrouser.trouser = savedTrouserMapping;
    }
  });

  it("applies the S351 residual rule to all options but retains each independent Polo face hold", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const optionSets = [defaultGarmentOptions(recipe.options ?? []), ...(recipe.options ?? []).flatMap((option) => [
      { ...defaultGarmentOptions(recipe.options ?? []), [option.id]: option.min },
      { ...defaultGarmentOptions(recipe.options ?? []), [option.id]: option.max },
    ])];
    expect(optionSets).toHaveLength(17);
    for (const options of optionSets) {
      const block = recipe.draft(STANDARD_M, options);
      for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
        const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: `live-polo-${kind}-${JSON.stringify(options)}`,
          kind, placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
        expect(result.issues.some((issue) => issue.stage === "assembly"
          && issue.sourceId === "stitch:Sleeve-cap ease")).toBe(false);
        const poms = result.issues.filter((issue) => issue.stage === "pom");
        if (kind === "FRONT_FLAT") {
          expect(result.view).toBeNull();
          expect(result.colorway).toBeNull();
          expect(poms.map((issue) => issue.sourceId)).toEqual([
            "pom:polo:finished-collar-stand-height", "pom:polo:stand-front-rise",
          ]);
          expect(poms.every((issue) => issue.message.includes("no readable label/leader position"))).toBe(true);
        } else {
          expect(result.view).not.toBeNull();
          expect(result.colorway).not.toBeNull();
          expect(poms).toEqual([]);
        }
      }
    }
  });

  it("retains the Woven sleeve residual hold when its source stitch no longer matches the approved projection", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const source = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const block = { ...source, stitches: source.stitches.map((stitch) => stitch.label === "Woven sleeve-cap ease"
      ? { ...stitch, label: "Woven sleeve-cap ease changed" } : stitch) };
    const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: "woven-cap-stitch-changed",
      kind: "FRONT_FLAT", placements: [], colorHex: "#456789", texture: "woven", shine: 0 });
    expect(result.view).toBeNull();
    expect(result.issues).toContainEqual(expect.objectContaining({ stage: "assembly",
      sourceId: expect.stringContaining("Woven sleeve-cap ease changed"),
      message: expect.stringContaining("Woven front/back flats are withheld") }));
  });

  it("reports unavailable sewn placements and preserves residual-endpoint notices", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const disconnected = { ...block, stitches: [] };
    const result = compileTechnicalFlatLiveView({ recipe, block: disconnected, revisionId: "live-disconnected",
      kind: "FRONT_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(result.view).toBeNull();
    expect(result.issues.some((issue) => issue.stage === "assembly" && issue.message.includes("no rigid placement supported"))).toBe(true);
    expect(technicalFlatAssemblyNotices("woven-shirt", "FRONT_FLAT", [
      { code: "STITCH_ENDPOINT_RESIDUAL", sourceId: "stitch:collar", message: "Residual 0.4 cm." },
      { code: "INCONSISTENT_STITCH_TRANSFORM", sourceId: "stitch:cycle", message: "Cycle conflict." },
    ])).toEqual([expect.objectContaining({ id: "notice:woven-shirt:FRONT_FLAT:assembly:stitch:collar",
      reason: "SOURCE_NOT_REPRESENTED", feature: "seam" })]);
  });

  it("reflects authored fold geometry without duplicating the axis or non-geometric overlays", () => {
    const base = { layer: "ANNOTATION" as const, feature: "annotation" as const,
      source: { sourceClass: "PATTERN_DERIVED" as const, sourceId: "pattern:tee:role:front", revisionId: "r1" } };
    const outline: TechnicalFlatPrimitive = { ...base, kind: "path", id: "outline",
      sourceEdgeIds: ["pattern:tee:role:front:edge:centerFront", "pattern:tee:role:front:edge:neck", "pattern:tee:role:front:edge:side"],
      commands: [{ op: "move", point: { x: 0, y: 4 } }, { op: "line", point: { x: 0, y: 0 } },
        { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 2, y: 1 } },
        { op: "move", point: { x: 2, y: 1 } }, { op: "line", point: { x: 4, y: 0 } }] };
    expect(reflectFoldPrimitive(outline, "centerFront")).toMatchObject({ id: "outline:fold-reflection",
      sourceEdgeIds: ["pattern:tee:role:front:edge:neck", "pattern:tee:role:front:edge:side"],
      commands: [{ point: { x: 0, y: 0 } }, { point: { x: 2, y: 1 } }, { point: { x: 2, y: 1 } }, { point: { x: 4, y: 0 } }] });
    expect(reflectFoldPrimitive({ ...outline, sourceEdgeIds: ["pattern:tee:role:front:edge:centerFront"],
      commands: outline.commands.slice(0, 2) }, "centerFront")).toBeUndefined();
    expect(reflectFoldPrimitive({ ...outline, sourceEdgeIds: undefined, commands: [] }, "centerFront")).toBeUndefined();
    expect(reflectFoldPrimitive({ ...outline, sourceEdgeIds: undefined, commands: [
      { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 0, y: 1 } },
    ] }, "centerFront")).toBeUndefined();
    expect(reflectFoldPrimitive({ ...outline, sourceEdgeIds: undefined, commands: [
      { op: "move", point: { x: 0, y: 1 } },
      { op: "cubic", control1: { x: 1, y: 2 }, control2: { x: 2, y: 2 }, point: { x: 3, y: 1 } },
      { op: "close" },
    ] }, "centerFront")?.id).toBe("outline:fold-reflection");
    expect(reflectFoldPrimitive({ ...base, kind: "mark", id: "mark", markKind: "placementPoint", markName: "side", at: { x: 2, y: 0 } }, "centerFront")?.id)
      .toBe("mark:fold-reflection");
    expect(reflectFoldPrimitive({ ...base, kind: "mark", id: "axis", markKind: "placementPoint", markName: "axis", at: { x: 0, y: 0 } }, "centerFront"))
      .toBeUndefined();
    expect(reflectFoldPrimitive({ ...base, kind: "circle", id: "circle", center: { x: 2, y: 0 }, radius: 1 }, "centerFront")?.id)
      .toBe("circle:fold-reflection");
    expect(reflectFoldPrimitive({ ...base, kind: "circle", id: "axis-circle", center: { x: 0, y: 0 }, radius: 1 }, "centerFront"))
      .toBeUndefined();
    expect(reflectFoldPrimitive({ ...base, kind: "text", id: "text", at: { x: 1, y: 1 }, text: "note" }, "centerFront"))
      .toBeUndefined();
    const reflection = { edgeId: "centerFront", axis: "LOCAL_Y" as const,
      source: "WOVEN_SHIRT_PHYSICAL_ROLES" as const, quantity: 2 as const };
    const physicalPair = reflectPhysicalPairPrimitive(outline, reflection, { offset: { x: 5, y: 2 }, rotationDegrees: 0 });
    expect(physicalPair).toMatchObject({ id: "outline:physical-pair-reflection",
      sourceEdgeIds: ["pattern:tee:role:front:edge:neck", "pattern:tee:role:front:edge:side"],
      commands: [{ op: "move", point: { x: 5, y: 2 } }, { op: "line", point: { x: 3, y: 3 } },
        { op: "move", point: { x: 3, y: 3 } }, { op: "line", point: { x: 1, y: 2 } }] });
    expect(reflectPhysicalPairPrimitive(outline, undefined, { offset: { x: 0, y: 0 }, rotationDegrees: 0 })).toBeUndefined();
    expect(reflectPhysicalPairPrimitive(outline, reflection, undefined)).toBeUndefined();
    expect(reflectPhysicalPairPrimitive({ ...outline, source: { ...base.source, sourceClass: "USER_REFERENCE" } },
      reflection, { offset: { x: 0, y: 0 }, rotationDegrees: 0 })).toBeUndefined();
    expect(reflectPhysicalPairPrimitive({ ...base, kind: "text", id: "text", at: { x: 1, y: 1 }, text: "note" },
      reflection, { offset: { x: 0, y: 0 }, rotationDegrees: 0 })).toBeUndefined();
    const reflectedPair: TechnicalFlatPrimitive[] = [outline];
    appendPhysicalPairReflection(reflectedPair, outline, reflection, { offset: { x: 5, y: 2 }, rotationDegrees: 0 });
    expect(reflectedPair).toHaveLength(2);
    appendPhysicalPairReflection(reflectedPair, outline, undefined, { offset: { x: 0, y: 0 }, rotationDegrees: 0 });
    expect(reflectedPair).toHaveLength(2);
  });

  it("renders the second half from source-declared folds while preserving the drafted block and single POM anchors", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tank")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const before = structuredClone(block);
    const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: "fold-view", kind: "FRONT_FLAT",
      placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(result.issues).toEqual([]);
    expect(result.view).not.toBeNull();
    expect(block).toEqual(before);
    const outlines = result.view!.primitives.filter((primitive): primitive is FlatPathPrimitive => primitive.kind === "path"
      && primitive.source.sourceId === "pattern:tank:role:front");
    const original = outlines.find((primitive) => primitive.id.endsWith(":outline"))!;
    const reflected = outlines.find((primitive) => primitive.id.endsWith(":outline:fold-reflection"))!;
    expect(original.sourceEdgeIds).not.toContain("pattern:tank:role:front:edge:centerFront");
    expect(reflected.sourceEdgeIds).not.toContain("pattern:tank:role:front:edge:centerFront");
    expect(result.view!.primitives.some((primitive) => primitive.kind === "callout" && primitive.id.includes(":fold-reflection")))
      .toBe(false);
    expect(result.view!.primitives.some((primitive) => primitive.kind === "artwork" && primitive.id.includes(":fold-reflection")))
      .toBe(false);
  });

  it("withholds unsupported recipes and exposes mapping and assembly corrections", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const unsupported = compileTechnicalFlatLiveView({ recipe: { ...recipe, name: "future" } as typeof recipe, block,
      revisionId: "live-future-1", kind: "FRONT_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    const unsupportedBack = compileTechnicalFlatLiveView({ recipe: { ...recipe, name: "future" } as typeof recipe, block,
      revisionId: "live-future-2", kind: "BACK_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(unsupported.view).toBeNull();
    expect(unsupportedBack.view).toBeNull();
    expect(unsupported.issues.some((issue) => issue.stage === "geometry" || issue.stage === "assembly")).toBe(true);

    const missing = { ...block, roles: { ...block.roles, front: undefined } } as unknown as typeof block;
    const assembly = compileTechnicalFlatLiveView({ recipe, block: missing, revisionId: "live-tee-2", kind: "FRONT_FLAT",
      placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(assembly.view).toBeNull();
    expect(assembly.issues.some((issue) => issue.stage === "assembly" && issue.message.includes("absent"))).toBe(true);

    const disconnected = assembleTechnicalFlatRoles("tee", { ...block, stitches: [] }, "FRONT_FLAT");
    expect(disconnected.issues.some((issue) => issue.code === "UNPLACED_COMPONENT_ROLE" && issue.sourceId === "sleeve")).toBe(true);
  });

  it("reports invalid revision and presentation values from their source stages", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: "", kind: "BACK_FLAT",
      placements: [], colorHex: "bad", texture: "smooth", shine: 0 });
    expect(result.view).toBeNull();
    expect(result.issues.some((issue) => issue.stage === "geometry" && issue.message.includes("revision"))).toBe(true);
    expect(result.issues.some((issue) => issue.stage === "overlay" && issue.message.includes("color"))).toBe(true);
    expect(result.issues.some((issue) => issue.stage === "pom" && issue.message.includes("revision"))).toBe(true);
  });

  it("retains assembly residuals as visible source notices while preserving rigid scale", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const result = assembleTechnicalFlatRoles("tee", block, "FRONT_FLAT");
    const residual = result.issues.find((issue) => issue.message.includes("RMS separation across matched seam landmarks"));
    expect(residual?.sourceId).toContain("stitch:");
    expect(residual?.message).toContain("after rigid placement");
  });

});
