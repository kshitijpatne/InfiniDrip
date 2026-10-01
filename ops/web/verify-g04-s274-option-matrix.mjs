import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import verificationHelpers from "../../electron/verify-common.cjs";

const { startPreviewServer } = verificationHelpers;
const wovenOnly = process.argv.includes("--woven-only");
const trouserOnly = process.argv.includes("--trouser-only");
const teeFittedOnly = process.argv.includes("--tee-fitted-only");
const poloWovenOnly = process.argv.includes("--polo-woven-only");
const output = path.resolve(process.env.G04_OPTION_MATRIX_OUTPUT
  ?? (wovenOnly ? "docs/research/epic17/S286-browser" : "docs/research/epic17/S274-browser"));
const smoke = process.argv.includes("--smoke");
const recipes = wovenOnly ? ["woven-shirt"] : trouserOnly ? ["trouser"] : teeFittedOnly ? ["tee", "fitted"]
  : poloWovenOnly ? ["polo", "woven-shirt"]
  : smoke ? ["tee", "polo"] : ["tee", "fitted", "tank", "polo", "woven-shirt", "skirt", "trouser"];
const consoleErrors = [];
const pageErrors = [];
const requestErrors = [];

async function captureFace(page, caseId, recipeId, face) {
  const faceName = face === "FRONT_FLAT" ? "front" : "back";
  const faceSelector = face === "FRONT_FLAT" ? "#technical-flat-front" : "#technical-flat-back";
  await page.locator(faceSelector).click();
  await page.locator(faceSelector).evaluate((button) => button.click());
  try {
    await page.waitForFunction(({ selector, expected }) => document.querySelector(selector)?.getAttribute("aria-pressed") === "true"
      && (document.querySelector("[data-technical-flat-svg] svg")?.getAttribute("data-view-kind") === expected
        || !document.querySelector("[data-technical-flat-svg] svg")), { selector: faceSelector, expected: face }, { timeout: 8000 });
  } catch (error) {
    const observed = await page.evaluate(() => ({
      faceButtons: [...document.querySelectorAll("button[data-technical-flat-face]")].map((button) => [button.id, button.getAttribute("aria-pressed")]),
      svgKind: document.querySelector("[data-technical-flat-svg] svg")?.getAttribute("data-view-kind") ?? null,
      issues: document.querySelector("[data-technical-flat-issues]")?.textContent ?? null,
    }));
    process.stderr.write(`Face selection mismatch for ${caseId}/${face}: ${JSON.stringify(observed)}\n`);
    throw error;
  }
  await page.waitForTimeout(80);
  const revision = await page.locator("[data-technical-flat-revision]")
    .getAttribute("data-technical-flat-revision").catch(() => null);
  const issues = (await page.locator("[data-technical-flat-issues]").allTextContents()).join("\n").trim() || null;
  const name = `${caseId}-${faceName}`;
  const retainScreenshot = new Set([
    "tee-default-front",
    "tee-default-back",
    "fitted-default-front",
    "fitted-default-back",
    "skirt-default-front",
    "skirt-default-back",
    "polo-default-front",
    "polo-default-back",
    "woven-shirt-default-front",
    "trouser-default-front",
    "trouser-default-back",
    "trouser-backRiseEase-min-back",
    "trouser-backRiseEase-max-back",
    "trouser-waistbandDepth-max-back",
    "polo-backHemDrop-max-back",
    "woven-shirt-buttonCount-min-front",
    "woven-shirt-default-front",
    "woven-shirt-default-back",
    "woven-shirt-sideVentDepth-min-front",
    "woven-shirt-sideVentDepth-min-back",
    "trouser-legOpening-max-front",
  ]).has(name);
  const svgCount = await page.locator("[data-technical-flat-svg] svg").count();
  const state = { name, caseId, recipeId, face, revision, issues, blocked: svgCount !== 1 };
  if (svgCount !== 1) {
    if (retainScreenshot) await page.locator("#canvas-host").screenshot({ path: path.join(output, `${name}.png`), animations: "disabled", timeout: 20000 });
    return { ...state, guidanceVisible: Boolean(issues), screenshot: retainScreenshot ? `${name}.png` : null };
  }

  await page.evaluate(() => document.fonts.ready);
  const svg = page.locator("[data-technical-flat-svg] svg");
  const captured = await svg.evaluate((root) => {
    const viewBox = root.viewBox.baseVal;
    const svgRevision = root.getAttribute("data-revision-id");
    const labels = [...root.querySelectorAll("g[data-layer-group='TEXT_LABELS'] text")].map((node) => {
      const box = node.getBBox();
      return { id: node.getAttribute("data-label-for"), text: node.textContent, revision: node.getAttribute("data-revision-id"),
        box: { x: box.x, y: box.y, width: box.width, height: box.height } };
    });
    const overlaps = [];
    for (let i = 0; i < labels.length; i += 1) for (let j = i + 1; j < labels.length; j += 1) {
      const a = labels[i].box; const b = labels[j].box;
      if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) overlaps.push([labels[i].id, labels[j].id]);
    }
    const callouts = [...root.querySelectorAll("g[data-callout-target]")].map((node) => {
      const target = node.getAttribute("data-callout-target");
      const targetGeometry = [...root.querySelectorAll("[data-entity-id]")].some((entity) => entity.getAttribute("data-entity-id") === target && entity !== node);
      const label = root.querySelector(`text[data-label-for='${CSS.escape(node.getAttribute("data-entity-id"))}']`);
      const pathData = node.querySelector("path")?.getAttribute("d") ?? "";
      const end = pathData.match(/L([\d.-]+) ([\d.-]+)$/u);
      const anchor = node.querySelector("circle");
      return { id: node.getAttribute("data-entity-id"), target, targetGeometry, label: Boolean(label),
        sourceId: node.getAttribute("data-source-id"), revision: node.getAttribute("data-revision-id"),
        anchorPoint: anchor ? { x: Number(anchor.getAttribute("cx")), y: Number(anchor.getAttribute("cy")) } : null,
        leaderEnd: end ? { x: Number(end[1]), y: Number(end[2]) } : null,
        labelAt: label ? { x: Number(label.getAttribute("x")), y: Number(label.getAttribute("y")) } : null };
    });
    const within = labels.every(({ box }) => box.x >= viewBox.x && box.y >= viewBox.y && box.x + box.width <= viewBox.x + viewBox.width && box.y + box.height <= viewBox.y + viewBox.height);
    const notices = [...root.querySelectorAll("g[data-layer-group='SOURCE_NOTICES'] text")].map((node) => {
      const box = node.getBBox(); return { text: node.textContent, x: box.x, y: box.y, width: box.width, height: box.height };
    });
    const noticeRect = root.querySelector("g[data-layer-group='SOURCE_NOTICES'] rect")?.getBBox();
    const noticesWithinPanel = Boolean(noticeRect) && [...root.querySelectorAll("g[data-layer-group='SOURCE_NOTICES'] text")].every((node) => {
      const box = node.getBBox(); return box.x >= noticeRect.x && box.y >= noticeRect.y && box.x + box.width <= noticeRect.x + noticeRect.width && box.y + box.height <= noticeRect.y + noticeRect.height;
    });
    const parser = new DOMParser().parseFromString(root.outerHTML, "image/svg+xml");
    return { recipeId: root.getAttribute("data-recipe-id"), face: root.getAttribute("data-view-kind"), revision: svgRevision,
      viewBox: { x: viewBox.x, y: viewBox.y, width: viewBox.width, height: viewBox.height }, labels, overlaps, labelsWithinViewBox: within,
      callouts, notices, noticesWithinPanel, parserError: Boolean(parser.querySelector("parsererror")),
      sourceIds: [...new Set([...root.querySelectorAll("[data-source-id]")].map((node) => node.getAttribute("data-source-id")))],
      entityRevisionMismatch: [...root.querySelectorAll("[data-revision-id]")].some((node) => node.getAttribute("data-revision-id") !== svgRevision),
      overlayMetadata: [...root.querySelectorAll("[data-layer-group='ARTWORK_OVERLAYS'] [data-source-id]")].map((node) => ({ sourceId: node.getAttribute("data-source-id"), layer: node.getAttribute("data-layer") })) };
  });
  await fs.writeFile(path.join(output, `${name}.svg`), await svg.evaluate((element) => element.outerHTML), "utf8");
  if (retainScreenshot) await svg.screenshot({ path: path.join(output, `${name}.png`), animations: "disabled", timeout: 20000 });
  return { ...state, ...captured, screenshot: retainScreenshot ? `${name}.png` : null, svg: `${name}.svg` };
}

async function main() {
  await fs.mkdir(output, { recursive: true });
  const preview = await startPreviewServer();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 3000 }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(8000);
    const origin = new URL(preview.url).origin;
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("request", (request) => { if (new URL(request.url()).origin !== origin) requestErrors.push(request.url()); });
    await page.goto(`${preview.url}/`, { waitUntil: "networkidle" });
    if (await page.locator("#welcome-start").isVisible()) await page.locator("#welcome-start").click();
    if (!(await page.locator("#garment-tee").isVisible())) await page.locator("#journey-step-start").click();
    const faces = [];
    const cases = [];
    const expectedConfigurationCounts = new Map();
    const expectedOptionFieldCount = new Set();
    const setOption = async (id, value) => {
      const input = page.locator(`#controls-panel input[data-option='${id}']`);
      const pageNumber = await input.evaluate((node) => node.closest("[data-control-page]")?.getAttribute("data-control-page") ?? null);
      if (pageNumber !== null) {
        const pageSelect = page.locator("#control-page-select");
        if (await pageSelect.inputValue() !== pageNumber) await pageSelect.selectOption(pageNumber);
      }
      if (Number(await input.inputValue()) !== value) await input.fill(String(value));
    };
    for (const recipeId of recipes) {
      if (!(await page.locator(`#garment-${recipeId}`).isVisible())) await page.locator("#journey-step-start").click();
      await page.locator(`#garment-${recipeId}`).click();
      await page.locator("#journey-step-fit").click();
      if (!(await page.locator("#advanced-views").evaluate((node) => node.open))) await page.locator("#advanced-view-label").click();
      await page.locator("#view-flat").click();
      const definitions = await page.locator("#controls-panel input[data-option]").evaluateAll((nodes) => nodes.map((input) => ({
        id: input.getAttribute("data-option"), min: Number(input.min), max: Number(input.max), value: Number(input.defaultValue || input.value),
      }))).then((items) => smoke && recipeId === "polo" ? items.slice(0, 1) : items);
      expectedConfigurationCounts.set(recipeId, 1 + definitions.length * 2
        + (!smoke && ["woven-shirt", "trouser"].includes(recipeId) ? 1 : 0));
      for (const definition of definitions) expectedOptionFieldCount.add(`${recipeId}:${definition.id}`);
      const run = async (caseId, kind, optionValues = {}) => {
        process.stdout.write(`CASE ${caseId}\n`);
        const options = Object.fromEntries(await page.locator("#controls-panel input[data-option]").evaluateAll((nodes) => nodes.map((input) => [input.getAttribute("data-option"), Number(input.value)])));
        cases.push({ caseId, recipeId, kind, optionValues, options });
        const pair = [];
        for (const face of ["FRONT_FLAT", "BACK_FLAT"]) {
          const captured = await captureFace(page, caseId, recipeId, face);
          pair.push(captured);
          process.stdout.write(`FACE ${captured.name} ${captured.blocked ? "WITHHELD" : "SVG"}\n`);
        }
        if (!pair[0].blocked && !pair[1].blocked) assert.equal(pair[0].revision, pair[1].revision, `${caseId} front/back must share one exact live draft`);
        for (const face of pair) {
          if (face.blocked) {
            assert.equal(face.guidanceVisible, true, `${face.name} blocked output must retain visible source guidance`);
            assert.ok(face.issues && face.issues.length > 5, `${face.name} blocked output must explain its hold`);
            if (/TEXT_COLLISION|no collision-free measured position/iu.test(face.issues)) assert.fail(`${face.name} was withheld for unresolved label layout: ${face.issues}`);
          } else {
            assert.equal(face.parserError, false, `${face.name} must parse as SVG`);
            assert.equal(face.entityRevisionMismatch, false, `${face.name} entities must retain one revision`);
            assert.deepEqual(face.overlaps, [], `${face.name} browser text bounds must not overlap`);
            assert.equal(face.labelsWithinViewBox, true, `${face.name} labels must fit the viewBox`);
            assert.equal(face.noticesWithinPanel, true, `${face.name} notices must fit the panel`);
            for (const anchor of face.callouts) {
              assert.equal(anchor.targetGeometry, true, `${face.name} POM ${anchor.id} anchor must resolve to represented geometry`);
              assert.equal(anchor.label, true, `${face.name} POM ${anchor.id} must have a label`);
              assert.deepEqual(anchor.leaderEnd, anchor.labelAt, `${face.name} POM ${anchor.id} leader must terminate at its label`);
            }
            if (recipeId === "trouser" && face.face === "BACK_FLAT") {
              assert.equal(face.callouts.length, 2, `${face.name} must show the source-mapped back-rise and waistband-depth callouts`);
              const backRise = face.callouts.find((callout) => callout.id === "flat:trouser:BACK_FLAT:callout:back-rise-finished-incl-waistband");
              assert.ok(backRise, `${face.name} must retain the source-mapped back-rise callout`);
              assert.equal(backRise.target, "flat:trouser:BACK_FLAT:component:backLeft:outline");
              assert.equal(backRise.sourceId, "pom:trouser:back-rise-finished-incl-waistband");
              assert.equal(backRise.revision, face.revision);
              assert.ok(backRise.anchorPoint && Number.isFinite(backRise.anchorPoint.x)
                && Number.isFinite(backRise.anchorPoint.y), `${face.name} back-rise anchor must be a finite point`);
              const waistbandDepth = face.callouts.find((callout) => callout.id === "flat:trouser:BACK_FLAT:callout:waistband-depth-finished");
              assert.ok(waistbandDepth, `${face.name} must retain the source-mapped waistband-depth callout`);
              assert.equal(waistbandDepth.target, "live-flat:trouser:BACK_FLAT:waistband:mark:centerBack");
              assert.equal(waistbandDepth.sourceId, "pom:trouser:waistband-depth-finished");
              assert.equal(waistbandDepth.revision, face.revision);
              assert.ok(waistbandDepth.anchorPoint && Number.isFinite(waistbandDepth.anchorPoint.x)
                && Number.isFinite(waistbandDepth.anchorPoint.y), `${face.name} waistband-depth anchor must be a finite point`);
            }
          }
        }
        faces.push(...pair);
      };
      const resetOptions = async () => {
        for (const definition of definitions) {
          await setOption(definition.id, definition.value);
        }
      };
      await resetOptions();
      await run(`${recipeId}-default`, "default");
      for (const definition of definitions) {
        for (const [edge, value] of [["min", definition.min], ["max", definition.max]]) {
          await setOption(definition.id, value);
          await run(`${recipeId}-${definition.id}-${edge}`, "single-option-endpoint", { [definition.id]: value });
        }
        await setOption(definition.id, definition.value);
      }
      if (!smoke && recipeId === "woven-shirt") {
        const combo = { buttonCount: 6, buttonSpacing: 6, frontOverlap: 2, placketWidth: 4, standHeight: 3,
          collarLeafDepth: 7, pocketWidth: 14, pocketHeight: 15 };
        for (const [id, value] of Object.entries(combo)) await setOption(id, value);
        await run("woven-shirt-combined-supported", "source-test-backed-combination", combo);
        await resetOptions();
      }
      if (!smoke && recipeId === "trouser") {
        const combo = { frontRiseEase: 2, backRiseEase: 11, thighEase: 10, kneeEase: 7, legOpening: 48 };
        for (const [id, value] of Object.entries(combo)) await setOption(id, value);
        await run("trouser-combined-supported", "source-test-backed-combination", combo);
        await resetOptions();
      }
    }
    const expectedCases = [...expectedConfigurationCounts.values()].reduce((sum, count) => sum + count, 0);
    assert.equal(faces.length, expectedCases * 2, "each default, option endpoint and bounded fixture must render both faces");
    assert.equal(cases.length, expectedCases, "every default, endpoint and bounded-combination input must be recorded");
    assert.equal(definitionsCount(cases), expectedOptionFieldCount.size, "the endpoint matrix should cover every declared option field");
    assert.deepEqual(consoleErrors, [], "production browser should not log console errors");
    assert.deepEqual(pageErrors, [], "production browser should not throw page errors");
    assert.deepEqual(requestErrors, [], "production browser should not request remote services");
    const matrix = { generatedAt: new Date().toISOString(), viewport: { width: 1440, height: 3000 },
      browser: "Playwright Chromium production preview through the live app UI", recipes, cases, faces,
      summary: { faceCount: faces.length, accepted: faces.filter((face) => !face.blocked).length,
        withheld: faces.filter((face) => face.blocked).length, blockedByReason: groupBlocked(faces),
        optionFieldCount: definitionsCount(cases), consoleErrors, pageErrors, requestErrors } };
    await fs.writeFile(path.join(output, "matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`, "utf8");
    process.stdout.write(`Captured ${faces.length} Chromium-rendered front/back faces for ${cases.length} option configurations.\n`);
    process.stdout.write(`${JSON.stringify(matrix.summary, null, 2)}\n`);
  } finally {
    if (browser) await browser.close();
    preview.stop();
  }
}

function definitionsCount(cases) {
  return new Set(cases.filter((item) => item.kind === "single-option-endpoint")
    .flatMap((item) => Object.keys(item.optionValues).map((id) => `${item.recipeId}:${id}`))).size;
}

function groupBlocked(faces) {
  const grouped = {};
  for (const face of faces.filter((entry) => entry.blocked)) {
    const reason = (face.issues ?? "no guidance").replace(/\s+/gu, " ").slice(0, 180);
    grouped[reason] = (grouped[reason] ?? 0) + 1;
  }
  return grouped;
}

main().catch((error) => { process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1; });
