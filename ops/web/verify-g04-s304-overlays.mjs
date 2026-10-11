import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import verificationHelpers from "../../electron/verify-common.cjs";

const { startPreviewServer } = verificationHelpers;
const output = path.resolve("docs/research/epic17/S304-browser");
const recipes = ["tank", "skirt"];

async function exerciseRecipe(previewUrl, recipeId, browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 3000 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(10000);
  const origin = new URL(previewUrl).origin;
  const requestErrors = [];
  page.on("request", (request) => { if (new URL(request.url()).origin !== origin) requestErrors.push(request.url()); });
  await page.goto(`${previewUrl}/`, { waitUntil: "networkidle" });
  if (await page.locator("#welcome-start").isVisible()) await page.locator("#welcome-start").click();
  if (!(await page.locator(`#garment-${recipeId}`).isVisible())) await page.locator("#journey-step-start").click();
  await page.locator(`#garment-${recipeId}`).click();
  await page.locator("#journey-step-fit").click();

  const library = page.locator("details.artwork-library");
  if (!(await library.evaluate((node) => node.open))) await library.locator("summary").click();
  const stage = page.locator("button[data-artwork-stage-id]").first();
  const assetId = await stage.getAttribute("data-artwork-stage-id");
  assert.ok(assetId, "the local bundled-art library should expose a stable asset ID");
  await stage.evaluate((button) => button.click());
  await page.locator("#surface-new-role").fill("front");
  await page.locator("#surface-new-width").fill("10");
  await page.locator("#surface-new-height").fill("6");
  await page.locator("#surface-add").evaluate((button) => button.click());
  await page.locator("[data-surface-row]").waitFor({ state: "visible" });
  await page.locator("[data-surface-field='pieceRole']").first().evaluate((input) => input.dispatchEvent(new Event("focusout", { bubbles: true })));

  const currentColor = await page.locator("#appearance-readout").textContent();
  const swatchData = await page.locator("#swatch-host button[data-fabric]").evaluateAll((nodes) => nodes.map((button) => ({
    color: button.getAttribute("data-fabric"), label: button.getAttribute("aria-label"),
  })));
  const selectedSwatch = swatchData.find((item) => item.color !== currentColor);
  assert.ok(selectedSwatch?.color, "a distinct local garment color should be available");
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
        && document.querySelector("[data-technical-flat-svg] svg")?.getAttribute("data-view-kind") === expected,
    { selector, expected: kind }, { timeout: 10000 });
    const svg = page.locator("[data-technical-flat-svg] svg");
    const evidence = await svg.evaluate((root) => {
      const revision = root.getAttribute("data-revision-id");
      const artwork = [...root.querySelectorAll("[data-layer='ARTWORK']")].map((node) => ({
        placementId: node.getAttribute("data-placement-id"), assetId: node.getAttribute("data-asset-id"),
        sourceId: node.getAttribute("data-source-id"), revision: node.getAttribute("data-revision-id"),
        zOrder: Number(node.getAttribute("data-z-order")),
      }));
      const fills = [...root.querySelectorAll("path[data-layer='GARMENT_SILHOUETTE']")]
        .filter((node) => node.getAttribute("fill") !== "none")
        .map((node) => ({ roleSource: node.getAttribute("data-source-id"), fill: node.getAttribute("fill"), revision: node.getAttribute("data-revision-id") }));
      const layers = [...root.querySelectorAll("[data-layer]")].map((node) => node.getAttribute("data-layer"));
      const geometryIds = new Set([...root.querySelectorAll("[data-entity-id]")].map((node) => node.getAttribute("data-entity-id")));
      const calloutTargets = [...root.querySelectorAll("[data-layer='CALLOUT'][data-callout-target]")]
        .map((node) => node.getAttribute("data-callout-target"));
      return {
        recipeId: root.getAttribute("data-recipe-id"), kind: root.getAttribute("data-view-kind"), revision,
        color: root.getAttribute("data-color"), texture: root.getAttribute("data-texture"), shine: root.getAttribute("data-shine"),
        artwork, fills, layerSequence: [...new Set(layers)], calloutCount: calloutTargets.length,
        calloutTargetsResolved: calloutTargets.length > 0 && calloutTargets.every((target) => geometryIds.has(target)),
        entityRevisionMismatch: [...root.querySelectorAll("[data-revision-id]")]
          .some((node) => node.getAttribute("data-revision-id") !== revision),
        parserError: Boolean(new DOMParser().parseFromString(root.outerHTML, "image/svg+xml").querySelector("parsererror")),
      };
    });
    await fs.writeFile(path.join(output, `${recipeId}-${name}.svg`), await svg.evaluate((element) => element.outerHTML), "utf8");
    await svg.screenshot({ path: path.join(output, `${recipeId}-${name}.png`), animations: "disabled", timeout: 20000 });
    process.stdout.write(`${recipeId}/${name}: ${JSON.stringify({ kind: evidence.kind, revision: evidence.revision, calloutCount: evidence.calloutCount, layerSequence: evidence.layerSequence, parserError: evidence.parserError })}\n`);
    assert.equal(evidence.recipeId, recipeId);
    assert.equal(evidence.kind, kind);
    assert.ok(evidence.revision?.startsWith(`live-draft:${recipeId}:`));
    assert.equal(evidence.color, selectedSwatch.color);
    assert.equal(evidence.entityRevisionMismatch, false);
    assert.equal(evidence.parserError, false);
    if (kind === "FRONT_FLAT") {
      assert.ok(evidence.calloutCount > 0, "the front face should retain its geometry-linked POM callouts");
      assert.equal(evidence.calloutTargetsResolved, true, "each front POM leader must target an emitted geometry entity");
      assert.ok(evidence.artwork.some((item) => item.assetId === assetId && item.revision === evidence.revision),
        "the front overlay must retain its chosen local asset and exact draft revision");
      assert.ok(evidence.fills.some((item) => item.roleSource?.includes(":role:front")
        && item.fill === selectedSwatch.color && item.revision === evidence.revision),
      "the front silhouette must carry the selected same-revision colorway");
    } else {
      assert.deepEqual(evidence.artwork, [], "front-targeted artwork must not appear on the back");
      assert.ok(evidence.fills.some((item) => item.roleSource?.includes(":role:back")
        && item.fill === selectedSwatch.color && item.revision === evidence.revision),
      "the back silhouette must carry the selected same-revision colorway");
    }
    faces.push(evidence);
  }
  assert.equal(faces[0].revision, faces[1].revision, "front/back outputs must share one live draft revision");
  assert.deepEqual(requestErrors, [], "overlay capture must use local asset URLs and make no remote request");
  await page.close();
  return { recipeId, assetId, color: selectedSwatch.color, colorLabel: selectedSwatch.label, faces, requestErrors };
}

async function main() {
  await fs.mkdir(output, { recursive: true });
  const preview = await startPreviewServer();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const results = [];
    for (const recipeId of recipes) results.push(await exerciseRecipe(preview.url, recipeId, browser));
    const result = { generatedAt: new Date().toISOString(), scope: "accepted Tank/Skirt output only", recipes: results };
    await fs.writeFile(path.join(output, "overlay-matrix.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    if (browser) await browser.close();
    preview.stop();
  }
}

main().catch((error) => { process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1; });
