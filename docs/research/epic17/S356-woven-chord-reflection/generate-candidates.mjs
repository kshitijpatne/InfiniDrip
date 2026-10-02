import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const sourceDir = new URL("../S348-woven-role-token/production-replay/", import.meta.url);
const matrix = JSON.parse(await readFile(new URL("matrix.json", sourceDir), "utf8"));
const outputDir = new URL("candidate-svg/", import.meta.url);
await mkdir(outputDir, { recursive: true });

function readAttribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

function reflectionMatrix(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  if (length < 1e-8) throw new Error("degenerate cap endpoint chord");
  const ux = dx / length;
  const uy = dy / length;
  const m = {
    a: 2 * ux * ux - 1,
    b: 2 * ux * uy,
    c: 2 * ux * uy,
    d: 2 * uy * uy - 1,
  };
  m.e = a.x - m.a * a.x - m.c * a.y;
  m.f = a.y - m.b * a.x - m.d * a.y;
  return m;
}

function matrixText(m) {
  return `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`;
}

function splitSubpaths(d) {
  return d.match(/M[^M]*/g) ?? [];
}

function transformPaths(svg, matrices) {
  let changed = 0;
  const rewritten = svg.replace(/<path\b[^>]*>/g, (tag) => {
    const sourceId = readAttribute(tag, "data-source-id") ?? "";
    if (!sourceId.includes("role:sleeve")
      && !sourceId.includes("role:sleeveBand")
      && !sourceId.includes("mark:sleeveBand:bandFold")) return tag;
    const d = readAttribute(tag, "d");
    if (!d) return tag;
    const subpaths = splitSubpaths(d);
    if (!subpaths.length) throw new Error(`no absolute M subpath in ${sourceId}`);
    const transformed = subpaths.map((subpath, index) => {
      const match = subpath.match(/^M\s*(-?[\d.]+)\s+(-?[\d.]+)/);
      if (!match) throw new Error(`cannot identify mirrored side for ${sourceId}`);
      const side = Number(match[1]) < 0 ? "left" : "right";
      const matrix = matrices[side];
      changed += 1;
      const entityId = readAttribute(tag, "data-entity-id");
      const uniqueEntity = entityId && subpaths.length > 1
        ? `${entityId}:s356-${side}-${index}` : entityId;
      let copy = tag.replace(/\bd="[^"]*"/, `d="${subpath.trim()}"`);
      copy = copy.replace(/\bdata-entity-id="[^"]*"/, uniqueEntity
        ? `data-entity-id="${uniqueEntity}"` : "");
      return copy.replace(/\s*\/?>$/, ` transform="${matrixText(matrix)}"/>`);
    });
    return transformed.join("");
  });
  return { svg: rewritten, transformedSubpaths: changed };
}

function armholeChords(svg, face) {
  const paths = [...svg.matchAll(/<path\b[^>]*>/g)].map((match) => match[0]);
  const seamPaths = paths.filter((tag) => readAttribute(tag, "data-layer") === "SEAM"
    && (readAttribute(tag, "data-source-id") ?? "").includes("armhole"));
  const endpoints = seamPaths.map((tag) => {
    const d = readAttribute(tag, "d");
    const coordinates = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    const points = Array.from({ length: Math.floor(coordinates.length / 2) }, (_, index) => ({
      x: coordinates[index * 2], y: coordinates[index * 2 + 1],
    }));
    if (points.length < 2) throw new Error(`${face}: incomplete seam endpoint geometry`);
    const entity = readAttribute(tag, "data-entity-id") ?? "";
    const source = readAttribute(tag, "data-source-id") ?? "";
    return { entity, source, first: points[0], last: points.at(-1) };
  });
  const right = endpoints.filter((entry) => entry.first.x >= 0 && entry.last.x >= 0);
  const left = endpoints.filter((entry) => entry.first.x <= 0 && entry.last.x <= 0);
  let shoulder;
  let underarm;
  if (face === "FRONT_FLAT") {
    const rightPath = right.find((entry) => entry.source.includes("front:edge:armhole"));
    const leftPath = left.find((entry) => entry.source.includes("front:edge:armhole"));
    if (!rightPath || !leftPath) throw new Error("front armhole receiving path missing mirrored side");
    shoulder = rightPath.first.y <= rightPath.last.y ? rightPath.first : rightPath.last;
    underarm = rightPath.first.y > rightPath.last.y ? rightPath.first : rightPath.last;
    const leftShoulder = leftPath.first.y <= leftPath.last.y ? leftPath.first : leftPath.last;
    const leftUnderarm = leftPath.first.y > leftPath.last.y ? leftPath.first : leftPath.last;
    if (Math.abs(shoulder.x + leftShoulder.x) > 1e-4
      || Math.abs(underarm.x + leftUnderarm.x) > 1e-4
      || Math.abs(shoulder.y - leftShoulder.y) > 1e-4
      || Math.abs(underarm.y - leftUnderarm.y) > 1e-4) {
      throw new Error("front mirrored receiving-armhole endpoints disagree");
    }
  } else {
    const rightUpper = right.find((entry) => entry.source.includes("yoke:edge:armholeUpper"));
    const rightLower = right.find((entry) => entry.source.includes("back:edge:armholeLower"));
    const leftUpper = left.find((entry) => entry.source.includes("yoke:edge:armholeUpper"));
    const leftLower = left.find((entry) => entry.source.includes("back:edge:armholeLower"));
    if (!rightUpper || !rightLower || !leftUpper || !leftLower) {
      throw new Error("back armhole requires exact back-lower and yoke-upper receiving edges on both sides");
    }
    shoulder = rightUpper.first.y <= rightUpper.last.y ? rightUpper.first : rightUpper.last;
    underarm = rightLower.first.y > rightLower.last.y ? rightLower.first : rightLower.last;
    const leftShoulder = leftUpper.first.y <= leftUpper.last.y ? leftUpper.first : leftUpper.last;
    const leftUnderarm = leftLower.first.y > leftLower.last.y ? leftLower.first : leftLower.last;
    if (Math.abs(shoulder.x + leftShoulder.x) > 1e-4
      || Math.abs(underarm.x + leftUnderarm.x) > 1e-4
      || Math.abs(shoulder.y - leftShoulder.y) > 1e-4
      || Math.abs(underarm.y - leftUnderarm.y) > 1e-4) {
      throw new Error("back mirrored receiving-armhole endpoints disagree");
    }
  }
  return {
    right: { shoulder, underarm },
    left: { shoulder: { x: -shoulder.x, y: shoulder.y }, underarm: { x: -underarm.x, y: underarm.y },
      mirroredFromRight: true },
    sourceEdgeIds: endpoints.map(({ source, entity }) => ({ source, entity })),
  };
}

const rows = [];
for (const configuration of matrix.cases.filter((entry) => entry.caseId.startsWith("woven-shirt-"))) {
  for (const face of configuration.faces) {
    const file = `${configuration.caseId}-${face.kind.toLowerCase()}.svg`;
    const source = await readFile(new URL(file, sourceDir), "utf8");
    if (!source.includes(`data-revision-id="${face.revisionId}"`)) throw new Error(`${file}: revision mismatch`);
    const chords = armholeChords(source, face.kind);
    const matrices = {
      right: reflectionMatrix(chords.right.shoulder, chords.right.underarm),
      left: reflectionMatrix(chords.left.shoulder, chords.left.underarm),
    };
    const output = transformPaths(source, matrices);
    if (output.transformedSubpaths < 8) throw new Error(`${file}: incomplete paired sleeve/band mapping (${output.transformedSubpaths})`);
    const candidateFile = new URL(file, outputDir);
    await writeFile(candidateFile, output.svg);
    rows.push({ caseId: configuration.caseId, face: face.kind, revisionId: face.revisionId,
      sourceSvg: `../S348-woven-role-token/production-replay/${file}`,
      candidateSvg: `candidate-svg/${file}`, endpoints: chords, matrices,
      transformedSubpaths: output.transformedSubpaths, sourceStitchJoinEvidence:
        "S349 exact source audit: sleeveBand.top ↔ sleeve.hem, max endpoint residual 2.864289338439558e-14 cm; one common isometry is applied to both joined roles on each side." });
  }
}
if (rows.length !== 56) throw new Error(`expected 56 exact option/view candidates, got ${rows.length}`);

const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push({ kind: "pageerror", message: error.message }));
  for (const row of rows) {
    const svg = await readFile(new URL(row.candidateSvg, import.meta.url), "utf8");
    await page.setContent(svg, { waitUntil: "load" });
    const view = await page.evaluate(() => {
      const root = document.querySelector("svg");
      const transformedRoles = [...root.querySelectorAll("path[transform]")]
        .filter((path) => /role:sleeve(?:Band)?|mark:sleeveBand:bandFold/.test(path.getAttribute("data-source-id") ?? ""));
      const revisions = new Set([...root.querySelectorAll("[data-revision-id]")]
        .map((node) => node.getAttribute("data-revision-id")));
      return { roots: document.querySelectorAll("svg").length, revisionCount: revisions.size,
        revisionId: root.getAttribute("data-revision-id"), transformedRolePaths: transformedRoles.length,
        sleeveFillPaths: transformedRoles.filter((path) => path.getAttribute("data-source-id") === "pattern:woven-shirt:role:sleeve" && path.getAttribute("fill") !== "none").length,
        bandFillPaths: transformedRoles.filter((path) => path.getAttribute("data-source-id") === "pattern:woven-shirt:role:sleeveBand" && path.getAttribute("fill") !== "none").length };
    });
    if (view.roots !== 1 || view.revisionCount !== 1 || view.revisionId !== row.revisionId
      || view.sleeveFillPaths !== 2 || view.bandFillPaths !== 2) {
      throw new Error(`${row.caseId}/${row.face}: candidate mismatch ${JSON.stringify(view)}`);
    }
    row.browserCheck = view;
  }
  await page.close();
} finally {
  await browser.close();
}
if (errors.length) throw new Error(`candidate Chromium errors: ${JSON.stringify(errors)}`);
const report = { candidate: "view-only reflection of each complete sleeve and its joined band across the exact receiving cap-half endpoint chord", configurations: 28, faces: rows.length, errors, rows };
await writeFile(new URL("candidate-matrix.json", import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ configurations: 28, faces: rows.length, errors: errors.length,
  browserRevisionChecks: rows.length, transforms: rows.reduce((sum, row) => sum + row.transformedSubpaths, 0) }, null, 2));
