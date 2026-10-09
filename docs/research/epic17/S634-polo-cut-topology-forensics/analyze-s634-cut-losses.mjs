import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const exchange="C:/G04-CLO-DXF-Exchange";
const s617=`${exchange}/S617-standard-dxf-units-header`;
const s632=`${exchange}/S632-astm-import-mode-polo`;
const root=`${exchange}/S634-polo-cut-topology-forensics`;
const inputPath=`${s617}/Input/polo-standard-m-cm-units-header.dxf`;
const inputs=[
  {label:"S617 Standard import / ASTM export",path:`${s617}/Output/polo-m-cm-header-standard-input-astm-output.dxf`,sha256:"42db6b2c7974637047bdcb39763a5e677d10b6d4a2696ce13ed837581be46525"},
  {label:"S632 ASTM import / export generation 1",path:`${s632}/Output/polo-astm-generation-1.dxf`,sha256:"e35fdf07742f5cc8eec3fafb9d6525bc43f9f37521682c09a87ac3b821c7643e"},
  {label:"S632 ASTM import / export generation 2",path:`${s632}/Output/polo-astm-generation-2.dxf`,sha256:"c4664a013c42404d33144e38192ae5b5195ca2fc0b0eabfba13d28f8e1c32233"},
];
const evidencePins=[
  [`${s617}/Evidence/Analysis/S617-header-fine-roundtrip-analysis.json`,"685ad4c76ca503db2e3b6c5234d1915523ed28722727be441bd1d65acb68a360"],
  [`${s632}/Evidence/Analysis/S632-generation-1-geometry-analysis.json`,"a4560033ee7001b7b16e80f5431e093b321551f9206ca686b989df401eff06af"],
  [`${s632}/Evidence/Analysis/S632-generation-2-geometry-analysis.json`,"724a1f28d46c30e1f38f80e3d1eb822c2359861ebf0afb0f19757a956278608b"],
  [`${s632}/Evidence/Analysis/S632-generation-1-mark-analysis.json`,"479ac6ef2f5036683113f83e87da396444986865c2fb9ac70fddb44d03ac7cdd"],
  [`${s632}/Evidence/Analysis/S632-generation-2-mark-analysis.json`,"e47b375b68b8f16e10b5cbc99e262fb027c0590975b1696f9e367158a257849d"],
];
const expectedInput="71f45fdca602bbddb32ba53f76f0b5d9b6e92094d96557414c182c5eaf42e5f5";
const sha=b=>createHash("sha256").update(b).digest("hex").toLowerCase();
const readPinned=async(path,digest)=>{const b=await readFile(path);assert.equal(sha(b),digest.toLowerCase(),`SHA-256 mismatch: ${path}`);return b;};
const input=await readPinned(inputPath,expectedInput);
assert.equal(sha(await readFile(`${s632}/Input/polo-standard-m-cm-units-header.dxf`)),expectedInput,"S617/S632 source copy mismatch");
for(const [path,digest] of evidencePins)await readPinned(path,digest);
const sourceBytes=await readFile(inputPath);
const outputs=[];
for(const item of inputs)outputs.push({...item,bytes:await readPinned(item.path,item.sha256)});

function entities(bytes){
  const lines=bytes.toString("utf8").replace(/^\uFEFF/u,"").trimEnd().split(/\r?\n/u);
  assert.equal(lines.length%2,0,"DXF group/value pairs must be complete");
  const pairs=Array.from({length:lines.length/2},(_,i)=>[Number(lines[2*i].trim()),lines[2*i+1].trim()]);
  assert(pairs.every(([c])=>Number.isInteger(c)),"invalid DXF group code");
  const sections=[]; let section;
  for(let i=0;i<pairs.length;i++){
    if(pairs[i][0]===0&&pairs[i][1]==="SECTION"){section={name:pairs[i+1]?.[1],records:[]};sections.push(section);i++;continue;}
    if(pairs[i][0]===0&&pairs[i][1]==="ENDSEC"){section=undefined;continue;}
    if(!section||pairs[i][0]!==0)continue;
    const record=[pairs[i++]];while(i<pairs.length&&pairs[i][0]!==0)record.push(pairs[i++]);i--;
    section.records.push(record);
  }
  const get=(r,c)=>r.find(([code])=>code===c)?.[1];
  const poly=(r,records,block=null)=>{
    const type=r[0]?.[1],layer=get(r,8)??"(none)"; let vertices=[],closed=false;
    if(type==="LWPOLYLINE"){
      closed=Boolean(Number(get(r,70)??0)&1);
      for(let i=0;i<r.length;i++)if(r[i][0]===10){vertices.push({x:Number(r[i][1]),y:NaN,bulge:0});if(r[i+1]?.[0]===20)vertices.at(-1).y=Number(r[i+1][1]);}
      let n=-1;for(const [c,v] of r){if(c===10)n++;else if(c===42&&n>=0)vertices[n].bulge=Number(v);}
    }else if(type==="POLYLINE"){
      closed=Boolean(Number(get(r,70)??0)&1);const idx=records.indexOf(r);
      for(let j=idx+1;j<records.length&&records[j][0]?.[1]!=="SEQEND";j++)if(records[j][0]?.[1]==="VERTEX")vertices.push({x:Number(get(records[j],10)),y:Number(get(records[j],20)),bulge:Number(get(records[j],42)??0)});
    }else return null;
    if(vertices.length<2||!vertices.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))return null;
    return {type,layer,block,closed,vertices};
  };
  const ents=sections.find(s=>s.name==="ENTITIES")?.records??[];
  const sourcePolys=ents.map(r=>poly(r,ents)).filter(Boolean);
  const marks=ents.map((r,index)=>({r,index,type:r[0]?.[1],layer:get(r,8)??"(none)"})).filter(e=>e.layer.startsWith("MARK_"));
  const inserts=ents.filter(r=>r[0]?.[1]==="INSERT").map(r=>({block:get(r,2),x:Number(get(r,10)??0),y:Number(get(r,20)??0),sx:Number(get(r,41)??1),sy:Number(get(r,42)??1),rotation:Number(get(r,50)??0)}));
  const blockRecords=sections.find(s=>s.name==="BLOCKS")?.records??[];
  const blockPolys=[];let block;
  for(let i=0;i<blockRecords.length;i++){const r=blockRecords[i],type=r[0]?.[1];if(type==="BLOCK")block=get(r,2);else if(type==="ENDBLK")block=undefined;else if(block&&(type==="POLYLINE"||type==="LWPOLYLINE")){const p=poly(r,blockRecords,block);if(p)blockPolys.push(p);if(type==="POLYLINE")while(i+1<blockRecords.length&&blockRecords[i+1][0]?.[1]!=="SEQEND")i++;}}
  const byBlock=new Map(inserts.map(x=>[x.block,x]));
  for(const p of blockPolys){const t=byBlock.get(p.block);assert(t,`unreferenced output block ${p.block}`);const a=t.rotation*Math.PI/180;p.vertices=p.vertices.map(q=>({x:t.x+(q.x*t.sx)*Math.cos(a)-(q.y*t.sy)*Math.sin(a),y:t.y+(q.x*t.sx)*Math.sin(a)+(q.y*t.sy)*Math.cos(a),bulge:q.bulge}));}
  return {sourcePolys,marks,blockPolys,inserts,acadver:pairs.find(([c])=>c===1)?.[1],sections};
}
function pointDist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function bestCyclic(a,b){
  if(a.length!==b.length)return {max:Infinity};let best={max:Infinity,rotation:0,reversed:false};
  for(const reversed of [false,true])for(let r=0;r<b.length;r++){let max=0;for(let i=0;i<a.length;i++){const j=reversed?(r-i+b.length*2)%b.length:(r+i)%b.length;max=Math.max(max,pointDist(a[i],b[j]));}if(max<best.max)best={max,rotation:r,reversed};}
  return best;
}
function removeOne(a,b){if(a.length!==b.length+1)return {max:Infinity};let best={max:Infinity};for(let removed=0;removed<a.length;removed++){const reduced=a.filter((_,i)=>i!==removed),m=bestCyclic(reduced,b);if(m.max<best.max)best={...m,removed};}return best;}
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy;if(d===0)return pointDist(p,a);const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d));return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));}
const source=entities(sourceBytes), sourceCuts=source.sourcePolys.filter(p=>p.layer==="CUT"),sourceSews=source.sourcePolys.filter(p=>p.layer==="SEW");
assert.equal(sourceCuts.length,9);assert.equal(sourceSews.length,9);assert.equal(source.marks.length,38);
const parsed=outputs.map(o=>({...o,parsed:entities(o.bytes)}));
const sourcePieces=sourceSews.map((sew,i)=>({index:i,sew,cut:sourceCuts[i]}));
const configurations=parsed.map(out=>{
  const result=[];
  for(const src of sourcePieces){
    const sewCandidates=out.parsed.inserts.map(ins=>({ins,paths:out.parsed.blockPolys.filter(p=>p.block===ins.block)})).flatMap(({ins,paths})=>{
      const matches=paths.filter(p=>p.closed===src.sew.closed&&p.vertices.length===src.sew.vertices.length).map(p=>({p,match:bestCyclic(src.sew.vertices,p.vertices)})).sort((a,b)=>a.match.max-b.match.max);
      return matches.length?[{block:ins.block,match:matches[0].match,paths}]:[];
    }).sort((a,b)=>a.match.max-b.match.max);
    assert(sewCandidates.length,`no output SEW identity candidate for source piece ${src.index}`);
    const binding=sewCandidates[0];
    assert(binding.match.max<=0.001,`source SEW identity exceeds gate: ${binding.match.max}`);
    assert(!sewCandidates[1]||binding.match.max+1e-8<sewCandidates[1].match.max||sewCandidates[1].block===binding.block,"ambiguous SEW piece identity across blocks");
    const closed=binding.paths.filter(p=>p.closed);
    const cutCandidates=closed.map(p=>({line:p,layer:p.layer,vertices:p.vertices.length,removed:removeOne(src.cut.vertices,p.vertices),direct:bestCyclic(src.cut.vertices,p.vertices)}));
    const loss=cutCandidates.filter(c=>Number.isFinite(c.removed.max)).sort((a,b)=>a.removed.max-b.removed.max);
    const direct=cutCandidates.filter(c=>Number.isFinite(c.direct.max)).sort((a,b)=>a.direct.max-b.direct.max);
    const bestLoss=loss[0],bestDirect=direct[0];
    let mode="no one-vertex deletion match",best=bestLoss;
    if(bestDirect&&(!bestLoss||bestDirect.direct.max<bestLoss.removed.max)){mode="same-vertex cyclic match";best={...bestDirect,removed:undefined,match:bestDirect.direct};}
    else if(bestLoss){best={...bestLoss,match:bestLoss.removed,deletedIndex:bestLoss.removed.removed};mode="one source vertex omitted";}
    let dropped=null;
    if(mode==="one source vertex omitted"){
      const i=best.deletedIndex,prev=src.cut.vertices[(i+src.cut.vertices.length-1)%src.cut.vertices.length],point=src.cut.vertices[i],next=src.cut.vertices[(i+1)%src.cut.vertices.length];
      const toMerged=segmentDistance(point,prev,next);
      const markDistances=source.marks.map(m=>{
        const val=c=>m.r.find(([code])=>code===c)?.[1];let d=Infinity;
        if(m.type==="POINT")d=pointDist(point,{x:Number(val(10)),y:Number(val(20))});
        else if(m.type==="LINE")d=segmentDistance(point,{x:Number(val(10)),y:Number(val(20))},{x:Number(val(11)),y:Number(val(21))});
        else if(m.type==="CIRCLE")d=Math.abs(pointDist(point,{x:Number(val(10)),y:Number(val(20))})-Number(val(40)));
        else if(m.type==="POLYLINE"){const p=polylineFromMark(m,source.sections);for(let j=0;j<p.length;j++)d=Math.min(d,segmentDistance(point,p[j],p[(j+1)%p.length]));}
        return {entityIndex:m.index,type:m.type,layer:m.layer,distanceCm:d};
      }).sort((a,b)=>a.distanceCm-b.distanceCm);
      const nearbyMarks=markDistances.filter(m=>m.distanceCm<=0.05);
      const reducedIndices=src.cut.vertices.map((_,j)=>j).filter(j=>j!==i),prevPos=reducedIndices.indexOf((i+src.cut.vertices.length-1)%src.cut.vertices.length),nextPos=reducedIndices.indexOf((i+1)%src.cut.vertices.length),match=best.match,count=reducedIndices.length;
      const outputIndex=pos=>match.reversed?(match.rotation-pos+count*2)%count:(match.rotation+pos)%count;
      const outputPrev=best.line.vertices[outputIndex(prevPos)],outputNext=best.line.vertices[outputIndex(nextPos)];
      const sewDist=Math.min(...src.sew.vertices.map((a,j)=>segmentDistance(point,a,src.sew.vertices[(j+1)%src.sew.vertices.length])));
      dropped={sourceVertexIndex:i,point:{x:point.x,y:point.y},previousVertexIndex:(i+src.cut.vertices.length-1)%src.cut.vertices.length,previousPoint:prev,nextVertexIndex:(i+1)%src.cut.vertices.length,nextPoint:next,incomingSourceEdgeLengthCm:pointDist(prev,point),outgoingSourceEdgeLengthCm:pointDist(point,next),mergedNeighborChordLengthCm:pointDist(prev,next),sourceVertexToMergedNeighborSegmentCm:toMerged,receiverMergedSegment:{start:outputPrev,end:outputNext},sourceVertexToReceiverMergedSegmentCm:segmentDistance(point,outputPrev,outputNext),sewOutlineDistanceCm:sewDist,nearestSourceMark:markDistances[0]??null,nearbySourceMarks:nearbyMarks};
    }
    result.push({pieceIndex:src.index,receiverBlock:binding.block,sourceCutVertices:src.cut.vertices.length,sourceSewVertices:src.sew.vertices.length,sewIdentityMaxCyclicDeltaCm:binding.match.max,receiverClosedOutlineCandidates:cutCandidates.map(c=>({layer:c.layer,vertices:c.vertices,oneDeletionMaxDeltaCm:Number.isFinite(c.removed.max)?c.removed.max:null,oneDeletionSourceVertexIndex:Number.isFinite(c.removed.max)?c.removed.removed:null,directMaxDeltaCm:Number.isFinite(c.direct.max)?c.direct.max:null})),selectedCutMatch:{mode,layer:best.layer??null,receiverVertices:best.vertices??null,maxSequenceDeltaCm:best.match?.max??best.removed?.max??null},droppedSourceVertex:dropped});
  }
  return {label:out.label,path:out.path,sha256:sha(out.bytes),acadver:out.parsed.acadver,insertCount:out.parsed.inserts.length,pieces:result};
});
function polylineFromMark(mark,sections){
  const rows=sections.find(s=>s.name==="ENTITIES")?.records??[];const ix=rows.indexOf(mark.r),pts=[];
  for(let j=ix+1;j<rows.length&&rows[j][0]?.[1]!=="SEQEND";j++)if(rows[j][0]?.[1]==="VERTEX"){const x=Number(rows[j].find(([c])=>c===10)?.[1]),y=Number(rows[j].find(([c])=>c===20)?.[1]);if(Number.isFinite(x)&&Number.isFinite(y))pts.push({x,y});}
  return pts;
}
const failures=configurations.map(c=>({label:c.label,failures:c.pieces.filter(p=>p.selectedCutMatch.receiverVertices!==p.sourceCutVertices||p.selectedCutMatch.maxSequenceDeltaCm>0.001).map(p=>p.pieceIndex)}));
const report={slice:"S634",source:{path:inputPath,sha256:sha(sourceBytes),bytes:sourceBytes.length,cutCount:sourceCuts.length,sewCount:sourceSews.length,markCount:source.marks.length},method:{pieceBinding:"unique output block selected by source SEW cyclic/reverse coordinate match at unchanged 0.001 cm gate",cutTopology:"same-count cyclic/reverse vertex matching and exhaustive single-source-vertex deletion subsequence search; receiver polylines transformed through INSERT scale/rotation/translation; no fitted transform",units:"source/output coordinates compared directly in the proven S617/S632 centimeter fixture",thresholdCm:0.001,nearbyMarkRadiusCm:0.05,limits:"Output structure identifies serialized vertex differences but not CLO's internal processing stage or intended physical construction."},outputs:configurations,failures,allThreeHaveSameFiveFailingRoles:failures.every(x=>JSON.stringify(x.failures)===JSON.stringify(failures[0].failures))};
const reportPath=`${root}/Evidence/S634-topology-comparison.json`;await mkdir(`${root}/Evidence`,{recursive:true});await writeFile(reportPath,`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify({reportPath,reportSha256:sha(Buffer.from(`${JSON.stringify(report,null,2)}\n`)),source:report.source,failures,allThreeHaveSameFiveFailingRoles:report.allThreeHaveSameFiveFailingRoles,summary:configurations.map(c=>({label:c.label,acadver:c.acadver,insertCount:c.insertCount,pieces:c.pieces.map(p=>({piece:p.pieceIndex,receiverBlock:p.receiverBlock,sourceCut:p.sourceCutVertices,receiverCut:p.selectedCutMatch.receiverVertices,match:p.selectedCutMatch.mode,removedVertex:p.droppedSourceVertex?.sourceVertexIndex,maxDeltaCm:p.selectedCutMatch.maxSequenceDeltaCm,incomingEdgeCm:p.droppedSourceVertex?.incomingSourceEdgeLengthCm,outgoingEdgeCm:p.droppedSourceVertex?.outgoingSourceEdgeLengthCm,receiverSegmentDeviationCm:p.droppedSourceVertex?.sourceVertexToReceiverMergedSegmentCm,sewGapCm:p.droppedSourceVertex?.sewOutlineDistanceCm,nearestMarkDistanceCm:p.droppedSourceVertex?.nearestSourceMark?.distanceCm}))}))},null,2));
