import { describe, expect, it } from "vitest";
import { GARMENTS, TEE, TROUSER } from "../drafting/recipe";
import { STANDARD_M } from "../drafting/measurements";
import { block } from "../drafting/block";
import { defaultGarmentOptions } from "../drafting/options";
import { edgeRef, iface, markRef, type Stitch } from "../drafting/stitch";
import type { Edge } from "../drafting/piece";
import { assembleTechnicalFlatRoles } from "./technical-flat-assembly";
import type { TechnicalFlatViewKind } from "./technical-flat";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";
import { cubicPoint } from "../geometry";
import { transformFlatPoint } from "./technical-flat-transform";

const draft = (recipe: typeof GARMENTS[number]) => recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));

describe("assembleTechnicalFlatRoles", () => {
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

  it("surfaces the default trouser back waistband cycle conflict without losing role transforms", () => {
    const trouser = draft(TROUSER);
    const waistStitch = trouser.stitches.find((stitch) => stitch.label === "Waistband (four legs ↔ separate waistband)")!;
    expect(waistStitch.a.edges).toEqual([
      { piece: "backLeft", edge: "waist" },
      { piece: "frontLeft", edge: "waist", reversed: true },
      { piece: "frontRight", edge: "waist" },
      { piece: "backRight", edge: "waist", reversed: true },
    ]);
    const result = assembleTechnicalFlatRoles("trouser", trouser, "BACK_FLAT");
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "INCONSISTENT_STITCH_TRANSFORM", sourceId: "stitch:Waistband (four legs ↔ separate waistband)",
    }));
    expect(result.transforms.waistband).toBeDefined();
    expect(result.transforms.backLeft).toBeDefined();
    expect(result.transforms.backRight).toBeDefined();
  });

  it("keeps a woven collar placed and reports residual seam endpoints", () => {
    const woven = GARMENTS.find((recipe) => recipe.name === "woven-shirt")!;
    const result = assembleTechnicalFlatRoles("woven-shirt", draft(woven), "FRONT_FLAT");
    expect(result.transforms.outerStand).toBeDefined();
    expect(result.transforms.upperCollar).toBeDefined();
    expect(result.issues.some((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL")).toBe(true);
  });
});

function edgePoint(edge: Edge, fraction: number): { x: number; y: number } {
  if (edge.kind === "line") return {
    x: edge.start.x + (edge.end.x - edge.start.x) * fraction,
    y: edge.start.y + (edge.end.y - edge.start.y) * fraction,
  };
  return cubicPoint(edge.curve, fraction);
}
