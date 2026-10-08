import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const JSDOM = require("jsdom").JSDOM;
const folder = new URL("./production-replay/", import.meta.url);
const names = (await readdir(folder)).filter((name) => name.endsWith(".svg.json") && !name.includes("failure"));
const issues = [];
for (const name of names) {
  const result = JSON.parse(await readFile(new URL(name, folder), "utf8"));
  if (!result.svg) continue;
  const document = new JSDOM(result.svg, { contentType: "image/svg+xml" }).window.document;
  const svg = document.documentElement;
  for (const callout of svg.querySelectorAll("[data-callout-target]")) {
    const target = callout.getAttribute("data-callout-target");
    const targets = target.split("|").map((value) => value.trim()).filter(Boolean);
    const entityIds = new Set([...svg.querySelectorAll("[data-entity-id]")].filter((node) => node !== callout)
      .map((node) => node.getAttribute("data-entity-id")));
    const missingTargets = targets.filter((id) => !entityIds.has(id));
    if (targets.length && !missingTargets.length) continue;
    issues.push({ file: name, recipeId: result.recipeId, kind: result.kind, sourceId: callout.getAttribute("data-source-id"),
      calloutId: callout.getAttribute("data-entity-id"), target, missingTargets,
      entityIds: [...new Set([...svg.querySelectorAll("[data-entity-id]")].map((node) => node.getAttribute("data-entity-id")))].slice(0, 14),
      sourceIds: [...new Set([...svg.querySelectorAll("[data-source-id]")].map((node) => node.getAttribute("data-source-id")))].filter(Boolean).slice(0, 12) });
  }
}
const summary = { files: names.length, missCount: issues.length,
  byRecipeFace: Object.fromEntries([...new Set(issues.map((issue) => `${issue.recipeId}/${issue.kind}`))]
    .map((key) => [key, issues.filter((issue) => `${issue.recipeId}/${issue.kind}` === key).length])),
  byTarget: Object.fromEntries([...new Set(issues.map((issue) => issue.target))].map((target) => [target, issues.filter((issue) => issue.target === target).length])) };
await writeFile(new URL("S459-callout-target-diagnosis.json", import.meta.url), `${JSON.stringify({ summary, issues }, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
