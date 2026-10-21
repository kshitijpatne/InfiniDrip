import { describe, expect, it } from "vitest";
import { point } from "../geometry";
import { rolePiece } from "../drafting/block";
import { draftJeansCore } from "../drafting/jeans";
import { STANDARD_M } from "../drafting/measurements";
import { pieceToPath } from "./shape";
import { renderJeansAssembled, renderJeansBody, renderJeansBodyPair } from "./index";

function expectSourceRole(svg: string, block: ReturnType<typeof draftJeansCore>, role: string): void {
  expect(svg).toContain('data-source-role="' + role + '"');
  expect(svg).toContain('data-role="' + role + '" d="' + pieceToPath(rolePiece(block, role)) + '"');
}

describe("pattern-linked Jeans views", () => {
  it("renders front, back, and paired Body views from the same authored roles and marks", () => {
    const block = draftJeansCore(STANDARD_M);
    const front = renderJeansBody(block);
    const back = renderJeansBody(block, "back");
    const pair = renderJeansBodyPair(block);

    expect(front).toContain('data-source="active-jeans-assessment-block"');
    expect(front).toContain('data-renderer="jeans-body" data-view="front"');
    for (const role of ["frontLeft", "frontRight", "coinPocket"]) expectSourceRole(front, block, role);
    expect(front).toContain('data-role-mark="grainline"');
    expect(front).toContain('data-role-mark="notch"');
    expect(front).toContain('data-disclosure="pattern-linked-digital-view"');
    expect(front).toContain("NO BODY, FIT, SEWING, DRAPE OR MATERIAL SIMULATION");
    expect(front).not.toContain("knee");

    expect(back).toContain('data-renderer="jeans-body" data-view="back"');
    for (const role of ["backYokeLeft", "backYokeRight", "backLowerLeft", "backLowerRight", "backPocketLeft", "backPocketRight"]) {
      expectSourceRole(back, block, role);
    }
    expect(back).toContain('data-pattern-mark="placementLine"');
    expect(pair.match(/<svg /gu)).toHaveLength(2);
    expect(pair).toContain('data-view="front"');
    expect(pair).toContain('data-view="back"');
  });

  it("shows all Jeans source roles and authored marks in the detached Assembled component schematic", () => {
    const block = draftJeansCore(STANDARD_M);
    const svg = renderJeansAssembled(block);

    expect(svg).toContain('data-renderer="jeans-assembled"');
    expect(svg).toContain('data-source="active-jeans-assessment-block"');
    for (const role of Object.keys(block.roles)) expectSourceRole(svg, block, role);
    expect(svg).toContain('data-component-role="pocketBagLeft"');
    expect(svg).toContain('data-component-role="flyShield"');
    expect(svg).toContain('data-component-role="waistbandInnerRight"');
    expect(svg).toContain('data-disclosure="assembled-component-schematic"');
    expect(svg).toContain("CUT COMPONENTS SHOWN DETACHED, NOT SEWN OR FIT SIMULATED");
    expect(svg).toContain('data-disclosure="material-and-fit-limits"');
    expect(svg).toContain("FIBER, WEIGHT, RECOVERY, SHRINKAGE AND PHYSICAL FIT ARE UNKNOWN");
    expect(svg).not.toContain("knee");
  });


  it("fails visibly if an exposed source role has no recipe notch/grainline rules", () => {
    const block = draftJeansCore(STANDARD_M);
    const coinPocket = rolePiece(block, "coinPocket");
    const unknownPiece = { ...coinPocket, name: "unmapped Jeans piece" };
    const invalidBlock = { ...block, roles: { ...block.roles, coinPocket: unknownPiece } };

    expect(() => renderJeansBody(invalidBlock, "front"))
      .toThrow("Jeans view requires notch and grainline rules for unmapped Jeans piece.");
  });
  it("includes cubic control points when sizing the Body view box", () => {
    const block = draftJeansCore(STANDARD_M);
    const front = rolePiece(block, "frontLeft");
    const frontWithWideCurve = {
      ...front,
      edges: front.edges.map((edge) => edge.name === "crotch" && edge.kind === "curve"
        ? { ...edge, curve: { ...edge.curve, control1: point(300, -220) } }
        : edge),
    };
    const adjustedBlock = { ...block, roles: { ...block.roles, frontLeft: frontWithWideCurve } };
    const view = renderJeansBody(adjustedBlock, "front");
    const viewBox = view.match(/viewBox="([^"]+)"/u)![1]!.split(" ").map(Number);

    expect(viewBox[0]! + viewBox[2]!).toBeGreaterThan(300);
    expect(viewBox[1]!).toBeLessThan(-220);
  });
});
