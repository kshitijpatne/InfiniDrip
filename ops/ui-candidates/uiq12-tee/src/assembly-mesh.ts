import { requireVerifiedTeeSource, type VerifiedTeeSource } from "./tee-source";
import { distance } from '../../../../src/geometry/point';
import type {
  Assembly,
  AssemblyPanel,
  JoinDefinition,
  PanelOrientation,
} from './assembly-contract';
import { xyz } from './assembly-contract';
import { joinTraces, reverseTrace } from './seam-correspondence';
import {
  hands,
  readTeeTopology,
  teeJoins,
  classicPanels,
  classicOrientation,
  sleeveLandmarks,
} from './tee-topology';
import { validateMesh } from './assembly-validation';

/** Join and audit any placed panel charts against their declared physical stitches. */
export function assemblePattern<R extends string>(
  panels: readonly AssemblyPanel<R>[],
  definitions: readonly JoinDefinition[],
  orientation: (p: AssemblyPanel<R>) => PanelOrientation,
) {
  const byId = new Map(panels.map((p) => [p.id, p]));
  const traces = panels.flatMap((p) => p.traces);
  const seams = definitions.map((join) => {
    const [a, b] = join.sides.map((side) => {
      const trace = traces.find(
        (t) => t.instance === side.instance && t.edge === side.edge && t.role === side.role,
      );
      if (!trace) throw new Error(`${join.id}: unresolved ${side.instance}/${side.edge}`);
      return side.reversed ? reverseTrace(trace) : trace;
    });
    return joinTraces(join.id, join.label, a, b, byId);
  });
  return { panels, seams, audit: validateMesh(panels, seams, definitions, orientation) };
}
export function assembleTee(source: VerifiedTeeSource | null): Assembly {
  requireVerifiedTeeSource(source);
  const curves = readTeeTopology(source),
    panels = classicPanels(curves, source);
  const landmarks = sleeveLandmarks(panels);
  const { seams, audit } = assemblePattern(panels, hands.flatMap(teeJoins), classicOrientation);
  const capIntervals = seams
    .filter((s) => s.id.startsWith('cap-'))
    .map((s) => ({
      id: s.id,
      capCm: s.sides[0].restLengthCm,
      armholeCm: s.sides[1].restLengthCm,
      easeCm: s.sides[0].restLengthCm - s.sides[1].restLengthCm,
    }));
  const [f, b] = capIntervals;
  const shoulder = seams.find((s) => s.id === 'shoulder:right')!.points[0];
  const fold = panels[0].traces.find((t) => t.edge === 'centerFront')!;
  const hem = panels[0].traces
    .filter((t) => t.edge === 'hem')
    .map((t) => xyz(panels[0].positions, t.indices[0]));
  const arcAudit = Object.entries(curves).flatMap(([role, edges]) =>
    Object.entries(edges).map(([edge, a]) => ({
      role,
      edge,
      nativeCm: a.length,
      integratedCm: a.analyticLength,
      measuredEdge: a.edge,
      referenceCm: a.referenceLength,
      nativeDifferenceCm: a.auditError,
      integrationDifferenceCm: Math.abs(a.analyticLength - a.referenceLength),
    })),
  );
  const maxArcAuditErrorCm = Math.max(...arcAudit.map((a) => a.nativeDifferenceCm));
  const maxIntegrationErrorCm = Math.max(...arcAudit.map((a) => a.integrationDifferenceCm));
  return {
    version: 1,
    units: 'cm',
    revision: source.revision,
    panels,
    seams,
    diagnostics: {
      ...audit,
      capIntervals,
      landmarks,
      maxArcAuditErrorCm,
      arcAudit,
      maxIntegrationErrorCm,
      signedCapEaseCm: f.easeCm + b.easeCm,
      wrongWholeSeamApexMissCm: Math.abs(
        ((f.armholeCm + b.armholeCm) * f.capCm) / (f.capCm + b.capCm) - f.armholeCm,
      ),
      frontHemSpanCm: distance({ x: hem[0][0], y: hem[0][2] }, { x: hem[1][0], y: hem[1][2] }),
      frontVerticalSpanCm: shoulder[1] - xyz(panels[0].positions, fold.indices[0])[1],
      seedPlacement:
        'Body rest chart (x,−y,±4 cm); sleeve cap apex at its shoulder, +rest-y outward, transverse rest-x along z. Every vertex retains its seed and rest coordinates.',
    },
  };
}
