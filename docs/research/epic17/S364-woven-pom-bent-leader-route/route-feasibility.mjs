import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const { JSDOM } = createRequire(import.meta.url)("jsdom");
const input = join(import.meta.dirname, "..", "S362-woven-full-collar", "woven-shirt-default-front.svg");
const svg = await readFile(input, "utf8");
const document = new JSDOM(svg, { contentType: "image/svg+xml" }).window.document;
const callout = [...document.querySelectorAll("g[data-source-id]")]
  .find((element) => element.getAttribute("data-source-id") === "pom:woven-shirt:finished-placket-width");
const label = [...document.querySelectorAll("text[data-label-for]")]
  .find((element) => element.getAttribute("data-label-for") === callout?.getAttribute("data-entity-id"));
if (!callout || !label) throw new Error("Expected the same-revision Woven width callout and measured label.");
const leader = callout.querySelector("path")?.getAttribute("d") ?? "";
const startMatch = /^M(-?[\d.]+) (-?[\d.]+)/u.exec(leader);
const anchor = { x: Number(startMatch?.[1]), y: Number(startMatch?.[2]) };
const goal = { x: Number(label.getAttribute("x")), y: Number(label.getAttribute("y")) };

function pathSegments(d) {
  const tokens = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/gu) ?? [];
  const result = [];
  let i = 0, current = null, subpath = null;
  while (i < tokens.length) {
    const op = tokens[i++];
    if (op === "M") { current = { x: +tokens[i++], y: +tokens[i++] }; subpath = current; }
    else if (op === "L") {
      const next = { x: +tokens[i++], y: +tokens[i++] };
      result.push([current, next]); current = next;
    } else if (op === "C") {
      const c1 = { x: +tokens[i++], y: +tokens[i++] }, c2 = { x: +tokens[i++], y: +tokens[i++] };
      const next = { x: +tokens[i++], y: +tokens[i++] };
      let previous = current;
      for (let step = 1; step <= 64; step++) {
        const t = step / 64, u = 1 - t;
        const point = { x: u ** 3 * current.x + 3 * u ** 2 * t * c1.x + 3 * u * t ** 2 * c2.x + t ** 3 * next.x,
          y: u ** 3 * current.y + 3 * u ** 2 * t * c1.y + 3 * u * t ** 2 * c2.y + t ** 3 * next.y };
        result.push([previous, point]); previous = point;
      }
      current = next;
    } else if (op === "Z" && current && subpath) { result.push([current, subpath]); current = subpath; }
    else throw new Error(`Unsupported SVG path command ${op}`);
  }
  return result;
}

const collarPattern = /:component:(?:outerStand|innerStand|upperCollar|underCollar):outline/u;
const obstacles = [...document.querySelectorAll("path[data-entity-id]")]
  .filter((element) => collarPattern.test(element.getAttribute("data-entity-id") ?? ""))
  .flatMap((element) => pathSegments(element.getAttribute("d") ?? "")
    .map((segment) => ({ role: /:component:([^:]+):outline/u.exec(element.getAttribute("data-entity-id") ?? "")?.[1],
      entityId: element.getAttribute("data-entity-id"), segment })));

function pointSegmentDistance(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const den = dx * dx + dy * dy;
  const t = den ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / den)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
function segmentDistance(a, b, c, d) {
  // For straight segments, an intersection has distance zero; otherwise the minimum is attained at an endpoint.
  const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const onSegment = (p, q, r) => Math.min(p.x, q.x) - 1e-9 <= r.x && r.x <= Math.max(p.x, q.x) + 1e-9
    && Math.min(p.y, q.y) - 1e-9 <= r.y && r.y <= Math.max(p.y, q.y) + 1e-9;
  const o1 = cross(a, b, c), o2 = cross(a, b, d), o3 = cross(c, d, a), o4 = cross(c, d, b);
  if (((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) && ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0))) return 0;
  if ((Math.abs(o1) < 1e-9 && onSegment(a, b, c)) || (Math.abs(o2) < 1e-9 && onSegment(a, b, d))
    || (Math.abs(o3) < 1e-9 && onSegment(c, d, a)) || (Math.abs(o4) < 1e-9 && onSegment(c, d, b))) return 0;
  return Math.min(pointSegmentDistance(a, c, d), pointSegmentDistance(b, c, d),
    pointSegmentDistance(c, a, b), pointSegmentDistance(d, a, b));
}

const clearance = 0.25;
const clear = (a, b) => obstacles.every(({ segment: [c, d] }) => segmentDistance(a, b, c, d) > clearance);
const step = 0.05, minX = -2, maxX = 15, minY = -3, maxY = 13;
const width = Math.round((maxX - minX) / step) + 1, height = Math.round((maxY - minY) / step) + 1;
const toPoint = (index) => ({ x: minX + (index % width) * step, y: minY + Math.floor(index / width) * step });
const nearest = (p) => Math.round((p.y - minY) / step) * width + Math.round((p.x - minX) / step);
const startIndex = nearest(anchor), goalIndex = nearest(goal);
const parent = new Int32Array(width * height).fill(-2);
const queue = new Int32Array(width * height);
let head = 0, tail = 0;
parent[startIndex] = -1; queue[tail++] = startIndex;
let found = startIndex === goalIndex;
while (head < tail && !found) {
  const currentIndex = queue[head++], current = toPoint(currentIndex);
  const x = currentIndex % width, y = Math.floor(currentIndex / width);
  for (let oy = -1; oy <= 1 && !found; oy++) for (let ox = -1; ox <= 1; ox++) {
    if (!ox && !oy) continue;
    const nx = x + ox, ny = y + oy;
    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
    const nextIndex = ny * width + nx;
    if (parent[nextIndex] !== -2 || !clear(current, toPoint(nextIndex))) continue;
    parent[nextIndex] = currentIndex; queue[tail++] = nextIndex;
    if (nextIndex === goalIndex) { found = true; break; }
  }
}
let route = [];
if (found) {
  for (let index = goalIndex; index >= 0; index = parent[index]) route.push(toPoint(index));
  route.reverse();
  route[0] = anchor; route[route.length - 1] = goal;
  // Greedily replace staircase runs with the farthest clear segment.
  const smoothed = [route[0]];
  for (let i = 0; i < route.length - 1;) {
    let next = route.length - 1;
    while (next > i + 1 && !clear(route[i], route[next])) next -= 1;
    smoothed.push(route[next]);
    i = next;
  }
  route = smoothed;
}
const routeLengths = route.slice(1).map((point, index) => Math.hypot(point.x - route[index].x, point.y - route[index].y));
let minimumClearance = Number.POSITIVE_INFINITY;
const crossingPairs = [];
for (let i = 1; i < route.length; i++) for (const obstacle of obstacles) {
  const distance = segmentDistance(route[i - 1], route[i], ...obstacle.segment);
  minimumClearance = Math.min(minimumClearance, distance);
  if (distance < 1e-9) crossingPairs.push({ routeSegment: i - 1, collarRole: obstacle.role, collarEntityId: obstacle.entityId });
}
const directLength = Math.hypot(goal.x - anchor.x, goal.y - anchor.y);
const result = { source: "docs/research/epic17/S362-woven-full-collar/woven-shirt-default-front.svg",
  revisionId: document.documentElement.getAttribute("data-revision-id"),
  sourceEntityId: callout.getAttribute("data-callout-source-entity"), targetId: callout.getAttribute("data-callout-target"),
  anchor, labelEndpoint: goal, collarSubsegments: obstacles.length, clearanceCm: clearance,
  grid: { stepCm: step, width, height, visitedNodes: tail }, found, route };
result.routeLengthCm = Number(routeLengths.reduce((sum, length) => sum + length, 0).toFixed(3));
result.directLengthCm = Number(directLength.toFixed(3));
result.routeToDirectLengthRatio = Number((result.routeLengthCm / directLength).toFixed(2));
result.minimumMeasuredClearanceCm = Number(minimumClearance.toFixed(3));
result.collarCrossingCount = crossingPairs.length;
result.collarCrossings = crossingPairs;
result.visibleCollarInstances = Object.fromEntries([...new Set(obstacles.map(({ role }) => role))]
  .map((role) => [role, [...new Set(obstacles.filter((item) => item.role === role).map((item) => item.entityId))].length]));
const output = join(import.meta.dirname, "route-feasibility-default.json");
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
if (found) {
  const routePath = route.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(4)} ${point.y.toFixed(4)}`).join(" ");
  const routeCallout = [...document.querySelectorAll("g[data-source-id]")]
    .find((element) => element.getAttribute("data-source-id") === "pom:woven-shirt:finished-placket-width");
  const routeElement = routeCallout?.querySelector("path");
  if (!routeElement) throw new Error("The callout leader path is missing in its rendered source SVG.");
  routeElement.setAttribute("d", routePath);
  routeElement.setAttribute("stroke", "#d12b2b");
  routeElement.setAttribute("stroke-width", "0.035");
  const root = document.documentElement;
  root.setAttribute("viewBox", "-2 -2 17 15");
  root.setAttribute("width", "1700");
  root.setAttribute("height", "1500");
  const overlaySvg = join(import.meta.dirname, "route-feasibility-default-overlay.svg");
  await writeFile(overlaySvg, root.outerHTML);
  const { chromium } = createRequire(import.meta.url)("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1700, height: 1500 }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(overlaySvg).href);
    await page.screenshot({ path: join(import.meta.dirname, "route-feasibility-default-overlay.png") });
  } finally { await browser.close(); }
}
console.log(JSON.stringify(result, null, 2));
