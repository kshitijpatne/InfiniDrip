import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";

const { JSDOM } = createRequire(import.meta.url)("jsdom");
const source = join(import.meta.dirname, "..", "S362-woven-full-collar", "woven-shirt-default-front.svg");
const svg = await readFile(source, "utf8");
const document = new JSDOM(svg, { contentType: "image/svg+xml" }).window.document;

function pathEndpoints(d) {
  const tokens = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/gu) ?? [];
  const subpaths = [];
  let index = 0;
  let current = null;
  let start = null;
  while (index < tokens.length) {
    const op = tokens[index++];
    if (op === "M") {
      current = { x: Number(tokens[index++]), y: Number(tokens[index++]) };
      start = current;
      subpaths.push({ start: current, end: current });
    } else if (op === "L") {
      current = { x: Number(tokens[index++]), y: Number(tokens[index++]) };
      subpaths.at(-1).end = current;
    } else if (op === "C") {
      index += 4;
      current = { x: Number(tokens[index++]), y: Number(tokens[index++]) };
      subpaths.at(-1).end = current;
    } else if (op === "Z") {
      current = start;
      subpaths.at(-1).closed = true;
      subpaths.at(-1).end = current;
    } else throw new Error(`Unexpected SVG path command ${op}`);
  }
  return subpaths;
}

const roles = ["outerStand", "innerStand", "upperCollar", "underCollar"];
const collars = [];
for (const role of roles) {
  for (const element of document.querySelectorAll(`path[data-entity-id*="component:${role}:outline"]`)) {
    collars.push({ role, id: element.getAttribute("data-entity-id"), revisionId: element.getAttribute("data-revision-id"),
      sourceId: element.getAttribute("data-source-id"), layer: element.getAttribute("data-layer"),
      stroke: element.getAttribute("stroke"), subpaths: pathEndpoints(element.getAttribute("d")) });
  }
}
const callout = [...document.querySelectorAll("g[data-source-id]")]
  .find((element) => element.getAttribute("data-source-id") === "pom:woven-shirt:finished-placket-width");
if (!callout) throw new Error("Finished-placket-width callout missing from S362 default front.");
const leaderPath = [...callout.querySelectorAll("path")].find((element) => element.getAttribute("d")?.startsWith("M"));
const result = { source, revisionId: document.documentElement.getAttribute("data-revision-id"),
  callout: { targetId: callout.getAttribute("data-callout-target"), sourceEntityId: callout.getAttribute("data-callout-source-entity"),
    leaderPath: leaderPath?.getAttribute("d"), leaderSubpaths: leaderPath ? pathEndpoints(leaderPath.getAttribute("d")) : [] }, collars };
const out = join(import.meta.dirname, "collar-endpoint-diagnostic.json");
await writeFile(out, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ revisionId: result.revisionId, target: result.callout.targetId,
  sourceEntity: result.callout.sourceEntityId, leader: result.callout.leaderSubpaths, collars: collars.map(({ role, id, subpaths }) => ({ role, id, subpaths })) }, null, 2));
