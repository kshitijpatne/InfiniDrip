import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../drafting";
import { appendApprovedViewPairReflection, appendOppositeSideReflection, appendPhysicalPairReflection, compileTechnicalFlatLiveView, placeTechnicalFlatPrimitive, reflectFoldPrimitive, reflectPhysicalPairPrimitive, reflectPrimitiveAcrossLine, technicalFlatAssemblyNotices, technicalFlatPrimitiveRole } from "./technical-flat-live";
import { assembleTechnicalFlatRoles } from "./technical-flat-assembly";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";
import type { FlatPathPrimitive, TechnicalFlatPrimitive } from "./technical-flat";
import type { TechnicalFlatLiveIssue } from "./technical-flat-live";

describe("compileTechnicalFlatLiveView", () => {
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

  it("renders approved Tee/Fitted sleeve half views as two instances without a partition stroke", () => {
    for (const recipeId of ["tee", "fitted"] as const) {
      const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
      const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
      for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
        const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: `live-${recipeId}-${kind}`, kind,
          placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
        expect(result.issues, `${recipeId}:${kind}`).toEqual([]);
        expect(result.view).not.toBeNull();
        const sleeveOutlines = result.view!.primitives.filter((primitive) => primitive.kind === "path"
          && primitive.source.sourceId === `pattern:${recipeId}:role:sleeve`);
        expect(sleeveOutlines).toHaveLength(2);
        expect(sleeveOutlines.map((primitive) => primitive.id)).toContain(`flat:${recipeId}:${kind}:component:sleeve:outline`);
        expect(sleeveOutlines.map((primitive) => primitive.id)).toContain(`flat:${recipeId}:${kind}:component:sleeve:outline:approved-view-pair`);
        expect(result.view!.primitives.some((primitive) => primitive.id.includes("view-boundary"))).toBe(false);
        for (const outline of sleeveOutlines) {
          if (outline.kind !== "path") throw new Error("Expected sleeve outline paths.");
          expect(outline.source.revisionId).toBe(`live-${recipeId}-${kind}`);
          expect(outline.sourceEdgeIds).toHaveLength(3);
        }
      }
    }
  });

  it("places paired Woven sleeves/bands and the left closure while keeping the right button layer above", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-woven-approved-view", kind: "FRONT_FLAT",
      placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(result.issues).toEqual([]);
    expect(result.view).not.toBeNull();
    const primitives = result.view!.primitives;
    const outlines = (role: string) => primitives.filter((primitive) => primitive.kind === "path"
      && primitive.source.sourceId === `pattern:woven-shirt:role:${role}` && primitive.feature === "silhouette");
    expect(outlines("sleeve")).toHaveLength(2);
    expect(outlines("sleeve").map((primitive) => primitive.id)).toEqual([
      "flat:woven-shirt:FRONT_FLAT:component:sleeve:outline",
      "flat:woven-shirt:FRONT_FLAT:component:sleeve:outline:approved-view-pair",
    ]);
    expect(outlines("sleeveBand")).toHaveLength(2);
    expect(outlines("sleeveBand").map((primitive) => primitive.id)).toEqual([
      "flat:woven-shirt:FRONT_FLAT:component:sleeveBand:outline",
      "flat:woven-shirt:FRONT_FLAT:component:sleeveBand:outline:approved-view-pair",
    ]);
    const foldMarks = primitives.filter((primitive) => primitive.kind === "path"
      && primitive.source.sourceId === "pattern:woven-shirt:mark:sleeveBand:bandFold");
    expect(foldMarks).toHaveLength(2);
    expect(foldMarks.some((primitive) => primitive.id.endsWith(":approved-view-pair"))).toBe(true);
    const buttonhole = outlines("buttonholePlacket");
    const button = outlines("buttonPlacket");
    expect(buttonhole).toHaveLength(1);
    expect(buttonhole[0]?.id).toBe("flat:woven-shirt:FRONT_FLAT:component:buttonholePlacket:outline:approved-left-closure");
    expect(button).toHaveLength(1);
    expect(button[0]?.id).toBe("flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline");
    expect(primitives.indexOf(buttonhole[0]!)).toBeLessThan(primitives.indexOf(button[0]!));
    for (const primitive of [...outlines("sleeve"), ...outlines("sleeveBand"), ...buttonhole, ...button]) {
      expect(primitive.source.revisionId).toBe("live-woven-approved-view");
    }
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

  it("renders only the coherent source-bound Trouser back waistband and keeps the mismapped front held", () => {
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
    expect(front.view).toBeNull();
    expect(front.issues).toContainEqual(expect.objectContaining({ stage: "geometry",
      sourceId: "view:trouser:waistband:center-front", message: expect.stringContaining("complete face remains held") }));
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
        message: expect.stringContaining("same-revision outline") }));
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

  it("emits Tee/Fitted sleeve candidates only from their approved half-contour mapping", () => {
    for (const [recipeId, roleId] of [["tee", "sleeve"], ["fitted", "sleeve"]] as const) {
      const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
      const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
      for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
        const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: `live-${recipeId}-${kind}`, kind,
          placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
        expect(result.view, `${recipeId}.${kind}`).not.toBeNull();
        expect(result.colorway?.revisionId).toBe(`live-${recipeId}-${kind}`);
        const sleeve = result.view!.primitives.find((primitive) => primitive.kind === "path"
          && primitive.source.sourceId === `pattern:${recipeId}:role:${roleId}`);
        expect(sleeve?.kind).toBe("path");
        if (sleeve?.kind !== "path") throw new Error("Expected mapped sleeve outline.");
        expect(sleeve.sourceEdgeIds).toHaveLength(3);
        expect(result.view!.primitives.some((primitive) => primitive.id.includes("view-boundary"))).toBe(false);
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
          expect(result.view).not.toBeNull();
          expect(result.colorway).not.toBeNull();
          for (const roleId of ["outerStand", "underCollar", "upperCollar"]) {
            expect(result.view?.primitives.some((primitive) => primitive.id
              === `flat:polo:${kind}:component:${roleId}:outline`)).toBe(true);
          }
          expect(result.issues.some((issue) => issue.stage === "geometry"
            && issue.message.includes("no authored front/back split landmark"))).toBe(false);
        } else {
          if (result.view) {
            expect(result.issues).toEqual([]);
            expect(result.colorway).not.toBeNull();
          } else {
            expect(result.colorway).toBeNull();
            expect(result.issues.some((issue) => issue.stage === "assembly"
              && issue.message.includes("Woven sleeve-cap ease"))).toBe(true);
          }
          expect(result.issues.some((issue) => issue.stage === "geometry"
            && issue.message.includes("no authored front/back split landmark"))).toBe(false);
        }
      }
    }
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
    const residual = result.issues.find((issue) => issue.message.includes("leaves its sewn endpoints"));
    expect(residual?.sourceId).toContain("stitch:");
  });
});
