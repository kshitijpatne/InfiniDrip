// The fitted garment — the first NON-tee recipe, and proof of the engine/recipe
// split: it reuses the tee's own back and sleeve untouched, and only swaps in a
// darted front. The front carries a side BUST DART: a wedge whose apex sits at
// the bust point and whose mouth opens on the side seam. Sew the two legs
// together and the flat panel cones over the bust — that's the shaping a boxy
// tee can't give.
//
// The dart lives IN the outline (two named leg edges meeting at the apex), so it
// draws truthfully and its apex is a real vertex the editor can grab. Truing the
// dart (re-closing the side seam so allowances match) is a later concern.

import { point } from "../geometry";
import { Measurements, derive } from "./measurements";
import { Edge, Piece } from "./piece";
import { Block } from "./block";
import { sleevedTopStitches } from "./tshirt-checks";
import { bodice } from "./bodice";
import { sleeve as sleeveComponent } from "./sleeve";
import { Component, ComponentResult } from "./component";
import { iface, edgeRef } from "./stitch";
import { necklineEdge } from "./neckline";
import { componentNode, composeBlock, garmentGrammar } from "./grammar";
import { GarmentOption, GarmentOptions } from "./options";
import { Note } from "../guidance/note";
import { sleevedTopGuidance } from "./tshirt-guidance";

const DART_INTAKE_OPTION: GarmentOption = {
  id: "dartIntake",
  label: "Bust dart intake",
  unit: "cm",
  group: "Dart shaping",
  help: "The existing 4 cm default is unvalidated. The 0.5–8 cm range is a software geometry guardrail, not a fit specification.",
  defaultValue: 4,
  min: 0.5,
  max: 8,
  step: 0.5,
};

const BUST_APEX_HORIZONTAL_OPTION: GarmentOption = {
  id: "bustApexHorizontal",
  label: "Bust apex across half-front",
  unit: "%",
  group: "Dart shaping",
  help: "The existing 55% default is unvalidated. The 20–80% range is a software geometry guardrail, not a fit standard.",
  defaultValue: 55,
  min: 20,
  max: 80,
  step: 1,
};

const BUST_APEX_VERTICAL_OPTION: GarmentOption = {
  id: "bustApexVertical",
  label: "Bust apex from underarm to hem",
  unit: "%",
  group: "Dart shaping",
  help: "The existing 28% default is unvalidated. The 20–80% range is a software geometry guardrail, not a fit standard. Move the apex inward or reduce intake if the opening reaches an edge.",
  defaultValue: 28,
  min: 20,
  max: 80,
  step: 1,
};

export const FITTED_DART_OPTIONS: readonly GarmentOption[] = [
  DART_INTAKE_OPTION,
  BUST_APEX_HORIZONTAL_OPTION,
  BUST_APEX_VERTICAL_OPTION,
];

interface FittedDartParameters {
  readonly intake: number;
  readonly apexHorizontalPercent: number;
  readonly apexVerticalPercent: number;
}

const fittedDartParameters = (options: GarmentOptions): FittedDartParameters => ({
  intake: options[DART_INTAKE_OPTION.id] ?? DART_INTAKE_OPTION.defaultValue,
  apexHorizontalPercent: options[BUST_APEX_HORIZONTAL_OPTION.id] ?? BUST_APEX_HORIZONTAL_OPTION.defaultValue,
  apexVerticalPercent: options[BUST_APEX_VERTICAL_OPTION.id] ?? BUST_APEX_VERTICAL_OPTION.defaultValue,
});

export function draftFittedFront(m: Measurements, options: GarmentOptions = {}): Piece {
  const d = derive(m);
  const { intake, apexHorizontalPercent, apexVerticalPercent } = fittedDartParameters(options);
  const { cNeck: cfNeck, hps, edge: neckline } = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, d.shoulderHalf, m.armholeDepth);
  const shoulder = point(d.shoulderHalf, d.shoulderSlope);
  const underarm = point(d.chestWidthHalf, m.armholeDepth);
  // The dart's mouth opens ON the side seam, so closing the dart SHORTENS that
  // seam by the intake. The side must therefore run DART_INTAKE cm longer than
  // the back's, so the two match once the dart is sewn shut. The open front hem
  // consequently slants down at the side — that's a correct untrued flat pattern;
  // truing (levelling the hem after closing) comes with dart manipulation.
  const sideHem = point(d.chestWidthHalf, m.length + intake);
  const cfHem = point(0, m.length);

  // Defaults retain the previous code-authored positions; the user controls
  // are design inputs and do not imply a validated wearer fit.
  const bustY = m.armholeDepth + (m.length - m.armholeDepth) * apexVerticalPercent / 100;
  const apex = point(d.chestWidthHalf * apexHorizontalPercent / 100, bustY);
  // The mouth stays centred on the apex; the selected intake sets its opening.
  const mouthUpper = point(d.chestWidthHalf, bustY - intake / 2);
  const mouthLower = point(d.chestWidthHalf, bustY + intake / 2);

  const edges: Edge[] = [
    neckline,
    { kind: "line", name: "shoulder", start: hps, end: shoulder },
    { kind: "curve", name: "armhole", curve: {
        start: shoulder,
        control1: point(d.shoulderHalf, d.shoulderSlope + (m.armholeDepth - d.shoulderSlope) * 0.45),
        control2: point(d.chestWidthHalf - 2, m.armholeDepth - 3),
        end: underarm } },
    { kind: "line", name: "sideUpper", start: underarm, end: mouthUpper },
    { kind: "line", name: "bustDartUpper", start: mouthUpper, end: apex }, // mouthUpper -> apex
    { kind: "line", name: "bustDartLower", start: apex, end: mouthLower }, // apex -> mouthLower
    { kind: "line", name: "sideLower", start: mouthLower, end: sideHem },
    { kind: "line", name: "hem", start: sideHem, end: cfHem },
    { kind: "line", name: "centerFront", start: cfHem, end: cfNeck },
  ];
  return {
    name: "fitted front",
    onFold: true,
    edges,
    dart: { legs: ["bustDartUpper", "bustDartLower"] },
  };
}

const fittedFrontComponent: Component<GarmentOptions> = (m, options): ComponentResult => ({
  pieces: { front: draftFittedFront(m, options) },
  stitches: [],
  interfaces: { armhole: iface(edgeRef("front", "armhole")) },
});

/** The fitted tee reuses the shared back and sleeve nodes while swapping only
 * its darted front. The sleeve still measures the actual front/back pair. */
export const FITTED_GRAMMAR = garmentGrammar(
  "fitted",
  [
    componentNode("front", "darted-bodice", fittedFrontComponent, (context) => context.options),
    componentNode("back", "bodice", bodice, () => ({ position: "back" as const })),
    componentNode(
      "sleeve",
      "sleeve",
      sleeveComponent,
      (context) => ({
        targetArmhole:
          context.interfaceLength("front", "armhole") +
          context.interfaceLength("back", "armhole"),
      }),
      ["front", "back"],
    ),
  ],
  () => sleevedTopStitches(["sideUpper", "sideLower"], true),
);

/** A fitted block: a darted front, with the tee's back and sleeve reused as-is.
 *  Phase B3 (Slice 54, §2.4): the sleeve is fit to the armhole measured off
 *  THIS front (the real darted piece just drafted), not a re-derived generic
 *  one — the actual fix, even though the number comes out identical here
 *  because the fitted front reuses the tee front's exact armhole curve. */
export function draftFitted(m: Measurements, options: GarmentOptions = {}): Block {
  return composeBlock(FITTED_GRAMMAR, m, options);
}

/** Reuse the shared tee notes and reject dart openings that cross panel edges. */
export function fittedGuidance(block: Block, m: Measurements, options: GarmentOptions = {}): Note[] {
  const notes = [...sleevedTopGuidance(block, m)];
  const { intake, apexVerticalPercent } = fittedDartParameters(options);
  const verticalSpan = m.length - m.armholeDepth;
  if (verticalSpan <= 0) {
    notes.push({
      level: "warn",
      field: "armholeDepth",
      text: "Armhole depth must be less than body length to place the bust dart. Reduce armhole depth or increase body length.",
    });
    return notes;
  }

  const apexY = m.armholeDepth + verticalSpan * apexVerticalPercent / 100;
  if (apexY - intake / 2 <= m.armholeDepth) {
    notes.push({
      level: "warn",
      field: "option-bustApexVertical",
      text: "The upper bust-dart mouth reaches the underarm line. Move the apex toward the hem or reduce dart intake; the app will not change either value automatically.",
    });
  }
  if (apexY + intake / 2 >= m.length + intake) {
    notes.push({
      level: "warn",
      field: "option-bustApexVertical",
      text: "The lower bust-dart mouth reaches the hem line. Move the apex toward the underarm or reduce dart intake; the app will not change either value automatically.",
    });
  }
  return notes;
}
