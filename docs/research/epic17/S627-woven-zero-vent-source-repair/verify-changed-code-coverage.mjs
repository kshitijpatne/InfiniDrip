import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const coveragePath = process.argv[2] ?? "coverage/coverage-final.json";
const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
const entry = Object.entries(coverage).find(([path]) => path.toLowerCase().endsWith("\\src\\drafting\\shirt.ts"));
assert(entry, `coverage entry for src/drafting/shirt.ts missing in ${coveragePath}`);
const [sourcePath, file] = entry;
const functionEntry = Object.entries(file.fnMap).find(([, item]) => item.name === "curvedHemAndVent");
assert(functionEntry, "curvedHemAndVent coverage map missing");
const [functionId, fn] = functionEntry;
const start = fn.loc.start.line;
const end = fn.loc.end.line;
const withinFunction = (location) => location.start.line >= start && location.end.line <= end;
const statements = Object.entries(file.statementMap).filter(([, loc]) => withinFunction(loc));
const branches = Object.entries(file.branchMap).filter(([, branch]) => withinFunction(branch.loc));
const unhitStatements = statements.filter(([id]) => file.s[id] === 0).map(([id]) => Number(id));
const unhitBranches = branches.flatMap(([id, branch]) => branch.locations
  .map((location, index) => ({ id: Number(id), index, location, hits: file.b[id][index] }))
  .filter((item) => item.hits === 0));
assert(file.f[functionId] > 0, "changed function was not invoked");
assert(statements.length > 0, "no changed-function statements found");
assert(branches.length > 0, "no changed-function branches found");
assert.deepEqual(unhitStatements, [], "changed production statements must have 100% coverage");
assert.deepEqual(unhitBranches, [], "changed production branches must have 100% coverage");
console.log(JSON.stringify({ sourcePath, function: fn.name, lines: { start, end }, statements: `${statements.length}/${statements.length}`, branches: `${branches.reduce((sum, [, branch]) => sum + branch.locations.length, 0)}/${branches.reduce((sum, [, branch]) => sum + branch.locations.length, 0)}`, functions: "1/1", unhitStatements, unhitBranches }, null, 2));
