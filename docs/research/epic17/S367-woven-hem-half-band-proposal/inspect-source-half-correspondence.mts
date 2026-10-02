import { writeFile } from 'node:fs/promises';
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from '../../../../src/drafting/index.ts';
import { edgeLength, edgeStart, pieceEdge } from '../../../../src/drafting/piece.ts';
import { assembleTechnicalFlatRoles } from '../../../../src/render/technical-flat-assembly.ts';
import { createG04TechnicalFlatProjectionMap } from '../../../../src/render/technical-flat-projection.ts';
import { transformFlatPoint } from '../../../../src/render/technical-flat-transform.ts';
const folder = new URL('./', import.meta.url);
const matrix = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../S363-woven-pom-leader-readability/production-replay/matrix.json', import.meta.url), 'utf8'));
const recipe = GARMENTS.find(x => x.name === 'woven-shirt');
const d = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const tr = (p,t)=>transformFlatPoint(p,{...t,mirrorX:t.mirrorX??false});
const records=[];
for(const row of matrix.cases){
 const options={...defaultGarmentOptions(recipe.options??[]),...row.options};
 const block=recipe.draft(STANDARD_M,options);
 const proj=createG04TechnicalFlatProjectionMap('woven-shirt',block,'live-draft:woven-shirt:14:14');
 const a=assembleTechnicalFlatRoles('woven-shirt',block,'BACK_FLAT',proj);
 const hem=pieceEdge(block.roles.sleeve,'hem'), top=pieceEdge(block.roles.sleeveBand,'top');
 const stitch=block.stitches.find(s=>s.label==='Folded sleeve band ↔ sleeve hem');
 const hp0=tr({x:hem.start.x+(hem.end.x-hem.start.x)*0,y:hem.start.y+(hem.end.y-hem.start.y)*0},a.transforms.sleeve);
 const hp5=tr({x:hem.start.x+(hem.end.x-hem.start.x)*0.5,y:hem.start.y+(hem.end.y-hem.start.y)*0.5},a.transforms.sleeve);
 const tp=(f)=>tr({x:top.start.x+(top.end.x-top.start.x)*f,y:top.start.y+(top.end.y-top.start.y)*f},a.transforms.sleeveBand);
 const halves=[[0,0.5],[0.5,1]].map(([u,v])=>{
  const p0=tp(u),p1=tp(v); return {interval:[u,v],direct: d(p0,hp0)+d(p1,hp5),reverse:d(p1,hp0)+d(p0,hp5),p0,p1};
 });
 records.push({caseId:row.caseId,options:row.options,sleeveHemLength:edgeLength(hem),bandTopLength:edgeLength(top),source:{bandTop:stitch.a.edges,sleeveHem:stitch.b.edges},transforms:{sleeve:a.transforms.sleeve,band:a.transforms.sleeveBand},backSleeveRuns:proj.faces.find(f=>f.kind==='BACK_FLAT').roles.find(x=>x.roleId==='sleeve').runs,halves});
}
const out={revisionId:'live-draft:woven-shirt:14:14',configurationCount:records.length,records};
await writeFile(new URL('source-half-correspondence.json',folder),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({configurationCount:records.length,first:records[0],minMaxHalfCosts:{min:Math.min(...records.flatMap(r=>r.halves.map(h=>Math.min(h.direct,h.reverse)))),max:Math.max(...records.flatMap(r=>r.halves.map(h=>Math.min(h.direct,h.reverse))))}},null,2));