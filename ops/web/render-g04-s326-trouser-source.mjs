import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
import { chromium } from "playwright";

const output = path.resolve("docs/research/epic17/S326-trouser-browser");
await fs.mkdir(output, { recursive: true });
const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
let browser;
try {
  const [{ GARMENTS }, { STANDARD_M }, { defaultGarmentOptions }, { assembleTechnicalFlatRoles }] = await Promise.all([
    vite.ssrLoadModule("/src/drafting/recipe.ts"),
    vite.ssrLoadModule("/src/drafting/measurements.ts"),
    vite.ssrLoadModule("/src/drafting/options.ts"),
    vite.ssrLoadModule("/src/render/technical-flat-assembly.ts"),
  ]);
  const recipe = GARMENTS.find((entry) => entry.name === "trouser");
  const options = defaultGarmentOptions(recipe.options ?? []);
  const block = recipe.draft(STANDARD_M, options);
  const assembly = assembleTechnicalFlatRoles("trouser", block, "FRONT_FLAT");
  const edge = (role, name) => block.roles[role].edges.find((entry) => entry.name === name);
  const mark = (role, name) => block.roles[role].marks.find((entry) => entry.name === name);
  const source = {
    recipe: "trouser",
    revisionInputs: { size: "STANDARD_M", options },
    approvedSourceRoles: Object.fromEntries(["frontLeft", "frontRight", "flyUnderlap", "flyShield"].map((role) => [role, block.roles[role]])),
    stitches: block.stitches.filter((stitch) => /Waistband|front fly|Fly underlap/u.test(stitch.label)),
    frontAssembly: {
      issues: assembly.issues,
      transforms: Object.fromEntries(["frontLeft", "frontRight"].map((role) => [role, assembly.transforms[role]])),
      waistbandFragments: assembly.sourceFragments,
      joinedStitchLabels: assembly.joinedStitchLabels.filter((label) => /fly/u.test(label)),
    },
    limits: ["This annotated source-topology plate is not an accepted front flat.",
      "The underlap is an interior backing and is hidden in the exterior front/back render.",
      "Short-edge finishing remains unspecified.", "No physical sewing, fit or factory acceptance is claimed."],
  };
  const esc = (value) => String(value).replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;");
  const text = (x, y, value, color = "#172b3a", size = 15, weight = "normal") =>
    `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}">${esc(value)}</text>`;
  const line = (a, b, color, width = 4, dash = "") =>
    `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" stroke-width="${width}" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`;
  const scaled = (p, ox, oy, scale = 7) => ({ x: ox + p.x * scale, y: oy + p.y * scale });
  const sourceEdgeLine = (role, edgeName, ox, oy, color, width = 4) => {
    const item = edge(role, edgeName);
    const a = item.kind === "line" ? item.start : item.curve.start;
    const b = item.kind === "line" ? item.end : item.curve.end;
    return line(scaled(a, ox, oy), scaled(b, ox, oy), color, width);
  };
  const flyMarkLine = (role, ox, oy) => {
    const item = mark(role, "flyEdge");
    return line(scaled(item.start, ox, oy), scaled(item.end, ox, oy), "#7c3aed", 5, "8 5");
  };
  const panels = [
    { x: 24, title: "Source frontLeft · exact current piece" },
    { x: 392, title: "Source frontRight · exact current piece" },
    { x: 760, title: "Source flyUnderlap · maintainer-approved role" },
    { x: 1128, title: "Source flyShield · existing role" },
  ];
  const cards = panels.map(({ x, title }) =>
    `<rect x="${x}" y="94" width="348" height="410" rx="8" fill="white" stroke="#94a3b8"/>${text(x + 16, 122, title, "#172b3a", 16, "bold")}`).join("");
  const left = sourceEdgeLine("frontLeft", "waist", 135, 178, "#15803d", 5)
    + sourceEdgeLine("frontLeft", "centerFront", 135, 178, "#334155", 4) + flyMarkLine("frontLeft", 135, 178)
    + text(145, 170, "frontLeft.waist → (23.5,0)", "#15803d", 12)
    + text(145, 255, "flyEdge (0,0) → (0,15)", "#7c3aed", 12)
    + text(145, 352, "centerFront: (0,24) → (0,0)", "#334155", 12);
  const right = sourceEdgeLine("frontRight", "waist", 650, 178, "#15803d", 5)
    + sourceEdgeLine("frontRight", "centerFront", 650, 178, "#334155", 4) + flyMarkLine("frontRight", 650)
    + text(485, 170, "frontRight.waist → (−23.5,0)", "#15803d", 12)
    + text(485, 255, "flyEdge (0,0) → (0,15)", "#7c3aed", 12)
    + text(485, 352, "centerFront: (0,24) → (0,0)", "#334155", 12);
  const underlap = ["top", "frontEdge", "bottom", "shieldEdge"].map((name) =>
    sourceEdgeLine("flyUnderlap", name, 960, 178, "#c2410c", 5)).join("")
    + text(780, 360, "frontEdge: 15 cm", "#c2410c", 12)
    + text(780, 383, "shieldEdge: 15 cm", "#c2410c", 12)
    + text(780, 406, "top/bottom width: 3.5 cm", "#c2410c", 12)
    + text(780, 460, "No finishing line or balance notch inferred", "#713c16", 11);
  const shield = ["top", "right", "bottom", "left"].map((name) =>
    sourceEdgeLine("flyShield", name, 1300, 178, name === "right" ? "#2563eb" : "#64748b", 5)).join("")
    + text(1148, 360, "left remains joined to frontLeft", "#2563eb", 12)
    + text(1148, 383, "right joins underlap.shieldEdge", "#2563eb", 12)
    + text(1148, 406, "width: 3.5 cm · length: 15 cm", "#475569", 12);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="800" viewBox="0 0 1500 800">
    <rect width="1500" height="800" fill="#f1f5f9"/><rect x="18" y="15" width="1464" height="54" rx="5" fill="#334155"/>
    ${text(38, 49, "S326 TROUSER FLY · CURRENT SOURCE TOPOLOGY · NOT AN ACCEPTED FLAT", "white", 21, "bold")}${cards}
    ${left}${right}${underlap}${shield}
    <rect x="24" y="534" width="1452" height="220" rx="8" fill="white" stroke="#94a3b8"/>
    ${text(44, 568, "Current source stitch chain", "#172b3a", 17, "bold")}
    ${text(44, 610, "frontLeft.flyEdge → flyShield.left", "#2563eb", 15)}
    ${text(44, 642, "frontRight.flyEdge → flyUnderlap.frontEdge → flyUnderlap.shieldEdge → flyShield.right", "#c2410c", 15)}
    ${text(44, 688, "Approved layer decision: flyUnderlap is interior backing behind the frontLeft exterior closure layer; interior roles stay hidden in exterior flats.", "#713c16", 13)}
    ${text(44, 721, "Both front panels remain upright (0°); source waist/center-front edges are unchanged. S326 output checks still hold all 24 fronts for contour/readability issues.", "#475569", 13)}
    </svg>`;
  await fs.writeFile(path.join(output, "trouser-source-topology.svg"), svg, "utf8");
  await fs.writeFile(path.join(output, "trouser-source-topology.json"), `${JSON.stringify(source, null, 2)}\n`, "utf8");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1500, height: 800 }, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(output, "trouser-source-topology.png"), fullPage: true, animations: "disabled" });
  process.stdout.write(JSON.stringify({ svg: "trouser-source-topology.svg", image: "trouser-source-topology.png",
    assemblyIssues: assembly.issues, transforms: source.frontAssembly.transforms, roles: Object.keys(source.approvedSourceRoles) }, null, 2) + "\n");
} finally {
  await browser?.close();
  await vite.close();
}
