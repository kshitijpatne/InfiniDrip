// Generated verification logs only; no source/config/baseline rewriting.
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const full = process.argv[2] === "full";
const output = resolve("docs/research/uiq-clarity/evidence"); mkdirSync(output, { recursive: true });
const gates = full ? [["full-global", "npx vitest run --coverage --exclude=tmp/ui-repo-sources/** --minWorkers=1 --maxWorkers=1 --coverage.reportsDirectory=coverage-uiq34-global --coverage.reporter=text --coverage.reporter=json-summary --coverage.reporter=json --reporter=default --reporter=json --outputFile=docs/research/uiq-clarity/evidence/full-vitest-results.json"]] : [
  ["type-build", "npm run build"],
  ["preview-typecheck", "npx tsc --noEmit --strict --target ES2020 --module ESNext --moduleResolution bundler --esModuleInterop --skipLibCheck ops/ui-candidates/clarity-preview.ts ops/ui-candidates/guidance-preview.ts ops/ui-candidates/material-preview.ts"],
  ["control-center", "npm run control-center:test"],
  ["delivery-proof", "npm run web:release:test"],
  ["readiness", "npm run readiness:drill:test"],
  ["browser", "node ops/ui-candidates/clarity-verify.mjs"],
  ["protected-identities", "node ops/ui-candidates/clarity-identities.mjs"],
];
const report = { startedAt: new Date().toISOString(), gates: [] };
for (const [name, command] of gates) {
  const startedAt = new Date().toISOString(), tick = performance.now();
  const stream = createWriteStream(resolve(output, `${name}.log`));
  console.log(`Starting ${name}`);
  const child = spawn(process.platform === "win32" ? "cmd.exe" : "/bin/sh", process.platform === "win32" ? ["/d", "/s", "/c", command] : ["-c", command], { stdio: ["ignore", "pipe", "pipe"] });
  for (const channel of [child.stdout, child.stderr]) channel.on("data", chunk => { stream.write(chunk); process.stdout.write(chunk); });
  const exitCode = await new Promise((res, reject) => { child.once("error", reject); child.once("close", code => res(code)); });
  await new Promise(res => stream.end(res));
  report.gates.push({ name, command, startedAt, elapsedMs: Math.round(performance.now() - tick), exitCode });
  writeFileSync(resolve(output, full ? "full-gates.json" : "supporting-gates.json"), JSON.stringify(report, null, 2));
  if (exitCode !== 0) { process.exitCode = 1; break; }
}
report.finishedAt = new Date().toISOString();
writeFileSync(resolve(output, full ? "full-gates.json" : "supporting-gates.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
