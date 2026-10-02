import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const reportUrl = new URL("./normal-offset-candidate-matrix.json", import.meta.url);

describe("S361 Woven sleeve/band normal-offset diagnostic", () => {
  it("reproduces every current option and retains the crossing hold", async () => {
    const report = JSON.parse(await readFile(reportUrl, "utf8"));
    expect(report.conventionNotEncodedBySource).toBe(true);
    expect(report.configurations).toBe(28);
    expect(report.faces).toBe(56);
    expect(report.reports).toHaveLength(28);
    expect(new Set(report.reports.map((row: { caseId: string }) => row.caseId)).size).toBe(28);
    for (const row of report.reports) {
      expect(row.revisionId).toBe("live-draft:woven-shirt:14:14");
      expect(row.source.sleeveCap).toBe("sleeve.capRight");
      expect(row.source.sleeveHem).toBe("sleeve.hem");
      expect(row.source.receiver).toEqual(["yoke.armholeUpper", "back.armholeLower"]);
      expect(row.source.instanceCount).toBe(2);
      expect(row.sourceBandToSleeveJoinResidualCm).toBeLessThan(1e-8);
      expect(row.mappedBandToSleeveJoinResidualCm).toBe(0);
      expect(row.baselineBandPairCrossings).toBe(4);
      expect(row.diagnosticBandPairCrossings).toBeGreaterThan(0);
    }
    expect(report.bandPairCrossingsByCase.filter((row: { candidate: number }) => row.candidate === 4)).toHaveLength(26);
    expect(report.bandPairCrossingsByCase.filter((row: { candidate: number }) => row.candidate === 8)).toHaveLength(2);
    expect(report.bandPairCrossingsByCase.every((row: { baseline: number }) => row.baseline === 4)).toBe(true);
  });
});
