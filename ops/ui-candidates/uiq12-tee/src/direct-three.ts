import {
  Box3,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  Line,
  LineBasicMaterial,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import type { Assembly } from "./assembly-contract";

export interface TeeRenderer {
  show(assembly: Assembly): void;
  clear(): void;
  select(seamId: string | null): void;
  turn(deltaRadians: number): void;
  zoomBy(multiplier: number): void;
  resetView(): void;
  viewState(): readonly number[];
  projectSeam(seamId: string): { x: number; y: number } | null;
  projectLandmarks(): Readonly<Record<string, { x: number; y: number }>>;
  dispose(): void;
  stats(): { geometries: number; textures: number; programs: number; draws: number };
}

const defaultYaw = 0.28;
const defaultPitch = 0.16;
const interiorFractions = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.12, 0.88];

function viewportPoint(point: Vector3, rect: DOMRect) {
  return { x: rect.left + (point.x + 1) * rect.width / 2, y: rect.top + (1 - point.y) * rect.height / 2 };
}

export default function mountTeeRenderer(
  canvas: HTMLCanvasElement,
  context: WebGL2RenderingContext,
  onPick: (revision: string, seamId: string) => void,
): TeeRenderer {
  const renderer = new WebGLRenderer({ canvas, context });
  renderer.setSize(canvas.width, canvas.height, false);

  const scene = new Scene();
  scene.background = new Color("#172735");
  const key = new DirectionalLight("#fff4e6", 2.1);
  key.position.set(2, 4, 5);
  scene.add(new HemisphereLight("#ecf7ff", "#718392", 1.65), key);
  const garment = new Group();
  scene.add(garment);

  const panelStyle = {
    side: DoubleSide,
    roughness: 0.88,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  };
  const colors = {
    front: new MeshStandardMaterial({ ...panelStyle, color: "#8bbab5" }),
    back: new MeshStandardMaterial({ ...panelStyle, color: "#7da5ab" }),
    sleeve: new MeshStandardMaterial({ ...panelStyle, color: "#a9cbc1" }),
  };
  const seamNormal = new LineBasicMaterial({ color: "#234543" });
  const seamSelected = new LineBasicMaterial({ color: "#f9ac39" });
  const camera = new PerspectiveCamera(38, canvas.width / canvas.height, 0.1, 1600);
  const target = new Vector3();
  const bounds = new Box3();
  const ray = new Raycaster();
  const pointer = new Vector2();
  const listeners = new AbortController();

  let yaw = defaultYaw;
  let pitch = defaultPitch;
  let distance = 1;
  let fittedDistance = 1;
  let draws = 0;
  let disposed = false;
  let hasView = false;
  let selected: string | null = null;
  let shown: Assembly | null = null;
  let panels: Mesh[] = [];
  let lines: Line<BufferGeometry, LineBasicMaterial>[] = [];
  let drag: { pointerId: number; x: number; y: number; moved: boolean } | null = null;

  function draw() {
    const horizontal = distance * Math.cos(pitch);
    camera.position.set(
      target.x + horizontal * Math.sin(yaw),
      target.y + distance * Math.sin(pitch),
      target.z + horizontal * Math.cos(yaw),
    );
    camera.lookAt(target);
    camera.updateMatrixWorld();
    garment.updateMatrixWorld();
    renderer.render(scene, camera);
    draws += 1;
  }

  function fit() {
    bounds.getCenter(target);
    const { x, y, z } = bounds.getSize(new Vector3());
    const vertical = Math.hypot(y, z) / 2;
    const horizontal = Math.hypot(x, z) / (2 * camera.aspect);
    fittedDistance = Math.max(vertical, horizontal) * 1.12 / Math.tan(MathUtils.degToRad(camera.fov / 2)) + z / 2;
    distance = fittedDistance;
    yaw = defaultYaw;
    pitch = defaultPitch;
    hasView = true;
  }

  function clearGarment() {
    // A held gesture belongs to the geometry shown at pointerdown, even if the next revision ID repeats.
    drag = null;
    for (const object of garment.children as (Mesh | Line)[]) object.geometry.dispose();
    garment.clear();
    panels = [];
    lines = [];
  }

  function pickAt(x: number, y: number, rect = canvas.getBoundingClientRect()) {
    if (rect.width <= 0 || rect.height <= 0) return null;
    pointer.set((x - rect.left) * 2 / rect.width - 1, 1 - (y - rect.top) * 2 / rect.height);
    const tolerance = 10 * distance * Math.tan(MathUtils.degToRad(camera.fov / 2)) / rect.height;
    ray.params.Line = { threshold: tolerance };
    ray.setFromCamera(pointer, camera);
    const occlusion = ray.intersectObjects(panels, false)[0]?.distance ?? Infinity;
    let match: string | null = null;
    let smallestOffset = Infinity;
    for (const hit of ray.intersectObjects(lines, false)) {
      if (hit.distance > occlusion + tolerance) continue;
      // Depth has already been checked. Compare screen coordinates only.
      const projected = hit.point.project(camera);
      const cssOffset = Math.hypot((projected.x - pointer.x) * rect.width, (projected.y - pointer.y) * rect.height);
      if (cssOffset >= smallestOffset) continue;
      smallestOffset = cssOffset;
      match = hit.object.name;
    }
    return match;
  }

  const eventOptions = { signal: listeners.signal };
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || drag) return;
    drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    canvas.setPointerCapture(event.pointerId);
  }, eventOptions);
  canvas.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 3) return;
    drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: true };
    yaw -= dx * 0.012;
    pitch = MathUtils.clamp(pitch + dy * 0.012, -1.2, 1.2);
    draw();
  }, eventOptions);
  canvas.addEventListener("pointerup", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const moved = drag.moved;
    drag = null;
    if (moved || !shown) return;
    const seamId = pickAt(event.clientX, event.clientY);
    if (seamId !== null) onPick(shown.revision, seamId);
  }, eventOptions);
  canvas.addEventListener("lostpointercapture", (event) => {
    if (drag?.pointerId === event.pointerId) drag = null;
  }, eventOptions);

  return {
    show(assembly) {
      clearGarment();
      bounds.makeEmpty();
      for (const panel of assembly.panels) {
        const geometry = new BufferGeometry();
        geometry.setAttribute("position", new Float32BufferAttribute(panel.positions, 3));
        geometry.setIndex(Array.from(panel.indices));
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        bounds.union(geometry.boundingBox!);
        const mesh = new Mesh(geometry, colors[panel.role]);
        mesh.name = panel.id;
        panels.push(mesh);
        garment.add(mesh);
      }
      for (const seam of assembly.seams) {
        const geometry = new BufferGeometry();
        geometry.setAttribute("position", new Float32BufferAttribute(seam.points.flat(), 3));
        const line = new Line(geometry, seam.id === selected ? seamSelected : seamNormal);
        line.name = seam.id;
        lines.push(line);
        garment.add(line);
      }
      if (!hasView) fit();
      shown = assembly;
      draw();
    },
    clear() {
      clearGarment();
      if (!shown) return;
      shown = null;
      draw();
    },
    select(seamId) {
      if (selected === seamId) return;
      selected = seamId;
      for (const line of lines) line.material = line.name === selected ? seamSelected : seamNormal;
      draw();
    },
    turn(deltaRadians) {
      yaw += deltaRadians;
      draw();
    },
    zoomBy(multiplier) {
      if (!(multiplier > 0) || !Number.isFinite(multiplier)) return;
      distance = MathUtils.clamp(distance / multiplier, fittedDistance * 0.3, fittedDistance * 3);
      draw();
    },
    resetView() {
      if (!shown) return;
      fit();
      draw();
    },
    viewState() {
      return [yaw, pitch, distance, target.x, target.y, target.z];
    },
    projectSeam(seamId) {
      const seam = shown?.seams.find((candidate) => candidate.id === seamId);
      if (!seam) return null;
      const rect = canvas.getBoundingClientRect();
      const end = seam.points.length - 1;
      for (const fraction of interiorFractions) {
        const station = fraction * end;
        const segment = Math.floor(station);
        const point = new Vector3(...seam.points[segment]);
        point.lerp(new Vector3(...seam.points[segment + 1]), station - segment).project(camera);
        if (Math.max(Math.abs(point.x), Math.abs(point.y), Math.abs(point.z)) > 1) continue;
        const { x, y } = viewportPoint(point, rect);
        if (pickAt(x, y, rect) === seamId) return { x, y };
      }
      return null;
    },
    projectLandmarks() {
      if (!shown) return {};
      const rect = canvas.getBoundingClientRect();
      return Object.fromEntries(shown.diagnostics.landmarks.map(({ id, point }) => [
        id, viewportPoint(new Vector3(...point).project(camera), rect),
      ]));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      listeners.abort();
      clearGarment();
      for (const material of Object.values(colors)) material.dispose();
      seamNormal.dispose();
      seamSelected.dispose();
      renderer.dispose();
      if (!context.isContextLost()) context.getExtension("WEBGL_lose_context")?.loseContext();
    },
    stats() {
      const { memory, programs } = renderer.info;
      return { geometries: memory.geometries, textures: memory.textures, programs: programs?.length ?? 0, draws };
    },
  };
}
