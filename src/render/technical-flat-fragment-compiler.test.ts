import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, TROUSER_OPTION_DEFINITIONS, defaultGarmentOptions, type Block } from "../drafting";
import { assembleTechnicalFlatRoles, type FlatRoleTransform, type TechnicalFlatSourceFragment } from "./technical-flat-assembly";
import { compileTrouserWaistbandFragments } from "./technical-flat-fragment-compiler";

const recipe = GARMENTS.find((candidate) => candidate.name === "trouser")!;
const defaultOptions = defaultGarmentOptions(TROUSER_OPTION_DEFINITIONS);
const draft = (options: typeof defaultOptions = defaultOptions) => recipe.draft(STANDARD_M, options);
const assembled = (block: Block, kind: "FRONT_FLAT" | "BACK_FLAT") => assembleTechnicalFlatRoles("trouser", block, kind);
const compile = (block: Block, kind: "FRONT_FLAT" | "BACK_FLAT", placements?: Readonly<Record<string, FlatRoleTransform>>,
  fragments?: readonly TechnicalFlatSourceFragment[]) => {
  const assembly = assembled(block, kind);
  return compileTrouserWaistbandFragments(block, "revision-s307", kind,
    fragments ?? assembly.sourceFragments, placements ?? assembly.transforms);
};

describe("compileTrouserWaistbandFragments", () => {
  it("emits exact revision-bound back top, side, closure, and mark geometry for the single source band", () => {
    const block = draft();
    const result = compile(block, "BACK_FLAT");
    expect(result.issues).toEqual([]);
    expect(result.primitives).toHaveLength(6);
    expect(result.primitives.every((primitive) => primitive.source.revisionId === "revision-s307")).toBe(true);
    expect(result.primitives.filter((primitive) => primitive.kind === "path").map((primitive) => primitive.source.sourceId))
      .toContain("pattern:trouser:role:waistband:edge:top");
    expect(result.primitives.filter((primitive) => primitive.kind === "path" && primitive.layer === "CLOSURE"))
      .toMatchObject([{ id: "live-flat:trouser:BACK_FLAT:waistband:center-back-closure",
        source: { sourceId: "pattern:trouser:role:waistband:edge:endLeft", revisionId: "revision-s307" },
        commands: [{ op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 0, y: -4 } }] }]);
    expect(result.primitives.filter((primitive) => primitive.kind === "path" && primitive.source.sourceId.startsWith("view:")))
      .toHaveLength(2);
    expect(result.primitives.filter((primitive) => primitive.kind === "mark")).toMatchObject([
      { markName: "centerBack", at: { x: 0, y: -2 }, source: { revisionId: "revision-s307" } },
    ]);
    expect(new Set(result.primitives.map((primitive) => primitive.id)).size).toBe(result.primitives.length);
  });

  it("retains the current front hold when the two mapped halves do not join at center front", () => {
    const result = compile(draft(), "FRONT_FLAT");
    expect(result.primitives).toEqual([]);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "UNRESOLVED_FRAGMENT_JOIN",
      sourceId: "view:trouser:waistband:center-front" }));
  });

  it("compiles the back fragments at every declared Trouser option endpoint", () => {
    for (const option of TROUSER_OPTION_DEFINITIONS) {
      for (const value of [option.min, option.max]) {
        const result = compile(draft({ ...defaultOptions, [option.id]: value }), "BACK_FLAT");
        expect(result.issues, `${option.id}=${value}`).toEqual([]);
        expect(result.primitives).toHaveLength(6);
      }
    }
  });

  it("rejects a missing, open, or non-finite waistband outline", () => {
    const source = draft();
    const missing = { ...source.roles.waistband!, edges: source.roles.waistband!.edges.filter((edge) => edge.name !== "endRight") };
    expect(compile({ ...source, roles: { ...source.roles, waistband: missing } }, "BACK_FLAT").issues[0]?.code)
      .toBe("INVALID_FRAGMENT_SOURCE");
    const open = { ...source.roles.waistband!, edges: source.roles.waistband!.edges.map((edge) => edge.name === "endRight"
      && edge.kind === "line" ? { ...edge, end: { ...edge.end, y: edge.end.y + 1 } } : edge) };
    expect(compile({ ...source, roles: { ...source.roles, waistband: open } }, "BACK_FLAT").issues[0]?.code)
      .toBe("INVALID_FRAGMENT_SOURCE");
    const nonFinite = { ...source.roles.waistband!, edges: source.roles.waistband!.edges.map((edge) => edge.name === "top"
      && edge.kind === "line" ? { ...edge, end: { ...edge.end, x: Number.NaN } } : edge) };
    expect(compile({ ...source, roles: { ...source.roles, waistband: nonFinite } }, "BACK_FLAT").issues[0]?.code)
      .toBe("INVALID_FRAGMENT_SOURCE");
    expect(compile(source, "BACK_FLAT", undefined, []).issues[0]?.code).toBe("INVALID_FRAGMENT_SOURCE");
    expect(compile(source, "BACK_FLAT", undefined, assembled(source, "BACK_FLAT").sourceFragments.slice(0, 1)).issues[0]?.code)
      .toBe("INVALID_FRAGMENT_SOURCE");
    const curved = { ...source.roles.waistband!, edges: source.roles.waistband!.edges.map((edge) => edge.name === "top" && edge.kind === "line"
      ? { kind: "curve" as const, name: edge.name, curve: { start: edge.start, control1: edge.start, control2: edge.end, end: edge.end } } : edge) };
    expect(compile({ ...source, roles: { ...source.roles, waistband: curved } }, "BACK_FLAT").issues[0]?.code)
      .toBe("INVALID_FRAGMENT_SOURCE");
    expect(compile(source, "BACK_FLAT", undefined, []).issues[0]?.code).toBe("INVALID_FRAGMENT_SOURCE");
    expect(compileTrouserWaistbandFragments(source, " ", "BACK_FLAT", assembled(source, "BACK_FLAT").sourceFragments,
      assembled(source, "BACK_FLAT").transforms).issues[0]?.code).toBe("INVALID_FRAGMENT_SOURCE");
  });

  it("requires the exact unique zero-ease ordered waist interface", () => {
    const source = draft();
    const waist = source.stitches.find((stitch) => stitch.label === "Waistband (four legs ↔ separate waistband)")!;
    const fragments = assembled(source, "BACK_FLAT").sourceFragments;
    const invalid = [
      { ...source, stitches: source.stitches.filter((stitch) => stitch !== waist) },
      { ...source, stitches: [...source.stitches, waist] },
      { ...source, stitches: source.stitches.map((stitch) => stitch === waist ? { ...stitch, ease: { lo: 0, hi: 1 } } : stitch) },
      { ...source, stitches: source.stitches.map((stitch) => stitch === waist ? { ...stitch, a: { edges: stitch.a.edges.slice(0, 3) } } : stitch) },
      { ...source, stitches: source.stitches.map((stitch) => stitch === waist ? { ...stitch, b: { edges: [{ piece: "waistband", edge: "top" }] } } : stitch) },
      { ...source, stitches: source.stitches.map((stitch) => stitch === waist ? { ...stitch,
        b: { edges: [{ piece: "waistband", edge: "bottom", reversed: true }] } } : stitch) },
      { ...source, stitches: source.stitches.map((stitch) => stitch === waist ? { ...stitch,
        a: { edges: [{ piece: "backRight", edge: "waist" }, ...stitch.a.edges.slice(1)] } } : stitch) },
      { ...source, stitches: source.stitches.map((stitch) => stitch === waist ? { ...stitch,
        a: { edges: [{ piece: "backLeft", mark: "not-an-edge", side: "left" }, ...stitch.a.edges.slice(1)] } } : stitch) },
    ] as unknown as Block[];
    for (const candidate of invalid) expect(compile(candidate, "BACK_FLAT", undefined, fragments).issues[0]?.code)
      .toBe("INVALID_FRAGMENT_SOURCE");
    const noPanelWaist = { ...source, roles: { ...source.roles, backLeft: { ...source.roles.backLeft!,
      edges: source.roles.backLeft!.edges.filter((edge) => edge.name !== "waist") } } };
    expect(compile(noPanelWaist, "BACK_FLAT", undefined, fragments).issues[0]?.code).toBe("INVALID_FRAGMENT_SOURCE");
    const zeroWaist = { ...source, roles: { ...source.roles, backLeft: { ...source.roles.backLeft!, edges:
      source.roles.backLeft!.edges.map((edge) => edge.name === "waist" && edge.kind === "line"
        ? { ...edge, end: { ...edge.start } } : edge) } } };
    expect(compile(zeroWaist, "BACK_FLAT", undefined, fragments).issues[0]?.code).toBe("INVALID_FRAGMENT_SOURCE");
    const infiniteWaist = { ...source, roles: { ...source.roles, backLeft: { ...source.roles.backLeft!, edges:
      source.roles.backLeft!.edges.map((edge) => edge.name === "waist" && edge.kind === "line"
        ? { ...edge, start: { x: -1e308, y: 0 }, end: { x: 1e308, y: 0 } } : edge) } } };
    expect(compile(infiniteWaist, "BACK_FLAT", undefined, fragments).issues[0]?.code).toBe("INVALID_FRAGMENT_SOURCE");
    const unequalInterface = { ...source, roles: { ...source.roles, backLeft: { ...source.roles.backLeft!, edges:
      source.roles.backLeft!.edges.map((edge) => edge.name === "waist" && edge.kind === "line"
        ? { ...edge, end: { ...edge.end, x: edge.end.x + 1 } } : edge) } } };
    expect(compile(unequalInterface, "BACK_FLAT", undefined, fragments).issues[0]?.code).toBe("INVALID_FRAGMENT_SOURCE");
    const overflowingTotal = { ...source, roles: Object.fromEntries(Object.entries(source.roles).map(([roleId, panel]) => {
      if (!roleId.startsWith("back")) return [roleId, panel];
      return [roleId, { ...panel, edges: panel.edges.map((edge) => edge.name === "waist" && edge.kind === "line"
        ? { ...edge, start: { x: -5e307, y: 0 }, end: { x: 5e307, y: 0 } } : edge) }];
    })) } as Block;
    expect(compile(overflowingTotal, "BACK_FLAT", undefined, fragments).issues[0]?.code).toBe("INVALID_FRAGMENT_SOURCE");
    const missingRole = fragments.map((fragment) => fragment.attachedRoleId === "backLeft"
      ? { ...fragment, attachedRoleId: "missing" } : fragment);
    expect(compile(source, "BACK_FLAT", undefined, missingRole).issues[0]?.code).toBe("INVALID_FRAGMENT_SOURCE");
    const missingFront = assembled(source, "FRONT_FLAT").sourceFragments.map((fragment) => fragment.attachedRoleId === "frontLeft"
      ? { ...fragment, attachedRoleId: "missing" } : fragment);
    expect(compile(source, "FRONT_FLAT", undefined, missingFront).issues[0]?.message).toContain("frontLeft and frontRight");
  });

  it("rejects incorrect interval identity, duplicate fragments, and missing panel transforms", () => {
    const source = draft();
    const fragments = assembled(source, "BACK_FLAT").sourceFragments;
    const badInterval = fragments.map((fragment) => fragment.attachedRoleId === "backLeft"
      ? { ...fragment, sourceInterval: [0.7, 1] as const } : fragment);
    expect(compile(source, "BACK_FLAT", undefined, badInterval).issues[0]?.code).toBe("INVALID_FRAGMENT_SOURCE");
    expect(compile(source, "BACK_FLAT", undefined, [fragments[0]!, { ...fragments[1]!, id: fragments[0]!.id }]).issues[0]?.code)
      .toBe("INVALID_FRAGMENT_SOURCE");
    const missingPanel = { ...assembled(source, "BACK_FLAT").transforms };
    delete (missingPanel as Record<string, FlatRoleTransform>).backRight;
    expect(compile(source, "BACK_FLAT", missingPanel).issues[0]?.code).toBe("INVALID_FRAGMENT_SOURCE");
    const wrongRole = fragments.map((fragment) => fragment.attachedRoleId === "backLeft"
      ? { ...fragment, roleId: "front" } : fragment);
    expect(compile(source, "BACK_FLAT", undefined, wrongRole).issues[0]?.code).toBe("INVALID_FRAGMENT_SOURCE");
    const wrongStitch = fragments.map((fragment) => fragment.attachedRoleId === "backLeft"
      ? { ...fragment, stitchLabel: "other" } : fragment);
    expect(compile(source, "BACK_FLAT", undefined, wrongStitch).issues[0]?.code).toBe("INVALID_FRAGMENT_SOURCE");
  });

  it("fails closed for panel attachment mismatch, bad transforms, and unmatched center-back ends", () => {
    const source = draft();
    const placements = { ...assembled(source, "BACK_FLAT").transforms,
      backRight: { offset: { x: 0, y: 0 }, rotationDegrees: Number.NaN } };
    expect(compile(source, "BACK_FLAT", placements).issues[0]?.code).toBe("UNRESOLVED_FRAGMENT_ATTACHMENT");
    const movedRight = { ...assembled(source, "BACK_FLAT").transforms,
      backRight: { offset: { x: 0.01, y: 0 }, rotationDegrees: 0 } };
    expect(compile(source, "BACK_FLAT", movedRight).issues[0]?.code).toBe("UNRESOLVED_FRAGMENT_CLOSURE");
    const rotatedBack = { ...assembled(source, "BACK_FLAT").transforms,
      backLeft: { offset: { x: 0, y: -4 }, rotationDegrees: 180 },
      backRight: { offset: { x: 0, y: -4 }, rotationDegrees: 180 } };
    expect(compile(source, "BACK_FLAT", rotatedBack).issues).toEqual([]);
  });

  it("withholds top geometry if a finite source edge overflows while its attachment remains placeable", () => {
    const source = draft();
    const band = source.roles.waistband!;
    const alteredBand = { ...band, edges: band.edges.map((edge) => {
      if (edge.name === "top" && edge.kind === "line") return { ...edge, start: { x: edge.start.x, y: 1e308 }, end: { x: edge.end.x, y: 1e308 } };
      if (edge.name === "endLeft" && edge.kind === "line") return { ...edge, end: { ...edge.end, y: 1e308 } };
      if (edge.name === "endRight" && edge.kind === "line") return { ...edge, start: { ...edge.start, y: 1e308 } };
      return edge;
    }) };
    const backLeft = { ...source.roles.backLeft!, edges: source.roles.backLeft!.edges.map((edge) => edge.name === "waist" && edge.kind === "line"
      ? { ...edge, start: { ...edge.start, y: 1e308 }, end: { ...edge.end, y: 1e308 } } : edge) };
    const changed = { ...source, roles: { ...source.roles, waistband: alteredBand, backLeft } };
    const assembly = assembled(changed, "BACK_FLAT");
    const fragments = assembly.sourceFragments.map((fragment) => fragment.attachedRoleId === "backLeft"
      ? { ...fragment, transform: { ...fragment.transform, offset: { ...fragment.transform.offset, y: 1e308 } } } : fragment);
    const result = compile(changed, "BACK_FLAT", assembly.transforms, fragments);
    expect(result.primitives).toEqual([]);
    expect(result.issues[0]?.code).toBe("UNRESOLVED_FRAGMENT_ATTACHMENT");
  });

  it("emits front button marks only if the source fragments share the same assembled junction", () => {
    const source = draft();
    const frontTransforms = { ...assembled(source, "FRONT_FLAT").transforms,
      frontRight: { offset: { x: 0, y: 0 }, rotationDegrees: 0 } };
    const result = compile(source, "FRONT_FLAT", frontTransforms);
    expect(result.issues).toEqual([]);
    const marks = result.primitives.filter((primitive) => primitive.kind === "mark");
    expect(marks.map((primitive) => primitive.kind === "mark" ? primitive.markName : "")).toEqual(["centerFront", "waistbandButton"]);
    expect(marks[0]).toMatchObject({ kind: "mark", at: { x: 0, y: expect.closeTo(2) } });
    expect(marks[1]).toMatchObject({ kind: "mark", markKind: "button", feature: "closure", layer: "CLOSURE",
      at: { x: 0, y: expect.closeTo(2) } });
  });

  it("keeps malformed or conflicting marks explicit", () => {
    const source = draft();
    const frontTransforms = { ...assembled(source, "FRONT_FLAT").transforms,
      frontRight: { offset: { x: 0, y: 0 }, rotationDegrees: 0 } };
    const band = source.roles.waistband!;
    const outOfStrip = { ...band, marks: band.marks!.map((mark) => mark.name === "waistbandButton" && "at" in mark
      ? { ...mark, at: { ...mark.at, y: 8 } } : mark) };
    expect(compile({ ...source, roles: { ...source.roles, waistband: outOfStrip } }, "FRONT_FLAT", frontTransforms).issues)
      .toContainEqual(expect.objectContaining({ code: "UNRESOLVED_FRAGMENT_MARK" }));
    const outOfLength = { ...band, marks: band.marks!.map((mark) => mark.name === "waistbandButton" && "at" in mark
      ? { ...mark, at: { x: 100, y: mark.at.y } } : mark) };
    expect(compile({ ...source, roles: { ...source.roles, waistband: outOfLength } }, "FRONT_FLAT", frontTransforms).issues)
      .toContainEqual(expect.objectContaining({ code: "UNRESOLVED_FRAGMENT_MARK", message: expect.stringContaining("outside") }));
    const lineMark = { ...band, marks: [{ kind: "placementLine" as const, name: "edge-guide", start: { x: 47, y: 0 }, end: { x: 47, y: 4 } }] };
    expect(compile({ ...source, roles: { ...source.roles, waistband: lineMark } }, "BACK_FLAT").issues)
      .toContainEqual(expect.objectContaining({ code: "UNRESOLVED_FRAGMENT_MARK", sourceId: "pattern:trouser:mark:waistband:edge-guide" }));
    const duplicate = { ...band, marks: [...band.marks!, band.marks![0]!] };
    expect(compile({ ...source, roles: { ...source.roles, waistband: duplicate } }, "BACK_FLAT").issues)
      .toContainEqual(expect.objectContaining({ code: "UNRESOLVED_FRAGMENT_MARK", message: expect.stringContaining("duplicated") }));
    const missingMarks = { ...band, marks: undefined };
    expect(compile({ ...source, roles: { ...source.roles, waistband: missingMarks } }, "BACK_FLAT").issues).toEqual([]);
  });
});
