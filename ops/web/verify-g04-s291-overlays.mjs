import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import verificationHelpers from "../../electron/verify-common.cjs";

const { startPreviewServer } = verificationHelpers;
const output = path.resolve("docs/research/epic17/S291-browser");

async function main() {
  const preview = await startPreviewServer();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 3000 }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(10000);
    const origin = new URL(preview.url).origin;
    const requestErrors = [];
    page.on("request", (request) => { if (new URL(request.url()).origin !== origin) requestErrors.push(request.url()); });
    await page.goto(`${preview.url}/`, { waitUntil: "networkidle" });
    if (await page.locator("#welcome-start").isVisible()) await page.locator("#welcome-start").click();
    if (!(await page.locator("#garment-tank").isVisible())) await page.locator("#journey-step-start").click();
    await page.locator("#garment-tank").click();
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
      color: button.getAttribute("data-fabric"), pressed: button.getAttribute("aria-pressed"), label: button.getAttribute("aria-label"),
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
        return { recipeId: root.getAttribute("data-recipe-id"), kind: root.getAttribute("data-view-kind"), revision,
          color: root.getAttribute("data-color"), texture: root.getAttribute("data-texture"), shine: root.getAttribute("data-shine"),
          artwork, fills, entityRevisionMismatch: [...root.querySelectorAll("[data-revision-id]")]
            .some((node) => node.getAttribute("data-revision-id") !== revision),
          parserError: Boolean(new DOMParser().parseFromString(root.outerHTML, "image/svg+xml").querySelector("parsererror")) };
      });
      assert.equal(evidence.recipeId, "tank");
      assert.equal(evidence.kind, kind);
      assert.ok(evidence.revision?.startsWith("live-draft:tank:"));
      assert.equal(evidence.color, selectedSwatch.color);
      assert.equal(evidence.entityRevisionMismatch, false);
      assert.equal(evidence.parserError, false);
      if (kind === "FRONT_FLAT") {
        assert.ok(evidence.artwork.some((item) => item.assetId === assetId && item.revision === evidence.revision),
          "the visible front overlay must keep the chosen local artwork asset and exact draft revision");
        assert.ok(evidence.fills.some((item) => item.fill === selectedSwatch.color && item.revision === evidence.revision),
          "the front silhouette must carry the selected colorway on the same revision");
      } else {
        assert.deepEqual(evidence.artwork, [], "front-targeted artwork must not appear on the back");
      }
      await fs.writeFile(path.join(output, `overlay-${name}.svg`), await svg.evaluate((element) => element.outerHTML), "utf8");
      if (kind === "FRONT_FLAT") await svg.screenshot({ path: path.join(output, "overlay-front.png"), animations: "disabled", timeout: 20000 });
      faces.push(evidence);
    }
    assert.equal(faces[0].revision, faces[1].revision, "front and back overlay output must share one live draft revision");
    assert.deepEqual(requestErrors, [], "overlay capture must use local asset URLs and make no remote request");
    const result = { generatedAt: new Date().toISOString(), recipeId: "tank", assetId, color: selectedSwatch.color,
      colorLabel: selectedSwatch.label, faces, requestErrors };
    await fs.writeFile(path.join(output, "overlay-matrix.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    if (browser) await browser.close();
    preview.stop();
  }
}

main().catch((error) => { process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1; });
