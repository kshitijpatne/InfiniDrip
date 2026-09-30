import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import verificationHelpers from "../../../../electron/verify-common.cjs";

const { startPreviewServer } = verificationHelpers;
const output = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  await fs.mkdir(output, { recursive: true });
  const preview = await startPreviewServer();
  let browser;
  const consoleErrors = [];
  const pageErrors = [];
  const requestErrors = [];
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
    await page.locator("[data-surface-field='pieceRole']").first().evaluate((input) => input.dispatchEvent(new Event("focusout", { bubbles: true })));

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
    const faces = [];
    for (const [kind, selector, name] of [["FRONT_FLAT", "#technical-flat-front", "front"], ["BACK_FLAT", "#technical-flat-back", "back"]]) {
      await page.locator(selector).click();
      await page.locator(selector).evaluate((button) => button.click());
      await page.waitForFunction(({ selector: buttonSelector, expected }) =>
        document.querySelector(buttonSelector)?.getAttribute("aria-pressed") === "true"
        && (document.querySelector("[data-technical-flat-svg] svg")?.getAttribute("data-view-kind") === expected
          || !document.querySelector("[data-technical-flat-svg] svg")),
      { selector, expected: kind }, { timeout: 10000 });
      const revision = await page.locator("[data-technical-flat-revision]").getAttribute("data-technical-flat-revision").catch(() => null);
      const issues = (await page.locator("[data-technical-flat-issues]").allTextContents()).join("\n").trim() || null;
      const svgCount = await page.locator("[data-technical-flat-svg] svg").count();
      if (kind === "FRONT_FLAT") {
        assert.equal(svgCount, 0, "the Trouser front must remain wholly held with no partial SVG");
        assert.match(issues ?? "", /view:trouser:waistband:center-front/u, "the exact front join hold must remain visible");
        assert.match(await page.locator("p[role='status']").filter({ hasText: "Technical flat withheld" }).first().textContent(), /no partial face is shown/iu);
        await page.locator("#canvas-host").screenshot({ path: path.join(output, "front-held.png"), animations: "disabled" });
        faces.push({ kind, revision, blocked: true, svgCount, issues, screenshot: "front-held.png" });
        continue;
      }

      assert.equal(svgCount, 1, "the accepted Trouser back must emit one vector flat");
      const svg = page.locator("[data-technical-flat-svg] svg");
      const evidence = await svg.evaluate((root) => {
        const rootRevision = root.getAttribute("data-revision-id");
        const artwork = [...root.querySelectorAll("[data-layer='ARTWORK']")].map((node) => ({
          placementId: node.getAttribute("data-placement-id"), assetId: node.getAttribute("data-asset-id"),
          sourceId: node.getAttribute("data-source-id"), revision: node.getAttribute("data-revision-id"),
          zOrder: Number(node.getAttribute("data-z-order")), bounds: (() => {
            const box = node.getBBox(); return { x: box.x, y: box.y, width: box.width, height: box.height };
          })(),
        }));
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
        return { recipeId: root.getAttribute("data-recipe-id"), kind: root.getAttribute("data-view-kind"), revision: rootRevision,
          color: root.getAttribute("data-color"), artwork, callouts, labels, overlaps, fills, layerSequence, parserError,
          entityRevisionMismatch: [...root.querySelectorAll("[data-revision-id]")].some((node) => node.getAttribute("data-revision-id") !== rootRevision),
          svg: root.outerHTML };
      });
      assert.equal(evidence.recipeId, "trouser");
      assert.equal(evidence.kind, kind);
      assert.ok(evidence.revision?.startsWith("live-draft:trouser:"));
      assert.equal(evidence.revision, revision, "the back must match the exact displayed live draft revision");
      assert.equal(evidence.color, selectedSwatch.color);
      assert.equal(evidence.entityRevisionMismatch, false);
      assert.equal(evidence.parserError, false);
      assert.equal(evidence.artwork.length, 1, "one local artwork boundary should appear on the selected back role");
      assert.equal(evidence.artwork[0].assetId, assetId);
      assert.equal(evidence.artwork[0].sourceId?.startsWith("style:artwork:"), true);
      assert.equal(evidence.artwork[0].revision, evidence.revision);
      assert.ok(evidence.fills.some((fill) => fill.fill === selectedSwatch.color && fill.revision === evidence.revision));
      assert.deepEqual(evidence.overlaps, [], "back POM labels must remain non-overlapping");
      assert.ok(evidence.callouts.some((callout) => callout.sourceId === "pom:trouser:back-rise-finished-incl-waistband"
        && callout.target === "flat:trouser:BACK_FLAT:component:backLeft:outline" && callout.revision === evidence.revision && callout.label));
      assert.ok(evidence.callouts.some((callout) => callout.sourceId === "pom:trouser:waistband-depth-finished"
        && callout.target === "live-flat:trouser:BACK_FLAT:waistband:mark:centerBack" && callout.revision === evidence.revision && callout.label));
      assert.ok(evidence.layerSequence.indexOf("ARTWORK") > evidence.layerSequence.indexOf("GARMENT_SILHOUETTE"));
      assert.ok(evidence.layerSequence.indexOf("CALLOUT") > evidence.layerSequence.indexOf("ARTWORK"));
      await fs.writeFile(path.join(output, `back.svg`), evidence.svg, "utf8");
      await svg.screenshot({ path: path.join(output, "back-overlay.png"), animations: "disabled", timeout: 20000 });
      delete evidence.svg;
      faces.push({ ...evidence, kind, blocked: false, svgCount, screenshot: "back-overlay.png" });
    }

    assert.equal(faces[0].revision, null, "a fully held front should not claim an emitted-view revision");
    assert.ok(faces[1].revision, "the accepted back must retain its live draft revision");
    assert.deepEqual(consoleErrors, [], "production overlay should not log console errors");
    assert.deepEqual(pageErrors, [], "production overlay should not throw page errors");
    assert.deepEqual(requestErrors, [], "overlay must use local assets and make no remote request");
    const result = { generatedAt: new Date().toISOString(), browser: "Playwright Chromium production preview through the live app UI",
      viewport: { width: 1440, height: 3000 }, recipeId: "trouser", targetRole: "backLeft", assetId,
      color: selectedSwatch.color, colorLabel: selectedSwatch.label, faces, consoleErrors, pageErrors, requestErrors };
    await fs.writeFile(path.join(output, "matrix.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify({ recipeId: result.recipeId, targetRole: result.targetRole, assetId, color: result.color,
      faceCount: faces.length, accepted: faces.filter((face) => !face.blocked).length, held: faces.filter((face) => face.blocked).length,
      consoleErrors, pageErrors, requestErrors }, null, 2)}\n`);
  } finally {
    if (browser) await browser.close();
    preview.stop();
  }
}

main().catch((error) => { process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1; });
