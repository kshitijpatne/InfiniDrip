import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, it, expect } from 'vitest';
import type { Assembly } from './assembly-contract';
import { assembleTee } from './assembly-mesh';
import capturedWorkingCopy from '../fixtures/captured-classic-working-copy.json?raw';
import {
  defaultTeeInputs,
  editedTeeInputs,
  resolveTeeDraft,
  reopenCandidateTee,
  type TeeDraft,
  addTeeMove,
  asymmetricAnchor,
} from './tee-source';

const arcRows: unknown[] = [];
const swappedRows: unknown[] = [];

function readArcRows(label: string, draft: TeeDraft, assembly: Assembly) {
  if (!draft.source) throw new Error("Expected a source-valid sewing draft.");
  expect(assembly.revision).toBe(draft.revision);
  expect(assembly.units).toBe("cm");
  const rows = [];
  const identities: string[] = [];
  for (const [role, piece] of Object.entries(draft.drawing.block.roles)) {
    for (const edge of piece.edges) {
      if (edge.kind !== "curve") continue;
      identities.push(`${role}/${edge.name}`);
      const audit = assembly.diagnostics.arcAudit.filter(item => item.role === role && item.edge === edge.name);
      expect(audit).toHaveLength(1);
      const { measuredEdge } = audit[0];
      if (measuredEdge?.kind !== "curve") throw new Error("Assembly observation is not a sewing cubic.");
      const identity = { revision: draft.revision, digest: draft.identity.effectiveBlockDigest };
      rows.push({
        case: label,
        reference: { ...identity, role, name: edge.name, c: edge.curve },
        observation: { ...identity, revision: assembly.revision, role: audit[0].role, name: measuredEdge.name,
          c: measuredEdge.curve, path_kind: "sewing-cubic", engine: audit[0].integratedCm },
        cut: draft.drawing.cuts[role],
      });
    }
  }
  expect(identities.sort()).toEqual([
    "back/armhole", "back/neckline", "front/armhole", "front/neckline", "sleeve/capLeft", "sleeve/capRight",
  ]);
  return rows;
}

function captureArcs(label: string, draft: TeeDraft, assembly: Assembly) {
  arcRows.push(...readArcRows(label, draft, assembly));
}

afterAll(() => {
  const command = process.env.UIQ12_PYTHON ?? (process.platform === "win32" ? "python" : "python3");
  const script = fileURLToPath(new URL("../arc-check/check.py", import.meta.url));
  const input = JSON.stringify([...arcRows, ...swappedRows]);
  const run = spawnSync(command, ["-B", script], { input, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  if (run.error || run.status !== 0) throw new Error(run.error?.message ?? run.stderr);
  const receipt = JSON.parse(run.stdout);
  if (process.env.UIQ12_ARC_RECEIPT) {
    writeFileSync(process.env.UIQ12_ARC_RECEIPT, run.stdout);
    writeFileSync(`${process.env.UIQ12_ARC_RECEIPT}.inputs.json`, input);
  }
  expect(receipt.comparisons).toHaveLength(arcRows.length + swappedRows.length);
  for (const row of receipt.comparisons.slice(arcRows.length)) {
    expect(row).toMatchObject({ case: "captured-sibling-swap", result: "sewing-edge-mismatch" });
  }
  const failures = receipt.comparisons.slice(0, arcRows.length).filter((row: { result: string }) => row.result !== "pass");
  expect(failures).toEqual([]);
});

describe('source-linked Tee shell', () => {
  it('rebuilds all native sizes and the resolved custom size', async () => {
    for (const size of [-2, -1, 0, 1, 2, 'custom'] as const) {
      const draft = await resolveTeeDraft({ ...defaultTeeInputs(), size });
      expect(draft.issue).toBe(null);
      const a = assembleTee(draft.source);
      expect(a.revision).toBe(draft.revision);
      expect(a.panels).toHaveLength(4);
      expect(a.seams).toHaveLength(10);
      expect(a.diagnostics.maxSeamGapCm).toBeLessThanOrEqual(0.01);
      captureArcs(`size-${size}`, draft, a);
      expect(a.diagnostics.intersections).toBe(0);
    }
  });
  it('preserves both rest arcs, pins all six landmarks and measures world width and length', async () => {
    for (const [input, hem, length, apexMiss] of [
      [defaultTeeInputs(), 47.3, 70, 0],
      [await editedTeeInputs(), 49.02, 73, 0.293278],
    ] as const) {
      const draft = await resolveTeeDraft(input);
      const { source, issue } = draft;
      expect(issue).toBe(null);
      const original = JSON.stringify(source);
      const a = assembleTee(source);
      expect(a.diagnostics.frontHemSpanCm).toBeCloseTo(hem, 7);
      expect(a.diagnostics.frontVerticalSpanCm).toBeCloseTo(length, 7);
      expect(a.diagnostics.wrongWholeSeamApexMissCm).toBeCloseTo(apexMiss, 5);
      expect(a.diagnostics.landmarks).toHaveLength(6);
      expect(a.diagnostics.capIntervals.every((s) => s.easeCm > 0)).toBe(true);
      expect(JSON.stringify(source)).toBe(original);
      expect(assembleTee(source)).toEqual(a);
      captureArcs(`placement-${length}`, draft, a);
    }
  });
});

it('classifies paired bounds with the native validator and assembles every source-valid boundary', async () => {
  const base = defaultTeeInputs();
  const cases: [string, Partial<typeof base.measurements>, number | null][] = [
    ['chest-low', { chest: 60 }, null],
    ['chest-high', { chest: 160 }, null],
    ['shoulder-low', { shoulderWidth: 30 }, null],
    ['shoulder-high', { shoulderWidth: 70 }, null],
    ['bicep-low', { bicep: 20 }, null],
    ['bicep-high/deep', { bicep: 60, armholeDepth: 40 }, null],
    ['short-body XS base', { length: 59 }, null],
    ['long-body XL base', { length: 74 }, null],
    ['shallow/narrow', { armholeDepth: 12, bicep: 20 }, null],
    ['deep/narrow', { armholeDepth: 40, bicep: 20 }, null],
    ['shallow/wide', { armholeDepth: 12, bicep: 60 }, null],
    ['short-sleeve', { sleeveLength: 8 }, null],
    ['long-sleeve', { sleeveLength: 70 }, null],
    ['negative shared sleeve ease', { ease: -30, bicep: 42 }, 7],
    ['positive shared sleeve ease', { ease: 30, armholeDepth: 36 }, 12],
    ['torso low', { ease: 7 }, null],
    ['torso high', { ease: 12 }, null],
    ['override distinct', { ease: 3.7 }, 11],
  ];
  const sourceRejected = new Set(['shallow/narrow', 'deep/narrow', 'shallow/wide']);
  let valid = 0,
    invalid = 0;
  for (const [label, patch, chestEase] of cases) {
    const draft = await resolveTeeDraft({
      ...base,
      measurements: { ...base.measurements, ...patch },
      chestEase,
      size: label.includes('XS') ? -2 : label.includes('XL') ? 2 : 0,
    });
    if (sourceRejected.has(label)) {
      expect(draft.issue).toMatch(/Sleeve-cap ease/);
      invalid++;
      continue;
    }
    expect(draft.issue, label).toBe(null);
    const assembly = assembleTee(draft.source);
    expect(assembly.diagnostics.maxIntegrationErrorCm, label).toBeLessThan(1e-7);
    captureArcs(label, draft, assembly);
    expect(assembly.diagnostics.maxSeamGapCm, label).toBeLessThanOrEqual(0.01);
    valid++;
  }
  expect(valid).toBe(cases.length - sourceRejected.size);
  expect(invalid).toBe(sourceRejected.size);
});

it('rebuilds every admitted 40-case regression from the real source', async () => {
  const base = defaultTeeInputs();
  for (let chest = 100; chest <= 104; chest++)
    for (let length = 70; length <= 73; length++) {
      const raw = { ...base, measurements: { ...base.measurements, chest, length } };
      for (const [index, input] of [raw, await addTeeMove(raw, asymmetricAnchor, -3, 0, 'cap-asymmetric')].entries()) {
        const draft = await resolveTeeDraft(input);
        expect(draft.issue).toBe(null);
        const a = assembleTee(draft.source);
        expect(a.diagnostics.frontHemSpanCm).toBeCloseTo((0.86 * (chest + base.measurements.ease)) / 2, 8);
        expect(a.diagnostics.frontVerticalSpanCm).toBeCloseTo(length, 8);
        expect(a.diagnostics.capIntervals.every((s) => s.easeCm > 0)).toBe(true);
        captureArcs(`regression-${chest}-${length}-${index}`, draft, a);
        for (const landmark of a.diagnostics.landmarks) expect(landmark.residualCm).toBeLessThan(1e-8);
      }
    }
}, 15000);
it('retains re-entrant neck edits and wide shallow armholes on graded drafts', async () => {
  const base = defaultTeeInputs();
  const inputs = await Promise.all(
    ['front', 'back'].map((role) =>
      addTeeMove({ ...base, size: 1 }, `anchor:v1/tee/${role}/edge/neckline/control/2`, 2, 0, 'review-neck'),
    ),
  );
  for (const [chest, shoulderWidth, bicep, length, armholeDepth, sleeveLength, ease, chestEase, size] of [
    [137, 30, 48, 71, 21, 11, 11, null, -2],
    [159, 34, 29, 63, 12, 21, 24, 10, 1],
    [159, 43, 21, 68, 12, 58, 11, null, -2],
  ] as const)
    inputs.push({
      ...base,
      size,
      chestEase,
      measurements: {
        ...base.measurements,
        chest,
        shoulderWidth,
        bicep,
        length,
        armholeDepth,
        sleeveLength,
        ease,
      },
    });
  for (const [index, input] of inputs.entries()) {
    const draft = await resolveTeeDraft(input);
    expect(draft.issue).toBeNull();
    const assembly = assembleTee(draft.source);
    expect(assembly.diagnostics.minRestAreaCm2).toBeGreaterThan(1e-6);
    expect(assembly.diagnostics.intersections).toBe(0);
    captureArcs(`graded-interaction-${index}`, draft, assembly);
  }
});

it("audits the arcs of a reopened app-created custom one-size draft", async () => {
  const draft = await resolveTeeDraft(await reopenCandidateTee(capturedWorkingCopy));
  expect(draft.issue).toBeNull();
  expect(draft.identity.provenance?.projectStyle).toBeDefined();
  captureArcs("captured-project-custom", draft, assembleTee(draft.source));
});

it("rejects a near-equal sibling measurement under the expected cap label", async () => {
  const draft = await resolveTeeDraft(defaultTeeInputs());
  const assembly = assembleTee(draft.source);
  const { arcAudit } = assembly.diagnostics;
  const left = arcAudit.find(row => row.role === "sleeve" && row.edge === "capLeft")!;
  const right = arcAudit.find(row => row.role === "sleeve" && row.edge === "capRight")!;
  expect(Math.abs(left.integratedCm - right.integratedCm)).toBeLessThan(0.001);
  const { measuredEdge, integratedCm } = right;
  const swapped = { ...assembly, diagnostics: { ...assembly.diagnostics,
    arcAudit: arcAudit.map(row => row === left ? { ...row, measuredEdge, integratedCm } : row),
  } };
  const rows = readArcRows("captured-sibling-swap", draft, swapped);
  swappedRows.push(rows.find(row => row.reference.role === "sleeve" && row.reference.name === "capLeft")!);
});

it("audits all sewing curves after a source-validated graded junction move", async () => {
  const input = { ...defaultTeeInputs(), size: 1 as const };
  const before = await resolveTeeDraft(input);
  const draft = await resolveTeeDraft(await addTeeMove(
    input, "anchor:v1/tee/front/junction/centerFront/neckline", 0, 0.2, "graded-neck-fold",
  ));
  expect(draft.issue).toBeNull();
  const neckline = (d: TeeDraft) => d.drawing.block.roles.front.edges.find(edge => edge.name === "neckline");
  const original = neckline(before);
  const edited = neckline(draft);
  if (original?.kind !== "curve" || edited?.kind !== "curve") throw new Error("Missing front neckline.");
  expect(edited.curve.start.y - original.curve.start.y).toBeCloseTo(0.2, 10);
  expect(edited.curve.start.x).toBe(original.curve.start.x);
  expect(draft.revision).not.toBe(before.revision);
  captureArcs("graded-neck-fold-junction", draft, assembleTee(draft.source));
});
