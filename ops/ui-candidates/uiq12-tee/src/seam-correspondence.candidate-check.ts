import { it, expect } from 'vitest';
import { arc, joinTraces } from './seam-correspondence';
import { hingedSwatches } from './topology-fixture';
import { assemblePattern } from './assembly-mesh';

it('assembles exact reversed sewing intervals on a distinct two-panel hinge', () => {
  const { result, definitions, orientation, panels } = hingedSwatches();
  const seam = result.seams[0];
  expect(result.audit).toEqual({
    minWorldAreaCm2: 3,
    minRestAreaCm2: 3,
    intersections: 0,
    triangles: 4,
    maxSeamGapCm: 0,
  });
  expect(seam.points).toEqual([
    [2, 0, 0],
    [2, 3, 0],
  ]);
  expect(seam.sides.map((t) => [t.instance, t.edge, t.parameters, t.restLengthCm])).toEqual([
    ['base', 'east', [0, 1], 3],
    ['flap', 'west', [1, 0], 3],
  ]);
  expect(() =>
    joinTraces('hole', 'hole', { ...seam.sides[0], indices: [1] }, seam.sides[1], new Map()),
  ).toThrow(/stations/);
  expect(() =>
    joinTraces(
      'hole',
      'hole',
      { ...seam.sides[0], indices: [1] },
      { ...seam.sides[1], indices: [1] },
      new Map(),
    ),
  ).toThrow(/stations/);
  expect(() =>
    assemblePattern(
      panels,
      [{ ...definitions[0], sides: [{ ...definitions[0].sides[0], edge: 'lost' }, definitions[0].sides[1]] }],
      orientation,
    ),
  ).toThrow(/unresolved/);
  expect(() => arc({ kind: 'line', name: 'empty', start: { x: 0, y: 0 }, end: { x: 0, y: 0 } })).toThrow(
    'Invalid sewing length',
  );
});
