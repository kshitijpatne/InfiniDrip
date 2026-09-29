import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { TECHNICAL_FLAT_SCHEMA_VERSION, type TechnicalFlatPrimitive, type TechnicalFlatView } from "./technical-flat";
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
    expect([...svg.querySelectorAll("g[data-layer-group]")].map((group) => group.getAttribute("data-layer-group")))
      .toEqual(["GARMENT_SILHOUETTE", "ARTWORK", "SEAM", "CONSTRUCTION", "DART", "PLEAT", "CLOSURE", "TOPSTITCH", "CALLOUT", "ANNOTATION", "TEXT_LABELS", "SOURCE_NOTICES"]);
    expect(svg.querySelector('[data-entity-id="outline"]')?.getAttribute("fill")).toBe("#3669a4");
    expect(svg.querySelector('[data-entity-id="outline"]')?.getAttribute("fill-opacity")).toBe("0.16");
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
    expect(parsed.querySelector('[data-entity-id="outline"]')?.getAttribute("fill-opacity")).toBe("1");
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
