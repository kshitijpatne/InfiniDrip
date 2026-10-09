import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S590-polo-cut-corner-curve-trial";
const inputPath = "C:/G04-CLO-DXF-Exchange/S536-polo-aama-vertex-preservation/Input/polo-standard-m-lwpolyline-r2000.dxf";
const outputPath = `${root}/Input/polo-standard-m-fillet-r005cm.dxf`;
const reportPath = `${root}/Evidence/fillet-preflight.json`;
const expectedHash = "9062b0d6442354165c5640ef3ca98b717aaef6f4339eac1de99255d7d1750fa2";
const radius = 0.05;
const threshold = 0.001;
const targeted = new Map([[2, 13], [10, 14], [12, 14], [14, 14], [16, 14]]);
const sha = (b) => createHash("sha256").update(b).digest("hex");
const fmt = (n) => Number(n.toFixed(9)).toString();

function pairsFromText(text) {
  const lines = text.trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, "DXF has incomplete group pair");
  return Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[2 * i].trim()), lines[2 * i + 1]]);
}
function findEntities(pairs, sectionName) {
  const sections = [];
  for (let i = 0; i < pairs.length - 1; i++) {
    if (pairs[i][0] !== 0 || pairs[i][1] !== "SECTION") continue;
    const name = pairs[i + 1][1];
    let j = i + 2;
    while (j < pairs.length && !(pairs[j][0] === 0 && pairs[j][1] === "ENDSEC")) j++;
    if (name === sectionName) {
      const entities = [];
      let current;
      for (const pair of pairs.slice(i + 2, j)) {
        if (pair[0] === 0) {
          if (current) entities.push(current);
          current = [pair];
        } else if (current) current.push(pair);
      }
      if (current) entities.push(current);
      return { start: i + 2, end: j, entities };
    }
    sections.push({ start: i, end: j });
    i = j;
  }
  throw new Error(`Missing ${sectionName} section`);
}
const field = (entity, code) => entity.find(([c]) => c === code)?.[1];
function vertexGroups(entity) {
  const first = entity.findIndex(([code]) => code === 10);
  assert(first > 0, "LWPOLYLINE missing vertices");
  const head = entity.slice(0, first);
  const vertices = [];
  for (let i = first; i < entity.length;) {
    assert.equal(entity[i][0], 10);
    const v = [entity[i++]];
    while (i < entity.length && entity[i][0] !== 10) v.push(entity[i++]);
    vertices.push(v);
  }
  return { head, vertices };
}
function vertex(v) {
  return { x: Number(field(v, 10)), y: Number(field(v, 20)), bulge: Number(field(v, 42) ?? 0) };
}
function replaceField(entity, code, value) {
  const i = entity.findIndex(([c]) => c === code);
  assert(i >= 0, `missing header field ${code}`);
  entity[i][1] = String(value);
}
function makeVertex(p, bulge) {
  const v = [[10, fmt(p.x)], [20, fmt(p.y)]];
  if (Math.abs(bulge) > 1e-12) v.push([42, fmt(bulge)]);
  return v;
}
function fillet(vertices, index) {
  const prev = vertices[(index - 1 + vertices.length) % vertices.length];
  const corner = vertices[index];
  const next = vertices[(index + 1) % vertices.length];
  const inV = { x: corner.x - prev.x, y: corner.y - prev.y };
  const outV = { x: next.x - corner.x, y: next.y - corner.y };
  const lin = Math.hypot(inV.x, inV.y), lout = Math.hypot(outV.x, outV.y);
  const ux = inV.x / lin, uy = inV.y / lin, vx = outV.x / lout, vy = outV.y / lout;
  const cross = ux * vy - uy * vx, dot = ux * vx + uy * vy;
  const turn = Math.atan2(cross, dot);
  assert(Math.abs(turn) > 1e-5 && Math.abs(turn) < Math.PI / 2, "unsupported corner turn");
  const tangent = radius * Math.tan(Math.abs(turn) / 2);
  assert(tangent < lin && tangent < lout, "fillet tangent exceeds adjacent edge");
  const p1 = { x: corner.x - ux * tangent, y: corner.y - uy * tangent };
  const p2 = { x: corner.x + vx * tangent, y: corner.y + vy * tangent };
  const bulge = Math.tan(turn / 4);
  return { p1, p2, bulge, turn, incoming: lin, outgoing: lout, tangent };
}

const sourceBytes = await readFile(inputPath);
assert.equal(sha(sourceBytes), expectedHash, "S536 source hash changed");
const pairs = pairsFromText(sourceBytes.toString("utf8"));
const section = findEntities(pairs, "ENTITIES");
const polys=section.entities.filter(e=>e[0]?.[1]==="LWPOLYLINE");
assert.equal(polys.length,18);
assert.equal(polys.filter(e=>field(e,8)==="CUT").length,9);
assert.equal(polys.filter(e=>field(e,8)==="SEW").length,9);
const originals=polys.map(e=>vertexGroups(e).vertices.map(vertex));
const changes=[];
for(const [ordinal,index] of targeted){
  const entity=polys[ordinal];
  assert.equal(field(entity,8),"CUT",`ordinal ${ordinal} is not CUT`);
  const {head,vertices:groups}=vertexGroups(entity);
  const verts=groups.map(vertex);
  const f=fillet(verts,index);
  const mapped=originals[ordinal];
  assert(Number.isFinite(f.incoming) && Number.isFinite(f.outgoing));
  const newGroups=[];
  for(let i=0;i<groups.length;i++){
    if(i===index){newGroups.push(makeVertex(f.p1,f.bulge),makeVertex(f.p2,0));}
    else newGroups.push(groups[i]);
  }
  const rebuilt=[...head,...newGroups.flat()];
  replaceField(rebuilt,90,newGroups.length);
  const expectedDelta=radius*(1/Math.cos(Math.abs(f.turn)/2)-1);
  const decimalRoundingAllowance=0.00000001;
  changes.push({sourceOrdinal:ordinal,piece:["front","back","sleeve","button placket","buttonhole placket","outer collar stand","inner collar stand","upper pointed collar","under pointed collar"][ordinal/2],vertexIndex:index,inputVertices:verts.length,outputVertices:newGroups.length,radiusCm:radius,turnDegrees:f.turn*180/Math.PI,incomingCm:f.incoming,outgoingCm:f.outgoing,tangentCm:f.tangent,bulge:f.bulge,symmetricHausdorffBoundCm:expectedDelta,coordinateSerializationAllowanceCm:decimalRoundingAllowance,passes:expectedDelta+decimalRoundingAllowance<=threshold});
  polys[ordinal]=rebuilt;
}
assert(changes.every(c=>c.passes),"one or more fillets exceed the 0.001 cm geometry gate");
assert.equal(polys.length,18);
const entityIter=polys.values();
const newEntities=section.entities.map(e=>e[0]?.[1]==="LWPOLYLINE"?entityIter.next().value:e);
const originalPolys=section.entities.filter(e=>e[0]?.[1]==="LWPOLYLINE");
for(let i=0;i<originalPolys.length;i++) if(!targeted.has(i)) assert.deepEqual(newEntities.filter(e=>e[0]?.[1]==="LWPOLYLINE")[i],originalPolys[i],`unmodified contour ${i} changed`);
const outPairs=[...pairs.slice(0,section.start),...newEntities.flat(),...pairs.slice(section.end)];
const outputText=outPairs.map(([code,value])=>`${code}\r\n${value}`).join("\r\n")+"\r\n";
await mkdir(`${root}/Input`,{recursive:true}); await mkdir(`${root}/Evidence`,{recursive:true});
const outputBytes=Buffer.from(outputText,"utf8"); await writeFile(outputPath,outputBytes);
const report={title:"S590 fillet derivative preflight",source:{path:inputPath,sha256:sha(sourceBytes),bytes:sourceBytes.length},variant:{path:outputPath,sha256:sha(outputBytes),bytes:outputBytes.length,format:"R2000 LWPOLYLINE; only five CUT vertices replaced by 0.05 cm tangent arcs; original cut pattern source untouched"},criteria:{thresholdCm:threshold,filletRadiusCm:radius,hausdorffFormulaCm:"r * (sec(abs(turn)/2) - 1)",decimalRoundingAllowanceCm:0.00000001,allUnchangedContoursExact:true,entitiesBefore:18,entitiesAfter:18},changes};
await writeFile(reportPath,`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify({source:report.source,variant:report.variant,changes:report.changes},null,2));
