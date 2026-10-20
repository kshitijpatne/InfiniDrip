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
  return block({ front: armPiece("front", armholeHalf), back: armPiece("back", armholeHalf), sleeve }, []);
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
  it("warns below the software check interval and gives a neutral adjustment", () => {
    const note = easeRange({ ...STANDARD_M, ease: 4 });
    expect(note.level).toBe("warn");
    expect(note.field).toBe("ease");
    expect(note.text).toContain("4 cm");
    expect(note.text).toContain("below the tee check's 5 cm lower boundary");
    expect(note.text).toContain("raise ease to 5 cm or more");
    expect(note.text).toContain("does not assess wear or fit");
    expect(note.text).not.toMatch(/tight to pull on|most .* use|roomy|oversized fit|comfortable amount/i);
  });

  it("reports an above-band value without labeling a fit or silhouette", () => {
    const note = easeRange({ ...STANDARD_M, ease: 17 }, "tank");
    expect(note.level).toBe("info");
    expect(note.field).toBe("ease");
    expect(note.text).toContain("17 cm");
    expect(note.text).toContain("above the tank check's 16 cm upper boundary");
    expect(note.text).toContain("reduce ease to 16 cm or less");
    expect(note.text).toContain("does not assess fit or silhouette");
    expect(note.text).not.toMatch(/roomy|oversized fit|comfortable amount/i);
  });

  it("treats both existing software-check boundaries as in-band", () => {
    for (const ease of [5, 16]) {
      const note = easeRange({ ...STANDARD_M, ease });
      expect(note.level).toBe("ok");
      expect(note.field).toBe("ease");
      expect(note.text.startsWith("Ease is " + ease + " cm")).toBe(true);
      expect(note.text).toContain("within the tee check's 5–16 cm interval");
      expect(note.text).toContain("does not assess fit, comfort, or fabric compatibility");
      expect(note.text).not.toMatch(/tight to pull on|roomy|oversized fit|comfortable amount/i);
    }
  });

  it("describes T02's 13 cm value as a software interval only", () => {
    const note = easeRange({ ...STANDARD_M, ease: 13 });
    expect(note.level).toBe("ok");
    expect(note.text).toContain("13 cm");
    expect(note.text).toContain("within the tee check's 5–16 cm interval");
    expect(note.text).toContain("does not assess fit, comfort, or fabric compatibility");
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
