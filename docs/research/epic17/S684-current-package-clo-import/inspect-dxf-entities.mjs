import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const [sourcePath, receivedPath] = process.argv.slice(2);
if (!sourcePath || !receivedPath) throw new Error("usage: node inspect-dxf-entities.mjs <source.dxf> <received.dxf>");

async function inspect(path) {
  const bytes = await readFile(path);
  const text = bytes.toString("utf8");
  const lines = text.split(/\r?\n/);
  if (lines.length % 2 === 0 && lines.at(-1) === "") lines.pop();
  const pairs = [];
  for (let i = 0; i + 1 < lines.length; i += 2) pairs.push([Number(lines[i].trim()), lines[i + 1].trim()]);

  const valueOf = (fields, code) => fields.find((pair) => pair[0] === code)?.[1] ?? null;
  const numericOf = (fields, code, fallback = 0) => {
    const raw = valueOf(fields, code);
    if (raw == null || raw === "") return fallback;
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  };
  const makeEntity = (type, fields) => ({ type, fields, layer: valueOf(fields, 8) ?? "(missing)" });
  const parseEntitySequence = (items, start) => {
    const entities = [];
    let i = start;
    while (i < items.length) {
      if (items[i][0] !== 0 || items[i][1] === "ENDSEC" || items[i][1] === "ENDBLK") break;
      const type = items[i][1];
      let j = i + 1;
      while (j < items.length && items[j][0] !== 0) j += 1;
      const fields = items.slice(i + 1, j);
      const entity = makeEntity(type, fields);
      i = j;
      if (type === "POLYLINE") {
        entity.vertices = [];
        while (i < items.length && items[i][0] === 0 && items[i][1] === "VERTEX") {
          let k = i + 1;
          while (k < items.length && items[k][0] !== 0) k += 1;
          const vertex = items.slice(i + 1, k);
          entity.vertices.push({ x: numericOf(vertex, 10), y: numericOf(vertex, 20) });
          i = k;
        }
        if (items[i]?.[0] === 0 && items[i]?.[1] === "SEQEND") {
          i += 1;
          while (i < items.length && items[i][0] !== 0) i += 1;
        }
      } else if (type === "LWPOLYLINE") {
        entity.vertices = [];
        for (let k = 0; k < fields.length; k += 1) {
          if (fields[k][0] === 10 && fields[k + 1]?.[0] === 20) {
            entity.vertices.push({ x: Number(fields[k][1]), y: Number(fields[k + 1][1]) });
          }
        }
      }
      entities.push(entity);
    }
    return { entities, nextIndex: i };
  };

  let section = "";
  let entities = [];
  const blocks = [];
  for (let i = 0; i < pairs.length; i += 1) {
    const [code, value] = pairs[i];
    if (code === 0 && value === "SECTION" && pairs[i + 1]?.[0] === 2) {
      section = pairs[i + 1][1];
      i += 1;
      if (section === "ENTITIES") {
        const parsed = parseEntitySequence(pairs, i + 1);
        entities.push(...parsed.entities);
        i = parsed.nextIndex - 1;
      } else if (section === "BLOCKS") {
        i += 1;
        while (i < pairs.length && !(pairs[i][0] === 0 && pairs[i][1] === "ENDSEC")) {
          if (pairs[i][0] !== 0 || pairs[i][1] !== "BLOCK") { i += 1; continue; }
          let headerEnd = i + 1;
          while (headerEnd < pairs.length && pairs[headerEnd][0] !== 0) headerEnd += 1;
          const header = pairs.slice(i + 1, headerEnd);
          const block = { name: valueOf(header, 2) ?? "", layer: valueOf(header, 8) ?? "", entities: [] };
          let bodyStart = headerEnd;
          while (bodyStart < pairs.length && !(pairs[bodyStart][0] === 0 && pairs[bodyStart][1] === "ENDBLK")) {
            const parsed = parseEntitySequence(pairs, bodyStart);
            block.entities.push(...parsed.entities);
            if (parsed.nextIndex <= bodyStart) break;
            bodyStart = parsed.nextIndex;
          }
          blocks.push(block);
          i = bodyStart;
          while (i < pairs.length && pairs[i][0] !== 0) i += 1;
        }
      }
    }
  }

  const count = (items, key) => Object.fromEntries([...items.reduce((map, item) => {
    const value = item[key] ?? "(missing)";
    map.set(value, (map.get(value) ?? 0) + 1);
    return map;
  }, new Map())].sort(([a], [b]) => a.localeCompare(b)));
  const allEntities = [...entities, ...blocks.flatMap((block) => block.entities)];
  const coordinates = [];
  for (const entity of allEntities) {
    if (entity.vertices) for (const point of entity.vertices) coordinates.push({ axis: "x", value: point.x }, { axis: "y", value: point.y });
    for (const [code, value] of entity.fields) {
      const n = Number(value);
      if (!Number.isFinite(n)) continue;
      if (code === 10 || code === 11 || code === 12 || code === 13) coordinates.push({ axis: "x", value: n });
      if (code === 20 || code === 21 || code === 22 || code === 23) coordinates.push({ axis: "y", value: n });
    }
  }
  const axisBounds = (axis) => {
    const values = coordinates.filter((point) => point.axis === axis).map((point) => point.value);
    return values.length ? { min: Math.min(...values), max: Math.max(...values), span: Math.max(...values) - Math.min(...values) } : null;
  };
  const unitsIndex = pairs.findIndex(([code, value]) => code === 9 && value === "$INSUNITS");
  const units = unitsIndex >= 0 && pairs[unitsIndex + 1]?.[0] === 70 ? pairs[unitsIndex + 1][1] : null;
  const layerNames = new Map();
  for (let i = 0; i < pairs.length; i += 1) {
    if (pairs[i][0] !== 0 || pairs[i][1] !== "LAYER") continue;
    let end = i + 1;
    while (end < pairs.length && pairs[end][0] !== 0) end += 1;
    const fields = pairs.slice(i + 1, end);
    const handle = valueOf(fields, 5);
    const name = valueOf(fields, 2);
    if (handle && name) layerNames.set(handle, name);
    i = end - 1;
  }
  const polylines = allEntities.filter((entity) => ["POLYLINE", "LWPOLYLINE"].includes(entity.type));

  return {
    path,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    acadver: (() => { const i = pairs.findIndex(([code, value]) => code === 9 && value === "$ACADVER"); return i >= 0 ? pairs[i + 1]?.[1] ?? null : null; })(),
    insunits: units,
    layerTable: Object.fromEntries(layerNames),
    entityCount: allEntities.length,
    topLevelEntityCount: entities.length,
    entityTypes: count(allEntities.map((entity) => ({ type: entity.type })), "type"),
    layers: count(allEntities.map((entity) => ({ layer: entity.layer })), "layer"),
    polylineCount: polylines.length,
    closedPolylines: polylines.filter((entity) => {
      const flag = entity.fields.find((pair) => pair[0] === 70)?.[1];
      return flag != null && (Number(flag) & 1) === 1;
    }).length,
    blocks: blocks.map((block) => ({
      name: block.name,
      layer: block.layer,
      entityCount: block.entities.length,
      entityTypes: count(block.entities.map((entity) => ({ type: entity.type })), "type"),
      layers: count(block.entities.map((entity) => ({ layer: entity.layer })), "layer"),
      polylines: block.entities.filter((entity) => entity.vertices).map((entity) => ({
        layer: entity.layer,
        closed: entity.fields.some(([code, value]) => code === 70 && (Number(value) & 1) === 1),
        vertices: entity.vertices,
      })),
    })),
    bounds: { x: axisBounds("x"), y: axisBounds("y") },
    entities: allEntities.map((entity) => ({
      type: entity.type,
      layer: entity.layer,
      handle: valueOf(entity.fields, 5),
      blockName: entity.type === "INSERT" ? valueOf(entity.fields, 2) : null,
      insert: entity.type === "INSERT" ? {
        x: numericOf(entity.fields, 10), y: numericOf(entity.fields, 20),
        scaleX: numericOf(entity.fields, 41, 1), scaleY: numericOf(entity.fields, 42, 1),
        rotation: numericOf(entity.fields, 50),
      } : undefined,
      vertices: entity.vertices,
    })),
  };
}

const result = { source: await inspect(sourcePath), receiver: await inspect(receivedPath) };
console.log(JSON.stringify(result, null, 2));
