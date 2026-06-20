// Browser smoke test: prove the geometry core AND the drafting engine work.
import { distance, point } from "./geometry";
import { STANDARD_M, draftFront, edgeLength, pieceEdge } from "./drafting";

const geo = distance(point(0, 0), point(3, 4));
const front = draftFront(STANDARD_M);
const armhole = edgeLength(pieceEdge(front, "armhole"));

document.querySelector<HTMLDivElement>("#app")!.textContent =
  `Geometry OK (distance = ${geo} cm). ` +
  `Front block drafted — armhole length ${armhole.toFixed(1)} cm.`;
