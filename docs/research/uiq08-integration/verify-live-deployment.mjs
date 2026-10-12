import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { chromium } from "playwright";

const targets = [
  ["stable", process.env.UIQ08_STABLE_URL ?? "https://infinidrip-preview.pages.dev"],
  ["immutable", process.env.UIQ08_IMMUTABLE_URL],
];
assert.ok(targets.every(([, url]) => url), "Set UIQ08_IMMUTABLE_URL to the exact URL printed by the successful deployment workflow.");
const evidenceDir = resolve("docs/research/uiq08-integration/evidence/S760-live");
await mkdir(evidenceDir, { recursive: true });
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const localAssets = new Map();
for (const file of (await readdir(resolve("dist/assets"))).filter((name) => /\.(?:js|css)$/.test(name))) {
  localAssets.set(file, digest(await readFile(resolve("dist/assets", file))));
}
const report = { verifiedAt: new Date().toISOString(), targets: [], failures: [] };
const browser = await chromium.launch({ headless: true });

try {
  for (const [kind, url] of targets) {
    const base = new URL(url);
    assert.equal(base.protocol, "https:", `${kind} deployment must use HTTPS`);
    const target = { kind, url, assets: [], widths: [], requests: [], pageErrors: [], consoleErrors: [], screenshots: [] };
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    const assetTasks = [];
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== base.origin) target.requests.push(request.url());
    });
    page.on("pageerror", (error) => target.pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") target.consoleErrors.push(message.text());
    });
    page.on("response", (response) => {
      const asset = new URL(response.url());
      const name = basename(asset.pathname);
      if (asset.origin !== base.origin || !/\.(?:js|css)$/.test(name)) return;
      assetTasks.push((async () => {
        try {
          const actual = digest(await response.body());
          target.assets.push({ name, sha256: actual, localSha256: localAssets.get(name) ?? null, matchesLocal: localAssets.get(name) === actual });
        } catch (error) {
          target.failures = target.failures ?? [];
          target.failures.push(`Could not hash ${name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      })());
    });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    const toolbar = page.locator("#inspection-toolbar");
    await toolbar.waitFor({ timeout: 20000 });
    const skip = page.locator("#welcome-skip");
    if (await skip.count()) await skip.click();
    await toolbar.waitFor();
    assert.equal(await toolbar.getAttribute("class"), "uiq-inspection-toolbar uiq-inspection-toolbar--opaque");
    assert.equal(await toolbar.getAttribute("role"), "group");
    assert.equal(await toolbar.locator("button[data-inspection-zoom]").count(), 3);
    assert.equal(await toolbar.evaluate((node) => getComputedStyle(node).backdropFilter), "none");
    await toolbar.locator('button[data-inspection-zoom="out"]').click();
    assert.equal(await page.locator("#inspection-zoom").textContent(), "75%");
    await toolbar.locator('button[data-inspection-zoom="fit"]').click();
    assert.equal(await page.locator("#inspection-zoom").textContent(), "100%");
    await page.screenshot({ path: resolve(evidenceDir, `S760-${kind}-1440.png`), fullPage: true });
    target.screenshots.push(`docs/research/uiq08-integration/evidence/S760-live/S760-${kind}-1440.png`);

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const dimensions = await page.evaluate(() => {
        const bar = document.querySelector("#inspection-toolbar");
        return {
          viewport: document.documentElement.clientWidth,
          document: document.documentElement.scrollWidth,
          toolbar: bar.getBoundingClientRect().width,
          toolbarScroll: bar.scrollWidth,
          toolbarClient: bar.clientWidth,
        };
      });
      assert.equal(dimensions.document, dimensions.viewport, `${kind} document overflows at ${width}px`);
      assert.ok(dimensions.toolbarScroll <= dimensions.toolbarClient, `${kind} toolbar overflows at ${width}px`);
      target.widths.push({ width, ...dimensions });
      if (width === 320) {
        await page.screenshot({ path: resolve(evidenceDir, `S760-${kind}-320.png`), fullPage: true });
        target.screenshots.push(`docs/research/uiq08-integration/evidence/S760-live/S760-${kind}-320.png`);
      }
    }
    await Promise.all(assetTasks);
    assert.deepEqual(target.failures ?? [], [], `${kind} asset hashing failed`);
    assert.deepEqual(target.requests, [], `${kind} deployment made off-origin requests`);
    assert.deepEqual(target.pageErrors, [], `${kind} deployment emitted page errors`);
    assert.deepEqual(target.consoleErrors, [], `${kind} deployment emitted console errors`);
    assert.ok(target.assets.some((asset) => asset.name.endsWith(".js") && asset.matchesLocal), `${kind} JS does not match the accepted build`);
    assert.ok(target.assets.some((asset) => asset.name.endsWith(".css") && asset.matchesLocal), `${kind} CSS does not match the accepted build`);
    report.targets.push(target);
    await context.close();
  }
} catch (error) {
  report.failures.push(error instanceof Error ? error.stack ?? error.message : String(error));
} finally {
  await browser.close();
  await writeFile(resolve(evidenceDir, "S760-live-deployment-report.json"), `${JSON.stringify(report, null, 2)}\n`);
}

assert.deepEqual(report.failures, [], "Live deployment verification failed; inspect the preserved evidence report.");
