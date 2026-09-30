import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = process.env.G04_PREVIEW_URL ?? "http://127.0.0.1:4175/";
const output = fileURLToPath(new URL("./", import.meta.url));
await mkdir(output, { recursive: true });

const configurations = [
  { caseId: "tank-default", measurements: {} },
  { caseId: "tank-measurement-variant", measurements: { chest: 92, shoulderWidth: 39, length: 66, armholeDepth: 21, strapWidth: 9, neckDrop: 8, neckWidthEase: 2 } },
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
    await page.locator("#garment-tank").click();
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
    const values = await page.evaluate(() => Object.fromEntries(
      [...document.querySelectorAll("#controls-panel input[data-field]")]
        .map((input) => [input.getAttribute("data-field"), Number(input.value)]),
    ));

    await page.locator("#advanced-views summary").click();
    await page.locator("#view-flat").click();
    const faces = [];
    for (const [kind, buttonId, roleId] of [
      ["FRONT_FLAT", "technical-flat-front", "front"],
      ["BACK_FLAT", "technical-flat-back", "back"],
    ]) {
      await page.locator(`#${buttonId}`).click();
      await page.waitForSelector("[data-technical-flat-svg] svg", { timeout: 5000 });
      await page.waitForTimeout(80);
      const evidence = await page.evaluate(({ kind, roleId }) => {
        const svg = document.querySelector("[data-technical-flat-svg] svg");
        if (!(svg instanceof SVGSVGElement)) return null;
        const revisionId = svg.getAttribute("data-revision-id");
        const callouts = [...svg.querySelectorAll("g[data-callout-target]")]
          .filter((group) => group.getAttribute("data-source-id")?.startsWith("pom:tank:"))
          .map((group) => {
            const marker = group.querySelector("circle");
            const targetId = group.getAttribute("data-callout-target");
            const target = svg.querySelector(`[data-entity-id='${CSS.escape(targetId ?? "")}']`);
            const targetNumbers = target?.getAttribute("d")?.match(/-?(?:\d+\.?\d*|\.\d+)/g)?.map(Number) ?? [];
            const markerX = Number(marker?.getAttribute("cx"));
            const markerY = Number(marker?.getAttribute("cy"));
            const targetHasMarkerVertex = targetNumbers.some((_, index) => index % 2 === 0
              && targetNumbers[index] === markerX && targetNumbers[index + 1] === markerY);
            return {
              sourceId: group.getAttribute("data-source-id"),
              target: targetId,
              revisionId: group.getAttribute("data-revision-id"),
              marker: marker && { x: markerX, y: markerY },
              targetHasMarkerVertex,
              leader: group.querySelector("path")?.getAttribute("d") ?? "",
            };
          });
        const pomLabels = [...svg.querySelectorAll("g[data-layer-group='TEXT_LABELS'] text")]
          .filter((text) => text.getAttribute("data-source-id")?.startsWith("pom:tank:"))
          .map((text) => {
            const box = text.getBBox();
            return { sourceId: text.getAttribute("data-source-id"), revisionId: text.getAttribute("data-revision-id"),
              text: text.textContent ?? "", bounds: { x: box.x, y: box.y, width: box.width, height: box.height } };
          });
        const paper = svg.querySelector("[data-technical-flat-paper='true']");
        const paperBounds = paper && { x: Number(paper.getAttribute("x")), y: Number(paper.getAttribute("y")),
          width: Number(paper.getAttribute("width")), height: Number(paper.getAttribute("height")) };
        const expectedPomCount = kind === "FRONT_FLAT" ? 5 : 4;
        const labelsInsidePaper = Boolean(paperBounds) && pomLabels.length === expectedPomCount && pomLabels.every((box) =>
          box.bounds.x >= paperBounds.x - 1e-6 && box.bounds.y >= paperBounds.y - 1e-6
          && box.bounds.x + box.bounds.width <= paperBounds.x + paperBounds.width + 1e-6
          && box.bounds.y + box.bounds.height <= paperBounds.y + paperBounds.height + 1e-6);
        const labelsDoNotOverlap = pomLabels.length === expectedPomCount && pomLabels.every((left, index) =>
          pomLabels.slice(index + 1).every((right) => left.bounds.x + left.bounds.width <= right.bounds.x
            || right.bounds.x + right.bounds.width <= left.bounds.x
            || left.bounds.y + left.bounds.height <= right.bounds.y
            || right.bounds.y + right.bounds.height <= left.bounds.y));
        return {
          markup: svg.outerHTML,
          recipeId: svg.getAttribute("data-recipe-id"),
          kind: svg.getAttribute("data-view-kind"),
          revisionId,
          mixedRevisions: [...svg.querySelectorAll("[data-revision-id]")]
            .some((node) => node.getAttribute("data-revision-id") !== revisionId),
          roleOutlineId: `flat:tank:${kind}:component:${roleId}:outline`,
          callouts,
          pomLabels,
          labelsInsidePaper,
          labelsDoNotOverlap,
          renderedIssues: document.querySelector("[data-technical-flat-issues]")?.innerText ?? "",
        };
      }, { kind, roleId });

      const expectedTarget = `flat:tank:${kind}:component:${roleId}:outline`;
      const expectedSources = kind === "FRONT_FLAT"
        ? ["pom:tank:body-chest-finished", "pom:tank:body-length-hps-hem", "pom:tank:across-shoulder", "pom:tank:neck-width", "pom:tank:front-neck-drop"]
        : ["pom:tank:body-chest-finished", "pom:tank:body-length-hps-hem", "pom:tank:across-shoulder", "pom:tank:neck-width"];
      if (!evidence || evidence.recipeId !== "tank" || evidence.kind !== kind || evidence.mixedRevisions
        || evidence.renderedIssues || evidence.callouts.length !== expectedSources.length || evidence.pomLabels.length !== expectedSources.length
        || !evidence.labelsInsidePaper || !evidence.labelsDoNotOverlap
        || evidence.callouts.some((callout) => callout.target !== expectedTarget
          || callout.revisionId !== evidence.revisionId || !callout.targetHasMarkerVertex || !callout.leader.startsWith("M"))
        || expectedSources.some((sourceId) => !evidence.callouts.some((callout) => callout.sourceId === sourceId))) {
        throw new Error(`${testCase.caseId} ${kind} failed source/revision/layout checks: ${JSON.stringify(evidence && {
          recipeId: evidence.recipeId, kind: evidence.kind, mixedRevisions: evidence.mixedRevisions,
          renderedIssues: evidence.renderedIssues, callouts: evidence.callouts, pomLabels: evidence.pomLabels,
          labelsInsidePaper: evidence.labelsInsidePaper, labelsDoNotOverlap: evidence.labelsDoNotOverlap,
        })}`);
      }
      await writeFile(join(output, `${testCase.caseId}-${kind.toLowerCase()}.svg`), evidence.markup);
      if (testCase.caseId === "tank-default") {
        await page.screenshot({ path: join(output, `${kind.toLowerCase()}.png`), fullPage: true });
      }
      faces.push({ kind, revisionId: evidence.revisionId, callouts: evidence.callouts,
        labels: evidence.pomLabels, labelsInsidePaper: evidence.labelsInsidePaper,
        labelsDoNotOverlap: evidence.labelsDoNotOverlap });
    }
    if (faces[0].revisionId !== faces[1].revisionId) throw new Error(`${testCase.caseId}: front/back revisions differ.`);
    records.push({ caseId: testCase.caseId, measurements: values, faces });
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
