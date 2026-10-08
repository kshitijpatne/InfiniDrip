import { describe, expect, it } from "vitest";
import { GARMENTS, TEE, TROUSER } from "../drafting/recipe";
import { STANDARD_M } from "../drafting/measurements";
import { block } from "../drafting/block";
import { defaultGarmentOptions } from "../drafting/options";
import { edgeRef, iface, markRef, type Stitch } from "../drafting/stitch";
import type { Edge } from "../drafting/piece";
import { assembleTechnicalFlatRoles, isApprovedPoloEaseResidualDisplay, isApprovedWovenBaseSeamDisplay } from "./technical-flat-assembly";
import type { TechnicalFlatViewKind } from "./technical-flat";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";
import { cubicPoint } from "../geometry";
import { transformFlatPoint } from "./technical-flat-transform";
import { TROUSER_OPTION_DEFINITIONS } from "../drafting/trouser-contract";
import { createG04TechnicalFlatProjectionMap } from "./technical-flat-projection";

const draft = (recipe: typeof GARMENTS[number]) => recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));

describe("assembleTechnicalFlatRoles", () => {
  it("suppresses a residual only for the exact approved Woven collar display decision", () => {
    expect(isApprovedWovenBaseSeamDisplay("Outer stand ↔ woven neckline", "G04-S342-WOVEN-COLLAR-BASE-SEAM")).toBe(true);
    expect(isApprovedWovenBaseSeamDisplay("Outer stand ↔ woven neckline", "unapproved")).toBe(false);
    expect(isApprovedWovenBaseSeamDisplay("Woven sleeve-cap ease", "G04-S342-WOVEN-COLLAR-BASE-SEAM")).toBe(false);
    expect(isApprovedWovenBaseSeamDisplay("Outer stand ↔ woven neckline")).toBe(false);
  });

  it("suppresses only the exact validated S351 Polo eased-cap endpoint residual", () => {
    expect(isApprovedPoloEaseResidualDisplay("Sleeve-cap ease", "G04-S351-POLO-CAP-ARMHOLE-ARCLENGTH")).toBe(true);
    expect(isApprovedPoloEaseResidualDisplay("Sleeve-cap ease changed", "G04-S351-POLO-CAP-ARMHOLE-ARCLENGTH")).toBe(false);
    expect(isApprovedPoloEaseResidualDisplay("Sleeve-cap ease", "unapproved")).toBe(false);

    const polo = GARMENTS.find((recipe) => recipe.name === "polo")!;
    const source = draft(polo);
    const projection = createG04TechnicalFlatProjectionMap("polo", source, "assembly-polo-s351-r1")!;
    for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
      const result = assembleTechnicalFlatRoles("polo", source, kind, projection);
      expect(result.joinedStitchLabels).toContain("Sleeve-cap ease");
      expect(result.issues.some((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL"
        && issue.sourceId === "stitch:Sleeve-cap ease")).toBe(false);

      const stale = structuredClone(projection);
      const sleeve = stale.faces.find((face) => face.kind === kind)!.roles.find((role) => role.roleId === "sleeve")!;
      (sleeve.poloSleeveCapRepresentation as { decisionId: string }).decisionId = "stale";
      const rejected = assembleTechnicalFlatRoles("polo", source, kind, stale);
      expect(rejected.issues.some((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL"
        && issue.sourceId === "stitch:Sleeve-cap ease")).toBe(true);
    }

    const tee = draft(TEE);
    const teeAssembly = assembleTechnicalFlatRoles("tee", tee, "FRONT_FLAT");
    expect(teeAssembly.issues.some((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL"
      && issue.sourceId === "stitch:Sleeve-cap ease")).toBe(true);
  });

  it("maps every exterior role for all seven default recipes without exposing interior support pieces", () => {
    for (const recipe of GARMENTS) {
      const source = draft(recipe);
      for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
        const result = assembleTechnicalFlatRoles(recipe.name, source, kind);
        const face = G04_TECHNICAL_FLAT_MAPPINGS[recipe.name]?.faces.find((candidate) => candidate.kind === kind);
        expect(result.issues.filter((issue) => issue.code === "UNPLACED_COMPONENT_ROLE"), `${recipe.name}.${kind}`).toEqual([]);
        expect(result.recipeId).toBe(recipe.name);
        expect(result.kind).toBe(kind);
        for (const [roleId, transform] of Object.entries(result.transforms)) {
          expect(source.roles[roleId], `${recipe.name}.${kind}.${roleId}`).toBeDefined();
          expect(Number.isFinite(transform.offset.x) && Number.isFinite(transform.offset.y), roleId).toBe(true);
          expect(Number.isFinite(transform.rotationDegrees), roleId).toBe(true);
          expect(face?.roles.find((role) => role.roleId === roleId)?.treatment).not.toBe("INTERIOR_HIDDEN");
        }
      }
    }
  });

  it("keeps the approved Trouser underlap chain, upright fronts, and waist fragments across all option fixtures", () => {
    const baseOptions = defaultGarmentOptions(TROUSER.options ?? []);
    const fixtures: Array<{ readonly name: string; readonly options: Record<string, number> }> = [
      { name: "default", options: baseOptions },
      ...TROUSER_OPTION_DEFINITIONS.flatMap((definition) => [
        { name: `${definition.id}-min`, options: { ...baseOptions, [definition.id]: definition.min } },
        { name: `${definition.id}-max`, options: { ...baseOptions, [definition.id]: definition.max } },
      ]),
      { name: "combined-supported", options: {
        ...baseOptions, frontRiseEase: 2, backRiseEase: 11, thighEase: 10, kneeEase: 7, legOpening: 48,
      } },
    ];
    expect(fixtures).toHaveLength(24);

    for (const fixture of fixtures) {
      const source = TROUSER.draft(STANDARD_M, fixture.options);
      const front = assembleTechnicalFlatRoles("trouser", source, "FRONT_FLAT");
      const back = assembleTechnicalFlatRoles("trouser", source, "BACK_FLAT");
      expect(front.issues, `${fixture.name}.front`).toEqual([]);
      expect(back.issues, `${fixture.name}.back`).toEqual([]);
      for (const roleId of ["frontLeft", "frontRight"]) {
        const transform = front.transforms[roleId]!;
        expect(transform.offset.x, `${fixture.name}.${roleId}.x`).toBeCloseTo(0, 12);
        expect(transform.offset.y, `${fixture.name}.${roleId}.y`).toBeCloseTo(0, 12);
        expect(transform.rotationDegrees, `${fixture.name}.${roleId}.rotation`).toBeCloseTo(0, 12);
      }
      const leftCenter = source.roles.frontLeft!.edges.find((edge) => edge.name === "centerFront")!;
      const rightCenter = source.roles.frontRight!.edges.find((edge) => edge.name === "centerFront")!;
      for (const fraction of [0, 1]) {
        const leftPoint = transformFlatPoint(edgePoint(leftCenter, fraction), { ...front.transforms.frontLeft!, mirrorX: false });
        const rightPoint = transformFlatPoint(edgePoint(rightCenter, fraction), { ...front.transforms.frontRight!, mirrorX: false });
        expect(Math.hypot(leftPoint.x - rightPoint.x, leftPoint.y - rightPoint.y), `${fixture.name}.centerFront residual`)
          .toBeLessThan(1e-10);
      }
      expect(front.sourceFragments.map((fragment) => [fragment.attachedRoleId, fragment.attachedEdgeId]))
        .toEqual([["frontLeft", "waist"], ["frontRight", "waist"]]);
      expect(front.joinedStitchLabels).toContain("Fly underlap ↔ shield");
      expect(front.joinedStitchLabels).toContain("Right front fly ↔ underlap");
      expect(front.joinedStitchLabels).toContain("Left front fly ↔ shield");
      expect(source.roles.flyUnderlap?.edges.map((edge) => edge.name))
        .toEqual(["top", "frontEdge", "bottom", "shieldEdge"]);
      expect(source.stitches.find((stitch) => stitch.label === "Right front fly ↔ underlap")?.b.edges)
        .toEqual([{ piece: "flyUnderlap", edge: "frontEdge" }]);
      expect(source.stitches.find((stitch) => stitch.label === "Fly underlap ↔ shield")?.a.edges)
        .toEqual([{ piece: "flyUnderlap", edge: "shieldEdge" }]);
    }
  });

  it("solves sleeve and waistband placements from face-specific intervals of multi-edge stitches", () => {
    const tee = draft(TEE);
    expect(assembleTechnicalFlatRoles("tee", tee, "FRONT_FLAT").transforms.sleeve).toBeDefined();
    expect(assembleTechnicalFlatRoles("tee", tee, "BACK_FLAT").transforms.sleeve).toBeDefined();
    const skirt = draft(GARMENTS.find((recipe) => recipe.name === "skirt")!);
    for (const [kind, roleId, bodyT, bandT] of [["FRONT_FLAT", "front", 1, 0.5], ["BACK_FLAT", "back", 0, 1]] as const) {
      const assembly = assembleTechnicalFlatRoles("skirt", skirt, kind);
      const bodyEdge = skirt.roles[roleId]!.edges.find((edge) => edge.name === "waist")!;
      const bandEdge = skirt.roles.waistband!.edges.find((edge) => edge.name === "seam")!;
      expect(assembly.transforms.waistband).toBeDefined();
      const bodyPoint = edgePoint(bodyEdge, bodyT);
      const bodyViewPoint = transformFlatPoint(bodyPoint, { ...assembly.transforms[roleId]!, mirrorX: false });
      const bandViewPoint = transformFlatPoint(edgePoint(bandEdge, bandT), { ...assembly.transforms.waistband!, mirrorX: false });
      expect(Math.hypot(bodyViewPoint.x - bandViewPoint.x, bodyViewPoint.y - bandViewPoint.y)).toBeLessThan(0.3);
    }
  });

  it("maps the Tee front sleeve underarm to the source-matching body underarm by reversing only the view traversal", () => {
    const tee = draft(TEE);
    const projection = createG04TechnicalFlatProjectionMap("tee", tee, "tee-endpoint-map")!;
    const assembly = assembleTechnicalFlatRoles("tee", tee, "FRONT_FLAT", projection);
    const sleeve = tee.roles.sleeve!.edges.find((edge) => edge.name === "capLeft")!;
    const armhole = tee.roles.front!.edges.find((edge) => edge.name === "armhole")!;
    const sleeveUnderarm = transformFlatPoint(edgePoint(sleeve, 0), { ...assembly.transforms.sleeve!, mirrorX: false });
    const bodyUnderarm = transformFlatPoint(edgePoint(armhole, 1), { ...assembly.transforms.front!, mirrorX: false });
    const bodyShoulder = transformFlatPoint(edgePoint(armhole, 0), { ...assembly.transforms.front!, mirrorX: false });
    expect(Math.hypot(sleeveUnderarm.x - bodyUnderarm.x, sleeveUnderarm.y - bodyUnderarm.y)).toBeLessThan(1e-8);
    expect(Math.hypot(sleeveUnderarm.x - bodyShoulder.x, sleeveUnderarm.y - bodyShoulder.y)).toBeGreaterThan(5);
    expect(assembly.issues.some((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL")).toBe(true);
    const mismatchedMap = { ...projection, recipeId: "fitted" } as unknown as typeof projection;
    expect(assembleTechnicalFlatRoles("tee", tee, "FRONT_FLAT", mismatchedMap).transforms.sleeve?.mirrorX).toBe(false);
    const blankRevisionMap = { ...projection, revisionId: " " } as unknown as typeof projection;
    expect(assembleTechnicalFlatRoles("tee", tee, "FRONT_FLAT", blankRevisionMap).transforms.sleeve).toBeDefined();
    const missingFaceMap = { ...projection, faces: [projection.faces[1]] } as unknown as typeof projection;
    expect(assembleTechnicalFlatRoles("tee", tee, "FRONT_FLAT", missingFaceMap).transforms.sleeve).toBeDefined();
  });

  it("maps Woven sleeve cap halves to one source body relation per face", () => {
    const wovenRecipe = GARMENTS.find((recipe) => recipe.name === "woven-shirt")!;
    const woven = draft(wovenRecipe);
    const projection = createG04TechnicalFlatProjectionMap("woven-shirt", woven, "woven-sleeve-placement")!;
    const frontAssembly = assembleTechnicalFlatRoles("woven-shirt", woven, "FRONT_FLAT", projection);
    const sleeve = woven.roles.sleeve!;
    const front = woven.roles.front!;
    const capLeft = sleeve.edges.find((edge) => edge.name === "capLeft")!;
    const frontArmhole = front.edges.find((edge) => edge.name === "armhole")!;
    const mappedCapStart = transformFlatPoint(edgePoint(capLeft, 0), { ...frontAssembly.transforms.sleeve!, mirrorX: false });
    const frontUnderarm = transformFlatPoint(edgePoint(frontArmhole, 1), { ...frontAssembly.transforms.front!, mirrorX: false });
    const frontShoulder = transformFlatPoint(edgePoint(frontArmhole, 0), { ...frontAssembly.transforms.front!, mirrorX: false });
    expect(Math.hypot(mappedCapStart.x - frontUnderarm.x, mappedCapStart.y - frontUnderarm.y)).toBeLessThan(1e-8);
    expect(Math.hypot(mappedCapStart.x - frontShoulder.x, mappedCapStart.y - frontShoulder.y)).toBeGreaterThan(20);

    const backAssembly = assembleTechnicalFlatRoles("woven-shirt", woven, "BACK_FLAT", projection);
    expect(backAssembly.issues.some((issue) => issue.sourceId === "stitch:Woven sleeve-cap ease")).toBe(false);
    expect(backAssembly.joinedStitchLabels).toContain("Woven sleeve-cap ease");
    const capRight = sleeve.edges.find((edge) => edge.name === "capRight")!;
    const backArmhole = woven.roles.back!.edges.find((edge) => edge.name === "armholeLower")!;
    expect(backAssembly.transforms.sleeve?.mirrorX).toBe(true);
    const mappedBackCapEnd = transformFlatPoint(edgePoint(capRight, 1), { ...backAssembly.transforms.sleeve!,
      mirrorX: backAssembly.transforms.sleeve!.mirrorX ?? false });
    const backUnderarm = transformFlatPoint(edgePoint(backArmhole, 1), { ...backAssembly.transforms.back!,
      mirrorX: backAssembly.transforms.back!.mirrorX ?? false });
    expect(Math.hypot(mappedBackCapEnd.x - backUnderarm.x, mappedBackCapEnd.y - backUnderarm.y)).toBeLessThan(1e-8);

    const staleProjection = { ...projection, faces: projection.faces.map((face) => face.kind !== "FRONT_FLAT" ? face : {
      ...face, roles: face.roles.map((role) => role.roleId !== "sleeve" ? role : {
        ...role, wovenSleeveCapRepresentation: { ...role.wovenSleeveCapRepresentation!, decisionId: "stale" },
      }),
    }) } as unknown as typeof projection;
    const invalid = assembleTechnicalFlatRoles("woven-shirt", woven, "FRONT_FLAT", staleProjection);
    expect(invalid.issues).toContainEqual(expect.objectContaining({ code: "STITCH_ENDPOINT_RESIDUAL",
      sourceId: "stitch:Woven sleeve-cap ease" }));
  });


  it("reflects the selected Tee back sleeve locally so its source side projects outside the back panel", () => {
    const tee = draft(TEE);
    const projection = createG04TechnicalFlatProjectionMap("tee", tee, "tee-back-endpoint-map")!;
    const assembly = assembleTechnicalFlatRoles("tee", tee, "BACK_FLAT", projection);
    const sleeve = tee.roles.sleeve!;
    const back = tee.roles.back!;
    const transform = assembly.transforms.sleeve!;
    expect(transform.mirrorX).toBe(true);
    const capRight = sleeve.edges.find((edge) => edge.name === "capRight")!;
    const armhole = back.edges.find((edge) => edge.name === "armhole")!;
    const sleeveUnderarm = transformFlatPoint(edgePoint(capRight, 1), { ...transform, mirrorX: true });
    const bodyUnderarm = transformFlatPoint(edgePoint(armhole, 1), { ...assembly.transforms.back!, mirrorX: false });
    expect(Math.hypot(sleeveUnderarm.x - bodyUnderarm.x, sleeveUnderarm.y - bodyUnderarm.y)).toBeLessThan(1e-8);
    const sideRight = sleeve.edges.find((edge) => edge.name === "sideRight")!;
    const outerHem = transformFlatPoint(edgePoint(sideRight, 1), { ...transform, mirrorX: true });
    expect(outerHem.x).toBeGreaterThan(bodyUnderarm.x);
  });

  it("rejects a malformed front armhole when endpoint anchoring cannot resolve its curve", () => {
    const tee = draft(TEE);
    const front = tee.roles.front!;
    const armhole = front.edges.find((edge) => edge.name === "armhole")!;
    if (armhole.kind !== "curve") throw new Error("Expected the drafted armhole curve.");
    const malformed = block({ ...tee.roles, front: { ...front, edges: front.edges.map((edge) => edge.name === "armhole"
      ? { kind: "line" as const, name: "armhole", start: armhole.curve.start, end: armhole.curve.end } : edge) } },
    tee.stitches.map((stitch) => stitch.label === "Sleeve-cap ease" ? { ...stitch, ease: { lo: -1, hi: 100 } } : stitch));
    const projection = createG04TechnicalFlatProjectionMap("tee", malformed, "malformed-front-armhole")!;
    expect(assembleTechnicalFlatRoles("tee", malformed, "FRONT_FLAT", projection).issues)
      .toContainEqual(expect.objectContaining({ code: "UNRESOLVED_STITCH_REFERENCE", sourceId: "stitch:Sleeve-cap ease" }));
  });

  it("reports an unsupported recipe", () => {
    expect(assembleTechnicalFlatRoles("unknown", draft(TEE), "FRONT_FLAT").issues[0]?.code)
      .toBe("UNSUPPORTED_RECIPE");
    expect(assembleTechnicalFlatRoles("tee", draft(TEE), "SIDE_FLAT" as unknown as TechnicalFlatViewKind).issues).toEqual([]);
  });

  it("reports absent mapped roles and invalid sewn references", () => {
    const source = draft(TEE);
    const missingRole = block(Object.fromEntries(Object.entries(source.roles).filter(([role]) => role !== "sleeve")), source.stitches);
    expect(assembleTechnicalFlatRoles("tee", missingRole, "FRONT_FLAT").issues[0]?.code).toBe("MISSING_MAPPED_ROLE");
    const invalidStitch = { label: "bad seam", a: iface(edgeRef("front", "absent")), b: iface(edgeRef("sleeve", "capLeft")) };
    const invalidBlock = block(source.roles, [...source.stitches, invalidStitch]);
    expect(assembleTechnicalFlatRoles("tee", invalidBlock, "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ code: "UNRESOLVED_STITCH_REFERENCE", sourceId: "stitch:bad seam" }));
    const missingRoleStitch = { label: "missing role", a: iface(edgeRef("front", "shoulder"), edgeRef("absent", "edge")), b: iface(edgeRef("sleeve", "capLeft")) };
    const missingRoleBlock = block(source.roles, [...source.stitches, missingRoleStitch]);
    expect(assembleTechnicalFlatRoles("tee", missingRoleBlock, "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ sourceId: "stitch:missing role" }));
    const missingMarkStitch = { label: "missing mark", a: iface(edgeRef("front", "shoulder"), markRef("front", "absent", "left")), b: iface(edgeRef("sleeve", "capLeft")) };
    const missingMarkBlock = block(source.roles, [...source.stitches, missingMarkStitch]);
    expect(assembleTechnicalFlatRoles("tee", missingMarkBlock, "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ sourceId: "stitch:missing mark" }));
    const emptyStitch: Stitch = { label: "empty interface", a: iface(), b: iface(edgeRef("sleeve", "capLeft")) };
    const emptyBlock = block(source.roles, [...source.stitches, emptyStitch]);
    expect(assembleTechnicalFlatRoles("tee", emptyBlock, "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ sourceId: "stitch:empty interface" }));
    const incompatible: Stitch = {
      label: "unequal interface", a: iface(edgeRef("front", "shoulder")), b: iface(edgeRef("sleeve", "hem")),
    };
    expect(assembleTechnicalFlatRoles("tee", block(source.roles, [...source.stitches, incompatible]), "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ sourceId: "stitch:unequal interface" }));
    const sleeve = source.roles.sleeve!;
    const malformedSleeve = { ...sleeve, edges: sleeve.edges.map((edge) => edge.name === "capLeft" && edge.kind === "curve"
      ? { ...edge, curve: { ...edge.curve, start: { x: Number.NaN, y: 0 } } } : edge) };
    expect(assembleTechnicalFlatRoles("tee", block({ ...source.roles, sleeve: malformedSleeve }, source.stitches), "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ code: "UNRESOLVED_STITCH_REFERENCE", sourceId: "stitch:Sleeve-cap ease" }));
    const polo = GARMENTS.find((recipe) => recipe.name === "polo")!;
    const poloBlock = draft(polo);
    const pointMark = poloBlock.roles.front!.marks!.find((mark) => "at" in mark)!;
    const pointMarkStitch = { label: "point mark interface", a: iface(markRef("front", pointMark.name, "left")), b: iface(edgeRef("sleeve", "capLeft")) };
    expect(assembleTechnicalFlatRoles("polo", block(poloBlock.roles, [...poloBlock.stitches, pointMarkStitch]), "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ sourceId: "stitch:point mark interface" }));
  });

  it("reports disconnected and contradictory seam placements", () => {
    const source = draft(TEE);
    expect(assembleTechnicalFlatRoles("tee", block(source.roles, []), "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ code: "UNPLACED_COMPONENT_ROLE", sourceId: "sleeve" }));
    const contradictory: Stitch = {
      label: "unsupported alternate sleeve join",
      a: iface(edgeRef("front", "armhole")),
      b: iface(edgeRef("sleeve", "capRight")),
      ease: { lo: -5, hi: 5 },
    };
    const result = assembleTechnicalFlatRoles("tee", block(source.roles, [...source.stitches, contradictory]), "FRONT_FLAT");
    expect(result.issues.some((issue) => issue.code === "INCONSISTENT_STITCH_TRANSFORM")).toBe(true);
  });

  it("reports visible pieces that have no sewn placement", () => {
    const source = draft(TEE);
    expect(assembleTechnicalFlatRoles("tee", block(source.roles, []), "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ code: "UNPLACED_COMPONENT_ROLE", sourceId: "sleeve" }));
  });

  it("maps one closed trouser waistband to discontiguous source intervals on each orthographic face", () => {
    const trouser = draft(TROUSER);
    const waistStitch = trouser.stitches.find((stitch) => stitch.label === "Waistband (four legs ↔ separate waistband)")!;
    expect(waistStitch.a.edges).toEqual([
      { piece: "backLeft", edge: "waist" },
      { piece: "frontLeft", edge: "waist", reversed: true },
      { piece: "frontRight", edge: "waist" },
      { piece: "backRight", edge: "waist", reversed: true },
    ]);
    for (const [kind, roleIds] of [["BACK_FLAT", ["backLeft", "backRight"]], ["FRONT_FLAT", ["frontLeft", "frontRight"]]] as const) {
      const result = assembleTechnicalFlatRoles("trouser", trouser, kind);
      const fragments = result.sourceFragments;
      expect(fragments).toHaveLength(2);
      expect(fragments.map((fragment) => fragment.attachedRoleId)).toEqual(roleIds);
      expect(fragments.every((fragment) => fragment.roleId === "waistband" && fragment.edgeId === "bottom"
        && fragment.stitchLabel === "Waistband (four legs ↔ separate waistband)" )).toBe(true);
      expect(fragments[0]!.sourceInterval[0]).toBeLessThan(fragments[0]!.sourceInterval[1]);
      expect(fragments[1]!.sourceInterval[0]).toBeLessThan(fragments[1]!.sourceInterval[1]);
      const orderedIntervals = fragments.map((fragment) => fragment.sourceInterval).sort((left, right) => left[0] - right[0]);
      if (kind === "BACK_FLAT") expect(orderedIntervals[0]![1]).toBeLessThan(orderedIntervals[1]![0]);
      else expect(orderedIntervals[0]![1]).toBeCloseTo(orderedIntervals[1]![0], 12);
      expect(result.transforms.waistband).toBeUndefined();
      expect(result.issues.some((issue) => issue.sourceId === "stitch:Waistband (four legs ↔ separate waistband)"
        && issue.code === "INCONSISTENT_STITCH_TRANSFORM")).toBe(false);
      for (const fragment of fragments) {
        const bodyEdge = trouser.roles[fragment.attachedRoleId]!.edges.find((edge) => edge.name === fragment.attachedEdgeId)!;
        const bandEdge = trouser.roles.waistband!.edges.find((edge) => edge.name === fragment.edgeId)!;
        const ref = waistStitch.a.edges.find((candidate) => "edge" in candidate && candidate.piece === fragment.attachedRoleId)!;
        const bodyPoint = edgePoint(bodyEdge, "edge" in ref && ref.reversed ? 0 : 1);
        const bandPoint = edgePoint(bandEdge, fragment.sourceInterval[0]);
        const placedBand = transformFlatPoint(bandPoint, { ...fragment.transform, mirrorX: false });
        expect(Math.hypot(bodyPoint.x - placedBand.x, bodyPoint.y - placedBand.y)).toBeLessThan(1e-8);
      }
      expect(result.transforms[roleIds[0]!]).toBeDefined();
      expect(result.transforms[roleIds[1]!]).toBeDefined();
    }
  });

  it("fails closed when the exact zero-ease waistband source relation is missing or malformed", () => {
    const source = draft(TROUSER);
    const waist = source.stitches.find((stitch) => stitch.label === "Waistband (four legs ↔ separate waistband)")!;
    const noFragments = (candidate: typeof source) => assembleTechnicalFlatRoles("trouser", candidate, "BACK_FLAT").sourceFragments;
    expect(noFragments(block(source.roles, source.stitches.filter((stitch) => stitch !== waist)))).toEqual([]);
    expect(noFragments(block(source.roles, [...source.stitches, waist]))).toEqual([]);
    expect(noFragments(block(source.roles, source.stitches.map((stitch) => stitch === waist ? { ...stitch, ease: { lo: 0, hi: 1 } } : stitch)))).toEqual([]);
    expect(noFragments(block(source.roles, source.stitches.map((stitch) => stitch === waist
      ? { ...stitch, a: iface(...stitch.a.edges.slice(0, 3)) } : stitch)))).toEqual([]);
    expect(noFragments(block(source.roles, source.stitches.map((stitch) => stitch === waist
      ? { ...stitch, b: iface(edgeRef("waistband", "top")) } : stitch)))).toEqual([]);
    expect(noFragments(block(source.roles, source.stitches.map((stitch) => stitch === waist
      ? { ...stitch, b: iface(edgeRef("waistband", "bottom", true)) } : stitch)))).toEqual([]);
    expect(noFragments(block(source.roles, source.stitches.map((stitch) => stitch === waist
      ? { ...stitch, a: iface(edgeRef("backRight", "waist"), ...stitch.a.edges.slice(1)) } : stitch)))).toEqual([]);

    const band = source.roles.waistband!;
    const missingBand = { ...source.roles, waistband: { ...band, edges: band.edges.filter((edge) => edge.name !== "bottom") } };
    expect(noFragments(block(missingBand, source.stitches))).toEqual([]);
    const curvedBand = { ...source.roles, waistband: { ...band, edges: band.edges.map((edge) => edge.name === "bottom" && edge.kind === "line"
      ? { kind: "curve" as const, name: edge.name, curve: { start: edge.start, control1: edge.start, control2: edge.end, end: edge.end } } : edge) } };
    expect(noFragments(block(curvedBand, source.stitches))).toEqual([]);
    const tooLongBand = { ...source.roles, waistband: { ...band, edges: band.edges.map((edge) => edge.name === "bottom" && edge.kind === "line"
      ? { ...edge, end: { ...edge.end, x: edge.end.x - 1 } } : edge) } };
    expect(noFragments(block(tooLongBand, source.stitches))).toEqual([]);
    const nonFiniteBand = { ...source.roles, waistband: { ...band, edges: band.edges.map((edge) => edge.name === "bottom" && edge.kind === "line"
      ? { ...edge, end: { ...edge.end, x: Number.NaN } } : edge) } };
    expect(noFragments(block(nonFiniteBand, source.stitches))).toEqual([]);
    const curvedWaist = { ...source.roles, backLeft: { ...source.roles.backLeft!, edges: source.roles.backLeft!.edges.map((edge) => edge.name === "waist" && edge.kind === "line"
      ? { kind: "curve" as const, name: edge.name, curve: { start: edge.start, control1: edge.start, control2: edge.end, end: edge.end } } : edge) } };
    expect(noFragments(block(curvedWaist, source.stitches))).toEqual([]);
    const missingWaist = { ...source.roles, backLeft: { ...source.roles.backLeft!, edges: source.roles.backLeft!.edges.filter((edge) => edge.name !== "waist") } };
    expect(noFragments(block(missingWaist, source.stitches))).toEqual([]);
    const nonFiniteWaist = { ...source.roles, backLeft: { ...source.roles.backLeft!, edges: source.roles.backLeft!.edges.map((edge) => edge.name === "waist" && edge.kind === "line"
      ? { ...edge, end: { ...edge.end, y: Number.NaN } } : edge) } };
    expect(noFragments(block(nonFiniteWaist, source.stitches))).toEqual([]);
    const farWaist = { ...source.roles, backLeft: { ...source.roles.backLeft!, edges: source.roles.backLeft!.edges.map((edge) => edge.name === "waist" && edge.kind === "line"
      ? { ...edge, start: { x: edge.start.x + 1e16, y: edge.start.y }, end: { x: edge.end.x + 1e16, y: edge.end.y } } : edge) } };
    expect(noFragments(block(farWaist, source.stitches))).toEqual([]);
    const sourceWaistEdges = waist.a.edges.map((ref) => {
      if (!("edge" in ref)) throw new Error("Expected edge reference in Trouser waist stitch.");
      return source.roles[ref.piece]!.edges.find((edge) => edge.name === ref.edge)!;
    });
    const sourceTotal = sourceWaistEdges.reduce((sum, edge) => {
      const start = edgePoint(edge, 0);
      const end = edgePoint(edge, 1);
      return sum + Math.hypot(end.x - start.x, end.y - start.y);
    }, 0);
    const roundedWidth = Math.round(sourceTotal / 2) * 2;
    const bandAtPrecisionLimit = { ...source.roles, waistband: { ...band, edges: band.edges.map((edge) => edge.name === "bottom" && edge.kind === "line"
      ? { ...edge, start: { x: 1e16 + roundedWidth, y: 0 }, end: { x: 1e16, y: 0 } } : edge) },
      backLeft: { ...source.roles.backLeft!, edges: source.roles.backLeft!.edges.map((edge) => {
        if (edge.name !== "waist" || edge.kind !== "line") return edge;
        const length = Math.hypot(edge.end.x - edge.start.x, edge.end.y - edge.start.y);
        const adjustment = roundedWidth - sourceTotal;
        return { ...edge, end: { x: edge.end.x + (edge.end.x - edge.start.x) / length * adjustment,
          y: edge.end.y + (edge.end.y - edge.start.y) / length * adjustment } };
      }) } };
    expect(noFragments(block(bandAtPrecisionLimit, source.stitches))).toEqual([]);
  });

  it("keeps source intervals and rigid attachments valid at every Trouser option endpoint", () => {
    for (const option of TROUSER_OPTION_DEFINITIONS) {
      for (const value of [option.min, option.max]) {
        const options = { ...defaultGarmentOptions(TROUSER_OPTION_DEFINITIONS), [option.id]: value };
        const source = TROUSER.draft(STANDARD_M, options);
        const stitch = source.stitches.find((candidate) => candidate.label === "Waistband (four legs ↔ separate waistband)")!;
        const waistLengths = stitch.a.edges.map((ref) => {
          if (!("edge" in ref)) throw new Error("Expected edge reference in Trouser waist stitch.");
          const edge = source.roles[ref.piece]!.edges.find((candidate) => candidate.name === ref.edge)!;
          const start = edgePoint(edge, ref.reversed ? 1 : 0);
          const end = edgePoint(edge, ref.reversed ? 0 : 1);
          return Math.hypot(end.x - start.x, end.y - start.y);
        });
        const totalWaist = waistLengths.reduce((sum, length) => sum + length, 0);
        for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
          const result = assembleTechnicalFlatRoles("trouser", source, kind);
          expect(result.sourceFragments, `${option.id}=${value}.${kind}`).toHaveLength(2);
          expect(result.sourceFragments.every((fragment) => fragment.sourceInterval[0] >= 0
            && fragment.sourceInterval[1] <= 1 && fragment.sourceInterval[0] < fragment.sourceInterval[1]
            && Number.isFinite(fragment.transform.offset.x) && Number.isFinite(fragment.transform.offset.y)
            && Number.isFinite(fragment.transform.rotationDegrees))).toBe(true);
          for (const fragment of result.sourceFragments) {
            const index = stitch.a.edges.findIndex((ref) => "edge" in ref && ref.piece === fragment.attachedRoleId);
            const prefix = waistLengths.slice(0, index).reduce((sum, length) => sum + length, 0);
            expect(fragment.sourceInterval[0]).toBeCloseTo(1 - (prefix + waistLengths[index]!) / totalWaist, 12);
            expect(fragment.sourceInterval[1]).toBeCloseTo(1 - prefix / totalWaist, 12);
          }
        }
      }
    }
  });

  it("keeps Woven stand placement but suppresses only the approved base-seam residual", () => {
    const woven = GARMENTS.find((recipe) => recipe.name === "woven-shirt")!;
    const source = draft(woven);
    const map = createG04TechnicalFlatProjectionMap("woven-shirt", source, "assembly-test-r1")!;
    const result = assembleTechnicalFlatRoles("woven-shirt", source, "FRONT_FLAT", map);
    expect(result.transforms.outerStand).toBeDefined();
    expect(result.transforms.upperCollar).toBeDefined();
    expect(result.issues.some((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL"
      && issue.sourceId === "stitch:Outer stand ↔ woven neckline")).toBe(false);
    expect(result.issues.some((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL"
      && issue.sourceId === "stitch:Woven sleeve-cap ease")).toBe(false);
    const malformed = structuredClone(map);
    (malformed.faces[0]!.roles.find((role) => role.roleId === "outerStand")!.viewSeamRepresentation as { decisionId: string }).decisionId = "unapproved";
    const rejected = assembleTechnicalFlatRoles("woven-shirt", source, "FRONT_FLAT", malformed);
    expect(rejected.issues.some((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL"
      && issue.sourceId === "stitch:Outer stand ↔ woven neckline")).toBe(true);
  });
});

function edgePoint(edge: Edge, fraction: number): { x: number; y: number } {
  if (edge.kind === "line") return {
    x: edge.start.x + (edge.end.x - edge.start.x) * fraction,
    y: edge.start.y + (edge.end.y - edge.start.y) * fraction,
  };
  return cubicPoint(edge.curve, fraction);
}
