import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const folder = dirname(fileURLToPath(import.meta.url));
const baseUrl = process.env.G04_PREVIEW_URL ?? "http://127.0.0.1:4178/";
const output = join(folder, "production-replay");
await mkdir(output, { recursive: true });
const baseline = JSON.parse(await readFile(new URL("../S330-integrated-browser/matrix.json", import.meta.url), "utf8"));
const caseLimitArg = process.argv.find((argument) => argument.startsWith("--limit="))?.slice("--limit=".length);
const caseLimit = Number(caseLimitArg ?? process.env.G04_CASE_LIMIT ?? 0);
const configurations = baseline.cases.map(({ caseId, recipeId, options }) => ({ caseId, recipeId, options }))
  .slice(0, caseLimit > 0 ? caseLimit : undefined);
const browserErrors = [];
const browser = await chromium.launch({ headless: true });
const records = [];

try {
  for (const testCase of configurations) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 2600 }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(60000);
    console.log(`Starting ${testCase.caseId}`);
    page.on("pageerror", (error) => browserErrors.push({ kind: "pageerror", caseId: testCase.caseId, message: error.message }));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push({ kind: "console", caseId: testCase.caseId, message: message.text() });
    });
    page.on("requestfailed", (request) => browserErrors.push({ kind: "requestfailed", caseId: testCase.caseId,
      url: request.url(), error: request.failure()?.errorText }));
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(250);
    const skipTour = page.getByRole("button", { name: /Skip for now/ });
    if (await skipTour.count()) await skipTour.click();
    await page.locator(`#garment-${testCase.recipeId}`).click();
    await page.locator("#journey-next").click();
    await page.waitForFunction(() => document.querySelector("#infini-shell")?.getAttribute("data-stage") === "measure");
    await page.locator("#journey-next").click();
    await page.waitForFunction(() => document.querySelector("#infini-shell")?.getAttribute("data-stage") === "fit");

    for (const [field, value] of Object.entries(testCase.options)) {
      const input = page.locator(`#input-option-${field}`);
      const pageIndex = await input.evaluate((element) => element.closest("[data-control-page]")?.getAttribute("data-control-page") ?? null);
      const pageOptions = await page.locator("#control-page-select option").evaluateAll((options) => options.map((option) => option.value));
      if (pageIndex === null || !pageOptions.includes(pageIndex)) {
        throw new Error(`${testCase.caseId}.${field}: option page ${pageIndex} missing from ${JSON.stringify(pageOptions)}`);
      }
      await page.locator("#control-page-select").selectOption({ value: pageIndex });
      await input.fill(String(value));
      await input.dispatchEvent("change");
    }
    const resolvedOptions = await page.evaluate(() => Object.fromEntries(
      [...document.querySelectorAll("#controls-panel input[type='number']")]
        .map((input) => [input.getAttribute("data-option") ?? input.getAttribute("data-field"), Number(input.value)]),
    ));
    const optionMismatches = Object.entries(testCase.options)
      .filter(([field, value]) => resolvedOptions[field] !== value)
      .map(([field, expected]) => ({ field, expected, actual: resolvedOptions[field] }));
    await page.locator("#journey-next").click();
    await page.locator("#advanced-views summary").click();
    await page.locator("#view-flat").click();

    const faces = [];
    for (const [kind, buttonId] of [["FRONT_FLAT", "technical-flat-front"], ["BACK_FLAT", "technical-flat-back"]]) {
      try {
        await page.locator(`#${buttonId}`).click();
      } catch (error) {
        const state = await page.evaluate(() => ({ url: location.href,
          stage: document.querySelector("#infini-shell")?.getAttribute("data-stage") ?? null,
          text: document.body.innerText.slice(-2400),
          buttons: [...document.querySelectorAll("button")].map((button) => ({ id: button.id, text: button.innerText,
            disabled: button.disabled })).filter((button) => button.id || /flat|view/i.test(button.text)) }));
        await page.screenshot({ path: join(output, `${testCase.caseId}-${kind.toLowerCase()}-failure.png`), fullPage: true });
        await writeFile(join(output, `${testCase.caseId}-${kind.toLowerCase()}-failure.json`),
          JSON.stringify({ caseId: testCase.caseId, recipeId: testCase.recipeId, kind, state,
            error: error instanceof Error ? error.message : String(error) }, null, 2));
        throw new Error(`${testCase.caseId} ${kind}: flat selector failure; state saved: ${JSON.stringify(state)}`);
      }
      await page.waitForSelector("[data-technical-flat-issues], [data-technical-flat-svg]");
      await page.waitForTimeout(80);
      await page.evaluate(() => document.fonts.ready);
      const result = await page.evaluate((kind) => {
        const guidance = document.querySelector("[data-technical-flat-issues]");
        const svg = document.querySelector("[data-technical-flat-svg] svg");
        const statuses = [...document.querySelectorAll('[role="status"]')].map((node) => node.textContent ?? "");
        return {
          kind,
          svgCount: document.querySelectorAll("[data-technical-flat-svg] svg").length,
          issueCount: guidance?.querySelectorAll("li").length ?? 0,
          guidance: guidance?.innerText ?? "",
          statuses,
          svg: svg?.outerHTML ?? null,
          recipeId: svg?.getAttribute("data-recipe-id") ?? null,
          revisionId: svg?.getAttribute("data-revision-id") ?? null,
          mixedRevisions: svg ? [...svg.querySelectorAll("[data-revision-id]")]
            .some((node) => node.getAttribute("data-revision-id") !== svg.getAttribute("data-revision-id")) : false,
          layerOrder: svg ? [...svg.querySelectorAll("[data-layer-group]")].map((node) => node.getAttribute("data-layer-group")) : [],
          sleeveOutlineCount: svg?.querySelectorAll("[data-entity-id^='flat:polo:'][data-entity-id*='component:sleeve:outline']").length ?? 0,
          colorwayFillOnlyCount: svg?.querySelectorAll("[data-colorway-fill-for]").length ?? 0,
          colorwayRevisionMismatches: svg ? [...svg.querySelectorAll("[data-colorway-revision]")]
            .filter((node) => node.getAttribute("data-colorway-revision") !== svg.getAttribute("data-revision-id")).length : 0,
          calloutCount: svg?.querySelectorAll("[data-callout-target]").length ?? 0,
          sourcePomIds: svg ? [...new Set([...svg.querySelectorAll("[data-source-id^='pom:']")]
            .map((node) => node.getAttribute("data-source-id")))].sort() : [],
          unresolvedCalloutTargets: svg ? [...svg.querySelectorAll("[data-callout-target]")]
            .filter((node) => {
              const targets = (node.getAttribute("data-callout-target") ?? "").split("|").map((value) => value.trim()).filter(Boolean);
              const entities = new Set([...svg.querySelectorAll("[data-entity-id]")].filter((entity) => entity !== node)
                .map((entity) => entity.getAttribute("data-entity-id")));
              return targets.length === 0 || targets.some((target) => !entities.has(target));
            }).length : 0,
          labelCount: svg?.querySelectorAll("g[data-layer-group='TEXT_LABELS'] text").length ?? 0,
          labelOverlapCount: svg ? (() => {
            const labels = [...svg.querySelectorAll("g[data-layer-group='TEXT_LABELS'] text")].map((node) => {
              const box = node.getBBox();
              return { x: box.x, y: box.y, width: box.width, height: box.height };
            });
            let overlaps = 0;
            for (let i = 0; i < labels.length; i += 1) for (let j = i + 1; j < labels.length; j += 1) {
              const a = labels[i]; const b = labels[j];
              if (a.x < b.x + b.width - 0.002 && b.x < a.x + a.width - 0.002
                && a.y < b.y + b.height - 0.002 && b.y < a.y + a.height - 0.002) overlaps += 1;
            }
            return overlaps;
          })() : 0,
        };
      }, kind);
      result.holdHasActionableGuidance = result.svgCount > 0 || (result.issueCount > 0
        && result.statuses.some((status) => status.includes("Technical flat withheld")) && Boolean(result.guidance.trim()));
      result.outputIdentityValid = result.svgCount === 1 && result.recipeId === testCase.recipeId
        && Boolean(result.revisionId) && !result.mixedRevisions;
      result.recipeId = testCase.recipeId;
      await writeFile(join(output, `${testCase.caseId}-${kind.toLowerCase()}.svg.json`), JSON.stringify(result, null, 2));
      await page.screenshot({ path: join(output, `${testCase.caseId}-${kind.toLowerCase()}.png`), fullPage: true });
      const { svg, ...summary } = result;
      if (svg) await writeFile(join(output, `${testCase.caseId}-${kind.toLowerCase()}.svg`), svg);
      faces.push(summary);
    }
    const faceRevisions = [...new Set(faces.filter((face) => face.svgCount > 0).map((face) => face.revisionId))];
    records.push({ caseId: testCase.caseId, recipeId: testCase.recipeId, options: testCase.options,
      resolvedOptions, optionMismatches, pairedRevisionMismatch: faceRevisions.length > 1, faces });
    await page.close();
  }
} finally {
  await browser.close();
}

const matrix = { generatedAt: new Date().toISOString(), browser: "Playwright Chromium production preview through the live app UI",
  url: baseUrl, fixture: "../S330-integrated-browser/matrix.json", fixtureConfigurations: baseline.cases.length,
  viewport: { width: 1440, height: 2600 }, recipes: [...new Set(records.map((record) => record.recipeId))],
  configurations: records.length, faceRequests: records.length * 2, browserErrors, cases: records };
await writeFile(join(output, "matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`);
if (browserErrors.length) throw new Error(`Browser emitted ${browserErrors.length} console/page/request errors.`);
console.log(JSON.stringify({ configurations: records.length, faceRequests: records.length * 2,
  svgFaces: records.flatMap((record) => record.faces).filter((face) => face.svgCount > 0).length,
  heldFaces: records.flatMap((record) => record.faces).filter((face) => face.svgCount === 0).length,
  issueFaces: records.flatMap((record) => record.faces).filter((face) => face.issueCount > 0).length,
  invalidOptions: records.filter((record) => record.optionMismatches.length).length,
  mismatchedFaceRevisionPairs: records.filter((record) => record.pairedRevisionMismatch).length,
  invalidOutputIdentityFaces: records.flatMap((record) => record.faces).filter((face) => face.svgCount > 0 && !face.outputIdentityValid).length,
  colorwayRevisionMismatches: records.flatMap((record) => record.faces).reduce((sum, face) => sum + face.colorwayRevisionMismatches, 0),
  calloutTargetMisses: records.flatMap((record) => record.faces).reduce((sum, face) => sum + face.unresolvedCalloutTargets, 0),
  labelOverlaps: records.flatMap((record) => record.faces).reduce((sum, face) => sum + face.labelOverlapCount, 0),
  browserErrors: browserErrors.length, output }, null, 2));
