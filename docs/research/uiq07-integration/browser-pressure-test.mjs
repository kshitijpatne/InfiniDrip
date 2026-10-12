import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const origin = process.argv[2] ?? "http://127.0.0.1:4175";
const evidenceDir = resolve(process.argv[3] ?? fileURLToPath(new URL("./evidence/", import.meta.url)));
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = {
  verifiedAt: new Date().toISOString(),
  origin,
  checks: [],
  viewports: [],
  screenshots: [],
  externalRequests: [],
  pageErrors: [],
  consoleErrors: [],
};

async function makePage({ unavailableStorage = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  if (unavailableStorage) {
    await context.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() { throw new DOMException("Storage disabled by verification", "SecurityError"); },
      });
    });
  }
  const page = await context.newPage();
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== origin) report.externalRequests.push(request.url());
  });
  page.on("pageerror", (error) => report.pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") report.consoleErrors.push(message.text());
  });
  await context.route("**/*", async (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      report.externalRequests.push(route.request().url());
      await route.abort();
      return;
    }
    await route.continue();
  });
  await page.goto(origin, { waitUntil: "networkidle" });
  return { context, page };
}

try {
  const { context, page } = await makePage();
  assert.equal(await page.locator(".project-startup-error").count(), 0, "fresh app opens without startup error");
  assert.equal(await page.locator("#infini-shell h1").count(), 1, "shell retains a single page-level H1");
  const welcome = page.locator(".uiq-entry");
  await welcome.waitFor({ state: "visible" });
  assert.equal(await page.getByRole("region", { name: "InfiniDrip welcome" }).count(), 1,
    "labelled section exposes the expected landmark region without a redundant explicit role");
  assert.equal(await welcome.getAttribute("aria-label"), "InfiniDrip welcome");
  assert.equal(await welcome.getByRole("heading", { name: "InfiniDrip" }).evaluate((node) => node.tagName), "H2");
  assert.equal(await welcome.getByRole("heading", { name: "Welcome" }).count(), 1);
  assert.match(await welcome.innerText(), /Nothing has been sewn or fit-tested/);
  assert.equal(await welcome.getByRole("button", { name: "Start the tour" }).count(), 1);
  assert.equal(await welcome.getByRole("button", { name: "Skip for now" }).count(), 1);
  report.checks.push("default-first-run-visual-copy-actions-single-h1-and-fit-caveat");

  const axePath = resolve("node_modules/axe-core/axe.min.js");
  await page.addScriptTag({ path: axePath });
  const axe = await page.evaluate(async () => window.axe.run(document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
  }));
  assert.deepEqual(axe.violations.map(({ id }) => id), [], "integrated welcome has no axe WCAG 2.1 AA violations");
  report.accessibility = { engine: "axe-core", wcag21aaViolations: 0, passes: axe.passes.length, incomplete: axe.incomplete.length };
  report.checks.push("axe-wcag-2.1-aa");

  for (const width of [1280, 640, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const metrics = await page.evaluate(() => {
      const panel = document.querySelector(".uiq-entry");
      const content = panel?.querySelector(".uiq-entry__content");
      const panelRect = panel?.getBoundingClientRect();
      const contentRect = content?.getBoundingClientRect();
      return {
        viewportWidth: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
        panelScrollWidth: panel?.scrollWidth,
        panelClientWidth: panel?.clientWidth,
        overflow: panel && getComputedStyle(panel).overflow,
        contentWithinPanel: Boolean(panelRect && contentRect && contentRect.left >= panelRect.left && contentRect.right <= panelRect.right),
      };
    });
    assert.equal(metrics.documentWidth, width, `document does not overflow at ${width}px: ${JSON.stringify(metrics)}`);
    assert.equal(metrics.overflow, "hidden", "decorative geometry remains clipped to the welcome panel");
    assert.equal(metrics.contentWithinPanel, true, `all welcome copy remains in bounds at ${width}px`);
    report.viewports.push({ width, ...metrics });
    report.checks.push(`responsive-no-overflow-${width}px`);
    if (width === 1280 || width === 320) {
      const filename = `welcome-integrated-${width}.png`;
      await page.screenshot({ path: join(evidenceDir, filename), fullPage: true });
      report.screenshots.push(filename);
    }
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  let welcomeActionFocused = false;
  for (let step = 0; step < 80; step += 1) {
    await page.keyboard.press("Tab");
    if (["welcome-start", "welcome-skip"].includes(await page.evaluate(() => document.activeElement?.id ?? ""))) {
      welcomeActionFocused = true;
      break;
    }
  }
  const focus = await page.evaluate(() => ({
    id: document.activeElement?.id,
    tag: document.activeElement?.tagName,
    outlineStyle: getComputedStyle(document.activeElement).outlineStyle,
    outlineWidth: getComputedStyle(document.activeElement).outlineWidth,
  }));
  assert.equal(welcomeActionFocused, true, "keyboard traversal reaches an existing welcome action");
  assert.notEqual(focus.outlineStyle, "none", "keyboard action has visible focus outline");
  report.keyboardFocus = focus;
  report.checks.push("keyboard-focus-visible-on-existing-welcome-action");

  await page.emulateMedia({ forcedColors: "active" });
  const forced = await page.locator(".uiq-entry__wordmark").evaluate((node) => {
    const style = getComputedStyle(node);
    return { color: style.color, fill: style.webkitTextFillColor, backgroundImage: style.backgroundImage };
  });
  assert.notEqual(forced.fill, "transparent", "wordmark remains readable in forced colors");
  await page.screenshot({ path: join(evidenceDir, "welcome-integrated-forced-colors.png"), fullPage: true });
  report.forcedColors = forced;
  report.screenshots.push("welcome-integrated-forced-colors.png");
  report.checks.push("forced-colors-readable-wordmark");
  await page.emulateMedia({ forcedColors: "none", reducedMotion: "reduce" });
  const motion = await welcome.evaluate((node) => ({ animation: getComputedStyle(node).animationDuration, transition: getComputedStyle(node).transitionDuration }));
  assert.ok(["0s", "0.0001ms"].includes(motion.animation));
  report.reducedMotion = motion;
  report.checks.push("reduced-motion-respected");

  await page.getByRole("button", { name: "Start the tour" }).click();
  assert.equal(await page.locator(".uiq-entry").count(), 0, "starting exits only the welcome visual");
  assert.match(await page.locator("#tutorial-title").innerText(), /Choose what to design/);
  report.checks.push("existing-start-action-advances-to-existing-tour");
  await context.close();

  const skipped = await makePage();
  await skipped.page.getByRole("button", { name: "Skip for now" }).click();
  assert.equal(await skipped.page.locator(".uiq-entry").count(), 0, "skip exits welcome without leaving the welcome visual mounted");
  assert.equal(await skipped.page.locator("#tutorial-replay").count(), 1, "existing tutorial replay remains available");
  await skipped.page.locator("#tutorial-replay").click();
  await skipped.page.locator(".uiq-entry").waitFor({ state: "visible" });
  report.checks.push("existing-skip-and-replay-lifecycle");
  await skipped.context.close();

  const unavailable = await makePage({ unavailableStorage: true });
  const storageFailure = unavailable.page.locator(".project-startup-error");
  assert.equal(await storageFailure.count(), 1, "app fails closed when local project storage is unavailable");
  assert.match(await storageFailure.innerText(), /Local project could not be opened/);
  assert.match(await storageFailure.innerText(), /Existing saved data was not intentionally replaced/);
  assert.equal(await unavailable.page.locator(".uiq-entry").count(), 0,
    "welcome does not bypass the existing protected project-startup boundary");
  report.storageUnavailable = "Fail-closed message shown; no saved data replacement and no welcome overlay bypass.";
  report.checks.push("unavailable-local-storage-fails-closed-without-replacing-data");
  await unavailable.context.close();

  assert.deepEqual(report.externalRequests, [], "all browser requests remain same-origin");
  assert.deepEqual(report.pageErrors, [], "no uncaught browser errors");
  assert.deepEqual(report.consoleErrors, [], "no browser console errors");
  report.checks.push("no-egress-runtime-errors-or-console-errors");
  report.verifiedAt = new Date().toISOString();
  await writeFile(join(evidenceDir, "browser-pressure-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
