const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createCoverageMap } = require("istanbul-lib-coverage");

const root = path.resolve(__dirname, "../../../../");
const coveragePath = path.join(root, "coverage", "coverage-final.json");
const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
const app = Object.values(coverage).find((entry) => entry.path.endsWith(`${path.sep}src${path.sep}ui${path.sep}app.ts`));
assert.ok(app, "coverage-final.json includes src/ui/app.ts");

const firstLine = 5763;
const lastLine = 5818;
const inRange = (line) => line >= firstLine && line <= lastLine;
const fileCoverage = createCoverageMap(coverage).fileCoverageFor(app.path);
const lineCoverage = fileCoverage.getLineCoverage();
const uncovered = {
  statements: Object.entries(app.statementMap).filter(([id, item]) => inRange(item.start.line) && app.s[id] === 0)
    .map(([id, item]) => ({ id, line: item.start.line })),
  branches: Object.entries(app.branchMap).filter(([id, item]) => inRange(item.line) && app.b[id].some((count) => count === 0))
    .map(([id, item]) => ({ id, line: item.line, counts: app.b[id] })),
  functions: Object.entries(app.fnMap).filter(([id, item]) => inRange(item.line) && app.f[id] === 0)
    .map(([id, item]) => ({ id, name: item.name, line: item.line })),
  lines: Object.entries(lineCoverage).filter(([line, count]) => inRange(Number(line)) && count === 0)
    .map(([line]) => Number(line)),
};
assert.deepEqual(uncovered, { statements: [], branches: [], functions: [], lines: [] });

console.log(JSON.stringify({
  file: "src/ui/app.ts",
  changedRange: `${firstLine}-${lastLine}`,
  covered: {
    statements: Object.values(app.statementMap).filter((item) => inRange(item.start.line)).length,
    branches: Object.values(app.branchMap).filter((item) => inRange(item.line)).length,
    functions: Object.values(app.fnMap).filter((item) => inRange(item.line)).length,
    lines: Object.keys(lineCoverage).filter((line) => inRange(Number(line))).length,
  },
  uncovered,
}, null, 2));
