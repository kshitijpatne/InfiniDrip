import { edgeEnd, edgeStart } from '../../../../src/drafting/piece';
import { stitchChecks } from '../../../../src/drafting/stitch';
import { sleevedTopStitches } from '../../../../src/drafting/tshirt-checks';
import { distance, lerp } from '../../../../src/geometry/point';
import type {
  AssemblySource,
  AssemblyPanel,
  Role,
  Side,
  Hand,
  Point2,
  Point3,
  PanelOrientation,
} from './assembly-contract';
import { arc, type Arc } from './seam-correspondence';

const outlines = {
  front: ['neckline', 'shoulder', 'armhole', 'side', 'hem', 'centerFront'],
  back: ['neckline', 'shoulder', 'armhole', 'side', 'hem', 'centerBack'],
  sleeve: ['capLeft', 'capRight', 'sideRight', 'hem', 'sideLeft'],
} as const;
export const hands: readonly Hand[] = ['right', 'left'];
export const signOf = (hand: Hand) => (hand === 'right' ? 1 : -1);
export type Curves = Record<Role, Record<string, Arc>>;
export function readTeeTopology(source: AssemblySource): Curves {
  if (!source.revision.trim()) throw new Error('Missing exact source revision');
  const { block } = source;
  if (Object.keys(block.roles).sort().join(',') !== 'back,front,sleeve')
    throw new Error('Expected exactly front, back and sleeve roles for set-in Tee');
  const curves: Curves = { front: {}, back: {}, sleeve: {} };
  for (const role of ['front', 'back', 'sleeve'] as const) {
    const piece = block.roles[role];
    if (piece.onFold !== (role !== 'sleeve') || piece.dart)
      throw new Error(`${role}: unexpected fold or dart`);
    if (piece.edges.map((e) => e.name).join(',') !== outlines[role].join(','))
      throw new Error(`${role}: missing, repeated or wrongly ordered sewing edges`);
    const cut = source.cuts[role];
    if (!cut || cut.length < 3 || cut.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y)))
      throw new Error(`${role}: missing or invalid allowance cut line`);
    for (const [i, edge] of piece.edges.entries()) {
      const cubic = ['neckline', 'armhole', 'capLeft', 'capRight'].includes(edge.name);
      if (edge.kind !== (cubic ? 'curve' : 'line'))
        throw new Error(`${role}.${edge.name}: unexpected edge geometry`);
      if (distance(edgeEnd(edge), edgeStart(piece.edges[(i + 1) % piece.edges.length])) > 1e-8)
        throw new Error(`${role}.${edge.name}: disconnected or reversed outline endpoint`);
      curves[role][edge.name] = arc(edge);
    }
  }
  const expected = sleevedTopStitches(['side'], false);
  if (block.stitches.length !== expected.length) throw new Error('Dropped or additional Classic Tee stitch');
  for (const definition of expected) {
    const stitch = block.stitches.find((candidate) => candidate.label === definition.label);
    if (
      !stitch ||
      stitch.gather ||
      stitch.ease?.lo !== definition.ease?.lo ||
      stitch.ease?.hi !== definition.ease?.hi
    )
      throw new Error(`${definition.label}: missing stitch or changed ease rule`);
    for (const side of ['a', 'b'] as const) {
      const actual = stitch[side].edges;
      if (
        actual.length !== definition[side].edges.length ||
        actual.some((ref, i) => {
          const target = definition[side].edges[i];
          return (
            !('edge' in ref && 'edge' in target) ||
            ref.edge !== target.edge ||
            ref.piece !== target.piece ||
            Boolean(ref.reversed) !== Boolean(target.reversed)
          );
        })
      )
        throw new Error(`${stitch.label}.${side}: missing, repeated or wrongly oriented source references`);
    }
  }
  for (const check of stitchChecks(block, block.stitches))
    if (!check.ok) throw new Error(`${check.name}: ${check.detail}`);
  return curves;
}
export interface TeeJoin {
  id: string;
  label: string;
  sides: readonly [Side, Side];
}
export function teeJoins(hand: Hand): TeeJoin[] {
  const ref = (role: Role, edge: string, reversed = false): Side => ({
    role,
    edge,
    instance: `${role}:${hand}`,
    reversed,
  });
  return [
    {
      id: `shoulder:${hand}`,
      label: `${hand} shoulder`,
      sides: [ref('front', 'shoulder'), ref('back', 'shoulder')],
    },
    { id: `side:${hand}`, label: `${hand} side seam`, sides: [ref('front', 'side'), ref('back', 'side')] },
    {
      id: `underarm:${hand}`,
      label: `${hand} sleeve underarm`,
      sides: [ref('sleeve', 'sideLeft', true), ref('sleeve', 'sideRight')],
    },
    {
      id: `cap-front:${hand}`,
      label: `${hand} sleeve cap · front`,
      sides: [ref('sleeve', 'capLeft'), ref('front', 'armhole', true)],
    },
    {
      id: `cap-back:${hand}`,
      label: `${hand} sleeve cap · back`,
      sides: [ref('sleeve', 'capRight'), ref('back', 'armhole')],
    },
  ];
}

import { Chart, patch, mix, xyz } from './assembly-contract';
export const ARM = 10;
const SIDE = 4,
  NECK = 6,
  SHOULDER = 4,
  SLEEVE = 4;
const WIDTH_SCALE = 0.86;
const fractions = (n: number) => Array.from({ length: n + 1 }, (_, i) => i / n);
const reverse = <T>(array: readonly T[]): T[] => [...array].reverse();
const p2 = (p: Point3): Point2 => ({ x: p[0], y: p[1] });
const as3 = (p: Point2): Point3 => [p.x, p.y, 0];

type Body = 'front' | 'back';
function bodyChart(role: Body, curves: Curves, source: AssemblySource): AssemblyPanel {
  const chart = new Chart(role, role),
    face = role === 'front' ? 1 : -1;
  const arcs = curves[role],
    other = curves[role === 'front' ? 'back' : 'front'];
  const foldName = role === 'front' ? 'centerFront' : 'centerBack';
  const frame = (name: Body, p: Point2): Point2 => {
    const f = curves[name][name === 'front' ? 'centerFront' : 'centerBack'];
    const neck = f.at(1).point,
      hem = f.at(0).point;
    const dx = (hem.x - neck.x) / f.length,
      dy = (hem.y - neck.y) / f.length;
    return {
      x: (p.x - neck.x) * dy - (p.y - neck.y) * dx,
      y: neck.y + (p.x - neck.x) * dx + (p.y - neck.y) * dy,
    };
  };
  const at = (arc: string, s: number) => frame(role, arcs[arc].at(s).point);
  const mid = (arc: string, s: number) =>
    lerp(at(arc, s), frame(role === 'front' ? 'back' : 'front', other[arc].at(s).point), 0.5);
  const width = at('hem', 0).x;
  const joinFraction = at('shoulder', 0).x / at('shoulder', 1).x;
  if (!(width > 0 && joinFraction > 0 && joinFraction < 1))
    throw new Error(`${role}: shoulder or hem crosses the fold or neckline; review these landmarks`);
  const uGrid = [
    ...fractions(NECK).map((s) => s * joinFraction),
    ...fractions(SHOULDER)
      .slice(1)
      .map((s) => joinFraction + (1 - joinFraction) * s),
  ];
  const vJoint = arcs.armhole.length / (arcs.armhole.length + arcs.side.length);
  const vGrid = [
    ...fractions(ARM).map((s) => vJoint * s),
    ...fractions(SIDE)
      .slice(1)
      .map((s) => vJoint + (1 - vJoint) * s),
  ];
  const foldIds: number[] = [];
  for (const hand of hands) {
    const sign = signOf(hand);
    const rows: number[][] = [];
    const outline = (i: number, j: number, placed: boolean) => {
      const u = uGrid[i],
        v = vGrid[j],
        neck = i <= NECK,
        arm = j <= ARM;
      const st = neck ? i / NECK : (i - NECK) / SHOULDER,
        sr = arm ? j / ARM : (j - ARM) / SIDE;
      const adjust = (p: Point2, a: Point2, b: Point2, f: number): Point2 => ({
        x: p.x + (b.x - a.x) * f,
        y: p.y + (b.y - a.y) * f,
      });
      const top = placed
        ? neck
          ? adjust(at('neckline', st), at('shoulder', 0), mid('shoulder', 0), st)
          : mid('shoulder', st)
        : at(neck ? 'neckline' : 'shoulder', st);
      const bottom = placed ? adjust(at('hem', 1 - u), at('side', 1), mid('side', 1), u) : at('hem', 1 - u);
      const left = at(foldName, 1 - v);
      let right = at(arm ? 'armhole' : 'side', sr);
      if (placed && arm) {
        right = adjust(right, at('shoulder', 1), mid('shoulder', 1), 1 - sr);
        right = adjust(right, at('side', 0), mid('side', 0), sr);
      }
      if (placed && !arm) right = mid('side', sr);
      const outer = placed ? mid : at;
      // Split the chart below the high shoulder. A contracting armhole must not pull a
      // near-vertical neckline tangent through its own panel. The guide is interior.
      const high = outer('shoulder', 0),
        tip = outer('shoulder', 1),
        sideHem = outer('side', 1);
      const hemGuide = lerp(at('hem', 1), sideHem, joinFraction);
      const vertical = (right.y - tip.y) / (sideHem.y - tip.y);
      const neckOverhang = Math.max(0, at('neckline', 0.88).x - at('neckline', 1).x);
      const skew = Math.min(0.25 * width, 6 * neckOverhang) * (1 - Math.exp(-14 * v)) * (1 - v);
      const guide = {
        x: high.x + (hemGuide.x - high.x) * v * v + skew,
        y: high.y + (hemGuide.y - high.y) * vertical,
      };
      const corners = neck
        ? [at('neckline', 0), high, at('hem', 1), hemGuide]
        : [high, tip, hemGuide, sideHem];
      const pp = p2(
        patch(
          as3(top),
          as3(bottom),
          as3(neck ? left : guide),
          as3(neck ? guide : right),
          corners.map(as3),
          st,
          v,
        ),
      );
      if (!placed) return [sign * pp.x, pp.y, 0] as Point3;
      const fullness = 0.27 * width;
      const neckThickness = neck ? Math.cos((st * Math.PI) / 2) : 0;
      const depth =
        fullness * Math.cos((u * Math.PI) / 2) * (neckThickness + (1 - neckThickness) * Math.min(v * 3.5, 1));
      const armBow = arm ? fullness * 0.82 * Math.sin(Math.PI * sr) * Math.sin((Math.PI * u) / 2) : 0;
      return [sign * WIDTH_SCALE * pp.x, -pp.y, face * (depth + armBow)] as Point3;
    };
    for (let j = 0; j < vGrid.length; j++) {
      const row: number[] = [];
      rows.push(row);
      for (let i = 0; i < uGrid.length; i++) {
        if (hand === 'left' && i === 0) {
          row.push(foldIds[j]);
          continue;
        }
        const rest = outline(i, j, false),
          world = outline(i, j, true);
        const index = chart.vertex(p2(rest), [rest[0], -rest[1], face * 4], world);
        row.push(index);
        if (i === 0) foldIds.push(index);
      }
    }
    for (let j = 1; j < rows.length; j++)
      for (let i = 1; i < uGrid.length; i++)
        chart.cell(rows[j - 1][i - 1], rows[j - 1][i], rows[j][i], rows[j][i - 1], sign * face > 0);
    const outer = rows.map((row) => row[uGrid.length - 1]);
    chart.trace(`${role}:${hand}`, arcs.neckline, rows[0].slice(0, NECK + 1), fractions(NECK));
    chart.trace(`${role}:${hand}`, arcs.shoulder, rows[0].slice(NECK), fractions(SHOULDER));
    chart.trace(`${role}:${hand}`, arcs.armhole, outer.slice(0, ARM + 1), fractions(ARM));
    chart.trace(`${role}:${hand}`, arcs.side, outer.slice(ARM), fractions(SIDE));
    chart.trace(
      `${role}:${hand}`,
      arcs.hem,
      reverse(rows[rows.length - 1]),
      reverse(uGrid).map((s) => 1 - s),
    );
    chart.trace(
      `${role}:${hand}`,
      arcs[foldName],
      reverse(rows.map((row) => row[0])),
      reverse(vGrid).map((s) => 1 - s),
    );
  }
  return chart.finish(source.block.roles[role], source.cuts[role]);
}
function sleeveChart(
  hand: Hand,
  curves: Curves,
  source: AssemblySource,
  bodies: readonly AssemblyPanel[],
): AssemblyPanel {
  const sign = signOf(hand),
    arcs = curves.sleeve,
    chart = new Chart(`sleeve:${hand}`, 'sleeve');
  const bodyRing = bodies.map((body) =>
    body.traces
      .find((t) => t.edge === 'armhole' && t.instance === `${body.role}:${hand}`)!
      .indices.map((i) => xyz(body.positions, i)),
  );
  const ring = [...reverse(bodyRing[0]), ...bodyRing[1].slice(1)];
  const underarm = ring[0],
    apex = ring[ARM],
    center = mix(underarm, apex, 0.5);
  const cap0 = arcs.capLeft.at(0).point,
    capMid = arcs.capLeft.at(1).point,
    cap1 = arcs.capRight.at(1).point;
  const capWidth = cap1.x - cap0.x,
    apexFraction = (capMid.x - cap0.x) / capWidth;
  if (!(apexFraction > 0 && apexFraction < 1))
    throw new Error(`${chart.id}: cap apex must lie between its underarms`);
  // The extrusion must leave the inlet. Limit its downward angle by the actual
  // front/back armhole tangents, including very broad, shallow reviewed armholes.
  let slope = Math.sqrt(1 - 0.94 ** 2) / 0.94;
  for (const stations of bodyRing)
    for (let i = 1; i < stations.length; i++) {
      const outward = sign * (stations[i][0] - stations[i - 1][0]);
      if (outward > 1e-8) slope = Math.min(slope, (0.45 * (stations[i - 1][1] - stations[i][1])) / outward);
    }
  const axis = [1 / Math.hypot(1, slope), -slope / Math.hypot(1, slope)] as const;
  const hemRadius = arcs.hem.length / (2 * Math.PI);
  const underarmStation = Math.max(
    ...ring.map((p) => (p[0] - center[0]) * sign * axis[0] + (p[1] - center[1]) * axis[1]),
  );
  const extension = underarmStation + (arcs.sideLeft.length + arcs.sideRight.length) / 2;
  const cuffCenter: Point3 = [center[0] + sign * axis[0] * extension, center[1] + axis[1] * extension, 0];
  const rows: number[][] = [];
  const us = fractions(2 * ARM).map((_s, i) =>
    i <= ARM ? (apexFraction * i) / ARM : apexFraction + ((1 - apexFraction) * (i - ARM)) / ARM,
  );
  for (let j = 0; j <= SLEEVE; j++) {
    const v = j / SLEEVE,
      row: number[] = [];
    rows.push(row);
    for (let i = 0; i <= 2 * ARM; i++) {
      const u = us[i],
        cap = i <= ARM ? arcs.capLeft.at(i / ARM).point : arcs.capRight.at((i - ARM) / ARM).point;
      const hem = arcs.hem.at(1 - u).point,
        left = arcs.sideLeft.at(1 - v).point,
        right = arcs.sideRight.at(v).point;
      const rest = p2(
        patch(
          as3(cap),
          as3(hem),
          as3(left),
          as3(right),
          [cap0, cap1, arcs.hem.at(1).point, arcs.hem.at(0).point].map(as3),
          u,
          v,
        ),
      );
      const theta = (Math.PI * i) / ARM,
        up = -Math.cos(theta) * hemRadius;
      const cuff: Point3 = [
        cuffCenter[0] - sign * axis[1] * up,
        cuffCenter[1] + axis[0] * up,
        hemRadius * Math.sin(theta),
      ];
      const world = mix(ring[i], cuff, v);
      // Cap shape influences the sleeve interior. The attached cap, cuff and underarm stay anchored.
      const reference = i <= ARM ? lerp(cap0, capMid, i / ARM) : lerp(capMid, cap1, (i - ARM) / ARM);
      const relief = 0.4 * v * (1 - v) * (reference.y - cap.y);
      row.push(
        chart.vertex(
          rest,
          [apex[0] + sign * (rest.y - capMid.y), apex[1], -(rest.x - capMid.x)],
          [world[0] + sign * axis[0] * relief, world[1] + axis[1] * relief, world[2]],
        ),
      );
    }
  }
  for (let j = 1; j < rows.length; j++)
    for (let i = 1; i < us.length; i++)
      chart.cell(rows[j - 1][i - 1], rows[j - 1][i], rows[j][i], rows[j][i - 1], sign > 0);
  chart.trace(`sleeve:${hand}`, arcs.capLeft, rows[0].slice(0, ARM + 1), fractions(ARM));
  chart.trace(`sleeve:${hand}`, arcs.capRight, rows[0].slice(ARM), fractions(ARM));
  chart.trace(
    `sleeve:${hand}`,
    arcs.sideRight,
    rows.map((row) => row[2 * ARM]),
    fractions(SLEEVE),
  );
  chart.trace(
    `sleeve:${hand}`,
    arcs.hem,
    reverse(rows[SLEEVE]),
    reverse(us).map((s) => 1 - s),
  );
  chart.trace(`sleeve:${hand}`, arcs.sideLeft, reverse(rows.map((row) => row[0])), fractions(SLEEVE));
  return chart.finish(source.block.roles.sleeve, source.cuts.sleeve);
}

export function classicPanels(curves: Curves, source: AssemblySource): AssemblyPanel[] {
  const bodies = (['front', 'back'] as const).map((role) => bodyChart(role, curves, source));
  return [...bodies, ...hands.map((hand) => sleeveChart(hand, curves, source, bodies))];
}
export function classicOrientation(panel: AssemblyPanel): PanelOrientation {
  if (panel.role !== 'sleeve')
    return {
      restSign: panel.role === 'front' ? -1 : 1,
      folds: ['centerFront', 'centerBack'],
      outward: () => [0, 0, panel.role === 'front' ? 1 : -1],
    };
  const sign = panel.id === 'sleeve:right' ? 1 : -1;
  const side = panel.traces.find((t) => t.edge === 'sideRight')!;
  const count = panel.traces.find((t) => t.edge === 'hem')!.indices.length;
  const centers = side.indices.map((end, row) =>
    mix(xyz(panel.positions, end), xyz(panel.positions, row * count + (count - 1) / 2), 0.5),
  );
  const start = centers[0],
    end = centers[centers.length - 1],
    travel = Math.hypot(end[0] - start[0], end[1] - start[1]);
  const axis: Point3 = [(end[0] - start[0]) / travel, (end[1] - start[1]) / travel, 0];
  return {
    restSign: -sign,
    folds: [],
    outward(ids) {
      const radial = [0, 0, 0];
      for (const i of ids) {
        const center = centers[Math.floor(i / count)],
          p = xyz(panel.positions, i);
        for (let j = 0; j < 3; j++) radial[j] += p[j] - center[j];
      }
      const along = radial[0] * axis[0] + radial[1] * axis[1];
      return [radial[0] - along * axis[0], radial[1] - along * axis[1], radial[2]];
    },
  };
}

/** Test original mesh vertex identities on each material chart before joining any indices. */
export function sleeveLandmarks(panels: readonly AssemblyPanel[]) {
  type Endpoint = readonly [Role, string, 0 | 1];
  const stations: readonly { name: string; endpoints: readonly Endpoint[] }[] = [
    {
      name: 'front-underarm',
      endpoints: [
        ['sleeve', 'capLeft', 0],
        ['sleeve', 'sideLeft', 1],
        ['front', 'armhole', 1],
        ['front', 'side', 0],
      ],
    },
    {
      name: 'apex',
      endpoints: [
        ['sleeve', 'capLeft', 1],
        ['sleeve', 'capRight', 0],
        ['front', 'armhole', 0],
        ['front', 'shoulder', 1],
        ['back', 'armhole', 0],
        ['back', 'shoulder', 1],
      ],
    },
    {
      name: 'back-underarm',
      endpoints: [
        ['sleeve', 'capRight', 1],
        ['sleeve', 'sideRight', 0],
        ['back', 'armhole', 1],
        ['back', 'side', 0],
      ],
    },
  ];
  return hands.flatMap((hand) =>
    stations.map(({ name, endpoints }) => {
      const local = new Map<string, number>();
      const refs = endpoints.map(([role, edge, parameter]) => {
        const instance = `${role}:${hand}`;
        const panel = panels.find((p) => p.id === (role === 'sleeve' ? instance : role))!;
        const trace = panel.traces.find((t) => t.instance === instance && t.edge === edge)!;
        const k = parameter === 0 ? 0 : trace.indices.length - 1;
        const id = trace.indices[k],
          previous = local.get(panel.id);
        if (trace.parameters[k] !== parameter || (previous !== undefined && id !== previous))
          throw new Error(`${hand} ${name}: wrong source landmark ${instance}/${edge}@${parameter}`);
        local.set(panel.id, id);
        return { reference: `${instance}/${edge}@${parameter}`, world: xyz(panel.positions, id) };
      });
      const point = refs[0].world;
      const residualCm = Math.max(
        ...refs.map(({ world }) => Math.hypot(world[0] - point[0], world[1] - point[1], world[2] - point[2])),
      );
      if (!(residualCm <= 0.01))
        throw new Error(`${hand} ${name}: landmark gap ${residualCm} cm before welding`);
      return { id: `${hand}:${name}`, references: refs.map((r) => r.reference), point, residualCm };
    }),
  );
}
