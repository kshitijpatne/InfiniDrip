import { mountArtworkCatalog } from "../../src/ui/enhancements/artwork/artwork-panel";

const host = document.querySelector<HTMLElement>("#artwork-host");
if (host !== null) {
  mountArtworkCatalog(host, {
    onSelect: (assetId) => {
      const note = document.createElement("p");
      note.textContent = `Candidate callback only: ${assetId}. Nothing was imported or applied.`;
      host.appendChild(note);
    },
  });
}

const second = document.querySelector<HTMLElement>("#artwork-host-second");
if (second !== null) {
  mountArtworkCatalog(second, {
    printUse: "panel",
    selectedAssetId: null,
    onSelect: (assetId) => {
      const note = document.createElement("p");
      note.textContent = `Second candidate instance callback only: ${assetId}.`;
      second.appendChild(note);
    },
  });
}
