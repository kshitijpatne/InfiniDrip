import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const folder = dirname(fileURLToPath(import.meta.url));
const output = join(folder, "production-replay");
const baseUrl = process.env.G04_PREVIEW_URL ?? "http://127.0.0.1:4178/";
await mkdir(output, { recursive: true });
const baseline = JSON.parse(await readFile(new URL("../S330-integrated-browser/matrix.json", import.meta.url), "utf8"));
const configurations = baseline.cases.filter((item) => item.recipeId === "woven-shirt");
const browserErrors = [];
const records = [];
const browser = await chromium.launch({ headless: true });

try {
  for (const testCase of configurations) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 2600 }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(60000);
    page.on("pageerror", (error) => browserErrors.push({ caseId: testCase.caseId, message: error.message }));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push({ caseId: testCase.caseId, message: message.text() });
    });
    page.on("requestfailed", (request) => browserErrors.push({ caseId: testCase.caseId,
      message: request.failure()?.errorText, url: request.url() }));
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(250);
    const skip = page.getByRole("button", { name: /Skip for now/ });
    if (await skip.count()) await skip.click();
    await page.locator("#garment-woven-shirt").click();
    await page.locator("#journey-next").click();
    await page.waitForFunction(() => document.querySelector("#infini-shell")?.getAttribute("data-stage") === "measure");
    await page.locator("#journey-next").click();
    await page.waitForFunction(() => document.querySelector("#infini-shell")?.getAttribute("data-stage") === "fit");
    for (const [field, value] of Object.entries(testCase.options)) {
      const input = page.locator(`#input-option-${field}`);
      const pageIndex = await input.evaluate((element) => element.closest("[data-control-page]")?.getAttribute("data-control-page") ?? null);
      const pageOptions = await page.locator("#control-page-select option").evaluateAll((options) => options.map((option) => option.value));
      if (pageIndex === null || !pageOptions.includes(pageIndex)) throw new Error(`${testCase.caseId}.${field}: option page missing`);
      await page.locator("#control-page-select").selectOption({ value: pageIndex });
      await input.fill(String(value));
      await input.dispatchEvent("change");
    }
    await page.locator("#journey-next").click();
    await page.locator("#advanced-views summary").click();
    await page.locator("#view-flat").click();
    const faces = [];
    for (const [kind, buttonId] of [["FRONT_FLAT", "technical-flat-front"], ["BACK_FLAT", "technical-flat-back"]]) {
      await page.locator(`#${buttonId}`).click();
      await page.waitForSelector("[data-technical-flat-issues], [data-technical-flat-svg]");
      await page.waitForTimeout(80);
      const result = await page.evaluate((faceKind) => {
        const guidance = document.querySelector("[data-technical-flat-issues]");
        const svg = document.querySelector("[data-technical-flat-svg] svg");
        return { kind: faceKind, svgCount: document.querySelectorAll("[data-technical-flat-svg] svg").length,
          issueCount: guidance?.querySelectorAll("li").length ?? 0, guidance: guidance?.innerText ?? "",
          statuses: [...document.querySelectorAll('[role="status"]')].map((node) => node.textContent ?? ""),
          svg: svg?.outerHTML ?? null, recipeId: svg?.getAttribute("data-recipe-id") ?? null,
          revisionId: svg?.getAttribute("data-revision-id") ?? null,
          layerOrder: svg ? [...svg.querySelectorAll("[data-layer-group]")].map((node) => node.getAttribute("data-layer-group")) : [] };
      }, kind);
      if (result.svgCount === 0 && (!result.issueCount || !result.guidance.trim()
        || !result.statuses.some((status) => status.includes("Technical flat withheld")))) {
        throw new Error(`${testCase.caseId} ${kind}: withheld without actionable evidence`);
      }
      if (result.svgCount > 0 && (result.recipeId !== "woven-shirt" || !result.revisionId)) {
        throw new Error(`${testCase.caseId} ${kind}: invalid emitted SVG`);
      }
      const stem = `${testCase.caseId}-${kind.toLowerCase()}`;
      await writeFile(join(output, `${stem}.json`), JSON.stringify(result, null, 2));
      await page.screenshot({ path: join(output, `${stem}.png`), fullPage: true });
      const { svg, ...summary } = result;
      if (svg) await writeFile(join(output, `${stem}.svg`), svg);
      faces.push(summary);
    }
    records.push({ caseId: testCase.caseId, options: testCase.options, faces });
    await page.close();
  }
} finally {
  await browser.close();
}

const matrix = { generatedAt: new Date().toISOString(), browser: "Playwright Chromium production preview through live app UI",
  url: baseUrl, configurations: records.length, faceRequests: records.length * 2, browserErrors, cases: records };
await writeFile(join(output, "matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`);
const allFaces = records.flatMap((record) => record.faces);
const summary = { configurations: records.length, faceRequests: allFaces.length,
  svgFaces: allFaces.filter((face) => face.svgCount > 0).length,
  heldFaces: allFaces.filter((face) => face.svgCount === 0).length,
  browserErrors: browserErrors.length,
  collarResidualMentions: allFaces.filter((face) => face.guidance.includes("Outer stand")
    && face.guidance.includes("woven neckline")).length, output };
console.log(JSON.stringify(summary, null, 2));
if (browserErrors.length) throw new Error(`Browser errors: ${browserErrors.length}`);
