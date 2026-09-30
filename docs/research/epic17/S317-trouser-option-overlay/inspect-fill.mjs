import fs from "node:fs/promises";
import { chromium } from "playwright";

const svg = await fs.readFile(new URL("../S316-trouser-back-overlay/back.svg", import.meta.url), "utf8");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  await page.setContent(`<img id="flat" src="${dataUrl}">`);
  const result = await page.locator("#flat").evaluate(async (image, sourceUrl) => {
    await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = 1006; canvas.height = 2244;
    const context = canvas.getContext("2d"); context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const px = (x) => Math.round((x + 28.2) / 56.4 * canvas.width);
    const py = (y) => Math.round((y + 5.9766) / 125.8337 * canvas.height);
    const sample = (x, y) => [...context.getImageData(px(x), py(y), 1, 1).data];
    const root = new DOMParser().parseFromString(atob(sourceUrl.split(",").at(-1)), "image/svg+xml").documentElement;
    const outline = root.querySelector("path[data-source-id='pattern:trouser:role:backLeft']");
    const artwork = root.querySelector("[data-layer='ARTWORK']");
    const points = [[9, 53], [10, 55], [18, 58], [22, 55], [25, 55]];
    const fillContext = document.createElement("canvas").getContext("2d");
    const path2d = new Path2D(outline?.getAttribute("d"));
    return {
      outlineFound: Boolean(outline),
      artworkFound: Boolean(artwork),
      outlineD: outline?.getAttribute("d"),
      artTransform: artwork?.getAttribute("transform"),
      outlineTransform: outline?.getAttribute("transform"),
      raster: { artworkCenter: sample(13.7626, 55.5), paperReference: sample(-25, 55.5), expectedCompositedColor: [223, 225, 227, 255] },
      points: points.map(([x, y]) => {
        const point = root.createSVGPoint(); point.x = x; point.y = y;
        return { x, y, inside: outline?.isPointInFill(point), canvasInside: fillContext?.isPointInPath(path2d, x, y), stroke: outline?.isPointInStroke(point) };
      }),
    };
  }, dataUrl);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
  await browser.close();
}
