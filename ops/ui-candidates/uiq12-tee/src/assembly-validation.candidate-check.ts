import { expect, it } from 'vitest';
import { checkIntersections, validateMesh } from './assembly-validation';
import { hingedSwatches } from './topology-fixture';
import type { AssemblyPanel, AssemblySeam, Point3 } from './assembly-contract';
import { assembleTee } from './assembly-mesh';
import { classicOrientation, hands, teeJoins, sleeveLandmarks } from './tee-topology';
import { editedTeeInputs, resolveTeeDraft } from './tee-source';

type Face = Parameters<typeof checkIntersections>[0][number];
function face(points: Face['points'], ids: number[], normal: Point3 = [0, 0, 1]): Face {
  return {
    points,
    ids,
    normal,
    low: [0, 1, 2].map((k) => Math.min(...points.map((p) => p[k]))),
    high: [0, 1, 2].map((k) => Math.max(...points.map((p) => p[k]))),
    name: `face ${ids}`,
  };
}
it('detects penetrations, contained coplanar triangles, edge crossings and duplicate faces', () => {
  const base = face(
    [
      [-2, -1, 0],
      [2, -1, 0],
      [0, 2, 0],
    ],
    [0, 1, 2],
  );
  for (const other of [
    face(
      [
        [-2, 1, 0],
        [0, -2, 0],
        [2, 1, 0],
      ],
      [3, 4, 5],
    ),
    face(
      [
        [0, 0, 0],
        [0.2, 0, 0],
        [0.2, 0.2, 0],
      ],
      [3, 4, 5],
    ),
    face(
      [
        [0, -0.5, -1],
        [0, -0.5, 1],
        [0, 0.5, 0],
      ],
      [3, 4, 5],
      [1, 0, 0],
    ),
    face(
      [
        [-2, -1, 0],
        [2, -1, 0],
        [0, 2, 0],
      ],
      [0, 1, 2],
    ),
    face(
      [
        [-2, -1, 0],
        [0, 0, 0],
        [0, 1.5, 0],
      ],
      [0, 4, 5],
    ),
  ])
    expect(() => checkIntersections([base, other])).toThrow(/triangle intersection/);
});
it('validates rest and world winding, buffers, directed incidence, folds and complete named boundaries', () => {
  const { panels, orientation } = hingedSwatches();
  const p = panels[0];
  const check = (panel: AssemblyPanel<string>, folds: string[] = []) =>
    validateMesh([panel], [], [], () => ({ ...orientation(panel), folds }));
  expect(() => check({ ...p, positions: [] })).toThrow(/buffers/);
  expect(() => check({ ...p, indices: [0, 1] })).toThrow(/buffers/);
  expect(() => check({ ...p, indices: [] })).toThrow(/buffers/);
  expect(() => check({ ...p, indices: [0, 2, 9] })).toThrow(/reference/);
  expect(() => check({ ...p, indices: [1, 0, 2] })).toThrow(/inverted or degenerate/);
  expect(() => check({ ...p, positions: p.positions.map((v, i) => (i % 3 === 1 ? -v : v)) })).toThrow(
    /world winding/,
  );
  expect(() => check({ ...p, indices: [...p.indices, ...p.indices] })).toThrow(/repeated directed/);
  expect(() => check(p, ['west'])).toThrow(/fold has broken/);
  expect(() => check({ ...p, traces: [...p.traces, p.traces[0]] })).toThrow(/repeated boundary/);
  expect(() => check({ ...p, traces: p.traces.slice(1) })).toThrow(/unaccounted mesh boundary/);
});
it('rejects faulty seam addresses, handedness, station counts and post-placement gaps', () => {
  const { result, panels, definitions, orientation } = hingedSwatches();
  const seam = result.seams[0],
    a = seam.sides[0],
    b = seam.sides[1];
  const check = (seams: AssemblySeam[]) => validateMesh(panels, seams, definitions, orientation);
  expect(() => check([])).toThrow(/Missing or repeated/);
  expect(() => check([{ ...seam, id: 'other' }])).toThrow('Missing hinge');
  expect(() => check([{ ...seam, sides: [{ ...a, panel: 'other' }, b] }])).toThrow(/source trace/);
  expect(() => check([{ ...seam, sides: [a, { ...b, reversed: false }] }])).toThrow(/oriented/);
  expect(() => check([{ ...seam, sides: [a, { ...b, indices: [...b.indices].reverse() }] }])).toThrow(
    /landmark/,
  );
  expect(() => check([{ ...seam, sides: [a, { ...b, parameters: [0.1, 0] }] }])).toThrow(/landmark/);
  expect(() => check([{ ...seam, points: [seam.points[0]] }])).toThrow(/paired stations/);
  expect(() => check([{ ...seam, points: [[1.5, 0, 0], seam.points[1]] }])).toThrow(/gap/);
});
it('rejects whole-cap normalization faults independently on either hand of the asymmetric draft', async () => {
  const { source } = await resolveTeeDraft(await editedTeeInputs());
  const assembly = assembleTee(source);
  for (const hand of hands) {
    const panel = assembly.panels.find((p) => p.id === `sleeve:${hand}`)!;
    const cap = panel.traces.find((t) => t.edge === 'capLeft')!;
    const apex = cap.indices.at(-1)!;
    const wrong = panel.positions.map((v, k) =>
      k === apex * 3 + 1 ? v + assembly.diagnostics.wrongWholeSeamApexMissCm : v,
    );
    const mutated = assembly.panels.map((p) => (p === panel ? { ...p, positions: wrong } : p));
    expect(() => sleeveLandmarks(mutated)).toThrow(/apex: landmark gap/);
    const traces = panel.traces.map((t) =>
      t.edge === 'capRight' ? { ...t, indices: [t.indices[1], ...t.indices.slice(1)] } : t,
    );
    expect(() => sleeveLandmarks(assembly.panels.map((p) => (p === panel ? { ...p, traces } : p)))).toThrow(
      /wrong source landmark/,
    );
    expect(() => validateMesh(mutated, assembly.seams, hands.flatMap(teeJoins), classicOrientation)).toThrow(
      /cap-front.*gap/,
    );
  }
});

it('rejects duplicate definitions, same-side sewing and repeated physical edges', () => {
  const { result, panels, definitions, orientation } = hingedSwatches();
  const seam = result.seams[0],
    def = definitions[0];
  expect(() => validateMesh(panels, [seam, seam], [def, def], orientation)).toThrow(
    /Repeated physical seam ID/,
  );
  expect(() =>
    validateMesh(panels, [seam, { ...seam, id: 'second' }], [def, { ...def, id: 'second' }], orientation),
  ).toThrow(/repeated physical sewing edge/);
  const flipped = panels.map((p) => (p.role === 'flap' ? { ...p, indices: [0, 2, 1, 0, 3, 2] } : p));
  expect(() =>
    validateMesh(flipped, [seam], [def], (p) =>
      p.role === 'flap' ? { ...orientation(p), restSign: -1, outward: () => [1, 0, 0] } : orientation(p),
    ),
  ).toThrow(/same-directed/);
});
it('tests actual contact geometry even when a seam is within its permitted gap', () => {
  const a = face(
    [
      [0, 0, 0],
      [10, 0, 0],
      [5, 10, 0],
    ],
    [0, 1, 2],
  );
  const b = face(
    [
      [10, 0, 0.005],
      [0, 0, 0.005],
      [5, 10, -0.005],
    ],
    [1, 0, 3],
    [0, -0.01 / Math.hypot(10, 0.01), -10 / Math.hypot(10, 0.01)],
  );
  expect(() => checkIntersections([a, b])).toThrow(/intersection/);
});
