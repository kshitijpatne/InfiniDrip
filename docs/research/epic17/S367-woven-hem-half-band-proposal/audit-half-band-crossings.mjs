import fs from 'node:fs';
const root='docs/research/epic17/S367-woven-hem-half-band-proposal/';
const matrix=JSON.parse(fs.readFileSync(root+'half-band-topology-matrix.json','utf8'));
const trace=JSON.parse(fs.readFileSync('docs/research/epic17/S365-woven-back-sleeve-band-diagnosis/production-instance-trace/production-sleeve-band-instance-trace.json','utf8'));
const epsilon=0.001;
const vec=(a,b)=>({x:b.x-a.x,y:b.y-a.y});const cross=(a,b)=>a.x*b.y-a.y*b.x;const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function hit(a,b){const[p,p2]=a,[q,q2]=b;const r=vec(p,p2),s=vec(q,q2),den=cross(r,s);if(Math.abs(den)<1e-10)return null;const qp=vec(p,q),t=cross(qp,s)/den,u=cross(qp,r)/den;if(t<=1e-6||t>=1-1e-6||u<=1e-6||u>=1-1e-6)return null;return{x:p.x+t*r.x,y:p.y+t*r.y,endpointDistance:Math.min(distance({x:p.x+t*r.x,y:p.y+t*r.y},p),distance({x:p.x+t*r.x,y:p.y+t*r.y},p2),distance({x:p.x+t*r.x,y:p.y+t*r.y},q),distance({x:p.x+t*r.x,y:p.y+t*r.y},q2))};}
function segs(points,prefix,indexStart=0){return points.slice(1).map((p,i)=>({name:prefix+'#'+(i+indexStart),segment:[points[i],p]}));}
function intersections(a,b){const hits=[];for(const x of a)for(const y of b){const p=hit(x.segment,y.segment);if(p)hits.push({a:x.name,b:y.name,pointCm:{x:p.x,y:p.y},nearNode:p.endpointDistance<=epsilon});}return hits;}
function parse(d){const tokens=d.match(/[MLCZ]|-?\d+(?:\.\d+)?/g)||[];const out=[];let i=0,current=null,start=null;while(i<tokens.length){const op=tokens[i++];if(op==='M'){current={x:+tokens[i++],y:+tokens[i++]};start=current;}else if(op==='L'){const next={x:+tokens[i++],y:+tokens[i++]};out.push({segment:[current,next]});current=next;}else if(op==='C'){i+=6;current=null;}else if(op==='Z'&&current&&start)out.push({segment:[current,start]});else if(op!=='Z')throw new Error('Unexpected path command '+op);}return out;}
const rows=[];
for(const r of matrix.records){const production=trace.records.find(x=>x.caseId===r.caseId);const g=r.geometry;const seamRight=segs(g.topHalf,'right.bandTop/sleeveHem');const seamLeft=segs(g.topHalf.map(p=>({x:-p.x,y:p.y})),'left.bandTop/sleeveHem');
 const outerRight=[...segs(g.outerRight.slice(0,41),'right.bandBottom[0.5,1]'),...segs(g.outerRight.slice(40),'right.bandSideLeft[0,1]',40)];
 const outerLeft=[...segs(g.outerLeft.slice(0,41),'left.bandBottom[0.5,1]'),...segs(g.outerLeft.slice(40),'left.bandSideLeft[0,1]',40)];
 const seams=intersections(seamRight,seamLeft), bands=intersections(outerRight,outerLeft);
 const sleevePaths=production.rolePaths.filter(p=>p.roleId==='sleeve');const bandSleeveAll=[];for(const band of [...outerRight,...outerLeft])for(const sleeve of sleevePaths){for(const h of intersections([band],parse(sleeve.pathData))){bandSleeveAll.push({...h,band:band.name,sleeveEntityId:sleeve.entityId});}}
 const bandSleeve=bandSleeveAll.filter(x=>!x.nearNode);const nodeContacts=bandSleeveAll.filter(x=>x.nearNode);
 rows.push({caseId:r.caseId,revisionId:r.revisionId,seamCrossing:{count:seams.length,pairs:seams},bandOuterPairCrossing:{count:bands.length,pairs:bands},bandToSleeveCrossing:{count:bandSleeve.length,pairs:bandSleeve},nearNodeContactsExcludedAtToleranceCm:epsilon,nearNodeContacts:nodeContacts});}
const summary={candidate:'diagnostic half-band crop; not the S321-approved uncut band instance',method:'proper interior line-segment intersection. Coincident/near-node events within 0.001 cm of a segment endpoint are reported separately, not counted as crossings.',optionCount:rows.length,revisionId:'live-draft:woven-shirt:14:14',totals:{hemSeamPair:rows.reduce((s,r)=>s+r.seamCrossing.count,0),bandOuterPair:rows.reduce((s,r)=>s+r.bandOuterPairCrossing.count,0),bandToSleeve:rows.reduce((s,r)=>s+r.bandToSleeveCrossing.count,0),nearNodeContacts:rows.reduce((s,r)=>s+r.nearNodeContacts.length,0)},rows};
fs.writeFileSync(root+'half-band-crossing-pairs.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({optionCount:summary.optionCount,totals:summary.totals,default:rows[0]},null,2));