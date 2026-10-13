import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { strFromU8, unzipSync } from "fflate";

const here = dirname(fileURLToPath(import.meta.url));
const baseUrl = "http://127.0.0.1:4174/docs/research/epic18/S777-T04-review/evidence/review-harness.html";
const results = [];
const browser = await chromium.launch({ headless: true });

try {
  for (const recipeId of ["tee", "woven-shirt"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") pageErrors.push(message.text());
    });
    await page.goto(`${baseUrl}?recipe=${recipeId}`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.documentElement.dataset.s777FixtureReady === "true", { timeout: 60_000 });

    const review = page.locator('[data-import-status="changed"]');
    await review.evaluate((element) => element.scrollIntoView({ block: "start", inline: "nearest" }));
    const text = await review.innerText();
    for (const expected of ["Package review", "Saved approval on the current exact revision", "REVIEW", "cover.styleName", "actualValue", "DRAFT with no approved field scope"]) {
      if (!text.includes(expected)) throw new Error(`${recipeId} review did not render expected content: ${expected}`);
    }
    if (!text.includes(recipeId)) throw new Error(`${recipeId} style identity is missing from the review.`);

    const captures = [];
    for (const viewport of [{ name: "mobile", width: 390, height: 844 }, { name: "desktop", width: 1280, height: 800 }]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await review.evaluate((element) => element.scrollIntoView({ block: "start", inline: "nearest" }));
      const scroller = page.locator(".tech-pack-import-table-wrap");
      const focusFlow = await page.evaluate(() => {
        const filePicker = document.querySelector("[data-production-pack-import-file]");
        const tableRegion = document.querySelector(".tech-pack-import-table-wrap");
        const apply = document.querySelector('[data-production-pack-import-action="apply"]');
        if (!(filePicker instanceof HTMLElement) || !(tableRegion instanceof HTMLElement) || !(apply instanceof HTMLElement)) {
          throw new Error("Expected import review keyboard controls are missing.");
        }
        filePicker.focus();
        return { filePicker: document.activeElement === filePicker, tableFocusable: tableRegion.tabIndex === 0, applyPresent: true };
      });
      await page.keyboard.press("Tab");
      const tabReachedTable = await scroller.evaluate((element) => document.activeElement === element);
      const beforeArrow = await scroller.evaluate((element) => element.scrollLeft);
      await page.keyboard.press("ArrowRight");
      const afterArrow = await scroller.evaluate((element) => element.scrollLeft);
      await page.keyboard.press("Tab");
      const tabReachedApply = await page.locator('[data-production-pack-import-action="apply"]')
        .evaluate((element) => document.activeElement === element);
      const metrics = await page.evaluate(() => {
        const scroller = document.querySelector(".tech-pack-import-table-wrap");
        const table = scroller?.querySelector("table");
        const review = document.querySelector("[data-import-status]");
        return {
          documentClientWidth: document.documentElement.clientWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          reviewClientWidth: review?.clientWidth ?? null,
          tableClientWidth: scroller?.clientWidth ?? null,
          tableScrollWidth: scroller?.scrollWidth ?? null,
          innerTableWidth: table?.scrollWidth ?? null,
        };
      });
      if (metrics.documentScrollWidth !== metrics.documentClientWidth) {
        throw new Error(`${recipeId} ${viewport.name}: page-level horizontal overflow (${metrics.documentScrollWidth}/${metrics.documentClientWidth}).`);
      }
      if (!(metrics.innerTableWidth > metrics.tableClientWidth)) throw new Error(`${recipeId} ${viewport.name}: the wide comparison table was not clipped inside its own scroller.`);
      if (!focusFlow.filePicker || !focusFlow.tableFocusable || !focusFlow.applyPresent || !tabReachedTable || !tabReachedApply) {
        throw new Error(`${recipeId} ${viewport.name}: import-review keyboard focus order did not reach the field table and Apply control.`);
      }
      if (!(afterArrow > beforeArrow)) throw new Error(`${recipeId} ${viewport.name}: arrow-key scrolling did not move the focused field-difference table.`);
      await page.evaluate(() => {
        const region = document.querySelector(".tech-pack-import-table-wrap");
        if (region) region.scrollLeft = 0;
        const active = document.activeElement;
        if (active instanceof HTMLElement) active.blur();
        document.querySelector("[data-import-status]")?.scrollIntoView({ block: "start", inline: "nearest" });
      });
      await page.waitForTimeout(100);
      const position = await page.evaluate(() => {
        const review = document.querySelector("[data-import-status]");
        const scrollables = [];
        let parent = review?.parentElement ?? null;
        while (parent) {
          if (parent.scrollHeight > parent.clientHeight + 2) scrollables.push({
            tag: parent.tagName,
            id: parent.id,
            className: typeof parent.className === "string" ? parent.className : "",
            scrollTop: parent.scrollTop,
            clientHeight: parent.clientHeight,
            scrollHeight: parent.scrollHeight,
          });
          parent = parent.parentElement;
        }
        const rect = review?.getBoundingClientRect();
        return { top: rect?.top ?? null, bottom: rect?.bottom ?? null, scrollables };
      });
      const screenshots = [];
      const capturePanelPosition = async (name, selector, horizontal = "start") => {
        const anchor = await page.evaluate(({ selector: targetSelector, horizontal: side }) => {
          const aside = document.querySelector("#studio-inspector");
          const target = document.querySelector(targetSelector);
          if (!aside || !target) throw new Error(`Could not locate ${targetSelector} inside the inspector.`);
          aside.scrollIntoView({ block: "center", inline: "nearest" });
          let asideRect = aside.getBoundingClientRect();
          let targetRect = target.getBoundingClientRect();
          aside.scrollTop += targetRect.top - asideRect.top - 8;
          if (target instanceof HTMLElement && target.matches(".tech-pack-import-table-wrap")) {
            target.scrollLeft = side === "end" ? Math.max(0, target.scrollWidth - target.clientWidth) : 0;
          }
          asideRect = aside.getBoundingClientRect();
          targetRect = target.getBoundingClientRect();
          const targetIntersectsInspector = targetRect.bottom > asideRect.top && targetRect.top < asideRect.bottom
            && targetRect.right > asideRect.left && targetRect.left < asideRect.right;
          if (!targetIntersectsInspector) throw new Error(`${targetSelector} is outside the visible inspector viewport after scrolling.`);
          return {
            targetSelector,
            inspector: { top: asideRect.top, bottom: asideRect.bottom, left: asideRect.left, right: asideRect.right },
            target: { top: targetRect.top, bottom: targetRect.bottom, left: targetRect.left, right: targetRect.right },
            inspectorScrollTop: aside.scrollTop,
            tableScrollLeft: target instanceof HTMLElement && target.matches(".tech-pack-import-table-wrap") ? target.scrollLeft : null,
          };
        }, { selector, horizontal });
        await page.waitForTimeout(100);
        const nameOnDisk = `${recipeId}-${viewport.name}-${name}.png`;
        const screenshotPath = join(here, nameOnDisk);
        await page.screenshot({ path: screenshotPath, fullPage: false, animations: "disabled" });
        const bytes = await readFile(screenshotPath);
        screenshots.push({ name: nameOnDisk, byteLength: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex"), anchor });
      };
      await capturePanelPosition("review-identity", ".tech-pack-import-result h3");
      await capturePanelPosition("saved-approval", ".tech-pack-import-approval");
      await capturePanelPosition("diff-left", ".tech-pack-import-table-wrap", "start");
      await capturePanelPosition("diff-right", ".tech-pack-import-table-wrap", "end");
      await capturePanelPosition("draft-apply", ".tech-pack-import-approval-notice");
      captures.push({ viewport: `${viewport.width}x${viewport.height}`, ...metrics, position, screenshots, keyboard: { pickerToTable: tabReachedTable, tableToApply: tabReachedApply, arrowScrollFrom: beforeArrow, arrowScrollTo: afterArrow } });
    }

    const fixture = await page.evaluate(() => window.__S777Evidence);
    if (!fixture?.deterministic) throw new Error(`${recipeId} output repeatability check did not pass.`);
    const decode = (value) => Buffer.from(value, "base64");
    const fileData = [
      [`${recipeId}-production-pack.pdf`, decode(fixture.pdfBase64)],
      [`${recipeId}.techpack.zip`, decode(fixture.archiveBase64)],
      [`${recipeId}-edited.techpack.zip`, decode(fixture.editedArchiveBase64)],
    ];
    const artifacts = [];
    for (const [name, bytes] of fileData) {
      await writeFile(join(here, name), bytes);
      artifacts.push({ name, byteLength: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex") });
    }
    const packageEntries = unzipSync(decode(fixture.archiveBase64));
    for (const [name, key] of [[`${recipeId}-record.json`, "records/tech-pack.json"], [`${recipeId}-manifest.json`, "manifest.json"]]) {
      const bytes = Buffer.from(strFromU8(packageEntries[key]), "utf8");
      await writeFile(join(here, name), bytes);
      artifacts.push({ name, byteLength: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex") });
    }
    results.push({
      recipeId,
      styleId: fixture.styleId,
      revisionId: fixture.revisionId,
      revisionNumber: fixture.revisionNumber,
      revisionContentDigest: fixture.revisionContentDigest,
      approval: fixture.approval,
      syntheticActual: fixture.syntheticActual,
      editedActual: fixture.editedActual,
      displayedDiff: fixture.displayedDiff,
      findings: fixture.findings,
      outputBytes: fixture.outputBytes,
      deterministic: fixture.deterministic,
      artifacts,
      captures,
      pageErrors,
    });
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(join(here, "viewport-review.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), browser: "Playwright Chromium", styles: results }, null, 2)}\n`);
if (results.some((result) => result.pageErrors.length > 0)) {
  throw new Error(`Browser errors: ${results.flatMap((result) => result.pageErrors).join("; ")}`);
}
console.log(JSON.stringify({ outputDirectory: here, styles: results.map((result) => ({ recipeId: result.recipeId, artifacts: result.artifacts, captures: result.captures })) }, null, 2));
