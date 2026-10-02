import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = new URL("../S356-woven-chord-reflection/candidate-svg/", import.meta.url);
const output = new URL("./", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("../S356-woven-chord-reflection/candidate-matrix.json", import.meta.url), "utf8"));
const sourceMatrix = JSON.parse(await readFile(new URL("../S348-woven-role-token/production-replay/matrix.json", import.meta.url), "utf8"));
const configurationById = new Map(sourceMatrix.cases.map((testCase) => [testCase.caseId, testCase]));
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
const records = [];
const reviewInputs = [];

for (const row of manifest.rows) {
    const name = row.candidateSvg.split("/").at(-1);
    const svg = await readFile(new URL(name, root), "utf8");
    const config = configurationById.get(row.caseId);
    if (!config) throw new Error(`Missing exact configuration ${row.caseId} in S348 production replay`);
    if (svg.match(/data-revision-id="([^"]+)"/)?.[1] !== row.revisionId) throw new Error(`Revision mismatch for ${row.caseId}:${row.face}`);
    const face = row.face;
    const testCase = row;
    const tags = [...svg.matchAll(/<path\b[^>]*>/g)].map(([tag]) => attributes(tag));
    const roles = Object.fromEntries(["outerStand", "innerStand", "upperCollar", "underCollar"].map((role) => {
      const paths = tags.filter((tag) => tag["data-entity-id"]?.includes(`:component:${role}:outline`));
      return [role, paths.map(({ "data-entity-id": entityId, "data-source-id": sourceId, d, fill, stroke, "data-layer": layer }) => ({ entityId, sourceId, d, fill, stroke, layer }))];
    }));
    const pathD = (role) => roles[role].map((path) => path.d);
    const record = {
      caseId: testCase.caseId, options: config.options, face, revisionId: svg.match(/data-revision-id="([^"]+)"/)?.[1] ?? null,
      layerOrder: [...svg.matchAll(/<g\b[^>]*data-layer-group="([^"]+)"/g)].map((match) => match[1]),
      rolePathCounts: Object.fromEntries(Object.entries(roles).map(([role, paths]) => [role, paths.length])),
      upperUnderPathIdentity: JSON.stringify(pathD("upperCollar")) === JSON.stringify(pathD("underCollar")),
      roles,
    };
    records.push(record);
    if (testCase.caseId === "woven-shirt-default" || ["woven-shirt-standHeight-min", "woven-shirt-standHeight-max", "woven-shirt-collarLeafDepth-min", "woven-shirt-collarLeafDepth-max", "woven-shirt-yokeDepth-min", "woven-shirt-yokeDepth-max"].includes(testCase.caseId)) {
      reviewInputs.push({ record, svg });
    }
}

const matrix = {
  generatedAt: new Date().toISOString(),
  inputEvidence: "S356 production Chromium output replay; production code unchanged since that replay through S357",
  configurations: new Set(manifest.rows.map((row) => row.caseId)).size,
  faces: records.length,
  revisions: [...new Set(records.map((record) => record.revisionId))],
  identicalUpperUnderPaths: records.filter((record) => record.upperUnderPathIdentity).length,
  records,
};
await writeFile(new URL("collar-output-matrix.json", output), `${JSON.stringify(matrix, null, 2)}\n`);

const browser = await chromium.launch({ headless: true });
try {
  for (const { record, svg } of reviewInputs) {
    const tagged = svg.replace("</svg>", `<g data-s358-source-roles="true" fill="none" stroke-width="0.16" stroke-dasharray="0.38 0.16" pointer-events="none">${Object.entries({ outerStand: "#dc2626", upperCollar: "#2563eb", underCollar: "#16a34a", innerStand: "#f59e0b" }).flatMap(([role, color]) => record.roles[role].map((path) => `<path data-s358-role="${role}" d="${path.d}" stroke="${color}"/>`)).join("")}</g></svg>`);
    const stem = `${record.caseId}-${record.face.toLowerCase()}-collar-overlay`;
    await writeFile(new URL(`${stem}.svg`, output), tagged);
    const page = await browser.newPage({ viewport: { width: 1100, height: 850 }, deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0;background:#fff">${tagged}</body></html>`);
    const bounds = await page.locator("svg").evaluate((svg) => {
      const nodes = [...svg.querySelectorAll('[data-s358-role]')];
      const box = nodes.reduce((acc, node) => {
        const b = node.getBBox();
        return { minX: Math.min(acc.minX, b.x), minY: Math.min(acc.minY, b.y), maxX: Math.max(acc.maxX, b.x + b.width), maxY: Math.max(acc.maxY, b.y + b.height) };
      }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
      return box;
    });
    const margin = 5;
    const crop = [bounds.minX - margin, bounds.minY - margin, bounds.maxX - bounds.minX + margin * 2, bounds.maxY - bounds.minY + margin * 2];
    const cropped = tagged.replace(/viewBox="[^"]+"/, `viewBox="${crop.join(" ")}"`).replace(/width="[^"]+"/, 'width="1100px"').replace(/height="[^"]+"/, 'height="850px"');
    await writeFile(new URL(`${stem}-crop.svg`, output), cropped);
    await page.setContent(`<html><body style="margin:0;background:#fff">${cropped}</body></html>`);
    await page.locator("svg").screenshot({ path: fileURLToPath(new URL(`${stem}-crop.png`, output)) });
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify({ configurations: matrix.configurations, faces: matrix.faces, revisions: matrix.revisions, upperUnderIdenticalFaces: matrix.identicalUpperUnderPaths, reviewedOutputs: reviewInputs.map(({ record }) => `${record.caseId}:${record.face}`) }, null, 2));
