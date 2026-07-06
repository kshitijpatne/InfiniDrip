import { describe, it, expect } from "vitest";
import { draftTshirt, STANDARD_M } from "../drafting";
import { pieceHandles, editorViewBox } from "../edit";
import { renderEditor } from "./editor";

const front = draftTshirt(STANDARD_M).front;
const handles = pieceHandles(front);
const vb = editorViewBox(front);

describe("renderEditor", () => {
  it("draws the outline, the viewBox, and handle dots", () => {
    const svg = renderEditor(front, handles, vb);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain(`viewBox="${vb.minX} ${vb.minY} ${vb.w} ${vb.h}"`);
    expect(svg).toContain("<path");
    expect(svg).toContain("<rect"); // vertex squares (+ background)
    expect(svg).toContain("<circle"); // control dots
    expect(svg).toContain("stroke-dasharray"); // control tie-lines
  });

  it("draws a selection ring on the chosen handle only", () => {
    const plain = renderEditor(front, handles, vb, null);
    const picked = renderEditor(front, handles, vb, handles[0].id);
    expect(plain).not.toContain('stroke="#FFFFFF"');
    expect(picked).toContain('stroke="#FFFFFF"');
  });
});
