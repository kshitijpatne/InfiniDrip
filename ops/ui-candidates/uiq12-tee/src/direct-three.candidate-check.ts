// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";
import { Line, Mesh } from "three";
import type { Group, Scene } from "three";
import type { Assembly, AssemblyPanel, AssemblySeam, BoundaryTrace, Point3 } from "./assembly-contract";
import mountTeeRenderer from "./direct-three";

const { gl } = vi.hoisted(() => ({
  gl: {
    setSize: vi.fn(),
    dispose: vi.fn(),
    render: vi.fn(),
    info: { memory: { geometries: 2, textures: 0 }, programs: null as object[] | null },
  },
}));

vi.mock("three", async (importOriginal) => ({
  ...await importOriginal<typeof import("three")>(),
  WebGLRenderer: vi.fn(() => gl),
}));

function panel(role: "front" | "back", z: number, halfWidth: number): AssemblyPanel {
  const points: Point3[] = [[-halfWidth, -4, z], [halfWidth, -4, z], [halfWidth, 4, z], [-halfWidth, 4, z]];
  return {
    id: role,
    role,
    positions: points.flat(),
    indices: [0, 1, 2, 0, 2, 3],
    rest: points.map(([x, y]) => ({ x, y })),
    seed: points,
    traces: [],
    sewingPiece: { name: role, onFold: false, edges: [] },
    cutLine: [],
  };
}

function seam(id: string, z: number, x = 0): AssemblySeam {
  const trace: BoundaryTrace = {
    role: id, edge: "test", instance: id, reversed: false,
    panel: id, indices: [], parameters: [], restLengthCm: 4,
  };
  return { id, label: id, points: [[x, -2, z], [x, 0, z], [x, 2, z]], sides: [trace, trace] };
}

const fixture = (revision: string, halfWidth = 4): Assembly => ({
  version: 1,
  units: "cm",
  revision,
  panels: [panel("front", 2, halfWidth), panel("back", -2, halfWidth)],
  seams: [seam("front-join", 2), seam("back-join", -2), seam("overlap", 2), seam("outer", 2, halfWidth + 0.1)],
  diagnostics: {
    triangles: 4, minWorldAreaCm2: 1, minRestAreaCm2: 1, maxSeamGapCm: 0, maxArcAuditErrorCm: 0,
    arcAudit: [], maxIntegrationErrorCm: 0,
    signedCapEaseCm: 1.5, wrongWholeSeamApexMissCm: 0, capIntervals: [],
    landmarks: [
      { id: "center", point: [0, 0, 0], references: [], residualCm: 0 },
      { id: "rear", point: [0, 0, -2], references: [], residualCm: 0 },
    ],
    frontHemSpanCm: 8, frontVerticalSpanCm: 8, seedPlacement: "test", intersections: 0,
  },
});

function mount(lost = false, hasExtension = true) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  canvas.setPointerCapture = vi.fn();
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue(new DOMRect(10, 20, 640, 480));
  const loseContext = vi.fn();
  const getExtension = vi.fn(() => hasExtension ? { loseContext } : null);
  const context = { isContextLost: () => lost, getExtension };
  const onPick = vi.fn();
  const api = mountTeeRenderer(canvas, context as unknown as WebGL2RenderingContext, onPick);
  return { api, canvas, loseContext, getExtension, onPick };
}

function pointer(canvas: HTMLCanvasElement, kind: string, x: number, y: number, pointerId = 1, button = 0) {
  const event = new MouseEvent(kind, { clientX: x, clientY: y, button });
  Object.defineProperty(event, "pointerId", { value: pointerId });
  canvas.dispatchEvent(event);
}

function currentGarment() {
  const scene = gl.render.mock.lastCall![0] as Scene;
  return scene.children.at(-1) as Group;
}

beforeEach(() => {
  vi.clearAllMocks();
  gl.info.programs = null;
});

it("renders immutable source buffers on demand and retains view through an empty/loading revision", () => {
  const { api, loseContext } = mount();
  api.resetView();
  api.clear();
  expect(api.stats()).toEqual({ draws: 0, programs: 0, geometries: 2, textures: 0 });
  expect(gl.setSize).toHaveBeenCalledWith(640, 480, false);

  const first = fixture("first");
  api.show(first);
  const front = currentGarment().getObjectByName("front") as Mesh;
  const frontSeam = currentGarment().getObjectByName("front-join") as Line;
  const otherSeam = currentGarment().getObjectByName("back-join") as Line;
  expect(Array.from(front.geometry.getAttribute("position").array)).toEqual(first.panels[0].positions);
  expect(Array.from(front.geometry.index!.array)).toEqual(first.panels[0].indices);
  const normal = otherSeam.material;
  expect(frontSeam.material).toBe(normal);

  api.select("front-join");
  expect(otherSeam.material).toBe(normal);
  expect(frontSeam.material).not.toBe(normal);
  api.select("front-join");
  expect(api.stats().draws).toBe(2);
  api.turn(0.4);
  api.zoomBy(1.2);
  api.zoomBy(-1);
  api.zoomBy(Infinity);
  expect(api.stats().draws).toBe(4);
  const camera = api.viewState();

  const releasePanel = vi.spyOn(front.geometry, "dispose");
  const releaseSeam = vi.spyOn(frontSeam.geometry, "dispose");
  api.clear();
  expect(api.viewState()).toEqual(camera);
  expect(releasePanel).toHaveBeenCalledOnce();
  expect(releaseSeam).toHaveBeenCalledOnce();
  expect(currentGarment().children).toEqual([]);

  api.show(fixture("second", 9));
  expect(api.viewState()).toEqual(camera);
  api.resetView();
  expect(api.viewState()).not.toEqual(camera);
  expect(api.stats().draws).toBe(7);
  gl.info.programs = [{}];
  expect(api.stats().programs).toBe(1);

  api.dispose();
  api.dispose();
  expect(gl.dispose).toHaveBeenCalledOnce();
  expect(loseContext).toHaveBeenCalledOnce();
});

it("picks one visible seam with exact revision through verified view-space raycasting", () => {
  const { api, canvas, onPick } = mount();
  expect(api.projectSeam("front-join")).toBeNull();
  api.show(fixture("line-source"));
  expect(api.projectSeam("unknown")).toBeNull();
  expect(api.projectSeam("back-join")).toBeNull();
  expect(api.projectSeam("overlap")).toBeNull();

  const point = api.projectSeam("front-join")!;
  expect(point).toBeTruthy();
  pointer(canvas, "pointerdown", point.x, point.y);
  pointer(canvas, "pointerdown", point.x, point.y, 2);
  pointer(canvas, "pointermove", point.x, point.y, 2);
  pointer(canvas, "pointermove", point.x, point.y);
  pointer(canvas, "pointerup", point.x, point.y, 2);
  pointer(canvas, "pointerup", point.x, point.y);
  expect(canvas.setPointerCapture).toHaveBeenCalledOnce();
  expect(onPick).toHaveBeenCalledWith("line-source", "front-join");
  expect(onPick).toHaveBeenCalledOnce();

  // The panel is eight cm wide and the `outer` seam is beyond the viewport after zooming.
  api.zoomBy(6);
  expect(api.projectSeam("outer")).toBeNull();
  api.resetView();
  vi.mocked(canvas.getBoundingClientRect).mockReturnValueOnce(new DOMRect(10, 20, 0, 480));
  expect(api.projectSeam("front-join")).toBeNull();
  vi.mocked(canvas.getBoundingClientRect).mockReturnValueOnce(new DOMRect(10, 20, 640, 0));
  expect(api.projectSeam("front-join")).toBeNull();

  pointer(canvas, "pointerdown", 12, 22);
  pointer(canvas, "pointerup", 12, 22);
  expect(onPick).toHaveBeenCalledOnce();
});

it("drops held picks on clear and replacement, even when undo restores the same source revision", () => {
  const { api, canvas, onPick } = mount();
  const original = fixture("repeatable-revision");
  api.show(original);
  const { x, y } = api.projectSeam("front-join")!;
  const camera = api.viewState();

  pointer(canvas, "pointerdown", x, y);
  api.clear();
  api.show(original);
  pointer(canvas, "pointermove", x + 24, y);
  pointer(canvas, "pointerup", x, y);
  pointer(canvas, "lostpointercapture", x, y);
  expect(onPick).not.toHaveBeenCalled();

  pointer(canvas, "pointerdown", x, y);
  api.show(original);
  pointer(canvas, "pointerdown", x, y, 2);
  pointer(canvas, "pointerup", x, y);
  pointer(canvas, "lostpointercapture", x, y);
  expect(onPick).not.toHaveBeenCalled();
  pointer(canvas, "pointerup", x, y, 2);
  expect(onPick).toHaveBeenCalledWith(original.revision, "front-join");
  expect(onPick).toHaveBeenCalledOnce();
  expect(api.viewState()).toEqual(camera);
});

it("projects every named landmark to the current canvas rectangle without an extra draw", () => {
  const { api } = mount();
  expect(api.projectLandmarks()).toEqual({});
  api.show(fixture("landmark-source"));
  const captured = api.projectLandmarks();
  expect(Object.keys(captured)).toEqual(["center", "rear"]);
  expect(captured.center.x).toBeCloseTo(330);
  expect(captured.center.y).toBeCloseTo(260);
  expect(api.stats().draws).toBe(1);

  api.turn(0.3);
  expect(api.projectLandmarks().rear.x).not.toBeCloseTo(captured.rear.x);
  expect(api.stats().draws).toBe(2);
  api.clear();
  expect(api.projectLandmarks()).toEqual({});
});

it("orbits from pointer drag, ignores unrelated events, and detaches controls on native loss", () => {
  const { api, canvas, getExtension, onPick } = mount(true);
  const initial = api.viewState();
  pointer(canvas, "pointerdown", 100, 80, 1, 2);
  pointer(canvas, "pointermove", 130, 120);
  pointer(canvas, "pointerup", 130, 120);
  expect(api.viewState()).toEqual(initial);

  // Even a real click during a cleared view has no source revision to publish.
  pointer(canvas, "pointerdown", 100, 80);
  pointer(canvas, "pointerup", 100, 80);
  expect(onPick).not.toHaveBeenCalled();

  api.show(fixture("drag"));
  const view = api.viewState();
  pointer(canvas, "pointerdown", 100, 80);
  pointer(canvas, "pointermove", 130, 120);
  pointer(canvas, "pointermove", 140, 130);
  pointer(canvas, "pointerup", 140, 130);
  expect(api.viewState()[0]).toBeCloseTo(view[0] - 0.48);
  expect(api.viewState()[1]).toBeCloseTo(view[1] + 0.6);
  expect(onPick).not.toHaveBeenCalled();

  pointer(canvas, "pointerdown", 100, 80);
  pointer(canvas, "lostpointercapture", 100, 80);
  pointer(canvas, "pointermove", 130, 120);
  expect(api.stats().draws).toBe(3);
  api.dispose();
  pointer(canvas, "pointerdown", 100, 80);
  pointer(canvas, "pointermove", 130, 120);
  expect(api.stats().draws).toBe(3);
  expect(getExtension).not.toHaveBeenCalled();
});

it("releases resources without a native context-retirement extension", () => {
  const { api, getExtension, loseContext } = mount(false, false);
  api.dispose();
  expect(getExtension).toHaveBeenCalledWith("WEBGL_lose_context");
  expect(loseContext).not.toHaveBeenCalled();
});
