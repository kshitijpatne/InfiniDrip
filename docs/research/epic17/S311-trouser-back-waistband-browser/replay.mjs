import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = process.env.G04_PREVIEW_URL ?? "http://127.0.0.1:4173/";
const output = fileURLToPath(new URL("./", import.meta.url));
const inputMatrixUrl = new URL("../S309-trouser-back-rise-browser/matrix.json", import.meta.url);
const inputMatrix = JSON.parse(await readFile(inputMatrixUrl, "utf8"));
await mkdir(output, { recursive: true });

const browserErrors = [];
const browser = await chromium.launch({ headless: true });
let page;
const openFreshPage = async () => {
  page = await browser.newPage({ viewport: { width: 1440, height: 3000 }, deviceScaleFactor: 1 });
  page.on("pageerror", (error) => browserErrors.push({ kind: "pageerror", message: error.message }));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push({ kind: "console", message: message.text() });
  });
  page.on("requestfailed", (request) => browserErrors.push({ kind: "requestfailed", url: request.url(), error: request.failure()?.errorText }));
};

const records = [];
try {
  let activeGroup = 1;
  const optionGroups = [
    [],
    ["frontRiseEase", "backRiseEase", "waistbandDepth"],
    ["thighEase", "kneeEase", "legOpening"],
    ["flyLength"],
    ["pocketOpening", "pocketAngle", "pocketBagDepth", "pocketDrop"],
  ];

  const moveToGroup = async (targetGroup) => {
    while (activeGroup !== targetGroup) {
      const direction = activeGroup < targetGroup ? 1 : -1;
      const label = direction === 1 ? "Next measurement group" : "Previous measurement group";
      await page.getByRole("button", { name: label }).click();
      activeGroup += direction;
    }
  };
  const setOption = async (optionId, value) => {
    const input = page.locator(`#input-option-${optionId}`);
    const current = Number(await input.inputValue());
    const step = Number(await input.getAttribute("step"));
    const increments = Math.round(Math.abs(value - current) / step);
    const direction = value >= current ? "1" : "-1";
    const control = page.locator(`button[data-step-target="option-${optionId}"][data-step-direction="${direction}"]`);
    for (let index = 0; index < increments; index += 1) await control.click();
    const actual = Number(await input.inputValue());
    if (Math.abs(actual - value) > 1e-8) throw new Error(`${optionId}: requested ${value}, got ${actual}`);
  };

  const initialize = async () => {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    const skipTour = page.getByRole("button", { name: /Skip for now/ });
    if (await skipTour.count()) await skipTour.click();
    await page.locator("#garment-trouser").click();
    await page.locator("#journey-next").click();
    await page.locator("#journey-next").click();
    await page.locator("#advanced-views summary").click();
    await page.locator("#view-flat").click();
    activeGroup = 1;
  };

  const cases = inputMatrix.cases;
  await openFreshPage();
  await initialize();
  for (const testCase of cases) {
    for (let group = 2; group <= 5; group += 1) {
      await moveToGroup(group);
      for (const optionId of optionGroups[group - 1]) await setOption(optionId, testCase.options[optionId]);
    }
    await page.waitForTimeout(250);

    await page.locator("#technical-flat-front").click();
    await page.waitForFunction(() => document.querySelector("#technical-flat-front")?.getAttribute("aria-pressed") === "true", { timeout: 3000 })
      .catch(async () => { throw new Error(`${testCase.caseId}: front toggle did not select Front (front=${await page.locator("#technical-flat-front").getAttribute("aria-pressed")}, back=${await page.locator("#technical-flat-back").getAttribute("aria-pressed")})`); });
    await page.waitForTimeout(120);
    const front = await page.evaluate(() => ({
      svg: document.querySelector("[data-technical-flat-svg] svg")?.outerHTML ?? null,
      kind: document.querySelector("[data-technical-flat-svg] svg")?.getAttribute("data-view-kind") ?? null,
      issues: document.querySelector("[data-technical-flat-issues]")?.innerText ?? "",
      optionValues: [...document.querySelectorAll("input[data-option]")].map((input) => [input.getAttribute("data-option"), input.value]),
    }));
    await page.locator("#technical-flat-back").click();
    await page.waitForSelector("[data-technical-flat-svg] svg", { timeout: 5000 });
    await page.waitForTimeout(80);
    const back = await page.evaluate(() => {
      const svg = document.querySelector("[data-technical-flat-svg] svg");
      if (!(svg instanceof SVGSVGElement)) return null;
      const callouts = [...svg.querySelectorAll("[data-callout-target]")].map((group) => ({
        id: group.getAttribute("data-entity-id"),
        sourceId: group.getAttribute("data-source-id"),
        revisionId: group.getAttribute("data-revision-id"),
        target: group.getAttribute("data-callout-target"),
        leader: group.querySelector("path")?.getAttribute("d") ?? "",
        marker: group.querySelector("circle")?.outerHTML ?? "",
      }));
      const labels = [...svg.querySelectorAll("g[data-layer-group='TEXT_LABELS'] text")].map((text) => ({
        id: text.getAttribute("data-entity-id"),
        sourceId: text.getAttribute("data-source-id"),
        revisionId: text.getAttribute("data-revision-id"),
        text: text.textContent ?? "",
        bounds: (() => {
          const box = text.getBBox();
          return { x: box.x, y: box.y, width: box.width, height: box.height };
        })(),
      }));
      const waistbandMark = svg.querySelector("[data-entity-id='live-flat:trouser:BACK_FLAT:waistband:mark:centerBack']");
      const backRiseOutline = svg.querySelector("[data-entity-id='flat:trouser:BACK_FLAT:component:backLeft:outline']");
      const paper = svg.querySelector("[data-technical-flat-paper='true']");
      const paperBounds = paper ? {
        x: Number(paper.getAttribute("x")), y: Number(paper.getAttribute("y")),
        width: Number(paper.getAttribute("width")), height: Number(paper.getAttribute("height")),
      } : null;
      const sourcePoint = waistbandMark?.querySelector("circle");
      const sourcePointCenter = sourcePoint ? new DOMPoint(
        Number(sourcePoint.getAttribute("cx")), Number(sourcePoint.getAttribute("cy")),
      ).matrixTransform(sourcePoint.getCTM()) : null;
      const depthMarker = [...svg.querySelectorAll("g[data-callout-target]")]
        .find((group) => group.getAttribute("data-source-id") === "pom:trouser:waistband-depth-finished")
        ?.querySelector("circle");
      const depthMarkerCenter = depthMarker ? new DOMPoint(
        Number(depthMarker.getAttribute("cx")), Number(depthMarker.getAttribute("cy")),
      ).matrixTransform(depthMarker.getCTM()) : null;
      const pomLabelBounds = labels.filter((label) => label.sourceId?.startsWith("pom:trouser:"))
        .map((label) => ({ id: label.sourceId, ...label.bounds }));
      const labelsInsidePaper = Boolean(paperBounds) && pomLabelBounds.length === 2 && pomLabelBounds.every((box) =>
        box.x >= paperBounds.x - 1e-6 && box.y >= paperBounds.y - 1e-6
        && box.x + box.width <= paperBounds.x + paperBounds.width + 1e-6
        && box.y + box.height <= paperBounds.y + paperBounds.height + 1e-6);
      const pomLabelsDoNotOverlap = pomLabelBounds.length === 2 && (
        pomLabelBounds[0].x + pomLabelBounds[0].width <= pomLabelBounds[1].x
        || pomLabelBounds[1].x + pomLabelBounds[1].width <= pomLabelBounds[0].x
        || pomLabelBounds[0].y + pomLabelBounds[0].height <= pomLabelBounds[1].y
        || pomLabelBounds[1].y + pomLabelBounds[1].height <= pomLabelBounds[0].y
      );
      const depthMarkerMatchesSourcePoint = Boolean(sourcePointCenter && depthMarkerCenter)
        && Math.hypot(sourcePointCenter.x - depthMarkerCenter.x, sourcePointCenter.y - depthMarkerCenter.y) <= 1e-6;
      return {
        markup: svg.outerHTML,
        recipeId: svg.getAttribute("data-recipe-id"),
        kind: svg.getAttribute("data-view-kind"),
        revisionId: svg.getAttribute("data-revision-id"),
        sourceRevisionMismatch: [...svg.querySelectorAll("[data-revision-id]")]
          .some((node) => node.getAttribute("data-revision-id") !== svg.getAttribute("data-revision-id")),
        callouts,
        labels,
        layoutChecks: {
          labelsInsidePaper,
          pomLabelsDoNotOverlap,
          depthMarkerMatchesSourcePoint,
          pomLabelBounds,
          paperBounds,
          sourcePointCenter: sourcePointCenter && { x: sourcePointCenter.x, y: sourcePointCenter.y },
          depthMarkerCenter: depthMarkerCenter && { x: depthMarkerCenter.x, y: depthMarkerCenter.y },
        },
        waistbandMark: waistbandMark?.outerHTML ?? null,
        backRiseOutline: backRiseOutline?.outerHTML ?? null,
        renderedIssue: document.querySelector("[data-technical-flat-issues]")?.innerText ?? "",
      };
    });

    if (!front.issues.includes("view:trouser:waistband:center-front") || front.svg !== null) {
      throw new Error(`${testCase.caseId}: front did not remain fully withheld: ${JSON.stringify({
        issues: front.issues, svg: Boolean(front.svg), kind: front.kind, optionValues: front.optionValues,
      })}`);
    }
    if (!back || back.recipeId !== "trouser" || back.kind !== "BACK_FLAT" || back.sourceRevisionMismatch
      || back.renderedIssue || !back.waistbandMark || !back.backRiseOutline) {
      throw new Error(`${testCase.caseId}: accepted back metadata/renderer issue is invalid: ${JSON.stringify(back && {
        recipeId: back.recipeId, kind: back.kind, sourceRevisionMismatch: back.sourceRevisionMismatch,
        renderedIssue: back.renderedIssue, waistbandMark: Boolean(back.waistbandMark), backRiseOutline: Boolean(back.backRiseOutline),
      })}`);
    }
    const pomCallouts = back.callouts.filter((item) => item.sourceId?.startsWith("pom:trouser:"));
    if (pomCallouts.length !== 2
      || !pomCallouts.some((item) => item.sourceId === "pom:trouser:back-rise-finished-incl-waistband"
        && item.target === "flat:trouser:BACK_FLAT:component:backLeft:outline"
        && item.revisionId === back.revisionId)
      || !pomCallouts.some((item) => item.sourceId === "pom:trouser:waistband-depth-finished"
        && item.target === "live-flat:trouser:BACK_FLAT:waistband:mark:centerBack"
        && item.revisionId === back.revisionId)) {
      throw new Error(`${testCase.caseId}: expected two exact same-revision POM targets; got ${JSON.stringify(pomCallouts)}`);
    }
    const depthCallout = pomCallouts.find((item) => item.sourceId === "pom:trouser:waistband-depth-finished");
    const depthLabel = back.labels.find((item) => item.sourceId === "pom:trouser:waistband-depth-finished");
    if (!depthCallout?.leader.startsWith("M") || !depthCallout.marker || !depthLabel
      || !back.layoutChecks.labelsInsidePaper || !back.layoutChecks.pomLabelsDoNotOverlap
      || !back.layoutChecks.depthMarkerMatchesSourcePoint) {
      throw new Error(`${testCase.caseId}: waistband-depth leader/marker/label was not rendered.`);
    }
    const selectedVisual = testCase.caseId === "trouser-default"
      || testCase.caseId === "trouser-waistbandDepth-min"
      || testCase.caseId === "trouser-waistbandDepth-max"
      || testCase.caseId === "trouser-legOpening-max";
    await writeFile(join(output, `${testCase.caseId}-back.svg`), back.markup);
    if (selectedVisual) {
      await page.screenshot({ path: join(output, `${testCase.caseId}-back.png`), fullPage: true });
      if (testCase.caseId === "trouser-default") {
        await page.locator("#technical-flat-front").click();
        await page.waitForTimeout(50);
        await page.screenshot({ path: join(output, "trouser-default-front-held.png"), fullPage: true });
        await page.locator("#technical-flat-back").click();
        await page.waitForSelector("[data-technical-flat-svg] svg");
      }
    }
    records.push({
      caseId: testCase.caseId,
      optionValues: testCase.optionValues,
      front: { withheld: true, issue: front.issues.split("\n")[0] },
      back: { accepted: true, revisionId: back.revisionId, callouts: pomCallouts,
        labels: back.labels.filter((label) => label.sourceId?.startsWith("pom:trouser:")), layoutChecks: back.layoutChecks },
    });
    if (testCase !== cases.at(-1)) {
      await page.close();
      await openFreshPage();
      await initialize();
    }
  }
} finally {
  await browser.close();
}

const result = {
  generatedAt: new Date().toISOString(),
  browser: "Playwright Chromium against the production Vite preview through the live app UI",
  url: baseUrl,
  viewport: { width: 1440, height: 3000 },
  sourceCaseMatrix: "../S309-trouser-back-rise-browser/matrix.json",
  testedFaceRequests: records.length * 2,
  acceptedBacks: records.filter((record) => record.back.accepted).length,
  heldFronts: records.filter((record) => record.front.withheld).length,
  browserErrors,
  cases: records,
};
await writeFile(join(output, "matrix.json"), `${JSON.stringify(result, null, 2)}\n`);
if (browserErrors.length) throw new Error(`Browser emitted ${browserErrors.length} console/page/request errors.`);
console.log(JSON.stringify({ testedFaceRequests: result.testedFaceRequests, acceptedBacks: result.acceptedBacks,
  heldFronts: result.heldFronts, browserErrors: browserErrors.length, output }, null, 2));
