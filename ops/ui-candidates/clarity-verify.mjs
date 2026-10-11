// Regression harness for synthetic, unshipped candidates, not the user's browser.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const base = process.argv[2] ?? "http://127.0.0.1:4186";
assert.equal(new URL(base).hostname, "127.0.0.1");
const output = resolve("docs/research/uiq-clarity/evidence");
mkdirSync(output, { recursive: true });
const report = { startedAt: new Date().toISOString(), checks: [], failures: [], requests: [], websockets: [], pageErrors: [], hashes: {} };
for (const path of ["ops/ui-candidates/clarity.html", "ops/ui-candidates/clarity-preview.ts", ...["guidance", "material"].flatMap(kind => ["ts", "css"].map(ext => `src/ui/enhancements/${kind}/${kind}-panel.${ext}`))]) report.hashes[path] = createHash("sha256").update(readFileSync(path)).digest("hex");
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
context.on("request", request => report.requests.push(request.url()));
const page = await context.newPage();
page.on("websocket", socket => report.websockets.push(socket.url()));
page.on("pageerror", error => report.pageErrors.push(error.message));
const check = async (name, run) => { try { const evidence = await run(); report.checks.push({ name, passed: true, evidence }); } catch (error) { report.failures.push({ name, message: error.message }); throw error; } };
const guidance = page.locator("#clarity-guidance");
const material = page.locator("#clarity-material");
const chooseG = value => page.locator("#clarity-guidance-fixture").selectOption(value);
const chooseM = value => page.locator("#clarity-material-fixture").selectOption(value);
const audit = async () => {
  await page.locator("#clarity-audit-result").evaluate(el => { el.textContent = "Audit not run."; });
  await page.getByRole("button", { name: "Run accessibility audit", exact: true }).click();
  await page.waitForFunction(() => document.querySelector("#clarity-audit-result").textContent.startsWith("{"));
  const result = JSON.parse(await page.locator("#clarity-audit-result").textContent());
  assert.deepEqual(result.violations, []);
  return result;
};
const ratio = (a, b) => {
  const lum = rgb => rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map(c => c / 255 <= .04045 ? c / 255 / 12.92 : ((c / 255 + .055) / 1.055) ** 2.4).reduce((v, c, i) => v + c * [.2126, .7152, .0722][i], 0);
  const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
};
try {
  await page.goto(`${base}/ops/ui-candidates/clarity.html`, { waitUntil: "networkidle" });
  await check("literal headings and caveats; no fabricated review or file confirmation", async () => {
    const text = await guidance.textContent();
    for (const phrase of ["Fit preference", "Digital input validity", "Digital checks are not physical fit validation.", "Relaxed preference", "Physical sampling"]) assert(text.includes(phrase), phrase);
    assert.equal(await guidance.getByRole("button", { name: "Review fabric preference", exact: true }).count(), 1);
    const materialText = await material.textContent();
    for (const phrase of ["Material behavior guidance", "Screen appearance only", "Cotton woven", "Linen", "Cotton jersey", "Rib knit", "Spandex blend"]) assert(materialText.includes(phrase), phrase);
    assert.equal(await guidance.locator("input,select,a").count(), 0);
    assert.equal(await material.locator("input,select,a").count(), 0);
    return { text, materialText };
  });
  await check("native review requests and synchronous controlled updates preserve keyed focus/details", async () => {
    const button = guidance.getByRole("button", { name: "Review fabric preference", exact: true });
    const original = await button.elementHandle();
    const detail = guidance.locator("details").first();
    await detail.locator("summary").click();
    const originalDetail = await detail.elementHandle();
    for (const [i, key] of ["click", "Enter", "Space"].entries()) {
      if (key === "click") await button.click(); else await button.press(key);
      assert.match(await page.locator("#clarity-callback").textContent(), new RegExp(`Review request ${i + 1}:`));
      assert.match(await page.locator("#clarity-callback").textContent(), /"step":"fit","field":"fabric"/);
      assert(await original.evaluate(el => el === document.activeElement && el.isConnected));
      assert(await originalDetail.evaluate(el => el.open && el.isConnected));
    }
    // Programmatic fixture change retains the focused action; ordinary select
    // interaction would focus the select and hide a reconciliation defect.
    await page.locator("#clarity-guidance-fixture").evaluate(el => { el.value = "reordered"; el.dispatchEvent(new Event("change", { bubbles: true })); });
    assert(await original.evaluate(el => el.isConnected && el === document.activeElement));
    assert(await originalDetail.evaluate(el => el.isConnected && el.open));
    await page.locator("#clarity-guidance-fixture").evaluate(el => { el.value = "valid"; el.dispatchEvent(new Event("change", { bubbles: true })); });
    assert(await original.evaluate(el => el.isConnected && el === document.activeElement), "Moving a surviving focused note back to the front must retain focus");
    await original.evaluate(el => el.focus());
    await original.press("Enter");
    assert(await original.evaluate(el => el === document.activeElement));
    return { clickEnterSpaceOnce: true, reorderedNodeRetained: true, openDisclosureRetained: true };
  });
  await check("duplicate update atomicity and obsolete controls inert", async () => {
    const before = await guidance.innerHTML();
    const button = await guidance.getByRole("button", { name: "Review fabric preference", exact: true }).elementHandle();
    await page.locator("#clarity-duplicate").click();
    assert.equal(await page.locator("#clarity-duplicate-result").textContent(), "Duplicate rejected; previous DOM retained.");
    assert.equal(await guidance.innerHTML(), before);
    await chooseG("removed");
    const callbackBefore = await page.locator("#clarity-callback").textContent();
    await button.evaluate(el => el.click());
    assert.equal(await page.locator("#clarity-callback").textContent(), callbackBefore);
    assert.equal(await guidance.getByRole("button").count(), 0);
    return { atomic: true, detachedActionInert: true };
  });
  await check("caller blocker is exact and fit/validity remain distinct", async () => {
    await chooseG("blocked");
    assert.equal(await guidance.getByRole("alert").count(), 1);
    assert.match(await guidance.textContent(), /No fit preference supplied/);
    assert.match(await guidance.getByRole("alert").textContent(), /Review chest input before the next action/);
    await guidance.getByRole("button", { name: "Review correction", exact: true }).press("Enter");
    assert.match(await page.locator("#clarity-callback").textContent(), /"label":"Review correction","step":"measure","field":"chest"/);
    const states = [];
    for (const fixture of ["empty", "legacy", "legacy-blocked", "complete"]) {
      await chooseG(fixture); states.push({ fixture, text: await guidance.textContent() });
      if (fixture === "legacy") { assert.equal(await guidance.locator('[data-step="output"]').getByText("Current stage", { exact: true }).isVisible(), true); assert.equal(await guidance.locator('[data-step="output"]').getByText("Complete", { exact: true }).isVisible(), false); }
      if (fixture === "complete") { assert.equal(await guidance.locator('[data-step="fit"]').getByText("Current stage", { exact: true }).isVisible(), true); assert.equal(await guidance.locator('[data-step="fit"]').getByText("Complete", { exact: true }).isVisible(), true); }
      if (fixture === "legacy-blocked") { assert.equal(await guidance.locator('[data-step="output"]').getByText("Needs correction", { exact: true }).isVisible(), true); assert.equal(await guidance.locator('[data-step="output"]').getByText("Complete", { exact: true }).isVisible(), false); await guidance.getByRole("button", { name: "Review correction", exact: true }).press("Enter"); assert.match(await page.locator("#clarity-callback").textContent(), /"step":"done","field":"export"/); }
    }
    assert.match(states[0].text, /unknown/i);
    assert.doesNotMatch(states[0].text, /all checks pass/i);
    return states;
  });
  await check("material requests preserve focus and node identity without changing guidance", async () => {
    const button = material.getByRole("button", { name: "Review fabric", exact: true });
    const original = await button.elementHandle();
    const text = await material.textContent();
    for (const key of ["click", "Enter", "Space"]) { if (key === "click") await button.click(); else await button.press(key); assert(await original.evaluate(el => el === document.activeElement && el.isConnected)); }
    assert.equal(await material.textContent(), text);
    await material.getByRole("button", { name: "Review appearance", exact: true }).press("Space");
    assert.match(await page.locator("#clarity-callback").textContent(), /appearance/);
    return { sameButton: true, callerGuidanceUnchanged: true };
  });
  await check("five source presets, custom stretch, unknown/mismatch, textures and invalid states", async () => {
    const states = [];
    for (const fixture of ["cotton", "linen", "jersey", "rib", "spandex", "custom", "unknown", "mismatch", "heather", "bad-color", "bad-texture", "bad-shine", "bad-stretch"]) {
      await chooseM(fixture);
      const text = await material.textContent();
      assert(await material.getByRole("button", { name: "Review fabric", exact: true }).isEnabled());
      assert(await material.getByRole("button", { name: "Review appearance", exact: true }).isEnabled());
      if (fixture === "custom") { assert.match(text, /125/); assert.match(text, /custom|unverified/i); }
      if (fixture === "bad-color") assert.match(text, /Preview unavailable/i);
      if (["bad-texture", "bad-shine"].includes(fixture)) assert.match(text, /invalid/i);
      if (fixture === "unknown") assert.match(text, /Appearance not supplied/i);
      if (["bad-color", "bad-texture", "bad-shine", "unknown"].includes(fixture)) assert.equal(await material.locator(".uiq-material-appearance-cue").isVisible(), false);
      if (fixture === "mismatch") assert.match(text, /Caller detected a mismatch/);
      if (fixture === "bad-stretch") assert.match(text, /-1/);
      states.push({ fixture, text });
    }
    return states;
  });
  await check("two instances and native outside sentinel remain independent", async () => {
    const secondG = await page.locator("#clarity-guidance-second").innerHTML();
    const secondM = await page.locator("#clarity-material-second").innerHTML();
    await chooseG("valid"); await chooseM("cotton");
    assert.equal(await page.locator("#clarity-guidance-second").innerHTML(), secondG);
    assert.equal(await page.locator("#clarity-material-second").innerHTML(), secondM);
    const ids = await page.locator(".uiq-guidance [id],.uiq-material [id]").evaluateAll(els => els.map(el => el.id));
    assert.equal(ids.length, new Set(ids).size);
    const properties = el => { const c = getComputedStyle(el); return { font: c.fontFamily, color: c.color, background: c.backgroundColor, radius: c.borderRadius }; };
    const outside = await page.locator("#clarity-sentinel button").evaluate(properties);
    const control = await context.newPage(); await control.setContent('<button type="button">Outside button</button>');
    const native = await control.locator("button").evaluate(properties); await control.close();
    assert.deepEqual(outside, native);
    return { ids, outside };
  });
  await check("blank supplied action is named while its emitted payload stays literal", async () => {
    await chooseG("blank-label");
    await guidance.getByRole("button", { name: "Review guidance note (label not supplied)", exact: true }).press("Enter");
    assert.match(await page.locator("#clarity-callback").textContent(), /"label":"","step":"fit"/);
    const result = await audit(); await chooseG("valid"); return result;
  });
  await check("nested instances do not double-route identical caller IDs", async () => {
    const inner = page.locator("#clarity-nested-inner").getByRole("button", { name: "Review fabric preference", exact: true });
    for (const key of ["click", "Enter", "Space"]) { if (key === "click") await inner.click(); else await inner.press(key); }
    assert.equal(await page.locator("#clarity-nested-status").textContent(), "Outer requests:0; inner requests:3.");
    const outer = page.locator("#clarity-nested-outer > .uiq-guidance > .uiq-guidance-notes button");
    await outer.click(); assert.equal(await page.locator("#clarity-nested-status").textContent(), "Outer requests:1; inner requests:3.");
    return { exactInnerNativeRequests: 3, noParentRouting: true, outerStillIndependent: true };
  });
  await check("normal accessibility", audit);
  await check("desktop rendered evidence", async () => {
    await page.screenshot({ path: resolve(output, "clarity-desktop.png"), fullPage: true });
    await guidance.screenshot({ path: resolve(output, "guidance-desktop.png") });
    await material.screenshot({ path: resolve(output, "material-desktop.png") });
    return { screenshots: ["clarity-desktop.png", "guidance-desktop.png", "material-desktop.png"] };
  });
  await chooseG("hostile"); await chooseM("hostile");
  await check("hostile text literal, no images/injected markup, long reflow at five widths", async () => {
    assert.equal(await page.locator(".uiq-guidance img,.uiq-material img,.uiq-guidance script,.uiq-material script").count(), 0);
    assert.match(await guidance.textContent(), /<img src=https:\/\/example.invalid\/never-fetch/);
    assert.match(await material.textContent(), /<img src=https:\/\/example.invalid\/never-fetch/);
    const layouts = [];
    for (const width of [320, 390, 1440, 480, 960]) {
      await page.setViewportSize({ width, height: 960 });
      const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      assert(dimensions.scroll <= dimensions.client, `Overflow at ${width}`); layouts.push({ width, ...dimensions });
    }
    await page.setViewportSize({ width: 390, height: 960 });
    await page.screenshot({ path: resolve(output, "clarity-hostile-narrow.png"), fullPage: true });
    return { layouts, zoomEquivalent: "480 CSS px reflow, not actual browser zoom", literalText: true };
  });
  await check("hostile accessibility", audit);
  await chooseG("valid"); await chooseM("cotton");
  await check("44px native targets, actual text contrast and keyboard focus", async () => {
    const targets = await page.locator(".uiq-guidance button,.uiq-guidance summary,.uiq-material button").evaluateAll(els => els.map(el => ({ tag: el.tagName, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })));
    assert(targets.every(t => t.width >= 44 && t.height >= 44));
    const samples = await page.locator(".uiq-guidance,.uiq-material").evaluateAll(roots => roots.flatMap(root => Array.from(root.querySelectorAll("*"))).filter(el => Array.from(el.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()) && el.getBoundingClientRect().height > 0).map(el => {
      let host = el; while (getComputedStyle(host).backgroundColor === "rgba(0, 0, 0, 0)" && host.parentElement) host = host.parentElement;
      return { color: getComputedStyle(el).color, background: getComputedStyle(host).backgroundColor };
    }));
    const contrasts = samples.map(s => ratio(s.color, s.background)); assert(contrasts.every(c => c >= 4.5));
    const button = guidance.getByRole("button", { name: "Review fabric preference", exact: true });
    await button.focus(); await button.press("Tab"); await button.press("Shift+Tab");
    const focus = await button.evaluate(el => { const c = getComputedStyle(el); return { width: c.outlineWidth, color: c.outlineColor, background: c.backgroundColor }; });
    assert(parseFloat(focus.width) > 0); assert(ratio(focus.color, focus.background) >= 3);
    return { targets, minimumTextContrast: Math.min(...contrasts), focus, focusContrast: ratio(focus.color, focus.background) };
  });
  for (const mode of ["reduce", "forced"]) {
    await check(`${mode} media fallback`, async () => {
      await page.emulateMedia(mode === "reduce" ? { reducedMotion: "reduce", forcedColors: "none" } : { forcedColors: "active", reducedMotion: "reduce" });
      const styles = await page.locator(".uiq-guidance,.uiq-material").evaluateAll(els => els.map(el => { const c = getComputedStyle(el); return { background: c.backgroundColor, animation: c.animationName, transition: c.transitionDuration }; }));
      assert(styles.every(s => s.background !== "rgba(0, 0, 0, 0)" && s.animation === "none" && s.transition === "0s"));
      await page.screenshot({ path: resolve(output, `clarity-${mode}.png`), fullPage: true }); return styles;
    });
  }
  await check("disposal, stale controls and unchanged second instance", async () => {
    const oldG = await guidance.getByRole("button", { name: "Review fabric preference", exact: true }).elementHandle();
    const oldM = await material.getByRole("button", { name: "Review fabric", exact: true }).elementHandle();
    const before = await page.locator("#clarity-callback").textContent();
    await page.locator("#clarity-dispose").click(); await page.locator("#clarity-dispose").click(); await page.locator("#clarity-refresh").click();
    assert.equal(await guidance.locator(".uiq-guidance").count(), 0); assert.equal(await material.locator(".uiq-material").count(), 0);
    await oldG.evaluate(el => el.click()); await oldM.evaluate(el => el.click()); assert.equal(await page.locator("#clarity-callback").textContent(), before);
    assert.equal(await page.locator("#clarity-guidance-second .uiq-guidance").count(), 1); assert.equal(await page.locator("#clarity-material-second .uiq-material").count(), 1);
    await page.locator("#clarity-remount").click(); assert.equal(await guidance.locator(".uiq-guidance").count(), 1); assert.equal(await material.locator(".uiq-material").count(), 1);
    return { disposedInert: true, secondUntouched: true, remountSingle: true };
  });
  await check("no external network or console execution throughout pressure matrix", async () => {
    const external = report.requests.filter(url => new URL(url).origin !== new URL(base).origin);
    assert.deepEqual(external, []); assert.deepEqual(report.pageErrors, []);
    assert(report.websockets.every(url => new URL(url).hostname === "127.0.0.1"));
    assert(!report.requests.some(url => url.includes("never-fetch")));
    return { external, websocketUrls: report.websockets, requests: report.requests.length, pageErrors: report.pageErrors };
  });
} catch (error) { console.error(error); process.exitCode = 1; }
finally {
  report.finishedAt = new Date().toISOString(); writeFileSync(resolve(output, "clarity-browser-report.json"), JSON.stringify(report, null, 2));
  await browser.close(); console.log(JSON.stringify({ checks: report.checks.length, failures: report.failures, report: "docs/research/uiq-clarity/evidence/clarity-browser-report.json" }));
}
