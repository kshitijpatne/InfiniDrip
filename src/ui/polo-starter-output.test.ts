import { describe, expect, it } from "vitest";
import { POLO } from "../drafting/recipe";
import { poloClassicLongSleeveRecipeForOutput, poloCroppedRecipeForOutput, poloRelaxedRecipeForOutput } from "./polo-starter-output";

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

describe("P03 Relaxed Polo output", () => {
  it("keeps material use unspecified and labels the relaxed default as digital-only", () => {
    const output = poloRelaxedRecipeForOutput(POLO, { buttonCount: 2 });
    expect(output.label).toBe("Polo Relaxed");
    expect(output.poms.every((pom) => pom.tolerance === undefined)).toBe(true);
    expect(output.techPack.bom).toEqual([
      { material: "Not specified", placement: "Body, sleeves, collar, placket, and trim", qty: "No consumption estimate" },
      { material: "Buttons", placement: "Front placket; selected software mark count", qty: "2" },
    ]);
    expect(output.techPack.construction.join(" ")).toContain("15 cm ease default is an InfiniDrip software choice");
    expect(output.techPack.construction.join(" ")).toContain("no boxy or drop-shoulder geometry");
    expect(output.techPack.constructionNotice).toContain("No physical sample has been assessed");
    expect(output.techPack.measurementSpecNote).toContain("not a physical standard or validated fit target");
    expect(output.techPack.measurementSpecNote).toContain("not a validated P03 grade");
    expect(output.techPack.measurementSpecToleranceColumn).toBe(false);
    expect(output.techPack.fitRecordStatusNote).toContain("Physical fit, comfort, wear");
    expect(output.techPack.fitRecordPassColumn).toBe(false);
    expect(output.techPack.fitRecordToleranceColumn).toBe(false);
    expect(output.techPack.fitRecordTitle).toBe("Digital Measurement Worksheet");
    expect(output.techPackForOptions!({ buttonCount: 3 }).bom[1]?.qty).toBe("3");
  });

  it("uses the two-button default for missing options and avoids non-finite quantities", () => {
    const base = { ...POLO, techPackForOptions: undefined };
    const output = poloRelaxedRecipeForOutput(base, {});
    expect(output.techPack.bom[1]?.qty).toBe("2");
    expect(output.techPackForOptions!({}).bom[1]?.qty).toBe("2");
    expect(output.techPackForOptions!({ buttonCount: Number.POSITIVE_INFINITY }).bom[1]?.qty).toBe("unresolved");
  });
});

describe("P04 Cropped Polo output", () => {
  it("labels the modeled length as a software choice and keeps physical claims unvalidated", () => {
    const output = poloCroppedRecipeForOutput(POLO, { buttonCount: 2 });
    expect(output.label).toBe("Polo Cropped");
    expect(output.poms.every((pom) => pom.tolerance === undefined)).toBe(true);
    expect(output.techPack.bom).toEqual([
      { material: "Not specified", placement: "Body, sleeves, collar, placket, and trim", qty: "No consumption estimate" },
      { material: "Buttons", placement: "Front placket; selected software mark count", qty: "2" },
    ]);
    expect(output.techPack.construction.join(" ")).toContain("Digital P04 Cropped Polo profile");
    expect(output.techPack.construction.join(" ")).toContain("53 cm body length and 44–57 cm range are editable software choices");
    expect(output.techPack.construction.join(" ")).toContain("not specify a physical crop location or validated fit target");
    expect(output.techPack.constructionNotice).toContain("No physical sample has been assessed");
    expect(output.techPack.measurementSpecNote).toContain("not a physical crop position or validated fit result");
    expect(output.techPack.measurementSpecNote).toContain("not a validated P04 grade");
    expect(output.techPack.measurementSpecToleranceColumn).toBe(false);
    expect(output.techPack.fitRecordStatusNote).toContain("Physical fit, coverage, comfort, wear");
    expect(output.techPack.fitRecordPassColumn).toBe(false);
    expect(output.techPack.fitRecordToleranceColumn).toBe(false);
    expect(output.techPack.fitRecordTitle).toBe("Digital Measurement Worksheet");
    expect(output.techPackForOptions!({ buttonCount: 3 }).bom[1]?.qty).toBe("3");
  });

  it("uses the two-button default for missing options and avoids non-finite quantities", () => {
    const base = { ...POLO, techPackForOptions: undefined };
    const output = poloCroppedRecipeForOutput(base, {});
    expect(output.techPack.bom[1]?.qty).toBe("2");
    expect(output.techPackForOptions!({}).bom[1]?.qty).toBe("2");
    expect(output.techPackForOptions!({ buttonCount: Number.POSITIVE_INFINITY }).bom[1]?.qty).toBe("unresolved");
  });
});
