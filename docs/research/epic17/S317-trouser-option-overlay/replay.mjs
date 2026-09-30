import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import verificationHelpers from "../../../../electron/verify-common.cjs";

const { startPreviewServer } = verificationHelpers;
const output = path.dirname(fileURLToPath(import.meta.url));
const cases = [
  { caseId: "default", options: {} },
  { caseId: "waistbandDepth-min", options: { waistbandDepth: 2 } },
  { caseId: "waistbandDepth-max", options: { waistbandDepth: 8 } },
  { caseId: "legOpening-min", options: { legOpening: 25 } },
  { caseId: "legOpening-max", options: { legOpening: 65 } },
];

async function selectFace(page, selector, kind) {
  await page.locator(selector).click();
  await page.locator(selector).evaluate((button) => button.click());
  await page.waitForFunction(({ selector: buttonSelector, expected }) =>
    document.querySelector(buttonSelector)?.getAttribute("aria-pressed") === "true"
      && (document.querySelector("[data-technical-flat-svg] svg")?.getAttribute("data-view-kind") === expected
        || !document.querySelector("[data-technical-flat-svg] svg")),
  { selector, expected: kind }, { timeout: 10000 });
}

async function main() {
  await fs.mkdir(output, { recursive: true });
  const preview = await startPreviewServer();
  let browser;
  const consoleErrors = [];
  const pageErrors = [];
  const requestErrors = [];
  const results = [];
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 3000 }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(10000);
    const origin = new URL(preview.url).origin;
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("request", (request) => { if (new URL(request.url()).origin !== origin) requestErrors.push(request.url()); });
    await page.goto(`${preview.url}/`, { waitUntil: "networkidle" });
    if (await page.locator("#welcome-start").isVisible()) await page.locator("#welcome-start").click();
    if (!(await page.locator("#garment-trouser").isVisible())) await page.locator("#journey-step-start").click();
    await page.locator("#garment-trouser").click();
    await page.locator("#journey-step-fit").click();

    const library = page.locator("details.artwork-library");
    if (!(await library.evaluate((node) => node.open))) await library.locator("summary").click();
    const stage = page.locator("button[data-artwork-stage-id]").first();
    const assetId = await stage.getAttribute("data-artwork-stage-id");
    assert.ok(assetId, "the local bundled-art library should expose a stable asset ID");
    await stage.evaluate((button) => button.click());
    await page.locator("#surface-new-role").fill("backLeft");
    await page.locator("#surface-new-width").fill("10");
    await page.locator("#surface-new-height").fill("6");
    await page.locator("#surface-add").evaluate((button) => button.click());
    await page.locator("[data-surface-row]").waitFor({ state: "visible" });
    await page.locator("[data-surface-field='pieceRole']").first()
      .evaluate((input) => input.dispatchEvent(new Event("focusout", { bubbles: true })));

    const currentColor = await page.locator("#appearance-readout").textContent();
    const swatches = await page.locator("#swatch-host button[data-fabric]").evaluateAll((nodes) => nodes.map((button) => ({
      color: button.getAttribute("data-fabric"), label: button.getAttribute("aria-label"),
    })));
    const selectedSwatch = swatches.find((item) => item.color !== currentColor);
    assert.ok(selectedSwatch?.color, "a distinct local colorway should be available");
    await page.locator(`#swatch-host button[data-fabric='${selectedSwatch.color}']`).evaluate((button) => button.click());

    const advanced = page.locator("#advanced-views");
    if (!(await advanced.evaluate((node) => node.open))) await page.locator("#advanced-view-label").click();
    await page.locator("#view-flat").click();

    for (const testCase of cases) {
      for (const [option, value] of Object.entries(testCase.options)) {
        const input = page.locator(`input[data-option='${option}']`);
        assert.equal(await input.count(), 1, `${option} should have one live control`);
        const pageIndex = await input.evaluate((node) => node.closest("fieldset")?.getAttribute("data-control-page"));
        assert.ok(pageIndex !== null, `${option} should belong to a declared control page`);
        await page.locator("#control-page-select").selectOption(pageIndex);
        await input.waitFor({ state: "visible" });
        await input.fill(String(value));
        await input.dispatchEvent("input");
        await input.dispatchEvent("change");
        assert.equal(await input.inputValue(), String(value), `${option} should remain at its authored endpoint`);
      }

      const faces = [];
      await selectFace(page, "#technical-flat-front", "FRONT_FLAT");
      const frontSvgCount = await page.locator("[data-technical-flat-svg] svg").count();
      const frontIssues = (await page.locator("[data-technical-flat-issues]").allTextContents()).join("\n").trim();
      assert.equal(frontSvgCount, 0, `${testCase.caseId}: Trouser front must remain wholly held`);
      assert.match(frontIssues, /view:trouser:waistband:center-front/u, `${testCase.caseId}: exact front join hold remains visible`);
      assert.match(await page.locator("p[role='status']").filter({ hasText: "Technical flat withheld" }).first().textContent(), /no partial face is shown/iu);
      const frontRevision = await page.locator("[data-technical-flat-revision]")
        .getAttribute("data-technical-flat-revision").catch(() => null);
      if (testCase.caseId === "default") {
        await page.locator("#canvas-host").screenshot({ path: path.join(output, "front-held.png"), animations: "disabled" });
      }
      faces.push({ kind: "FRONT_FLAT", blocked: true, svgCount: frontSvgCount, revision: frontRevision,
        issues: frontIssues, screenshot: testCase.caseId === "default" ? "front-held.png" : null });

      await selectFace(page, "#technical-flat-back", "BACK_FLAT");
      assert.equal(await page.locator("[data-technical-flat-svg] svg").count(), 1, `${testCase.caseId}: one back SVG emits`);
      const svg = page.locator("[data-technical-flat-svg] svg");
      const evidence = await svg.evaluate(async (root) => {
        const revision = root.getAttribute("data-revision-id");
        const artworkNodes = [...root.querySelectorAll("[data-layer='ARTWORK']")];
        const artwork = artworkNodes.map((node) => {
          const box = node.getBBox();
          return { nodeName: node.localName, placementId: node.getAttribute("data-placement-id"), assetId: node.getAttribute("data-asset-id"),
            sourceId: node.getAttribute("data-source-id"), revision: node.getAttribute("data-revision-id"), zOrder: Number(node.getAttribute("data-z-order")),
            bounds: { x: box.x, y: box.y, width: box.width, height: box.height } };
        });
        const outline = root.querySelector("path[data-layer='GARMENT_SILHOUETTE'][data-source-id='pattern:trouser:role:backLeft']");
        const containmentSamples = [];
        let outlineChain = { closed: false, connected: false, edgeCount: 0, points: [] };
        if (outline && artworkNodes.length === 1) {
          const art = artworkNodes[0]; const box = art.getBBox(); const inverseOutline = outline.getScreenCTM()?.inverse();
          const toOutline = art.getScreenCTM();
          const tokens = outline.getAttribute("d")?.match(/[MLC]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/giu) ?? [];
          const edges = [];
          let edge = null; let cursor = 0;
          const takePoint = () => ({ x: Number(tokens[cursor++]), y: Number(tokens[cursor++]) });
          while (cursor < tokens.length) {
            const command = tokens[cursor++];
            if (command === "M") {
              if (edge) edges.push(edge);
              const start = takePoint(); edge = { start, points: [start] };
            } else if (command === "L" && edge) {
              const end = takePoint(); edge.points.push(end);
            } else if (command === "C" && edge) {
              const control1 = takePoint(); const control2 = takePoint(); const end = takePoint();
              const start = edge.points.at(-1);
              for (let step = 1; step <= 20; step += 1) {
                const t = step / 20; const u = 1 - t;
                edge.points.push({ x: u ** 3 * start.x + 3 * u ** 2 * t * control1.x + 3 * u * t ** 2 * control2.x + t ** 3 * end.x,
                  y: u ** 3 * start.y + 3 * u ** 2 * t * control1.y + 3 * u * t ** 2 * control2.y + t ** 3 * end.y });
              }
            } else throw new Error(`Unsupported authored outline path command: ${command}`);
          }
          if (edge) edges.push(edge);
          const samePoint = (a, b) => Math.abs(a.x - b.x) <= 0.0001 && Math.abs(a.y - b.y) <= 0.0001;
          const connected = edges.length > 0 && edges.every((item, index) => samePoint(item.points.at(-1), edges[(index + 1) % edges.length].start));
          const polygon = connected ? edges.flatMap((item, index) => index === 0 ? item.points : item.points.slice(1)).slice(0, -1) : [];
          const inPolygon = (point) => {
            let inside = false;
            for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
              const a = polygon[i]; const b = polygon[j];
              if ((a.y > point.y) !== (b.y > point.y)
                && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
            }
            return inside;
          };
          outlineChain = { closed: edges.length > 0 && samePoint(edges.at(-1).points.at(-1), edges[0].start),
            connected: edges.length > 0 && edges.every((item, index) => samePoint(item.points.at(-1), edges[(index + 1) % edges.length].start)),
            edgeCount: edges.length, points: polygon };
          if (inverseOutline && toOutline) {
            for (let row = 0; row <= 10; row += 1) for (let column = 0; column <= 10; column += 1) {
              const point = root.createSVGPoint();
              point.x = box.x + box.width * (0.001 + 0.998 * column / 10);
              point.y = box.y + box.height * (0.001 + 0.998 * row / 10);
              const local = point.matrixTransform(toOutline).matrixTransform(inverseOutline);
              containmentSamples.push({ x: Number(local.x.toFixed(4)), y: Number(local.y.toFixed(4)), inside: inPolygon(local) });
            }
          }
        }
        const callouts = [...root.querySelectorAll("g[data-callout-target]")].map((node) => ({
          id: node.getAttribute("data-entity-id"), sourceId: node.getAttribute("data-source-id"),
          target: node.getAttribute("data-callout-target"), revision: node.getAttribute("data-revision-id"),
          label: Boolean(root.querySelector(`text[data-label-for='${CSS.escape(node.getAttribute("data-entity-id"))}']`)),
        }));
        const labels = [...root.querySelectorAll("g[data-layer-group='TEXT_LABELS'] text")].map((node) => {
          const box = node.getBBox(); return { id: node.getAttribute("data-label-for"), x: box.x, y: box.y, width: box.width, height: box.height };
        });
        const overlaps = [];
        for (let left = 0; left < labels.length; left += 1) for (let right = left + 1; right < labels.length; right += 1) {
          const a = labels[left]; const b = labels[right];
          if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) overlaps.push([a.id, b.id]);
        }
        const layerSequence = [...root.querySelectorAll("g[data-layer-group]")].map((node) => node.getAttribute("data-layer-group"));
        const fills = [...root.querySelectorAll("path[data-layer='GARMENT_SILHOUETTE']")].filter((node) => node.getAttribute("fill") !== "none")
          .map((node) => ({ sourceId: node.getAttribute("data-source-id"), fill: node.getAttribute("fill"), revision: node.getAttribute("data-revision-id") }));
        const parserError = Boolean(new DOMParser().parseFromString(root.outerHTML, "image/svg+xml").querySelector("parsererror"));
        const serialized = new XMLSerializer().serializeToString(root);
        const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(serialized)));
        const raster = new Image(); raster.src = `data:image/svg+xml;base64,${encoded}`; await raster.decode();
        const canvas = document.createElement("canvas"); canvas.width = 1006; canvas.height = 2244;
        const context = canvas.getContext("2d"); context.drawImage(raster, 0, 0, canvas.width, canvas.height);
        const viewBox = root.getAttribute("viewBox").split(/\s+/u).map(Number);
        const pixel = (x, y) => [...context.getImageData(Math.round((x - viewBox[0]) / viewBox[2] * canvas.width),
          Math.round((y - viewBox[1]) / viewBox[3] * canvas.height), 1, 1).data];
        const artBox = artworkNodes[0]?.getBBox();
        const colorwayPixel = artBox ? pixel(artBox.x + artBox.width / 2, artBox.y + artBox.height / 2) : null;
        const paperPixel = pixel(-25, 55.5);
        const colorDistance = colorwayPixel ? colorwayPixel.slice(0, 3).reduce((sum, channel, index) => sum + Math.abs(channel - paperPixel[index]), 0) : 0;
        return { revision, recipeId: root.getAttribute("data-recipe-id"), kind: root.getAttribute("data-view-kind"), color: root.getAttribute("data-color"),
          artwork, outlineChain, containmentSamples, callouts, labels, overlaps, layerSequence, fills, parserError,
          rasterColorwayReview: { colorwayPixel, paperPixel, colorDistance, visibleAreaColor: colorDistance >= 10 },
          entityRevisionMismatch: [...root.querySelectorAll("[data-revision-id]")].some((node) => node.getAttribute("data-revision-id") !== revision), svg: root.outerHTML };
      });
      await fs.writeFile(path.join(output, `back-${testCase.caseId}-candidate.svg`), evidence.svg, "utf8");
      await svg.screenshot({ path: path.join(output, `back-${testCase.caseId}-candidate.png`), animations: "disabled", timeout: 20000 });
      await fs.writeFile(path.join(output, `back-${testCase.caseId}-diagnostics.json`), `${JSON.stringify({ caseId: testCase.caseId,
        bounds: evidence.artwork[0]?.bounds, containmentSamples: evidence.containmentSamples, labels: evidence.labels, callouts: evidence.callouts }, null, 2)}\n`, "utf8");
      assert.equal(evidence.recipeId, "trouser");
      assert.equal(evidence.kind, "BACK_FLAT");
      assert.ok(evidence.revision?.startsWith("live-draft:trouser:"));
      assert.equal(evidence.color, selectedSwatch.color);
      assert.equal(evidence.entityRevisionMismatch, false, `${testCase.caseId}: all emitted entities use one exact revision`);
      assert.equal(evidence.parserError, false, `${testCase.caseId}: emitted SVG parses`);
      assert.equal(evidence.artwork.length, 1, `${testCase.caseId}: one artwork placement remains`);
      assert.equal(evidence.artwork[0].assetId, assetId);
      assert.ok(evidence.artwork[0].sourceId?.startsWith("style:artwork:"));
      assert.equal(evidence.artwork[0].revision, evidence.revision);
      assert.ok(evidence.outlineChain.closed && evidence.outlineChain.connected && evidence.outlineChain.edgeCount > 0,
        `${testCase.caseId}: require exact endpoint adjacency around the authored backLeft edge loop before constructing a containment region`);
      assert.equal(evidence.containmentSamples.length, 121, `${testCase.caseId}: sample the full artwork boundary region`);
      assert.ok(evidence.containmentSamples.every((sample) => sample.inside), `${testCase.caseId}: sampled boundary lies within backLeft silhouette`);
      assert.ok(evidence.fills.some((fill) => fill.fill === selectedSwatch.color && fill.revision === evidence.revision));
      assert.deepEqual(evidence.overlaps, [], `${testCase.caseId}: all labels remain non-overlapping`);
      assert.ok(evidence.callouts.some((callout) => callout.sourceId === "pom:trouser:back-rise-finished-incl-waistband"
        && callout.target === "flat:trouser:BACK_FLAT:component:backLeft:outline" && callout.revision === evidence.revision && callout.label));
      assert.ok(evidence.callouts.some((callout) => callout.sourceId === "pom:trouser:waistband-depth-finished"
        && callout.target === "live-flat:trouser:BACK_FLAT:waistband:mark:centerBack" && callout.revision === evidence.revision && callout.label));
      assert.ok(evidence.layerSequence.indexOf("ARTWORK") > evidence.layerSequence.indexOf("GARMENT_SILHOUETTE"));
      assert.ok(evidence.layerSequence.indexOf("CALLOUT") > evidence.layerSequence.indexOf("ARTWORK"));
      const screenshot = `back-${testCase.caseId}.png`;
      await fs.writeFile(path.join(output, `back-${testCase.caseId}.svg`), evidence.svg, "utf8");
      await svg.screenshot({ path: path.join(output, screenshot), animations: "disabled", timeout: 20000 });
      delete evidence.svg;
      faces.push({ ...evidence, blocked: false, svgCount: 1, screenshot });
      assert.notEqual(frontRevision, evidence.revision);
      results.push({ caseId: testCase.caseId, options: testCase.options, faces });
    }

    assert.deepEqual(consoleErrors, [], "no console errors");
    assert.deepEqual(pageErrors, [], "no page errors");
    assert.deepEqual(requestErrors, [], "all used assets and local state avoid external requests");
    const result = { generatedAt: new Date().toISOString(), browser: "Playwright Chromium production preview through the live app UI",
      viewport: { width: 1440, height: 3000 }, recipeId: "trouser", targetRole: "backLeft", assetId,
      color: selectedSwatch.color, colorLabel: selectedSwatch.label, cases: results, consoleErrors, pageErrors, requestErrors };
    await fs.writeFile(path.join(output, "matrix.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify({ recipeId: result.recipeId, targetRole: result.targetRole, assetId, color: result.color,
      caseCount: results.length, acceptedBacks: results.flatMap((item) => item.faces).filter((face) => !face.blocked).length,
      heldFronts: results.flatMap((item) => item.faces).filter((face) => face.blocked).length,
      totalContainmentSamples: results.flatMap((item) => item.faces).filter((face) => !face.blocked)
        .reduce((sum, face) => sum + face.containmentSamples.length, 0), consoleErrors, pageErrors, requestErrors }, null, 2)}\n`);
  } finally {
    if (browser) await browser.close();
    preview.stop();
  }
}

main().catch((error) => { process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1; });
