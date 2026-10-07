import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
const { JSDOM } = createRequire(import.meta.url)("jsdom");
const matrix = JSON.parse(await readFile(new URL("./local-y-candidate-rendered/matrix.json", import.meta.url), "utf8"));
function segments(d) {
  const tokens = d.match(/[MLCZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g) ?? [];
  const out = []; let i=0, cmd="", cur=null, start=null;
  while(i<tokens.length) { const t=tokens[i++];
    if (/^[MLCZ]$/.test(t)) { cmd=t; if(cmd==="Z"&&cur&&start){out.push({a:cur,b:start});cur=start;} continue; }
    const p={x:+t,y:+tokens[i++]};
    if(cmd==="M"){cur=p;start=p;cmd="L";}
    else if(cmd==="L"){out.push({a:cur,b:p});cur=p;}
    else if(cmd==="C"){const c1=p,c2={x:+tokens[i++],y:+tokens[i++]},end={x:+tokens[i++],y:+tokens[i++]},s=cur;let prev=s;for(let k=1;k<=32;k++){const t=k/32,u=1-t,q={x:u**3*s.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t**3*end.x,y:u**3*s.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t**3*end.y};out.push({a:prev,b:q});prev=q;}cur=end;}
    else throw new Error("unsupported SVG command "+cmd);
  } return out;
}
function proper(a,b){const rx=a.b.x-a.a.x,ry=a.b.y-a.a.y,sx=b.b.x-b.a.x,sy=b.b.y-b.a.y,D=rx*sy-ry*sx;if(Math.abs(D)<1e-10)return;const qx=b.a.x-a.a.x,qy=b.a.y-a.a.y,t=(qx*sy-qy*sx)/D,u=(qx*ry-qy*rx)/D;return t>1e-7&&t<1-1e-7&&u>1e-7&&u<1-1e-7?{x:a.a.x+t*rx,y:a.a.y+t*ry}:undefined;}
function crosses(a,b){const xs=[];for(const x of a)for(const y of b){const p=proper(x,y);if(p)xs.push(p);}return xs;}
const rows=[];
for(const row of matrix.cases){const face=row.faces.find(f=>f.kind==="BACK_FLAT"),doc=new JSDOM(face.svg,{contentType:"image/svg+xml"}).window.document,sleeves=[...doc.querySelectorAll('path[data-entity-id*="component:sleeve:outline"]')];assert.equal(sleeves.length,2,row.caseId);const ss=sleeves.map(x=>segments(x.getAttribute("d"))),pair=crosses(ss[0],ss[1]),bodies=[...doc.querySelectorAll('path[data-entity-id*="component:back:outline"], path[data-entity-id*="component:yoke:outline"]')].filter(x=>!x.getAttribute("data-entity-id").includes("fold-reflection")),perBody=bodies.map(body=>({id:body.getAttribute("data-entity-id"),sleeveCrossings:ss.map(s=>crosses(s,segments(body.getAttribute("d"))).length)})),vb=face.svg.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number),all=sleeves.flatMap(x=>segments(x.getAttribute("d")).flatMap(s=>[s.a,s.b])),frame=!!vb&&all.every(p=>p.x>=vb[0]-1e-4&&p.x<=vb[0]+vb[2]+1e-4&&p.y>=vb[1]-1e-4&&p.y<=vb[1]+vb[3]+1e-4);rows.push({caseId:row.caseId,pairCrossings:pair.length,pairCoordinates:pair,perBody,frame});}
const output={revision:matrix.summary.sourceRevision,options:rows.length,method:"32-segment cubic tessellation from actual Chromium SVG; proper finite-segment crossings excluding endpoints",pairCrossingHistogram:Object.fromEntries([...new Set(rows.map(r=>r.pairCrossings))].map(n=>[String(n),rows.filter(r=>r.pairCrossings===n).length])),rows};
await writeFile(new URL("./local-y-candidate-crossings.json",import.meta.url),JSON.stringify(output,null,2)+"\n");
console.log(JSON.stringify({revision:output.revision,options:output.options,pairCrossingHistogram:output.pairCrossingHistogram,bodyCrossingOptions:rows.filter(r=>r.perBody.some(b=>b.sleeveCrossings.some(n=>n>0))).map(r=>({caseId:r.caseId,perBody:r.perBody})),frameFailures:rows.filter(r=>!r.frame).map(r=>r.caseId)},null,2));
assert.equal(rows.length,28);