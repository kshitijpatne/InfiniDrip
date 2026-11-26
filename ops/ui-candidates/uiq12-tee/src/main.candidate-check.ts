// @vitest-environment jsdom
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import markup from "../index.html?raw";
import capturedWorkingCopy from "../fixtures/captured-classic-working-copy.json?raw";
import type { Assembly, AssemblySource } from "./assembly-contract";

const fixtures = vi.hoisted(() => ({
  draw: {
    show: vi.fn(), clear: vi.fn(), select: vi.fn(), turn: vi.fn(), zoomBy: vi.fn(), resetView: vi.fn(), dispose: vi.fn(),
    projectSeam: vi.fn(() => ({ x: 50, y: 100 })), projectLandmarks: vi.fn(() => ({ apex: { x: 1, y: 2 } })),
    stats: vi.fn(() => ({ geometries: 1, textures: 0, programs: 1, draws: 1 })), viewState: vi.fn(() => [1, 2, 3]),
  },
  mount: vi.fn(), assemble: vi.fn(),
}));
vi.mock("./direct-three", () => ({ default: fixtures.mount }));
vi.mock("./assembly-mesh", () => ({ assembleTee: fixtures.assemble }));

const byId = (id: string) => document.getElementById(id)!;
const state = () => byId("status").dataset.state;
const data = () => (window as unknown as { teeProof: {
  diagnostics(): { revision: string | null; generation: number; selectedSeam: string | null; assembly: Assembly | null };
  projectSeam(id: string): { x: number; y: number } | null;
  projectLandmarks(): Readonly<Record<string, { x: number; y: number }>>;
} }).teeProof;
const stateIs = (expected: string) => vi.waitFor(() => expect(state()).toBe(expected));
const click = (id: string) => byId(id).click();
const change = (id: string, value: string) => {
  const element = byId(id) as HTMLInputElement;
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
};

function assemble(source: AssemblySource) {
  return {
    revision: source.revision, seams: [{
      id: "cap-front:right", label: "front cap", sides: [
        { instance: "sleeve:right", edge: "capLeft", parameters: [0, 1] },
        { instance: "front:right", edge: "armhole", parameters: [1, 0] },
      ],
    }],
  };
}

const loseContext = vi.fn();
const intelRenderer = "ANGLE (Intel, Intel(R) Graphics (0x00007D45) Direct3D11 vs_5_0 ps_5_0, D3D11)";
const getRenderer = vi.fn();
const getExtension = vi.fn();
const context = { isContextLost: vi.fn(() => false), getParameter: getRenderer, getExtension } as unknown as WebGL2RenderingContext;
const canvasPrototype: { getContext(kind: "webgl2"): WebGL2RenderingContext | null } = HTMLCanvasElement.prototype;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubGlobal("crypto", webcrypto);
  getRenderer.mockReturnValue(intelRenderer);
  getExtension.mockImplementation((name: string) =>
    name === "WEBGL_debug_renderer_info" ? { UNMASKED_RENDERER_WEBGL: 0x9246 } : { loseContext });
  document.body.innerHTML = new DOMParser().parseFromString(markup, "text/html").body.innerHTML;
  localStorage.clear();
  vi.spyOn(canvasPrototype, "getContext").mockReturnValue(context);
  fixtures.assemble.mockImplementation(assemble);
  fixtures.mount.mockReturnValue(fixtures.draw);
});

afterEach(() => {
  window.dispatchEvent(new Event("pagehide"));
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function start() {
  await import("./main");
  await vi.waitFor(() => expect(byId("draft-revision").dataset.revision).toBeTruthy());
}

describe("isolated verification screen wiring", () => {
  it("keeps the last valid 2D draft usable when the current 3D draft cannot resolve", async () => {
    await start();
    click("open-3d");
    await stateIs("ready");
    const pattern = byId("pattern");
    const previousMarkup = pattern.innerHTML;
    const { revision, generation } = data().diagnostics();
    expect(data().diagnostics().assembly?.revision).toBe(revision);

    change("length", "");
    await stateIs("error");
    expect(data().diagnostics().generation).toBeGreaterThan(generation);
    expect(byId("status").textContent).toBe("3D paused. Correct the draft inputs to continue.");
    expect(byId("draft-message").textContent).toContain("The last 2D drawing remains visible.");
    expect(data().diagnostics()).toMatchObject({ revision, assembly: null });
    expect(pattern.innerHTML).toBe(previousMarkup);
    expect(pattern.dataset.revision).toBe(revision);
    expect(document.querySelector("canvas")?.hidden).toBe(true);

    change("length", "72");
    await stateIs("ready");
    expect(pattern.innerHTML).not.toBe(previousMarkup);
    expect(pattern.dataset.revision).not.toBe(revision);
    expect(data().diagnostics().assembly?.revision).toBe(pattern.dataset.revision);
  });

  it("keeps 3D closed when its delayed renderer import rejects", async () => {
    let rejectRenderer!: (error: Error) => void;
    const loading = new Promise<never>((_resolve, reject) => { rejectRenderer = reject; });
    const load = vi.fn(() => loading);
    vi.doMock("./direct-three", load);
    try {
      await start();
      const revision = data().diagnostics().revision;
      click("open-3d");
      await vi.waitFor(() => expect(load).toHaveBeenCalledOnce());
      click("close-3d");
      await stateIs("closed");
      rejectRenderer(new Error("Delayed renderer chunk failure"));
      await vi.dynamicImportSettled();
      expect(state()).toBe("closed");
      expect(data().diagnostics()).toMatchObject({ revision, assembly: null });
      expect(document.querySelector("canvas")).toBeNull();
    } finally {
      vi.doMock("./direct-three", () => ({ default: fixtures.mount }));
    }
  });

  it("opens on demand, selects exact parameters, keeps camera controls live, and rejects old picks", async () => {
    await start();
    expect(data().projectSeam("cap-front:right")).toBeNull();
    expect(data().projectLandmarks()).toEqual({});
    expect(fixtures.mount).not.toHaveBeenCalled();
    byId("seams").dispatchEvent(new Event("change"));
    click("open-3d");
    await stateIs("ready");
    expect(data().projectSeam("cap-front:right")).toEqual({ x: 50, y: 100 });
    expect(data().projectLandmarks()).toEqual({ apex: { x: 1, y: 2 } });
    const select = byId("seams") as HTMLSelectElement;
    select.value = "cap-front:right";
    select.dispatchEvent(new Event("change"));
    expect(data().diagnostics().selectedSeam).toBe("cap-front:right");
    expect(byId("seam-detail").textContent).toContain("front:right armhole t=1→0");
    expect(document.querySelectorAll("[data-highlighted=true]")).toHaveLength(2);
    select.value = "";
    select.dispatchEvent(new Event("change"));
    expect(document.querySelectorAll("[data-highlighted=true]")).toHaveLength(0);
    select.value = "cap-front:right";
    select.dispatchEvent(new Event("change"));
    for (const id of ["turn-left", "turn-right", "zoom-in", "zoom-out", "reset-view"]) click(id);
    expect(fixtures.draw.turn).toHaveBeenCalledTimes(2);
    expect(fixtures.draw.zoomBy).toHaveBeenCalledTimes(2);
    expect(fixtures.draw.resetView).toHaveBeenCalledOnce();
    const revision = data().diagnostics().revision;
    change("length", "72");
    await stateIs("ready");
    expect(fixtures.mount).toHaveBeenCalledOnce();
    fixtures.mount.mock.calls[0][2](revision, "old seam");
    expect(data().diagnostics().selectedSeam).toBe("cap-front:right");
    delete byId("pattern").dataset.revision;
    select.dispatchEvent(new Event("change"));
    expect(data().diagnostics().selectedSeam).toBe("cap-front:right");
    click("close-3d");
    await stateIs("closed");
    expect(fixtures.draw.dispose).toHaveBeenCalledOnce();
  });

  it("preserves usable 2D on no-WebGL startup, invalid drafts and renderer errors", async () => {
    await start();
    const revision = data().diagnostics().revision;
    vi.mocked(canvasPrototype.getContext).mockImplementationOnce(() => { throw new Error("unavailable"); });
    click("open-3d");
    await stateIs("unsupported");
    vi.mocked(canvasPrototype.getContext).mockReturnValueOnce(null);
    click("open-3d");
    await stateIs("unsupported");
    expect(fixtures.mount).not.toHaveBeenCalled();
    change("chest", "190");
    await vi.waitFor(() => expect(byId("draft-message").textContent).toMatch(/last 2D/));
    expect(data().diagnostics().revision).toBe(revision);
    expect(byId("draft-message").textContent).toMatch(/last 2D/);
    fixtures.assemble.mockReturnValueOnce({ revision: "stale", seams: [] });
    change("chest", "100");
    click("open-3d");
    await stateIs("error");
    expect(byId("status").textContent).toMatch(/revision does not match/);
    click("close-3d");
    expect(loseContext).toHaveBeenCalled();
  });

  it("keeps edited and reopened 2D available on identified software WebGL and retries after explicit Open", async () => {
    await start();
    const pattern = byId("pattern");
    const initial = pattern.innerHTML;
    getRenderer.mockReturnValue("ANGLE (Google, Vulkan (SwiftShader Device), SwiftShader driver)");
    click("open-3d");
    await stateIs("unsupported");
    expect(byId("status").textContent).toMatch(/software WebGL/i);
    expect(pattern.innerHTML).toBe(initial);
    expect(document.querySelector("canvas")).toBeNull();
    expect(data().diagnostics().assembly).toBeNull();
    expect(loseContext).toHaveBeenCalledOnce();

    change("length", "72");
    await vi.waitFor(() => expect(pattern.innerHTML).not.toBe(initial));
    const edited = pattern.innerHTML;
    click("save-draft");
    await vi.waitFor(() => expect(byId("draft-message").textContent).toMatch(/saved locally/));
    click("undo");
    await vi.waitFor(() => expect(pattern.innerHTML).toBe(initial));
    click("reopen-draft");
    await vi.waitFor(() => expect(pattern.innerHTML).toBe(edited));
    expect(state()).toBe("unsupported");
    expect(canvasPrototype.getContext).toHaveBeenCalledTimes(1);
    expect(fixtures.mount).not.toHaveBeenCalled();

    getRenderer.mockReturnValue(intelRenderer);
    click("open-3d");
    await stateIs("ready");
    expect(data().diagnostics().assembly?.revision).toBe(pattern.dataset.revision);
  });

  it.each(["masked", "unknown"])("keeps 2D when the renderer identity is %s", async (kind) => {
    if (kind === "masked") getExtension.mockReturnValue(null);
    else getRenderer.mockReturnValue("Unidentified WebGL implementation");
    await start();
    click("open-3d");
    await stateIs("unsupported");
    expect(byId("status").textContent).toMatch(/could not verify hardware acceleration/i);
    expect(document.querySelector("canvas")).toBeNull();
    expect(fixtures.mount).not.toHaveBeenCalled();
  });

  it("keeps 2D content on native events and starts a new canvas after restoration", async () => {
    await start();
    click("open-3d");
    await stateIs("ready");
    const old = document.querySelector("canvas")!;
    const pattern = byId("pattern").innerHTML;
    old.dispatchEvent(new Event("webglcontextrestored"));
    await Promise.resolve();
    expect(document.querySelector("canvas")).toBe(old);
    expect(old.dispatchEvent(new Event("webglcontextlost", { cancelable: true }))).toBe(false);
    await stateIs("lost");
    expect(byId("pattern").innerHTML).toBe(pattern);
    change("length", "72");
    await vi.waitFor(() => expect(byId("pattern").innerHTML).not.toBe(pattern));
    expect(state()).toBe("lost");
    old.dispatchEvent(new Event("webglcontextrestored"));
    await stateIs("ready");
    expect(document.querySelector("canvas")).not.toBe(old);
    expect(fixtures.mount).toHaveBeenCalledTimes(2);
    expect(fixtures.draw.dispose).toHaveBeenCalledOnce();
  });

  it("reopens the captured custom project with project identity in its rendered receipt", async () => {
    await start();
    const { projectSource: { activeStyle } } = JSON.parse(capturedWorkingCopy);
    const receipt = byId("draft-revision");
    expect(receipt.dataset.starterId).toBe("tee-classic-digital-v1");
    localStorage.setItem("infinidrip-uiq12-tee-draft-v1", capturedWorkingCopy);
    click("reopen-draft");
    await vi.waitFor(() => expect(receipt.dataset.projectStyleId).toBe(activeStyle.id));
    expect(receipt.dataset.projectStyleRevision).toBe(String(activeStyle.revision));
    expect([receipt.dataset.starterId, receipt.dataset.starterRevision, receipt.dataset.recipeRevision])
      .toEqual(["", "", ""]);
    expect((byId("size") as HTMLSelectElement).disabled).toBe(true);
    click("open-3d");
    await stateIs("ready");
    expect(data().diagnostics().assembly?.revision).toBe(receipt.dataset.revision);
  });

  it("saves, reopens, undoes, redoes and explicitly blocks a stale semantic edit", async () => {
    await start();
    click("reopen-draft");
    await vi.waitFor(() => expect(byId("draft-message").textContent).toMatch(/no saved/));
    const base = data().diagnostics().revision;
    click("fixture-edited");
    await vi.waitFor(() => expect(data().diagnostics().revision).not.toBe(base));
    const edited = data().diagnostics().revision;
    click("save-draft");
    await vi.waitFor(() => expect(byId("draft-message").textContent).toMatch(/saved locally/));
    click("undo");
    await vi.waitFor(() => expect(data().diagnostics().revision).toBe(base));
    click("redo");
    await vi.waitFor(() => expect(data().diagnostics().revision).toBe(edited));
    click("fixture-default");
    await vi.waitFor(() => expect(data().diagnostics().revision).toBe(base));
    click("reopen-draft");
    await vi.waitFor(() => expect(data().diagnostics().revision).toBe(edited));
    click("open-3d");
    await stateIs("ready");
    change("chest", "105");
    await stateIs("error");
    expect(byId("draft-message").textContent).toMatch(/rebase or remove/);
    click("clear-edits");
    await stateIs("ready");
    change("size", "custom");
    await stateIs("ready");
    click("use-chest-ease");
    await stateIs("ready");
    expect((byId("chestEase") as HTMLInputElement).disabled).toBe(false);
  });

  it("preserves an anchor move across visibility changes and rebuilds after page cache restore", async () => {
    await import("./main");
    expect(data().diagnostics().revision).toBeNull();
    await vi.waitFor(() => expect(data().diagnostics().revision).toBeTruthy());
    const before = data().diagnostics().revision;
    click("apply-asymmetric");
    click("open-3d");
    await stateIs("ready");
    await vi.waitFor(() => expect(data().diagnostics().revision).not.toBe(before));
    const snapshot = data().diagnostics().revision;
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    expect(document.querySelector("canvas")).toBeNull();
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    await stateIs("ready");
    expect(data().diagnostics().revision).toBe(snapshot);
    const beforePageshow = data().diagnostics().generation;
    window.dispatchEvent(new PageTransitionEvent("pageshow"));
    expect(data().diagnostics().generation).toBe(beforePageshow);
  });

  it("surfaces invalid anchor moves and save failures beside the existing drawing", async () => {
    await start();
    const current = data().diagnostics().revision;
    (byId("delta-x") as HTMLInputElement).value = "";
    click("apply-anchor");
    await vi.waitFor(() => expect(byId("draft-message").textContent).toMatch(/finite/));
    expect(data().diagnostics().revision).toBe(current);
    change("chest", "999");
    await vi.waitFor(() => expect(byId("draft-message").textContent).toMatch(/last 2D drawing/));
    click("save-draft");
    await vi.waitFor(() => expect(byId("draft-message").textContent).toMatch(/Could not save/));
    fixtures.assemble.mockImplementationOnce(() => { throw "assembly failed"; });
    change("chest", "100");
    click("open-3d");
    await stateIs("error");
    expect(byId("status").textContent).toMatch(/assembly failed/);
    expect(data().diagnostics().revision).toBe(current);
  });

  it("drops a delayed assembly module when the view closes before it resolves", async () => {
    let resolveImport!: () => void;
    const pendingImport = new Promise<void>(resolve => { resolveImport = resolve; });
    let importStarted = false;
    vi.doMock("./assembly-mesh", async () => {
      importStarted = true;
      await pendingImport;
      return { assembleTee: fixtures.assemble };
    });
    try {
      await start();
      click("open-3d");
      await vi.waitFor(() => expect(importStarted).toBe(true));
      click("close-3d");
      resolveImport();
      await import("./assembly-mesh");
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(state()).toBe("closed");
      expect(fixtures.assemble).not.toHaveBeenCalled();
      expect(fixtures.mount).not.toHaveBeenCalled();
    } finally {
      resolveImport();
      vi.doUnmock("./assembly-mesh");
    }
  });
});
