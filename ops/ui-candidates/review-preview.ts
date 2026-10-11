// Unshipped review fixture. No application mount, persistence or output imports.
import { ARTWORK_CATALOG, type ArtworkCatalogRecord } from "../../src/surface/artwork-library/catalog";
import { createFoundationStatus } from "../../src/ui/enhancements/foundation/foundation";
import { mountArtworkCatalog } from "../../src/ui/enhancements/artwork/artwork-panel";
import "../../src/ui/enhancements/foundation/foundation.css";
import "../../src/ui/enhancements/artwork/artwork-panel.css";
import axe from "axe-core";

const host = document.querySelector<HTMLElement>("#review-artwork-host")!;
const selection = document.querySelector<HTMLElement>("#review-selection")!;
const fixture = document.querySelector<HTMLSelectElement>("#review-fixture")!;
const statuses = document.querySelector<HTMLElement>("#foundation-statuses")!;
for (const kind of ["info", "warning", "error"] as const) {
  statuses.append(createFoundationStatus(`${kind}: this is synthetic candidate evidence, not a garment verdict.`, kind));
}
let selected: string | null = null;
let callbackCount = 0;
function catalogForFixture(): readonly ArtworkCatalogRecord[] {
  if (fixture.value === "empty") return [];
  if (fixture.value === "catalog") return ARTWORK_CATALOG;
  return ARTWORK_CATALOG.map((record, index) => index === 0 ? {
    ...record,
    title: fixture.value === "hostile" ? `<img src=x onerror=alert(1)> ${"Long reference title ".repeat(12)}` : record.title,
    description: fixture.value === "hostile" ? "LongLiteralWithoutWhitespace".repeat(30) : record.description,
    image: { ...record.image, localImageUrl: fixture.value === "missing" ? "/missing-candidate-image.jpg" : fixture.value === "remote" ? "https://example.invalid/never-fetch.jpg" : fixture.value === "endpoint" ? "/api/never-fetch-candidate" : record.image.localImageUrl },
  } : record);
}
function mount() {
  return mountArtworkCatalog(host, {
    catalog: catalogForFixture(), selectedAssetId: selected,
    onSelect: (assetId) => { selected = assetId; callbackCount += 1; selection.textContent = `Explicit callback ${callbackCount}: ${assetId}. No design was changed.`; panel.setSelection(assetId); },
  });
}
let panel = mount();
function remount() { panel.dispose(); panel = mount(); }
fixture.addEventListener("change", remount);
document.querySelector("#review-unknown")!.addEventListener("click", () => { selected = "missing-candidate-id"; panel.setSelection(selected); });
document.querySelector("#review-clear")!.addEventListener("click", () => { selected = null; panel.setSelection(null); });
document.querySelector("#review-dispose")!.addEventListener("click", () => panel.dispose());
document.querySelector("#review-remount")!.addEventListener("click", remount);
document.querySelector("#review-audit")!.addEventListener("click", async () => {
  const report = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
  document.querySelector("#review-audit-result")!.textContent = JSON.stringify({ violations: report.violations.map(({ id, impact, nodes }) => ({ id, impact, affected: nodes.map(({ target }) => target) })) });
});
