import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import verificationHelpers from "../../electron/verify-common.cjs";

const output = path.resolve("docs/research/epic17/S283-skirt-browser");
const { startPreviewServer } = verificationHelpers;
const preview = await startPreviewServer();
let browser;
try {
  await fs.mkdir(output, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1800 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${preview.url}/`, { waitUntil: "networkidle" });
  if (await page.locator("#welcome-start").isVisible()) await page.locator("#welcome-start").click();
  if (!(await page.locator("#garment-skirt").isVisible())) await page.locator("#journey-step-start").click();
  await page.locator("#garment-skirt").click();
  await page.locator("#journey-step-fit").click();
  if (!(await page.locator("#advanced-views").evaluate((node) => node.open))) await page.locator("#advanced-view-label").click();
  await page.locator("#view-flat").click();

  const configurations = [
    { id: "default", waist: null, ease: null },
    { id: "waist-70-ease-2", waist: 70, ease: 2 },
    { id: "waist-112-ease-12", waist: 112, ease: 12 },
  ];
  const faces = [];
  const setMeasurement = async (key, value) => {
    const input = page.locator(`#controls-panel input[data-field='${key}']`);
    await input.evaluate((node, next) => {
      const field = node;
      field.value = String(next);
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  };
  for (const config of configurations) {
    if (config.waist !== null) {
      await setMeasurement("waist", config.waist);
      await setMeasurement("ease", config.ease);
    }
    for (const face of ["FRONT_FLAT", "BACK_FLAT"]) {
      const shortFace = face === "FRONT_FLAT" ? "front" : "back";
      const button = page.locator(face === "FRONT_FLAT" ? "#technical-flat-front" : "#technical-flat-back");
      await button.evaluate((node) => node.click());
      await page.waitForFunction((expected) => document.querySelector("[data-technical-flat-svg] svg")?.getAttribute("data-view-kind") === expected,
        face, { timeout: 10000 });
      await page.evaluate(() => document.fonts.ready);
      const svg = page.locator("[data-technical-flat-svg] svg");
      const name = `${config.id}-${shortFace}`;
      const details = await svg.evaluate((root) => ({
        recipeId: root.getAttribute("data-recipe-id"), face: root.getAttribute("data-view-kind"),
        revision: root.getAttribute("data-revision-id"), svg: root.outerHTML,
        ids: [...root.querySelectorAll("[data-entity-id]")].map((node) => node.getAttribute("data-entity-id")),
        text: [...root.querySelectorAll("text")].map((node) => node.textContent),
      }));
      assert.equal(details.recipeId, "skirt");
      assert.equal(details.face, face);
      assert.match(details.ids.join("\n"), /component:waistband:outline/u);
      await fs.writeFile(path.join(output, `${name}.svg`), details.svg, "utf8");
      await svg.screenshot({ path: path.join(output, `${name}.png`), animations: "disabled" });
      faces.push({ name, recipeId: details.recipeId, face, revision: details.revision, entityIds: details.ids, labels: details.text });
    }
  }
  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(pageErrors, []);
  assert.equal(faces[0].revision, faces[1].revision);
  const evidence = { generatedAt: new Date().toISOString(), browser: "Playwright Chromium production preview through the live app UI",
    configurations, faces, consoleErrors, pageErrors };
  await fs.writeFile(path.join(output, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ faceCount: faces.length, revisions: [...new Set(faces.map((face) => face.revision))], consoleErrors, pageErrors }, null, 2)}\n`);
} finally {
  if (browser) await browser.close();
  preview.stop();
}
