import { readFile, writeFile } from "node:fs/promises";
const files = {
  source: "C:/G04-CAD-Interchange/S683-current-package-clo-roundtrip/polo-default-M.dxf",
  returned: "C:/G04-CAD-Interchange/S689-clo-millimeter-input-test/Output/polo-default-M-mm-clo-standard-return.dxf",
};
const summary = (entities) => {
  const counts = {}, layers = {};
  for (const entity of entities) {
    counts[entity.type] = (counts[entity.type] ?? 0) + 1;
    layers[entity.layer] = (layers[entity.layer] ?? 0) + 1;
  }
  return { counts, layers };
};
const parse = async (path) => {
  const lines = (await readFile(path, "utf8")).replace(/\r\n/g, "\n").split("\n");
  if (lines.at(-1) === "") lines.pop();
  if (lines.length % 2) throw new Error(`${path}: incomplete DXF group-code pair`);
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) pairs.push([Number(lines[i]), lines[i + 1]]);
  const sections = new Map(), blocks = new Map();
  let section = "", currentBlock = null;
  for (let i = 0; i < pairs.length;) {
    const [code, value] = pairs[i];
    if (code === 0 && value === "SECTION" && pairs[i + 1]?.[0] === 2) {
      section = pairs[i + 1][1]; sections.set(section, []); i += 2; continue;
    }
    if (code === 0 && value === "ENDSEC") { section = ""; currentBlock = null; i += 1; continue; }
    if (section === "BLOCKS" && code === 0 && value === "BLOCK") {
      let end = i + 1; while (end < pairs.length && pairs[end][0] !== 0) end += 1;
      const name = pairs.slice(i + 1, end).find(([c]) => c === 2)?.[1];
      if (!name || blocks.has(name)) throw new Error(`${path}: missing/duplicate block name`);
      currentBlock = { name, entities: [] }; blocks.set(name, currentBlock); i = end; continue;
    }
    if (section === "BLOCKS" && code === 0 && value === "ENDBLK") { currentBlock = null; i += 1; continue; }
    if (code !== 0 || ["SEQEND", "EOF", "ENDSEC"].includes(value)) { i += 1; continue; }
    const type = value; let end = i + 1;
    while (end < pairs.length && pairs[end][0] !== 0) end += 1;
    const fields = pairs.slice(i + 1, end);
    const entity = { type, layer: fields.find(([c]) => c === 8)?.[1] ?? "(missing)", fields };
    const destination = currentBlock?.entities ?? sections.get(section);
    destination?.push(entity);
    if (type === "POLYLINE") {
      i = end;
      while (pairs[i]?.[0] === 0 && pairs[i][1] === "VERTEX") {
        let stop = i + 1; while (stop < pairs.length && pairs[stop][0] !== 0) stop += 1;
        const vertexFields = pairs.slice(i + 1, stop);
        destination?.push({ type: "VERTEX", layer: vertexFields.find(([c]) => c === 8)?.[1] ?? entity.layer, fields: vertexFields });
        i = stop;
      }
      if (pairs[i]?.[0] === 0 && pairs[i][1] === "SEQEND") { destination?.push({ type: "SEQEND", layer: entity.layer, fields: [] }); i += 1; }
    } else i = end;
  }
  const entityRecords = sections.get("ENTITIES") ?? [];
  const blockEntities = [...blocks.values()].flatMap((block) => block.entities);
  return {
    path,
    topLevelEntities: summary(entityRecords),
    blockCount: blocks.size,
    blockEntities: summary(blockEntities),
    typedMarks: {
      topLevel: entityRecords.filter((e) => ["LINE", "POINT", "CIRCLE"].includes(e.type)).length,
      inBlocks: blockEntities.filter((e) => ["LINE", "POINT", "CIRCLE"].includes(e.type)).length,
    },
    blockNames: [...blocks.keys()],
  };
};
const report = { source: await parse(files.source), returned: await parse(files.returned) };
const path = "C:/G04-CAD-Interchange/S689-clo-millimeter-input-test/Evidence/S689-entity-inventory.json";
await writeFile(path, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
