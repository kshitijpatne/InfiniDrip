import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const productionUrl = process.argv[2] ?? "http://127.0.0.1:4175/";
const devUrl = process.argv[3] ?? "http://127.0.0.1:4173/";
const evidenceDir = new URL("./evidence/", import.meta.url);
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const externalRequests = [];
const pageErrors = [];
page.on("request", (request) => {
  const url = new URL(request.url());
  if (!(["127.0.0.1", "localhost"].includes(url.hostname))) externalRequests.push(request.url());
});
page.on("pageerror", (error) => pageErrors.push(error.message));

const evidence = {
  productionUrl,
  devUrl,
  checks: [],
  externalRequests,
  pageErrors,
  screenshots: [],
};
const check = (name, result) => {
  assert.equal(result, true, name);
  evidence.checks.push(name);
};

try {
  await page.goto(productionUrl, { waitUntil: "networkidle" });
  await page.locator("#tutorial-panel.uiq-foundation-panel").waitFor();
  check("production app renders flagged foundation panel", await page.locator("#tutorial-panel.uiq-foundation").count() === 1);
  check("welcome copy and caveat remain visible", (await page.locator("#tutorial-panel").innerText()).includes("Nothing has been sewn or fit-tested"));
  check("primary and secondary action IDs remain stable", await page.locator("#welcome-start").count() === 1 && await page.locator("#welcome-skip").count() === 1);
  check("native title remains the focus target", await page.locator("#tutorial-title").getAttribute("tabindex") === "-1");
  const buttonHeight = await page.locator("#welcome-start").evaluate((button) => Number.parseFloat(getComputedStyle(button).minHeight));
  check("foundation tour actions have at least 44px minimum target", buttonHeight >= 44);
  const panelStyle = await page.locator("#tutorial-panel").evaluate((panel) => ({
    background: getComputedStyle(panel).backgroundColor,
    focusOutline: getComputedStyle(panel.querySelector("button")).outlineStyle,
  }));
  check("foundation panel uses an opaque solid background", panelStyle.background !== "rgba(0, 0, 0, 0)" && panelStyle.background !== "transparent");
  check("keyboard modality exposes a visible focus ring", await page.locator("#welcome-start").focus().then(async () => {
    await page.keyboard.press("Tab");
    return page.evaluate(() => document.activeElement?.matches(":focus-visible") === true) &&
      await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== "none");
  }));
  await page.addScriptTag({
    path: fileURLToPath(new URL("../../../node_modules/axe-core/axe.min.js", import.meta.url)),
  });
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document.querySelector("#tutorial-panel"), {
      runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    });
    return result.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length }));
  });
  evidence.axeViolations = violations;
  check("guided-tour panel has no WCAG 2.1 A/AA violations", violations.length === 0);
  await page.screenshot({ path: fileURLToPath(new URL("S734-foundation-desktop.png", evidenceDir)), fullPage: true });
  evidence.screenshots.push("docs/research/uiq02-integration/evidence/S734-foundation-desktop.png");

  await page.setViewportSize({ width: 320, height: 900 });
  const narrow = await page.locator("#tutorial-panel").evaluate((panel) => ({
    panelWidth: panel.clientWidth,
    panelScrollWidth: panel.scrollWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
  }));
  check("320px view has no tutorial-panel horizontal overflow", narrow.panelScrollWidth <= narrow.panelWidth);
  check("320px view creates no page-level horizontal overflow", narrow.documentWidth <= narrow.viewportWidth);
  await page.screenshot({ path: fileURLToPath(new URL("S734-foundation-narrow.png", evidenceDir)), fullPage: true });
  evidence.screenshots.push("docs/research/uiq02-integration/evidence/S734-foundation-narrow.png");

  await page.emulateMedia({ reducedMotion: "reduce" });
  check("reduced-motion suppresses transitions", await page.locator("#welcome-start").evaluate((el) => getComputedStyle(el).transitionDuration === "0s"));
  await page.emulateMedia({ forcedColors: "active" });
  check("forced-colors mode is active", await page.evaluate(() => matchMedia("(forced-colors: active)").matches));
  const forced = await page.locator("#tutorial-panel").evaluate((el) => ({
    filter: getComputedStyle(el).backdropFilter,
    background: getComputedStyle(el).backgroundColor,
  }));
  check("forced-colors disables glass and retains a system background", forced.filter === "none" && forced.background !== "rgba(0, 0, 0, 0)");
  await page.screenshot({ path: fileURLToPath(new URL("S734-foundation-forced-colors.png", evidenceDir)), fullPage: true });
  evidence.screenshots.push("docs/research/uiq02-integration/evidence/S734-foundation-forced-colors.png");

  await page.emulateMedia({ forcedColors: "none", reducedMotion: "no-preference" });
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    let failed = false;
    Storage.prototype.setItem = function (key, value) {
      if (key === "patternworks_journey_v1" && !failed) {
        failed = true;
        throw new Error("synthetic storage-unavailable pressure test");
      }
      return original.call(this, key, value);
    };
  });
  await page.locator("#welcome-start").click();
  check("welcome action still advances the existing journey", await page.locator("#tutorial-title").innerText().then((text) => text.includes("Choose what to design")));
  check("foundation remains on the next active tour step", await page.locator("#tutorial-panel.uiq-foundation-panel").count() === 1);
  const storageWarning = page.locator(".tutorial-storage-notice");
  const warningText = (await storageWarning.innerText()).toLowerCase();
  check("storage failure produces a visible labelled status", await storageWarning.getAttribute("role") === "status" &&
    warningText.includes("warning") && warningText.includes("may not survive a reload"));
  await page.locator("#journey-next").click();
  check("foundation persists into the Measure tour step", await page.locator("#tutorial-title").innerText() === "Review measurements." &&
    await page.locator("#tutorial-panel.uiq-foundation-panel").count() === 1);

  const fallbackPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await fallbackPage.goto(devUrl, { waitUntil: "networkidle" });
  await fallbackPage.evaluate(async () => {
    const { tutorialMarkup } = await import("/src/ui/journey.ts");
    document.querySelector("#tutorial-host").innerHTML = tutorialMarkup({ status: "unseen", step: "welcome" });
  });
  check("legacy OFF view omits foundation classes", await fallbackPage.locator("#tutorial-panel").evaluate((el) => !el.classList.contains("uiq-foundation-panel")));
  check("legacy OFF view preserves original button sizing", await fallbackPage.locator("#welcome-start").evaluate((el) => getComputedStyle(el).minHeight !== "44px"));
  await fallbackPage.screenshot({ path: fileURLToPath(new URL("S734-legacy-fallback-desktop.png", evidenceDir)), fullPage: true });
  evidence.screenshots.push("docs/research/uiq02-integration/evidence/S734-legacy-fallback-desktop.png");
  await fallbackPage.close();

  check("no browser page errors", pageErrors.length === 0);
  check("no non-local network requests", externalRequests.length === 0);
  await writeFile(new URL("S734-browser-verification.json", evidenceDir), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
