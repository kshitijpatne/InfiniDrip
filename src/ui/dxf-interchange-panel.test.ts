// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import type { DxfInterchangeRoundTripReport } from "../export/dxf-interchange-roundtrip";
import { createDxfInterchangePanel, requireDxfInterchangeSourceBlock } from "./dxf-interchange-panel";

const passed: DxfInterchangeRoundTripReport = {
  passed: true, pieceCount: 3, outlineCount: 6, markEntityCount: 4, maxGeometryDeltaCm: 0.0002,
};

function setup(overrides: Partial<Parameters<typeof createDxfInterchangePanel>[0]> = {}) {
  document.body.replaceChildren();
  const audit = overrides.audit ?? vi.fn(async () => passed);
  const readFile = overrides.readFile ?? vi.fn(async (file: File) => file.name === "source.json" ? '{"source":true}' : "returned DXF");
  const panel = createDxfInterchangePanel({ audit, readFile });
  document.body.append(panel);
  const source = panel.querySelector<HTMLInputElement>("#dxf-source-package-file")!;
  const returned = panel.querySelector<HTMLInputElement>("#dxf-returned-file")!;
  const check = panel.querySelector<HTMLButtonElement>("#audit-dxf-return")!;
  const status = panel.querySelector<HTMLParagraphElement>("#dxf-audit-status")!;
  const choose = (input: HTMLInputElement, name: string): void => {
    Object.defineProperty(input, "files", { configurable: true, value: [new File(["data"], name)] });
    input.dispatchEvent(new Event("change"));
  };
  return { panel, source, returned, check, status, audit, readFile, choose };
}

async function clickAndFlush(button: HTMLButtonElement): Promise<void> {
  button.dispatchEvent(new Event("click"));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("local DXF return audit panel", () => {
  it("requires a verified source pattern before package export", () => {
    expect(requireDxfInterchangeSourceBlock({} as never)).toEqual({});
    expect(() => requireDxfInterchangeSourceBlock(null)).toThrow("The selected size has no verified source pattern.");
  });

  it("labels the generic, local-only route and enables checking only when both files are selected", () => {
    const { panel, source, returned, check, status, choose } = setup();
    expect(panel.textContent).toContain("no receiver-compatibility claim");
    expect(check.disabled).toBe(true);
    choose(source, "source.json");
    expect(check.disabled).toBe(true);
    choose(returned, "returned.dxf");
    expect(check.disabled).toBe(false);
    expect(status.textContent).toBe("");
  });

  it("does nothing if a click arrives without both files", async () => {
    const { check, audit } = setup();
    await clickAndFlush(check);
    expect(audit).not.toHaveBeenCalled();
  });

  it("shows an exact successful summary without sending files elsewhere", async () => {
    const { source, returned, check, status, audit, choose, readFile } = setup();
    choose(source, "source.json");
    choose(returned, "returned.dxf");
    await clickAndFlush(check);
    expect(audit).toHaveBeenCalledWith({ source: true }, "returned DXF");
    expect(readFile).toHaveBeenCalledTimes(2);
    expect(status.textContent).toBe("Passed: 3 pieces, 6 outlines, 4 mark entities; maximum difference 0.000200 cm.");
    expect(status.getAttribute("role")).toBe("status");
  });

  it("reports malformed source JSON as an accessible failure", async () => {
    const { source, returned, check, status, audit, choose } = setup({
      readFile: vi.fn(async (file: File) => file.name === "source.json" ? "{" : "returned DXF"),
    });
    choose(source, "source.json");
    choose(returned, "returned.dxf");
    await clickAndFlush(check);
    expect(audit).not.toHaveBeenCalled();
    expect(status.getAttribute("role")).toBe("alert");
    expect(status.textContent).toBe("Check failed: The source package file is not valid JSON.");
  });

  it("shows the auditor's fail-closed reason and no partial summary", async () => {
    const { source, returned, check, status, choose } = setup({
      audit: vi.fn(async () => ({ passed: false, reason: "Returned DXF does not declare centimeters", pieceCount: 0, outlineCount: 0, markEntityCount: 0, maxGeometryDeltaCm: 0 })),
    });
    choose(source, "source.json");
    choose(returned, "returned.dxf");
    await clickAndFlush(check);
    expect(status.getAttribute("role")).toBe("alert");
    expect(status.textContent).toBe("Check failed: Returned DXF does not declare centimeters");
    expect(status.textContent).not.toContain("0 pieces");
  });

  it("uses a safe generic failure message when the auditor has no reason", async () => {
    const { source, returned, check, status, choose } = setup({
      audit: vi.fn(async () => ({ passed: false, pieceCount: 0, outlineCount: 0, markEntityCount: 0, maxGeometryDeltaCm: 0 })),
    });
    choose(source, "source.json");
    choose(returned, "returned.dxf");
    await clickAndFlush(check);
    expect(status.textContent).toBe("Check failed: Returned DXF did not pass.");
  });

  it("rejects incomplete success results and reports file-read failures", async () => {
    const incomplete = setup({ audit: vi.fn(async () => ({ ...passed, maxGeometryDeltaCm: Number.NaN })) });
    incomplete.choose(incomplete.source, "source.json");
    incomplete.choose(incomplete.returned, "returned.dxf");
    await clickAndFlush(incomplete.check);
    expect(incomplete.status.textContent).toBe("Check failed: audit returned an incomplete result.");

    const unreadable = setup({ readFile: vi.fn(async () => { throw new Error("local read denied"); }) });
    unreadable.choose(unreadable.source, "source.json");
    unreadable.choose(unreadable.returned, "returned.dxf");
    await clickAndFlush(unreadable.check);
    expect(unreadable.status.textContent).toBe("Check failed: local read denied");

    const unknownFailure = setup({ audit: vi.fn(async () => { throw "unexpected"; }) });
    unknownFailure.choose(unknownFailure.source, "source.json");
    unknownFailure.choose(unknownFailure.returned, "returned.dxf");
    await clickAndFlush(unknownFailure.check);
    expect(unknownFailure.status.textContent).toBe("Check failed: file could not be read.");
  });

  it("ignores a late result after the selected files change", async () => {
    const finishReads: ((value: string) => void)[] = [];
    const readFile = vi.fn(() => new Promise<string>((resolve) => { finishReads.push(resolve); }));
    const { source, returned, check, status, choose } = setup({ readFile });
    choose(source, "source.json");
    choose(returned, "returned.dxf");
    check.dispatchEvent(new Event("click"));
    choose(returned, "replacement.dxf");
    finishReads.forEach((finish) => finish('{"source":true}'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(status.textContent).toBe("");
    expect(check.disabled).toBe(false);
  });

  it("ignores a late read error after the selected files change", async () => {
    const rejectReads: ((reason: Error) => void)[] = [];
    const readFile = vi.fn(() => new Promise<string>((_resolve, reject) => { rejectReads.push(reject); }));
    const { source, returned, check, status, choose } = setup({ readFile });
    choose(source, "source.json");
    choose(returned, "returned.dxf");
    check.dispatchEvent(new Event("click"));
    choose(returned, "replacement.dxf");
    rejectReads.forEach((reject) => reject(new Error("stale file read")));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(status.textContent).toBe("");
    expect(check.disabled).toBe(false);
  });
});
