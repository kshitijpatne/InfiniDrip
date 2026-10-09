import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const root = "C:/G04-CLO-DXF-Exchange/S626-opencad-all-options-r14-roundtrip";
const manifestPath = `${root}/Evidence/fixture-manifest.json`;
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const executable = `${root}/OpenCADStudio-v2026.40.1-windows-x86_64-portable.exe`;
const expectedExeSha = "301d64cfa5b6ce442dc4def5fc0b35caf4e4c3e39e370852afe15553a8c4e321";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const exeBytes = await readFile(executable);
assert.equal(sha(exeBytes), expectedExeSha, "official receiver binary hash mismatch");
assert.equal(manifest.optionCaseCount, 73);
await mkdir(`${root}/Output`, { recursive: true });
const results = [];
for (const fixture of manifest.cases) {
  const input = `${root}/Input/${fixture.file}`;
  const base = fixture.caseId;
  const first = `${root}/Output/${base}-r14.dxf`;
  const second = `${root}/Output/${base}-r14-reopened.dxf`;
  const inputBytes = await readFile(input);
  assert.equal(sha(inputBytes), fixture.sha256, `${fixture.caseId}: source fixture hash mismatch`);
  const firstArgs = ["--export", input, first, "--target-version", "R14"];
  const firstRun = spawnSync(executable, firstArgs, { encoding: "utf8", windowsHide: true, timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
  let secondRun = null;
  let firstBytes = null;
  let secondBytes = null;
  let failure = null;
  if (firstRun.error || firstRun.status !== 0) failure = { stage: "first-r14", status: firstRun.status, error: firstRun.error?.message ?? null, stdout: firstRun.stdout ?? "", stderr: firstRun.stderr ?? "" };
  else {
    try {
      firstBytes = await readFile(first);
      const secondArgs = ["--export", first, second, "--target-version", "R14"];
      secondRun = spawnSync(executable, secondArgs, { encoding: "utf8", windowsHide: true, timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
      if (secondRun.error || secondRun.status !== 0) failure = { stage: "reopen-r14", status: secondRun.status, error: secondRun.error?.message ?? null, stdout: secondRun.stdout ?? "", stderr: secondRun.stderr ?? "" };
      else secondBytes = await readFile(second);
    } catch (error) {
      failure = { stage: "read-output", error: String(error) };
    }
  }
  const result = {
    caseId: fixture.caseId,
    recipeId: fixture.recipeId,
    inputPath: input,
    inputSha256: sha(inputBytes),
    firstArgs,
    firstExit: firstRun.status,
    firstStdout: firstRun.stdout ?? "",
    firstStderr: firstRun.stderr ?? "",
    firstPath: first,
    firstBytes: firstBytes?.length ?? (await stat(first).then((item) => item.size).catch(() => null)),
    firstSha256: firstBytes ? sha(firstBytes) : null,
    secondArgs: secondRun ? ["--export", first, second, "--target-version", "R14"] : null,
    secondExit: secondRun?.status ?? null,
    secondStdout: secondRun?.stdout ?? "",
    secondStderr: secondRun?.stderr ?? "",
    secondPath: second,
    secondBytes: secondBytes?.length ?? (await stat(second).then((item) => item.size).catch(() => null)),
    secondSha256: secondBytes ? sha(secondBytes) : null,
    byteIdentical: Boolean(firstBytes && secondBytes && sha(firstBytes) === sha(secondBytes)),
    failure,
  };
  results.push(result);
  if ((results.length % 10) === 0 || results.length === manifest.cases.length) console.log(`Converted ${results.length}/${manifest.cases.length} cases.`);
}
const report = {
  slice: "S626",
  receiver: "Open CAD Studio v2026.40.1 local Windows portable CLI",
  executable,
  executableSha256: sha(exeBytes).toUpperCase(),
  command: "--export <absolute C: input> <absolute C: output> --target-version R14; two separate invocations per case",
  targetVersion: "R14 / AC1014",
  sourceManifestPath: manifestPath,
  sourceManifestSha256: sha(await readFile(manifestPath)).toUpperCase(),
  total: results.length,
  firstPasses: results.filter((item) => item.firstExit === 0 && item.firstSha256).length,
  secondPasses: results.filter((item) => item.secondExit === 0 && item.secondSha256).length,
  byteIdenticalSecondGeneration: results.filter((item) => item.byteIdentical).length,
  failed: results.filter((item) => item.failure),
  cases: results,
};
await writeFile(`${root}/Evidence/conversion-record.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ total: report.total, firstPasses: report.firstPasses, secondPasses: report.secondPasses, byteIdentical: report.byteIdenticalSecondGeneration, failures: report.failed.length, output: `${root}/Evidence/conversion-record.json` }, null, 2));
