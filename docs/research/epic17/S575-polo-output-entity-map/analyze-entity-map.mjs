import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S574-polo-line-chain-representation";
const sourcePath = root + "/Input/polo-source-m.dxf";
const outputPath = root + "/Output/polo-line-chain-gen1.dxf";
const reportPath = "C:/G04-CLO-DXF-Exchange/S575-polo-output-entity-map/Evidence/polo-gen1-entity-map.json";
const gateCm = 0.001;
const endpointSnapCm = 0.00001;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();

function readDxf(bytes) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, "DXF code/value pairs must be complete");
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    assert.match(lines[i].trim(), /^\d+$/, "group code must be numeric");
    pairs.push([Number(lines[i].trim()), lines[i + 1].trim()]);
  }
  const value = (raw, code) => raw.find(([group]) => group === code)?.[1];
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

  const blocks = new Map();
  const blockSection = sections.find((item) => item.name === "BLOCKS");
  let block;
  for (const entity of blockSection?.entities ?? []) {
    const type = entity[0]?.[1];
    if (type === "BLOCK") {
      block = {
        name: value(entity, 2),
        base: { x: Number(value(entity, 10) ?? 0), y: Number(value(entity, 20) ?? 0) },
        entities: [],
      };
      blocks.set(block.name, block);
    } else if (type === "ENDBLK") {
      block = undefined;
    } else if (block) {
      block.entities.push(entity);
    }
  }
  return { sections, blocks, value };
}

function entityGeometry(entity, following, getValue) {
  const type = entity[0]?.[1];
  const layer = getValue(entity, 8) ?? "(none)";
  if (type === "LINE") {
    return {
      type,
      layer,
      points: [
        { x: Number(getValue(entity, 10)), y: Number(getValue(entity, 20)) },
        { x: Number(getValue(entity, 11)), y: Number(getValue(entity, 21)) },
      ],
      closed: false,
    };
  }
  if (type === "POINT") {
    return {
      type,
      layer,
      points: [{ x: Number(getValue(entity, 10)), y: Number(getValue(entity, 20)) }],
      closed: false,
    };
  }
  if (type === "LWPOLYLINE") {
    const points = [];
    let x;
    for (const [code, raw] of entity) {
      if (code === 10) x = Number(raw);
      if (code === 20 && x !== undefined) {
        points.push({ x, y: Number(raw) });
        x = undefined;
      }
    }
    return { type, layer, points, closed: (Number(getValue(entity, 70) ?? 0) & 1) === 1 };
  }
  if (type !== "POLYLINE") return undefined;
  const points = [];
  for (const child of following) {
    if (child[0]?.[1] === "SEQEND") break;
    if (child[0]?.[1] === "VERTEX") {
      points.push({ x: Number(getValue(child, 10)), y: Number(getValue(child, 20)) });
    }
  }
  return { type, layer, points, closed: (Number(getValue(entity, 70) ?? 0) & 1) === 1 };
}

function transformPoint(point, insert, base) {
  const sx = insert.scaleX;
  const sy = insert.scaleY;
  const angle = insert.rotationDegrees * Math.PI / 180;
  const x = (point.x - base.x) * sx;
  const y = (point.y - base.y) * sy;
  return {
    x: insert.x + x * Math.cos(angle) - y * Math.sin(angle),
    y: insert.y + x * Math.sin(angle) + y * Math.cos(angle),
  };
}

function segmentsFor(points, closed) {
  const result = [];
  for (let i = 0; i + 1 < points.length; i += 1) result.push([points[i], points[i + 1]]);
  if (closed && points.length > 2) result.push([points.at(-1), points[0]]);
  return result;
}

function pointSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length2 = dx * dx + dy * dy;
  const t = length2
    ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / length2))
    : 0;
  return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy);
}

function symmetricPathDistance(sourcePoints, targetSegments) {
  if (sourcePoints.length < 2 || targetSegments.length === 0) return Infinity;
  const sourceSegments = segmentsFor(sourcePoints, true);
  const forward = Math.max(...sourcePoints.map((point) =>
    Math.min(...targetSegments.map(([a, b]) => pointSegmentDistance(point, a, b))),
  ));
  const targetPoints = targetSegments.flat();
  const reverse = Math.max(...targetPoints.map((point) =>
    Math.min(...sourceSegments.map(([a, b]) => pointSegmentDistance(point, a, b))),
  ));
  return Math.max(forward, reverse);
}

function nearestPointDistance(point, candidates) {
  return candidates.length
    ? Math.min(...candidates.map((candidate) => Math.hypot(point.x - candidate.x, point.y - candidate.y)))
    : Infinity;
}

function lineComponents(edges) {
  const nodes = [];
  function nodeFor(point) {
    let node = nodes.find((candidate) => Math.hypot(candidate.point.x - point.x, candidate.point.y - point.y) <= endpointSnapCm);
    if (!node) {
      node = { point, edges: [] };
      nodes.push(node);
    }
    return node;
  }
  const edgeRecords = edges.map((edge, index) => {
    const a = nodeFor(edge.points[0]);
    const b = nodeFor(edge.points[1]);
    const record = { index, a, b, edge };
    a.edges.push(record);
    b.edges.push(record);
    return record;
  });
  const visited = new Set();
  const components = [];
  for (const edge of edgeRecords) {
    if (visited.has(edge.index)) continue;
    const stack = [edge];
    const component = [];
    while (stack.length) {
      const current = stack.pop();
      if (visited.has(current.index)) continue;
      visited.add(current.index);
      component.push(current);
      for (const node of [current.a, current.b]) {
        for (const neighbor of node.edges) if (!visited.has(neighbor.index)) stack.push(neighbor);
      }
    }
    const componentNodes = [...new Set(component.flatMap((item) => [item.a, item.b]))];
    const degrees = componentNodes.map((item) => item.edges.filter((candidate) => component.includes(candidate)).length);
    components.push({
      edgeCount: component.length,
      entityTypes: [...new Set(component.map((item) => item.edge.entityType))],
      layers: [...new Set(component.map((item) => item.edge.layer))],
      points: componentNodes.map((item) => item.point),
      segments: component.map((item) => item.edge.points),
      nodeCount: componentNodes.length,
      closedCycle: degrees.length > 0 && degrees.every((degree) => degree === 2),
      endpointCount: degrees.filter((degree) => degree === 1).length,
      branchNodeCount: degrees.filter((degree) => degree > 2).length,
      degreeCounts: Object.fromEntries([...new Set(degrees)].sort().map((degree) => [degree, degrees.filter((item) => item === degree).length])),
    });
  }
  return components;
}

const sourceBytes = await readFile(sourcePath);
const outputBytes = await readFile(outputPath);
const sourceDxf = readDxf(sourceBytes);
const outputDxf = readDxf(outputBytes);
const sourceEntities = sourceDxf.sections.find((item) => item.name === "ENTITIES")?.entities ?? [];
const sourceContours = [];
for (let i = 0; i < sourceEntities.length; i += 1) {
  const parsed = entityGeometry(sourceEntities[i], sourceEntities.slice(i + 1), sourceDxf.value);
  if (parsed?.closed) sourceContours.push({ ordinal: sourceContours.length, ...parsed });
}
assert.equal(sourceContours.length, 18, "source must contain nine CUT/SEW contour pairs");
assert.ok(sourceContours.every((item, index) => item.layer === (index % 2 === 0 ? "CUT" : "SEW")));

const inserts = [];
for (const entity of outputDxf.sections.find((item) => item.name === "ENTITIES")?.entities ?? []) {
  if (entity[0]?.[1] !== "INSERT") continue;
  inserts.push({
    block: outputDxf.value(entity, 2),
    x: Number(outputDxf.value(entity, 10) ?? 0),
    y: Number(outputDxf.value(entity, 20) ?? 0),
    scaleX: Number(outputDxf.value(entity, 41) ?? 1),
    scaleY: Number(outputDxf.value(entity, 42) ?? 1),
    rotationDegrees: Number(outputDxf.value(entity, 50) ?? 0),
    layer: outputDxf.value(entity, 8) ?? "(none)",
  });
}
const insertByBlock = new Map(inserts.map((item) => [item.block, item]));
const outputByBlock = new Map();
for (const [blockName, item] of outputDxf.blocks) {
  const insert = insertByBlock.get(blockName) ?? {
    block: blockName, x: 0, y: 0, scaleX: 1, scaleY: 1, rotationDegrees: 0, layer: "(no INSERT)",
  };
  const geometry = [];
  for (let i = 0; i < item.entities.length; i += 1) {
    const parsed = entityGeometry(item.entities[i], item.entities.slice(i + 1), outputDxf.value);
    if (!parsed) continue;
    parsed.points = parsed.points.map((point) => transformPoint(point, insert, item.base));
    geometry.push(parsed);
  }
  outputByBlock.set(blockName, { block: blockName, insert, geometry });
}

const entityInventory = [];
for (const block of outputByBlock.values()) {
  const counts = {};
  for (const entity of block.geometry) {
    const key = entity.type + "/layer-" + entity.layer + (entity.closed ? "/closed" : "/open");
    counts[key] = (counts[key] ?? 0) + 1;
  }
  entityInventory.push({ block: block.block, insert: block.insert, counts });
}
const modelEntities = outputDxf.sections.find((item) => item.name === "ENTITIES")?.entities ?? [];
const modelGeometry = modelEntities
  .map((entity, index) => entityGeometry(entity, modelEntities.slice(index + 1), outputDxf.value))
  .filter(Boolean);

function candidatesFor(blockData) {
  const candidates = [];
  for (const entity of blockData.geometry) {
    if (!["LINE", "POLYLINE", "LWPOLYLINE"].includes(entity.type) || entity.points.length < 2) continue;
    candidates.push({
      kind: entity.type + (entity.closed ? "-closed" : "-open"),
      layer: entity.layer,
      segments: segmentsFor(entity.points, entity.closed),
      vertexCount: entity.points.length,
      closed: entity.closed,
      sourceEntityCount: 1,
    });
  }
  const openGroups = new Map();
  const allPathEdges = [];
  for (const entity of blockData.geometry.filter((item) => ["LINE", "POLYLINE", "LWPOLYLINE"].includes(item.type) && item.points.length >= 2)) {
    const segments = segmentsFor(entity.points, entity.closed);
    allPathEdges.push(...segments.map((points) => ({ points, entityType: entity.type, layer: entity.layer })));
    if (!entity.closed) {
      if (!openGroups.has(entity.layer)) openGroups.set(entity.layer, []);
      openGroups.get(entity.layer).push(...segments.map((points) => ({ points, entityType: entity.type, layer: entity.layer })));
    }
  }
  for (const [layer, edges] of [...openGroups, ["(all-open-layers)", [...openGroups.values()].flat()]]) {
    for (const [componentIndex, component] of lineComponents(edges).entries()) {
      candidates.push({
        kind: "open-entity-component",
        layer,
        componentIndex,
        segments: component.segments,
        vertexCount: component.nodeCount,
        closed: component.closedCycle,
        sourceEntityCount: component.edgeCount,
        sourceEntityTypes: component.entityTypes,
        topology: {
          nodeCount: component.nodeCount,
          endpointCount: component.endpointCount,
          branchNodeCount: component.branchNodeCount,
          degreeCounts: component.degreeCounts,
        },
      });
    }
  }
  for (const [componentIndex, component] of lineComponents(allPathEdges).entries()) {
    candidates.push({
      kind: "all-entity-network-component",
      layer: "(all-path-layers)",
      componentIndex,
      segments: component.segments,
      vertexCount: component.nodeCount,
      closed: component.closedCycle,
      sourceEntityCount: component.edgeCount,
      sourceEntityTypes: component.entityTypes,
      sourceLayers: component.layers,
      topology: {
        nodeCount: component.nodeCount,
        endpointCount: component.endpointCount,
        branchNodeCount: component.branchNodeCount,
        degreeCounts: component.degreeCounts,
      },
    });
  }
  return candidates;
}

const pieceMaps = [];
for (let pair = 0; pair < 9; pair += 1) {
  const cut = sourceContours[pair * 2];
  const sew = sourceContours[pair * 2 + 1];
  const sewMatches = [];
  for (const block of outputByBlock.values()) {
    const candidates = candidatesFor(block);
    const paths = candidates
      .map((candidate) => ({ ...candidate, residualCm: symmetricPathDistance(sew.points, candidate.segments) }))
      .sort((a, b) => a.residualCm - b.residualCm);
    sewMatches.push({ block: block.block, best: paths[0] ?? null, exactCandidates: paths.filter((item) => item.residualCm <= gateCm).length });
  }
  const exactBlocks = sewMatches.filter((match) => match.best && match.best.residualCm <= gateCm);
  const associatedBlock = exactBlocks.length === 1 ? exactBlocks[0].block : null;
  const targetBlocks = [...outputByBlock.values()];
  const associatedGeometry = associatedBlock ? outputByBlock.get(associatedBlock).geometry : [];
  const outputPointMarkers = associatedGeometry.filter((item) => item.type === "POINT").flatMap((item) => item.points);
  const pointVertexMatches = cut.points.filter((point) => nearestPointDistance(point, outputPointMarkers) <= gateCm).length;
  const cutMatches = [];
  for (const block of targetBlocks) {
    const candidates = candidatesFor(block);
    const paths = candidates
      .map((candidate) => ({ ...candidate, residualCm: symmetricPathDistance(cut.points, candidate.segments) }))
      .sort((a, b) => a.residualCm - b.residualCm);
    const bestByKind = Object.fromEntries([...new Set(paths.map(({ kind }) => kind))].map((kind) => [
      kind,
      paths.filter((candidate) => candidate.kind === kind).sort((a, b) => a.residualCm - b.residualCm)[0],
    ]));
    cutMatches.push({
      block: block.block,
      association: block.block === associatedBlock ? "paired-exact-SEW" : "other-block",
      best: paths[0] ?? null,
      candidateCount: candidates.length,
      bestByKind,
      withinGate: paths.filter((item) => item.residualCm <= gateCm),
    });
  }
  pieceMaps.push({
    pair,
    sourceCut: { ordinal: cut.ordinal, layer: cut.layer, vertexCount: cut.points.length },
    sourceSew: { ordinal: sew.ordinal, layer: sew.layer, vertexCount: sew.points.length },
    association: {
      exactSewMatchingBlocks: exactBlocks.map((item) => item.block),
      selectedBlockByUniqueExactSewMatch: associatedBlock,
    },
    pointMarkerAudit: {
      pairedSewBlock: associatedBlock,
      sourceCutVertexCount: cut.points.length,
      outputPointEntityCount: outputPointMarkers.length,
      sourceVerticesWithPointWithinGate: pointVertexMatches,
      note: "POINT entities are isolated markers; they do not define ordered contour segments or closure.",
    },
    cutOutputCandidates: cutMatches,
  });
}

const sections = outputDxf.sections.map((item) => ({
  name: item.name,
  entityCounts: item.entities.reduce((counts, entity) => {
    const type = entity[0]?.[1] ?? "(unknown)";
    counts[type] = (counts[type] ?? 0) + 1;
    return counts;
  }, {}),
}));
const report = {
  source: { path: sourcePath, bytes: sourceBytes.length, sha256: hash(sourceBytes), contourCount: sourceContours.length },
  output: { path: outputPath, bytes: outputBytes.length, sha256: hash(outputBytes), sections },
  method: {
    gateCm,
    endpointSnapCm,
    sourcePairRule: "source ENTITIES closed contours alternate CUT then SEW; SEW geometry must identify exactly one output block to associate that pair",
    outputPathForms: "closed/open POLYLINE and LWPOLYLINE, direct LINE, connected open-entity components grouped by layer and across all open layers, and connected networks of all path-bearing entities across layers; POINT entities separately audited as isolated markers",
    distance: "symmetric source-vertex-to-output-segment and output-segment-endpoint-to-source-segment distance in cm",
    layerSemantics: "reported literally; numeric output layer IDs are not assigned CUT or SEW meaning",
    insertTransformsApplied: true,
    nonZeroBulgeValues: outputDxf.sections.flatMap((section) => section.entities).flatMap((entity) => entity.filter(([code]) => code === 42).map(([, raw]) => Number(raw))).filter((bulge) => bulge !== 0).length,
    curvedPathEntityTypes: Object.fromEntries(["ARC", "CIRCLE", "ELLIPSE", "SPLINE"].map((type) => [type, outputDxf.sections.flatMap((section) => section.entities).filter((entity) => entity[0]?.[1] === type).length])),
  },
  inserts,
  entityInventory,
  modelSpaceGeometry: modelGeometry.map((entity) => ({ type: entity.type, layer: entity.layer, closed: entity.closed, vertexCount: entity.points.length })),
  pieceMaps,
  summary: {
    sourceCuts: pieceMaps.length,
    piecesWithUniqueExactSewBlockAssociation: pieceMaps.filter((item) => item.association.selectedBlockByUniqueExactSewMatch !== null).length,
    cutsWithUniqueWithinGateOutputPathAnywhere: pieceMaps.filter((item) => item.cutOutputCandidates.flatMap((block) => block.withinGate).length === 1).length,
    cutsWithNoWithinGatePathAnywhere: pieceMaps.filter((item) => item.cutOutputCandidates.every((block) => block.withinGate.length === 0)).length,
    cutContoursWithAllVerticesAlsoPresentAsPairedBlockPoints: pieceMaps.filter((item) => item.pointMarkerAudit.sourceVertexCount === item.pointMarkerAudit.sourceVerticesWithPointWithinGate).length,
    piecesWithAmbiguousSewBlockAssociation: pieceMaps.filter((item) => item.association.exactSewMatchingBlocks.length !== 1).length,
  },
};
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ reportPath, outputSha256: report.output.sha256, summary: report.summary, blocks: entityInventory }, null, 2));
