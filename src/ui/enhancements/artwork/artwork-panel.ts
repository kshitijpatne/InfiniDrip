import {
  ARTWORK_CATALOG,
  ARTWORK_CATEGORIES,
  GARMENT_FAMILIES,
  PIECE_ROLE_GROUPS,
  PRINT_USES,
  describeArtworkApiRightsEvidence,
  type ArtworkCatalogRecord,
  type ArtworkCategory,
  type ArtworkGarmentFamily,
  type ArtworkPieceRoleGroup,
  type ArtworkPrintUse,
} from "../../../surface/artwork-library/catalog";
import {
  assessArtworkUse,
  searchArtworkCatalog,
} from "../../../surface/artwork-library/search";

export interface ArtworkCatalogPanelOptions {
  readonly catalog?: readonly ArtworkCatalogRecord[];
  readonly selectedAssetId?: string | null;
  readonly printUse?: ArtworkPrintUse;
  readonly onSelect: (assetId: string) => void;
}

export interface ArtworkCatalogPanelHandle {
  setSelection(assetId: string | null): void;
  dispose(): void;
}

let artworkPanelInstanceCounter = 0;

function isSafeLocalImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  let parsed: URL;
  try {
    parsed = new URL(trimmed, window.location.href);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  if (parsed.username.length > 0 || parsed.password.length > 0) return false;
  if (parsed.origin !== window.location.origin) return false;
  // Same origin is not enough: a supplied URL could be an API or redirect
  // endpoint. Only the existing, bundler-resolved reference files are trusted.
  return ARTWORK_CATALOG.some(record => record.image.localImageUrl === parsed.href);
}

function printUseLabel(printUse: ArtworkPrintUse): string {
  if (printUse === "all-over") return "All-over";
  if (printUse === "border/trim") return "Border / trim";
  if (printUse === "focal graphic") return "Focal graphic";
  if (printUse === "panel") return "Panel";
  return "Placement";
}

function suitabilityLabel(level: "recommended" | "possible" | "needs-review"): string {
  if (level === "recommended") return "Recommended";
  if (level === "possible") return "Possible";
  return "Needs review";
}

function presentationLabel(presentation: string): string {
  if (presentation === "textile-photograph") return "Museum textile photograph";
  if (presentation === "paper-study") return "Photographed paper study";
  if (presentation === "clean-artwork") return "Clean artwork image";
  return "Image presentation unconfirmed";
}

function tileLabel(isSeamlessTile: boolean): string {
  if (isSeamlessTile) return "Verified seamless tile";
  return "Not a verified seamless tile";
}

function setText(element: HTMLElement, value: string): void {
  element.textContent = value;
}

export function mountArtworkCatalog(
  host: HTMLElement,
  options: ArtworkCatalogPanelOptions,
): ArtworkCatalogPanelHandle {
  const catalog = options.catalog ?? ARTWORK_CATALOG;
  const initialPrintUse = options.printUse ?? "placement";
  let selectedId: string | null = options.selectedAssetId ?? null;
  let disposed = false;
  const controlListeners = new window.AbortController();
  let cardListeners = new window.AbortController();
  const instanceId = artworkPanelInstanceCounter;
  artworkPanelInstanceCounter += 1;
  const prefix = `uiq-artwork-${instanceId}`;

  const root = document.createElement("div");
  root.className = "uiq-artwork";

  const heading = document.createElement("h2");
  heading.className = "uiq-artwork-heading";
  setText(heading, "Existing artwork references");
  root.appendChild(heading);

  const intro = document.createElement("p");
  intro.className = "uiq-artwork-intro";
  setText(
    intro,
    "Browse bundled textile and print references. Rights and print-use limits stay visible while browsing. Browsing never changes the garment; choosing a card only reports its asset ID.",
  );
  root.appendChild(intro);

  const controls = document.createElement("div");
  controls.className = "uiq-artwork-controls";
  root.appendChild(controls);

  function createField(labelText: string, control: HTMLElement, controlId: string): void {
    const wrapper = document.createElement("div");
    wrapper.className = "uiq-artwork-field";
    const label = document.createElement("label");
    label.className = "uiq-artwork-label";
    label.setAttribute("for", controlId);
    setText(label, labelText);
    control.id = controlId;
    wrapper.appendChild(label);
    wrapper.appendChild(control);
    controls.appendChild(wrapper);
  }

  function createSelect(emptyLabel: string, values: readonly string[]): HTMLSelectElement {
    const select = document.createElement("select");
    select.className = "uiq-artwork-select";
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    setText(emptyOption, emptyLabel);
    select.appendChild(emptyOption);
    for (const value of values) {
      const option = document.createElement("option");
      option.value = value;
      setText(option, value);
      select.appendChild(option);
    }
    return select;
  }

  function createPrintSelect(): HTMLSelectElement {
    const select = document.createElement("select");
    select.className = "uiq-artwork-select";
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    setText(emptyOption, "Any print use");
    select.appendChild(emptyOption);
    for (const value of PRINT_USES) {
      const option = document.createElement("option");
      option.value = value;
      setText(option, printUseLabel(value));
      select.appendChild(option);
    }
    return select;
  }

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.className = "uiq-artwork-input";
  searchInput.setAttribute("autocomplete", "off");
  searchInput.setAttribute("placeholder", "Search title, tags, creator, source");
  createField("Search references", searchInput, `${prefix}-search`);

  const categorySelect = createSelect("All categories", ARTWORK_CATEGORIES);
  createField("Category", categorySelect, `${prefix}-category`);

  const familySelect = createSelect("Any family", GARMENT_FAMILIES);
  createField("Garment family", familySelect, `${prefix}-family`);

  const roleSelect = createSelect("Any piece role", PIECE_ROLE_GROUPS);
  createField("Piece role", roleSelect, `${prefix}-role`);

  const printSelect = createPrintSelect();
  createField("Print use (filters and guidance)", printSelect, `${prefix}-print`);

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "uiq-artwork-clear";
  setText(clearButton, "Clear search and filters");
  controls.appendChild(clearButton);

  const countElement = document.createElement("p");
  countElement.className = "uiq-artwork-count";
  countElement.setAttribute("role", "status");
  countElement.setAttribute("aria-live", "polite");
  root.appendChild(countElement);

  const selectionElement = document.createElement("p");
  selectionElement.className = "uiq-artwork-selection";
  selectionElement.setAttribute("role", "status");
  root.appendChild(selectionElement);

  const resultsElement = document.createElement("div");
  resultsElement.className = "uiq-artwork-results";
  root.appendChild(resultsElement);

  let query = "";
  let categoryFilter = "";
  let familyFilter = "";
  let roleFilter = "";
  let printFilter = "";
  let assessmentUse: ArtworkPrintUse = initialPrintUse;
  const chooseButtons: { button: HTMLButtonElement; record: ArtworkCatalogRecord }[] = [];

  function updateChooseButton(button: HTMLButtonElement, record: ArtworkCatalogRecord, isSelected: boolean): void {
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    setText(button, isSelected ? `Selected: Choose ${record.title}` : `Choose ${record.title}`);
  }

  function currentResults(): readonly ArtworkCatalogRecord[] {
    const filters: {
      categories?: ArtworkCategory[];
      garmentFamilies?: ArtworkGarmentFamily[];
      pieceRoleGroups?: ArtworkPieceRoleGroup[];
      printUses?: ArtworkPrintUse[];
    } = {};
    if (categoryFilter !== "") filters.categories = [categoryFilter as ArtworkCategory];
    if (familyFilter !== "") filters.garmentFamilies = [familyFilter as ArtworkGarmentFamily];
    if (roleFilter !== "") filters.pieceRoleGroups = [roleFilter as ArtworkPieceRoleGroup];
    if (printFilter !== "") filters.printUses = [printFilter as ArtworkPrintUse];
    return searchArtworkCatalog({ query, filters }, catalog);
  }

  function createProvenanceDetails(record: ArtworkCatalogRecord): HTMLElement {
    const details = document.createElement("details");
    details.className = "uiq-artwork-provenance";
    const summary = document.createElement("summary");
    setText(summary, "Source, rights and technical record");
    details.appendChild(summary);
    const list = document.createElement("dl");
    list.className = "uiq-artwork-record";
    details.appendChild(list);

    function addRow(term: string, value: string): void {
      const dt = document.createElement("dt");
      setText(dt, term);
      const dd = document.createElement("dd");
      const code = document.createElement("code");
      code.className = "uiq-artwork-code";
      setText(code, value);
      dd.appendChild(code);
      list.appendChild(dt);
      list.appendChild(dd);
    }

    function addTextRow(term: string, value: string): void {
      const dt = document.createElement("dt");
      setText(dt, term);
      const dd = document.createElement("dd");
      setText(dd, value);
      list.appendChild(dt);
      list.appendChild(dd);
    }

    addTextRow("Creator", record.creator);
    addTextRow("Culture and date", `${record.culture} · ${record.date}`);
    addTextRow("Medium", record.medium);
    addTextRow("Institution", record.source.institution);
    addTextRow(
      "Rights",
      `${record.source.rightsLabel} · ${describeArtworkApiRightsEvidence(record.source.apiRightsEvidence)}`,
    );
    addTextRow("Credit line", record.source.creditLine);
    addRow("Item record URL (provenance text only)", record.source.itemRecordUrl);
    addRow("API record URL (provenance text only)", record.source.apiRecordUrl);
    addRow("Original image URL (provenance text only)", record.source.originalImageUrl);
    addRow("Reuse policy URL (provenance text only)", record.source.reusePolicyUrl);
    addTextRow("Official source image filename", record.source.originalImageFilename);
    addTextRow(
      "Source identifiers",
      `${record.source.itemIdentifier} · API ID ${String(record.source.apiInternalId)}`,
    );
    addTextRow("Rights checked / file retrieved", `${record.source.checkedOn} / ${record.retrievedOn}`);
    addTextRow(
      "Local file",
      `${record.image.filename} · ${record.image.mimeType} · ${String(record.image.widthPx)} × ${String(record.image.heightPx)} px · ${String(record.image.byteLength)} bytes`,
    );
    addTextRow("Modification", record.modification);
    addRow("SHA-256", record.image.sha256);
    addTextRow(
      "Repeat and presentation",
      `${presentationLabel(record.technical.presentation)}; repeat motif ${record.technical.repeatMotif}; ${tileLabel(record.technical.imageIsSeamlessTile)}. ${record.technical.repeatEvidence} ${record.technical.seamlessEvidence}`,
    );
    addTextRow(
      "Direction",
      `${record.technical.directionality}. ${record.technical.directionEvidence}`,
    );
    addTextRow("Curated uses", record.use.printUses.join(", "));
    addTextRow(
      "Garment families / piece roles",
      `${record.use.garmentFamilies.join(", ")} / ${record.use.pieceRoleGroups.join(", ")}`,
    );
    addTextRow(
      "Source notes",
      "Source and policy addresses are displayed as text only; this panel never fetches them.",
    );
    return details;
  }

  function createCard(record: ArtworkCatalogRecord, isSelected: boolean): HTMLElement {
    const card = document.createElement("article");
    card.className = "uiq-artwork-card";
    card.setAttribute("data-asset-id", record.assetId);

    const previewWrap = document.createElement("div");
    previewWrap.className = "uiq-artwork-preview";
    card.appendChild(previewWrap);

    const fallback = document.createElement("p");
    fallback.className = "uiq-artwork-fallback";
    setText(
      fallback,
      `Preview unavailable for ${record.image.filename}. The reference remains selectable; its file details are listed below.`,
    );
    fallback.hidden = true;
    previewWrap.appendChild(fallback);

    if (isSafeLocalImageUrl(record.image.localImageUrl)) {
      const image = document.createElement("img");
      image.className = "uiq-artwork-image";
      image.alt = `Reference image: ${record.title}`;
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", () => {
        image.hidden = true;
        image.removeAttribute("src");
        fallback.hidden = false;
      }, { signal: cardListeners.signal });
      image.src = record.image.localImageUrl;
      previewWrap.appendChild(image);
    } else {
      fallback.hidden = false;
    }

    const title = document.createElement("h3");
    title.className = "uiq-artwork-title";
    setText(title, record.title);
    card.appendChild(title);

    const description = document.createElement("p");
    description.className = "uiq-artwork-description";
    setText(description, record.description);
    card.appendChild(description);

    const categories = document.createElement("p");
    categories.className = "uiq-artwork-meta";
    setText(categories, `Categories: ${record.categories.join(", ")}`);
    card.appendChild(categories);

    const tags = document.createElement("p");
    tags.className = "uiq-artwork-meta";
    setText(tags, `Tags: ${record.tags.join(", ")}`);
    card.appendChild(tags);

    const sourceLine = document.createElement("p");
    sourceLine.className = "uiq-artwork-meta";
    setText(
      sourceLine,
      `Source: ${record.source.institution} · ${record.source.rightsLabel} · checked ${record.source.checkedOn}`,
    );
    card.appendChild(sourceLine);

    const presentationLine = document.createElement("p");
    presentationLine.className = "uiq-artwork-meta";
    setText(presentationLine, `Presentation: ${presentationLabel(record.technical.presentation)}`);
    card.appendChild(presentationLine);

    const dimensionsLine = document.createElement("p");
    dimensionsLine.className = "uiq-artwork-meta";
    setText(
      dimensionsLine,
      `Pixels: ${String(record.image.widthPx)} × ${String(record.image.heightPx)} px`,
    );
    card.appendChild(dimensionsLine);

    const repeatLine = document.createElement("p");
    repeatLine.className = "uiq-artwork-meta";
    setText(
      repeatLine,
      `Repeat: motif ${record.technical.repeatMotif}; ${tileLabel(record.technical.imageIsSeamlessTile)}. ${record.technical.repeatEvidence}`,
    );
    card.appendChild(repeatLine);

    const assessment = assessArtworkUse(record, assessmentUse);
    const assessmentBox = document.createElement("section");
    assessmentBox.className = "uiq-artwork-assessment";
    assessmentBox.setAttribute("data-level", assessment.level);
    assessmentBox.setAttribute("aria-label", `${printUseLabel(assessment.printUse)} suitability guidance`);
    card.appendChild(assessmentBox);

    const assessmentHeading = document.createElement("h4");
    assessmentHeading.className = "uiq-artwork-assessment-heading";
    setText(
      assessmentHeading,
      `${printUseLabel(assessment.printUse)} guidance: ${suitabilityLabel(assessment.level)}`,
    );
    assessmentBox.appendChild(assessmentHeading);

    const assessedSize = document.createElement("p");
    assessedSize.className = "uiq-artwork-meta";
    if (assessment.assessedWidthCm === null || assessment.assessedHeightCm === null) {
      setText(
        assessedSize,
        `Assessed at suggested size for ${printUseLabel(assessment.printUse)}: size unavailable. This is the catalog default, not your current placement.`,
      );
    } else {
      const pxPerCm = `about ${String(Math.floor(Number(assessment.estimatedPxPerCm)))} px/cm on the limiting axis`;
      setText(
        assessedSize,
        `Assessed at suggested size for ${printUseLabel(assessment.printUse)}: ${String(assessment.assessedWidthCm)} × ${String(assessment.assessedHeightCm)} cm (${pxPerCm}). This is the catalog default, not your current placement.`,
      );
    }
    assessmentBox.appendChild(assessedSize);

    const reason = document.createElement("p");
    reason.className = "uiq-artwork-reason";
    setText(reason, assessment.reason);
    assessmentBox.appendChild(reason);

    card.appendChild(createProvenanceDetails(record));

    const assetLine = document.createElement("p");
    assetLine.className = "uiq-artwork-meta";
    setText(assetLine, `Bundled asset ID: ${record.assetId}`);
    card.appendChild(assetLine);

    const chooseButton = document.createElement("button");
    chooseButton.type = "button";
    chooseButton.className = "uiq-artwork-choose";
    chooseButton.setAttribute("data-asset-id", record.assetId);
    chooseButton.title = `Choose ${record.title} (${record.assetId})`;
    chooseButton.setAttribute("aria-label", `Choose ${record.title} (${record.assetId})`);
    updateChooseButton(chooseButton, record, isSelected);
    chooseButtons.push({ button: chooseButton, record });
    chooseButton.addEventListener("click", () => {
      options.onSelect(record.assetId);
    }, { signal: cardListeners.signal });
    card.appendChild(chooseButton);

    return card;
  }

  function renderSelection(results: readonly ArtworkCatalogRecord[]): void {
    if (selectedId === null) {
      setText(
        selectionElement,
        "No reference selected. Choosing a card reports its asset ID only; browsing never applies artwork.",
      );
    } else {
      const known = catalog.find((item) => item.assetId === selectedId);
      if (!known) {
        setText(selectionElement, `Selected reference “${selectedId}” is not in this catalog.`);
      } else if (!results.some((item) => item.assetId === selectedId)) {
        setText(
          selectionElement,
          `Selected reference “${known.title}” (${selectedId}) is not in the current filtered results. Clear filters to see it. Selection is preserved.`,
        );
      } else {
        setText(selectionElement, `Selected: “${known.title}” (${selectedId}).`);
      }
    }

  }

  function renderResults(): void {
    const results = currentResults();
    if (catalog.length === 0) {
      setText(countElement, "No references in this catalog.");
    } else if (results.length === 0) {
      setText(countElement, `No references match the current search and filters (0 of ${String(catalog.length)} shown).`);
    } else {
      setText(countElement, `${String(results.length)} of ${String(catalog.length)} references shown.`);
    }
    renderSelection(results);
    cardListeners.abort();
    cardListeners = new window.AbortController();
    chooseButtons.length = 0;
    while (resultsElement.firstChild !== null) {
      resultsElement.removeChild(resultsElement.firstChild);
    }
    if (catalog.length === 0) {
      const empty = document.createElement("p");
      empty.className = "uiq-artwork-empty";
      setText(empty, "This catalog is empty. No references are available.");
      resultsElement.appendChild(empty);
      return;
    }
    if (results.length === 0) {
      const none = document.createElement("p");
      none.className = "uiq-artwork-empty";
      setText(
        none,
        "No artwork references match. Clear or broaden the search or filters; the catalog has not been changed.",
      );
      resultsElement.appendChild(none);
      return;
    }
    for (const record of results) {
      resultsElement.appendChild(createCard(record, record.assetId === selectedId));
    }
  }

  searchInput.addEventListener("input", () => {
    query = searchInput.value;
    renderResults();
  }, { signal: controlListeners.signal });
  categorySelect.addEventListener("change", () => {
    categoryFilter = categorySelect.value;
    renderResults();
  }, { signal: controlListeners.signal });
  familySelect.addEventListener("change", () => {
    familyFilter = familySelect.value;
    renderResults();
  }, { signal: controlListeners.signal });
  roleSelect.addEventListener("change", () => {
    roleFilter = roleSelect.value;
    renderResults();
  }, { signal: controlListeners.signal });
  printSelect.addEventListener("change", () => {
    const value = printSelect.value;
    if (value === "") {
      printFilter = "";
      assessmentUse = initialPrintUse;
    } else {
      printFilter = value;
      assessmentUse = value as ArtworkPrintUse;
    }
    renderResults();
  }, { signal: controlListeners.signal });
  clearButton.addEventListener("click", () => {
    query = "";
    categoryFilter = "";
    familyFilter = "";
    roleFilter = "";
    printFilter = "";
    assessmentUse = initialPrintUse;
    searchInput.value = "";
    categorySelect.value = "";
    familySelect.value = "";
    roleSelect.value = "";
    printSelect.value = "";
    renderResults();
  }, { signal: controlListeners.signal });

  host.appendChild(root);
  renderResults();

  return {
    setSelection(assetId: string | null): void {
      if (disposed) return;
      selectedId = assetId;
      // Selection must not remove focus, reload images or collapse provenance.
      renderSelection(currentResults());
      for (const { button, record } of chooseButtons) {
        updateChooseButton(button, record, record.assetId === selectedId);
      }
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      controlListeners.abort();
      cardListeners.abort();
      chooseButtons.length = 0;
      root.remove();
    },
  };
}
