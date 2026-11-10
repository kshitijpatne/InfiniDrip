// @vitest-environment jsdom

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { exportablePieces, mountApp, unmountApp, tankStarterTechPackForOutput, tankStarterRecipeForOutput, racerbackTankRecipeForOutput, n01TankTechPackForOutput, n01TankRecipeForOutput, squareNeckTankRecipeForOutput, vNeckTankTechPackForOutput, vNeckTankRecipeForOutput, croppedTankTechPackForOutput, croppedTankRecipeForOutput, longlineTankTechPackForOutput, longlineTankRecipeForOutput, shelfLinedTankTechPackForOutput, shelfLinedTankRecipeForOutput } from "./app";

import { GARMENTS, STANDARD_M, STRETCH_FABRICS, TANK, draftRecipeAtSize, notchesForRecipeOptions, type GarmentOptions, type GarmentRecipe, type Measurements } from "../drafting";

import { TANK_N05_ENTRY_ID, TANK_N07_ENTRY_ID, TANK_N08_SHELF_DROP_OPTION_ID, TANK_RACERBACK_BACK_CUT_IN_OPTION_ID, TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID } from "../drafting/tank";

import { blockPieces } from "../drafting/block";

import { edgeLength, pieceEdge } from "../drafting/piece";

import { exportA0Pdf, exportDxf, exportPdf, exportProjectorSvg, exportSvg } from "../export";

import * as teeDrafting from "../drafting/tshirt";

import { STARTER_REGISTRY, WOVEN_SHIRT_CLASSIC_BUTTON_FRONT_ENTRY_ID, WOVEN_SHIRT_RELAXED_BUTTON_FRONT_ENTRY_ID, WOVEN_SHIRT_OVERSIZED_LOOSE_DROP_ENTRY_ID, WOVEN_SHIRT_CROPPED_BOXY_ENTRY_ID, WOVEN_SHIRT_TUNIC_LONGLINE_ENTRY_ID, WOVEN_SHIRT_CAMP_COLLAR_ENTRY_ID, WOVEN_SHIRT_BAND_COLLAR_ENTRY_ID, WOVEN_SHIRT_DARTED_BLOUSE_ENTRY_ID } from "./starter-registry";

import { wovenShirtAllowances } from "../drafting/shirt";

function visiblePdfText(pdf: string): string {
  const streams = [...pdf.matchAll(/>>\nstream\n([\s\S]*?)\nendstream/g)].map((match) => match[1]!);
  return streams.flatMap((stream) =>
    [...stream.matchAll(/\(((?:[^()\\]|\\.)*)\) Tj/g)].map((match) => match[1]!.replace(/\\(.)/g, "$1")),
  ).join(" ");
}

function mount(options: Parameters<typeof mountApp>[1] = {}): HTMLDivElement {
  const root = document.createElement("div");
  mountApp(root, options);
  mountedRoots.add(root);
  return root;
}

type TrackedWindowListener = {
  readonly type: string;
  readonly listener: EventListenerOrEventListenerObject;
  readonly options?: boolean | AddEventListenerOptions;
};

const mountedRoots = new Set<HTMLDivElement>();

const trackedWindowListeners: TrackedWindowListener[] = [];

const addNativeWindowListener = window.addEventListener.bind(window);

const removeNativeWindowListener = window.removeEventListener.bind(window);

const clickId = (root: HTMLElement, id: string): void => {
    root.querySelector<HTMLElement>(`#${id}`)!.click();
};

const clickIfPresent = (root: HTMLElement, id: string): void => {
    root.querySelector<HTMLElement>(`#${id}`)?.click();
};

/** Navigate the real reviewed path used by export-writer tests. */
const reachExportStage = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-start");
    clickId(root, "journey-step-fit");
    clickId(root, "journey-next"); // accept the current Style choices → Check
    clickId(root, "journey-next"); // reviewed Check → Export
};

const reReviewAndReachExportStage = (root: HTMLElement): void => {
    clickId(root, "journey-step-fit");
    clickId(root, "journey-next");
    clickId(root, "view-check");
    clickId(root, "journey-next");
};

beforeEach(() => {
  trackedWindowListeners.length = 0;
  vi.spyOn(window, "addEventListener").mockImplementation((type, listener, options) => {
    trackedWindowListeners.push({ type, listener, options });
    addNativeWindowListener(type, listener, options);
  });
});

afterEach(() => {
  unmountApp();
  for (const { type, listener, options } of trackedWindowListeners) {
    removeNativeWindowListener(type, listener, options);
  }
  trackedWindowListeners.length = 0;
  for (const root of mountedRoots) root.remove();
  mountedRoots.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("EPIC-19 L02 starter binding", () => {

  it("rewrites only N01 Tank BOM placements and avoids inventing binding consumption", () => {
    const construction = ["Bind the neckline and both armholes with self-fabric or rib binding."];
    const knitTechPack: GarmentRecipe["techPack"] = {
      bom: [
        { material: "Cotton jersey, main", placement: "Body & sleeves", qty: "1.2 m" },
        { material: "Rib knit", placement: "Neckband", qty: "0.1 m" },
        { material: "Woven brand label", placement: "Centre back neck", qty: "1" },
      ],
      construction,
    };
    const wovenTechPack: GarmentRecipe["techPack"] = {
      bom: [
        { material: "Cotton woven, main", placement: "Front & back panels", qty: "1.2 m" },
        { material: "Self-fabric binding", placement: "Neckline & armholes", qty: "0.2 m" },
      ],
      construction,
    };

    expect(tankStarterTechPackForOutput(knitTechPack)).toEqual({
      bom: [
        { material: "Cotton jersey, main", placement: "Front & back panels", qty: "1.2 m" },
        {
          material: "Binding (self-fabric or rib)",
          placement: "Neckline & armholes",
          qty: "Not estimated; no binding template",
        },
        { material: "Woven brand label", placement: "Centre back neck", qty: "1" },
      ],
      construction,
    });
    expect(tankStarterTechPackForOutput(wovenTechPack).bom[1]).toEqual({
      material: "Binding (self-fabric or rib)",
      placement: "Neckline & armholes",
      qty: "Not estimated; no binding template",
    });
    expect(n01TankTechPackForOutput(knitTechPack)).toEqual(tankStarterTechPackForOutput(knitTechPack));
    expect(knitTechPack.bom[0]!.placement).toBe("Body & sleeves");
    expect(wovenTechPack.bom[1]!.qty).toBe("0.2 m");
  });

  it("adds the selected N03 cut-in to the Tank Tech Pack without estimating binding", () => {
    const knit = STRETCH_FABRICS.find((fabric) => fabric.name === "Cotton jersey")!;
    const options = { [TANK_RACERBACK_BACK_CUT_IN_OPTION_ID]: 4.5 };
    const output = racerbackTankRecipeForOutput(TANK, knit, options);
    const binding = output.techPack.bom.find((row) => row.placement === "Neckline & armholes");

    expect(binding?.qty).toBe("Not estimated; no binding template");
    expect(output.techPack.construction.join(" "))
      .toContain("Digital N03 back-armhole cut-in: 4.5 cm. Binding consumption is not estimated; no sewn tolerance is specified or validated.");
    expect(output.techPackForOptions!(options).construction.join(" "))
      .toContain("Digital N03 back-armhole cut-in: 4.5 cm.");
    expect(output.techPackForOptions!({}).construction.join(" ")).toContain("cut-in: unresolved.");
    expect(output.techPackForFabric).toBeUndefined();
    expect(racerbackTankRecipeForOutput({ ...TANK, techPackForFabric: undefined }, knit, options)
      .techPack.construction.join(" ")).toContain("Digital N03 back-armhole cut-in: 4.5 cm.");
    expect(TANK.techPackForFabric).toBeDefined();
  });

  it("keeps N04 Tech Pack materials and neckline finish unspecified while reflecting its software corner value", () => {
    const knit = STRETCH_FABRICS.find((fabric) => fabric.name === "Cotton jersey")!;
    const woven = STRETCH_FABRICS.find((fabric) => fabric.name === "Cotton woven")!;
    const options = { [TANK_SQUARE_NECK_CORNER_RADIUS_OPTION_ID]: 1 };
    const output = squareNeckTankRecipeForOutput(TANK, knit, options);
    const pack = output.techPackForOptions!(options);

    expect(output.label).toBe("Square-neck Tank");
    expect(pack.bom).toEqual([{
      material: "Not specified", placement: "Materials and trim", qty: "No sourcing or consumption estimate",
    }]);
    expect(pack.construction.join(" ")).toContain("Digital N04 square-corner easing: 1 cm.");
    expect(pack.construction.join(" ")).not.toMatch(/neckline|neckband|binding/i);
    expect(pack.constructionNotice).toContain("no facing or binding template");
    expect(pack.measurementSpecToleranceColumn).toBe(false);
    expect(pack.fitRecordPassColumn).toBe(false);
    expect(pack.fitRecordToleranceColumn).toBe(false);
    expect(output.techPackForOptions!({})?.construction.join(" ")).toContain("easing: unresolved");
    expect(squareNeckTankRecipeForOutput(TANK, woven, options).techPack.bom[0]?.qty)
      .toBe("No sourcing or consumption estimate");
    expect(squareNeckTankRecipeForOutput({ ...TANK, techPackForFabric: undefined }, knit, options)
      .techPack.construction.join(" ")).toContain("easing: 1 cm");
    expect(TANK.techPackForFabric).toBeDefined();
  });

  it("keeps the N05 V outline while withholding neckline finish and material claims", () => {
    const sourcePack: GarmentRecipe["techPack"] = {
      ...TANK.techPack,
      bom: [{ material: "Fabric", placement: "Neckband", qty: "0.3 m" }],
      construction: ["Join the shoulder seams, front to back.", "Close the side seams.", "Hem the body."],
    };
    const sanitized = vNeckTankTechPackForOutput(sourcePack);
    const knit = STRETCH_FABRICS.find((fabric) => fabric.name === "Cotton jersey")!;
    const woven = STRETCH_FABRICS.find((fabric) => fabric.name === "Cotton woven")!;
    const output = vNeckTankRecipeForOutput(TANK, knit);
    const fallback = vNeckTankRecipeForOutput({ ...TANK, techPackForFabric: undefined }, woven);

    expect(sanitized.bom).toEqual([{
      material: "Not specified",
      placement: "Materials and trim",
      qty: "No sourcing or consumption estimate",
    }]);
    expect(sanitized.construction).toEqual([
      "Digital N05 V-neck front profile; neckline finish unspecified.",
    ]);
    expect(sanitized.construction.join(" ")).not.toMatch(/join the shoulder seams|close the side seams|hem the body/i);
    expect(sourcePack.construction).toEqual([
      "Join the shoulder seams, front to back.",
      "Close the side seams.",
      "Hem the body.",
    ]);
    expect(sanitized.constructionNotice).toContain("no facing or binding template");
    expect(sanitized.measurementSpecToleranceColumn).toBe(false);
    expect(sanitized.fitRecordPassColumn).toBe(false);
    expect(sanitized.fitRecordToleranceColumn).toBe(false);
    expect(sanitized.fitRecordTitle).toBe("Digital Measurement Worksheet");
    expect(output.label).toBe("V-neck Tank");
    expect(output.poms.every((pom) => pom.tolerance === undefined)).toBe(true);
    expect(output.techPackForOptions!({})).toEqual(output.techPack);
    expect(output.techPackForFabric).toBeUndefined();
    expect(fallback.techPack.bom).toEqual(sanitized.bom);
    expect(fallback.techPackForFabric).toBeUndefined();
    expect(TANK_N05_ENTRY_ID).toBe("tank-v-neck-digital-v1");
    expect(TANK.techPackForFabric).toBeDefined();
  });

  it("keeps N06's Tech Pack digital-only without inheriting generic production material or sewing claims", () => {
    const sourcePack: GarmentRecipe["techPack"] = {
      ...TANK.techPack,
      bom: [
        { material: "Fabric", placement: "Body & sleeves", qty: "1.2 m" },
        { material: "Rib", placement: "Neckband", qty: "0.1 m" },
      ],
      construction: ["Join the shoulder seams.", "Bind the neckline and armholes.", "Hem the body."],
    };
    const sanitized = croppedTankTechPackForOutput(sourcePack);
    const knit = STRETCH_FABRICS.find((fabric) => fabric.name === "Cotton jersey")!;
    const output = croppedTankRecipeForOutput(TANK, knit);
    const fallback = croppedTankRecipeForOutput({ ...TANK, techPackForFabric: undefined }, knit);
    expect(sanitized.bom).toEqual([{
      material: "Not specified",
      placement: "Materials and trim",
      qty: "Not estimated",
    }]);
    expect(sanitized.construction).toEqual([
      "Digital N06 Cropped Tank body-length profile; crop placement and sewn construction unspecified.",
    ]);
    expect(sanitized.construction.join(" ")).not.toMatch(/join|bind|hem the body/i);
    expect(sanitized.constructionNotice).toContain("not a physical crop landmark");
    expect(sanitized.measurementSpecToleranceColumn).toBe(false);
    expect(sanitized.fitRecordPassColumn).toBe(false);
    expect(sanitized.fitRecordToleranceColumn).toBe(false);
    expect(sanitized.fitRecordTitle).toBe("Digital Measurement Worksheet");
    expect(output.label).toBe("Cropped Tank");
    expect(output.poms.every((pom) => pom.tolerance === undefined)).toBe(true);
    expect(output.techPackForOptions!({})).toEqual(output.techPack);
    expect(output.techPackForFabric).toBeUndefined();
    expect(fallback.techPack.bom).toEqual(sanitized.bom);
    expect(fallback.techPack.construction).toEqual(sanitized.construction);
    expect(fallback.techPackForFabric).toBeUndefined();
  });

  it("keeps N07 output digital-only without inherited Tank materials, sewing, tolerance, or fit claims", () => {
    const sourcePack: GarmentRecipe["techPack"] = {
      ...TANK.techPack,
      bom: [
        { material: "Fabric", placement: "Body & sleeves", qty: "1.2 m" },
        { material: "Rib", placement: "Neckband", qty: "0.1 m" },
      ],
      construction: ["Join the shoulder seams.", "Bind the neckline and armholes.", "Hem the body."],
    };
    const sanitized = longlineTankTechPackForOutput(sourcePack);
    const knit = STRETCH_FABRICS.find((fabric) => fabric.name === "Cotton jersey")!;
    const woven = STRETCH_FABRICS.find((fabric) => fabric.name === "Cotton woven")!;
    const output = longlineTankRecipeForOutput(TANK, knit);
    const fallback = longlineTankRecipeForOutput({ ...TANK, techPackForFabric: undefined }, woven);

    expect(sanitized.bom).toEqual([{
      material: "Not specified",
      placement: "Materials and trim",
      qty: "Not estimated",
    }]);
    expect(sanitized.construction).toEqual([
      "Digital N07 Longline Tank body-length profile; physical hem placement and sewn construction unspecified.",
    ]);
    expect(sanitized.construction.join(" ")).not.toMatch(/join the shoulder seams|bind the neckline|hem the body/i);
    expect(sanitized.constructionNotice).toContain("not a physical longline hem location");
    expect(sanitized.constructionNotice).toContain("production instruction are unspecified");
    expect(sanitized.measurementSpecNote).toContain("generic Tank size run is not a validated N07 grade");
    expect(sanitized.measurementSpecToleranceColumn).toBe(false);
    expect(sanitized.fitRecordStatusNote).toContain("Physical hem placement");
    expect(sanitized.fitRecordPassColumn).toBe(false);
    expect(sanitized.fitRecordToleranceColumn).toBe(false);
    expect(sanitized.fitRecordTitle).toBe("Digital Measurement Worksheet");
    expect(sourcePack.construction).toEqual(["Join the shoulder seams.", "Bind the neckline and armholes.", "Hem the body."]);
    expect(output.label).toBe("Longline Tank");
    expect(output.poms.every((pom) => pom.tolerance === undefined)).toBe(true);
    expect(output.techPackForOptions!({})).toEqual(output.techPack);
    expect(output.techPackForFabric).toBeUndefined();
    expect(fallback.techPack.bom).toEqual(sanitized.bom);
    expect(fallback.techPack.construction).toEqual(sanitized.construction);
    expect(fallback.techPackForFabric).toBeUndefined();
    expect(TANK_N07_ENTRY_ID).toBe("tank-longline-digital-v1");
    expect(TANK.techPackForFabric).toBeDefined();
  });

  it("keeps N08 output digital-only and reports the current software shelf offset", () => {
    const sourcePack: GarmentRecipe["techPack"] = {
      ...TANK.techPack,
      bom: [
        { material: "Cotton jersey", placement: "Body", qty: "1.2 m" },
        { material: "Elastic", placement: "Shelf", qty: "0.4 m" },
      ],
      construction: ["Sew elastic to the shelf.", "Bind the neckline and armholes.", "Hem the body."],
    };
    const options = { [TANK_N08_SHELF_DROP_OPTION_ID]: 14 };
    const sanitized = shelfLinedTankTechPackForOutput(sourcePack, options);
    const knit = STRETCH_FABRICS.find((fabric) => fabric.name === "Cotton jersey")!;
    const woven = STRETCH_FABRICS.find((fabric) => fabric.name === "Cotton woven")!;
    const output = shelfLinedTankRecipeForOutput(TANK, knit, options);
    const fallback = shelfLinedTankRecipeForOutput({ ...TANK, techPackForFabric: undefined }, woven, options);

    expect(sanitized.bom).toEqual([{
      material: "Not specified", placement: "Shell, shelf, elastic and trim", qty: "No sourcing or consumption estimate",
    }]);
    expect(sanitized.construction).toEqual([
      "Digital N08 panel set: shell front/back plus separate inner shelf front/back panels.",
      "Digital shelf hem below underarm: 14 cm below underarm (software); the lower-edge mark identifies the elastic-attachment edge only.",
    ]);
    expect(sanitized.construction.join(" ")).not.toMatch(/sew elastic|bind the neckline|hem the body/i);
    expect(sanitized.constructionNotice).toContain("Elastic width, cut length, tension, material, physical sewing method and production instructions are unspecified.");
    expect(sanitized.measurementSpecNote).toContain("generic Tank size run is not a validated N08 grade");
    expect(sanitized.measurementSpecToleranceColumn).toBe(false);
    expect(sanitized.fitRecordStatusNote).toContain("Physical support, fit, comfort, coverage, wear");
    expect(sanitized.fitRecordPassColumn).toBe(false);
    expect(sanitized.fitRecordToleranceColumn).toBe(false);
    expect(sanitized.fitRecordTitle).toBe("Digital Measurement Worksheet");
    expect(sourcePack.construction).toEqual(["Sew elastic to the shelf.", "Bind the neckline and armholes.", "Hem the body."]);
    expect(output.label).toBe("Shelf-lined Tank");
    expect(output.poms.every((pom) => pom.tolerance === undefined)).toBe(true);
    expect(output.techPackForOptions!({ [TANK_N08_SHELF_DROP_OPTION_ID]: 15 }).construction.join(" "))
      .toContain("15 cm below underarm (software)");
    expect(output.techPackForOptions!({}).construction.join(" ")).toContain("unresolved (software)");
    expect(output.techPackForFabric).toBeUndefined();
    expect(fallback.techPack.bom).toEqual(sanitized.bom);
    expect(fallback.techPack.construction).toEqual(sanitized.construction);
    expect(fallback.techPackForFabric).toBeUndefined();
  });

  it("resolves and freezes fabric-specific N01 Tech Pack content for export", () => {
    const tankRecipe = GARMENTS.find((candidate) => candidate.name === "tank")!;
    const knit = STRETCH_FABRICS.find((candidate) => candidate.name === "Cotton jersey")!;
    const woven = STRETCH_FABRICS.find((candidate) => candidate.name === "Cotton woven")!;
    const starterOutput = tankStarterRecipeForOutput(tankRecipe, knit);
    const knitOutput = n01TankRecipeForOutput(tankRecipe, knit);
    expect(starterOutput.techPack).toEqual(knitOutput.techPack);
    const wovenOutput = n01TankRecipeForOutput(tankRecipe, woven);
    const fallbackOutput = n01TankRecipeForOutput({ ...tankRecipe, techPackForFabric: undefined }, knit);

    expect(knitOutput.techPack.bom.find((row) => row.material === "Cotton jersey, main")?.placement)
      .toBe("Front & back panels");
    expect(wovenOutput.techPack.bom.find((row) => row.material === "Cotton woven, main")?.placement)
      .toBe("Front & back panels");
    expect(wovenOutput.techPack.bom.find((row) => row.placement === "Neckline & armholes")?.qty)
      .toBe("Not estimated; no binding template");
    expect(fallbackOutput.techPack.bom.find((row) => row.material === "Cotton jersey, main")?.placement)
      .toBe("Front & back panels");
    expect(knitOutput.techPackForFabric).toBeUndefined();
    expect(wovenOutput.techPackForFabric).toBeUndefined();
    expect(fallbackOutput.techPackForFabric).toBeUndefined();
  });

  it("opens editable Tee measurements and preserves starter identity and rendered output through save and reopen", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "garment-skirt");
    const candidate = root.querySelector<HTMLButtonElement>('[data-starter-entry-id="tee-classic-custom-v1"]')!;
    expect(candidate.disabled).toBe(false);
    delete candidate.dataset.starterEntryId;
    candidate.click();
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("start");
    candidate.dataset.starterEntryId = "tee-classic-custom-v1";
    candidate.click();

    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("B1 technical review approved for digital scope; physical validation not performed");
    const ease = root.querySelector<HTMLInputElement>('input[data-field="ease"]')!;
    const chestEase = root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')!;
    const length = root.querySelector<HTMLInputElement>('input[data-field="length"]')!;
    expect(ease.value).toBe("7");
    expect(chestEase.value).toBe("7");
    expect(length.min).toBe("59");
    expect(length.max).toBe("74");

    chestEase.value = "6.5";
    chestEase.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector<HTMLElement>("#error-option-chestEase")!.textContent).toContain("7");
    chestEase.value = "7";
    chestEase.dispatchEvent(new Event("input", { bubbles: true }));
    length.value = "75";
    length.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector<HTMLElement>("#error-length")!.textContent).toContain("supports 59–74 cm");
    length.value = "70";
    length.dispatchEvent(new Event("input", { bubbles: true }));
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "100";
    chest.dispatchEvent(new Event("input", { bubbles: true }));

    const rendered = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    clickId(root, "save-pattern");
    const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    expect(stored.workspace.starterOrigin).toMatchObject({
      entryId: "tee-classic-custom-v1",
      entryRevision: "2026-10-19.3",
      recipeId: "tee",
      configurationSnapshot: { targetStyle: "Classic tee", measurements: { ease: 7 }, options: { chestEase: 7 } },
    });

    const reopened = mount();
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("100");
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="ease"]')!.value).toBe("7");
    expect(reopened.querySelector<HTMLInputElement>('input[data-option="chestEase"]')!.value).toBe("7");
    expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="tee-classic-custom-v1"]')!.getAttribute("aria-pressed")).toBe("true");
    expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(rendered);
    clickId(reopened, "garment-skirt");
    expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
    clickId(reopened, "load-pattern");
    clickId(reopened, "workspace-confirm-accept");
    expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Tee Classic · custom measurements");
    expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="tee-classic-custom-v1"]')!.getAttribute("aria-pressed"))
      .toBe("true");
    expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(rendered);
  });

  it("opens the preconfigured T01 Tee, edits it, and preserves its origin and rendered output through save and reopen", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "starter-tee-classic-digital-v1");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("B1 technical review pending; physical validation not performed");
    const defaults: Record<string, string> = {
      chest: "100", shoulderWidth: "45", bicep: "38", length: "70",
      armholeDepth: "24", sleeveLength: "22", ease: "7",
    };
    for (const [field, value] of Object.entries(defaults)) {
      expect(root.querySelector<HTMLInputElement>(`input[data-field="${field}"]`)!.value).toBe(value);
    }
    expect(root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')!.value).toBe("7");
    clickId(root, "view-spec");
    const spec = root.querySelector<HTMLElement>("#canvas-host")!.innerHTML;
    expect(spec).toContain("<table");
    expect(spec).toContain("Modeled chest circumference");
    clickId(root, "view-pattern");
    const originalSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "102";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    expect(editedSvg).not.toBe(originalSvg);

    clickId(root, "save-pattern");
    const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    expect(stored.workspace.starterOrigin).toMatchObject({
      entryId: "tee-classic-digital-v1",
      entryRevision: "2026-10-20.1",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
      configurationSnapshot: {
        targetStyle: "Classic tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: { chestEase: 7 },
      },
    });

    const reopened = mount();
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("102");
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="shoulderWidth"]')!.value).toBe("45");
    expect(reopened.querySelector<HTMLInputElement>('input[data-option="chestEase"]')!.value).toBe("7");
    expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="tee-classic-digital-v1"]')!.getAttribute("aria-pressed")).toBe("true");
    expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Tee Classic · software defaults");
    expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(editedSvg);
    root.remove();
    reopened.remove();
    localStorage.clear();
  });

  it("selects T02 after T01 and preserves the Relaxed profile, modeled output, and origin through save and reopen", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "starter-tee-classic-digital-v1");
    clickId(root, "view-pattern");
    const classicSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;

    clickId(root, "starter-tee-relaxed-digital-v1");
    expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Relaxed tee");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Tee Relaxed · software defaults");
    const starterGuidance = root.querySelector("#guidance-host")!.textContent!;
    expect(starterGuidance).toContain("No body-material compatibility claim.");
    expect(starterGuidance).toContain("13 cm ease remains a product choice, not a fabric-derived recommendation.");
    expect(starterGuidance).not.toContain("7 cm ease");
    const defaults: Record<string, string> = {
      chest: "100", shoulderWidth: "45", bicep: "38", length: "70",
      armholeDepth: "24", sleeveLength: "22", ease: "13",
    };
    for (const [field, value] of Object.entries(defaults)) {
      expect(root.querySelector<HTMLInputElement>(`input[data-field="${field}"]`)!.value).toBe(value);
    }
    expect(root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')).toBeNull();
    expect(root.querySelector<HTMLElement>('[data-finished="chest"]')!.textContent).toBe("113 cm");
    expect(root.querySelector<HTMLButtonElement>('[data-starter-entry-id="tee-relaxed-digital-v1"]')!.getAttribute("aria-pressed"))
      .toBe("true");
    const relaxedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    expect(relaxedSvg).not.toBe(classicSvg);

    const ease = root.querySelector<HTMLInputElement>('input[data-field="ease"]')!;
    ease.value = "14";
    ease.dispatchEvent(new Event("input", { bubbles: true }));
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "102";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    expect(editedSvg).not.toBe(relaxedSvg);
    expect(root.querySelector<HTMLElement>('[data-finished="chest"]')!.textContent).toBe("116 cm");

    clickId(root, "save-pattern");
    const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    expect(stored.workspace.starterOrigin).toMatchObject({
      entryId: "tee-relaxed-digital-v1",
      entryRevision: "2026-10-20.1",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
      configurationSnapshot: {
        targetStyle: "Relaxed tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 13 },
        options: {},
      },
    });

    const reopened = mount();
    expect(reopened.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Relaxed tee");
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("102");
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="ease"]')!.value).toBe("14");
    expect(reopened.querySelector<HTMLInputElement>('input[data-option="chestEase"]')).toBeNull();
    expect(reopened.querySelector<HTMLElement>('[data-finished="chest"]')!.textContent).toBe("116 cm");
    expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="tee-relaxed-digital-v1"]')!.getAttribute("aria-pressed"))
      .toBe("true");
    expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Tee Relaxed · software defaults");
    expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(editedSvg);
    root.remove();
    reopened.remove();
    localStorage.clear();
  });

  it("selects W01, preserves edits and origin through save/reopen, and exports the authored profile", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${WOVEN_SHIRT_CLASSIC_BUTTON_FRONT_ENTRY_ID}`);

      expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Classic woven shirt");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Classic button-front Shirt · software defaults");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("B1 technical review pending; physical validation not performed");
      const defaultMeasurements: Record<string, string> = {
        neck: "40", chest: "100", shoulderWidth: "45", bicep: "38", length: "70",
        armholeDepth: "24", sleeveLength: "22", waist: "84", hip: "100", hipDepth: "20", ease: "13",
      };
      for (const [field, value] of Object.entries(defaultMeasurements)) {
        expect(root.querySelector<HTMLInputElement>(`input[data-field="${field}"]`)!.value).toBe(value);
      }
      const defaultOptions: Record<string, string> = {
        neckEase: "1", buttonCount: "7", buttonSpacing: "8", frontOverlap: "1.5", placketWidth: "3",
        standHeight: "2.5", collarLeafDepth: "6", yokeDepth: "10", pocketWidth: "12", pocketHeight: "13",
        sleeveBandDepth: "3", sideVentDepth: "3", hemTurn: "1",
      };
      for (const [option, value] of Object.entries(defaultOptions)) {
        expect(root.querySelector<HTMLInputElement>(`input[data-option="${option}"]`)!.value).toBe(value);
      }

      clickId(root, "view-pattern");
      expect(root.querySelector("#canvas-host")!.textContent).toContain("WOVEN FRONT");
      expect(root.querySelectorAll('[data-edge="woven-button"]')).toHaveLength(7);
      const initialSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      const buttonCount = root.querySelector<HTMLInputElement>('input[data-option="buttonCount"]')!;
      buttonCount.value = "5";
      buttonCount.dispatchEvent(new Event("input", { bubbles: true }));
      expect(buttonCount.value).toBe("5");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
        .toContain("supports 6–7 buttons");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

      buttonCount.value = "6";
      buttonCount.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelectorAll('[data-edge="woven-button"]')).toHaveLength(6);
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
        .not.toContain("supports 6–7 buttons");
      const ease = root.querySelector<HTMLInputElement>('input[data-field="ease"]')!;
      ease.value = "14";
      ease.dispatchEvent(new Event("input", { bubbles: true }));
      const length = root.querySelector<HTMLInputElement>('input[data-field="length"]')!;
      length.value = "72";
      length.dispatchEvent(new Event("input", { bubbles: true }));
      const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      expect(editedSvg).not.toBe(initialSvg);

      clickId(root, "view-spec");
      expect(root.querySelector<SVGSVGElement>("#canvas-host svg")).not.toBeNull();
      clickId(root, "save-pattern");
      const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        measurements: typeof STANDARD_M;
        garmentOptions: Record<string, Record<string, number>>;
        workspace: { starterOrigin: Record<string, unknown> };
      };
      expect(stored.measurements).toMatchObject({ ease: 14, length: 72 });
      expect(stored.garmentOptions["woven-shirt"]).toMatchObject({ buttonCount: 6 });
      expect(stored.workspace.starterOrigin).toMatchObject({
        entryId: WOVEN_SHIRT_CLASSIC_BUTTON_FRONT_ENTRY_ID,
        entryRevision: "2026-11-02.1",
        recipeId: "woven-shirt",
        recipeRevision: "woven-shirt-classic-button-front-v1",
        configurationSnapshot: {
          targetStyle: "Classic woven shirt",
          measurements: { neck: 40, chest: 100, length: 70, ease: 13 },
          options: { buttonCount: 7, placketWidth: 3, hemTurn: 1 },
        },
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Classic woven shirt");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="ease"]')!.value).toBe("14");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("72");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="buttonCount"]')!.value).toBe("6");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${WOVEN_SHIRT_CLASSIC_BUTTON_FRONT_ENTRY_ID}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(editedSvg);
      clickId(reopened, "view-spec");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")).not.toBeNull();

      reachExportStage(reopened);
      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) {
        clickId(reopened, id);
      }
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6), { timeout: 20000 });
      expect([...files.keys()].sort()).toEqual([
        "woven-shirt-M-A0.pdf", "woven-shirt-M.dxf", "woven-shirt-M.pdf", "woven-shirt-M.svg",
        "woven-shirt-projector.svg", "woven-shirt-techpack.pdf",
      ].sort());
      const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
      const options = stored.garmentOptions["woven-shirt"] as GarmentOptions;
      const pieces = blockPieces(recipe.draft(stored.measurements, options));
      expect(files.get("woven-shirt-M.svg")).toBe(
        exportSvg(pieces, recipe.allowances!, notchesForRecipeOptions(recipe, options)),
      );
      expect(files.get("woven-shirt-M.dxf")).toBe(exportDxf(pieces, recipe.allowances!));
      expect(files.get("woven-shirt-M.pdf")).toBe(exportPdf(
        pieces, recipe.allowances!, undefined, 1.0, recipe.tiledPdfLocalCoordinates === true,
      ));
      expect(files.get("woven-shirt-M-A0.pdf")).toBe(exportA0Pdf(
        pieces, recipe.allowances!, notchesForRecipeOptions(recipe, options), undefined, recipe.a0Overflow === true,
      ));
      expect(files.get("woven-shirt-projector.svg")).toBe(
        exportProjectorSvg(recipe, stored.measurements, options),
      );
      const techPack = visiblePdfText(files.get("woven-shirt-techpack.pdf")!);
      expect(techPack).toContain("Body length (HPS-hem)");
      expect(techPack).toContain("72.0 cm");
      expect(techPack).toContain("Draft estimates only; this is not a production BOM.");
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("selects W02, preserves edits and origin through save/reopen, and exports the authored profile", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${WOVEN_SHIRT_RELAXED_BUTTON_FRONT_ENTRY_ID}`);

      expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Relaxed woven shirt");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Relaxed button-front Shirt · software defaults");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("B1 technical review pending; physical validation not performed");
      const defaultMeasurements: Record<string, string> = {
        neck: "40", chest: "100", shoulderWidth: "45", bicep: "38", length: "72",
        armholeDepth: "24", sleeveLength: "22", waist: "84", hip: "100", hipDepth: "20", ease: "21",
      };
      for (const [field, value] of Object.entries(defaultMeasurements)) {
        expect(root.querySelector<HTMLInputElement>(`input[data-field="${field}"]`)!.value).toBe(value);
      }
      const defaultOptions: Record<string, string> = {
        neckEase: "1", buttonCount: "7", buttonSpacing: "8", frontOverlap: "1.5", placketWidth: "3",
        standHeight: "2.5", collarLeafDepth: "6", yokeDepth: "10", pocketWidth: "12", pocketHeight: "13",
        sleeveBandDepth: "3", sideVentDepth: "3", hemTurn: "1",
      };
      for (const [option, value] of Object.entries(defaultOptions)) {
        expect(root.querySelector<HTMLInputElement>(`input[data-option="${option}"]`)!.value).toBe(value);
      }

      clickId(root, "view-pattern");
      expect(root.querySelector("#canvas-host")!.textContent).toContain("WOVEN FRONT");
      expect(root.querySelectorAll('[data-edge="woven-button"]')).toHaveLength(7);
      const initialSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      const buttonCount = root.querySelector<HTMLInputElement>('input[data-option="buttonCount"]')!;
      buttonCount.value = "5";
      buttonCount.dispatchEvent(new Event("input", { bubbles: true }));
      expect(buttonCount.value).toBe("5");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
        .toContain("supports 6–7 buttons");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

      buttonCount.value = "6";
      buttonCount.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelectorAll('[data-edge="woven-button"]')).toHaveLength(6);
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
        .not.toContain("supports 6–7 buttons");
      const ease = root.querySelector<HTMLInputElement>('input[data-field="ease"]')!;
      ease.value = "22";
      ease.dispatchEvent(new Event("input", { bubbles: true }));
      const length = root.querySelector<HTMLInputElement>('input[data-field="length"]')!;
      length.value = "74";
      length.dispatchEvent(new Event("input", { bubbles: true }));
      const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      expect(editedSvg).not.toBe(initialSvg);

      clickId(root, "view-spec");
      expect(root.querySelector<SVGSVGElement>("#canvas-host svg")).not.toBeNull();
      clickId(root, "save-pattern");
      const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        measurements: typeof STANDARD_M;
        garmentOptions: Record<string, Record<string, number>>;
        workspace: { starterOrigin: Record<string, unknown> };
      };
      expect(stored.measurements).toMatchObject({ ease: 22, length: 74 });
      expect(stored.garmentOptions["woven-shirt"]).toMatchObject({ buttonCount: 6 });
      expect(stored.workspace.starterOrigin).toMatchObject({
        entryId: WOVEN_SHIRT_RELAXED_BUTTON_FRONT_ENTRY_ID,
        entryRevision: "2026-11-02.1",
        recipeId: "woven-shirt",
        recipeRevision: "woven-shirt-relaxed-button-front-v1",
        configurationSnapshot: {
          targetStyle: "Relaxed woven shirt",
          measurements: { neck: 40, chest: 100, length: 72, ease: 21 },
          options: { buttonCount: 7, placketWidth: 3, hemTurn: 1 },
        },
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Relaxed woven shirt");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="ease"]')!.value).toBe("22");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("74");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="buttonCount"]')!.value).toBe("6");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${WOVEN_SHIRT_RELAXED_BUTTON_FRONT_ENTRY_ID}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(editedSvg);
      clickId(reopened, "view-spec");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")).not.toBeNull();

      reachExportStage(reopened);
      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) {
        clickId(reopened, id);
      }
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6), { timeout: 20000 });
      expect([...files.keys()].sort()).toEqual([
        "woven-shirt-M-A0.pdf", "woven-shirt-M.dxf", "woven-shirt-M.pdf", "woven-shirt-M.svg",
        "woven-shirt-projector.svg", "woven-shirt-techpack.pdf",
      ].sort());
      const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
      const options = stored.garmentOptions["woven-shirt"] as GarmentOptions;
      const pieces = blockPieces(recipe.draft(stored.measurements, options));
      expect(files.get("woven-shirt-M.svg")).toBe(
        exportSvg(pieces, recipe.allowances!, notchesForRecipeOptions(recipe, options)),
      );
      expect(files.get("woven-shirt-M.dxf")).toBe(exportDxf(pieces, recipe.allowances!));
      expect(files.get("woven-shirt-M.pdf")).toBe(exportPdf(
        pieces, recipe.allowances!, undefined, 1.0, recipe.tiledPdfLocalCoordinates === true,
      ));
      expect(files.get("woven-shirt-M-A0.pdf")).toBe(exportA0Pdf(
        pieces, recipe.allowances!, notchesForRecipeOptions(recipe, options), undefined, recipe.a0Overflow === true,
      ));
      expect(files.get("woven-shirt-projector.svg")).toBe(
        exportProjectorSvg(recipe, stored.measurements, options),
      );
      const techPack = visiblePdfText(files.get("woven-shirt-techpack.pdf")!);
      expect(techPack).toContain("Body length (HPS-hem)");
      expect(techPack).toContain("74.0 cm");
      expect(techPack).toContain("Draft estimates only; this is not a production BOM.");
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("selects W08, preserves dart identity and geometry through invalid recovery, save/reopen and project reload", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${WOVEN_SHIRT_DARTED_BLOUSE_ENTRY_ID}`);

      expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Relaxed woven shirt");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Darted blouse · software defaults");
      expect(root.querySelector<HTMLInputElement>('input[data-option="bustDartIntakeCm"]')!.value).toBe("4");
      expect(root.querySelector<HTMLInputElement>('input[data-option="bustDartTargetAcrossFrontPercent"]')!.value).toBe("55");
      expect(root.querySelector<HTMLInputElement>('input[data-option="bustDartTargetFromUnderarmToHemPercent"]')!.value).toBe("28");

      clickId(root, "assembled-preview-toggle");
      const assembledFront = root.querySelector<SVGSVGElement>("#garment-host svg")!
        .querySelector('[data-garment-detail="woven-shirt"][data-position="front"]')!;
      expect(assembledFront.querySelectorAll('[data-edge="option-bustDartLeg"]')).toHaveLength(4);
      expect(assembledFront.querySelector('[data-dart-side="right"][data-dart-leg="upper"]')).not.toBeNull();
      expect(assembledFront.querySelector('[data-dart-side="left"][data-dart-leg="lower"]')).not.toBeNull();
      clickId(root, "assembled-preview-toggle");

      clickId(root, "view-pattern");
      const initialSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      expect(initialSvg).toContain('data-pattern-mark-name="bustDartUpperLeg"');
      expect(initialSvg).toContain('data-pattern-mark-name="bustDartLowerLeg"');
      const intake = root.querySelector<HTMLInputElement>('input[data-option="bustDartIntakeCm"]')!;
      intake.value = "4.25";
      intake.dispatchEvent(new Event("input", { bubbles: true }));
      expect(intake.value).toBe("4.25");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("0.5 cm increments");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

      intake.value = "4";
      intake.dispatchEvent(new Event("input", { bubbles: true }));
      const across = root.querySelector<HTMLInputElement>('input[data-option="bustDartTargetAcrossFrontPercent"]')!;
      across.value = "80";
      across.dispatchEvent(new Event("input", { bubbles: true }));
      expect(across.value).toBe("80");
      expect(root.querySelector<HTMLInputElement>('input[data-option="bustDartIntakeCm"]')!.value).toBe("4");
      expect(root.querySelector<HTMLElement>("#canvas-host [data-render-failed]")).toBeNull();
      expect(root.querySelector<SVGSVGElement>("#canvas-host svg")).not.toBeNull();
      expect(root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).not.toContain("bustDartUpperLeg");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
        .toContain("cannot be placed inside the current front panel");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

      const recoveredIntake = root.querySelector<HTMLInputElement>('input[data-option="bustDartIntakeCm"]')!;
      recoveredIntake.value = "0.5";
      recoveredIntake.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
        .not.toContain("cannot be placed inside the current front panel");
      expect(root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toContain("bustDartUpperLeg");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

      const editedIntake = root.querySelector<HTMLInputElement>('input[data-option="bustDartIntakeCm"]')!;
      editedIntake.value = "4.5";
      editedIntake.dispatchEvent(new Event("input", { bubbles: true }));
      const editedAcross = root.querySelector<HTMLInputElement>('input[data-option="bustDartTargetAcrossFrontPercent"]')!;
      editedAcross.value = "56";
      editedAcross.dispatchEvent(new Event("input", { bubbles: true }));
      const vertical = root.querySelector<HTMLInputElement>('input[data-option="bustDartTargetFromUnderarmToHemPercent"]')!;
      vertical.value = "30";
      vertical.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).not.toContain("0.5 cm increments");
      const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      expect(editedSvg).not.toBe(initialSvg);

      clickId(root, "save-pattern");
      const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        measurements: typeof STANDARD_M;
        garmentOptions: Record<string, Record<string, number>>;
        workspace: { starterOrigin: Record<string, unknown> };
      };
      expect(stored.garmentOptions["woven-shirt"]).toMatchObject({
        bustDartIntakeCm: 4.5,
        bustDartTargetAcrossFrontPercent: 56,
        bustDartTargetFromUnderarmToHemPercent: 30,
      });
      expect(stored.workspace.starterOrigin).toMatchObject({
        entryId: WOVEN_SHIRT_DARTED_BLOUSE_ENTRY_ID,
        recipeId: "woven-shirt",
        recipeRevision: "woven-shirt-darted-blouse-v1",
        configurationSnapshot: {
          targetStyle: "Relaxed woven shirt",
          options: {
            bustDartIntakeCm: 4,
            bustDartTargetAcrossFrontPercent: 55,
            bustDartTargetFromUnderarmToHemPercent: 28,
          },
        },
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="bustDartIntakeCm"]')!.value).toBe("4.5");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="bustDartTargetAcrossFrontPercent"]')!.value).toBe("56");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="bustDartTargetFromUnderarmToHemPercent"]')!.value).toBe("30");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${WOVEN_SHIRT_DARTED_BLOUSE_ENTRY_ID}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(editedSvg);

      clickId(reopened, "garment-polo");
      clickId(reopened, "garment-skirt");
      clickId(reopened, "load-pattern");
      clickId(reopened, "workspace-confirm-accept");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${WOVEN_SHIRT_DARTED_BLOUSE_ENTRY_ID}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="bustDartIntakeCm"]')!.value).toBe("4.5");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(editedSvg);

      reachExportStage(reopened);
      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) {
        clickId(reopened, id);
      }
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6), { timeout: 20000 });
      expect([...files.keys()].sort()).toEqual([
        "woven-shirt-M-A0.pdf", "woven-shirt-M.dxf", "woven-shirt-M.pdf", "woven-shirt-M.svg",
        "woven-shirt-projector.svg", "woven-shirt-techpack.pdf",
      ].sort());
      const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
      const options = stored.garmentOptions["woven-shirt"] as GarmentOptions;
      const pieces = blockPieces(recipe.draft(stored.measurements, options));
      expect(files.get("woven-shirt-M.svg")).toBe(
        exportSvg(pieces, recipe.allowances!, notchesForRecipeOptions(recipe, options)),
      );
      expect(files.get("woven-shirt-M.dxf")).toBe(exportDxf(pieces, recipe.allowances!));
      expect(files.get("woven-shirt-M.pdf")).toBe(exportPdf(
        pieces, recipe.allowances!, undefined, 1.0, recipe.tiledPdfLocalCoordinates === true,
      ));
      expect(files.get("woven-shirt-M-A0.pdf")).toBe(exportA0Pdf(
        pieces, recipe.allowances!, notchesForRecipeOptions(recipe, options), undefined, recipe.a0Overflow === true,
      ));
      expect(files.get("woven-shirt-projector.svg")).toBe(exportProjectorSvg(recipe, stored.measurements, options));
      expect(visiblePdfText(files.get("woven-shirt-techpack.pdf")!)).toContain("marked side bust-dart legs together");
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("selects W03, preserves its shoulder controls through save/reopen, and exports all six digital formats", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-" + WOVEN_SHIRT_OVERSIZED_LOOSE_DROP_ENTRY_ID);

      expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Oversized loose-drop woven shirt");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Oversized loose-drop Shirt · software defaults");
      const defaultMeasurements: Record<string, string> = {
        neck: "40", chest: "100", shoulderWidth: "45", bicep: "38", length: "70",
        armholeDepth: "24", sleeveLength: "22", waist: "84", hip: "100", hipDepth: "20", ease: "28",
      };
      for (const [field, value] of Object.entries(defaultMeasurements)) {
        expect(root.querySelector<HTMLInputElement>('input[data-field="' + field + '"]')!.value).toBe(value);
      }
      const defaultOptions: Record<string, string> = {
        neckEase: "1", buttonCount: "7", buttonSpacing: "8", frontOverlap: "1.5", placketWidth: "3",
        standHeight: "2.5", collarLeafDepth: "6", yokeDepth: "10", pocketWidth: "12", pocketHeight: "13",
        sleeveBandDepth: "3", sideVentDepth: "3", hemTurn: "1", shoulderExtension: "4", shoulderDrop: "3",
      };
      for (const [option, value] of Object.entries(defaultOptions)) {
        expect(root.querySelector<HTMLInputElement>('input[data-option="' + option + '"]')!.value).toBe(value);
      }

      clickId(root, "view-flat");
      expect(root.querySelector("#canvas-host")!.textContent).not.toContain("Shoulder extension is inactive for the selected style");
      clickId(root, "view-pattern");
      expect(root.querySelector("#canvas-host")!.textContent).toContain("WOVEN FRONT");
      const initialSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      const extension = root.querySelector<HTMLInputElement>('input[data-option="shoulderExtension"]')!;
      extension.value = "10";
      extension.dispatchEvent(new Event("input", { bubbles: true }));
      expect(extension.value).toBe("10");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("supports 2–8 cm");

      extension.value = "8";
      extension.dispatchEvent(new Event("input", { bubbles: true }));
      const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
      const shoulderWidth = root.querySelector<HTMLInputElement>('input[data-field="shoulderWidth"]')!;
      const ease = root.querySelector<HTMLInputElement>('input[data-field="ease"]')!;
      chest.value = "60";
      chest.dispatchEvent(new Event("input", { bubbles: true }));
      shoulderWidth.value = "60";
      shoulderWidth.dispatchEvent(new Event("input", { bubbles: true }));
      ease.value = "25";
      ease.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("reaches the underarm width");

      chest.value = "100";
      chest.dispatchEvent(new Event("input", { bubbles: true }));
      shoulderWidth.value = "45";
      shoulderWidth.dispatchEvent(new Event("input", { bubbles: true }));
      ease.value = "30";
      ease.dispatchEvent(new Event("input", { bubbles: true }));
      extension.value = "5";
      extension.dispatchEvent(new Event("input", { bubbles: true }));
      const drop = root.querySelector<HTMLInputElement>('input[data-option="shoulderDrop"]')!;
      drop.value = "3.5";
      drop.dispatchEvent(new Event("input", { bubbles: true }));
      const length = root.querySelector<HTMLInputElement>('input[data-field="length"]')!;
      length.value = "71";
      length.dispatchEvent(new Event("input", { bubbles: true }));
      const bicep = root.querySelector<HTMLInputElement>('input[data-field="bicep"]')!;
      bicep.value = "40";
      bicep.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("Bicep circumference");
      bicep.value = "37";
      bicep.dispatchEvent(new Event("input", { bubbles: true }));
      const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      expect(editedSvg).not.toBe(initialSvg);

      clickId(root, "view-spec");
      clickId(root, "save-pattern");
      const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        measurements: typeof STANDARD_M;
        garmentOptions: Record<string, Record<string, number>>;
        workspace: { starterOrigin: Record<string, unknown> };
      };
      expect(stored.measurements).toMatchObject({ bicep: 37, ease: 30, length: 71 });
      expect(stored.garmentOptions["woven-shirt"]).toMatchObject({ shoulderExtension: 5, shoulderDrop: 3.5 });
      expect(stored.workspace.starterOrigin).toMatchObject({
        entryId: WOVEN_SHIRT_OVERSIZED_LOOSE_DROP_ENTRY_ID,
        entryRevision: "2026-11-02.1",
        recipeId: "woven-shirt",
        recipeRevision: "woven-shirt-oversized-loose-drop-v1",
        configurationSnapshot: {
          targetStyle: "Oversized loose-drop woven shirt",
          measurements: { length: 70, ease: 28 },
          options: { shoulderExtension: 4, shoulderDrop: 3 },
        },
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Oversized loose-drop woven shirt");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="ease"]')!.value).toBe("30");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("71");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="shoulderExtension"]')!.value).toBe("5");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="shoulderDrop"]')!.value).toBe("3.5");
      expect(reopened.querySelector<HTMLButtonElement>("[data-starter-entry-id=" + JSON.stringify(WOVEN_SHIRT_OVERSIZED_LOOSE_DROP_ENTRY_ID) + "]")!.getAttribute("aria-pressed")).toBe("true");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(editedSvg);
      clickId(reopened, "view-spec");

      reachExportStage(reopened);
      const reopenedExtension = reopened.querySelector<HTMLInputElement>('input[data-option="shoulderExtension"]')!;
      const reopenedChest = reopened.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
      const reopenedShoulderWidth = reopened.querySelector<HTMLInputElement>('input[data-field="shoulderWidth"]')!;
      const reopenedEase = reopened.querySelector<HTMLInputElement>('input[data-field="ease"]')!;
      const reopenedBicep = reopened.querySelector<HTMLInputElement>('input[data-field="bicep"]')!;
      const exportButton = reopened.querySelector<HTMLButtonElement>("#export-svg")!;
      expect(exportButton.disabled).toBe(false);

      reopenedExtension.value = "10";
      reopenedExtension.dispatchEvent(new Event("input", { bubbles: true }));
      expect(reopened.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("supports 2–8 cm");
      expect(exportButton.disabled).toBe(true);
      reopenedExtension.value = "5";
      reopenedExtension.dispatchEvent(new Event("input", { bubbles: true }));
      reReviewAndReachExportStage(reopened);
      expect(exportButton.disabled).toBe(false);

      reopenedExtension.value = "8";
      reopenedExtension.dispatchEvent(new Event("input", { bubbles: true }));
      reopenedChest.value = "60";
      reopenedChest.dispatchEvent(new Event("input", { bubbles: true }));
      reopenedShoulderWidth.value = "60";
      reopenedShoulderWidth.dispatchEvent(new Event("input", { bubbles: true }));
      reopenedEase.value = "25";
      reopenedEase.dispatchEvent(new Event("input", { bubbles: true }));
      expect(reopened.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("reaches the underarm width");
      expect(exportButton.disabled).toBe(true);
      reopenedChest.value = "100";
      reopenedChest.dispatchEvent(new Event("input", { bubbles: true }));
      reopenedShoulderWidth.value = "45";
      reopenedShoulderWidth.dispatchEvent(new Event("input", { bubbles: true }));
      reopenedEase.value = "30";
      reopenedEase.dispatchEvent(new Event("input", { bubbles: true }));
      reopenedExtension.value = "5";
      reopenedExtension.dispatchEvent(new Event("input", { bubbles: true }));
      reReviewAndReachExportStage(reopened);
      expect(exportButton.disabled).toBe(false);

      reopenedBicep.value = "40";
      reopenedBicep.dispatchEvent(new Event("input", { bubbles: true }));
      expect(reopened.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("Bicep circumference");
      expect(exportButton.disabled).toBe(true);
      reopenedBicep.value = "37";
      reopenedBicep.dispatchEvent(new Event("input", { bubbles: true }));
      reReviewAndReachExportStage(reopened);
      expect(exportButton.disabled).toBe(false);
      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) clickId(reopened, id);
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6), { timeout: 20000 });
      expect([...files.keys()].sort()).toEqual([
        "woven-shirt-M-A0.pdf", "woven-shirt-M.dxf", "woven-shirt-M.pdf", "woven-shirt-M.svg",
        "woven-shirt-projector.svg", "woven-shirt-techpack.pdf",
      ].sort());
      const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
      const options = stored.garmentOptions["woven-shirt"] as GarmentOptions;
      const pieces = blockPieces(recipe.draft(stored.measurements, options));
      expect(files.get("woven-shirt-M.svg")).toBe(exportSvg(pieces, recipe.allowances!, notchesForRecipeOptions(recipe, options)));
      expect(files.get("woven-shirt-M.dxf")).toBe(exportDxf(pieces, recipe.allowances!));
      expect(files.get("woven-shirt-M.pdf")).toBe(exportPdf(pieces, recipe.allowances!, undefined, 1.0, recipe.tiledPdfLocalCoordinates === true));
      expect(files.get("woven-shirt-M-A0.pdf")).toBe(exportA0Pdf(pieces, recipe.allowances!, notchesForRecipeOptions(recipe, options), undefined, recipe.a0Overflow === true));
      const w03ProjectorNote = "W03 grade is not validated.";
      expect(files.get("woven-shirt-projector.svg")).toBe(exportProjectorSvg(recipe, stored.measurements, options, undefined, [], w03ProjectorNote));
      const projectorText = [...new DOMParser().parseFromString(files.get("woven-shirt-projector.svg")!, "image/svg+xml").getElementsByTagName("text")]
        .map((element) => element.textContent).join(" ");
      expect(projectorText).toContain(w03ProjectorNote);
      const techPack = visiblePdfText(files.get("woven-shirt-techpack.pdf")!);
      expect(techPack).toContain("Body length (HPS-hem)");
      expect(techPack).toContain("71.0 cm");
      expect(techPack).toContain("Multi-size values in these whole-run files have not been validated for W03 grading");
      expect(techPack).toContain("Draft estimates only; this is not a production BOM.");
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("selects W05, preserves its longline identity through save/reopen, and exports six distinct digital files", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-" + WOVEN_SHIRT_TUNIC_LONGLINE_ENTRY_ID);

      expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Longline woven shirt");
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Tunic / Longline Woven Shirt");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Tunic / Longline Woven Shirt · software defaults");
      expect(root.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("90");
      expect(root.querySelector<HTMLInputElement>('input[data-field="ease"]')!.value).toBe("18");
      expect(root.querySelector<HTMLInputElement>('input[data-option="sideVentDepth"]')!.value).toBe("3");
      expect(root.querySelector<HTMLInputElement>('input[data-option="hemTurn"]')!.value).toBe("1");
      expect(root.querySelector<HTMLInputElement>('input[data-option="shoulderExtension"]')).toBeNull();
      expect(root.querySelector<HTMLInputElement>('input[data-option="boxySideProfile"]')).toBeNull();

      clickId(root, "view-pattern");
      const initialSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      const length = root.querySelector<HTMLInputElement>('input[data-field="length"]')!;
      length.value = "89";
      length.dispatchEvent(new Event("input", { bubbles: true }));
      const vent = root.querySelector<HTMLInputElement>('input[data-option="sideVentDepth"]')!;
      vent.value = "4.5";
      vent.dispatchEvent(new Event("input", { bubbles: true }));
      const hem = root.querySelector<HTMLInputElement>('input[data-option="hemTurn"]')!;
      hem.value = "1.5";
      hem.dispatchEvent(new Event("input", { bubbles: true }));
      const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      expect(editedSvg).not.toBe(initialSvg);

      clickId(root, "view-spec");
      clickId(root, "save-pattern");
      const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        measurements: typeof STANDARD_M;
        garmentOptions: Record<string, GarmentOptions>;
        workspace: { starterOrigin: Record<string, unknown> };
      };
      expect(stored.measurements).toMatchObject({ length: 89, ease: 18 });
      expect(stored.garmentOptions["woven-shirt"]).toMatchObject({ sideVentDepth: 4.5, hemTurn: 1.5 });
      expect(stored.workspace.starterOrigin).toMatchObject({
        entryId: WOVEN_SHIRT_TUNIC_LONGLINE_ENTRY_ID,
        entryRevision: "2026-11-03.1",
        recipeId: "woven-shirt",
        recipeRevision: "woven-shirt-tunic-longline-v1",
        configurationSnapshot: {
          targetStyle: "Longline woven shirt",
          measurements: { length: 90, ease: 18 },
          options: { sideVentDepth: 3, hemTurn: 1 },
        },
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Longline woven shirt");
      expect(reopened.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Tunic / Longline Woven Shirt");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("89");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="sideVentDepth"]')!.value).toBe("4.5");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="hemTurn"]')!.value).toBe("1.5");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(editedSvg);
      clickId(reopened, "view-spec");
      clickIfPresent(reopened, "welcome-start");
      clickId(reopened, "journey-step-fit");
      clickId(reopened, "journey-next");
      const outputNext = reopened.querySelector<HTMLElement>("#journey-next");
      expect(outputNext, `W05 should pass its Check stage. Journey: ${reopened.querySelector<HTMLElement>("#journey-host")?.textContent}; guidance: ${reopened.querySelector<HTMLElement>("#guidance-host")?.textContent}`).not.toBeNull();
      outputNext!.click();

      const exportButton = reopened.querySelector<HTMLButtonElement>("#export-svg")!;
      const reopenedVent = reopened.querySelector<HTMLInputElement>('input[data-option="sideVentDepth"]')!;
      reopenedVent.value = "4.25";
      reopenedVent.dispatchEvent(new Event("input", { bubbles: true }));
      expect(reopenedVent.value).toBe("4.25");
      expect(reopened.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("0.5 cm increments");
      expect(exportButton.disabled).toBe(true);
      reopenedVent.value = "4.5";
      reopenedVent.dispatchEvent(new Event("input", { bubbles: true }));
      reReviewAndReachExportStage(reopened);
      expect(exportButton.disabled).toBe(false);

      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) {
        clickId(reopened, id);
      }
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6), { timeout: 20000 });
      expect([...files.keys()].sort()).toEqual([
        "woven-shirt-tunic-longline-M-A0.pdf", "woven-shirt-tunic-longline-M.dxf", "woven-shirt-tunic-longline-M.pdf",
        "woven-shirt-tunic-longline-M.svg", "woven-shirt-tunic-longline-projector.svg", "woven-shirt-tunic-longline-techpack.pdf",
      ].sort());

      const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
      const options = stored.garmentOptions["woven-shirt"]!;
      const pieces = blockPieces(recipe.draft(stored.measurements, options));
      for (const lengthValue of [82, 100]) {
        for (const ventDepth of [0, 8]) {
          for (const hemTurn of [0.7, 2]) {
            const boundaryOptions = { ...options, sideVentDepth: ventDepth, hemTurn };
            const boundaryBlock = recipe.draft({ ...stored.measurements, length: lengthValue }, boundaryOptions);
            for (const role of ["front", "back"] as const) {
              const bodyPiece = boundaryBlock.roles[role];
              expect(pieceEdge(bodyPiece, "hem").kind).toBe("curve");
              if (ventDepth === 0) {
                expect(bodyPiece.edges.some((edge) => edge.name === "vent")).toBe(false);
              } else {
                expect(edgeLength(pieceEdge(bodyPiece, "vent"))).toBe(ventDepth);
              }
            }
            expect(wovenShirtAllowances(hemTurn).byPieceEdge).toMatchObject({
              "woven front": { hem: hemTurn }, "woven back lower": { hem: hemTurn },
            });
          }
        }
      }
      expect(files.get("woven-shirt-tunic-longline-M.svg")).toBe(exportSvg(
        pieces, wovenShirtAllowances(options.hemTurn), notchesForRecipeOptions(recipe, options),
      ));
      expect(files.get("woven-shirt-tunic-longline-M.dxf")).toBe(exportDxf(pieces, wovenShirtAllowances(options.hemTurn)));
      expect(files.get("woven-shirt-tunic-longline-M.pdf")).toBe(exportPdf(
        pieces, wovenShirtAllowances(options.hemTurn), undefined, 1.0, recipe.tiledPdfLocalCoordinates === true,
      ));
      expect(files.get("woven-shirt-tunic-longline-M-A0.pdf")).toBe(exportA0Pdf(
        pieces, wovenShirtAllowances(options.hemTurn), notchesForRecipeOptions(recipe, options), undefined,
        recipe.a0Overflow === true,
      ));
      const projector = new DOMParser().parseFromString(files.get("woven-shirt-tunic-longline-projector.svg")!, "image/svg+xml");
      const projectorText = [...projector.getElementsByTagName("text")].map((element) => element.textContent).join(" ");
      expect(projectorText).toContain("Tunic / Longline Woven Shirt");
      expect(projectorText).toContain("W05 grade is not validated.");
      const techPack = visiblePdfText(files.get("woven-shirt-tunic-longline-techpack.pdf")!);
      expect(techPack).toContain("Digital W05 Tunic / Longline Woven Shirt pattern");
      expect(techPack).toContain("90 cm modeled HPS-to-hem length and 18 cm shared ease");
      expect(techPack).toContain("89.0 cm");
      expect(techPack).toContain("not a validated W05 grade");
      expect(techPack).toContain("Draft estimates only; this is not a production BOM.");
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("selects W06 and preserves the standless collar identity, depth, and pattern through save/reopen", () => {
    localStorage.clear();
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-" + WOVEN_SHIRT_CAMP_COLLAR_ENTRY_ID);
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Camp-collar Woven Shirt");
      expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Relaxed woven shirt");
      expect(root.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("72");
      expect(root.querySelector<HTMLInputElement>('input[data-field="ease"]')!.value).toBe("21");
      expect(root.querySelector<HTMLInputElement>('input[data-option="campCollarDepth"]')!.value).toBe("6");
      expect(root.querySelector<HTMLInputElement>('input[data-option="standHeight"]')).toBeNull();
      expect(root.querySelector<HTMLInputElement>('input[data-option="collarLeafDepth"]')).toBeNull();
      expect(root.querySelector<HTMLElement>('[data-option-help="option-buttonCount"]')?.textContent)
        .toContain("no additional stand button");

      clickId(root, "assembled-preview-toggle");
      const assembled = root.querySelector<SVGSVGElement>("#garment-host svg")!;
      const initialAssembled = assembled.innerHTML;
      expect(initialAssembled).not.toMatch(/NaN|Infinity/);
      expect(initialAssembled).toContain('data-edge="option-campCollarDepth"');
      const campCollarDepth = root.querySelector<HTMLInputElement>('input[data-option="campCollarDepth"]')!;
      campCollarDepth.value = "6.5";
      campCollarDepth.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<SVGSVGElement>("#garment-host svg")!.innerHTML).not.toBe(initialAssembled);
      expect(root.querySelector<SVGSVGElement>("#garment-host svg")!.innerHTML).not.toMatch(/NaN|Infinity/);
      campCollarDepth.value = "6";
      campCollarDepth.dispatchEvent(new Event("input", { bubbles: true }));
      clickId(root, "assembled-preview-toggle");

      clickId(root, "view-pattern");
      const initialSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      const depth = root.querySelector<HTMLInputElement>('input[data-option="campCollarDepth"]')!;
      depth.value = "6.5";
      depth.dispatchEvent(new Event("input", { bubbles: true }));
      const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      expect(editedSvg).not.toBe(initialSvg);

      clickId(root, "view-spec");
      clickId(root, "save-pattern");
      const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: Record<string, GarmentOptions>;
        workspace: { starterOrigin: Record<string, unknown> };
      };
      expect(stored.garmentOptions["woven-shirt"]?.campCollarDepth).toBe(6.5);
      expect(stored.workspace.starterOrigin).toMatchObject({
        entryId: WOVEN_SHIRT_CAMP_COLLAR_ENTRY_ID,
        entryRevision: "2026-11-03.1",
        recipeId: "woven-shirt",
        recipeRevision: "woven-shirt-camp-collar-v1",
        configurationSnapshot: {
          targetStyle: "Relaxed woven shirt",
          measurements: { length: 72, ease: 21 },
          options: { campCollarDepth: 6 },
        },
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Camp-collar Woven Shirt");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="campCollarDepth"]')!.value).toBe("6.5");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(editedSvg);
      const restoredDepth = reopened.querySelector<HTMLInputElement>('input[data-option="campCollarDepth"]')!;
      restoredDepth.value = "6.25";
      restoredDepth.dispatchEvent(new Event("input", { bubbles: true }));
      expect(restoredDepth.value).toBe("6.25");
      expect(reopened.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("0.5 cm increments");
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("exports the standless W06 identity and digital-only disclosures through all six output actions", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-" + WOVEN_SHIRT_CAMP_COLLAR_ENTRY_ID);
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Camp-collar Woven Shirt");
      expect(root.querySelector<HTMLInputElement>('input[data-option="standHeight"]')).toBeNull();
      expect(root.querySelector<HTMLInputElement>('input[data-option="collarLeafDepth"]')).toBeNull();

      clickId(root, "journey-step-fit");
      clickId(root, "journey-next");
      clickId(root, "view-check");
      const outputNext = root.querySelector<HTMLElement>("#journey-next");
      expect(outputNext, `W06 should pass its Check stage. Journey: ${root.querySelector<HTMLElement>("#journey-host")?.textContent}; guidance: ${root.querySelector<HTMLElement>("#guidance-host")?.textContent}`).not.toBeNull();
      outputNext!.click();
      const exportButton = root.querySelector<HTMLButtonElement>("#export-svg")!;
      const depth = root.querySelector<HTMLInputElement>('input[data-option="campCollarDepth"]')!;
      depth.value = "6.25";
      depth.dispatchEvent(new Event("input", { bubbles: true }));
      expect(depth.value).toBe("6.25");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("0.5 cm increments");
      expect(exportButton.disabled).toBe(true);

      depth.value = "6";
      depth.dispatchEvent(new Event("input", { bubbles: true }));
      reReviewAndReachExportStage(root);
      expect(exportButton.disabled).toBe(false);
      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) {
        clickId(root, id);
      }
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6), { timeout: 20000 });
      expect([...files.keys()].sort()).toEqual([
        "woven-shirt-camp-collar-M-A0.pdf", "woven-shirt-camp-collar-M.dxf", "woven-shirt-camp-collar-M.pdf",
        "woven-shirt-camp-collar-M.svg", "woven-shirt-camp-collar-projector.svg", "woven-shirt-camp-collar-techpack.pdf",
      ].sort());

      const projector = new DOMParser().parseFromString(files.get("woven-shirt-camp-collar-projector.svg")!, "image/svg+xml");
      const projectorText = [...projector.getElementsByTagName("text")].map((element) => element.textContent).join(" ");
      expect(projectorText).toContain("Camp-collar Woven Shirt");
      expect(projectorText).toContain("W06 grade is not validated.");
      const techPack = visiblePdfText(files.get("woven-shirt-camp-collar-techpack.pdf")!);
      expect(techPack).toContain("Digital W06 Camp-collar Woven Shirt");
      expect(techPack).toContain("upper and under collar layers join directly to the neckline");
      expect(techPack).toContain("existing separate front plackets remain");
      expect(techPack).toContain("not a validated W06 grade");
      expect(techPack).toContain("Draft estimates only; this is not a production BOM.");
    } finally {
      unmountApp();
      root?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 180_000);

  it("selects W07 and preserves its band height, profile identity, and pattern through save/reopen", () => {
    localStorage.clear();
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-" + WOVEN_SHIRT_BAND_COLLAR_ENTRY_ID);
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Band-collar Woven Shirt");
      expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Relaxed woven shirt");
      expect(root.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("72");
      expect(root.querySelector<HTMLInputElement>('input[data-field="ease"]')!.value).toBe("21");
      expect(root.querySelector<HTMLInputElement>('input[data-option="bandCollarHeight"]')!.value).toBe("2.5");
      expect(root.querySelector<HTMLInputElement>('input[data-option="standHeight"]')).toBeNull();
      expect(root.querySelector<HTMLInputElement>('input[data-option="collarLeafDepth"]')).toBeNull();
      expect(root.querySelector<HTMLInputElement>('input[data-option="campCollarDepth"]')).toBeNull();
      expect(root.querySelector<HTMLElement>('[data-option-help="option-buttonCount"]')?.textContent)
        .toContain("no additional collar-band button");

      clickId(root, "view-pattern");
      const defaultSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      const height = root.querySelector<HTMLInputElement>('input[data-option="bandCollarHeight"]')!;
      height.value = "3";
      height.dispatchEvent(new Event("input", { bubbles: true }));
      const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      expect(editedSvg).not.toBe(defaultSvg);
      height.value = "2.25";
      height.dispatchEvent(new Event("input", { bubbles: true }));
      expect(height.value).toBe("2.25");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("0.5 cm increments");
      height.value = "3";
      height.dispatchEvent(new Event("input", { bubbles: true }));

      clickId(root, "view-spec");
      clickId(root, "save-pattern");
      const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: Record<string, GarmentOptions>;
        workspace: { starterOrigin: Record<string, unknown> };
      };
      expect(stored.garmentOptions["woven-shirt"]?.bandCollarHeight).toBe(3);
      expect(stored.workspace.starterOrigin).toMatchObject({
        entryId: WOVEN_SHIRT_BAND_COLLAR_ENTRY_ID,
        entryRevision: "2026-11-04.1",
        recipeId: "woven-shirt",
        recipeRevision: "woven-shirt-band-collar-v1",
        configurationSnapshot: {
          targetStyle: "Relaxed woven shirt",
          measurements: { length: 72, ease: 21 },
          options: { bandCollarHeight: 2.5 },
        },
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Band-collar Woven Shirt");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="bandCollarHeight"]')!.value).toBe("3");
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(editedSvg);
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("exports the W07 band-only identity and disclosures through all six output actions", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-" + WOVEN_SHIRT_BAND_COLLAR_ENTRY_ID);
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Band-collar Woven Shirt");
      expect(root.querySelector<HTMLInputElement>('input[data-option="standHeight"]')).toBeNull();
      expect(root.querySelector<HTMLInputElement>('input[data-option="collarLeafDepth"]')).toBeNull();

      reachExportStage(root);
      const height = root.querySelector<HTMLInputElement>('input[data-option="bandCollarHeight"]')!;
      height.value = "2.25";
      height.dispatchEvent(new Event("input", { bubbles: true }));
      expect(height.value).toBe("2.25");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("0.5 cm increments");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

      height.value = "2.5";
      height.dispatchEvent(new Event("input", { bubbles: true }));
      reReviewAndReachExportStage(root);
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) clickId(root, id);
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6), { timeout: 20000 });
      expect([...files.keys()].sort()).toEqual([
        "woven-shirt-band-collar-M-A0.pdf", "woven-shirt-band-collar-M.dxf", "woven-shirt-band-collar-M.pdf",
        "woven-shirt-band-collar-M.svg", "woven-shirt-band-collar-projector.svg", "woven-shirt-band-collar-techpack.pdf",
      ].sort());
      const bandEntry = STARTER_REGISTRY.entries.find((entry) => entry.entryId === WOVEN_SHIRT_BAND_COLLAR_ENTRY_ID)!;
      const outputRecipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
      const measurements = bandEntry.configuration.measurements as unknown as Measurements;
      const outputOptions: GarmentOptions = { ...bandEntry.configuration.options, bandCollarHeight: 2.5 };
      const expectedBlock = draftRecipeAtSize(outputRecipe, measurements, 0, outputOptions);
      const expectedPieces = exportablePieces(expectedBlock, true);
      const expectedAllowances = wovenShirtAllowances(outputOptions.hemTurn);
      const expectedNotches = notchesForRecipeOptions(outputRecipe, outputOptions);
      expect(files.get("woven-shirt-band-collar-M.svg")).toBe(exportSvg(expectedPieces, expectedAllowances, expectedNotches));
      const dxf = files.get("woven-shirt-band-collar-M.dxf")!;
      expect(dxf).toBe(exportDxf(expectedPieces, expectedAllowances));
      expect((dxf.match(/\nPOLYLINE\n8\nCUT\n66\n1\n70\n1\n/gu) ?? [])).toHaveLength(10);
      expect((dxf.match(/\nCIRCLE\n8\nMARK_BUTTON\n/gu) ?? [])).toHaveLength(7);
      expect((dxf.match(/\nPOINT\n8\nMARK_BUTTONHOLE\n/gu) ?? [])).toHaveLength(7);
      expect(files.get("woven-shirt-band-collar-M.pdf")).toBe(exportPdf(expectedPieces, expectedAllowances, undefined, 1.0,
        outputRecipe.tiledPdfLocalCoordinates === true));
      expect(files.get("woven-shirt-band-collar-M-A0.pdf")).toBe(exportA0Pdf(expectedPieces, expectedAllowances, expectedNotches,
        undefined, outputRecipe.a0Overflow === true));
      const projector = new DOMParser().parseFromString(files.get("woven-shirt-band-collar-projector.svg")!, "image/svg+xml");
      const projectorText = [...projector.getElementsByTagName("text")].map((element) => element.textContent).join(" ");
      expect(projectorText).toContain("Band-collar Woven Shirt");
      expect(projectorText).toContain("W07 grade is not validated.");
      const techPack = visiblePdfText(files.get("woven-shirt-band-collar-techpack.pdf")!);
      expect(techPack).toContain("Digital W07 Band-collar Woven Shirt");
      expect(techPack).toMatch(/two band layers/i);
      expect(techPack).toMatch(/no collar-band button or buttonhole/i);
      expect(techPack).toMatch(/not a validated W07 grade/i);
      expect(techPack).toContain("Draft estimates only; this is not a production BOM.");
    } finally {
      unmountApp();
      root?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 180_000);

  it("selects W04, edits its boxy profile, preserves identity, and exports geometry-derived outputs", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-" + WOVEN_SHIRT_CROPPED_BOXY_ENTRY_ID);

      expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Cropped boxy woven shirt");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Cropped Boxy Shirt · software defaults");
      expect(root.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("54");
      expect(root.querySelector<HTMLInputElement>('input[data-field="ease"]')!.value).toBe("24");
      expect(root.querySelector<HTMLInputElement>('input[data-option="buttonCount"]')!.value).toBe("6");
      expect(root.querySelector<HTMLInputElement>('input[data-option="buttonSpacing"]')!.value).toBe("6");
      expect(root.querySelector<HTMLInputElement>('input[data-option="boxySideProfile"]')!.value).toBe("100");
      expect(root.querySelector<HTMLInputElement>('input[data-option="shoulderExtension"]')).toBeNull();
      expect(root.querySelector<HTMLInputElement>('input[data-option="shoulderDrop"]')).toBeNull();

      clickId(root, "view-pattern");
      const defaultSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      const profile = root.querySelector<HTMLInputElement>('input[data-option="boxySideProfile"]')!;
      profile.value = "50";
      profile.dispatchEvent(new Event("input", { bubbles: true }));
      const halfwaySvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      profile.value = "0";
      profile.dispatchEvent(new Event("input", { bubbles: true }));
      const shapedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      expect(halfwaySvg).not.toBe(defaultSvg);
      expect(shapedSvg).not.toBe(defaultSvg);
      profile.value = "55";
      profile.dispatchEvent(new Event("input", { bubbles: true }));
      expect(profile.value).toBe("55");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("10 % increments");

      const customMeasurements: Record<string, string> = { chest: "88", waist: "96", hip: "104", bicep: "32" };
      for (const [field, value] of Object.entries(customMeasurements)) {
        const input = root.querySelector<HTMLInputElement>('input[data-field="' + field + '"]')!;
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      profile.value = "100";
      profile.dispatchEvent(new Event("input", { bubbles: true }));
      const customSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
      expect(customSvg).not.toBe(defaultSvg);
      clickId(root, "view-spec");
      clickId(root, "save-pattern");

      const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        measurements: typeof STANDARD_M;
        garmentOptions: Record<string, Record<string, number>>;
        workspace: { starterOrigin: Record<string, unknown> };
      };
      expect(stored.measurements).toMatchObject({ chest: 88, waist: 96, hip: 104, length: 54, ease: 24 });
      expect(stored.garmentOptions["woven-shirt"]).toMatchObject({ buttonCount: 6, buttonSpacing: 6, boxySideProfile: 100 });
      expect(stored.workspace.starterOrigin).toMatchObject({
        entryId: WOVEN_SHIRT_CROPPED_BOXY_ENTRY_ID,
        entryRevision: "2026-11-03.1",
        recipeId: "woven-shirt",
        recipeRevision: "woven-shirt-cropped-boxy-v1",
        configurationSnapshot: {
          targetStyle: "Cropped boxy woven shirt",
          measurements: { length: 54, ease: 24 },
          options: { boxySideProfile: 100 },
        },
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Cropped boxy woven shirt");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="boxySideProfile"]')!.value).toBe("100");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="shoulderExtension"]')).toBeNull();
      clickId(reopened, "view-pattern");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(customSvg);
      clickId(reopened, "view-spec");
      clickIfPresent(reopened, "welcome-start");
      clickId(reopened, "journey-step-fit");
      clickId(reopened, "journey-next");
      const outputNext = reopened.querySelector<HTMLElement>("#journey-next");
      expect(outputNext, `W04 should pass its Check stage. Journey: ${reopened.querySelector<HTMLElement>("#journey-host")?.textContent}; guidance: ${reopened.querySelector<HTMLElement>("#guidance-host")?.textContent}`).not.toBeNull();
      outputNext!.click();

      const exportButton = reopened.querySelector<HTMLButtonElement>("#export-svg")!;
      const reopenedProfile = reopened.querySelector<HTMLInputElement>('input[data-option="boxySideProfile"]')!;
      reopenedProfile.value = "55";
      reopenedProfile.dispatchEvent(new Event("input", { bubbles: true }));
      expect(reopenedProfile.value).toBe("55");
      expect(reopened.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("10 % increments");
      expect(exportButton.disabled).toBe(true);
      reopenedProfile.value = "100";
      reopenedProfile.dispatchEvent(new Event("input", { bubbles: true }));
      reReviewAndReachExportStage(reopened);
      expect(exportButton.disabled).toBe(false);

      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) {
        clickId(reopened, id);
      }
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6), { timeout: 20000 });
      expect([...files.keys()].sort()).toEqual([
        "woven-shirt-M-A0.pdf", "woven-shirt-M.dxf", "woven-shirt-M.pdf", "woven-shirt-M.svg",
        "woven-shirt-projector.svg", "woven-shirt-techpack.pdf",
      ].sort());

      const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
      const options = stored.garmentOptions["woven-shirt"] as GarmentOptions;
      const pieces = blockPieces(recipe.draft(stored.measurements, options));
      expect(files.get("woven-shirt-M.svg")).toBe(exportSvg(pieces, recipe.allowances!, notchesForRecipeOptions(recipe, options)));
      expect(files.get("woven-shirt-M.dxf")).toBe(exportDxf(pieces, recipe.allowances!));
      expect(files.get("woven-shirt-M.pdf")).toBe(exportPdf(pieces, recipe.allowances!, undefined, 1.0, recipe.tiledPdfLocalCoordinates === true));
      expect(files.get("woven-shirt-M-A0.pdf")).toBe(exportA0Pdf(pieces, recipe.allowances!, notchesForRecipeOptions(recipe, options), undefined, recipe.a0Overflow === true));
      const w04ProjectorNote = "W04 grade is not validated. The W04 hip station is a digital crop reference, not a physical hip-location or fit measure.";
      const projectorActual = files.get("woven-shirt-projector.svg")!;
      const projectorExpected = exportProjectorSvg(
        { ...recipe, label: "Cropped Boxy Woven Shirt" }, stored.measurements, options, undefined, [], w04ProjectorNote,
      );
      const projectorMismatch = [...Array(Math.min(projectorActual.length, projectorExpected.length)).keys()]
        .find((index) => projectorActual[index] !== projectorExpected[index]) ?? -1;
      expect(projectorActual === projectorExpected,
        `Projector output differs at ${projectorMismatch}; actual length ${projectorActual.length}, expected ${projectorExpected.length}; `
        + `actual: ${projectorActual.slice(Math.max(0, projectorMismatch - 24), projectorMismatch + 72)}; `
        + `expected: ${projectorExpected.slice(Math.max(0, projectorMismatch - 24), projectorMismatch + 72)}`)
        .toBe(true);
      const projectorText = [...new DOMParser().parseFromString(files.get("woven-shirt-projector.svg")!, "image/svg+xml").getElementsByTagName("text")]
        .map((element) => element.textContent).join(" ");
      expect(projectorText).toContain(w04ProjectorNote);
      const techPack = visiblePdfText(files.get("woven-shirt-techpack.pdf")!);
      expect(techPack).toContain("Digital W04 cropped boxy Woven Shirt");
      expect(techPack).toContain("These are editable InfiniDrip software defaults");
      expect(techPack).toContain("Body waist (finished)");
      expect(techPack).toContain("W04 cropped hip station (finished)");
      expect(techPack).toContain("digital crop reference");
      expect(techPack).toContain("1 cm above the side-vent opening");
      expect(techPack).toContain("generic Woven Shirt size run is not a validated W04 grade");
      expect(techPack).toContain("Draft estimates only; this is not a production BOM.");
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("selects T03 as Boxy Crop, keeps standard Tee construction, and preserves its origin through save and reopen", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "starter-tee-classic-digital-v1");
    clickId(root, "view-pattern");
    const classicSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;

    clickId(root, "starter-tee-boxy-crop-digital-v1");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Boxy crop");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("B1 technical review pending; physical validation not performed");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Tee Boxy Crop · software defaults");
    const defaults: Record<string, string> = {
      chest: "100", shoulderWidth: "45", bicep: "38", length: "54",
      armholeDepth: "24", sleeveLength: "22", ease: "17",
    };
    for (const [field, value] of Object.entries(defaults)) {
      expect(root.querySelector<HTMLInputElement>(`input[data-field="${field}"]`)!.value).toBe(value);
    }
    expect(root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')).toBeNull();
    expect(root.querySelector<HTMLElement>('[data-finished="chest"]')!.textContent).toBe("117 cm");
    expect(root.querySelector<HTMLButtonElement>('[data-starter-entry-id="tee-boxy-crop-digital-v1"]')!.getAttribute("aria-pressed"))
      .toBe("true");
    const boxySvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    expect(boxySvg).not.toBe(classicSvg);

    const ease = root.querySelector<HTMLInputElement>('input[data-field="ease"]')!;
    ease.value = "31";
    ease.dispatchEvent(new Event("input", { bubbles: true }));
    expect(ease.value).toBe("31");
    expect(root.querySelector<HTMLElement>("#error-ease")!.textContent).toContain("13–30 cm");
    ease.value = "18";
    ease.dispatchEvent(new Event("input", { bubbles: true }));
    const length = root.querySelector<HTMLInputElement>('input[data-field="length"]')!;
    length.value = "55";
    length.dispatchEvent(new Event("input", { bubbles: true }));
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "102";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    expect(editedSvg).not.toBe(boxySvg);
    expect(root.querySelector<HTMLElement>('[data-finished="chest"]')!.textContent).toBe("120 cm");

    clickId(root, "save-pattern");
    const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    expect(stored.workspace.starterOrigin).toMatchObject({
      entryId: "tee-boxy-crop-digital-v1",
      entryRevision: "2026-10-20.1",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
      configurationSnapshot: {
        targetStyle: "Boxy crop",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 54, armholeDepth: 24, sleeveLength: 22, ease: 17 },
        options: {},
      },
    });

    const reopened = mount();
    expect(reopened.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Boxy crop");
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("102");
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("55");
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="ease"]')!.value).toBe("18");
    expect(reopened.querySelector<HTMLInputElement>('input[data-option="chestEase"]')).toBeNull();
    expect(reopened.querySelector<HTMLElement>('[data-finished="chest"]')!.textContent).toBe("120 cm");
    expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="tee-boxy-crop-digital-v1"]')!.getAttribute("aria-pressed"))
      .toBe("true");
    expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Tee Boxy Crop · software defaults");
    expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(editedSvg);
    root.remove();
    reopened.remove();
    localStorage.clear();
  });

  it("selects T04 Crop Tee, edits its existing Tee pattern, and preserves its origin through save and reopen", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "starter-tee-classic-digital-v1");
    clickId(root, "view-pattern");
    const classicSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;

    clickId(root, "starter-tee-cropped-digital-v1");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Crop tee");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("B1 technical review pending; physical validation not performed");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Tee Crop · software defaults");
    const defaults: Record<string, string> = {
      chest: "100", shoulderWidth: "45", bicep: "38", length: "53",
      armholeDepth: "24", sleeveLength: "22", ease: "7",
    };
    for (const [field, value] of Object.entries(defaults)) {
      expect(root.querySelector<HTMLInputElement>(`input[data-field="${field}"]`)!.value).toBe(value);
    }
    expect(root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')).toBeNull();
    expect(root.querySelector<HTMLElement>('[data-finished="chest"]')!.textContent).toBe("107 cm");
    expect(root.querySelector<HTMLButtonElement>('[data-starter-entry-id="tee-cropped-digital-v1"]')!.getAttribute("aria-pressed"))
      .toBe("true");
    clickId(root, "journey-next");
    expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Crop tee");
    expect(root.querySelector<HTMLElement>("#style-host")!.textContent).toContain("You're making a Crop tee.");
    expect(root.querySelector<HTMLElement>("#style-host")!.textContent).not.toContain("flagged inputs or digital checks need review");
    const cropSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    expect(cropSvg).not.toBe(classicSvg);

    const ease = root.querySelector<HTMLInputElement>('input[data-field="ease"]')!;
    ease.value = "13";
    ease.dispatchEvent(new Event("input", { bubbles: true }));
    expect(ease.value).toBe("13");
    expect(root.querySelector<HTMLElement>("#error-ease")!.textContent).toContain("0–12 cm");
    ease.value = "8";
    ease.dispatchEvent(new Event("input", { bubbles: true }));
    const length = root.querySelector<HTMLInputElement>('input[data-field="length"]')!;
    length.value = "58";
    length.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector<HTMLElement>("#error-length")!.textContent).toContain("40–57 cm");
    length.value = "54";
    length.dispatchEvent(new Event("input", { bubbles: true }));
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "102";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    expect(editedSvg).not.toBe(cropSvg);
    expect(root.querySelector<HTMLElement>('[data-finished="chest"]')!.textContent).toBe("110 cm");

    clickId(root, "save-pattern");
    const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    expect(stored.workspace.starterOrigin).toMatchObject({
      entryId: "tee-cropped-digital-v1",
      entryRevision: "2026-10-20.1",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
      configurationSnapshot: {
        targetStyle: "Crop tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 53, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: {},
      },
    });

    const reopened = mount();
    expect(reopened.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Crop tee");
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("102");
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("54");
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="ease"]')!.value).toBe("8");
    expect(reopened.querySelector<HTMLInputElement>('input[data-option="chestEase"]')).toBeNull();
    expect(reopened.querySelector<HTMLElement>('[data-finished="chest"]')!.textContent).toBe("110 cm");
    expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="tee-cropped-digital-v1"]')!.getAttribute("aria-pressed"))
      .toBe("true");
    expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Tee Crop · software defaults");
    expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(editedSvg);
    root.remove();
    reopened.remove();
    localStorage.clear();
  });

  it("selects T05 Longline Tee, edits the existing Tee output, and preserves its origin through save and reopen", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "starter-tee-classic-digital-v1");
    clickId(root, "view-pattern");
    const classicSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;

    clickId(root, "starter-tee-longline-digital-v1");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Longline tee");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("B1 technical review pending; physical validation not performed");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Tee Longline · software defaults");
    const defaults: Record<string, string> = {
      chest: "100", shoulderWidth: "45", bicep: "38", length: "80",
      armholeDepth: "24", sleeveLength: "22", ease: "7",
    };
    for (const [field, value] of Object.entries(defaults)) {
      expect(root.querySelector<HTMLInputElement>(`input[data-field="${field}"]`)!.value).toBe(value);
    }
    expect(root.querySelector<HTMLInputElement>('input[data-option="chestEase"]')).toBeNull();
    expect(root.querySelector<HTMLElement>('[data-finished="chest"]')!.textContent).toBe("107 cm");
    expect(root.querySelector<HTMLButtonElement>('[data-starter-entry-id="tee-longline-digital-v1"]')!.getAttribute("aria-pressed"))
      .toBe("true");
    clickId(root, "journey-next");
    expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Longline tee");
    expect(root.querySelector<HTMLElement>("#style-host")!.textContent).toContain("You're making a Longline tee.");
    expect(root.querySelector<HTMLElement>("#style-host")!.textContent).not.toContain("flagged inputs or digital checks need review");
    const longlineSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    expect(longlineSvg).not.toBe(classicSvg);

    const ease = root.querySelector<HTMLInputElement>('input[data-field="ease"]')!;
    ease.value = "6";
    ease.dispatchEvent(new Event("input", { bubbles: true }));
    expect(ease.value).toBe("6");
    expect(root.querySelector<HTMLElement>("#error-ease")!.textContent).toContain("7–18 cm");
    ease.value = "12";
    ease.dispatchEvent(new Event("input", { bubbles: true }));
    const length = root.querySelector<HTMLInputElement>('input[data-field="length"]')!;
    length.value = "101";
    length.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector<HTMLElement>("#error-length")!.textContent).toContain("78–100 cm");
    length.value = "90";
    length.dispatchEvent(new Event("input", { bubbles: true }));
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "102";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    const editedSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    expect(editedSvg).not.toBe(longlineSvg);
    expect(root.querySelector<HTMLElement>('[data-finished="chest"]')!.textContent).toBe("114 cm");

    clickId(root, "save-pattern");
    const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    expect(stored.workspace.starterOrigin).toMatchObject({
      entryId: "tee-longline-digital-v1",
      entryRevision: "2026-10-21.1",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
      configurationSnapshot: {
        targetStyle: "Longline tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 80, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: {},
      },
    });

    const reopened = mount();
    expect(reopened.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Longline tee");
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("102");
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="length"]')!.value).toBe("90");
    expect(reopened.querySelector<HTMLInputElement>('input[data-field="ease"]')!.value).toBe("12");
    expect(reopened.querySelector<HTMLInputElement>('input[data-option="chestEase"]')).toBeNull();
    expect(reopened.querySelector<HTMLElement>('[data-finished="chest"]')!.textContent).toBe("114 cm");
    expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="tee-longline-digital-v1"]')!.getAttribute("aria-pressed"))
      .toBe("true");
    expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Tee Longline · software defaults");
    expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(editedSvg);
    root.remove();
    reopened.remove();
    localStorage.clear();
  });

  it("selects T06 V-neck Tee, exposes its V-specific band controls, and preserves the option and origin through save and reopen", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "starter-tee-vneck-digital-v1");
    expect(root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage).toBe("measure");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Tee V-neck · software defaults");
    expect(root.querySelector<HTMLInputElement>('input[data-option="teeVNeckDropCm"]')!.value).toBe("5");
    expect(root.querySelector<HTMLElement>("#starter-blank-library")!.textContent).toContain("Starter Blank Library");
    expect(root.querySelector<HTMLElement>("#starter-blank-library")!.textContent)
      .toContain("outside the 56 digitally complete count");

    clickId(root, "assembled-preview-toggle");
    const assembledV = root.querySelector<SVGSVGElement>("#garment-host svg")!.innerHTML;
    clickId(root, "assembled-preview-toggle");
    clickId(root, "view-body");
    clickId(root, "body-front");
    const bodyV = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;

    const drop = root.querySelector<HTMLInputElement>('input[data-option="teeVNeckDropCm"]')!;
    expect(drop.disabled).toBe(false);
    root.querySelector<HTMLButtonElement>('[data-reset-option="teeVNeckDropCm"]')!.click();
    expect(root.querySelector<HTMLInputElement>('input[data-option="teeVNeckDropCm"]')!.disabled).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-option-mode="teeVNeckDropCm"]')!.textContent)
      .toContain("V option inactive; crew remains unless another Tee neckline is active.");
    expect(root.querySelector<HTMLFieldSetElement>("[data-tee-neckband-controls]")!.disabled).toBe(false);
    const crewBody = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    const crewAssembled = root.querySelector<SVGSVGElement>("#garment-host svg")!.innerHTML;
    expect(crewBody).not.toBe(bodyV);
    expect(crewAssembled).not.toBe(assembledV);
    root.querySelector<HTMLButtonElement>('[data-set-option="teeVNeckDropCm"]')!.click();
    expect(root.querySelector<HTMLInputElement>('input[data-option="teeVNeckDropCm"]')!.disabled).toBe(false);
    expect(root.querySelector<HTMLInputElement>('input[data-option="teeVNeckDropCm"]')!.value).toBe("5");
    expect(root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(bodyV);
    expect(root.querySelector<SVGSVGElement>("#garment-host svg")!.innerHTML).toBe(assembledV);

    clickId(root, "view-pattern");
    const defaultV = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    drop.value = "16";
    drop.dispatchEvent(new Event("input", { bubbles: true }));
    expect(drop.value).toBe("16");
    expect(root.querySelector<HTMLElement>("#error-option-teeVNeckDropCm")!.textContent).toContain("0–15 cm");
    expect(root.querySelector<HTMLElement>('[data-option-mode="teeVNeckDropCm"]')!.textContent)
      .toContain("Additional front drop: 16 cm");
    drop.value = "15";
    drop.dispatchEvent(new Event("input", { bubbles: true }));
    const armholeDepth = root.querySelector<HTMLInputElement>('input[data-field="armholeDepth"]')!;
    armholeDepth.value = "22";
    armholeDepth.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector<HTMLElement>("#error-option-teeVNeckDropCm")!.textContent).toBe("");
    expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
      .toContain("The front V drops below the underarm");
    expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
      .toContain("reduce the V drop or increase armhole depth");
    expect(root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).not.toBe(defaultV);
    armholeDepth.value = "24";
    armholeDepth.dispatchEvent(new Event("input", { bubbles: true }));
    drop.value = "7.5";
    drop.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector<HTMLElement>('[data-option-mode="teeVNeckDropCm"]')!.textContent)
      .toContain("Additional front drop: 7.5 cm");
    const editedV = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    expect(editedV).not.toBe(defaultV);
    expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
      .not.toContain("The front V drops below the underarm");

    reachExportStage(root);
    const neckbandControls = root.querySelector<HTMLFieldSetElement>("[data-tee-neckband-controls]")!;
    const limitation = root.querySelector<HTMLElement>("#tee-neckband-v-limitation")!;
    const neckbandExport = root.querySelector<HTMLButtonElement>("#export-tee-neckband")!;
    expect(neckbandControls.disabled).toBe(false);
    expect(limitation.hidden).toBe(false);
    expect(limitation.textContent).toContain("V-specific provisional band output is available");
    expect(neckbandExport.disabled).toBe(false);
    expect(neckbandExport.title).toContain("V-band strip with its center-front join");
    expect(root.querySelector<HTMLButtonElement>("#export-tee-selected-techpack")!.disabled).toBe(false);

    const neckbandValuesBeforeSave = [
      root.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandLengthPercent"]')!.value,
      root.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandFinishedWidthCm"]')!.value,
    ];
    const rendered = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    clickId(root, "save-pattern");
    const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    expect(stored.garmentOptions.tee.teeVNeckDropCm).toBe(7.5);
    expect(stored.workspace.starterOrigin).toMatchObject({
      entryId: "tee-vneck-digital-v1",
      entryRevision: "2026-10-21.1",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
      configurationSnapshot: {
        targetStyle: "Classic tee",
        options: { chestEase: 7, teeVNeckDropCm: 5 },
      },
    });

    const reopened = mount();
    expect(reopened.querySelector<HTMLInputElement>('input[data-option="teeVNeckDropCm"]')!.value).toBe("7.5");
    expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="tee-vneck-digital-v1"]')!.getAttribute("aria-pressed"))
      .toBe("true");
    expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Tee V-neck · software defaults");
    expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(rendered);
    reachExportStage(reopened);
    expect(reopened.querySelector<HTMLFieldSetElement>("[data-tee-neckband-controls]")!.disabled).toBe(false);
    expect(reopened.querySelector<HTMLElement>("#tee-neckband-v-limitation")!.hidden).toBe(false);
    expect(reopened.querySelector<HTMLButtonElement>("#export-tee-neckband")!.disabled).toBe(false);
    expect([
      reopened.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandLengthPercent"]')!.value,
      reopened.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandFinishedWidthCm"]')!.value,
    ]).toEqual(neckbandValuesBeforeSave);
    root.remove();
    reopened.remove();
    localStorage.clear();
  });

  it("exports identical selected-size V-band SVG and Tech Pack after saving and reopening T06", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    window.electronAPI = {
      saveFile: vi.fn(async (filename: string, content: string) => {
        files.set(filename, content);
        return { saved: true, filePath: filename };
      }),
    };
    try {
      const root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-tee-vneck-digital-v1");
      const length = root.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandLengthPercent"]')!;
      const width = root.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandFinishedWidthCm"]')!;
      length.value = "84";
      length.dispatchEvent(new Event("input", { bubbles: true }));
      width.value = "2.4";
      width.dispatchEvent(new Event("input", { bubbles: true }));
      reachExportStage(root);

      expect(root.querySelector<HTMLButtonElement>("#export-tee-neckband")!.disabled).toBe(false);
      expect(root.querySelector<HTMLButtonElement>("#export-tee-selected-techpack")!.disabled).toBe(false);
      clickId(root, "export-tee-neckband");
      await vi.waitFor(() => expect(files.has("tee-M-vneck-band.svg")).toBe(true));
      clickId(root, "export-tee-selected-techpack");
      await vi.waitFor(() => expect(files.has("tee-M-selected-techpack.pdf")).toBe(true));
      clickId(root, "export-techpack");
      await vi.waitFor(() => expect(files.has("tee-techpack.pdf")).toBe(true));
      const wholeRunTechPack = files.get("tee-techpack.pdf")!;
      expect(wholeRunTechPack).toContain("V-band output is available only in the selected-size V-band Tech Pack;");
      expect(wholeRunTechPack).toContain("graded-size V-band instructions or pattern output.");
      expect(wholeRunTechPack).not.toContain("V-band settings:");
      const originalBand = files.get("tee-M-vneck-band.svg")!;
      const originalTechPack = files.get("tee-M-selected-techpack.pdf")!;
      expect(originalBand).toContain('data-v-forming-join="start"');
      expect(originalBand).toContain('data-v-forming-join="end"');
      expect(originalBand).toContain('data-finished-width-cm="2.4"');
      expect(originalTechPack).toContain("Provisional digital V-band construction");
      expect(originalTechPack).toContain("Measured selected-size body neckline");
      expect(originalTechPack).toContain("selected band target");
      expect(originalTechPack).toContain("Finished width 2.4 cm");

      clickId(root, "save-pattern");
      const reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandLengthPercent"]')!.value).toBe("84");
      expect(reopened.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandFinishedWidthCm"]')!.value).toBe("2.4");
      reachExportStage(reopened);
      files.delete("tee-M-vneck-band.svg");
      files.delete("tee-M-selected-techpack.pdf");
      clickId(reopened, "export-tee-neckband");
      await vi.waitFor(() => expect(files.has("tee-M-vneck-band.svg")).toBe(true));
      clickId(reopened, "export-tee-selected-techpack");
      await vi.waitFor(() => expect(files.has("tee-M-selected-techpack.pdf")).toBe(true));
      expect(files.get("tee-M-vneck-band.svg")).toBe(originalBand);
      expect(files.get("tee-M-selected-techpack.pdf")).toBe(originalTechPack);
      root.remove();
      reopened.remove();
    } finally {
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("keeps invalid V-band settings visible and disables band exports until corrected", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "starter-tee-vneck-digital-v1");
    reachExportStage(root);
    const length = root.querySelector<HTMLInputElement>('[data-tee-neckband-option="teeNeckbandLengthPercent"]')!;
    length.value = "91";
    length.dispatchEvent(new Event("input", { bubbles: true }));
    expect(length.value).toBe("91");
    expect(root.querySelector<HTMLElement>("#tee-neckband-control-error")!.textContent).toContain("75–90%");
    expect(root.querySelector<HTMLFieldSetElement>("[data-tee-neckband-controls]")!.disabled).toBe(false);
    expect(root.querySelector<HTMLButtonElement>("#export-tee-neckband")!.disabled).toBe(true);
    expect(root.querySelector<HTMLButtonElement>("#export-tee-selected-techpack")!.disabled).toBe(true);

    length.value = "90";
    length.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector<HTMLElement>("#tee-neckband-control-error")!.textContent).toBe("");
    expect(root.querySelector<HTMLButtonElement>("#export-tee-neckband")!.disabled).toBe(false);
    expect(root.querySelector<HTMLButtonElement>("#export-tee-selected-techpack")!.disabled).toBe(false);
    root.remove();
    localStorage.clear();
  });

  it("reports V-band geometry failures and disables output when generation fails", () => {
    localStorage.clear();
    const generateBand = vi.spyOn(teeDrafting, "teeVNeckbandTemplateSvg")
      .mockImplementation(() => { throw new Error("synthetic V-band geometry failure"); });
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "starter-tee-vneck-digital-v1");
    reachExportStage(root);
    expect(root.querySelector<HTMLButtonElement>("#export-tee-neckband")!.disabled).toBe(true);
    expect(root.querySelector<HTMLElement>("#tee-neckband-v-limitation")!.textContent)
      .toContain("synthetic V-band geometry failure");

    generateBand.mockImplementation(() => { throw "synthetic non-Error V-band failure"; });
    const fallbackRoot = mount();
    clickIfPresent(fallbackRoot, "welcome-start");
    clickId(fallbackRoot, "starter-tee-vneck-digital-v1");
    reachExportStage(fallbackRoot);
    expect(fallbackRoot.querySelector<HTMLButtonElement>("#export-tee-neckband")!.disabled).toBe(true);
    expect(fallbackRoot.querySelector<HTMLElement>("#tee-neckband-v-limitation")!.textContent)
      .toContain("The selected V-band geometry could not be generated.");

    generateBand.mockRestore();
    localStorage.clear();
  });

  it("selects T07 Scoop Tee, preserves its editable depth and origin, and makes conflicting necklines explicit", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "starter-tee-scoop-digital-v1");

    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Tee Scoop-neck · software defaults");
    expect(root.querySelector<HTMLElement>("#starter-blank-library")!.textContent)
      .toContain("B1 technical review pending · physical validation not-validated");
    const drop = root.querySelector<HTMLInputElement>('input[data-option="teeScoopNeckDropCm"]')!;
    expect(drop.value).toBe("5");
    const scoopPattern = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;

    clickId(root, "view-body");
    clickId(root, "body-front");
    const scoopBody = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    clickId(root, "assembled-preview-toggle");
    const scoopAssembled = root.querySelector<SVGSVGElement>("#garment-host svg")!.innerHTML;
    expect(scoopAssembled).not.toBe("");

    clickId(root, "assembled-preview-toggle");
    clickId(root, "view-pattern");
    root.querySelector<HTMLButtonElement>('[data-reset-option="teeScoopNeckDropCm"]')!.click();
    expect(root.querySelector<HTMLElement>('[data-option-mode="teeScoopNeckDropCm"]')!.textContent)
      .toContain("Scoop option inactive; crew remains unless another Tee neckline is active.");
    const crewPattern = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    expect(crewPattern).not.toBe(scoopPattern);
    clickId(root, "view-body");
    clickId(root, "body-front");
    const crewBody = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    expect(crewBody).not.toBe(scoopBody);
    clickId(root, "assembled-preview-toggle");
    const crewAssembled = root.querySelector<SVGSVGElement>("#garment-host svg")!.innerHTML;
    expect(crewAssembled).not.toBe(scoopAssembled);

    clickId(root, "assembled-preview-toggle");
    clickId(root, "view-pattern");
    root.querySelector<HTMLButtonElement>('[data-set-option="teeScoopNeckDropCm"]')!.click();
    drop.value = "16";
    drop.dispatchEvent(new Event("input", { bubbles: true }));
    expect(drop.value).toBe("16");
    expect(root.querySelector<HTMLElement>("#error-option-teeScoopNeckDropCm")!.textContent)
      .toContain("0–15 cm");
    expect(root.querySelector<HTMLElement>('[data-option-mode="teeScoopNeckDropCm"]')!.textContent)
      .toContain("Additional front drop: 16 cm");

    drop.value = "15";
    drop.dispatchEvent(new Event("input", { bubbles: true }));
    const armholeDepth = root.querySelector<HTMLInputElement>('input[data-field="armholeDepth"]')!;
    armholeDepth.value = "22";
    armholeDepth.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
      .toContain("The front Scoop drops below the underarm");
    expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
      .toContain("reduce its extra depth or increase armhole depth");
    armholeDepth.value = "24";
    armholeDepth.dispatchEvent(new Event("input", { bubbles: true }));
    drop.value = "7.5";
    drop.dispatchEvent(new Event("input", { bubbles: true }));
    const editedScoop = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    expect(editedScoop).not.toBe(scoopPattern);

    reachExportStage(root);
    root.querySelector<HTMLButtonElement>('[data-set-option="teeVNeckDropCm"]')!.click();
    expect(root.querySelector<HTMLInputElement>('input[data-option="teeVNeckDropCm"]')!.value).toBe("5");
    expect(drop.value).toBe("7.5");
    expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
      .toContain("Both V and Scoop neckline options are active");
    expect(root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(crewPattern);
    expect(root.querySelector<HTMLFieldSetElement>("[data-tee-neckband-controls]")!.disabled).toBe(true);
    expect(root.querySelector<HTMLElement>("#tee-neckband-v-limitation")!.textContent)
      .toContain("Reset one before generating neckband output");
    expect(root.querySelector<HTMLButtonElement>("#export-tee-neckband")!.disabled).toBe(true);

    root.querySelector<HTMLButtonElement>('[data-reset-option="teeVNeckDropCm"]')!.click();
    expect(root.querySelector<HTMLFieldSetElement>("[data-tee-neckband-controls]")!.disabled).toBe(false);
    expect(root.querySelector<HTMLElement>("#tee-neckband-v-limitation")!.hidden).toBe(true);
    const finalScoop = root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML;
    clickId(root, "save-pattern");
    const stored = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    expect(stored.garmentOptions.tee.teeScoopNeckDropCm).toBe(7.5);
    expect(stored.garmentOptions.tee.teeVNeckDropCm).toBeUndefined();
    expect(stored.workspace.starterOrigin).toMatchObject({
      entryId: "tee-scoop-digital-v1",
      entryRevision: "2026-10-21.1",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
      configurationSnapshot: {
        targetStyle: "Classic tee",
        options: { chestEase: 7, teeScoopNeckDropCm: 5 },
      },
    });

    const reopened = mount();
    expect(reopened.querySelector<HTMLInputElement>('input[data-option="teeScoopNeckDropCm"]')!.value).toBe("7.5");
    expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="tee-scoop-digital-v1"]')!.getAttribute("aria-pressed"))
      .toBe("true");
    expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Tee Scoop-neck · software defaults");
    expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toBe(finalScoop);
    expect(reopened.querySelector<HTMLFieldSetElement>("[data-tee-neckband-controls]")!.disabled).toBe(false);
    root.remove();
    reopened.remove();
    localStorage.clear();
  });

  it("selects, saves, reloads, and renders T08 Raglan while preserving inactive Set-in neckline options", () => {
    localStorage.clear();
    const root = mount();
    clickIfPresent(root, "welcome-start");
    clickId(root, "starter-tee-scoop-digital-v1");
    const scoopDrop = root.querySelector<HTMLInputElement>('input[data-option="teeScoopNeckDropCm"]')!;
    scoopDrop.value = "7.5";
    scoopDrop.dispatchEvent(new Event("input", { bubbles: true }));

    const setInSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
    clickId(root, "starter-tee-raglan-digital-v1");
    expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Raglan Tee");
    expect(root.querySelector<HTMLSelectElement>("#tee-construction")!.value).toBe("raglan");
    expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
      .toContain("Starting design: Tee Raglan · software defaults");
    expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
      .toContain("Saved V-neck or Scoop settings are inactive");
    const raglanSvg = root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML;
    expect(raglanSvg).not.toBe(setInSvg);
    expect(root.querySelector<HTMLInputElement>('input[data-option="teeScoopNeckDropCm"]')).toBeNull();
    clickId(root, "undo-pattern");
    expect(root.querySelector<HTMLSelectElement>("#tee-construction")!.value).toBe("set-in");
    expect(root.querySelector<HTMLInputElement>('input[data-option="teeScoopNeckDropCm"]')!.value).toBe("7.5");
    clickId(root, "redo-pattern");
    expect(root.querySelector<HTMLSelectElement>("#tee-construction")!.value).toBe("raglan");
    expect(root.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML).toBe(raglanSvg);

    const construction = root.querySelector<HTMLSelectElement>("#tee-construction")!;
    construction.value = "set-in";
    construction.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelector<HTMLInputElement>('input[data-option="teeScoopNeckDropCm"]')!.value).toBe("7.5");
    construction.value = "raglan";
    construction.dispatchEvent(new Event("change", { bubbles: true }));
    clickId(root, "starter-tee-raglan-digital-v1");

    clickId(root, "save-pattern");
    const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    expect(saved.workspace.teeConstruction).toBe("raglan");
    expect(saved.workspace.starterOrigin.entryId).toBe("tee-raglan-digital-v1");
    expect(saved.garmentOptions.tee.teeScoopNeckDropCm).toBe(7.5);

    const reopened = mount();
    expect(reopened.querySelector<HTMLSelectElement>("#tee-construction")!.value).toBe("raglan");
    expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="tee-raglan-digital-v1"]')!.getAttribute("aria-pressed"))
      .toBe("true");
    expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.outerHTML).toBe(raglanSvg);
    root.remove();
    reopened.remove();
    localStorage.clear();
  });
});
