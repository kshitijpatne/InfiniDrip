import { describe, it, expect } from "vitest";
import { point } from "../geometry";
import { Block, Piece, STANDARD_M, block, draftTshirt } from "../drafting";

const BAD_M = { ...STANDARD_M, ease: 2, armholeDepth: 10 };
import { armholeMatch, easeRange, armholeDepthCheck, shoulderCheck, guide, SEVERITY_ICON, Level } from "./guidance";

// Build a tiny fake block whose armhole and cap edges have chosen lengths,
// so we can drive armholeMatch into each outcome deterministically.
function blockWith(armholeHalf: number, capHalf: number): Block {
  const armPiece = (name: string, len: number): Piece => ({
    name, onFold: true,
    edges: [{ kind: "line", name: "armhole", start: point(0, 0), end: point(0, len) }],
  });
  const sleeve: Piece = {
    name: "sleeve", onFold: false,
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

describe("guide", () => {
  it("gives the standard block a clean bill (cap matches, ease comfortable)", () => {
    const notes = guide(STANDARD_M, draftTshirt(STANDARD_M));
    expect(notes).toHaveLength(2); // OK cap-match note + OK ease note
    expect(notes.every((n) => n.level === "ok")).toBe(true);
  });
  it("collects multiple notes when several things are off", () => {
    const notes = guide(BAD_M, draftTshirt(BAD_M));
    const levels = notes.map((n) => n.level);
    expect(levels).toContain("warn");
    expect(notes.length).toBeGreaterThan(1);
  });

  it("now warns on an implausible chest that used to draft silently", () => {
    // The whole point of Slice 31: chest 160 sews together fine, so the geometric
    // checks stay quiet — but guide() must now surface a plausibility warning.
    const wild = { ...STANDARD_M, chest: 160 };
    const notes = guide(wild, draftTshirt(wild));
    expect(notes.some((n) => n.level === "warn" && n.text.includes("Chest (160 cm)"))).toBe(true);
  });

  it("surfaces a coherence warning for a proportionally impossible set", () => {
    const m = { ...STANDARD_M, chest: 130, shoulderWidth: 40 };
    const notes = guide(m, draftTshirt(m));
    expect(notes.some((n) => n.text.includes("proportion"))).toBe(true);
  });
});

describe("SEVERITY_ICON", () => {
  it("gives a distinct glyph for every level (severity is not colour-only)", () => {
    const icons = (["ok", "info", "warn"] as Level[]).map((l) => SEVERITY_ICON[l]);
    expect(new Set(icons).size).toBe(3); // all distinct
    expect(SEVERITY_ICON.warn).toBe("⚠");
    expect(SEVERITY_ICON.ok).toBe("✓");
  });
});
