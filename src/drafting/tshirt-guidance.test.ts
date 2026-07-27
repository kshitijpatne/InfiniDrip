import { describe, it, expect } from "vitest";
import { point } from "../geometry";
import { Block, Piece, STANDARD_M, block, draftTshirt, draftFitted } from "./index";
import { armholeMatch, easeRange, armholeDepthCheck, shoulderCheck, sleevedTopGuidance } from "./tshirt-guidance";

// A tiny fake block whose armhole and cap edges have chosen lengths, so we can drive
// armholeMatch into each outcome deterministically.
function blockWith(armholeHalf: number, capHalf: number): Block {
  const armPiece = (name: string, len: number): Piece => ({
    name,
    onFold: true,
    edges: [{ kind: "line", name: "armhole", start: point(0, 0), end: point(0, len) }],
  });
  const sleeve: Piece = {
    name: "sleeve",
    onFold: false,
    edges: [
      { kind: "line", name: "capLeft", start: point(0, 0), end: point(0, capHalf) },
      { kind: "line", name: "capRight", start: point(0, 0), end: point(0, capHalf) },
    ],
  };
  return block({ front: armPiece("front", armholeHalf), back: armPiece("back", armholeHalf), sleeve });
}

describe("armholeMatch", () => {
  it("reports OK when the cap matches within easing", () => {
    const note = armholeMatch(blockWith(20, 21)); // armhole 40, cap 42, diff +2
    expect(note.level).toBe("ok");
    expect(note.text).toContain("matches");
  });
  it("warns when the cap is too long (bicep too wide)", () => {
    const note = armholeMatch(blockWith(20, 26)); // diff +12
    expect(note.level).toBe("warn");
    expect(note.text).toContain("longer");
  });
  it("warns when the cap is too short", () => {
    const note = armholeMatch(blockWith(20, 15)); // diff -10
    expect(note.level).toBe("warn");
    expect(note.text).toContain("shorter");
  });
});

describe("easeRange", () => {
  it("warns on tight ease", () => {
    const note = easeRange({ ...STANDARD_M, ease: 2 });
    expect(note.level).toBe("warn");
    expect(note.text).toContain("2 cm"); // stateful: names the value
  });
  it("informs on high ease", () => {
    expect(easeRange({ ...STANDARD_M, ease: 20 })?.level).toBe("info");
  });
  it("gives a positive, stateful note for normal ease", () => {
    const note = easeRange(STANDARD_M);
    expect(note.level).toBe("ok");
    expect(note.text).toContain("10 cm"); // references the current value
  });
});

describe("armholeDepthCheck", () => {
  it("warns when the armhole is too shallow", () => {
    expect(armholeDepthCheck({ ...STANDARD_M, armholeDepth: 10 })?.level).toBe("warn");
  });
  it("says nothing at a healthy depth", () => {
    expect(armholeDepthCheck(STANDARD_M)).toBeNull();
  });
});

describe("shoulderCheck", () => {
  it("warns when the shoulder runs past the side seam", () => {
    const note = shoulderCheck({ ...STANDARD_M, shoulderWidth: 70, chest: 80, ease: 0 });
    expect(note?.level).toBe("warn");
    expect(note?.text).toContain("70 cm"); // stateful: names the offending width
  });
  it("says nothing for a normal shoulder", () => {
    expect(shoulderCheck(STANDARD_M)).toBeNull();
  });
});

describe("sleevedTopGuidance", () => {
  it("returns the passing checks and drops the silent (null) ones", () => {
    const notes = sleevedTopGuidance(draftTshirt(STANDARD_M), STANDARD_M);
    // cap-match ok + ease ok; armholeDepth & shoulder pass silently at STANDARD_M
    expect(notes).toHaveLength(2);
    expect(notes.every((n) => n.level === "ok")).toBe(true);
  });
  it("works for the fitted block too (shared sleeved-top guidance)", () => {
    expect(() => sleevedTopGuidance(draftFitted(STANDARD_M), STANDARD_M)).not.toThrow();
  });
});
