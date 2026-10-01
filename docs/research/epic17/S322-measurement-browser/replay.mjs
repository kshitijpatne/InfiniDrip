import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = process.env.G04_PREVIEW_URL ?? "http://127.0.0.1:4175/";
const output = fileURLToPath(new URL("./", import.meta.url));
await mkdir(output, { recursive: true });

const configurations = [
  { recipeId: "tee", caseId: "tee-default", measurements: {} },
  { recipeId: "tee", caseId: "tee-measurement-variant", measurements: { chest: 92, shoulderWidth: 39, length: 66, armholeDepth: 21 } },
  { recipeId: "fitted", caseId: "fitted-default", measurements: {} },
  { recipeId: "fitted", caseId: "fitted-measurement-variant", measurements: { chest: 92, shoulderWidth: 39, length: 66, armholeDepth: 21 } },
];
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
    await page.waitForTimeout(400);
    const skipTour = page.getByRole("button", { name: /Skip for now/ });
    if (await skipTour.count()) await skipTour.click();
    await page.locator(`#garment-${testCase.recipeId}`).click();
    await page.locator("#journey-next").click();

    for (const [field, value] of Object.entries(testCase.measurements)) {
      const input = page.locator(`input[data-field='${field}']`);
      const pageIndex = await input.evaluate((element) => element.closest("[data-control-page]")?.getAttribute("data-control-page") ?? null);
      const pageOptions = await page.locator("#control-page-select option").evaluateAll((options) => options.map((option) => option.value));
      if (pageIndex === null || !pageOptions.includes(pageIndex)) {
        throw new Error(`${testCase.caseId}.${field}: control page ${pageIndex} is absent from ${JSON.stringify(pageOptions)}`);
      }
      await page.locator("#control-page-select").selectOption({ value: pageIndex });
      await input.fill(String(value));
      await input.dispatchEvent("change");
    }
    await page.locator("#journey-next").click();
    const measurements = await page.evaluate(() => Object.fromEntries(
      [...document.querySelectorAll("#controls-panel input[data-field]")]
        .map((input) => [input.getAttribute("data-field"), Number(input.value)]),
    ));

    await page.locator("#advanced-views summary").click();
    await page.locator("#view-flat").click();
    const faces = [];
    for (const [kind, buttonId] of [["FRONT_FLAT", "technical-flat-front"], ["BACK_FLAT", "technical-flat-back"]]) {
      await page.locator(`#${buttonId}`).click();
      await page.waitForSelector('[data-technical-flat-issues]', { timeout: 5000 });
      await page.waitForTimeout(80);
      const evidence = await page.evaluate(({ kind }) => {
        const guidance = document.querySelector("[data-technical-flat-issues]");
        const svg = document.querySelector("[data-technical-flat-svg] svg");
        const statuses = [...document.querySelectorAll('[role="status"]')].map((status) => status.textContent ?? "");
        return {
          kind,
          guidance: guidance?.innerText ?? "",
          statuses,
          svgCount: document.querySelectorAll("[data-technical-flat-svg] svg").length,
          issueCount: guidance?.querySelectorAll("li").length ?? 0,
          guidanceText: guidance?.innerText ?? "",
        };
      }, { kind });
      const expectedBlocker = Object.keys(testCase.measurements).length === 0
        ? "COLORWAY_CONTOUR_UNCLOSED" : "does not provide a length-compatible rigid placement";
      if (evidence.svgCount !== 0 || evidence.issueCount === 0 || !evidence.guidanceText.includes(expectedBlocker)
        || !evidence.statuses.some((status) => status.includes("Technical flat withheld"))) {
        throw new Error(`${testCase.caseId} ${kind} did not preserve the complete actionable hold: ${JSON.stringify(evidence)}`);
      }
      await page.screenshot({ path: join(output, `${testCase.caseId}-${kind.toLowerCase()}.png`), fullPage: true });
      faces.push(evidence);
    }
    records.push({ caseId: testCase.caseId, measurements, faces });
    await page.close();
  }
} finally {
  await browser.close();
}

const result = { generatedAt: new Date().toISOString(), browser: "Playwright Chromium production preview through the live app UI",
  url: baseUrl, viewport: { width: 1440, height: 2600 }, cases: records, browserErrors };
await writeFile(join(output, "matrix.json"), `${JSON.stringify(result, null, 2)}\n`);
if (browserErrors.length) throw new Error(`Browser emitted ${browserErrors.length} console/page/request errors.`);
console.log(JSON.stringify({ cases: records.length, faceRequests: records.length * 2, browserErrors: browserErrors.length, output }, null, 2));
