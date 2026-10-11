// Repository browser regression, not control of the user's selected browser.
// Exercises only synthetic, unshipped candidate previews with local Chromium.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const base = process.argv[2] ?? "http://127.0.0.1:4186";
assert.equal(new URL(base).hostname, "127.0.0.1", "Only the isolated localhost preview is allowed");
const output = resolve("docs/research/uiq-parallel/evidence");
mkdirSync(output, { recursive: true });
const report = { startedAt: new Date().toISOString(), checks: [], failures: [], requests: [], websocketUrls: [], sourceHashes: {} };
for (const file of ["src/ui/enhancements/artwork/artwork-panel.ts", "src/ui/enhancements/artwork/artwork-panel.css", "src/ui/enhancements/foundation/foundation.ts", "src/ui/enhancements/foundation/foundation.css", "ops/ui-candidates/review-preview.ts"]) {
  report.sourceHashes[file] = createHash("sha256").update(readFileSync(file)).digest("hex");
}
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
context.on("request", request => report.requests.push(request.url()));
let page;
const check = async (name, run) => {
  try { report.checks.push({ name, passed: true, evidence: await run() }); }
  catch (error) { report.failures.push({ name, message: error.message }); throw error; }
};
const open = async (file = "index") => {
  if (page) await page.close();
  page = await context.newPage();
  page.on("websocket", socket => report.websocketUrls.push(socket.url()));
  await page.goto(`${base}/ops/ui-candidates/${file}.html`, { waitUntil: "networkidle" });
};
const axe = async () => {
  await page.getByRole("button", { name: "Run accessibility audit", exact: true }).click();
  await page.waitForFunction(() => document.querySelector("#review-audit-result").textContent.startsWith("{"));
  const result = JSON.parse(await page.locator("#review-audit-result").textContent());
  assert.deepEqual(result.violations, []);
  return result;
};
const ratio = (a, b) => {
  const luminance = rgb => {
    const values = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map(c => c / 255 <= .04045 ? c / 255 / 12.92 : ((c / 255 + .055) / 1.055) ** 2.4);
    return values.reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
  };
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
};
try {
  await open();
  await check("all twelve existing local images decode", async () => {
    const images = page.locator(".uiq-artwork-image");
    assert.equal(await images.count(), 12);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(el => el.decode());
    }
    const records = await images.evaluateAll(els => els.map(el => ({ src: el.currentSrc, width: el.naturalWidth, height: el.naturalHeight })));
    assert(records.every(image => new URL(image.src).origin === new URL(base).origin && image.width > 0 && image.height > 0));
    return records;
  });
  await check("controlled mouse and keyboard selection keeps focus and provenance", async () => {
    const button = page.getByRole("button", { name: "Choose Textile printed with game birds (builtin-met-221932)", exact: true });
    await page.locator(".uiq-artwork-provenance > summary").first().click();
    await button.click();
    assert.match(await page.locator("#review-selection").textContent(), /Explicit callback 1: builtin-met-221932/);
    await button.press("Enter");
    assert.match(await page.locator("#review-selection").textContent(), /Explicit callback 2: builtin-met-221932/);
    await button.press("Space");
    assert.match(await page.locator("#review-selection").textContent(), /Explicit callback 3: builtin-met-221932/);
    const state = await page.evaluate(() => ({ focused: document.activeElement.getAttribute("data-asset-id"), open: document.querySelector("details").open, pressed: document.querySelector(".uiq-artwork-choose").getAttribute("aria-pressed") }));
    assert.deepEqual(state, { focused: "builtin-met-221932", open: true, pressed: "true" });
    return state;
  });
  await check("search/filter dimensions preserve selection and never invoke callback", async () => {
    const before = await page.locator("#review-selection").textContent();
    await page.getByRole("searchbox", { name: "Search references" }).fill("never-matches-candidate");
    assert.match(await page.locator(".uiq-artwork-count").textContent(), /No references match/);
    assert.match(await page.locator(".uiq-artwork-selection").textContent(), /Selection is preserved/);
    const focus = await page.evaluate(() => document.activeElement.id);
    assert.match(focus, /-search$/);
    await page.getByRole("button", { name: "Clear search and filters", exact: true }).click();
    for (const [label, value] of [["Category", "geometric"], ["Garment family", "tee"], ["Piece role", "front"], ["Print use (filters and guidance)", "all-over"]]) {
      await page.getByRole("combobox", { name: label, exact: true }).selectOption(value);
      assert(await page.locator(".uiq-artwork-card").count() > 0, `${label} has actual matching cards`);
      await page.getByRole("button", { name: "Clear search and filters", exact: true }).click();
    }
    assert.equal(await page.locator("#review-selection").textContent(), before);
    await page.getByRole("button", { name: "Select unavailable ID", exact: true }).click();
    assert.match(await page.locator(".uiq-artwork-selection").textContent(), /not in this catalog/);
    return { focus, callbackUnchanged: true, hiddenAndUnknownExplicit: true, filters: 4 };
  });
  await check("empty, failed-local, remote and hostile fixtures", async () => {
    const fixture = page.getByRole("combobox", { name: "Review fixture", exact: true });
    await fixture.selectOption("empty");
    assert.equal(await page.locator(".uiq-artwork-card").count(), 0);
    assert.match(await page.locator(".uiq-artwork-count").textContent(), /No references in this catalog/);
    await fixture.selectOption("missing");
    await page.waitForFunction(() => !document.querySelector(".uiq-artwork-fallback").hidden);
    assert.equal(await page.locator(".uiq-artwork-choose").first().isEnabled(), true);
    await fixture.selectOption("remote");
    assert.equal(await page.locator(".uiq-artwork-card").first().locator("img").count(), 0);
    assert.equal(await page.locator(".uiq-artwork-fallback").first().isVisible(), true);
    await fixture.selectOption("endpoint");
    assert.equal(await page.locator(".uiq-artwork-card").first().locator("img").count(), 0);
    assert.equal(report.requests.some(url => url.includes("/api/never-fetch-candidate")), false);
    await fixture.selectOption("hostile");
    assert.equal(await page.locator(".uiq-artwork-title img").count(), 0);
    assert.match(await page.locator(".uiq-artwork-title").first().textContent(), /^<img src=x onerror=alert\(1\)>/);
    return { emptyDistinct: true, failureSelectable: true, remoteRejected: true, hostileLiteral: true };
  });
  await check("trusted bundled image load failure stays selectable", async () => {
    const imageUrl = report.checks.find(check => check.name === "all twelve existing local images decode").evidence[0].src;
    // Inject a real network failure for one exact trusted local asset, rather
    // than treating rejection of an untrusted URL as an image-error proof.
    const abort = route => route.abort();
    await context.route(imageUrl, abort);
    await page.getByRole("combobox", { name: "Review fixture", exact: true }).selectOption("catalog");
    await page.waitForFunction(() => !document.querySelector(".uiq-artwork-fallback").hidden);
    assert(await page.locator(".uiq-artwork-choose").first().isEnabled());
    await context.unroute(imageUrl, abort);
    await page.getByRole("combobox", { name: "Review fixture", exact: true }).selectOption("hostile");
    return { failedExactBundledUrl: imageUrl, fallback: true, stillSelectable: true, injectedFailure: true };
  });
  await check("narrow, desktop and zoom-equivalent layout with long hostile tokens", async () => {
    const evidence = [];
    for (const width of [320, 390, 1440, 480, 960]) {
      await page.setViewportSize({ width, height: 960 });
      const metrics = await page.evaluate(() => {
        const grid = document.querySelector(".uiq-artwork-results").getBoundingClientRect();
        return { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, grid: grid.width, cards: Array.from(document.querySelectorAll(".uiq-artwork-card")).map(el => el.getBoundingClientRect().width) };
      });
      assert(metrics.scroll <= metrics.client, `Document overflow at ${width}`);
      assert(metrics.cards.every(card => card <= metrics.grid + 1), `Card exceeds grid at ${width}`);
      evidence.push({ width, ...metrics });
    }
    await page.setViewportSize({ width: 390, height: 960 });
    await page.screenshot({ path: resolve(output, "artwork-long-narrow.png") });
    return { layouts: evidence, zoomEquivalent: "480 CSS px represents the reflow width of 960px at 200%; not a browser zoom measurement" };
  });
  await check("literal long fixture accessibility", axe);
  await page.getByRole("combobox", { name: "Review fixture", exact: true }).selectOption("catalog");
  await page.setViewportSize({ width: 1440, height: 960 });
  await check("catalog accessibility", axe);
  await check("actual text contrast, focus contrast and native 44px targets", async () => {
    const button = page.locator(".uiq-artwork-choose").first();
    await button.press("Tab");
    // A genuine keyboard transition focuses the next card's disclosure.
    const focus = await page.evaluate(() => { const c = getComputedStyle(document.activeElement); return { width: c.outlineWidth, color: c.outlineColor, background: getComputedStyle(document.activeElement.parentElement).backgroundColor }; });
    assert(parseFloat(focus.width) > 0);
    assert(ratio(focus.color, focus.background) >= 3);
    const samples = await page.evaluate(() => Array.from(document.querySelectorAll(".uiq-artwork-title,.uiq-artwork-description,.uiq-artwork-label,.uiq-artwork-choose,.uiq-foundation-status-message")).map(el => {
      let host = el;
      while (getComputedStyle(host).backgroundColor === "rgba(0, 0, 0, 0)" && host.parentElement) host = host.parentElement;
      return { text: getComputedStyle(el).color, background: getComputedStyle(host).backgroundColor };
    }));
    const contrasts = samples.map(s => ratio(s.text, s.background));
    assert(contrasts.every(value => value >= 4.5));
    const targets = await page.locator(".uiq-artwork input,.uiq-artwork select,.uiq-artwork button,.uiq-artwork summary").evaluateAll(els => els.map(el => ({ tag: el.tagName, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })));
    assert(targets.every(t => t.width >= 44 && t.height >= 44));
    return { minimumTextContrast: Math.min(...contrasts), focusContrast: ratio(focus.color, focus.background), focus, targets };
  });
  await check("outside CSS sentinel remains native", async () => {
    const outside = await page.locator("#isolation-sentinel button").evaluate(el => { const c = getComputedStyle(el); return { background: c.backgroundColor, font: c.fontFamily, borderRadius: c.borderRadius }; });
    const control = await context.newPage();
    await control.setContent('<button type="button">Outside button</button>');
    const native = await control.locator("button").evaluate(el => { const c = getComputedStyle(el); return { background: c.backgroundColor, font: c.fontFamily, borderRadius: c.borderRadius }; });
    await control.close();
    assert.deepEqual(outside, native);
    return outside;
  });
  await page.locator("h1").scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(output, "combined-desktop.png") });
  await check("dispose/remount has exactly one owned root", async () => {
    await page.getByRole("button", { name: "Dispose panel", exact: true }).click();
    await page.getByRole("button", { name: "Dispose panel", exact: true }).click();
    assert.equal(await page.locator(".uiq-artwork").count(), 0);
    await page.getByRole("button", { name: "Remount panel", exact: true }).click();
    assert.equal(await page.locator(".uiq-artwork").count(), 1);
    return { idempotent: true, singleRoot: true };
  });
  await open("artwork");
  await check("two browser instances remain independent with unique input IDs", async () => {
    const first = page.locator("#artwork-host");
    const second = page.locator("#artwork-host-second");
    const ids = await page.locator(".uiq-artwork input,.uiq-artwork select").evaluateAll(els => els.map(el => el.id));
    assert.equal(new Set(ids).size, ids.length);
    await first.getByRole("searchbox", { name: "Search references" }).fill("no-matching-reference");
    assert.equal(await first.locator(".uiq-artwork-card").count(), 0);
    assert.equal(await second.locator(".uiq-artwork-card").count(), 12);
    assert.equal(await second.getByRole("searchbox", { name: "Search references" }).inputValue(), "");
    await second.getByRole("button", { name: "Choose Textile printed with game birds (builtin-met-221932)", exact: true }).press("Enter");
    assert.match(await second.textContent(), /Second candidate instance callback only: builtin-met-221932/);
    assert.doesNotMatch(await first.textContent(), /callback only/);
    return { inputIds: ids, independentFilters: true, independentCallback: true };
  });
  for (const file of ["index", "foundation"]) {
    await open(file);
    await check(`${file} reduced-motion`, async () => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const styles = await page.locator(".uiq-foundation button,.uiq-artwork button").evaluateAll(els => els.map(el => ({ transition: getComputedStyle(el).transitionDuration, animation: getComputedStyle(el).animationName })));
      assert(styles.every(s => s.transition === "0s" && s.animation === "none"));
      return styles;
    });
    await check(`${file} forced-colors`, async () => {
      await page.emulateMedia({ forcedColors: "active", reducedMotion: "no-preference" });
      const styles = await page.locator(".uiq-foundation-status,.uiq-artwork-card,.uiq-foundation-panel--glass").evaluateAll(els => els.map(el => ({ color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor, blur: getComputedStyle(el).backdropFilter })));
      assert(styles.length > 0 && styles.every(s => s.background !== "rgba(0, 0, 0, 0)" && s.color !== s.background && s.blur === "none"));
      await page.screenshot({ path: resolve(output, `${file}-forced-colors.png`) });
      return styles;
    });
  }
  await open("foundation");
  await check("foundation reflow, literal strings, selected native controls and disclosure", async () => {
    const metrics = [];
    for (const width of [320, 390, 1440, 480, 960]) {
      await page.setViewportSize({ width, height: 960 });
      const m = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      assert(m.scroll <= m.client);
      metrics.push({ width, ...m });
    }
    assert.equal(await page.locator("#preview-panels script").count(), 0);
    assert.match(await page.locator("#preview-panels").textContent(), /<script>alert/);
    assert.equal(await page.getByRole("combobox", { name: "Size", exact: true }).inputValue(), "Medium");
    await page.getByText("Read synthetic guidance", { exact: true }).press("Enter");
    assert(await page.getByText("Native disclosure only: this preview cannot save, check or export a garment.", { exact: true }).isVisible());
    await page.getByRole("textbox", { name: "Garment name", exact: true }).press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.id), "preview-control-select");
    const targets = await page.locator(".uiq-foundation button,.uiq-foundation input,.uiq-foundation select,.uiq-foundation summary").evaluateAll(els => els.map(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })));
    assert(targets.every(t => t.width >= 44 && t.height >= 44));
    const solid = await page.locator(".uiq-foundation-panel:not(.uiq-foundation-panel--glass)").first().evaluate(el => getComputedStyle(el).backgroundColor);
    assert.equal(solid, "rgb(17, 39, 59)");
    await page.screenshot({ path: resolve(output, "foundation-desktop.png"), fullPage: true });
    return { metrics, targets, solidFallback: solid, literalText: true, keyboardDisclosure: true };
  });
  await check("no network egress across all fixtures/media/asset loads", async () => {
    const external = report.requests.filter(url => new URL(url).origin !== new URL(base).origin);
    const externalSockets = report.websocketUrls.filter(url => !url.startsWith(base.replace("http:", "ws:")));
    assert.deepEqual(external, []);
    assert.deepEqual(externalSockets, []);
    return { requestCount: report.requests.length, external, externalSockets, localMissingImageIsExpectedNegativeFixture: true };
  });
} finally {
  await browser.close();
  report.finishedAt = new Date().toISOString();
  writeFileSync(resolve(output, "browser-pressure-test.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ checks: report.checks.length, failures: report.failures, evidence: resolve(output, "browser-pressure-test.json") }));
}
