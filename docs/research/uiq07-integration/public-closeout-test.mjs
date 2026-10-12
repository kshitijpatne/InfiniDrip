import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const evidenceDir = resolve(here, "evidence");
const reportPath = resolve(evidenceDir, "S756-public-verification.json");
const deployments = [
  { name: "stable", url: "https://infinidrip-preview.pages.dev" },
  { name: "immutable", url: "https://9269df8c.infinidrip-preview.pages.dev" },
];
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const deployment of deployments) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const pageErrors = [];
    const consoleErrors = [];
    const externalRequests = [];
    const baseOrigin = new URL(deployment.url).origin;
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== baseOrigin) externalRequests.push(request.url());
    });

    const response = await page.goto(deployment.url, { waitUntil: "networkidle", timeout: 60_000 });
    const welcome = await page.evaluate(() => ({
      title: document.title,
      h1Count: document.querySelectorAll("#infini-shell h1").length,
      entryVisible: Boolean(document.querySelector(".uiq-entry")),
      wordmarkTag: document.querySelector(".uiq-entry__wordmark")?.tagName ?? null,
      tutorialTitle: document.querySelector("#tutorial-title")?.textContent?.trim() ?? null,
      physicalFitCaveat: document.querySelector("#tutorial-panel")?.textContent
        ?.includes("Nothing has been sewn or fit-tested") ?? false,
      startLabel: document.querySelector("#welcome-start")?.textContent?.trim() ?? null,
      skipLabel: document.querySelector("#welcome-skip")?.textContent?.trim() ?? null,
      documentOverflow: document.documentElement.scrollWidth > window.innerWidth,
    }));

    const screenshot = `S756-public-${deployment.name}.png`;
    await page.screenshot({ path: resolve(evidenceDir, screenshot), fullPage: true });
    await page.locator("#welcome-start").click();
    const startActionWorks = await page.locator("#tutorial-title").textContent()
      .then((value) => value?.includes("Choose what to design") ?? false);
    const welcomeVisualExitsOnStart = await page.locator(".uiq-entry").count() === 0;
    results.push({
      deployment: deployment.name,
      url: deployment.url,
      httpStatus: response?.status() ?? null,
      ...welcome,
      startActionWorks,
      welcomeVisualExitsOnStart,
      screenshot,
      externalRequests,
      pageErrors,
      consoleErrors,
    });
    await page.close();
  }
} finally {
  await browser.close();
}

const report = {
  slice: 756,
  verifiedAtUtc: new Date().toISOString(),
  status: "passed",
  pullRequest: "https://github.com/kshitijpatne/InfiniDrip/pull/36",
  mergeCommit: "8282ad4c687d4daa033a61c66e8ba43c63481acf",
  workflow: {
    runId: 38259487661,
    url: "https://github.com/kshitijpatne/InfiniDrip/actions/runs/38259487661",
    conclusion: "success",
  },
  deployments: results,
};

const failed = results.some((result) => result.httpStatus !== 200
  || result.title !== "InfiniDrip"
  || result.h1Count !== 1
  || !result.entryVisible
  || result.wordmarkTag !== "H2"
  || result.tutorialTitle !== "Welcome"
  || !result.physicalFitCaveat
  || result.startLabel !== "Start the tour"
  || result.skipLabel !== "Skip for now"
  || result.documentOverflow
  || !result.startActionWorks
  || !result.welcomeVisualExitsOnStart
  || result.externalRequests.length > 0
  || result.pageErrors.length > 0
  || result.consoleErrors.length > 0);
report.status = failed ? "failed" : "passed";
await mkdir(evidenceDir, { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (failed) process.exitCode = 1;
