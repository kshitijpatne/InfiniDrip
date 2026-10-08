import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const folder=fileURLToPath(new URL('./',import.meta.url));
const matrix=JSON.parse(await readFile(new URL('./current-production-replay/matrix.json',import.meta.url),'utf8'));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
const rows=[];
for(const row of matrix.rows){
  await page.setContent(row.svg,{waitUntil:'load'});
  const result=await page.locator('svg').evaluate((root)=>{
    const roles=['outerStand','underCollar','upperCollar'];
    const fills=Object.fromEntries(roles.map(role=>{
      const n=[...root.querySelectorAll('path[data-source-id]')].find(p=>p.getAttribute('data-source-id')===`pattern:woven-shirt:role:${role}`&&!p.hasAttribute('data-entity-id')&&p.getAttribute('fill')!=='none');
      return [role,n];
    }));
    if(Object.values(fills).some(v=>!v))throw Error('Missing filled collar role');
    const lines=[...root.querySelectorAll('path[data-source-id="pattern:woven-shirt:role:front:edge:neckline"]')].filter(p=>p.hasAttribute('data-entity-id'));
    if(lines.length!==2)throw Error(`Expected two necklines, found ${lines.length}`);
    const coverage=(line,s)=>{
      const total=line.getTotalLength(),step=0.01,n=Math.ceil(total/step),point=root.createSVGPoint();
      if(typeof fills.outerStand.isPointInFill!=='function')throw Error('SVGPathElement.isPointInFill unavailable');
      const inside=d=>{const p=line.getPointAtLength(d);point.x=p.x;point.y=p.y;return Object.fromEntries(Object.entries(fills).map(([role,path])=>[role,path.isPointInFill(point)]));};
      const states=[];for(let i=0;i<=n;i++){const d=Math.min(total,i*total/n);const roles=inside(d);
        // outerStand.neckline is the source-joined body base seam. Its fill
        // edge coincides with the body seam by construction, so boundary
        // membership there is not evidence that a collar leaf occludes it.
        states.push({d,roles,covered:roles.underCollar||roles.upperCollar});}
      const leafCovered=d=>{const p=line.getPointAtLength(d);point.x=p.x;point.y=p.y;return fills.underCollar.isPointInFill(point)||fills.upperCollar.isPointInFill(point);};
      const refine=(outsideDistance,insideDistance)=>{let lo=outsideDistance,hi=insideDistance;
        for(let k=0;k<32;k++){const mid=(lo+hi)/2;if(leafCovered(mid))hi=mid;else lo=mid;}
        return {distanceCm:(lo+hi)/2,point:line.getPointAtLength((lo+hi)/2)};};
      const intervals=[];let start=null;
      for(let i=0;i<states.length;i++){
        if(states[i].covered&&start===null)start=i;
        if(start!==null&&(!states[i].covered||i===states.length-1)){
          const end=states[i].covered&&i===states.length-1?i:i-1;
          const left=start===0?0:refine(states[start-1].d,states[start].d).distanceCm;
          const right=end===states.length-1?total:(states[end].d+states[end+1].d)/2;
          const startPoint=line.getPointAtLength(left),endPoint=line.getPointAtLength(right);
          intervals.push({startCm:left,endCm:right,lengthCm:right-left,startPoint:{x:startPoint.x,y:startPoint.y},endPoint:{x:endPoint.x,y:endPoint.y},roles:Object.fromEntries(Object.keys(fills).map(role=>[role,states.slice(start,end+1).some(s=>s.roles[role])]))});start=null;
        }
      }
      return {entityId:line.getAttribute('data-entity-id'),totalLengthCm:total,coveredIntervals:intervals,centerFill:inside(0),quarterCm:inside(Math.min(.25,total)),contactNeighborhood:inside(Math.min(total*.05,total)),shoulderFill:inside(total)};
    };
    return {necklines:lines.map(coverage), fillIds:Object.fromEntries(Object.entries(fills).map(([r,p])=>[r,{entity:p.getAttribute('data-source-id'),fill:p.getAttribute('fill'),d:p.getAttribute('d')}]))};
  });
  rows.push({caseId:row.caseId,revisionId:row.revisionId,...result});
}
await browser.close();
assert.equal(rows.length,28);assert.ok(rows.every(r=>r.revisionId==='live-draft:woven-shirt:14:14'));
const matrixOut={method:'Chromium SVGPathElement.getPointAtLength sampling at 0.01 cm along each actual emitted source-derived FRONT_FLAT neckline; test each point against upperCollar/underCollar fill geometry via isPointInFill. The source-joined outerStand/front neckline boundary is recorded separately and excluded from leaf occlusion. Bounds are screening estimates; the candidate mask uses exact fill path geometry and rendered output.',sourceRevision:'live-draft:woven-shirt:14:14',configurations:rows.length,rows};
await writeFile(join(folder,'silhouette-coverage-matrix.json'),JSON.stringify(matrixOut,null,2)+'\n');
console.log(JSON.stringify({configurations:rows.length,examples:rows.filter(r=>['woven-shirt-default','woven-shirt-neckEase-min','woven-shirt-neckEase-max','woven-shirt-collarLeafDepth-min','woven-shirt-collarLeafDepth-max'].includes(r.caseId)).map(r=>({caseId:r.caseId,necklines:r.necklines.map(n=>({entityId:n.entityId,totalLengthCm:n.totalLengthCm,coveredIntervals:n.coveredIntervals,centerFill:n.centerFill,contactNeighborhood:n.contactNeighborhood,shoulderFill:n.shoulderFill}))}))},null,2));
