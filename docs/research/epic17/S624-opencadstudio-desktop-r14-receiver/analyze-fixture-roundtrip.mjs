import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S624-opencadstudio-desktop-r14-receiver";
const manifest = JSON.parse(await readFile(`${root}/Evidence/fixture-manifest.json`, "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const numeric = (v) => Number(v.trim());

function parseDxf(file, text) {
  const rows = text.replace(/\r\n/g, "\n").trimEnd().split("\n");
  if (rows.length % 2 !== 0) throw new Error(`${file}: unmatched DXF group/value row`);
  const pairs = [];
  for (let i = 0; i < rows.length; i += 2) {
    if (!/^\s*\d+\s*$/.test(rows[i])) throw new Error(`${file}: invalid group code on row ${i + 1}`);
    pairs.push([Number(rows[i].trim()), rows[i + 1].trim()]);
  }
  let section = null;
  let pendingSection = false;
  let current = null;
  let vertex = null;
  const entities = [];
  const header = [];
  const finish = () => {
    if (vertex && current?.type === "POLYLINE") current.vertices.push(vertex);
    vertex = null;
    if (current) entities.push(current);
    current = null;
  };
  for (const [code, value] of pairs) {
    if (code === 0 && value === "SECTION") { pendingSection = true; continue; }
    if (pendingSection && code === 2) { section = value; pendingSection = false; continue; }
    if (section === "HEADER") { header.push([code, value]); if (code === 0 && value === "ENDSEC") section = null; continue; }
    if (section !== "ENTITIES") continue;
    if (code === 0 && value === "ENDSEC") { finish(); section = null; continue; }
    if (code === 0 && value === "VERTEX" && current?.type === "POLYLINE") {
      if (vertex) current.vertices.push(vertex);
      vertex = { fields: [] };
      continue;
    }
    if (code === 0 && value === "SEQEND" && current?.type === "POLYLINE") { finish(); continue; }
    if (code === 0) {
      finish();
      if (!["ENDSEC", "EOF"].includes(value)) current = { type: value, layer: null, fields: [], vertices: [] };
      continue;
    }
    if (vertex && current?.type === "POLYLINE") {
      vertex.fields.push([code, value]);
      continue;
    }
    if (current) {
      current.fields.push([code, value]);
      if (code === 8) current.layer ??= value;
    }
  }
  finish();
  const sectionPairs = (name) => {
    const out = [];
    let active = false;
    let pending = false;
    for (let i = 0; i < pairs.length; i += 1) {
      const [code, value] = pairs[i];
      if (code === 0 && value === "SECTION") { pending = true; continue; }
      if (pending && code === 2) { active = value === name; pending = false; continue; }
      if (active && code === 0 && value === "ENDSEC") break;
      if (active) out.push([code, value]);
    }
    return out;
  };
  const h = sectionPairs("HEADER");
  const variable = (name, valueCode) => {
    for (let i = 0; i < h.length - 1; i += 1) if (h[i][0] === 9 && h[i][1] === name && h[i + 1][0] === valueCode) return h[i + 1][1];
    return null;
  };
  const getPointList = (entity) => {
    if (entity.type === "POLYLINE") {
      return entity.vertices.map((v) => ({
        x: numeric(v.fields.find(([c]) => c === 10)?.[1] ?? "NaN"),
        y: numeric(v.fields.find(([c]) => c === 20)?.[1] ?? "NaN"),
      }));
    }
    if (entity.type === "LWPOLYLINE") {
      const pts = [];
      for (const [code, value] of entity.fields) {
        if (code === 10) pts.push({ x: numeric(value), y: NaN });
        if (code === 20 && pts.length) pts.at(-1).y = numeric(value);
      }
      return pts;
    }
    return null;
  };
  return {
    file,
    version: variable("$ACADVER", 1),
    units: variable("$INSUNITS", 70) === null ? null : numeric(variable("$INSUNITS", 70)),
    entities: entities.map((e) => ({ ...e, points: getPointList(e) })),
  };
}

function categoryCounts(doc) {
  const counts = {};
  for (const entity of doc.entities) {
    const key = `${entity.type}/${entity.layer ?? "<no-layer>"}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function coordinates(entity) {
  if (entity.points) return entity.points;
  const get = (code) => {
    const value = entity.fields.find(([c]) => c === code)?.[1];
    return value === undefined ? undefined : numeric(value);
  };
  if (entity.type === "LINE") return [{ x: get(10), y: get(20) }, { x: get(11), y: get(21) }];
  if (entity.type === "CIRCLE" || entity.type === "ARC") return [{ x: get(10), y: get(20) }, { x: get(40), y: get(50) }, { x: get(51), y: get(30) }];
  if (entity.type === "POINT") return [{ x: get(10), y: get(20) }];
  return null;
}

function bestPathResidual(a, b, isClosed) {
  if (a.length !== b.length || !a.length) return Infinity;
  let best = Infinity;
  const starts = isClosed ? a.map((_, i) => i) : [0];
  for (const start of starts) for (const direction of [1, -1]) {
    if (!isClosed && direction === -1) continue;
    let max = 0;
    for (let i = 0; i < a.length; i += 1) {
      const j = isClosed ? (start + direction * i + b.length * 2) % b.length : (direction === 1 ? i : b.length - 1 - i);
      max = Math.max(max, Math.hypot(a[i].x - b[j].x, a[i].y - b[j].y));
    }
    best = Math.min(best, max);
  }
  return best;
}

function matchContours(source, target, layer) {
  const left = source.entities.filter((e) => e.layer === layer && e.points);
  const right = target.entities.filter((e) => e.layer === layer && e.points);
  const flags = (entity) => entity.type === "POLYLINE"
    ? Number(entity.fields.find(([code]) => code === 70)?.[1] ?? 0)
    : Number(entity.fields.find(([code]) => code === 70)?.[1] ?? 0);
  const edges = left.map((a) => right.map((b, j) => ({ j, residual: bestPathResidual(a.points, b.points, Boolean(flags(a) & 1 && flags(b) & 1)) }))
    .filter((item) => item.residual <= 0.001).sort((a, b) => a.residual - b.residual).map((item) => item.j));
  const assignment = Array(right.length).fill(-1);
  const visit = (i, seen) => {
    for (const j of edges[i]) {
      if (seen.has(j)) continue;
      seen.add(j);
      if (assignment[j] === -1 || visit(assignment[j], seen)) { assignment[j] = i; return true; }
    }
    return false;
  };
  let matched = 0;
  for (let i = 0; i < left.length; i += 1) if (visit(i, new Set())) matched += 1;
  const nearest = left.map((a) => Math.min(Infinity, ...right.map((b) => bestPathResidual(a.points, b.points, Boolean(flags(a) & 1 && flags(b) & 1)))));
  return { sourceCount: left.length, targetCount: right.length, matchedWithin001cm: matched, maxNearestCm: nearest.length ? Math.max(...nearest) : 0, allClosed: left.every((e) => Boolean(flags(e) & 1)) && right.every((e) => Boolean(flags(e) & 1)) };
}

const cases = [];
for (const fixture of manifest.fixtures) {
  const base = fixture.file.replace(/\.dxf$/i, "");
  const inputPath = `${root}/Input/${fixture.file}`;
  const outPath = `${root}/Output/${base}-r14.dxf`;
  const reopenedPath = `${root}/Output/${base}-r14-reopened.dxf`;
  const [inputBytes, outBytes, reopenedBytes] = await Promise.all([readFile(inputPath), readFile(outPath), readFile(reopenedPath)]);
  assert.equal(sha256(inputBytes), fixture.sha256, `${fixture.file}: pinned input hash`);
  const input = parseDxf(fixture.file, inputBytes.toString("utf8"));
  const output = parseDxf(`${base}-r14.dxf`, outBytes.toString("utf8"));
  const reopened = parseDxf(`${base}-r14-reopened.dxf`, reopenedBytes.toString("utf8"));
  const counts = categoryCounts(input);
  const outputCounts = categoryCounts(output);
  const reopenedCounts = categoryCounts(reopened);
  const cut = matchContours(input, output, "CUT");
  const sew = matchContours(input, output, "SEW");
  const cut2 = matchContours(output, reopened, "CUT");
  const sew2 = matchContours(output, reopened, "SEW");
  const layerNames = (doc) => [...new Set(doc.entities.map((e) => e.layer).filter(Boolean))].sort();
  const firstPass = JSON.stringify(counts) === JSON.stringify(outputCounts)
    && JSON.stringify(layerNames(input)) === JSON.stringify(layerNames(output))
    && cut.sourceCount === fixture.pieceCount && cut.targetCount === fixture.pieceCount && cut.matchedWithin001cm === fixture.pieceCount && cut.allClosed
    && sew.sourceCount === fixture.pieceCount && sew.targetCount === fixture.pieceCount && sew.matchedWithin001cm === fixture.pieceCount && sew.allClosed;
  const reopenPass = JSON.stringify(outputCounts) === JSON.stringify(reopenedCounts)
    && JSON.stringify(layerNames(output)) === JSON.stringify(layerNames(reopened))
    && cut2.matchedWithin001cm === fixture.pieceCount && sew2.matchedWithin001cm === fixture.pieceCount;
  cases.push({
    fixture: fixture.file,
    recipe: fixture.recipe,
    size: fixture.size,
    inputSha256: sha256(inputBytes),
    r14Sha256: sha256(outBytes),
    reopenedSha256: sha256(reopenedBytes),
    r14Version: output.version,
    reopenedVersion: reopened.version,
    sourceEntityLayers: counts,
    r14EntityLayers: outputCounts,
    reopenedEntityLayers: reopenedCounts,
    sourceLayers: layerNames(input),
    outputLayers: layerNames(output),
    cut,
    sew,
    secondPass: { cut: cut2, sew: sew2, byteIdentical: sha256(outBytes) === sha256(reopenedBytes) },
    firstPass,
    reopenPass,
  });
}

const negative = manifest.negativeControl;
const negativePath = `${root}/Input/${negative.file}`;
const negativeBytes = await readFile(negativePath);
assert.equal(sha256(negativeBytes), negative.sha256, "malformed control hash");
const negativeOutput = `${root}/Output/negative-truncated-group-value-r14.dxf`;
const negativeArgs = ["--export", negativePath, negativeOutput, "--target-version", "R14"];
const execFileSync = (await import("node:child_process")).execFileSync;
let negativeExit = 0;
let negativeError = "";
try {
  execFileSync(`${root}/OpenCADStudio-v2026.40.1-windows-x86_64-portable.exe`, negativeArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
} catch (error) {
  negativeExit = error.status ?? -1;
  negativeError = `${error.stdout ?? ""}${error.stderr ?? ""}`;
}
const negativeRejected = negativeExit !== 0 && !await import("node:fs").then(({ existsSync }) => existsSync(negativeOutput));
const report = { application: "OpenCADStudio v2026.40.1", targetVersion: "R14 / AC1014", toleranceCm: 0.001, scope: manifest.scope, cases, negative: { file: negative.file, exitCode: negativeExit, rejectedWithoutOutput: negativeRejected, error: negativeError } };
await writeFile(`${root}/Evidence/roundtrip-analysis.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ cases: cases.map(({ fixture, firstPass, reopenPass, r14Version, cut, sew }) => ({ fixture, firstPass, reopenPass, r14Version, cutPass: cut.matchedWithin001cm, sewPass: sew.matchedWithin001cm, expectedEach: cut.sourceCount })), negative: report.negative }, null, 2));
