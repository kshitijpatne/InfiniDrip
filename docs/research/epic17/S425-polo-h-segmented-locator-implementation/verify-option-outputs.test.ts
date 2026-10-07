import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { describe, expect, it } from "vitest";
import type { FlatPathCommand, FlatPoint, TechnicalFlatPrimitive, TechnicalFlatView } from "../../../../src/render/technical-flat";
import { renderTechnicalFlatSvg, type TechnicalFlatMeasureText } from "../../../../src/render/technical-flat-svg";

const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom") as { JSDOM: new (html: string) => { window: { DOMParser: new () => DOMParser } } };
const sourceDir = new URL("../S399-polo-fg-glyph-offset/rendered/", import.meta.url);
const outputDir = new URL("./rendered/", import.meta.url);
const matrixPath = new URL("./S425-rendered-output-matrix.json", import.meta.url);
const measure: TechnicalFlatMeasureText = (text, size) => ({ widthCm: text.length * size * 0.35,
  ascentCm: size * 0.7, descentCm: size * 0.2 });

function pathCommands(data: string): FlatPathCommand[] {
  const tokens = data.match(/[A-Za-z]|[-+]?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?/gu) ?? [];
  const commands: FlatPathCommand[] = [];
  let operation = "";
  let index = 0;
  let current: FlatPoint = { x: 0, y: 0 };
  let subpath: FlatPoint = current;
  while (index < tokens.length) {
    if (/^[A-Za-z]$/u.test(tokens[index]!)) operation = tokens[index++]!;
    if (operation === "Z" || operation === "z") {
      commands.push({ op: "close" }); current = subpath; operation = ""; continue;
    }
    if (operation === "M" || operation === "m") {
      const relative = operation === "m";
      const x = Number(tokens[index++]); const y = Number(tokens[index++]);
      current = { x: relative ? current.x + x : x, y: relative ? current.y + y : y };
      subpath = current; commands.push({ op: "move", point: current }); operation = relative ? "l" : "L";
    } else if (operation === "L" || operation === "l") {
      const relative = operation === "l";
      const x = Number(tokens[index++]); const y = Number(tokens[index++]);
      current = { x: relative ? current.x + x : x, y: relative ? current.y + y : y };
      commands.push({ op: "line", point: current });
    } else if (operation === "C" || operation === "c") {
      const relative = operation === "c";
      const values = tokens.slice(index, index + 6).map(Number); index += 6;
      const point = (x: number, y: number): FlatPoint => ({ x: relative ? current.x + x : x, y: relative ? current.y + y : y });
      const control1 = point(values[0]!, values[1]!); const control2 = point(values[2]!, values[3]!);
      current = point(values[4]!, values[5]!); commands.push({ op: "cubic", control1, control2, point: current });
    } else throw new Error(`Unsupported saved source SVG path command: ${operation}`);
  }
  return commands;
}

function renderedSource(svg: string): { view: TechnicalFlatView; callouts: number; originalPaths: string[] } {
  const document = new JSDOM("").window.DOMParser ? new JSDOM("").window.DOMParser : undefined;
  if (!document) throw new Error("DOM parser unavailable");
  const root = new document().parseFromString(svg, "image/svg+xml").documentElement;
  const revisionId = root.getAttribute("data-revision-id")!;
  const primitives: TechnicalFlatPrimitive[] = [];
  const fillEdges = new Map([...root.querySelectorAll<SVGPathElement>("path[data-colorway-fill-for]")]
    .map((path) => [path.getAttribute("data-colorway-fill-for")!, path.getAttribute("data-colorway-contour-sources")!.split(/\s+/u)]));
  const sourcePaths = [...root.querySelectorAll<SVGPathElement>('path[data-entity-id^="flat:polo:FRONT_FLAT:component:"]')];
  const originalPaths = sourcePaths.map((path) => `${path.getAttribute("data-entity-id")}|${path.getAttribute("data-source-id")}|${path.getAttribute("data-revision-id")}|${path.getAttribute("d")}`);
  for (const path of sourcePaths) {
    const commands = pathCommands(path.getAttribute("d")!);
    const edgeIds = fillEdges.get(path.getAttribute("data-entity-id")!);
    const subpathCount = commands.filter((command) => command.op === "move").length;
    primitives.push({ kind: "path", id: path.getAttribute("data-entity-id")!, feature: path.getAttribute("data-feature") as TechnicalFlatPrimitive["feature"],
      layer: path.getAttribute("data-layer") as TechnicalFlatPrimitive["layer"], source: { sourceClass: "PATTERN_DERIVED",
        sourceId: path.getAttribute("data-source-id")!, revisionId }, commands,
      ...(edgeIds?.length === subpathCount ? { sourceEdgeIds: edgeIds } : {}) });
  }
  const markGroups = [...root.querySelectorAll<SVGGElement>('g[data-entity-id^="flat:polo:FRONT_FLAT:mark:"]')];
  markGroups.forEach((group) => [...group.querySelectorAll<SVGElement>("circle,path,line,rect")].forEach((shape, shapeIndex) => {
    const sourceId = group.getAttribute("data-source-id")!;
    const layer = group.getAttribute("data-layer") as TechnicalFlatPrimitive["layer"];
    const base = { id: group.getAttribute("data-entity-id")!, feature: "closure" as const, layer,
      source: { sourceClass: "PATTERN_DERIVED" as const, sourceId, revisionId } };
    if (shape.localName === "circle") primitives.push({ ...base, kind: "circle", center: { x: Number(shape.getAttribute("cx")),
      y: Number(shape.getAttribute("cy")) }, radius: Number(shape.getAttribute("r")) });
    else if (shape.localName === "line") primitives.push({ ...base, kind: "path", commands: [
      { op: "move", point: { x: Number(shape.getAttribute("x1")), y: Number(shape.getAttribute("y1")) } },
      { op: "line", point: { x: Number(shape.getAttribute("x2")), y: Number(shape.getAttribute("y2")) } },
    ] });
    else if (shape.localName === "path") primitives.push({ ...base, kind: "path", commands: pathCommands(shape.getAttribute("d")!) });
    else if (shape.localName === "rect") {
      const x = Number(shape.getAttribute("x")); const y = Number(shape.getAttribute("y"));
      const width = Number(shape.getAttribute("width")); const height = Number(shape.getAttribute("height"));
      primitives.push({ ...base, kind: "path", commands: [{ op: "move", point: { x, y } },
        { op: "line", point: { x: x + width, y } }, { op: "line", point: { x: x + width, y: y + height } },
        { op: "line", point: { x, y: y + height } }, { op: "close" }] });
    }
  }));
  for (const path of root.querySelectorAll<SVGPathElement>('path[data-entity-id^="flat:polo:FRONT_FLAT:mark:"]')) {
    if (path.closest("g[data-entity-id]")) continue;
    primitives.push({ kind: "path", id: path.getAttribute("data-entity-id")!, feature: "closure",
      layer: path.getAttribute("data-layer") as TechnicalFlatPrimitive["layer"],
      source: { sourceClass: "PATTERN_DERIVED", sourceId: path.getAttribute("data-source-id")!, revisionId },
      commands: pathCommands(path.getAttribute("d")!) });
  }
  const markerGroups = new Map([...root.querySelectorAll<SVGGElement>("g[data-pom-key]")]
    .map((group) => [group.getAttribute("data-pom-key")!, group]));
  const scheduleRows = [...root.querySelectorAll<SVGTextElement>("[data-schedule-for]")];
  for (const row of scheduleRows) {
    const key = row.getAttribute("data-pom-key")!;
    const marker = markerGroups.get(key)!;
    const circle = marker.querySelector("circle")!;
    const sourceId = row.getAttribute("data-source-id")!;
    const targetId = row.getAttribute("data-callout-target")!;
    const sourceEntityId = row.getAttribute("data-callout-source-entity") ?? undefined;
    const markerStyle = key === "H" ? "segmented-open-halo" as const
      : circle.getAttribute("fill") === "none" ? "open-halo" as const : "filled" as const;
    primitives.push({ kind: "callout", id: row.getAttribute("data-schedule-for")!, layer: "ANNOTATION", feature: "pom",
      source: { sourceClass: "PATTERN_DERIVED", sourceId, revisionId },
      text: row.textContent!.replace(new RegExp(`^${key}\\s+`, "u"), ""),
      anchor: { primitiveId: targetId, point: { x: Number(circle.getAttribute("cx")), y: Number(circle.getAttribute("cy")) },
        ...(sourceEntityId ? { sourceEntityId } : {}) }, labelAt: { x: 0, y: 0 },
      presentation: { kind: "keyed-marker-schedule", key, markerRadiusCm: Number(circle.getAttribute("r")), markerStyle } });
  }
  const view: TechnicalFlatView = { schemaVersion: 1, viewId: root.getAttribute("data-view-id")!, revisionId,
    recipeId: "polo", kind: "FRONT_FLAT", units: "cm", primitives, notices: [] };
  return { view, callouts: scheduleRows.length, originalPaths };
}

describe("S425 Polo live H marker all-option rendered review", () => {
  it("replays all 17 exact S399 source SVGs through the current renderer and retains all holds", async () => {
    await mkdir(outputDir, { recursive: true });
    const matrix = JSON.parse(await readFile(new URL("../S399-polo-fg-glyph-offset/polo-keyed-marker-trial-matrix.json", import.meta.url), "utf8")) as {
      rows: { caseId: string; revisionId: string; options: Record<string, number> }[];
    };
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    const rows = [] as { caseId: string; revisionId: string; options: Record<string, number>; arcCount: number;
      retainedCoverage: number; scheduleRows: number; pathCount: number; postPaintSamples: number; postPaintContacts: string[];
      browserErrors: number; output: string }[];
    try {
      for (const item of matrix.rows) {
        const input = await readFile(new URL(`${item.caseId}-collar-point.svg`, sourceDir), "utf8");
        const { view, callouts, originalPaths } = renderedSource(input);
        expect(view.revisionId).toBe(item.revisionId);
        const rendered = renderTechnicalFlatSvg(view, { measureText: measure });
        expect(rendered.issues).toEqual([]);
        expect(rendered.svg).not.toBeNull();
        const before = renderedSource(input).originalPaths;
        const afterDom = new JSDOM("").window.DOMParser;
        const outputDoc = new afterDom().parseFromString(rendered.svg!, "image/svg+xml");
        const after = [...outputDoc.querySelectorAll('path[data-entity-id^="flat:polo:FRONT_FLAT:component:"]')]
          .map((path) => `${path.getAttribute("data-entity-id")}|${path.getAttribute("data-source-id")}|${path.getAttribute("data-revision-id")}|${path.getAttribute("d")}`);
        expect(after).toEqual(before);
        const marker = outputDoc.querySelector('g[data-pom-key="H"]')!;
        expect(marker.getAttribute("data-revision-id")).toBe(item.revisionId);
        expect(marker.getAttribute("data-callout-targets")).toContain("flat:polo:FRONT_FLAT:component:front:outline");
        const arcCount = Number(marker.getAttribute("data-marker-arc-count"));
        const retainedCoverage = Number(marker.getAttribute("data-marker-retained-coverage"));
        expect(arcCount).toBeGreaterThanOrEqual(2); expect(arcCount).toBeLessThanOrEqual(3);
        expect(retainedCoverage).toBeGreaterThanOrEqual(0.5);
        expect(marker.querySelectorAll('[data-segmented-marker="S425"]')).toHaveLength(1);
        expect(outputDoc.querySelectorAll("[data-layer-group='POM_SCHEDULE'] [data-schedule-for]")).toHaveLength(callouts);
        await page.setContent(rendered.svg!, { waitUntil: "load" });
        const postPaint = await page.evaluate(() => {
          const root = document.querySelector("svg")!;
          const markerPath = root.querySelector('g[data-pom-key="H"] path[data-segmented-marker="S425"]')!;
          const obstacles: SVGGeometryElement[] = [
            ...root.querySelectorAll<SVGPathElement>('path[data-entity-id^="flat:polo:FRONT_FLAT:component:"]'),
            ...[...root.querySelectorAll<SVGGElement>('[data-entity-id*="mark:"]')]
              .filter((element) => element.matches("g"))
              .flatMap((group) => [...group.querySelectorAll<SVGGeometryElement>("circle,path,line,rect")]),
          ];
          const length = markerPath.getTotalLength();
          const count = Math.max(2, Math.ceil(length / 0.002));
          let collidingSamples = 0;
          const contacts = new Set<string>();
          for (let index = 0; index <= count; index += 1) {
            const point = markerPath.getPointAtLength(length * index / count);
            const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(markerPath.getScreenCTM());
            for (const obstacle of obstacles) {
              if (typeof obstacle.isPointInStroke !== "function") continue;
              const local = screenPoint.matrixTransform(obstacle.getScreenCTM().inverse());
              if (obstacle.isPointInStroke(local)) {
                collidingSamples += 1;
                contacts.add(obstacle.getAttribute("data-entity-id") ?? obstacle.closest("[data-entity-id]")?.getAttribute("data-entity-id") ?? "unknown");
              }
            }
          }
          return { sampledPoints: count + 1, collidingSamples, contacts: [...contacts].sort() };
        });
        expect(postPaint.collidingSamples).toBe(0);
        const output = `${item.caseId}-S425.svg`;
        await writeFile(new URL(output, outputDir), rendered.svg!, "utf8");
        if (item.caseId === "polo-default" || item.caseId === "polo-standFrontRise-min") {
          await page.locator("svg").evaluate((element) => {
            element.setAttribute("viewBox", "2 -4 10 8");
            element.setAttribute("width", "1200"); element.setAttribute("height", "900");
          });
          await page.screenshot({ path: fileURLToPath(new URL(`${item.caseId}-S425.png`, outputDir)) });
        }
        rows.push({ caseId: item.caseId, revisionId: item.revisionId, options: item.options, arcCount, retainedCoverage,
          scheduleRows: callouts, pathCount: originalPaths.length, postPaintSamples: postPaint.sampledPoints,
          postPaintContacts: postPaint.contacts, browserErrors: errors.length, output });
      }
    } finally { await browser.close(); }
    const summary = { options: rows.length, facesStillHeld: rows.length * 2, minArcCount: Math.min(...rows.map((row) => row.arcCount)),
      maxArcCount: Math.max(...rows.map((row) => row.arcCount)), minRetainedCoverage: Math.min(...rows.map((row) => row.retainedCoverage)),
      maxRetainedCoverage: Math.max(...rows.map((row) => row.retainedCoverage)), browserErrors: errors, rows };
    expect(rows).toHaveLength(17); expect(errors).toEqual([]);
    await writeFile(matrixPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  });
});
