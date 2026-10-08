import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
const {JSDOM}=createRequire(import.meta.url)("jsdom");
const matrix=JSON.parse(await readFile(new URL("./production-rendered/matrix.json",import.meta.url),"utf8"));
const s370=JSON.parse(await readFile(new URL("../S370-woven-band-detail-feasibility/detached-band-layout-matrix.json",import.meta.url),"utf8"));
function flatten(d,n=32){
 const t=d.match(/[MLCZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[],segs=[],polys=[];let i=0,cmd="",cur=null,start=null,poly=[];
 while(i<t.length){let q=t[i++];if(/^[MLCZ]$/.test(q)){cmd=q;if(q==="Z"&&cur&&start){segs.push({a:cur,b:start});poly.push(start);polys.push(poly);poly=[];cur=start;}continue;}let p={x:+q,y:+t[i++]};
 if(cmd==="M"){cur=p;start=p;poly=[p];cmd="L";}
 else if(cmd==="L"){segs.push({a:cur,b:p});poly.push(p);cur=p;}
 else if(cmd==="C"){let c1=p,c2={x:+t[i++],y:+t[i++]},end={x:+t[i++],y:+t[i++]},s=cur,prev=s;for(let k=1;k<=n;k++){let v=k/n,u=1-v,r={x:u**3*s.x+3*u*u*v*c1.x+3*u*v*v*c2.x+v**3*end.x,y:u**3*s.y+3*u*u*v*c1.y+3*u*v*v*c2.y+v**3*end.y};segs.push({a:prev,b:r});poly.push(r);prev=r;}cur=end;}
 }return {segs,polys};
}
function cross(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
function hit(a,b,c,d){let r={x:b.x-a.x,y:b.y-a.y},s={x:d.x-c.x,y:d.y-c.y},D=r.x*s.y-r.y*s.x;if(Math.abs(D)<1e-10)return;let q={x:c.x-a.x,y:c.y-a.y},t=(q.x*s.y-q.y*s.x)/D,u=(q.x*r.y-q.y*r.x)/D;return {t,u,p:{x:a.x+t*r.x,y:a.y+t*r.y}};}
function proper(a,b){let h=hit(a.a,a.b,b.a,b.b);return h&&h.t>1e-7&&h.t<1-1e-7&&h.u>1e-7&&h.u<1-1e-7?h.p:undefined;}
function allCross(a,b){let out=[];for(const x of a)for(const y of b){let p=proper(x,y);if(p)out.push(p);}return out;}
function pointSeg(p,a,b){let dx=b.x-a.x,dy=b.y-a.y,t=((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1);t=Math.max(0,Math.min(1,t));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
function segDist(a,b){if(proper(a,b))return 0;return Math.min(pointSeg(a.a,b.a,b.b),pointSeg(a.b,b.a,b.b),pointSeg(b.a,a.a,a.b),pointSeg(b.b,a.a,a.b));}
function onEdge(p,a,b){let c=cross(a,b,p);return Math.abs(c)<1e-8&&p.x>=Math.min(a.x,b.x)-1e-8&&p.x<=Math.max(a.x,b.x)+1e-8&&p.y>=Math.min(a.y,b.y)-1e-8&&p.y<=Math.max(a.y,b.y)+1e-8;}
function inside(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let a=poly[j],b=poly[i];if(onEdge(p,a,b))return false;if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
function enters(seg,poly){if(inside(seg.a,poly)||inside(seg.b,poly))return true;let cuts=[0,1],dx=seg.b.x-seg.a.x,dy=seg.b.y-seg.a.y;for(let i=0;i<poly.length;i++){let a=poly[i],b=poly[(i+1)%poly.length],h=hit(seg.a,seg.b,a,b);if(h&&h.t>=-1e-10&&h.t<=1+1e-10&&h.u>=-1e-10&&h.u<=1+1e-10)cuts.push(Math.max(0,Math.min(1,h.t)));}cuts.sort((a,b)=>a-b);let uniq=cuts.filter((v,i)=>!i||Math.abs(v-cuts[i-1])>1e-9);for(let i=1;i<uniq.length;i++){let t=(uniq[i-1]+uniq[i])/2;if(inside({x:seg.a.x+t*dx,y:seg.a.y+t*dy},poly))return true;}return false;}
function crossesRect(seg,r,pad=.05){const x={minX:r.minX-pad,maxX:r.maxX+pad,minY:r.minY-pad,maxY:r.maxY+pad};let lo=0,hi=1,dx=seg.b.x-seg.a.x,dy=seg.b.y-seg.a.y;for(const [p,q] of [[-dx,seg.a.x-x.minX],[dx,x.maxX-seg.a.x],[-dy,seg.a.y-x.minY],[dy,x.maxY-seg.a.y]]){if(Math.abs(p)<1e-12){if(q<0)return false;continue;}let v=q/p;if(p<0)lo=Math.max(lo,v);else hi=Math.min(hi,v);if(lo>hi)return false;}return true;}
const rows=[];
for(const item of matrix.cases){const face=item.faces.find(f=>f.kind==="BACK_FLAT"),doc=new JSDOM(face.svg,{contentType:"image/svg+xml"}).window.document,sleeveNodes=[...doc.querySelectorAll('path[data-entity-id*="component:sleeve:outline"]')],assertNode=assert.equal(sleeveNodes.length,2,item.caseId),sleeves=sleeveNodes.map(node=>flatten(node.getAttribute("d"))),pairCrossings=allCross(sleeves[0].segs,sleeves[1].segs);
 const fills=[...doc.querySelectorAll('path[data-colorway-fill-for="flat:woven-shirt:BACK_FLAT:component:back:outline"],path[data-colorway-fill-for="flat:woven-shirt:BACK_FLAT:component:yoke:outline"]')].map(node=>({id:node.getAttribute("data-colorway-fill-for"),polys:flatten(node.getAttribute("d"),48).polys}));
 const penetrations=[];for(let si=0;si<2;si++)for(const fill of fills)for(const poly of fill.polys)for(let i=0;i<sleeves[si].segs.length;i++)if(enters(sleeves[si].segs[i],poly))penetrations.push({sleeve:si,fill:fill.id,segment:i,line:sleeves[si].segs[i]});
 const detailNodes=[...doc.querySelectorAll('path[data-entity-id*="detached-detail"]')].filter(n=>n.getAttribute("data-entity-id").includes("sleeveBand:outline:detached-detail")),details=detailNodes.map(n=>flatten(n.getAttribute("d"))),bandMinGap=details.length?Math.min(...sleeves.flatMap(s=>s.segs.flatMap(a=>details.flatMap(d=>d.segs.map(b=>segDist(a,b)))))):null;
 const s370row=s370.rows.find(r=>r.caseId===item.caseId),boxes=[s370row?.detailPlacementCm?.leftBandBox,s370row?.detailPlacementCm?.rightBandBox].filter(Boolean),bandRectHits=sleeves.flatMap((s,i)=>s.segs.flatMap((seg,j)=>boxes.filter(box=>crossesRect(seg,box,0.05)).map(box=>({sleeve:i,segment:j,box}))));
 const bodyNodes=[...doc.querySelectorAll('path[data-entity-id*="component:back:outline"],path[data-entity-id*="component:yoke:outline"]')].filter(n=>!n.getAttribute("data-entity-id").includes("fold-reflection")),bodyProper=bodyNodes.map(n=>({id:n.getAttribute("data-entity-id"),crossings:sleeves.map(s=>allCross(s.segs,flatten(n.getAttribute("d")).segs).length)}));
 const vb=face.svg.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number),points=sleeves.flatMap(s=>s.segs.flatMap(g=>[g.a,g.b])),frameOK=!!vb&&points.every(p=>p.x>=vb[0]-1e-5&&p.x<=vb[0]+vb[2]+1e-5&&p.y>=vb[1]-1e-5&&p.y<=vb[1]+vb[3]+1e-5);
 rows.push({caseId:item.caseId,pairCrossings:pairCrossings.length,bodyProperCrossings:bodyProper,bodyFillPenetrations:penetrations.length,bodyFillPenetrationDetails:penetrations.slice(0,8),bandDetailPaths:detailNodes.length,bandDetailSegmentCounts:details.map(d=>d.segs.length),bandDetailSamples:detailNodes.map(n=>({id:n.getAttribute("data-entity-id"),d:n.getAttribute("d"),tag:n.tagName})),bandDetailMinGapCm:bandMinGap,bandBoxHitsAt005cm:bandRectHits.length,frameOK});
}
const hist=k=>Object.fromEntries([...new Set(rows.map(r=>r[k]))].map(v=>[String(v),rows.filter(r=>r[k]===v).length]));
const summary={revision:matrix.summary.sourceRevision,configurations:rows.length,screening:"actual Chromium SVGs, cubic outlines tessellated at 32 intervals (48 for body fills); strict proper intersections; exact segment-in-polygon intervals; S370 boxes with 0.05cm clearance",sleevePairCrossingHistogram:hist("pairCrossings"),bodyFillPenetrationOptions:rows.filter(r=>r.bodyFillPenetrations>0).map(r=>r.caseId),bandDetailMinimumClearanceCm:Math.min(...rows.map(r=>r.bandDetailMinGapCm)),bandDetail05ClearanceFailures:rows.filter(r=>r.bandBoxHitsAt005cm>0).map(r=>r.caseId),viewBoxFailures:rows.filter(r=>!r.frameOK).map(r=>r.caseId),bandDetailPathHistogram:hist("bandDetailPaths"),bodyCrossingRows:rows.filter(r=>r.bodyProperCrossings.some(b=>b.crossings.some(n=>n>0)))};
await writeFile(new URL("./local-y-candidate-geometry.json",import.meta.url),JSON.stringify({summary,rows},null,2)+"\n");
console.log(JSON.stringify(summary,null,2));
assert.equal(rows.length,28);