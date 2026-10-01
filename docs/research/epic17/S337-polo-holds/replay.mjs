import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = process.env.G04_PREVIEW_URL ?? "http://127.0.0.1:4175/";
const output = join(process.cwd(), "docs/research/epic17/S337-polo-holds/production-replay");
await mkdir(output, { recursive: true });
const baseline = JSON.parse(await readFile(new URL("../S331-polo-browser-final/matrix.json", import.meta.url), "utf8"));
const configurations = baseline.cases.map(({ caseId, options }) => ({ caseId, options }));
const browserErrors = [];
const browser = await chromium.launch({ headless: true });
const records = [];

try {
  for (const testCase of configurations) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 2600 }, deviceScaleFactor: 1 });
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
    await page.locator("#garment-polo").click();
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
    await page.locator("#journey-next").click();
    await page.locator("#advanced-views summary").click();
    await page.locator("#view-flat").click();

    const faces = [];
    for (const [kind, buttonId] of [["FRONT_FLAT", "technical-flat-front"], ["BACK_FLAT", "technical-flat-back"]]) {
      await page.locator(`#${buttonId}`).click();
      await page.waitForSelector("[data-technical-flat-issues], [data-technical-flat-svg]");
      await page.waitForTimeout(80);
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
        };
      }, kind);
      if (result.svgCount === 0 && (result.issueCount === 0 || !result.statuses.some((status) => status.includes("Technical flat withheld"))
        || !result.guidance.includes("Sleeve-cap ease") || !result.guidance.includes("0.25 cm acceptance tolerance"))) {
        throw new Error(`${testCase.caseId} ${kind}: face withheld without actionable reason/status: ${JSON.stringify(result)}`);
      }
      if (result.svgCount > 0 && (result.recipeId !== "polo" || !result.revisionId || result.mixedRevisions)) {
        throw new Error(`${testCase.caseId} ${kind}: emitted SVG has invalid recipe/revision: ${JSON.stringify(result)}`);
      }
      await writeFile(join(output, `${testCase.caseId}-${kind.toLowerCase()}.svg.json`), JSON.stringify(result, null, 2));
      await page.screenshot({ path: join(output, `${testCase.caseId}-${kind.toLowerCase()}.png`), fullPage: true });
      const { svg, ...summary } = result;
      if (svg) await writeFile(join(output, `${testCase.caseId}-${kind.toLowerCase()}.svg`), svg);
      faces.push(summary);
    }
    records.push({ caseId: testCase.caseId, resolvedOptions, faces });
    await page.close();
  }
} finally {
  await browser.close();
}

const matrix = { generatedAt: new Date().toISOString(), browser: "Playwright Chromium production preview through the live app UI",
  url: baseUrl, viewport: { width: 1440, height: 2600 }, recipeId: "polo", configurations: records.length,
  faceRequests: records.length * 2, browserErrors, cases: records };
await writeFile(join(output, "matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`);
if (browserErrors.length) throw new Error(`Browser emitted ${browserErrors.length} console/page/request errors.`);
console.log(JSON.stringify({ configurations: records.length, faceRequests: records.length * 2,
  svgFaces: records.flatMap((record) => record.faces).filter((face) => face.svgCount > 0).length,
  heldFaces: records.flatMap((record) => record.faces).filter((face) => face.svgCount === 0).length,
  browserErrors: browserErrors.length, output }, null, 2));
