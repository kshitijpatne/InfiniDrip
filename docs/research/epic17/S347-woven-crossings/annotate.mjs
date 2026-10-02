import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";

const root = new URL("./", import.meta.url);
const replay = new URL("../S346-woven-collar/production-replay/", root);
const specs = [
  { face: "front_flat", roles: ["outerStand", "upperCollar", "underCollar", "sleeveBand"] },
  { face: "back_flat", roles: ["sleeve", "sleeveBand", "outerStand", "upperCollar", "underCollar", "yoke"] },
];
const colors = {
  outerStand: "#dc2626", upperCollar: "#2563eb", underCollar: "#16a34a",
  sleeveBand: "#c026d3", sleeve: "#ea580c", yoke: "#0891b2",
};
const browser = await chromium.launch({ headless: true });
try {
  for (const spec of specs) {
    const name = `woven-shirt-default-${spec.face}.json`;
    const source = JSON.parse(await readFile(new URL(name, replay), "utf8"));
    const paths = [];
    const inventory = [];
    for (const role of spec.roles) {
      const matches = [...source.svg.matchAll(/<path\b[^>]*>/g)].map(([tag]) => tag).filter((tag) => {
        const entity = tag.match(/\sdata-entity-id="([^"]+)"/)?.[1] ?? "";
        return entity.includes(`:component:${role}:outline`);
      });
      for (const tag of matches) {
        const entity = tag.match(/\sdata-entity-id="([^"]+)"/)?.[1];
        const d = tag.match(/\sd="([^"]+)"/)?.[1];
        if (!entity || !d) continue;
        inventory.push({ entityId: entity, roleId: role, layer: "GARMENT_SILHOUETTE", d });
        paths.push(`<path data-review-overlay-for="${entity}" d="${d}" fill="none" stroke="${colors[role]}" stroke-width="0.36" stroke-dasharray="0.8 0.38" vector-effect="non-scaling-stroke"/>`);
      }
    }
    const legend = `<g data-review-legend="true" font-family="Arial, sans-serif" font-size="0.9" font-weight="bold">${spec.roles.map((role, index) => `<text x="-50" y="${-25 + index * 1.15}" fill="${colors[role]}">${role} source outline</text>`).join("")}<text x="-50" y="-26.1" fill="#111827">Dashed overlays follow emitted entity paths at ${source.revisionId}.</text></g>`;
    const annotated = source.svg.replace("</svg>", `${paths.join("")}\n${legend}</svg>`);
    const stem = `default-${spec.face}-source-overlay`;
    await writeFile(new URL(`${stem}.svg`, root), annotated);
    await writeFile(new URL(`${stem}.json`, root), `${JSON.stringify({
      revisionId: source.revisionId, face: source.kind, sourceFile: name,
      roles: spec.roles, entities: inventory,
    }, null, 2)}\n`);
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0;background:#fff">${annotated}</body></html>`);
    await page.screenshot({ path: fileURLToPath(new URL(`${stem}.png`, root)), fullPage: true });
    await page.close();
  }
} finally {
  await browser.close();
}
