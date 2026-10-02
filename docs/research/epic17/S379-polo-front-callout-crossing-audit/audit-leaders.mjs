import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const here = 'docs/research/epic17/S379-polo-front-callout-crossing-audit';
const sourceDir = 'docs/research/epic17/S378-polo-collar-point-callout-diagnosis/rendered';
const matrix = JSON.parse(await readFile('docs/research/epic17/S378-polo-collar-point-callout-diagnosis/collar-point-callout-matrix.json', 'utf8'));
const baseMatrix = JSON.parse(await readFile('docs/research/epic17/S331-polo-browser-final/matrix.json', 'utf8'));
assert.equal(matrix.rows.length, 17); assert.equal(baseMatrix.cases.length, 17);
const cases = matrix.rows.map((row, i) => { assert.equal(row.caseId, baseMatrix.cases[i].caseId); assert.equal(row.revisionId, `live-draft:polo:S378:${row.caseId}`); return row; });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 }, deviceScaleFactor: 1 });
const browserErrors=[]; page.on('pageerror', e=>browserErrors.push(e.message)); page.on('console', m=>{if(m.type()==='error')browserErrors.push(m.text())});
const results=[]; const annotated=[];
function ptDist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function orient(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
function segInt(a,b,c,d){const eps=1e-8; const on=(p,q,r)=>Math.abs(orient(p,q,r))<eps&&r.x>=Math.min(p.x,q.x)-eps&&r.x<=Math.max(p.x,q.x)+eps&&r.y>=Math.min(p.y,q.y)-eps&&r.y<=Math.max(p.y,q.y)+eps; let o1=orient(a,b,c),o2=orient(a,b,d),o3=orient(c,d,a),o4=orient(c,d,b); return ((o1*o2<0)&&(o3*o4<0))||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b)}
function pSeg(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy,t=den?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/den)):0;return ptDist(p,{x:a.x+t*dx,y:a.y+t*dy})}
function sd(a,b,c,d){return segInt(a,b,c,d)?0:Math.min(pSeg(a,c,d),pSeg(b,c,d),pSeg(c,a,b),pSeg(d,a,b))}
function segRect(a,b,r){const c=[{x:r.x,y:r.y},{x:r.x+r.w,y:r.y},{x:r.x+r.w,y:r.y+r.h},{x:r.x,y:r.y+r.h}];if(a.x>=r.x&&a.x<=r.x+r.w&&a.y>=r.y&&a.y<=r.y+r.h||b.x>=r.x&&b.x<=r.x+r.w&&b.y>=r.y&&b.y<=r.y+r.h)return 0;let m=Infinity;for(let i=0;i<4;i++)m=Math.min(m,sd(a,b,c[i],c[(i+1)%4]));return m}
try {
 for (const row of cases) {
   const file=join(sourceDir,`${row.caseId}-collar-point.svg`); const svg=await readFile(file,'utf8');
   const parsed=await page.evaluate((input)=>{
    const d=new DOMParser().parseFromString(input,'image/svg+xml'); const rev=d.documentElement.querySelector('[data-revision-id]')?.getAttribute('data-revision-id')??'';
    const parsePath=(data)=>{const tok=data.match(/[MLCZ]|-?\d+(?:\.\d+)?/gu)||[];let i=0,cur=null,start=null,out=[];while(i<tok.length){const op=tok[i++];if(op==='M'){cur={x:+tok[i++],y:+tok[i++]};start=cur;}else if(op==='L'){const e={x:+tok[i++],y:+tok[i++]};if(cur)out.push([cur,e]);cur=e;}else if(op==='C'){const c1={x:+tok[i++],y:+tok[i++]},c2={x:+tok[i++],y:+tok[i++]},e={x:+tok[i++],y:+tok[i++]};if(cur){let prev=cur;for(let n=1;n<=200;n++){let t=n/40,u=1-t;const p={x:u**3*cur.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t**3*e.x,y:u**3*cur.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t**3*e.y};out.push([prev,p]);prev=p;}}cur=e;}else if(op==='Z'&&cur&&start){out.push([cur,start]);cur=start;}else throw Error('Unsupported path op '+op);}return out;};
    const paths=[...d.querySelectorAll('path[data-entity-id]')].filter(p=>p.getAttribute('data-source-class')==='PATTERN_DERIVED'&&!p.hasAttribute('data-colorway-fill-for')&&p.getAttribute('pointer-events')!=='none').map(p=>({id:p.getAttribute('data-entity-id'),sourceId:p.getAttribute('data-source-id')||'',revisionId:p.getAttribute('data-revision-id')||'',segs:parsePath(p.getAttribute('d')||'')}));
    const leads=[...d.querySelectorAll('g[data-feature="pom"]')].map(g=>{const p=g.querySelector('path');if(!p)return null;const m=(p.getAttribute('d')||'').match(/^M\s*(-?[\d.]+)\s+(-?[\d.]+)\s+L\s*(-?[\d.]+)\s+(-?[\d.]+)/);if(!m)return null;return {id:g.getAttribute('data-entity-id'),sourceId:g.getAttribute('data-source-id'),targetId:g.getAttribute('data-callout-target'),sourceEntity:g.getAttribute('data-callout-source-entity'),revisionId:g.getAttribute('data-revision-id'),a:{x:+m[1],y:+m[2]},b:{x:+m[3],y:+m[4]},d:p.getAttribute('d')};}).filter(Boolean);
    const viewBox=d.documentElement.getAttribute('viewBox'); return {rev,paths,leads,viewBox};
   },svg);
   assert.equal(parsed.rev,row.revisionId); assert.ok(parsed.leads.length>0,`${row.caseId} emitted POM leader count`);
   assert.ok(parsed.paths.length>0);
   const leadFindings=[];
   for(const lead of parsed.leads){assert.equal(lead.revisionId,row.revisionId);let best={cm:Infinity,id:null,sourceId:null};for(const path of parsed.paths){if(path.id===lead.targetId)continue;for(const [c,d] of path.segs){const cm=sd(lead.a,lead.b,c,d);if(cm<best.cm)best={cm,id:path.id,sourceId:path.sourceId};}}const cross=best.cm<1e-6;leadFindings.push({calloutId:lead.id,sourceId:lead.sourceId,targetId:lead.targetId,sourceEntity:lead.sourceEntity,minNonTargetPathClearanceCm:+best.cm.toFixed(5),nearestPath:best.id,nearestPathSource:best.sourceId,crosses:cross,within025:best.cm<0.25});}
   const pairFind=[];for(let i=0;i<parsed.leads.length;i++)for(let j=i+1;j<parsed.leads.length;j++){const a=parsed.leads[i],b=parsed.leads[j],cm=sd(a.a,a.b,b.a,b.b);if(cm<0.25)pairFind.push({a:a.sourceId,b:b.sourceId,clearanceCm:+cm.toFixed(5),crosses:cm<1e-6});}
   await page.setContent(svg,{waitUntil:'load'});
   const textBoxes=await page.evaluate(()=>[...document.querySelectorAll('text[data-label-for]')].map(t=>{const b=t.getBBox();return {labelFor:t.getAttribute('data-label-for'),text:t.textContent||'',x:b.x,y:b.y,w:b.width,h:b.height};}));
   const textFind=[];
   for(const lead of parsed.leads)for(const tx of textBoxes){if(tx.labelFor===lead.id)continue;const cm=segRect(lead.a,lead.b,tx);if(cm<1e-6)textFind.push({leader:lead.sourceId,labelFor:tx.labelFor,label:tx.text,clearanceCm:+cm.toFixed(5)});}
   results.push({caseId:row.caseId,revisionId:row.revisionId,optionOverrides:row.options,sourcePoms:leadFindings.length,allSourceRevisionsMatch:parsed.paths.every(p=>p.revisionId===row.revisionId),leaders:leadFindings.filter(x=>x.within025),nearestNonTargetMinCm:+Math.min(...leadFindings.map(x=>x.minNonTargetPathClearanceCm)).toFixed(5),leaderPairsWithin025:pairFind,textLabelIntersections:textFind,sourceLabels:textBoxes.filter(t=>t.labelFor?.includes(':callout:')).map(t=>({labelFor:t.labelFor,text:t.text})),sourcePaths:parsed.paths.length,leaderCount:parsed.leads.length});
   let overlays='';for(const f of leadFindings.filter(x=>x.within025)){const l=parsed.leads.find(z=>z.sourceId===f.sourceId);overlays+=`<path data-audit-leader="${f.sourceId}" d="${l.d}" fill="none" stroke="#e11d48" stroke-width="0.16" stroke-dasharray="0.3 0.15"/><circle cx="${l.a.x}" cy="${l.a.y}" r="0.22" fill="none" stroke="#e11d48" stroke-width="0.09"/>`;}
   annotated.push({caseId:row.caseId,svg:svg.replace('</svg>',`<g data-s379-audit-overlay="true">${overlays}</g></svg>`)});
 }
 await mkdir(join(here,'annotated'),{recursive:true});
 for(const item of annotated){await writeFile(join(here,'annotated',`${item.caseId}-leader-overlay.svg`),item.svg);}
 const perPOM=[...new Set(results.flatMap(r=>r.leaders.map(l=>l.sourceId)))].map(id=>{const entries=results.flatMap(r=>r.leaders.filter(l=>l.sourceId===id).map(l=>({caseId:r.caseId,...l})));const nearestCounts={};for(const e of entries)nearestCounts[e.nearestPath]=(nearestCounts[e.nearestPath]||0)+1;return {sourceId:id,sourceText:results.flatMap(r=>r.sourceLabels).find(t=>t.labelFor===id.replace('pom:polo:','flat:polo:FRONT_FLAT:callout:'))?.text,blockedConfigurations:entries.length,minClearanceCm:Math.min(...entries.map(e=>e.minNonTargetPathClearanceCm)),maxClearanceCm:Math.max(...entries.map(e=>e.minNonTargetPathClearanceCm)),nearestPathFrequency:nearestCounts,sourceTarget:entries[0]?.targetId,sourceEntity:entries[0]?.sourceEntity};});
 const summary={configurations:results.length,leaderCountPerView:[...new Set(results.map(r=>r.leaderCount))],totalCalloutLeaderInstances:results.reduce((s,r)=>s+r.leaderCount,0),optionRowsWithNonTargetPathClearanceBelow025:results.filter(r=>r.leaders.length).map(r=>({caseId:r.caseId,count:r.leaders.length})),uniquePomsFailingPathClearance:perPOM.length,allRowsFailPathClearance:results.every(r=>r.leaders.length>0),leaderPairsWithin025:results.reduce((n,r)=>n+r.leaderPairsWithin025.length,0),leaderToTextIntersections:results.reduce((n,r)=>n+r.textLabelIntersections.length,0),textBoxMethod:'Chromium getBBox() for each emitted SVG text[data-label-for]; straight leader segment compared against actual glyph bounding boxes excluding its own label',pathGeometry:'SVG M/L/Z exact and C cubic paths linearly sampled at 200 equal parameter steps; path clearance measured in viewBox cm. A leader is a two-endpoint M/L segment.',thresholdCm:0.25,browserErrors:browserErrors.length,colorwayFillRendered:false};
 await writeFile(join(here,'per-pom-summary.json'),JSON.stringify(perPOM,null,2)+'\n');
 await writeFile(join(here,'leader-crossing-matrix.json'),JSON.stringify({summary,results},null,2)+'\n');
 for(const id of ['polo-default','polo-placketWidth-min','polo-standFrontRise-min','polo-collarPointExtension-max']){const item=annotated.find(x=>x.caseId===id);if(!item)continue; await page.setContent(item.svg,{waitUntil:'load'}); await page.screenshot({path:join(here,'annotated',`${id}-leader-overlay.png`),fullPage:true}); const cropped=item.svg.replace(/viewBox="[^"]+"/u,'viewBox="-12 -15 54 45"').replace(/width="[^"]+"/u,'width="54cm"').replace(/height="[^"]+"/u,'height="45cm"'); await page.setContent(cropped,{waitUntil:'load'}); await page.screenshot({path:join(here,'annotated',`${id}-leader-detail.png`),fullPage:true});}
 assert.equal(browserErrors.length,0);
 console.log(JSON.stringify(summary,null,2));
} finally {await browser.close();}



