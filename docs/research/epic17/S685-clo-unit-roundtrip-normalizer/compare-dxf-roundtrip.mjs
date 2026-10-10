import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const [sourcePath, receiverPath, manifestPath, reportPath] = process.argv.slice(2);
if (![sourcePath, receiverPath, manifestPath, reportPath].every(Boolean)) {
  throw new Error("usage: node compare-dxf-roundtrip.mjs <source.dxf> <receiver.dxf> <manifest.json> <report.json>");
}

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readDrawing = async (path) => {
  const bytes = await readFile(path);
  const lines = bytes.toString("utf8").split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();
  if (lines.length % 2) throw new Error(`${path}: incomplete group-code pair`);
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    const code = Number(lines[i]);
    if (!Number.isInteger(code)) throw new Error(`${path}: invalid group code at line ${i + 1}`);
    pairs.push([code, lines[i + 1]]);
  }
  const sections = new Map();
  const blocks = new Map();
  let section = "";
  let block = null;
  for (let i = 0; i < pairs.length;) {
    const [code, value] = pairs[i];
    if (code === 0 && value === "SECTION" && pairs[i + 1]?.[0] === 2) {
      section = pairs[i + 1][1];
      sections.set(section, []);
      i += 2;
      continue;
    }
    if (code === 0 && value === "ENDSEC") { section = ""; block = null; i += 1; continue; }
    if (section === "BLOCKS" && code === 0 && value === "BLOCK") {
      let end = i + 1;
      while (end < pairs.length && pairs[end][0] !== 0) end += 1;
      const fields = pairs.slice(i + 1, end);
      const name = fields.find(([c]) => c === 2)?.[1];
      if (!name || blocks.has(name)) throw new Error(`${path}: missing or duplicate block name`);
      block = { name, entities: [] };
      blocks.set(name, block);
      i = end;
      continue;
    }
    if (section === "BLOCKS" && code === 0 && value === "ENDBLK") { block = null; i += 1; continue; }
    if (code !== 0 || ["ENDSEC", "EOF", "SEQEND"].includes(value)) { i += 1; continue; }
    const type = value;
    let end = i + 1;
    while (end < pairs.length && pairs[end][0] !== 0) end += 1;
    const fields = pairs.slice(i + 1, end);
    const get = (c) => fields.find(([key]) => key === c)?.[1];
    const num = (c) => Number(get(c));
    const entity = { type, layer: get(8) ?? "(missing)", fields };
    if (type === "POLYLINE") {
      entity.vertices = [];
      entity.closed = (Number(get(70) ?? 0) & 1) === 1;
      i = end;
      while (pairs[i]?.[0] === 0 && pairs[i][1] === "VERTEX") {
        let vertexEnd = i + 1;
        while (vertexEnd < pairs.length && pairs[vertexEnd][0] !== 0) vertexEnd += 1;
        const vertexFields = pairs.slice(i + 1, vertexEnd);
        entity.vertices.push({ x: Number(vertexFields.find(([c]) => c === 10)?.[1]), y: Number(vertexFields.find(([c]) => c === 20)?.[1]), bulge: Number(vertexFields.find(([c]) => c === 42)?.[1] ?? 0) });
        i = vertexEnd;
      }
      if (pairs[i]?.[0] === 0 && pairs[i][1] === "SEQEND") i += 1;
    } else if (type === "LWPOLYLINE") {
      entity.vertices = [];
      for (let k = 0; k < fields.length; k += 1) {
        if (fields[k][0] === 10 && fields[k + 1]?.[0] === 20) entity.vertices.push({ x: Number(fields[k][1]), y: Number(fields[k + 1][1]), bulge: Number(fields[k + 2]?.[0] === 42 ? fields[k + 2][1] : 0) });
      }
      entity.closed = (Number(get(70) ?? 0) & 1) === 1;
      i = end;
    } else {
      if (["LINE", "POINT", "CIRCLE"].includes(type)) {
        entity.start = type === "LINE" ? { x: num(10), y: num(20) } : undefined;
        entity.end = type === "LINE" ? { x: num(11), y: num(21) } : undefined;
        entity.at = ["POINT", "CIRCLE"].includes(type) ? { x: num(10), y: num(20) } : undefined;
        entity.radius = type === "CIRCLE" ? num(40) : undefined;
      }
      i = end;
    }
    if (section && sections.has(section)) sections.get(section).push(entity);
    if (block) block.entities.push(entity);
  }
  return { path, bytes: bytes.length, sha256: hash(bytes), sections, blocks };
};

const source = await readDrawing(sourcePath);
const receiver = await readDrawing(receiverPath);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const tolerance = 0.001;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const segDist = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const den = dx * dx + dy * dy;
  const t = den ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / den)) : 0;
  return dist(p, { x: a.x + dx * t, y: a.y + dy * t });
};
const segments = (path) => {
  const points = path.vertices ?? [];
  const result = [];
  const edgeCount = points.length - 1 + (path.closed && points.length > 2 ? 1 : 0);
  for (let i = 0; i < edgeCount; i += 1) {
    const a = points[i], b = points[(i + 1) % points.length];
    const bulge = a.bulge ?? 0;
    if (Math.abs(bulge) < 1e-12) { result.push([a, b]); continue; }
    const dx = b.x - a.x, dy = b.y - a.y;
    const chord = Math.hypot(dx, dy);
    const theta = 4 * Math.atan(bulge);
    const radius = chord * (1 + bulge * bulge) / (4 * Math.abs(bulge));
    const offset = chord * (1 - bulge * bulge) / (4 * bulge);
    const center = { x: (a.x + b.x) / 2 - dy / chord * offset, y: (a.y + b.y) / 2 + dx / chord * offset };
    const startAngle = Math.atan2(a.y - center.y, a.x - center.x);
    // Chord error stays below the fixed 0.001 cm comparison gate for arcs up
    // to about 20 cm radius; do not compare large bulges with coarse chords.
    const steps = Math.max(8, Math.ceil(Math.abs(theta) / 0.005));
    let prev = a;
    for (let step = 1; step <= steps; step += 1) {
      const angle = startAngle + theta * step / steps;
      const next = step === steps ? b : { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
      result.push([prev, next]);
      prev = next;
    }
  }
  return result;
};
const pointPathDistance = (point, path) => Math.min(...segments(path).map(([a, b]) => segDist(point, a, b)), Infinity);
const pathDistance = (a, b) => Math.max(
  ...a.vertices.map((p) => pointPathDistance(p, b)),
  ...b.vertices.map((p) => pointPathDistance(p, a)),
);
const cutSew = source.sections.get("ENTITIES").filter((e) => e.type === "POLYLINE" && ["CUT", "SEW"].includes(e.layer));
if (cutSew.length !== manifest.pieces.length * 2) throw new Error(`Expected ${manifest.pieces.length * 2} source CUT/SEW paths; found ${cutSew.length}`);
const pieceResults = manifest.pieces.map((piece, index) => {
  const sourceCut = cutSew[index * 2];
  const sourceSew = cutSew[index * 2 + 1];
  const blockName = `${index}_M`;
  const returnedBlock = receiver.blocks.get(blockName);
  if (!returnedBlock) throw new Error(`Missing returned piece block ${blockName}`);
  const returnedPaths = returnedBlock.entities.filter((e) => e.vertices?.length >= 2);
  const best = (target) => returnedPaths.map((path) => ({ layer: path.layer, vertices: path.vertices.length, closed: !!path.closed, maxDistanceCm: pathDistance(target, path) }))
    .sort((a, b) => a.maxDistanceCm - b.maxDistanceCm)[0];
  return {
    id: piece.id,
    blockName,
    sourceCutVertices: sourceCut.vertices.length,
    sourceSewVertices: sourceSew.vertices.length,
    returnedPolylineCount: returnedPaths.length,
    cutBestMatch: best(sourceCut),
    sewBestMatch: best(sourceSew),
  };
});

const sourceMarks = source.sections.get("ENTITIES").filter((e) => ["LINE", "POINT", "CIRCLE"].includes(e.type));
const receiverPathsByBlock = [...receiver.blocks.entries()]
  .filter(([name]) => /^\d+_M$/.test(name))
  .map(([name, block]) => ({ name, paths: block.entities.filter((e) => e.vertices?.length >= 2) }));
const marks = sourceMarks.map((mark, ordinal) => {
  let best = { distanceCm: Infinity, blockName: null, representation: "unmatched" };
  for (const block of receiverPathsByBlock) for (const path of block.paths) {
    if (mark.type === "LINE") for (const [a, b] of segments(path)) {
      const d = Math.min(Math.max(dist(a, mark.start), dist(b, mark.end)), Math.max(dist(a, mark.end), dist(b, mark.start)));
      if (d < best.distanceCm) best = { distanceCm: d, blockName: block.name, representation: "line-segment" };
    }
    if (mark.type === "POINT") for (const [a, b] of segments(path)) {
      const d = segDist(mark.at, a, b);
      if (d < best.distanceCm) best = { distanceCm: d, blockName: block.name, representation: "point-on-path" };
    }
    if (mark.type === "CIRCLE" && path.closed) {
      const xs = path.vertices.map((p) => p.x), ys = path.vertices.map((p) => p.y);
      const center = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
      const radii = path.vertices.map((p) => dist(p, center));
      const radius = radii.reduce((sum, value) => sum + value, 0) / radii.length;
      const centerError = dist(center, mark.at);
      const radialError = Math.abs(radius - mark.radius);
      const d = Math.max(centerError, radialError);
      if (d < best.distanceCm) best = { distanceCm: d, blockName: block.name, representation: "closed-polyline-circle" };
    }
  }
  return {
    sourceEntityOrdinal: ordinal + 1,
    sourceType: mark.type,
    sourceLayer: mark.layer,
    sourceGeometry: mark.type === "LINE" ? { start: mark.start, end: mark.end }
      : mark.type === "CIRCLE" ? { center: mark.at, radius: mark.radius }
        : { at: mark.at },
    status: best.distanceCm <= tolerance ? "geometry-found" : "not-found-within-tolerance",
    ...best,
  };
});
const report = {
  source: { path: source.path, bytes: source.bytes, sha256: source.sha256 },
  receiver: { path: receiver.path, bytes: receiver.bytes, sha256: receiver.sha256 },
  toleranceCm: tolerance,
  method: "Per-piece symmetric sampled-vertex-to-segment distance for source CUT/SEW polylines; source marks are compared to returned piece block geometry. This is geometry evidence only; layer/piece/mark semantic identity and receiver readability are assessed separately.",
  pieceResults,
  cutSewPass: pieceResults.every((piece) => piece.cutBestMatch?.maxDistanceCm <= tolerance && piece.sewBestMatch?.maxDistanceCm <= tolerance),
  markMethod: "Compares source DXF entity geometry (after the source's layout transform) to receiver block paths: endpoint distance for LINEs, point-to-segment distance for POINTs, and center/radius agreement for CIRCLEs. Source construction-mark identity remains unproven because the receiver replaces source layers/names with numeric layers and has no embedded source IDs.",
  markCounts: { expectedDrawingEntities: marks.length, geometryFoundWithinTolerance: marks.filter((mark) => mark.status === "geometry-found").length, missing: marks.filter((mark) => mark.status !== "geometry-found").length },
  unmatchedDrawingEntities: marks.filter((mark) => mark.status !== "geometry-found"),
  layerNames: { source: [...new Set([...source.sections.get("ENTITIES")].map((e) => e.layer))].sort(), returned: [...new Set([...receiver.blocks.values()].flatMap((b) => b.entities.map((e) => e.layer)))].sort() },
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, sourceSha256: source.sha256, receiverSha256: receiver.sha256, cutSewPass: report.cutSewPass, pieces: pieceResults.map(({ id, cutBestMatch, sewBestMatch }) => ({ id, cut: cutBestMatch, sew: sewBestMatch })), markCounts: report.markCounts, unmatchedMarkSamples: report.unmatchedDrawingEntities.slice(0, 12) }, null, 2));
