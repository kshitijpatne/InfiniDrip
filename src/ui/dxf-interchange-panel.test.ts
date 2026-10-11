// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { GARMENTS, STANDARD_M, gradeRun } from "../drafting";
import { createDxfInterchangePackage } from "../export/dxf-interchange-package";
import { auditDxfInterchangeRoundTrip } from "../export/dxf-interchange-roundtrip";
import { dxfEntityTypeAndLayer, readNamedDxfDrawing } from "../export/named-dxf-blocks";
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

function replaceDxfEntity(dxf: string, entity: string, replacement: (value: string) => string): string {
  const start = dxf.indexOf(entity);
  if (start < 0) throw new Error("Test entity not found");
  return `${dxf.slice(0, start)}${replacement(entity)}${dxf.slice(start + entity.length)}`;
}

function shiftMiddleVertex(entity: string, amount: number): string {
  const lines = entity.split("\n");
  const vertices = lines.flatMap((line, index) => line === "0" && lines[index + 1] === "VERTEX" ? [index] : []);
  const vertex = vertices[Math.floor(vertices.length / 2)]!;
  const x = lines.findIndex((line, index) => index > vertex && line === "10");
  lines[x + 1] = String(Number(lines[x + 1]) + amount);
  return lines.join("\n");
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

  it("routes a real generated package through the actual auditor for pass and fixed-gate failures", async () => {
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    try {
      const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
      const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2]!;
      const sourcePackage = await createDxfInterchangePackage(recipe, graded);
      const expectedReport = await auditDxfInterchangeRoundTrip(sourcePackage, sourcePackage.dxf);
      expect(expectedReport.passed).toBe(true);
      const noUnits = sourcePackage.dxf.replace("9\n$INSUNITS\n70\n5\n", "");
      const tamperedPackage = {
        ...sourcePackage,
        manifest: { ...sourcePackage.manifest, revisionId: "0".repeat(64) },
      };
      const fileContents = new Map([
        ["source.json", JSON.stringify(sourcePackage)],
        ["tampered-source.json", JSON.stringify(tamperedPackage)],
        ["valid.dxf", sourcePackage.dxf],
        ["missing-units.dxf", noUnits],
      ]);
      const panel = setup({
        audit: (candidate, returnedDxf) => auditDxfInterchangeRoundTrip(candidate as never, returnedDxf),
        readFile: vi.fn(async (file) => fileContents.get(file.name) ?? ""),
      });
      panel.choose(panel.source, "source.json");
      panel.choose(panel.returned, "valid.dxf");
      panel.check.dispatchEvent(new Event("click"));
      await vi.waitFor(() => expect(panel.status.textContent).not.toBe("Checking locally…"));
      expect(panel.status.textContent).toBe(
        `Passed: ${expectedReport.pieceCount} pieces, ${expectedReport.outlineCount} outlines, ` +
        `${expectedReport.markEntityCount} mark entities; maximum difference ${expectedReport.maxGeometryDeltaCm.toFixed(6)} cm.`,
      );

      panel.choose(panel.returned, "missing-units.dxf");
      panel.check.dispatchEvent(new Event("click"));
      await vi.waitFor(() => expect(panel.status.textContent).not.toBe("Checking locally…"));
      expect(panel.status.getAttribute("role")).toBe("alert");
      expect(panel.status.textContent).toBe("Check failed: Returned DXF does not declare centimeters");
      expect(panel.status.textContent).not.toContain("pieces");

      panel.choose(panel.source, "tampered-source.json");
      panel.choose(panel.returned, "valid.dxf");
      panel.check.dispatchEvent(new Event("click"));
      await vi.waitFor(() => expect(panel.status.textContent).not.toBe("Checking locally…"));
      expect(panel.status.textContent).toBe("Check failed: Source package failed its integrity check");
      expect(panel.status.textContent).not.toContain("pieces");
    } finally {
      vi.unstubAllGlobals();
    }
  }, 30_000);

  it("shows actual auditor reasons for malformed and misleading returns without partial counts", async () => {
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    try {
      const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
      const graded = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft)[2]!;
      const sourcePackage = await createDxfInterchangePackage(recipe, graded);
      const firstBlock = readNamedDxfDrawing(sourcePackage.dxf).blocks[0]!;
      const cut = firstBlock.entities.find((entity) => dxfEntityTypeAndLayer(entity).layer === "CUT")!;
      const firstPieceName = sourcePackage.manifest.pieces[0]!.blockName;
      const entitiesSection = sourcePackage.dxf.indexOf("0\nSECTION\n2\nENTITIES\n");
      const identityAt = sourcePackage.dxf.indexOf(`2\n${firstPieceName}\n`, entitiesSection);
      const missingIdentity = `${sourcePackage.dxf.slice(0, identityAt)}2\nS718_MISSING_PIECE\n` +
        sourcePackage.dxf.slice(identityAt + `2\n${firstPieceName}\n`.length);
      const wrongLayer = replaceDxfEntity(sourcePackage.dxf, cut, (entity) =>
        entity.replace("\n8\nCUT\n", "\n8\nUNEXPECTED\n"),
      );
      const nonFiniteGeometry = replaceDxfEntity(sourcePackage.dxf, cut, (entity) => {
        const lines = entity.split("\n");
        const vertex = lines.findIndex((line, index) => line === "0" && lines[index + 1] === "VERTEX");
        const x = lines.findIndex((line, index) => index > vertex && line === "10");
        lines[x + 1] = "NaN";
        return lines.join("\n");
      });
      const outsideTolerance = replaceDxfEntity(sourcePackage.dxf, cut, (entity) => shiftMiddleVertex(entity, 0.01));
      const missingOutline = replaceDxfEntity(sourcePackage.dxf, cut, () => "");
      const firstInsert = readNamedDxfDrawing(sourcePackage.dxf).inserts[0]!.entity;
      const entitiesEnd = sourcePackage.dxf.indexOf("0\nENDSEC\n", entitiesSection);
      const duplicatePiece = `${sourcePackage.dxf.slice(0, entitiesEnd)}${firstInsert}${sourcePackage.dxf.slice(entitiesEnd)}`;
      const failures = [
        { name: "malformed.dxf", dxf: sourcePackage.dxf.replace("0\nSECTION\n2\nBLOCKS\n", "0\nSECTION\n2\nBROKEN\n") },
        { name: "missing-identity.dxf", dxf: missingIdentity },
        { name: "wrong-layer.dxf", dxf: wrongLayer },
        { name: "non-finite.dxf", dxf: nonFiniteGeometry },
        { name: "outside-tolerance.dxf", dxf: outsideTolerance },
        { name: "missing-outline.dxf", dxf: missingOutline },
        { name: "duplicate-piece.dxf", dxf: duplicatePiece },
      ];
      const fileContents = new Map([["source.json", JSON.stringify(sourcePackage)]]);
      for (const failure of failures) fileContents.set(failure.name, failure.dxf);
      const panel = setup({
        audit: (candidate, returnedDxf) => auditDxfInterchangeRoundTrip(candidate as never, returnedDxf),
        readFile: vi.fn(async (file) => fileContents.get(file.name) ?? ""),
      });
      panel.choose(panel.source, "source.json");

      for (const failure of failures) {
        const expected = await auditDxfInterchangeRoundTrip(sourcePackage, failure.dxf);
        expect(expected.passed, failure.name).toBe(false);
        panel.choose(panel.returned, failure.name);
        panel.check.dispatchEvent(new Event("click"));
        await vi.waitFor(() => expect(panel.status.textContent).not.toBe("Checking locally…"));
        expect(panel.status.getAttribute("role"), failure.name).toBe("alert");
        expect(panel.status.textContent, failure.name).toBe(`Check failed: ${expected.reason}`);
        expect(panel.status.textContent, failure.name).not.toMatch(/\b(pieces|outlines|mark entities|maximum difference)\b/u);
      }
    } finally {
      vi.unstubAllGlobals();
    }
  }, 30_000);

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
