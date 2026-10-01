import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const directory = fileURLToPath(new URL("./", import.meta.url));
const diagnostic = JSON.parse(await readFile(join(directory, "source-assembly-diagnostics.json"), "utf8"));
const specimen = diagnostic.records[0];
const scale = 4;
const panels = {
  front: { x: 95, y: 205, w: 150, h: 300, title: "front (half, source centerFront x=0)" },
  yoke: { x: 390, y: 205, w: 150, h: 100, title: "yoke (on fold at centerBack)" },
  back: { x: 685, y: 205, w: 150, h: 300, title: "back (on fold at centerBack)" },
  sleeve: { x: 980, y: 205, w: 190, h: 185, title: "sleeve (single source piece)" },
};
const c = (point, panel) => `${(panel.x + point.x * scale).toFixed(2)} ${(panel.y + point.y * scale).toFixed(2)}`;
const roles = Object.fromEntries(specimen.roles.map((role) => [role.roleId, role]));
const highlight = {
  front: new Set(["armhole"]), yoke: new Set(["armholeUpper"]), back: new Set(["armholeLower"]),
  sleeve: new Set(["capLeft", "capRight"]),
};
const colors = { front: "#d9480f", yoke: "#166534", back: "#1d4ed8", sleeve: "#7c3aed" };
const paths = [];
const labels = [];

for (const [roleId, panel] of Object.entries(panels)) {
  const edges = roles[roleId].edges;
  const start = edges[0].start;
  let d = `M ${c(start, panel)}`;
  for (const entry of edges) {
    const edge = entry.geometry;
    if (edge.kind === "line") d += ` L ${c(edge.end, panel)}`;
    else d += ` C ${c(edge.curve.control1, panel)} ${c(edge.curve.control2, panel)} ${c(edge.curve.end, panel)}`;
  }
  d += " Z";
  paths.push(`<path d="${d}" fill="#f8fafc" stroke="#475569" stroke-width="1.5"/>`);
  labels.push(`<text x="${panel.x}" y="${panel.y - 20}" class="heading">${panel.title}</text>`);
  for (const entry of edges) {
    const edge = entry.geometry;
    const selected = highlight[roleId].has(entry.edgeId);
    const color = selected ? colors[roleId] : "#94a3b8";
    const edgeStart = edge.kind === "line" ? edge.start : edge.curve.start;
    const edgeEnd = edge.kind === "line" ? edge.end : edge.curve.end;
    const edgeD = edge.kind === "line"
      ? `M ${c(edgeStart, panel)} L ${c(edgeEnd, panel)}`
      : `M ${c(edge.curve.start, panel)} C ${c(edge.curve.control1, panel)} ${c(edge.curve.control2, panel)} ${c(edge.curve.end, panel)}`;
    paths.push(`<path d="${edgeD}" fill="none" stroke="${color}" stroke-width="${selected ? 3 : 1}"${selected ? ' marker-end="url(#arrow)"' : ""}/>`);
    const middle = edge.kind === "line"
      ? { x: (edge.start.x + edge.end.x) / 2, y: (edge.start.y + edge.end.y) / 2 }
      : edge.curve.control1;
  }
}

const seam = specimen.stitch;
const sleeve = roles.sleeve.edges;
const bodyOrder = [
  { ref: "front.armhole", length: roles.front.edges.find((edge) => edge.edgeId === "armhole").lengthCm, direction: "reverse for capLeft" },
  { ref: "yoke.armholeUpper", length: roles.yoke.edges.find((edge) => edge.edgeId === "armholeUpper").lengthCm, direction: "source forward for capRight" },
  { ref: "back.armholeLower", length: roles.back.edges.find((edge) => edge.edgeId === "armholeLower").lengthCm, direction: "source forward for capRight" },
];
const capOrder = [
  { ref: "sleeve.capLeft", length: sleeve.find((edge) => edge.edgeId === "capLeft").lengthCm, direction: "underarm → crown" },
  { ref: "sleeve.capRight", length: sleeve.find((edge) => edge.edgeId === "capRight").lengthCm, direction: "crown → underarm" },
];
const rows = (list, y, xStart) => list.map((entry, index) => {
  const x = xStart + index * 360;
  return `<g><rect x="${x}" y="${y}" width="330" height="66" rx="7" fill="#f8fafc" stroke="#cbd5e1"/><text x="${x + 12}" y="${y + 25}" class="body">${entry.ref}</text><text x="${x + 12}" y="${y + 48}" class="small">${entry.length.toFixed(2)} cm · ${entry.direction}</text></g>`;
}).join("");
const totalBody = bodyOrder.reduce((sum, edge) => sum + edge.length, 0);
const totalCap = capOrder.reduce((sum, edge) => sum + edge.length, 0);
const boundary = bodyOrder[0].length / totalBody * totalCap;
const capLeft = capOrder[0].length;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1070" viewBox="0 0 1280 1070">
<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#334155"/></marker></defs>
<style>text{font-family:Arial,sans-serif;fill:#0f172a}.title{font-size:25px;font-weight:700}.subtitle{font-size:14px;fill:#475569}.heading{font-size:15px;font-weight:700}.edge{font-size:11px;font-weight:700;paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round}.endpoint{font-size:11px;font-weight:700;fill:#111827;paint-order:stroke;stroke:#fff;stroke-width:3px}.body{font-size:14px;font-weight:700}.small{font-size:12px;fill:#475569}</style>
<rect width="1280" height="1070" fill="white"/>
<text x="40" y="48" class="title">Woven sleeve-cap source trace · ${specimen.revision}</text>
<text x="40" y="75" class="subtitle">Actual STANDARD_M draft · exact 13-option values and generated edge geometry are retained in source-assembly-diagnostics.json.</text>
<text x="40" y="98" class="subtitle">Dark paths are source-piece boundaries. Color paths trace the exact armhole/cap edges; arrowheads show authored edge direction.</text>
${paths.join("")}${labels.join("")}
<text x="95" y="535" class="small" fill="#d9480f">armhole 22.30 cm · shoulder → underarm</text>
<text x="390" y="325" class="small" fill="#166534">armholeUpper 11.39 cm · shoulder → yoke underarm</text>
<text x="685" y="535" class="small" fill="#1d4ed8">armholeLower 10.92 cm · yoke underarm → underarm</text>
<text x="935" y="415" style="font-size:10px;fill:#7c3aed">capL 23.05: underarm→crown / capR 23.05: crown→underarm</text>
<text x="40" y="565" class="heading">Directly encoded stitch interface (${seam.label})</text>
<text x="40" y="589" class="subtitle">A order: ${seam.a.map((ref) => `${ref.piece}.${ref.edge}`).join(" → ")} · B order: ${seam.b.map((ref) => `${ref.piece}.${ref.edge}`).join(" → ")} · allowed ease ${seam.ease.lo}…${seam.ease.hi} cm</text>
${rows(bodyOrder, 610, 40)}
<text x="40" y="715" class="heading">Approved view-only arclength correspondence (not a source notch)</text>
<text x="40" y="739" class="subtitle">front fraction ${bodyOrder[0].length.toFixed(2)} / ${totalBody.toFixed(2)} = ${(bodyOrder[0].length / totalBody).toFixed(4)}; transferred sleeve station ${boundary.toFixed(2)} cm of ${totalCap.toFixed(2)} cm, at capLeft end ${capLeft.toFixed(2)} cm.</text>
${rows(capOrder, 755, 40)}
<rect x="40" y="850" width="1200" height="155" rx="8" fill="#fff7ed" stroke="#c2410c"/>
<text x="60" y="882" class="heading">Derived orientation proposal for the interface only</text>
<text x="60" y="910" class="subtitle">Reverse front.armhole for the view correspondence: its encoded end is the same underarm endpoint as sleeve.capLeft.start.</text>
<text x="60" y="936" class="subtitle">Keep yoke.armholeUpper then back.armholeLower forward: their encoded endpoints form the shoulder-to-underarm path for sleeve.capRight.</text>
<text x="60" y="970" class="subtitle">No source stitch, cut geometry or ease changes. Current complete front/back outputs remain held; overlay documents topology, not a sewn/accepted flat.</text>
</svg>`;
await mkdir(directory, { recursive: true });
await writeFile(join(directory, "woven-sleeve-source-topology.svg"), svg);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1070 }, deviceScaleFactor: 1 });
  await page.goto(`file:///${join(directory, "woven-sleeve-source-topology.svg").replaceAll("\\", "/")}`);
  await page.screenshot({ path: join(directory, "woven-sleeve-source-topology.png") });
  await page.close();
} finally {
  await browser.close();
}
console.log(JSON.stringify({ specimen: specimen.caseId, interface: seam.label, bodyLengthCm: totalBody,
  capLengthCm: totalCap, mappedBoundaryCm: boundary, sourceOrder: seam.b, files: [
    "woven-sleeve-source-topology.svg", "woven-sleeve-source-topology.png",
  ] }, null, 2));
