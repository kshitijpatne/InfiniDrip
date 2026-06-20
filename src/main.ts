// Browser smoke test: if the geometry core works, the page proves it on load.
import { point, distance } from "./geometry";

const sample = distance(point(0, 0), point(3, 4));
document.querySelector<HTMLDivElement>("#app")!.textContent =
  `Geometry core OK — distance (0,0) -> (3,4) = ${sample} cm`;
