import type { DxfInterchangeRoundTripReport } from "../export/dxf-interchange-roundtrip";
import type { Block } from "../drafting/block";

export interface DxfInterchangePanelOptions {
  readonly audit: (sourcePackage: unknown, returnedDxf: string) => Promise<DxfInterchangeRoundTripReport>;
  readonly readFile: (file: File) => Promise<string>;
}

export function requireDxfInterchangeSourceBlock(sourceBlock: Block | null): Block {
  if (!sourceBlock) throw new Error("The selected size has no verified source pattern.");
  return sourceBlock;
}

const panelMarkup = (): string =>
  `<section id="dxf-interchange-panel" aria-labelledby="dxf-interchange-title" ` +
  `style="display:flex;flex-direction:column;gap:8px;margin-top:12px;padding:10px;border:1px solid #1E3450;border-radius:8px">` +
  `<h3 id="dxf-interchange-title" style="margin:0;color:#d9e6ef;font-size:13px">CAD exchange</h3>` +
  `<p style="margin:0;color:#9bb8cc;font-size:11px;line-height:1.4">` +
  `Export the DXF with its source package JSON. Use the JSON and a returned DXF for a local check. ` +
  `This output has no receiver-compatibility claim; files are checked in this app and are not uploaded.</p>` +
  `<div style="display:flex;gap:6px;flex-wrap:wrap">` +
  `<button id="export-cad-dxf" type="button" class="export-format-button">CAD exchange DXF</button>` +
  `<button id="export-dxf-source-package" type="button" class="export-format-button">Source package JSON</button></div>` +
  `<label style="display:flex;flex-direction:column;gap:4px;color:#d9e6ef;font-size:11px">` +
  `Original source package JSON <input id="dxf-source-package-file" type="file" accept=".json,application/json" /></label>` +
  `<label style="display:flex;flex-direction:column;gap:4px;color:#d9e6ef;font-size:11px">` +
  `Returned DXF <input id="dxf-returned-file" type="file" accept=".dxf,application/dxf,text/plain" /></label>` +
  `<button id="audit-dxf-return" type="button" disabled class="export-format-button">Check returned DXF</button>` +
  `<p id="dxf-audit-status" role="status" aria-live="polite" style="margin:0;min-height:16px;color:#9bb8cc;font-size:11px"></p>` +
  `</section>`;

function fileFrom(input: HTMLInputElement): File | undefined {
  return input.files?.[0];
}

export function createDxfInterchangePanel(options: DxfInterchangePanelOptions): HTMLElement {
  const template = document.createElement("template");
  template.innerHTML = panelMarkup();
  const panel = template.content.firstElementChild as HTMLElement;
  const sourceInput = panel.querySelector<HTMLInputElement>("#dxf-source-package-file")!;
  const returnedInput = panel.querySelector<HTMLInputElement>("#dxf-returned-file")!;
  const checkButton = panel.querySelector<HTMLButtonElement>("#audit-dxf-return")!;
  const status = panel.querySelector<HTMLParagraphElement>("#dxf-audit-status")!;
  let request = 0;

  const syncInputs = (): void => {
    request += 1;
    checkButton.disabled = !fileFrom(sourceInput) || !fileFrom(returnedInput);
    status.textContent = "";
    status.setAttribute("role", "status");
  };
  sourceInput.addEventListener("change", syncInputs);
  returnedInput.addEventListener("change", syncInputs);
  checkButton.addEventListener("click", async () => {
    const sourceFile = fileFrom(sourceInput);
    const returnedFile = fileFrom(returnedInput);
    if (!sourceFile || !returnedFile) return;

    const activeRequest = ++request;
    checkButton.disabled = true;
    status.setAttribute("role", "status");
    status.textContent = "Checking locally…";
    try {
      const [sourceText, returnedDxf] = await Promise.all([
        options.readFile(sourceFile), options.readFile(returnedFile),
      ]);
      let sourcePackage: unknown;
      try {
        sourcePackage = JSON.parse(sourceText) as unknown;
      } catch {
        throw new Error("The source package file is not valid JSON.");
      }
      const report = await options.audit(sourcePackage, returnedDxf);
      if (activeRequest !== request) return;
      if (!report.passed) {
        status.setAttribute("role", "alert");
        status.textContent = `Check failed: ${report.reason ?? "Returned DXF did not pass."}`;
        return;
      }
      if (![report.pieceCount, report.outlineCount, report.markEntityCount, report.maxGeometryDeltaCm].every(Number.isFinite)) {
        status.setAttribute("role", "alert");
        status.textContent = "Check failed: audit returned an incomplete result.";
        return;
      }
      status.textContent = `Passed: ${report.pieceCount} pieces, ${report.outlineCount} outlines, ` +
        `${report.markEntityCount} mark entities; maximum difference ${report.maxGeometryDeltaCm.toFixed(6)} cm.`;
    } catch (error) {
      if (activeRequest !== request) return;
      status.setAttribute("role", "alert");
      status.textContent = error instanceof Error ? `Check failed: ${error.message}` : "Check failed: file could not be read.";
    } finally {
      if (activeRequest === request) checkButton.disabled = !fileFrom(sourceInput) || !fileFrom(returnedInput);
    }
  });
  return panel;
}
