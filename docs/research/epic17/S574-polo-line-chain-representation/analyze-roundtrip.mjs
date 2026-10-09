import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation";
const sourcePath = root + "/Input/polo-source-m.dxf";
const outputPath = root + "/Output/polo-line-chain-gen1.dxf";
const reportPath = root + "/Evidence/line-chain-gen1-analysis.json";
const toleranceCm = 0.001;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();

function parseDxf(bytes) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, "DXF must contain complete code/value pairs");
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    assert.match(lines[i].trim(), /^\d+$/, "DXF group code must be numeric");
    pairs.push([Number(lines[i].trim()), lines[i + 1].trim()]);
  }

  const value = (entity, code) => entity.find(([group]) => group === code)?.[1];
  const sections = [];
  let section;
  for (let i = 0; i < pairs.length; i += 1) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
      section = { name: pairs[i + 1]?.[1], entities: [] };
      sections.push(section);
      i += 1;
    } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") {
      section = undefined;
    } else if (section && pairs[i][0] === 0) {
      const start = i;
      i += 1;
      while (i < pairs.length && pairs[i][0] !== 0) i += 1;
      section.entities.push(pairs.slice(start, i));
      i -= 1;
    }
  }

  function geometry(entity, following = []) {
    if (entity[0]?.[1] === "LWPOLYLINE") {
      const points = [];
      let x;
      for (const [code, raw] of entity) {
        if (code === 10) x = Number(raw);
        if (code === 20 && x !== undefined) {
          points.push({ x, y: Number(raw) });
          x = undefined;
        }
      }
      return { points, closed: (Number(value(entity, 70) ?? 0) & 1) === 1 };
    }
    if (entity[0]?.[1] !== "POLYLINE") return undefined;

    const points = [];
    for (const candidate of following) {
      if (candidate[0]?.[1] === "SEQEND") break;
      if (candidate[0]?.[1] === "VERTEX") {
        points.push({ x: Number(value(candidate, 10)), y: Number(value(candidate, 20)) });
      }
    }
    return { points, closed: (Number(value(entity, 70) ?? 0) & 1) === 1 };
  }

  const contours = [];
  function addContours(entities, block) {
    for (let i = 0; i < entities.length; i += 1) {
      const parsed = geometry(entities[i], entities.slice(i + 1));
      if (parsed?.closed) {
        contours.push({ block, layer: value(entities[i], 8) ?? "(none)", ...parsed });
      }
    }
  }

  addContours(sections.find((item) => item.name === "ENTITIES")?.entities ?? [], null);
  const blockSection = sections.find((item) => item.name === "BLOCKS");
  let blockName;
  let blockEntities = [];
  for (const entity of blockSection?.entities ?? []) {
    if (entity[0]?.[1] === "BLOCK") {
      blockName = value(entity, 2);
      blockEntities = [];
    } else if (entity[0]?.[1] === "ENDBLK") {
      addContours(blockEntities, blockName);
      blockName = undefined;
    } else if (blockName) {
      blockEntities.push(entity);
    }
  }
  return { sections, contours };
}

function pointToSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared
    ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared))
    : 0;
  return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy);
}

function directedVertexToPathDistance(points, path) {
  return Math.max(...points.map((point) => Math.min(
    ...path.map((start, index) => pointToSegmentDistance(point, start, path[(index + 1) % path.length])),
  )));
}

function symmetricVertexToPathDistance(a, b) {
  return Math.max(directedVertexToPathDistance(a, b), directedVertexToPathDistance(b, a));
}

const sourceBytes = await readFile(sourcePath);
const outputBytes = await readFile(outputPath);
const source = parseDxf(sourceBytes);
const output = parseDxf(outputBytes);
assert.equal(source.contours.length, 18, "expected nine CUT and nine SEW source contours");

const matches = source.contours.map((contour, sourceOrdinal) => {
  const expectedBlock = String(Math.floor(sourceOrdinal / 2)) + "_M";
  const candidates = output.contours
    .filter((candidate) => candidate.block === expectedBlock)
    .map((candidate, outputOrdinal) => ({
      outputOrdinal,
      block: candidate.block,
      layer: candidate.layer,
      symmetricVertexToPathDistanceCm: symmetricVertexToPathDistance(contour.points, candidate.points),
      sourceVertexCount: contour.points.length,
      outputVertexCount: candidate.points.length,
    }))
    .sort((a, b) => a.symmetricVertexToPathDistanceCm - b.symmetricVertexToPathDistanceCm);
  return {
    sourceOrdinal,
    sourceLayer: contour.layer,
    expectedBlock,
    sourceVertexCount: contour.points.length,
    best: candidates[0] ?? null,
    candidatesWithinGate: candidates.filter((candidate) => candidate.symmetricVertexToPathDistanceCm <= toleranceCm).length,
    nearestCandidates: candidates.slice(0, 3),
  };
});

const matchSummary = {
  matchedWithinGate: matches.filter((match) => match.best && match.best.symmetricVertexToPathDistanceCm <= toleranceCm).length,
  overGate: matches.filter((match) => match.best && match.best.symmetricVertexToPathDistanceCm > toleranceCm).length,
  missing: matches.filter((match) => !match.best).length,
  ambiguous: matches.filter((match) => match.candidatesWithinGate > 1).length,
  maxBestSymmetricVertexToPathDistanceCm: Math.max(...matches.map((match) => match.best?.symmetricVertexToPathDistanceCm ?? Infinity)),
  vertexCountChanged: matches.filter((match) => match.best && match.best.outputVertexCount !== match.sourceVertexCount).length,
};

const report = {
  receiver: "CLO 2026.1.310 (r58944)",
  profile: "DXF-AAMA; cm; 100%; no rotation; Graded Nest; selected patterns off; other defaults",
  toleranceCm,
  comparison: "symmetric vertex-to-segment path distance in direct centimeter coordinates, scoped to corresponding output block",
  pieceAssociation: "Source contours alternate CUT/SEW by piece ordinal; block n_M uses that ordinal. Exact SEW path candidates support this geometry association, but no explicit source piece identifier is claimed.",
  source: {
    path: sourcePath,
    bytes: sourceBytes.length,
    sha256: sha256(sourceBytes),
    contourCount: source.contours.length,
    contours: source.contours.map((contour) => ({ layer: contour.layer, vertexCount: contour.points.length })),
  },
  output: {
    path: outputPath,
    bytes: outputBytes.length,
    sha256: sha256(outputBytes),
    sections: output.sections.map((item) => item.name),
    closedContourCount: output.contours.length,
    contours: output.contours.map((contour) => ({
      block: contour.block,
      layer: contour.layer,
      vertexCount: contour.points.length,
    })),
  },
  matchSummary,
  matches,
};

await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ reportPath, ...matchSummary, outputContourCount: output.contours.length, outputSha256: report.output.sha256 }, null, 2));