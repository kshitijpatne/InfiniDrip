import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
const require=createRequire(import.meta.url); const {JSDOM}=require('jsdom');
const here=import.meta.dirname;
const epicRoot=join(here,'..');
const sourceDir=join(epicRoot,'S406-woven-approved-view-conventions','production-replay');
const out=join(here,'source-length-candidate'); const renders=join(out,'rendered');
await mkdir(renders,{recursive:true});
const matrix=JSON.parse(await readFile(join(sourceDir,'matrix.json'),'utf8'));
assert.equal(matrix.summary.sourceRevision,'live-draft:woven-shirt:14:14'); assert.equal(matrix.cases.length,28);
const sourceLengths={ sideRightCm:Math.hypot(3,22), halfHemCm:(43-6)/2 };
const tol=0.0002;
const fmt=n=>Number(n.toFixed(4)).toString();
const pair=(p)=>`${fmt(p.x)} ${fmt(p.y)}`;
function lineRuns(d){
 const tokens=d.match(/[MLCZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)??[];
 let cmd='',cur=null,runs=[];
 for(let i=0;i<tokens.length;){const t=tokens[i++];if(/^[MLCZ]$/u.test(t)){cmd=t; if(cmd==='Z'){cur=null;} continue;}
  const x=Number(t), y=Number(tokens[i++]); const p={x,y};
  if(cmd==='M'){cur=p;cmd='L';} else if(cmd==='L'&&cur){runs.push([cur,p]);cur=p;} else if(cmd==='C'){// ignore curve controls and endpoint; caller uses only line-edge paths
    const c2x=Number(tokens[i++]),c2y=Number(tokens[i++]),ex=Number(tokens[i++]),ey=Number(tokens[i++]);cur={x:ex,y:ey};
  }
 }
 return runs;
}
function rootsOnSegment(U,Lh,Ls,a,b){
 const dx=b.x-a.x,dy=b.y-a.y;
 const x0=a.x+Lh-U.x,y0=a.y-U.y;
 const A=dx*dx+dy*dy, B=2*(x0*dx+y0*dy), C=x0*x0+y0*y0-Ls*Ls;
 const disc=B*B-4*A*C; if(disc < -1e-8) return [];
 const sq=Math.sqrt(Math.max(0,disc));
 return [(-B-sq)/(2*A),(-B+sq)/(2*A)].filter(t=>t>=-1e-7&&t<=1+1e-7).map(t=>Math.max(0,Math.min(1,t)));
}
function orient(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
function segmentIntersection(a,b,c,d){
 const o1=orient(a,b,c),o2=orient(a,b,d),o3=orient(c,d,a),o4=orient(c,d,b); const e=1e-7;
 if(((o1>e&&o2< -e)||(o1< -e&&o2>e))&&((o3>e&&o4< -e)||(o3< -e&&o4>e))) return 'proper';
 const on=(p,x,y)=>Math.abs(orient(x,y,p))<=e&&p.x>=Math.min(x.x,y.x)-e&&p.x<=Math.max(x.x,y.x)+e&&p.y>=Math.min(x.y,y.y)-e&&p.y<=Math.max(x.y,y.y)+e;
 return on(c,a,b)||on(d,a,b)||on(a,c,d)||on(b,c,d)?'touch':null;
}
const results=[]; const browserErrors=[]; const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>browserErrors.push(e.message)); page.on('console',m=>{if(m.type()==='error')browserErrors.push(m.text());});
 for(const row of matrix.cases){
  const file=join(sourceDir,`${row.caseId}-back_flat.svg`); const dom=new JSDOM(await readFile(file,'utf8'),{contentType:'image/svg+xml'}); const doc=dom.window.document;
  const svg=doc.documentElement; assert.equal(svg.getAttribute('data-revision-id'),'live-draft:woven-shirt:14:14');
  const right=doc.querySelector('path[data-entity-id="flat:woven-shirt:BACK_FLAT:component:sleeve:outline"]');
  const left=doc.querySelector('path[data-entity-id="flat:woven-shirt:BACK_FLAT:component:sleeve:outline:approved-view-pair"]');
  const fill=doc.querySelector('path[data-colorway-fill-for="flat:woven-shirt:BACK_FLAT:component:sleeve:outline"]');
  const back=doc.querySelector('path[data-entity-id="flat:woven-shirt:BACK_FLAT:component:back:outline"]');
  assert.ok(right&&left&&fill&&back,row.caseId+': exact sleeve pair/fill/back source output exists');
  const rightParts=lineRuns(right.getAttribute('d')); const leftParts=lineRuns(left.getAttribute('d'));
  assert.equal(rightParts.length,2); assert.equal(leftParts.length,2);
  const U=rightParts[0][0], oldC=rightParts[0][1], oldB=rightParts[1][1];
  const measuredSide=Math.hypot(oldC.x-U.x,oldC.y-U.y), measuredHalfHem=Math.hypot(oldB.x-oldC.x,oldB.y-oldC.y);
  assert.ok(Math.abs(measuredSide-sourceLengths.sideRightCm)<tol,`${row.caseId}: emitted side length ${measuredSide}`);
  assert.ok(Math.abs(measuredHalfHem-sourceLengths.halfHemCm)<tol,`${row.caseId}: emitted half-hem length ${measuredHalfHem}`);
  const sideSegments=lineRuns(back.getAttribute('d')).filter(([a,b])=>a.x>0&&b.x>0&&a.y>=23.9&&a.y<=67&&b.y>=23.9&&b.y<=67);
  assert.ok(sideSegments.length>=2,`${row.caseId}: exact right back side segments available`);
  const candidates=[]; for(let i=0;i<sideSegments.length;i++){const [a,b]=sideSegments[i];for(const t of rootsOnSegment(U,sourceLengths.halfHemCm,sourceLengths.sideRightCm,a,b)){
    const B={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}; const C={x:B.x+sourceLengths.halfHemCm,y:B.y}; candidates.push({sideSegment:i,t,B,C,residual:Math.hypot(C.x-U.x,C.y-U.y)-sourceLengths.sideRightCm});
  }}
  assert.ok(candidates.length>=1,`${row.caseId}: length/side intersection has a solution`);
  candidates.sort((a,b)=>a.sideSegment-b.sideSegment||a.t-b.t); const chosen=candidates[0];
  const mirror=p=>({x:-p.x,y:p.y}); const leftU=mirror(U),leftC=mirror(chosen.C),leftB=mirror(chosen.B);
  const newRight=`M${pair(U)} L${pair(chosen.C)} M${pair(chosen.C)} L${pair(chosen.B)}`;
  const newLeft=`M${pair(leftU)} L${pair(leftC)} M${pair(leftC)} L${pair(leftB)}`;
  right.setAttribute('d',newRight); left.setAttribute('d',newLeft);
  let fillD=fill.getAttribute('d');
  const oldR=`L${pair(oldC)} L${pair(oldB)} L`; const nextR=`L${pair(chosen.C)} L${pair(chosen.B)} L`;
  const oldL=`L${pair(mirror(oldC))} L${pair(mirror(oldB))} L`; const nextL=`L${pair(leftC)} L${pair(leftB)} L`;
  assert.ok(fillD.includes(oldR),`${row.caseId}: right exact sleeve fill boundary matches source outline`);
  assert.ok(fillD.includes(oldL),`${row.caseId}: left exact sleeve fill boundary matches source outline`);
  fillD=fillD.replace(oldR,nextR).replace(oldL,nextL); fill.setAttribute('d',fillD);
  const svgString=new dom.window.XMLSerializer().serializeToString(svg); const name=`${row.caseId}-back_flat-source-length.svg`;
  await writeFile(join(out,name),`${svgString}\n`);
  await page.setContent(svgString,{waitUntil:'load'});
  const inspection=await page.evaluate(()=>{
    const candidates=[...document.querySelectorAll('path[data-entity-id="flat:woven-shirt:BACK_FLAT:component:sleeve:outline"],path[data-entity-id="flat:woven-shirt:BACK_FLAT:component:sleeve:outline:approved-view-pair"]')];
    const groups=[...document.querySelectorAll('path[data-layer]')].filter(p=>p.getAttribute('data-entity-id')&&!p.getAttribute('data-colorway-fill-for'));
    const segs=p=>{const d=p.getAttribute('d')||'';const tok=d.match(/[MLCZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[];let i=0,cmd='',cur=null,a=[];while(i<tok.length){let t=tok[i++];if(/^[MLCZ]$/.test(t)){cmd=t;if(t==='Z')cur=null;continue;}const pt={x:+t,y:+tok[i++]};if(cmd==='M'){cur=pt;cmd='L';}else if(cmd==='L'&&cur){a.push([cur,pt]);cur=pt;}else if(cmd==='C'){i+=4;cur=pt;}}return a;};
    const collision=[]; for(const p of candidates){for(const [a,b] of segs(p)){for(const q of groups){if(candidates.includes(q))continue; for(const [c,d] of segs(q)){const o=(x,y,z)=>(y.x-x.x)*(z.y-x.y)-(y.y-x.y)*(z.x-x.x);const eps=1e-6,o1=o(a,b,c),o2=o(a,b,d),o3=o(c,d,a),o4=o(c,d,b);if(((o1>eps&&o2< -eps)||(o1< -eps&&o2>eps))&&((o3>eps&&o4< -eps)||(o3< -eps&&o4>eps)))collision.push({sleeve:p.getAttribute('data-entity-id').endsWith('approved-view-pair')?'left':'right',other:q.getAttribute('data-entity-id'),layer:q.getAttribute('data-layer'),a,b,c,d});}}}}
    return {svgErrors:[],collision};
  });
  const rendered=join(renders,`${row.caseId}-back_flat-source-length.png`); await page.screenshot({path:rendered,fullPage:true});
  const detailDom=new JSDOM(svgString,{contentType:'image/svg+xml'});const detail=detailDom.window.document.documentElement;detail.setAttribute('width','72cm');detail.setAttribute('height','60cm');detail.setAttribute('viewBox','-48 14 96 60');
  await page.setContent(new detailDom.window.XMLSerializer().serializeToString(detail),{waitUntil:'load'});const crop=join(renders,`${row.caseId}-sleeve-detail.png`);await page.screenshot({path:crop,fullPage:true});
  const finalSide=Math.hypot(chosen.C.x-U.x,chosen.C.y-U.y),finalHem=Math.hypot(chosen.C.x-chosen.B.x,chosen.C.y-chosen.B.y);
  results.push({caseId:row.caseId,options:row.options,revisionId:svg.getAttribute('data-revision-id'),sourcePiece:'pattern:woven-shirt:role:sleeve',sourceEdges:['sideRight','hem[0,.5]'],instanceCount:2,underarm:U,contactStation:{sourcePiece:'back',sourceEdgeCandidates:['sideUpper','sideMiddle','sideLower'],resolvedOutputSegment:chosen.sideSegment,t:chosen.t,point:chosen.B,unstitchedContact:true},outerCuffPoint:chosen.C,sourceLengthsCm:sourceLengths,emittedSourceLengthCheckCm:{sideRight:measuredSide,hemHalf:measuredHalfHem},candidateLengthsCm:{sideRight:finalSide,hemHalf:finalHem},lengthResidualCm:{sideRight:finalSide-sourceLengths.sideRightCm,hemHalf:finalHem-sourceLengths.halfHemCm},numberOfSolutions:candidates.length,bodySideIntersections:inspection.collision.filter(x=>x.other?.includes('back:outline')).length,allIntersections:inspection.collision.length,intersections:inspection.collision,candidateSvg:`source-length-candidate/${name}`,renderedPng:`source-length-candidate/rendered/${row.caseId}-back_flat-source-length.png`,detailPng:`source-length-candidate/rendered/${row.caseId}-sleeve-detail.png`});
 }
 assert.deepEqual(browserErrors,[]);
 const result={sourceRevision:matrix.summary.sourceRevision,sourceFacts:{formula:'sleeve sideRight is sqrt(3^2 + sleeveLength^2), with standard sleeveLength 22 cm; hem half is (sleeve width - 6 cm)/2, with width bicep 38 cm + ease 10 cm / 2 = 43 cm',sideRightCm:sourceLengths.sideRightCm,hemHalfCm:sourceLengths.halfHemCm},candidateRule:'Keep approved cap mapping and underarm endpoints; for each right half place a horizontal half-hem of the exact source length ending at the first exact back side-seam station whose cuff point is exactly one source sideRight length from the underarm. Reflect across centerBack. This creates an unstitched hem-to-body-side contact; view convention only.',configurations:results.length,faces:results.length,rowsWithUniqueContact:results.filter(r=>r.numberOfSolutions===1).length,rowsWithLengthResidualOverTolerance:results.filter(r=>Math.abs(r.lengthResidualCm.sideRight)>0.0002||Math.abs(r.lengthResidualCm.hemHalf)>0.0002).length,rowsWithUnstitchedContact:results.filter(r=>r.contactStation.unstitchedContact).length,rowsWithOtherLineIntersections:results.filter(r=>r.allIntersections>0).length,bandOrOtherCollisions:results.filter(r=>r.intersections.some(x=>x.other?.includes('sleeveBand'))).length,browserErrors,results};
 await writeFile(join(out,'S439-source-length-candidate-matrix.json'),JSON.stringify(result,null,2)+'\n'); console.log(JSON.stringify({configurations:result.configurations,unique:result.rowsWithUniqueContact,lengthResidualFailures:result.rowsWithLengthResidualOverTolerance,unstitchedContacts:result.rowsWithUnstitchedContact,rowsWithLineIntersections:result.rowsWithOtherLineIntersections,bandCollisions:result.bandOrOtherCollisions,browserErrors},null,2));
}finally{await browser.close();}

