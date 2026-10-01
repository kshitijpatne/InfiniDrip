import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "../../../..");
const folder = resolve(root, "docs/research/epic17/S335-woven-contours");
const diagnostic = JSON.parse(await readFile(resolve(folder, "source-contour-topology.json"), "utf8"));
const record = diagnostic.records.find((item) => item.caseId === "woven-shirt-default");
const colors = { front: "#334155", sleeve: "#6d28d9", pocket: "#0f766e", outerStand: "#b45309",
  underCollar: "#0284c7", upperCollar: "#db2777", buttonholePlacket: "#7c3aed", buttonPlacket: "#dc2626", sleeveBand: "#475569" };
const candidateRoles = new Set(["sleeve", "outerStand", "underCollar", "upperCollar", "buttonholePlacket"]);
const segments = [];
for (const role of record.roles) for (const path of role.paths) if (path) for (const segment of path.segments) {
  segments.push({ roleId: role.roleId, ...segment });
}
const allPoints = segments.flatMap((segment) => [segment.from, segment.to]);
const minX = Math.min(...allPoints.map((point) => point.x)) - 3;
const maxX = Math.max(...allPoints.map((point) => point.x)) + 3;
const minY = Math.min(...allPoints.map((point) => point.y)) - 4;
const maxY = Math.max(...allPoints.map((point) => point.y)) + 4;
const width = 1420;
const header = 135;
const scale = Math.min((width - 100) / (maxX - minX), 870 / (maxY - minY));
const height = header + (maxY - minY) * scale + 80;
const px = (point) => 50 + (point.x - minX) * scale;
const py = (point) => header + (point.y - minY) * scale;
const pathD = (path) => {
  let d = "";
  for (const command of path.commands) {
    if (command.op === "move") d += `M${px(command.point)} ${py(command.point)} `;
    else if (command.op === "line") d += `L${px(command.point)} ${py(command.point)} `;
    else if (command.op === "cubic") d += `C${px(command.control1)} ${py(command.control1)} ${px(command.control2)} ${py(command.control2)} ${px(command.point)} ${py(command.point)} `;
    else d += "Z ";
  }
  return d.trim();
};
const drawPaths = record.roles.flatMap((role) => role.paths.filter(Boolean).map((path) =>
  `<path d="${pathD(path)}" fill="none" stroke="${path.colorwayBoundaryOnly ? "#f97316" : colors[role.roleId]}" stroke-width="${path.colorwayBoundaryOnly ? "2.6" : "1.6"}"${path.colorwayBoundaryOnly ? ` stroke-dasharray="9 6"` : ""} vector-effect="non-scaling-stroke"><title>${role.roleId} · ${path.colorwayBoundaryOnly ? "approved hidden fill-only view closure" : "authored source edge"} · ${path.sourceId} · ${path.sourceEdgeIds.join(", ")}</title></path>`)).join("");
const boundaries = [];
for (const role of record.roles.filter((candidate) => candidateRoles.has(candidate.roleId))) {
  const byPrimitive = new Map();
  for (const endpoint of role.openOrOverconnectedSerializedEndpoints) {
    if (endpoint.degree !== 1) continue;
    const edge = endpoint.edges[0];
    const list = byPrimitive.get(edge.primitiveId) ?? [];
    list.push({ point: endpoint.point, edge });
    byPrimitive.set(edge.primitiveId, list);
  }
  for (const [primitiveId, pair] of byPrimitive) if (pair.length === 2) {
    boundaries.push({ roleId: role.roleId, primitiveId, a: pair[0].point, b: pair[1].point });
  }
}
const drawBoundaries = boundaries.map(({ roleId, primitiveId, a, b }) => `<path d="M${px(a)} ${py(a)} L${px(b)} ${py(b)}" fill="none" stroke="#f97316" stroke-width="2.4" stroke-dasharray="9 6" vector-effect="non-scaling-stroke"><title>Proposed hidden fill-only closure · ${roleId} · ${primitiveId}</title></path><circle cx="${px(a)}" cy="${py(a)}" r="5" fill="#fff" stroke="#f97316" stroke-width="2"/><circle cx="${px(b)}" cy="${py(b)}" r="5" fill="#fff" stroke="#f97316" stroke-width="2"/>`).join("");
const legend = Object.entries(colors).filter(([roleId]) => candidateRoles.has(roleId)).map(([roleId, color], index) =>
  `<g transform="translate(${50 + index % 3 * 430},${height - 64 + Math.floor(index / 3) * 20})"><line x1="0" y1="0" x2="25" y2="0" stroke="${color}" stroke-width="3"/><text x="34" y="5">${roleId}</text></g>`).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#fff"/><style>text{font-family:Arial,sans-serif;fill:#0f172a}.title{font-size:26px;font-weight:700}.subtitle{font-size:15px;fill:#475569}.role{font-size:14px;font-weight:700;paint-order:stroke;stroke:#fff;stroke-width:4px}</style><text class="title" x="36" y="42">Woven FRONT_FLAT contour closure trace · ${record.caseId}</text><text class="subtitle" x="36" y="73">Exact live draft, projected source edges and view transforms. Orange dashed lines are approved hidden fill-only view boundaries.</text><text class="subtitle" x="36" y="99">Diagnostic overlay; not accepted output. No source geometry or visible partition lines are added.</text><line x1="900" y1="120" x2="935" y2="120" stroke="#f97316" stroke-width="2.6" stroke-dasharray="9 6"/><text class="subtitle" x="945" y="125">hidden colorway closure</text>${drawPaths}${drawBoundaries}${record.roles.filter((role) => candidateRoles.has(role.roleId)).map((role) => { const path = role.paths.find(Boolean); const segment = path?.segments[0]; if (!segment) return ""; const p = { x: (segment.from.x + segment.to.x) / 2, y: (segment.from.y + segment.to.y) / 2 }; return `<text class="role" x="${px(p)}" y="${py(p)}">${role.roleId}</text>`; }).join("")}${legend}</svg>`;
await writeFile(resolve(folder, "woven-front-contour-candidate.svg"), svg);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(svg, { waitUntil: "load" });
  await page.screenshot({ path: resolve(folder, "woven-front-contour-candidate.png"), fullPage: true });
  await page.close();
} finally { await browser.close(); }
console.log(JSON.stringify({ caseId: record.caseId, openRoles: boundaries.length, output: folder }));
