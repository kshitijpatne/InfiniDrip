import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, TROUSER_OPTION_DEFINITIONS, defaultGarmentOptions } from "../drafting";
import { TECHNICAL_FLAT_SCHEMA_VERSION, type TechnicalFlatPrimitive, type TechnicalFlatView } from "./technical-flat";
import { compileTechnicalFlatLiveView } from "./technical-flat-live";
import {
  createBrowserTechnicalFlatTextMeasurer,
  renderTechnicalFlatSvg,
  type TechnicalFlatMeasureText,
} from "./technical-flat-svg";

interface SvgXmlParser { parseFromString(source: string, mimeType: string): Document }
interface JSDOMInstance { window: { DOMParser: new () => SvgXmlParser } }
const JSDOM = createRequire(import.meta.url)("jsdom").JSDOM as new (options?: { url: string }) => JSDOMInstance;

const revisionId = "revision-271";
const source = { sourceClass: "PATTERN_DERIVED" as const, sourceId: "pattern:tee:role:front", revisionId };
const outline: TechnicalFlatPrimitive = {
  kind: "path", id: "outline", layer: "GARMENT_SILHOUETTE", feature: "silhouette", source,
  commands: [
    { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 12, y: 0 } },
    { op: "cubic", control1: { x: 14, y: 2 }, control2: { x: 14, y: 8 }, point: { x: 12, y: 10 } },
    { op: "line", point: { x: 0, y: 10 } }, { op: "close" },
  ],
};

const makeView = (primitives: readonly TechnicalFlatPrimitive[] = [outline], notices: TechnicalFlatView["notices"] = []): TechnicalFlatView => ({
  schemaVersion: TECHNICAL_FLAT_SCHEMA_VERSION, viewId: "tee-front-flat", revisionId, recipeId: "tee",
  kind: "FRONT_FLAT", units: "cm", primitives, notices,
});

const measure: TechnicalFlatMeasureText = (text, fontSizeCm) => ({
  widthCm: text.length * fontSizeCm * 0.35, ascentCm: fontSizeCm * 0.7, descentCm: fontSizeCm * 0.2,
});

describe("renderTechnicalFlatSvg", () => {
  it("emits parseable, ordered, revision-bound geometry, labels, colorway and visible wrapped notices", () => {
    const primitives: TechnicalFlatPrimitive[] = [
      { ...outline, kind: "path", layer: "GARMENT_SILHOUETTE" },
      { ...outline, id: "unmapped-outline", source: { ...source, sourceId: "pattern:tee:unmapped" } },
      { kind: "path", id: "mark-line", layer: "CONSTRUCTION", feature: "pocket", source,
        commands: [{ op: "move", point: { x: 3, y: 3 } }, { op: "line", point: { x: 8, y: 3 } }],
        patternMark: { kind: "placementLine", name: "pocket placement", label: "Pocket position" } },
      { kind: "mark", id: "button", layer: "CLOSURE", feature: "closure", source,
        markKind: "button", markName: "front button", at: { x: 2, y: 4 }, label: "Button" },
      { kind: "circle", id: "eyelet", layer: "CLOSURE", feature: "closure", source,
        center: { x: 2, y: 5 }, radius: 0.2 },
      { kind: "text", id: "note", layer: "ANNOTATION", feature: "annotation", source,
        at: { x: 3, y: 8 }, text: "Front panel" },
      { kind: "artwork", id: "art", layer: "ARTWORK", feature: "artwork", source: { ...source, sourceClass: "USER_REFERENCE", sourceId: "style:artwork:chest" },
        artworkKind: "print", placementId: "chest", assetId: "asset-chest", sourceName: "Chest art", targetRoleId: "front",
        widthCm: 3, heightCm: 2, transform: { dx: 5, dy: 5, scale: 1.2, rotationDegrees: 15 }, zOrder: 4 },
      { kind: "callout", id: "pom", layer: "CALLOUT", feature: "pom", source,
        text: "Chest: 10 cm", anchor: { primitiveId: "outline", point: { x: 5, y: 4 } }, labelAt: { x: 17, y: 5 } },
    ];
    const notices = [
      { id: "source-gap", feature: "seam" as const, reason: "SOURCE_NOT_REPRESENTED" as const,
        sourceId: "stitch:side seam", message: "Side seam visibility is unresolved in this drafted source and needs a construction review. ".repeat(8) },
      { id: "general-gap", feature: "annotation" as const, reason: "VIEW_MAPPING_MISSING" as const,
        message: "An optional source has no mapped view." },
    ];
    const result = renderTechnicalFlatSvg(makeView(primitives, notices), {
      measureText: measure,
      colorway: { id: "fabric", revisionId, colorHex: "#3669a4", texture: "woven", shine: 24,
        targetRoleIds: ["front"], sourceId: "style:fabric-presentation" },
      title: "Tee technical flat",
    });
    expect(result.issues).toEqual([]);
    expect(result.svg).not.toBeNull();
    const doc = new JSDOM({ url: "https://technical-flat.test/" }).window;
    const parsed = new doc.DOMParser().parseFromString(result.svg!, "image/svg+xml");
    expect(parsed.querySelector("parsererror")).toBeNull();
    const svg = parsed.documentElement;
    expect(svg.getAttribute("data-revision-id")).toBe(revisionId);
    expect(svg.getAttribute("data-colorway-revision")).toBe(revisionId);
    expect(Number(svg.getAttribute("viewBox")!.split(" ")[2])).toBeGreaterThan(30);
    expect(svg.querySelector("[data-technical-flat-paper]")?.getAttribute("fill")).toBe("#fff");
    const silhouette = svg.querySelector("g[data-layer-group='GARMENT_SILHOUETTE']");
    const colorwayAreaGroup = silhouette?.firstElementChild;
    expect(colorwayAreaGroup?.getAttribute("data-colorway-area-group")).toBe("fabric");
    expect(colorwayAreaGroup?.getAttribute("opacity")).toBe("0.16");
    expect([...svg.querySelectorAll("g[data-layer-group]")].map((group) => group.getAttribute("data-layer-group")))
      .toEqual(["GARMENT_SILHOUETTE", "ARTWORK", "SEAM", "CONSTRUCTION", "DART", "PLEAT", "CLOSURE", "TOPSTITCH", "CALLOUT", "ANNOTATION", "TEXT_LABELS", "SOURCE_NOTICES"]);
    const fill = svg.querySelector('[data-colorway-fill-for="outline"]');
    expect(fill?.getAttribute("fill")).toBe("#3669a4");
    expect(fill?.parentElement).toBe(colorwayAreaGroup);
    expect(fill?.getAttribute("fill-opacity")).toBeNull();
    expect(fill?.getAttribute("stroke")).toBe("none");
    expect(svg.querySelector('[data-entity-id="outline"]')?.getAttribute("fill")).toBe("none");
    expect(svg.querySelector('[data-entity-id="outline"]')?.getAttribute("stroke")).toBe("#19222b");
    expect(svg.querySelector('[data-entity-id="art"]')?.getAttribute("data-asset-id")).toBe("asset-chest");
    expect(svg.querySelector('[data-callout-target="outline"]')).not.toBeNull();
    expect(svg.querySelector('[data-label-for="pom"]')?.textContent).toBe("Chest: 10 cm");
    expect(svg.querySelectorAll('[data-label-for="note"]')).toHaveLength(1);
    expect(svg.querySelector('[data-label-for="note"]')?.getAttribute("data-source-id")).toBe("pattern:tee:role:front");
    expect(svg.querySelector('[data-label-for="note"]')?.getAttribute("data-revision-id")).toBe(revisionId);
    expect(svg.querySelector('[data-entity-id="note"]')).toBeNull();
    expect(svg.querySelectorAll('[data-notice-id="source-gap"]').length).toBeGreaterThan(1);
    expect(svg.querySelector('[data-notice-id$="asset-content"]')?.textContent)
      .toContain("image content is not embedded");
    const noticeRect = svg.querySelector("g[data-layer-group='SOURCE_NOTICES'] rect")!;
    const noticeTop = Number(noticeRect.getAttribute("y"));
    const firstNoticeY = Number(svg.querySelector("g[data-layer-group='SOURCE_NOTICES'] text")!.getAttribute("y"));
    expect(firstNoticeY - noticeTop).toBeCloseTo(0.344, 3);
    expect(result.textBounds.pom).toBeDefined();
  });

  it("composites overlapping colorway areas together at one translucent opacity", () => {
    const second: TechnicalFlatPrimitive = { ...outline, id: "overlapping-outline",
      source: { ...source, sourceId: "pattern:tee:role:back" }, commands: [
      { op: "move", point: { x: 6, y: 0 } }, { op: "line", point: { x: 18, y: 0 } },
      { op: "line", point: { x: 18, y: 10 } }, { op: "line", point: { x: 6, y: 10 } }, { op: "close" },
    ] };
    const result = renderTechnicalFlatSvg(makeView([outline, second]), { measureText: measure,
      colorway: { id: "fabric", revisionId, colorHex: "#3669a4", texture: "woven", shine: 24,
        targetRoleIds: ["front", "back"], sourceId: "style:fabric-presentation" } });
    const parsed = new (new JSDOM({ url: "https://technical-flat.test/" }).window.DOMParser)()
      .parseFromString(result.svg!, "image/svg+xml");
    const group = parsed.querySelector("[data-colorway-area-group='fabric']");
    expect(group?.getAttribute("opacity")).toBe("0.16");
    expect(group?.querySelectorAll("[data-colorway-fill-for]")).toHaveLength(2);
    expect([...group!.querySelectorAll("[data-colorway-fill-for]")].every((shape) => shape.parentElement === group)).toBe(true);
  });

  it("keeps artwork sorted by authored z-order within its semantic layer", () => {
    const art = (id: string, zOrder: number): TechnicalFlatPrimitive => ({ kind: "artwork", id, layer: "ARTWORK", feature: "artwork",
      source: { ...source, sourceClass: "USER_REFERENCE", sourceId: `style:${id}` }, artworkKind: "patch",
      placementId: id, sourceName: id, targetRoleId: "front", widthCm: 1, heightCm: 1,
      transform: { dx: zOrder * 2 + 1, dy: 4, scale: 1, rotationDegrees: 0 }, zOrder });
    const result = renderTechnicalFlatSvg(makeView([outline, art("top", 8), art("bottom", 1)]), { measureText: measure });
    const parsed = new JSDOM({ url: "https://technical-flat.test/" }).window.DOMParser;
    const svg = new parsed().parseFromString(result.svg!, "image/svg+xml");
    expect([...svg.querySelectorAll('[data-layer="ARTWORK"]')].map((node) => node.getAttribute("data-placement-id")))
      .toEqual(["bottom", "top"]);
  });

  it("blocks a stale or invalid view before rendering", () => {
    const stale = { ...makeView(), primitives: [{ ...outline, source: { ...source, revisionId: "older" } }] };
    const result = renderTechnicalFlatSvg(stale, { measureText: measure });
    expect(result.svg).toBeNull();
    expect(result.issues.map((issue) => issue.code)).toContain("INVALID_VIEW");
  });

  it("requires real metrics, rejects bad metrics and rejects a colorway from another revision", () => {
    expect(renderTechnicalFlatSvg(makeView(), {} as never).issues[0]?.code).toBe("FONT_METRICS_UNAVAILABLE");
    expect(renderTechnicalFlatSvg(makeView([{ ...outline, kind: "text", layer: "ANNOTATION", feature: "annotation", at: { x: 2, y: 2 }, text: "Text" }]), {
      measureText: () => ({ widthCm: -1, ascentCm: 0.2, descentCm: 0.1 }),
    }).issues.map((issue) => issue.code)).toContain("INVALID_FONT_METRICS");
    const staleColor = { id: "fabric", revisionId: "older", colorHex: "#3669a4", texture: "smooth" as const,
      shine: 0, targetRoleIds: ["front"], sourceId: "style:fabric-presentation" as const };
    expect(renderTechnicalFlatSvg(makeView(), { measureText: measure, colorway: staleColor }).issues[0]?.code)
      .toBe("COLORWAY_REVISION_MISMATCH");
  });

  it("fails the complete flat closed when a requested colorway target is missing or disconnected", () => {
    const colorway = { id: "fabric", revisionId, colorHex: "#3669a4", texture: "woven" as const,
      shine: 24, targetRoleIds: ["front"], sourceId: "style:fabric-presentation" as const };
    const missing = renderTechnicalFlatSvg(makeView([{ ...outline, source: { ...source, sourceId: "pattern:tee:role:back" } }]), {
      measureText: measure, colorway,
    });
    expect(missing.svg).toBeNull();
    expect(missing.issues.map((issue) => issue.code)).toContain("COLORWAY_TARGET_MISSING");

    const disconnected: TechnicalFlatPrimitive = { ...outline, commands: [
      { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 12, y: 0 } },
      { op: "move", point: { x: 12, y: 10 } }, { op: "line", point: { x: 0, y: 10 } },
      { op: "line", point: { x: 0, y: 0 } },
    ] };
    const open = renderTechnicalFlatSvg(makeView([disconnected]), { measureText: measure, colorway });
    expect(open.svg).toBeNull();
    expect(open.issues.map((issue) => issue.code)).toContain("COLORWAY_CONTOUR_UNCLOSED");

    const openEnd: TechnicalFlatPrimitive = { ...outline, commands: [
      { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 12, y: 0 } },
      { op: "line", point: { x: 12, y: 10 } }, { op: "line", point: { x: 0, y: 10 } },
    ] };
    const unfinished = renderTechnicalFlatSvg(makeView([openEnd]), { measureText: measure, colorway });
    expect(unfinished.svg).toBeNull();
    expect(unfinished.issues.map((issue) => issue.code)).toContain("COLORWAY_CONTOUR_UNCLOSED");
  });

  it("joins only exactly matching source edge endpoints and supports cubic closed loops", () => {
    const splitLoop: TechnicalFlatPrimitive = { ...outline, commands: [
      { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 4, y: 0 } },
      { op: "move", point: { x: 4, y: 0 } },
      { op: "cubic", control1: { x: 6, y: 0 }, control2: { x: 6, y: 4 }, point: { x: 4, y: 4 } },
      { op: "move", point: { x: 4, y: 4 } }, { op: "line", point: { x: 0, y: 4 } },
      { op: "move", point: { x: 0, y: 4 } }, { op: "line", point: { x: 0, y: 0 } },
    ] };
    const colorway = { id: "fabric", revisionId, colorHex: "#3669a4", texture: "woven" as const,
      shine: 24, targetRoleIds: ["front"], sourceId: "style:fabric-presentation" as const };
    const result = renderTechnicalFlatSvg(makeView([splitLoop]), { measureText: measure, colorway });
    expect(result.issues).toEqual([]);
    const parsed = new (new JSDOM({ url: "https://technical-flat.test/" }).window.DOMParser)()
      .parseFromString(result.svg!, "image/svg+xml");
    const fill = parsed.querySelector('[data-colorway-fill-for="outline"]');
    expect(fill?.getAttribute("d")).toContain("C6 0 6 4 4 4");
    expect(fill?.getAttribute("d")?.match(/M/g)).toHaveLength(1);
    expect(fill?.getAttribute("d")?.endsWith("Z")).toBe(true);

    const emptyClose: TechnicalFlatPrimitive = { ...outline, commands: [
      { op: "move", point: { x: 0, y: 0 } }, { op: "close" },
    ] };
    const degenerate = renderTechnicalFlatSvg(makeView([emptyClose]), { measureText: measure, colorway });
    expect(degenerate.svg).toBeNull();
    expect(degenerate.issues.map((issue) => issue.code)).toContain("COLORWAY_CONTOUR_UNCLOSED");
  });

  it("fills exact source-declared fold-reflection paths and rejects mismatched or ambiguous edges", () => {
    const half: TechnicalFlatPrimitive = { ...outline, commands: [
      { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 2, y: 0 } },
      { op: "cubic", control1: { x: 2, y: 1 }, control2: { x: 2, y: 3 }, point: { x: 2, y: 4 } },
      { op: "line", point: { x: 0, y: 4 } },
    ] };
    const reflected: TechnicalFlatPrimitive = { ...half, id: "outline:fold-reflection", commands: [
      { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: -2, y: 0 } },
      { op: "cubic", control1: { x: -2, y: 1 }, control2: { x: -2, y: 3 }, point: { x: -2, y: 4 } },
      { op: "line", point: { x: 0, y: 4 } },
    ] };
    const colorway = { id: "fabric", revisionId, colorHex: "#3669a4", texture: "woven" as const,
      shine: 24, targetRoleIds: ["front"], sourceId: "style:fabric-presentation" as const };
    const result = renderTechnicalFlatSvg(makeView([half, reflected]), { measureText: measure, colorway });
    expect(result.issues).toEqual([]);
    const parsed = new (new JSDOM({ url: "https://technical-flat.test/" }).window.DOMParser)()
      .parseFromString(result.svg!, "image/svg+xml");
    const fills = parsed.querySelectorAll('[data-colorway-fill-for]');
    expect(fills).toHaveLength(1);
    expect(fills[0]?.getAttribute("d")).toContain("C-2 3 -2 1 -2 0");
    expect(parsed.querySelectorAll('[data-entity-id="outline"], [data-entity-id="outline:fold-reflection"]'))
      .toHaveLength(2);
    expect([...parsed.querySelectorAll('[data-entity-id="outline"], [data-entity-id="outline:fold-reflection"]')]
      .every((path) => path.getAttribute("fill") === "none" && path.getAttribute("stroke") === "#19222b")).toBe(true);

    const wrongEndpoint = { ...reflected, commands: [
      { op: "move" as const, point: { x: 0, y: 0 } }, { op: "line" as const, point: { x: -2, y: 0 } },
      { op: "line" as const, point: { x: -2, y: 4 } }, { op: "line" as const, point: { x: -1, y: 4 } },
    ] };
    const withheld = renderTechnicalFlatSvg(makeView([half, wrongEndpoint]), { measureText: measure, colorway });
    expect(withheld.svg).toBeNull();
    expect(withheld.issues.map((issue) => issue.code)).toContain("COLORWAY_CONTOUR_UNCLOSED");

    const extra = { ...reflected, id: "outline:extra" };
    const ambiguous = renderTechnicalFlatSvg(makeView([half, reflected, extra]), { measureText: measure, colorway });
    expect(ambiguous.svg).toBeNull();
    expect(ambiguous.issues.map((issue) => issue.code)).toContain("COLORWAY_CONTOUR_UNCLOSED");
  });

  it("joins exact source view-boundary edges into a requested role contour", () => {
    const panel: TechnicalFlatPrimitive = { ...outline, commands: [
      { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 4, y: 0 } },
      { op: "move", point: { x: 4, y: 4 } }, { op: "line", point: { x: 0, y: 4 } },
      { op: "move", point: { x: 0, y: 4 } }, { op: "line", point: { x: 0, y: 0 } },
    ] };
    const boundary: TechnicalFlatPrimitive = { kind: "path", id: "outline:view-boundary:side",
      layer: "GARMENT_SILHOUETTE", feature: "silhouette",
      source: { ...source, sourceId: "view:tee:role:front:stitch:side:boundary:side" },
      commands: [{ op: "move", point: { x: 4, y: 4 } }, { op: "line", point: { x: 4, y: 0 } }] };
    const colorway = { id: "fabric", revisionId, colorHex: "#3669a4", texture: "woven" as const,
      shine: 24, targetRoleIds: ["front"], sourceId: "style:fabric-presentation" as const };
    const result = renderTechnicalFlatSvg(makeView([panel, boundary]), { measureText: measure, colorway });
    expect(result.issues).toEqual([]);
    const parsed = new (new JSDOM({ url: "https://technical-flat.test/" }).window.DOMParser)()
      .parseFromString(result.svg!, "image/svg+xml");
    expect(parsed.querySelector('[data-colorway-fill-for="outline"]')?.getAttribute("d"))
      .toBe("M0 0 L4 0 L4 4 L0 4 L0 0 Z");
  });

  it("omits an exact source-edge group hidden on a declared attached fold axis", () => {
    const sourceEdgeIds = ["pattern:tee:role:front:edge:fold", "pattern:tee:role:front:edge:top",
      "pattern:tee:role:front:edge:side", "pattern:tee:role:front:edge:bottom"];
    const half: TechnicalFlatPrimitive = { ...outline, id: "axis-outline", sourceEdgeIds, commands: [
      { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 0, y: 4 } },
      { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 2, y: 0 } },
      { op: "move", point: { x: 2, y: 0 } }, { op: "line", point: { x: 2, y: 4 } },
      { op: "move", point: { x: 2, y: 4 } }, { op: "line", point: { x: 0, y: 4 } },
    ] };
    const reflected: TechnicalFlatPrimitive = { ...half, id: "axis-outline:attached-fold-reflection",
      sourceEdgeIds: sourceEdgeIds.slice(1), commands: [
        { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: -2, y: 0 } },
        { op: "move", point: { x: -2, y: 0 } }, { op: "line", point: { x: -2, y: 4 } },
        { op: "move", point: { x: -2, y: 4 } }, { op: "line", point: { x: 0, y: 4 } },
      ] };
    const colorway = { id: "fabric", revisionId, colorHex: "#3669a4", texture: "woven" as const,
      shine: 24, targetRoleIds: ["front"], sourceId: "style:fabric-presentation" as const };
    const result = renderTechnicalFlatSvg(makeView([half, reflected]), { measureText: measure, colorway });
    expect(result.issues).toEqual([]);
    const parsed = new (new JSDOM({ url: "https://technical-flat.test/" }).window.DOMParser)()
      .parseFromString(result.svg!, "image/svg+xml");
    expect(parsed.querySelector('[data-colorway-fill-for="axis-outline"]')?.getAttribute("d"))
      .toBe("M0 0 L2 0 L2 4 L0 4 L-2 4 L-2 0 L0 0 Z");
  });

  it("closes a source-split waistband face with its mapped side boundary and attached reflection", () => {
    const waistbandSource = { ...source, sourceId: "pattern:skirt:role:waistband" };
    const base: TechnicalFlatPrimitive = { kind: "path", id: "waistband",
      layer: "GARMENT_SILHOUETTE", feature: "silhouette", source: waistbandSource,
      sourceEdgeIds: ["pattern:skirt:role:waistband:edge:seam", "pattern:skirt:role:waistband:edge:top", "pattern:skirt:role:waistband:edge:end"],
      commands: [
        { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 23.5, y: 0 } },
        { op: "move", point: { x: 23.5, y: 3.5 } }, { op: "line", point: { x: 0, y: 3.5 } },
        { op: "move", point: { x: 0, y: 3.5 } }, { op: "line", point: { x: 0, y: 0 } },
      ] };
    const reflected: TechnicalFlatPrimitive = { ...base, id: "waistband:attached-fold-reflection",
      sourceEdgeIds: base.sourceEdgeIds!.slice(0, 2), commands: [
        { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: -23.5, y: 0 } },
        { op: "move", point: { x: -23.5, y: 3.5 } }, { op: "line", point: { x: 0, y: 3.5 } },
      ] };
    const boundarySource = { ...source, sourceId: "view:skirt:role:waistband:stitch:waistband:boundary:side" };
    const right: TechnicalFlatPrimitive = { kind: "path", id: "waistband:view-boundary:right",
      layer: "GARMENT_SILHOUETTE", feature: "silhouette", source: boundarySource,
      commands: [{ op: "move", point: { x: 23.5, y: 3.5 } }, { op: "line", point: { x: 23.5, y: 0 } }] };
    const left: TechnicalFlatPrimitive = { ...right, id: "waistband:view-boundary:left:attached-fold-reflection",
      commands: [{ op: "move", point: { x: -23.5, y: 3.5 } }, { op: "line", point: { x: -23.5, y: 0 } }] };
    const colorway = { id: "fabric", revisionId, colorHex: "#3669a4", texture: "woven" as const,
      shine: 24, targetRoleIds: ["waistband"], sourceId: "style:fabric-presentation" as const };
    const result = renderTechnicalFlatSvg(makeView([base, reflected, right, left]), { measureText: measure, colorway });
    expect(result.issues).toEqual([]);
    const parsed = new (new JSDOM({ url: "https://technical-flat.test/" }).window.DOMParser)()
      .parseFromString(result.svg!, "image/svg+xml");
    expect(parsed.querySelector('[data-colorway-fill-for="waistband"]')?.getAttribute("d"))
      .toContain("L23.5 0 L23.5 3.5 L0 3.5");
  });

  it("uses exact attached panel waist edges to close accepted Trouser back waistband color", () => {
    const waistbandTop = (panel: "backLeft" | "backRight", start: number, end: number): TechnicalFlatPrimitive => ({
      kind: "path", id: `live-flat:trouser:BACK_FLAT:waistband:waistband:${panel}:waist:top`,
      layer: "GARMENT_SILHOUETTE", feature: "silhouette",
      source: { ...source, sourceId: "pattern:trouser:role:waistband:edge:top" },
      sourceEdgeIds: ["pattern:trouser:role:waistband:edge:top"],
      commands: [{ op: "move", point: { x: start, y: -4 } }, { op: "line", point: { x: end, y: -4 } }],
    });
    const sideBoundary = (panel: "backLeft" | "backRight", x: number): TechnicalFlatPrimitive => ({
      kind: "path", id: `live-flat:trouser:BACK_FLAT:waistband:waistband:${panel}:waist:side-boundary`,
      layer: "GARMENT_SILHOUETTE", feature: "silhouette",
      source: { ...source, sourceId: `view:trouser:stitch:Waistband (four legs ↔ separate waistband):boundary:${panel}` },
      commands: [{ op: "move", point: { x, y: -4 } }, { op: "line", point: { x, y: 0 } }],
    });
    const panelWaist = (panel: "backLeft" | "backRight", start: number, end: number): TechnicalFlatPrimitive => ({
      kind: "path", id: `flat:trouser:BACK_FLAT:component:${panel}:outline`,
      layer: "GARMENT_SILHOUETTE", feature: "silhouette",
      source: { ...source, sourceId: `pattern:trouser:role:${panel}` },
      sourceEdgeIds: [`pattern:trouser:role:${panel}:edge:waist`, `pattern:trouser:role:${panel}:edge:side`],
      commands: [
        { op: "move", point: { x: start, y: 0 } }, { op: "line", point: { x: end, y: 0 } },
        { op: "move", point: { x: end, y: 0 } }, { op: "line", point: { x: end, y: 4 } },
      ],
    });
    const colorway = { id: "fabric", revisionId, colorHex: "#3669a4", texture: "woven" as const,
      shine: 24, targetRoleIds: ["waistband"], sourceId: "style:fabric-presentation" as const };
    const view = { ...makeView([
      waistbandTop("backLeft", 0, 23.5), sideBoundary("backLeft", 23.5),
      waistbandTop("backRight", -23.5, 0), sideBoundary("backRight", -23.5),
      panelWaist("backLeft", 0, 23.5), panelWaist("backRight", -23.5, 0),
    ]), recipeId: "trouser" };
    const result = renderTechnicalFlatSvg(view, { measureText: measure, colorway });
    expect(result.issues).toEqual([]);
    const parsed = new (new JSDOM({ url: "https://technical-flat.test/" }).window.DOMParser)()
      .parseFromString(result.svg!, "image/svg+xml");
    expect(parsed.querySelector('[data-colorway-fill-for="live-flat:trouser:BACK_FLAT:waistband:waistband:backLeft:waist:top"]')
      ?.getAttribute("d")).toContain("L23.5 0 L0 0 L-23.5 0");
  });

  it("closes the live Trouser front waistband from its source top, sewn waist, and exact face boundaries", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "trouser")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(TROUSER_OPTION_DEFINITIONS));
    const live = compileTechnicalFlatLiveView({ recipe, block, revisionId, kind: "FRONT_FLAT", placements: [],
      colorHex: "#3669a4", texture: "woven", shine: 24 });
    expect(live.issues).toEqual([]);
    expect(live.view).not.toBeNull();
    const view = live.view!;
    const boundaries = view.primitives.filter((primitive) => primitive.kind === "path"
      && primitive.id.includes(":waist:side-boundary"));
    expect(boundaries.map((primitive) => primitive.source.sourceId)).toEqual([
      "view:trouser:stitch:Waistband (four legs ↔ separate waistband):boundary:frontLeft",
      "view:trouser:stitch:Waistband (four legs ↔ separate waistband):boundary:frontRight",
    ]);
    expect(boundaries).toHaveLength(2);

    const fullResult = renderTechnicalFlatSvg(view, { measureText: measure, colorway: live.colorway! });
    expect(fullResult.issues).toEqual([]);
    const sharedAnchorCallouts = view.primitives.filter((primitive) => primitive.kind === "callout"
      && ["seat-hip-finished", "hip-depth-body-reference"].some((name) => primitive.id.endsWith(name)));
    expect(sharedAnchorCallouts).toHaveLength(2);
    const sharedAnchors = sharedAnchorCallouts.flatMap((primitive) => primitive.kind === "callout" ? [primitive.anchor] : []);
    expect(sharedAnchors[0]).toEqual(sharedAnchors[1]);
    expect(sharedAnchors[0]?.primitiveId).toBe("flat:trouser:FRONT_FLAT:component:frontLeft:outline");
    const seatBounds = fullResult.textBounds["flat:trouser:FRONT_FLAT:callout:seat-hip-finished"]!;
    const depthBounds = fullResult.textBounds["flat:trouser:FRONT_FLAT:callout:hip-depth-body-reference"]!;
    expect(seatBounds.maxX <= depthBounds.minX || depthBounds.maxX <= seatBounds.minX
      || seatBounds.maxY <= depthBounds.minY || depthBounds.maxY <= seatBounds.minY).toBe(true);
    const contourView = { ...view, primitives: view.primitives.filter((primitive) => primitive.kind !== "callout") };
    const result = renderTechnicalFlatSvg(contourView, { measureText: measure, colorway: live.colorway! });
    expect(result.issues.map((issue) => issue.code)).not.toContain("COLORWAY_CONTOUR_UNCLOSED");
    expect(result.svg).not.toBeNull();
    const parsed = new (new JSDOM({ url: "https://technical-flat.test/" }).window.DOMParser)()
      .parseFromString(result.svg!, "image/svg+xml");
    const fill = parsed.querySelector('[data-colorway-fill-for^="live-flat:trouser:FRONT_FLAT:waistband:"]');
    expect(fill?.getAttribute("d")).toMatch(/Z$/u);
    expect(parsed.querySelectorAll('[data-layer="GARMENT_SILHOUETTE"][data-source-id^="pattern:trouser:role:front"]'))
      .toHaveLength(4);
    expect(parsed.querySelectorAll('[data-source-id^="view:trouser:stitch:Waistband "][data-layer="GARMENT_SILHOUETTE"]'))
      .toHaveLength(2);
  });

  it("withholds Trouser waistband color when its mapped panel seam source is incomplete", () => {
    const colorway = { id: "fabric", revisionId, colorHex: "#3669a4", texture: "woven" as const,
      shine: 24, targetRoleIds: ["waistband"], sourceId: "style:fabric-presentation" as const };
    const top = (panel: "backLeft" | "backRight", start: number, end: number): TechnicalFlatPrimitive => ({
      kind: "path", id: `live-flat:trouser:BACK_FLAT:waistband:waistband:${panel}:waist:top`,
      layer: "GARMENT_SILHOUETTE", feature: "silhouette",
      source: { ...source, sourceId: "pattern:trouser:role:waistband:edge:top" },
      sourceEdgeIds: ["pattern:trouser:role:waistband:edge:top"],
      commands: [{ op: "move", point: { x: start, y: -4 } }, { op: "line", point: { x: end, y: -4 } }],
    });
    const boundary = (panel: "backLeft" | "backRight", x: number): TechnicalFlatPrimitive => ({
      kind: "path", id: `live-flat:trouser:BACK_FLAT:waistband:waistband:${panel}:waist:side-boundary`,
      layer: "GARMENT_SILHOUETTE", feature: "silhouette",
      source: { ...source, sourceId: `view:trouser:stitch:waistband:boundary:${panel}` },
      commands: [{ op: "move", point: { x, y: -4 } }, { op: "line", point: { x, y: 0 } }],
    });
    const basePrimitives = [top("backLeft", 0, 23.5), boundary("backLeft", 23.5),
      top("backRight", -23.5, 0), boundary("backRight", -23.5)];
    const render = (primitives: TechnicalFlatPrimitive[]) => renderTechnicalFlatSvg({ ...makeView(primitives), recipeId: "trouser" }, {
      measureText: measure, colorway,
    });
    expect(render(basePrimitives).issues.map((issue) => issue.code)).toContain("COLORWAY_CONTOUR_UNCLOSED");

    const bodySource = { ...source, sourceId: "pattern:trouser:role:backLeft" };
    const noIds: TechnicalFlatPrimitive = { kind: "path", id: "backLeft-no-ids", layer: "GARMENT_SILHOUETTE",
      feature: "silhouette", source: bodySource,
      commands: [{ op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 23.5, y: 0 } }] };
    expect(render([...basePrimitives, noIds]).issues.map((issue) => issue.code)).toContain("COLORWAY_CONTOUR_UNCLOSED");

    const mismatchedGroups: TechnicalFlatPrimitive = { ...noIds, id: "backLeft-mismatched-groups",
      sourceEdgeIds: ["pattern:trouser:role:backLeft:edge:waist"], commands: [
        { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 23.5, y: 0 } },
        { op: "move", point: { x: 0, y: 1 } }, { op: "line", point: { x: 23.5, y: 1 } },
      ] };
    expect(render([...basePrimitives, mismatchedGroups]).issues.map((issue) => issue.code))
      .toContain("COLORWAY_CONTOUR_UNCLOSED");

    const wrongEdge: TechnicalFlatPrimitive = { ...noIds, id: "backLeft-wrong-edge",
      sourceEdgeIds: ["pattern:trouser:role:backLeft:edge:side"] };
    expect(render([...basePrimitives, wrongEdge]).issues.map((issue) => issue.code)).toContain("COLORWAY_CONTOUR_UNCLOSED");
  });

  it("rejects one-edge and two-edge cycles even when their endpoints are closed", () => {
    const colorway = { id: "fabric", revisionId, colorHex: "#3669a4", texture: "woven" as const,
      shine: 24, targetRoleIds: ["front"], sourceId: "style:fabric-presentation" as const };
    const selfLoop: TechnicalFlatPrimitive = { ...outline, id: "self-loop", commands: [
      { op: "move", point: { x: 20, y: 20 } }, { op: "line", point: { x: 20, y: 20 } },
    ] };
    expect(renderTechnicalFlatSvg(makeView([selfLoop, outline]), { measureText: measure, colorway }).issues
      .map((issue) => issue.code)).toContain("COLORWAY_CONTOUR_UNCLOSED");

    const twoEdgeCycle: TechnicalFlatPrimitive = { ...outline, id: "two-edge-cycle", commands: [
      { op: "move", point: { x: 20, y: 20 } }, { op: "line", point: { x: 21, y: 20 } },
      { op: "move", point: { x: 21, y: 20 } }, { op: "line", point: { x: 20, y: 20 } },
    ] };
    expect(renderTechnicalFlatSvg(makeView([twoEdgeCycle, outline]), { measureText: measure, colorway }).issues
      .map((issue) => issue.code)).toContain("COLORWAY_CONTOUR_UNCLOSED");
  });

  it("reflows measured colliding labels and expands the view frame to include them", () => {
    const labels: TechnicalFlatPrimitive[] = [
      { kind: "text", id: "one", layer: "ANNOTATION", feature: "annotation", source,
        at: { x: 5, y: 5 }, text: "same" },
      { kind: "text", id: "two", layer: "ANNOTATION", feature: "annotation", source,
        at: { x: 5, y: 5 }, text: "same" },
      { kind: "text", id: "long", layer: "ANNOTATION", feature: "annotation", source,
        at: { x: 12, y: 4 }, text: "x".repeat(100) },
    ];
    const result = renderTechnicalFlatSvg(makeView([outline, ...labels]), { measureText: measure });
    expect(result.svg).not.toBeNull();
    expect(result.issues).toEqual([]);
    expect(result.textBounds.one?.minY).not.toBe(result.textBounds.two?.minY);
    expect(result.textBounds.long?.maxX).toBeGreaterThan(14);
  });

  it("reflows labels away from artwork and POM leaders while keeping callout targets", () => {
    const artwork: TechnicalFlatPrimitive = {
      kind: "artwork", id: "print-area", layer: "ARTWORK", feature: "artwork",
      source: { ...source, sourceClass: "USER_REFERENCE", sourceId: "style:artwork:front" },
      artworkKind: "print", placementId: "print", sourceName: "Chest print", targetRoleId: "front",
      widthCm: 4, heightCm: 4, transform: { dx: 5, dy: 5, scale: 1, rotationDegrees: 0 }, zOrder: 1,
    };
    const onArtwork = renderTechnicalFlatSvg(makeView([outline, artwork, {
      kind: "text", id: "art-label", layer: "ANNOTATION", feature: "annotation", source,
      at: { x: 4, y: 5 }, text: "On print",
    }]), { measureText: measure });
    expect(onArtwork.issues).toEqual([]);
    expect(onArtwork.textBounds["art-label"]?.minX).not.toBe(4);

    const leader = renderTechnicalFlatSvg(makeView([outline, {
      kind: "callout", id: "leader-callout", layer: "CALLOUT", feature: "pom", source,
      text: "Chest width", anchor: { primitiveId: "outline", point: { x: 1, y: 6 } }, labelAt: { x: 11, y: 6 },
    }, {
      kind: "text", id: "under-leader", layer: "ANNOTATION", feature: "annotation", source,
      at: { x: 5, y: 6 }, text: "Crossing note",
    }]), { measureText: measure });
    expect(leader.issues).toEqual([]);
    expect(leader.textBounds["under-leader"]?.minY).not.toBe(6 - measure("Crossing note", 0.32, "Arial").ascentCm);
    expect(leader.svg).toContain('data-callout-target="outline"');
    expect(leader.svg).toContain('data-label-for="leader-callout"');
  });

  it("keeps an unsatisfiable measured label blocked", () => {
    const artwork: TechnicalFlatPrimitive = {
      kind: "artwork", id: "large-print", layer: "ARTWORK", feature: "artwork",
      source: { ...source, sourceClass: "USER_REFERENCE", sourceId: "style:artwork:large" },
      artworkKind: "print", placementId: "large", sourceName: "Large print", targetRoleId: "front",
      widthCm: 100, heightCm: 100, transform: { dx: 5, dy: 5, scale: 1, rotationDegrees: 0 }, zOrder: 1,
    };
    const result = renderTechnicalFlatSvg(makeView([outline, artwork, {
      kind: "text", id: "covered", layer: "ANNOTATION", feature: "annotation", source,
      at: { x: 5, y: 5 }, text: "No clear position",
    }, {
      kind: "callout", id: "covered-callout", layer: "CALLOUT", feature: "pom", source,
      text: "Covered POM", anchor: { primitiveId: "outline", point: { x: 5, y: 5 } }, labelAt: { x: 5, y: 5 },
    }]), { measureText: measure });
    expect(result.svg).toBeNull();
    expect(result.issues.some((issue) => issue.code === "TEXT_COLLISION" && issue.entityId === "covered")).toBe(true);
  });

  it("reflows multiple callout leaders around measured labels", () => {
    const result = renderTechnicalFlatSvg(makeView([outline,
      { kind: "text", id: "leader-note", layer: "ANNOTATION", feature: "annotation", source,
        at: { x: 6, y: 5 }, text: "Leader crossing" },
      { kind: "callout", id: "pom-one", layer: "CALLOUT", feature: "pom", source,
        text: "First POM", anchor: { primitiveId: "outline", point: { x: 1, y: 2 } }, labelAt: { x: 11, y: 8 } },
      { kind: "callout", id: "pom-two", layer: "CALLOUT", feature: "pom", source,
        text: "Second POM", anchor: { primitiveId: "outline", point: { x: 1, y: 8 } }, labelAt: { x: 11, y: 2 } },
    ]), { measureText: measure });
    expect(result.issues).toEqual([]);
    expect(result.svg).toContain('data-label-for="pom-one"');
    expect(result.svg).toContain('data-label-for="pom-two"');
    expect(result.textBounds["pom-one"]?.minX).not.toBe(result.textBounds["pom-two"]?.minX);
  });

  it("separates same-anchor callouts whose initial leaders overlap on the same ray", () => {
    const result = renderTechnicalFlatSvg(makeView([outline,
      { kind: "callout", id: "pom-ray-one", layer: "CALLOUT", feature: "pom", source,
        text: "First POM", anchor: { primitiveId: "outline", point: { x: 1, y: 6 } }, labelAt: { x: 21, y: 26 } },
      { kind: "callout", id: "pom-ray-two", layer: "CALLOUT", feature: "pom", source,
        text: "Second POM", anchor: { primitiveId: "outline", point: { x: 1, y: 6 } }, labelAt: { x: 41, y: 46 } },
    ]), { measureText: measure });
    expect(result.issues).toEqual([]);
    expect(result.textBounds["pom-ray-one"]).toBeDefined();
    expect(result.textBounds["pom-ray-two"]).toBeDefined();
    expect(result.svg).toContain('data-label-for="pom-ray-one"');
    expect(result.svg).toContain('data-label-for="pom-ray-two"');
  });

  it("rejects notice wrapping when actual font metrics cannot fit the text", () => {
    const result = renderTechnicalFlatSvg(makeView([], [{ id: "wide", feature: "annotation", reason: "SOURCE_REFERENCE_MISSING",
      message: "Unbreakable".repeat(30) }]), { measureText: (text) => ({ widthCm: text.length * 2, ascentCm: 0.2, descentCm: 0.1 }) });
    expect(result.svg).toBeNull();
    expect(result.issues.map((issue) => issue.code)).toContain("INVALID_FONT_METRICS");
  });

  it("blocks a notice whose measured panel metrics become unavailable", () => {
    let exactLineCalls = 0;
    const result = renderTechnicalFlatSvg(makeView([], [{ id: "notice", feature: "annotation",
      reason: "SOURCE_REFERENCE_MISSING", message: "visible notice" }]), { measureText: (text) => {
      if (text === "visible notice" && exactLineCalls++ > 0) return { widthCm: Number.NaN, ascentCm: 0.2, descentCm: 0.1 };
      return { widthCm: text.length * 0.1, ascentCm: 0.2, descentCm: 0.1 };
    } });
    expect(result.svg).toBeNull();
    expect(result.issues.some((issue) => issue.code === "INVALID_FONT_METRICS"
      && issue.message.includes("panel placement"))).toBe(true);
  });

  it("measures text bounds in SVG user units with the active browser font", () => {
    const nodes: Array<{ textContent: string | null; attributes: Record<string, string> }> = [];
    const measureSvgAttributes: Record<string, string> = {};
    const doc = { body: { append: () => undefined }, createElementNS: (_namespace: string, name: string) => {
      if (name === "svg") return { setAttribute: (key: string, value: string) => { measureSvgAttributes[key] = value; }, append: () => undefined };
      const node = { textContent: "", attributes: {} as Record<string, string>, setAttribute(key: string, value: string) {
        this.attributes[key] = value;
      }, getBBox: () => ({ x: 0, y: -0.2, width: 1.5, height: 0.25 }),
      getComputedTextLength: () => 1.5, remove: () => undefined };
      nodes.push(node);
      return node;
    } } as unknown as Document;
    const metrics = createBrowserTechnicalFlatTextMeasurer(doc)("sample", 0.32, "Arial");
    expect(measureSvgAttributes).toMatchObject({ width: "100cm", height: "100cm", viewBox: "0 0 100 100" });
    expect(nodes[0]?.attributes["font-family"]).toBe("Arial");
    expect(metrics.widthCm).toBe(1.5);
    expect(metrics.ascentCm).toBeCloseTo(0.2);
    expect(metrics.descentCm).toBeCloseTo(0.05);
    const unavailable = { body: null } as unknown as Document;
    expect(createBrowserTechnicalFlatTextMeasurer(unavailable)("x", 0.3, "Arial").widthCm).toBeNaN();
  });

  it("covers fold and buttonhole marks and leaves non-role silhouettes unfilled", () => {
    const shape: TechnicalFlatPrimitive[] = [
      { ...outline, source: { ...source, sourceId: "pattern:unmapped" } },
      { kind: "path", id: "fold", layer: "CONSTRUCTION", feature: "annotation", source,
        commands: [{ op: "move", point: { x: 2, y: 2 } }, { op: "line", point: { x: 4, y: 2 } }],
        patternMark: { kind: "foldLine", name: "fold" } },
      { kind: "mark", id: "hole", layer: "CLOSURE", feature: "closure", source,
        markKind: "buttonhole", markName: "hole", at: { x: 3, y: 3 } },
    ];
    const result = renderTechnicalFlatSvg(makeView(shape), { measureText: measure });
    const svg = new JSDOM({ url: "https://technical-flat.test/" }).window.DOMParser;
    const parsed = new svg().parseFromString(result.svg!, "image/svg+xml");
    expect(parsed.querySelector('[data-entity-id="outline"]')?.getAttribute("fill")).toBe("none");
    expect(parsed.querySelector('[data-entity-id="outline"]')?.getAttribute("fill-opacity")).toBeNull();
    expect(parsed.querySelector('[data-entity-id="fold"]')?.getAttribute("stroke-dasharray")).toBe("0.18 0.1");
    expect(parsed.querySelector('[data-mark-kind="buttonhole"] rect')).not.toBeNull();
  });

  it("blocks throwing browser metrics and refuses an unbreakable notice word", () => {
    const throwing = renderTechnicalFlatSvg(makeView([
      { kind: "text", id: "label", layer: "ANNOTATION", feature: "annotation", source, at: { x: 2, y: 2 }, text: "Label" },
    ]), { measureText: () => { throw new Error("font unavailable"); } });
    expect(throwing.issues.map((issue) => issue.code)).toContain("INVALID_FONT_METRICS");
    const tooWide = renderTechnicalFlatSvg(makeView([], [{ id: "word", feature: "annotation", reason: "SOURCE_REFERENCE_MISSING",
    message: "ordinary Supercalifragilisticexpialidocious" }]), { measureText: (text) => ({
      widthCm: text.includes("Supercalifragilisticexpialidocious") ? 40 : text.length * 0.01, ascentCm: 0.1, descentCm: 0.02,
    }) });
    expect(tooWide.issues.map((issue) => issue.code)).toContain("INVALID_FONT_METRICS");
    const invalidMetrics = renderTechnicalFlatSvg(makeView([], [{ id: "metrics", feature: "annotation", reason: "SOURCE_NOT_REPRESENTED",
      message: "Unmeasurable notice" }]), { measureText: (text) => ({
      widthCm: text.startsWith("Unmeasurable") ? Number.NaN : text.length * 0.01, ascentCm: 0.1, descentCm: 0.02,
    }) });
    expect(invalidMetrics.issues.map((issue) => issue.code)).toContain("INVALID_FONT_METRICS");
  });
});
