import {
  Chart,
  type AssemblyPanel,
  type JoinDefinition,
  type PanelOrientation,
  type Point2,
  type Point3,
} from './assembly-contract';
import { arc } from './seam-correspondence';
import { assemblePattern } from './assembly-mesh';
import type { Edge } from '../../../../src/drafting/piece';

/** Two hinged rectangular swatches. No garment roles, fold, sleeve or ease. */
export function hingedSwatches() {
  const square: Point2[] = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 3 },
    { x: 0, y: 3 },
  ];
  const frames: Point3[][] = [
    [
      [0, 0, 0],
      [2, 0, 0],
      [2, 3, 0],
      [0, 3, 0],
    ],
    [
      [2, 0, 0],
      [2, 0, 2],
      [2, 3, 2],
      [2, 3, 0],
    ],
  ];
  const panels = frames.map((vertices, i) => {
    const role = i === 0 ? 'base' : 'flap',
      chart = new Chart(role, role);
    const edges: Edge[] = square.map((p, k) => ({
      kind: 'line',
      name: ['top', 'east', 'bottom', 'west'][k],
      start: p,
      end: square[(k + 1) % 4],
    }));
    vertices.forEach((v, k) => chart.vertex(square[k], v, v));
    chart.cell(0, 1, 2, 3, false);
    edges.forEach((e, k) => chart.trace(role, arc(e), [k, (k + 1) % 4], [0, 1]));
    return chart.finish({ name: role, onFold: false, edges }, square);
  });
  const definitions: JoinDefinition[] = [
    {
      id: 'hinge',
      label: 'swatch hinge',
      sides: [
        { role: 'base', instance: 'base', edge: 'east', reversed: false },
        { role: 'flap', instance: 'flap', edge: 'west', reversed: true },
      ],
    },
  ];
  const orientation = (panel: AssemblyPanel<string>): PanelOrientation => ({
    restSign: 1,
    folds: [],
    outward: () => (panel.role === 'base' ? [0, 0, 1] : [-1, 0, 0]),
  });
  return { result: assemblePattern(panels, definitions, orientation), panels, definitions, orientation };
}
