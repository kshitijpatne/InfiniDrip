import { expect, it } from 'vitest';
import type { Piece, Edge } from '../../../../src/drafting/piece';
import { classicPanels, readTeeTopology } from './tee-topology';
import { defaultTeeInputs, resolveTeeDraft } from './tee-source';
import { arc } from './seam-correspondence';

it('validates original block roles, analytic edges, cut contours, stitch order and native limits', async () => {
  const { source } = await resolveTeeDraft(defaultTeeInputs());
  if (!source) throw new Error("Expected a valid Tee fixture.");
  const { block } = source,
    f = block.roles.front;
  const piece = (front: Piece) =>
    readTeeTopology({ ...source, block: { ...block, roles: { ...block.roles, front } } });
  const stitches = (ss: typeof block.stitches) =>
    readTeeTopology({ ...source, block: { ...block, stitches: ss } });
  expect(() => readTeeTopology({ ...source, revision: ' ' })).toThrow(/revision/);
  expect(() =>
    readTeeTopology({ ...source, block: { ...block, roles: { ...block.roles, pocket: f } } }),
  ).toThrow(/roles/);
  expect(() => piece({ ...f, onFold: false })).toThrow(/fold/);
  expect(() => piece({ ...f, edges: f.edges.slice(1) })).toThrow(/ordered/);
  expect(() => readTeeTopology({ ...source, cuts: {} })).toThrow(/cut line/);
  expect(() =>
    readTeeTopology({ ...source, cuts: { ...source.cuts, front: [{ x: NaN, y: 0 }, ...source.cuts.front] } }),
  ).toThrow(/cut line/);
  const n = f.edges[0];
  if (n.kind !== 'curve') throw Error('Wrong real fixture');
  expect(() =>
    piece({
      ...f,
      edges: [{ name: n.name, kind: 'line', start: n.curve.start, end: n.curve.end }, ...f.edges.slice(1)],
    }),
  ).toThrow(/unexpected edge geometry/);
  expect(() =>
    piece({ ...f, edges: [{ ...n, curve: { ...n.curve, end: { x: 99, y: 1 } } }, ...f.edges.slice(1)] }),
  ).toThrow(/endpoint/);
  expect(() => stitches(block.stitches.slice(1))).toThrow(/Dropped/);
  const cap = block.stitches[3],
    ss = block.stitches.slice(0, 3);
  expect(() => stitches([...ss, { ...cap, label: 'other' }])).toThrow(/missing stitch/);
  expect(() => stitches([...ss, { ...cap, ease: { lo: -1, hi: 5 } }])).toThrow(/ease rule/);
  for (const edges of [
    cap.b.edges.slice().reverse(),
    [cap.b.edges[0], cap.b.edges[0]],
    [{ ...cap.b.edges[0], reversed: true as const }, cap.b.edges[1]],
    cap.b.edges.slice(1),
  ]) {
    expect(() => stitches([...ss, { ...cap, b: { edges } }])).toThrow(/source references/);
  }
  const sleeve = block.roles.sleeve;
  const distorted = sleeve.edges.map((e) =>
    e.name === 'capLeft' && e.kind === 'curve'
      ? { ...e, curve: { ...e.curve, control1: { x: -100, y: -100 } } }
      : e,
  );
  expect(() =>
    readTeeTopology({
      ...source,
      block: { ...block, roles: { ...block.roles, sleeve: { ...sleeve, edges: distorted } } },
    }),
  ).toThrow(/Sleeve-cap ease/);
});
it('names violated coupled placement landmarks without a substitute mesh', async () => {
  const { source } = await resolveTeeDraft(defaultTeeInputs());
  if (!source) throw new Error("Expected a valid Tee fixture.");
  const curves = readTeeTopology(source);
  const shoulder: Edge = { kind: 'line', name: 'shoulder', start: { x: 8, y: 1 }, end: { x: 5, y: 4 } };
  expect(() =>
    classicPanels({ ...curves, front: { ...curves.front, shoulder: arc(shoulder) } }, source),
  ).toThrow(/shoulder or hem/);
  const badCap: Edge = { kind: 'line', name: 'capLeft', start: { x: 0, y: 2 }, end: { x: -1, y: 0 } };
  expect(() =>
    classicPanels({ ...curves, sleeve: { ...curves.sleeve, capLeft: arc(badCap) } }, source),
  ).toThrow(/cap apex/);
});

it('keeps both source-authorized signed sleeve-cap ease boundaries and rejects their immediate neighbors', async () => {
  const { source } = await resolveTeeDraft(defaultTeeInputs());
  if (!source) throw new Error("Expected a valid Tee fixture.");
  const { block } = source,
    sleeve = block.roles.sleeve;
  const armholes = [block.roles.front, block.roles.back].reduce(
    (sum, p) => sum + arc(p.edges.find((e) => e.name === 'armhole')!).length,
    0,
  );
  const scaleCap = (factor: number) => {
    const pt = (p: { x: number; y: number }) => ({ x: p.x * factor, y: p.y * factor });
    return sleeve.edges.map((e) =>
      e.kind === 'line'
        ? { ...e, start: pt(e.start), end: pt(e.end) }
        : {
            ...e,
            curve: {
              start: pt(e.curve.start),
              end: pt(e.curve.end),
              control1: pt(e.curve.control1),
              control2: pt(e.curve.control2),
            },
          },
    );
  };
  const total = (es: readonly Edge[]) =>
    es.filter((e) => e.kind === 'curve').reduce((sum, e) => sum + arc(e).length, 0) - armholes;
  for (const [target, valid] of [
    [-1 - 1e-7, false],
    [-1 + 1e-7, true],
    [4 - 1e-7, true],
    [4 + 1e-7, false],
  ] as const) {
    let low = 0.5,
      high = 3;
    for (let i = 0; i < 60; i++) {
      const mid = (low + high) / 2;
      if (total(scaleCap(mid)) < target) low = mid;
      else high = mid;
    }
    const edges = scaleCap((low + high) / 2);
    expect(total(edges)).toBeCloseTo(target, 8);
    const read = () =>
      readTeeTopology({
        ...source,
        block: { ...block, roles: { ...block.roles, sleeve: { ...sleeve, edges } } },
      });
    if (valid) expect(read).not.toThrow();
    else expect(read).toThrow(/Sleeve-cap ease/);
  }
});
