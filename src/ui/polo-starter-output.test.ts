import { describe, expect, it } from "vitest";
import { POLO } from "../drafting/recipe";
import { poloClassicLongSleeveRecipeForOutput } from "./polo-starter-output";

describe("P02 Classic long-sleeve Polo output", () => {
  it("keeps material consumption unspecified and follows the selected button count", () => {
    const output = poloClassicLongSleeveRecipeForOutput(POLO, { buttonCount: 2 });
    expect(output.label).toBe("Polo Classic long-sleeve");
    expect(output.poms.every((pom) => pom.tolerance === undefined)).toBe(true);
    expect(output.techPack.bom).toEqual([
      { material: "Not specified", placement: "Body, sleeves, collar, placket, and trim", qty: "No consumption estimate" },
      { material: "Buttons", placement: "Front placket; selected software mark count", qty: "2" },
    ]);
    expect(output.techPack.construction.join(" ")).toContain("turn under 2 cm and topstitch");
    expect(output.techPack.construction.join(" ")).toContain("https://www.stylearc.com/magazine/sewing-tutorials/jess-knit-polo/");
    expect(output.techPack.construction.join(" ")).toContain("digital button and buttonhole marks follow this choice");
    expect(output.techPack.constructionNotice).toContain("not a validated InfiniDrip sewing instruction");
    expect(output.techPack.measurementSpecNote).toContain("not a validated P02 grade");
    expect(output.techPack.measurementSpecToleranceColumn).toBe(false);
    expect(output.techPack.fitRecordStatusNote).toContain("Physical fit, comfort, wear");
    expect(output.techPack.fitRecordPassColumn).toBe(false);
    expect(output.techPack.fitRecordToleranceColumn).toBe(false);
    expect(output.techPack.fitRecordTitle).toBe("Digital Measurement Worksheet");

    expect(output.techPackForOptions!({ buttonCount: 3 }).bom[1]?.qty).toBe("3");
  });

  it("uses safe output defaults when the source recipe has no option-aware Tech Pack", () => {
    const base = { ...POLO, techPackForOptions: undefined };
    const output = poloClassicLongSleeveRecipeForOutput(base, {});
    expect(output.techPack.bom[1]?.qty).toBe("2");
    expect(output.techPackForOptions!({}).bom[1]?.qty).toBe("2");
    expect(output.techPackForOptions!({ buttonCount: Number.POSITIVE_INFINITY }).bom[1]?.qty).toBe("unresolved");
  });
});
