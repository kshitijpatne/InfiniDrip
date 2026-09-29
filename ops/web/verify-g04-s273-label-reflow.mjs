import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import verificationHelpers from "../../electron/verify-common.cjs";

const { startPreviewServer } = verificationHelpers;
const output = path.resolve("docs/research/epic17/S273-browser");
const recipes = ["tee", "fitted", "tank", "polo", "woven-shirt", "skirt", "trouser"];
const errors = [];

async function main() {
  await fs.mkdir(output, { recursive: true });
  const preview = await startPreviewServer();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 3000 }, deviceScaleFactor: 1 });
    const origin = new URL(preview.url).origin;
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== origin) errors.push(`Unexpected remote request: ${request.url()}`);
    });
    await page.goto(`${preview.url}/`, { waitUntil: "networkidle" });
    if (await page.locator("#welcome-start").isVisible()) await page.locator("#welcome-start").click();
    if (!(await page.locator("#garment-tee").isVisible())) await page.locator("#journey-step-start").click();
    const advanced = page.locator("#advanced-views");

    const faces = [];
    for (const recipe of recipes) {
      if (!(await page.locator(`#garment-${recipe}`).isVisible())) await page.locator("#journey-step-start").click();
      await page.locator(`#garment-${recipe}`).click();
      await page.locator("#journey-step-fit").click();
      if (!(await advanced.evaluate((node) => node.open))) await page.locator("#advanced-view-label").click();
      await page.locator("#view-flat").click();
      for (const [kind, selector] of [["front", "#technical-flat-front"], ["back", "#technical-flat-back"]]) {
        await page.locator(selector).click();
        await page.waitForTimeout(100);
        if (await page.locator("[data-technical-flat-svg] svg").count() !== 1) {
          const state = await page.evaluate(() => ({ detailsOpen: document.querySelector("#advanced-views")?.open,
            detailsHidden: document.querySelector("#advanced-views")?.hasAttribute("hidden"),
            flatPressed: document.querySelector("#view-flat")?.getAttribute("aria-pressed"),
            stage: [...document.querySelectorAll(".journey-stage")].map((node) => [node.id, node.getAttribute("data-stage-state")]),
            revision: document.querySelector("[data-technical-flat-revision]")?.getAttribute("data-technical-flat-revision"),
            canvas: document.querySelector("#canvas-host")?.textContent?.slice(0, 1200),
            issues: document.querySelector("[data-technical-flat-issues]")?.textContent,
            panel: document.querySelector("[data-technical-flat-svg]")?.textContent?.slice(0, 1200) }));
          const name = `${recipe}-${kind}`;
          await page.locator("#canvas-host").screenshot({ path: path.join(output, `${name}-blocked.png`), animations: "disabled" });
          faces.push({ name, recipeId: recipe, kind: kind === "front" ? "FRONT_FLAT" : "BACK_FLAT",
            revision: state.revision, blocked: true, guidance: state.issues, screenshot: `${name}-blocked.png` });
          continue;
        }
        await page.evaluate(() => document.fonts.ready);
        const svg = page.locator("[data-technical-flat-svg] svg");
        const capture = await svg.evaluate((element) => {
          const root = element;
          const viewBox = root.viewBox.baseVal;
          const revision = root.getAttribute("data-revision-id");
          const labels = [...root.querySelectorAll("g[data-layer-group='TEXT_LABELS'] text")].map((node) => {
            const box = node.getBBox();
            return { id: node.getAttribute("data-label-for"), text: node.textContent,
              revision: node.getAttribute("data-revision-id"), x: Number(node.getAttribute("x")),
              y: Number(node.getAttribute("y")), box: { x: box.x, y: box.y, width: box.width, height: box.height } };
          });
          const notices = [...root.querySelectorAll("g[data-layer-group='SOURCE_NOTICES'] text")].map((node) => {
            const box = node.getBBox();
            return { id: node.getAttribute("data-notice-id"), text: node.textContent,
              box: { x: box.x, y: box.y, width: box.width, height: box.height } };
          });
          const callouts = [...root.querySelectorAll("g[data-callout-target]")].map((node) => {
            const label = root.querySelector(`text[data-label-for='${CSS.escape(node.getAttribute("data-entity-id"))}']`);
            const path = node.querySelector("path")?.getAttribute("d") ?? "";
            const end = path.match(/L([\d.-]+) ([\d.-]+)$/u);
            return { id: node.getAttribute("data-entity-id"), target: node.getAttribute("data-callout-target"),
              leaderEnd: end ? { x: Number(end[1]), y: Number(end[2]) } : null,
              label: label ? { x: Number(label.getAttribute("x")), y: Number(label.getAttribute("y")) } : null };
          });
          const parser = new DOMParser().parseFromString(root.outerHTML, "image/svg+xml");
          const labelOverlaps = [];
          for (let left = 0; left < labels.length; left += 1) for (let right = left + 1; right < labels.length; right += 1) {
            const a = labels[left].box; const b = labels[right].box;
            if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) {
              labelOverlaps.push([labels[left].id, labels[right].id]);
            }
          }
          const noticeBounds = [...root.querySelectorAll("g[data-layer-group='SOURCE_NOTICES'] text")].map((node) => {
            const box = node.getBBox();
            return box.x >= viewBox.x && box.y >= viewBox.y && box.x + box.width <= viewBox.x + viewBox.width
              && box.y + box.height <= viewBox.y + viewBox.height;
          });
          const noticeRect = root.querySelector("g[data-layer-group='SOURCE_NOTICES'] rect")?.getBBox();
          const noticesWithinPanel = Boolean(noticeRect) && [...root.querySelectorAll("g[data-layer-group='SOURCE_NOTICES'] text")]
            .every((node) => {
              const box = node.getBBox();
              return box.x >= noticeRect.x && box.y >= noticeRect.y && box.x + box.width <= noticeRect.x + noticeRect.width
                && box.y + box.height <= noticeRect.y + noticeRect.height;
            });
          const labelsWithinViewBox = labels.every(({ box }) => box.x >= viewBox.x && box.y >= viewBox.y
            && box.x + box.width <= viewBox.x + viewBox.width && box.y + box.height <= viewBox.y + viewBox.height);
          return { recipeId: root.getAttribute("data-recipe-id"), kind: root.getAttribute("data-view-kind"),
            revision, viewBox: { x: viewBox.x, y: viewBox.y, width: viewBox.width, height: viewBox.height },
            issues: root.parentElement?.querySelector("[data-technical-flat-issues]")?.textContent ?? null,
            labels, notices, callouts, labelOverlaps, noticesWithinViewBox: noticeBounds.every(Boolean),
            noticePanelBox: noticeRect ? { x: noticeRect.x, y: noticeRect.y, width: noticeRect.width, height: noticeRect.height } : null,
            labelsWithinViewBox, noticesWithinPanel,
            noticeLineCount: notices.length, parserError: Boolean(parser.querySelector("parsererror")),
            entityRevisionMismatch: [...root.querySelectorAll("[data-revision-id]")]
              .some((node) => node.getAttribute("data-revision-id") !== revision) };
        });
        const name = `${recipe}-${kind}`;
        await fs.writeFile(path.join(output, `${name}.svg`), await svg.evaluate((element) => element.outerHTML), "utf8");
        await svg.screenshot({ path: path.join(output, `${name}.png`), animations: "disabled", timeout: 15000 });
        faces.push({ ...capture, name });
      }
    }
    const matrix = { generatedAt: new Date().toISOString(), viewport: { width: 1440, height: 3000 },
      browser: "Playwright Chromium production preview", faces, consoleErrors, pageErrors, requestErrors: errors };
    await fs.writeFile(path.join(output, "matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`, "utf8");
    assert.equal(faces.length, 14, "all recipe front/back faces should be captured");
    assert.deepEqual(consoleErrors, [], "production browser should not log console errors");
    assert.deepEqual(pageErrors, [], "production browser should not throw page errors");
    assert.deepEqual(errors, [], "production browser should not request remote services");
      for (const face of faces) {
      if (face.blocked) {
        assert.ok(face.guidance, `${face.name} must show actionable guidance when withheld`);
        assert.doesNotMatch(face.guidance, /text labels?.*overlap|no collision-free measured position/iu,
          `${face.name} should not remain blocked by label layout`);
        continue;
      }
      assert.ok(face.revision?.startsWith("live-draft:"), `${face.name} has a live draft revision`);
      assert.equal(face.issues, null, `${face.name} should not be withheld`);
      assert.equal(face.parserError, false, `${face.name} should parse as SVG`);
      assert.equal(face.entityRevisionMismatch, false, `${face.name} entity revisions should agree`);
      assert.deepEqual(face.labelOverlaps, [], `${face.name} browser glyph bounds should not overlap`);
      assert.equal(face.labelsWithinViewBox, true, `${face.name} measured label boxes should fit the SVG`);
      assert.equal(face.noticesWithinViewBox, true, `${face.name} source notices should fit the SVG viewBox`);
      assert.equal(face.noticesWithinPanel, true, `${face.name} source notice text should fit its visible panel: ${JSON.stringify({ panel: face.noticePanelBox, lastLines: face.notices.slice(-2) })}`);
      for (const callout of face.callouts) {
        assert.deepEqual(callout.leaderEnd, callout.label, `${face.name} ${callout.id} leader must terminate at its represented label`);
      }
    }
    process.stdout.write(`Captured and checked ${faces.length} Chromium-rendered recipe faces.\n`);
    for (const face of faces) process.stdout.write(face.blocked
      ? `${face.name}: withheld with visible guidance: ${face.guidance}\n`
      : `${face.name}: ${face.labels.length} labels, ${face.noticeLineCount} visible notice lines, ${face.revision}\n`);
  } finally {
    if (browser) await browser.close();
    preview.stop();
  }
}

main().catch((error) => { process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1; });
