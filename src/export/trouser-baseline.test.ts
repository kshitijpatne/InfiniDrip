import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { STANDARD_M, TROUSER, blockPieces, draftAtSize, gradeRun, stitchChecks } from "../drafting";
import { gradedMarker } from "./marker";
import { exportA0Pdf } from "./a0";
import { exportDxf } from "./dxf";
import { exportPdf } from "./pdf";
import { exportProjectorSvg } from "./projector";
import { exportSvg } from "./svg";
import { exportTechPack } from "./techpack";

const SIZES = ["XS", "S", "M", "L", "XL"];
const PIECE_NAMES = [
  "trouser front left",
  "trouser front right",
  "trouser back left",
  "trouser back right",
  "trouser waistband",
  "trouser fly shield",
  "trouser fly underlap",
  "trouser pocket bag left",
  "trouser pocket bag right",
];
const STITCH_NAMES = [
  "Left side seam (front ↔ back)",
  "Right side seam (front ↔ back)",
  "Left inseam (front ↔ back)",
  "Right inseam (front ↔ back)",
  "Center-back seam (left ↔ right)",
  "Fly underlap ↔ shield",
  "Waistband (four legs ↔ separate waistband)",
  "Left front fly ↔ shield",
  "Right front fly ↔ underlap",
  "Left pocket opening ↔ bag",
  "Right pocket opening ↔ bag",
];
const STITCH_DETAILS = [
  ["106.2", "106.2", "75.4", "75.4", "30.0", "15.0", "86.0", "15.0", "15.0", "16.0", "16.0"],
  ["108.7", "108.7", "76.9", "76.9", "31.0", "15.0", "90.0", "15.0", "15.0", "16.0", "16.0"],
  ["111.3", "111.3", "78.4", "78.4", "32.0", "15.0", "94.0", "15.0", "15.0", "16.0", "16.0"],
  ["113.8", "113.8", "79.9", "79.9", "33.0", "15.0", "98.0", "15.0", "15.0", "16.0", "16.0"],
  ["116.4", "116.4", "81.4", "81.4", "34.0", "15.0", "102.0", "15.0", "15.0", "16.0", "16.0"],
];
const POM_VALUES = [
  [86, 4, 102, 18, 26, 34, 62, 42, 75.4172643545829, 110.20838543845343, 40, 15, 16, 16, 23.000000000000004, 8.478708227731278, 2],
  [90, 4, 106, 19, 27, 35, 64, 43.5, 76.9172276676964, 112.74601566783983, 40, 15, 16, 16, 23.000000000000004, 8.478708227731278, 2],
  [94, 4, 110, 20, 28, 36, 66, 45, 78.41719245694959, 115.29129926367557, 40, 15, 16, 16, 23.000000000000004, 8.478708227731278, 2],
  [98, 4, 114, 21, 29, 37, 68, 46.5, 79.91715863494022, 117.84372096948171, 40, 15, 16, 16, 23.000000000000004, 8.478708227731278, 2],
  [102, 4, 118, 22, 30, 38, 70, 48, 81.41712612103758, 120.40283126654279, 39.99999999999999, 15, 16, 16, 23.000000000000004, 8.478708227731278, 2],
];
const OUTPUT_HASHES = {
  svg: "c8f81a26798caaa319c9d7a8b35af1565d995b3caf11cd3c8f822e3f8675745e",
  dxf: "7325b39742b35a7e3d433d3023b12f946ed34fb4331875900c53a4f9681b7a10",
  tiledPdf: "1da02e890d68062ef84de70e55677ab0e291b0088f5b2d645527ee322ec6470e",
  a0Pdf: "cd8ca940569919cf9f63a7b9ca13ca35faee1af27d5759a778dfcfdcf41ab5d2",
  projectorSvg: "14d14b59ede5e0cffe898c08d26bd458dd03150e1fe8dc2e71b2831a9ba9d64e",
  techPackPdf: "4285596f76cce4ea5f0c4bcd106fdf34e304b20cf1724f34e44aaa5704220549",
};
const MARKER_SHA256 = "fc37c5febd47fea03714dfadd135a9a807a17001b146832274f2ec333f60e2bd";
const hashString = (value: string) =>
  createHash("sha256").update(Buffer.from(value, "utf8")).digest("hex");

describe("S1094 trouser output and grading baseline", () => {
  it("preserves the selected-size M export bytes", () => {
    const pieces = blockPieces(draftAtSize(STANDARD_M, TROUSER.grade, 2, TROUSER.draft));
    const outputs = {
      svg: exportSvg(pieces, TROUSER.allowances, TROUSER.notches),
      dxf: exportDxf(pieces, TROUSER.allowances),
      tiledPdf: exportPdf(pieces, TROUSER.allowances, undefined, 1.0, TROUSER.tiledPdfLocalCoordinates === true),
      a0Pdf: exportA0Pdf(pieces, TROUSER.allowances, TROUSER.notches, undefined, TROUSER.a0Overflow === true),
      projectorSvg: exportProjectorSvg(TROUSER, STANDARD_M),
      techPackPdf: exportTechPack(TROUSER, STANDARD_M),
    };
    expect(Object.fromEntries(Object.entries(outputs).map(([name, value]) => [name, hashString(value)])))
      .toEqual(OUTPUT_HASHES);
  });

  it("preserves all XS–XL roles, stitch checks, POMs, and the graded marker", () => {
    const run = gradeRun(STANDARD_M, TROUSER.grade, TROUSER.sizes, TROUSER.draft);
    expect(run.map((graded) => graded.label)).toEqual(SIZES);

    run.forEach((graded, index) => {
      const pieces = blockPieces(graded.block);
      const checks = stitchChecks(graded.block, graded.block.stitches);
      const poms = TROUSER.poms.map((pom) => pom.measure(graded.block));
      expect(pieces.map((piece) => piece.name)).toEqual(PIECE_NAMES);
      expect(checks.map((check) => check.name)).toEqual(STITCH_NAMES);
      expect(checks.every((check) => check.ok)).toBe(true);
      expect(checks.map((check) => check.detail))
        .toEqual(STITCH_DETAILS[index].map((length) => "lengths agree (" + length + " vs " + length + " cm)"));
      expect(poms).toEqual(POM_VALUES[index]);
    });

    const marker = gradedMarker(TROUSER, STANDARD_M, 150);
    expect(marker.placed).toHaveLength(45);
    expect(marker.fabricLength).toBe(669.0561839823438);
    expect(marker.utilization).toBe(0.47964885025086357);
    expect(marker.fits).toBe(true);
    expect(hashString(JSON.stringify(marker))).toBe(MARKER_SHA256);
  });
});
