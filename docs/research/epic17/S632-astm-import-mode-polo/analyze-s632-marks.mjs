import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const exchange="C:/G04-CLO-DXF-Exchange";
const root=`${exchange}/S632-astm-import-mode-polo`;
const generation=process.argv[2]??"1";
const sourcePath=`${root}/Input/polo-standard-m-cm-units-header.dxf`;
const outputPath=`${root}/Output/polo-astm-generation-${generation}.dxf`;
const finePath=`${root}/Evidence/Analysis/S632-generation-${generation}-geometry-analysis.json`;
const renderPath=`${root}/Evidence/${generation==="1"?"generation-1-astm-import-overview.png":"generation-2-astm-final-render.png"}`;
const scenePath=`${root}/Evidence/polo-astm-generation-2-final-scene.zprj`;
const evidenceRoot=`${root}/Evidence/Analysis`;
const reportPath=`${evidenceRoot}/S632-generation-${generation}-mark-analysis.json`;
const thresholdCm=0.001;
const expected=new Map([
  [sourcePath,"71f45fdca602bbddb32ba53f76f0b5d9b6e92094d96557414c182c5eaf42e5f5"],
  [outputPath,generation==="1"?"e35fdf07742f5cc8eec3fafb9d6525bc43f9f37521682c09a87ac3b821c7643e":"c4664a013c42404d33144e38192ae5b5195ca2fc0b0eabfba13d28f8e1c32233"],
  [finePath,generation==="1"?"a4560033ee7001b7b16e80f5431e093b321551f9206ca686b989df401eff06af":"724a1f28d46c30e1f38f80e3d1eb822c2359861ebf0afb0f19757a956278608b"],
  [renderPath,"3ae6147fdae7c94c7b5d26729473d9f8dde7b1b6117feb8570ab8a98e1cf767e"],
  [scenePath,"eeb127a21cf4270197526b826f2634b5af32175c00127111b1a69ccaec81223b"],
]);
const sha=b=>createHash("sha256").update(b).digest("hex").toUpperCase();
const round=n=>Number.isFinite(n)?Number(n.toFixed(10)):null;
for(const [path,digest] of expected){
  const bytes=await readFile(path);
  assert.equal(sha(bytes),digest.toUpperCase(),`pinned S632 artifact changed: ${path}`);
  assert(bytes.length>0,`empty S632 artifact: ${path}`);
}
const sourceBytes=await readFile(sourcePath), outputBytes=await readFile(outputPath);
const fine=JSON.parse(await readFile(finePath,"utf8"));

function pairsOf(bytes,label){
  const rows=bytes.toString("utf8").replace(/^\uFEFF/u,"").trimEnd().split(/\r?\n/u);
  assert.equal(rows.length%2,0,`${label}: incomplete group/value pair`);
  const pairs=Array.from({length:rows.length/2},(_,i)=>[Number(rows[i*2].trim()),rows[i*2+1].trim()]);
  assert(pairs.every(([code])=>Number.isInteger(code)),`${label}: invalid group code`);
  return pairs;
}
function section(pairs,name){
  for(let i=0;i<pairs.length-2;i++)if(pairs[i][0]===0&&pairs[i][1]==="SECTION"&&pairs[i+1][1]===name){
    const end=pairs.findIndex((p,j)=>j>i&&p[0]===0&&p[1]==="ENDSEC");
    assert.notEqual(end,-1,`${name}: missing ENDSEC`);return pairs.slice(i+2,end);
  }
  return [];
}
function records(rows){
  const out=[];
  for(let i=0;i<rows.length;){
    if(rows[i][0]!==0){i++;continue;}
    const start=i,type=rows[i++][1];
    if(type==="POLYLINE"){
      while(i<rows.length&&!(rows[i][0]===0&&rows[i][1]==="SEQEND"))i++;
      assert.equal(rows[i]?.[1],"SEQEND","POLYLINE missing SEQEND");i++;
    }else while(i<rows.length&&rows[i][0]!==0)i++;
    out.push(rows.slice(start,i));
  }
  return out;
}
const val=(record,code)=>record.find(([c])=>c===code)?.[1];
function entity(record,index,block=null){
  const type=record[0]?.[1], layer=val(record,8)??"0";
  const point=(x,y)=>({x:Number(val(record,x)),y:Number(val(record,y))});
  const common={index,block,type,layer};
  if(type==="POINT")return {...common,p:point(10,20)};
  if(type==="LINE")return {...common,a:point(10,20),b:point(11,21)};
  if(type==="CIRCLE")return {...common,center:point(10,20),radius:Number(val(record,40))};
  if(type==="ARC")return {...common,center:point(10,20),radius:Number(val(record,40)),startDeg:Number(val(record,50)),endDeg:Number(val(record,51))};
  if(type==="POLYLINE"||type==="LWPOLYLINE"){
    const points=[];
    if(type==="POLYLINE")for(let i=0;i<record.length;){
      if(record[i][0]===0&&record[i][1]==="VERTEX"){
        const fields=[];i++;while(i<record.length&&record[i][0]!==0)fields.push(record[i++]);
        const get=c=>fields.find(([g])=>g===c)?.[1];
        points.push({x:Number(get(10)),y:Number(get(20)),bulge:Number(get(42)??0)});
      }else i++;
    }else for(const [code,raw] of record.slice(1)){
      if(code===10)points.push({x:Number(raw),y:NaN,bulge:0});
      else if(code===20&&points.length)points.at(-1).y=Number(raw);
      else if(code===42&&points.length)points.at(-1).bulge=Number(raw);
    }
    return {...common,points,closed:Boolean(Number(val(record,70)??0)&1)};
  }
  if(type==="TEXT"||type==="MTEXT")return {...common,text:record.filter(([c])=>c===1||c===3).map(([,s])=>s).join(""),p:point(10,20)};
  return common;
}
function blocksFrom(pairs){
  const rows=section(pairs,"BLOCKS"),blocks=[];
  for(let i=0;i<rows.length;){
    if(rows[i][0]!==0||rows[i][1]!=="BLOCK"){i++;continue;}
    const headStart=i++;while(i<rows.length&&rows[i][0]!==0)i++;
    const head=rows.slice(headStart,i),name=val(head,2),begin=i;
    while(i<rows.length&&!(rows[i][0]===0&&rows[i][1]==="ENDBLK"))i++;
    assert.equal(rows[i]?.[1],"ENDBLK",`block ${name} missing ENDBLK`);
    blocks.push({name,entities:records(rows.slice(begin,i)).map((e,index)=>entity(e,index,name))});i++;
  }
  return blocks;
}
function insertsFrom(pairs){
  return records(section(pairs,"ENTITIES")).filter(r=>r[0]?.[1]==="INSERT").map((r,index)=>({
    index,block:val(r,2),x:Number(val(r,10)??0),y:Number(val(r,20)??0),
    sx:Number(val(r,41)??1),sy:Number(val(r,42)??1),rotation:Number(val(r,50)??0),
  }));
}
function transformPoint(p,t){
  const a=t.rotation*Math.PI/180,x=p.x*t.sx,y=p.y*t.sy;
  return {x:t.x+x*Math.cos(a)-y*Math.sin(a),y:t.y+x*Math.sin(a)+y*Math.cos(a)};
}
function transformEntity(e,t){
  const out={...e};
  for(const k of ["p","a","b","center"])if(e[k])out[k]=transformPoint(e[k],t);
  if(e.points)out.points=e.points.map(p=>({...transformPoint(p,t),bulge:(t.sx*t.sy<0?-1:1)*(p.bulge??0)}));
  const uniform=Math.abs(Math.abs(t.sx)-Math.abs(t.sy))<1e-10;
  if(Number.isFinite(e.radius))out.radius=e.radius*Math.abs(t.sx);
  if(!uniform&&["CIRCLE","ARC"].includes(e.type))out.nonUniformCircleTransform=true;
  if(e.type==="ARC")out.startDeg=(e.startDeg+t.rotation+360)%360,out.endDeg=(e.endDeg+t.rotation+360)%360;
  return out;
}
const srcPairs=pairsOf(sourceBytes,"S632 source"),outPairs=pairsOf(outputBytes,"S632 output");
const srcRecords=records(section(srcPairs,"ENTITIES"));
const srcEntities=srcRecords.map((r,index)=>entity(r,index));
const sourceMarks=srcEntities.filter(e=>e.layer.startsWith("MARK_"));
const sourceOutlines=srcEntities.filter(e=>e.type==="POLYLINE"&&["CUT","SEW"].includes(e.layer));
assert.equal(sourceOutlines.length,18,"must retain the known nine CUT/SEW piece pairs");
assert.equal(sourceMarks.length,38,"S632 source mark inventory changed");
const pieceNames=["front","back","sleeve","button placket","buttonhole placket","outer collar stand","inner collar stand","upper pointed collar","under pointed collar"];
const fineByPiece=new Map(fine.results.map(r=>[r.piece,r]));
assert.equal(fine.results.length,9);
const sourcePieces=pieceNames.map((name,i)=>{
  const cut=sourceOutlines[i*2],sew=sourceOutlines[i*2+1],finePiece=fineByPiece.get(name);
  assert(cut.layer==="CUT"&&sew.layer==="SEW",`S632 source piece order mismatch at ${name}`);
  assert(finePiece,`missing source-bound S632 piece ${name}`);
  return {name,cut,sew,receiverBlock:finePiece.receiverBlock};
});
const outBlocks=blocksFrom(outPairs),inserts=insertsFrom(outPairs);
assert.equal(outBlocks.length,9,"S632 CLO output should retain nine piece blocks");
assert.equal(inserts.length,9,"S632 CLO output should retain nine inserts");
const insertByBlock=new Map(inserts.map(t=>[t.block,t]));
const outByBlock=new Map(outBlocks.map(b=>[b.name,b.entities.map(e=>transformEntity(e,insertByBlock.get(b.name)??{x:0,y:0,sx:1,sy:1,rotation:0}))]));
assert(sourcePieces.every(p=>outByBlock.has(p.receiverBlock)),"S632 fine-roundtrip piece block bindings do not resolve");

const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function segs(e){
  if(e.type==="LINE")return [[e.a,e.b]];
  if(e.type==="POLYLINE"||e.type==="LWPOLYLINE"){
    const s=e.points.slice(1).map((p,i)=>[e.points[i],p]);
    if(e.closed&&e.points.length>2)s.push([e.points.at(-1),e.points[0]]);
    return s;
  }
  return [];
}
function pointSegDist(p,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)):0;
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
function pathDist(p,e){const ss=segs(e);return ss.length?Math.min(...ss.map(([a,b])=>pointSegDist(p,a,b))):Infinity;}
function lineHausdorff(source,candidate){
  const length=dist(source.a,source.b),steps=Math.max(1,Math.ceil(length/0.0005));
  const sourceToOutput=[];
  for(let i=0;i<=steps;i++){const t=i/steps,p={x:source.a.x+(source.b.x-source.a.x)*t,y:source.a.y+(source.b.y-source.a.y)*t};sourceToOutput.push(pathDist(p,candidate));}
  const outputToSource=(candidate.points??[]).map(p=>pointSegDist(p,source.a,source.b));
  return {sourceToOutputMaxCm:Math.max(...sourceToOutput),outputVerticesToSourceMaxCm:outputToSource.length?Math.max(...outputToSource):null,maxHausdorffResidualCm:Math.max(...sourceToOutput,...outputToSource),sampledSourcePointCount:steps+1};
}
function circleMetrics(source,candidate){
  if(candidate.type==="CIRCLE")return {centerResidualCm:dist(source.center,candidate.center),radiusResidualCm:Math.abs(source.radius-candidate.radius)};
  if(!(candidate.type==="POLYLINE"||candidate.type==="LWPOLYLINE")||!candidate.closed||candidate.points.length<4)return null;
  const radial=candidate.points.map(p=>Math.abs(dist(p,source.center)-source.radius));
  const angles=candidate.points.map(p=>Math.atan2(p.y-source.center.y,p.x-source.center.x)).sort((a,b)=>a-b);
  let gap=0;for(let i=0;i<angles.length;i++)gap=Math.max(gap,(i+1<angles.length?angles[i+1]:angles[0]+2*Math.PI)-angles[i]);
  return {maxRadialErrorCm:Math.max(...radial),maxAngularGapDeg:gap*180/Math.PI,maxChordSagittaCm:source.radius*(1-Math.cos(gap/2)),vertexCount:candidate.points.length,closed:true};
}
function representative(e){
  if(e.type==="POINT")return e.p;
  if(e.type==="LINE")return {x:(e.a.x+e.b.x)/2,y:(e.a.y+e.b.y)/2};
  if(e.type==="CIRCLE"||e.type==="ARC")return e.center;
  if(e.points?.length)return {x:e.points.reduce((s,p)=>s+p.x,0)/e.points.length,y:e.points.reduce((s,p)=>s+p.y,0)/e.points.length};
  return null;
}
function boundsContains(poly,p){
  const xs=poly.points.map(v=>v.x),ys=poly.points.map(v=>v.y);
  return p.x>=Math.min(...xs)-1e-8&&p.x<=Math.max(...xs)+1e-8&&p.y>=Math.min(...ys)-1e-8&&p.y<=Math.max(...ys)+1e-8;
}
function pointInPoly(p,poly){
  if(!boundsContains(poly,p))return false;
  let inside=false;const pts=poly.points;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){
    const a=pts[i],b=pts[j];
    if(pointSegDist(p,a,b)<1e-7)return true;
    if(((a.y>p.y)!==(b.y>p.y))&&(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x))inside=!inside;
  }
  return inside;
}
const marks=sourceMarks.map(source=>{
  const rp=representative(source);assert(rp&&Number.isFinite(rp.x)&&Number.isFinite(rp.y),`invalid source mark ${source.index}`);
  const containing=sourcePieces.filter(p=>pointInPoly(rp,p.cut));
  const distances=sourcePieces.map(p=>({piece:p.name,cutBoundaryDistanceCm:pathDist(rp,p.cut),sewBoundaryDistanceCm:pathDist(rp,p.sew)})).sort((a,b)=>Math.min(a.cutBoundaryDistanceCm,a.sewBoundaryDistanceCm)-Math.min(b.cutBoundaryDistanceCm,b.sewBoundaryDistanceCm));
  const piece=containing.length===1?sourcePieces.find(p=>p.name===containing[0].name):sourcePieces.find(p=>p.name===distances[0].piece);
  const candidates=outByBlock.get(piece.receiverBlock);
  assert(candidates,`unbound output piece ${piece.name}`);
  const nearest=candidates.map(c=>({entity:c,distanceCm:source.type==="POINT"?pathDist(source.p,c):source.type==="LINE"?Math.max(pathDist(source.a,c),pathDist(source.b,c)):source.type==="CIRCLE"?Math.min(...(c.type==="CIRCLE"?[dist(source.center,c.center)+Math.abs(source.radius-c.radius)]:c.points?.map(p=>Math.abs(dist(p,source.center)-source.radius))??[Infinity])):Infinity})).sort((a,b)=>a.distanceCm-b.distanceCm);
  const outputMatches=[];
  if(source.type==="POINT"){
    for(const c of candidates)if(c.type==="POINT"&&dist(source.p,c.p)<=thresholdCm)outputMatches.push({outputEntityIndex:c.index,outputType:c.type,outputLayer:c.layer,distanceCm:round(dist(source.p,c.p)),geometry:c.p});
  }else if(source.type==="LINE"){
    for(const c of candidates){
      const ss=segs(c);if(!ss.length)continue;
      const lengthSource=dist(source.a,source.b),lengthTarget=ss.reduce((n,[a,b])=>n+dist(a,b),0);
      const residual=lineHausdorff(source,c);
      if(residual.maxHausdorffResidualCm<=thresholdCm&&Math.abs(lengthTarget-lengthSource)<=2*thresholdCm)outputMatches.push({outputEntityIndex:c.index,outputType:c.type,outputLayer:c.layer,maxHausdorffResidualCm:round(residual.maxHausdorffResidualCm),sampledSourcePointCount:residual.sampledSourcePointCount,lengthDeltaCm:round(Math.abs(lengthTarget-lengthSource)),geometry:c.points??[c.a,c.b]});
    }
  }else if(source.type==="CIRCLE"){
    for(const c of candidates){const m=circleMetrics(source,c);if(!m)continue;
      const fit=c.type==="CIRCLE"?m.centerResidualCm<=thresholdCm&&m.radiusResidualCm<=thresholdCm:m.maxRadialErrorCm<=thresholdCm&&m.maxChordSagittaCm<=thresholdCm;
      if(c.type==="CIRCLE"||m.maxRadialErrorCm<=thresholdCm)outputMatches.push({outputEntityIndex:c.index,outputType:c.type,outputLayer:c.layer,metrics:Object.fromEntries(Object.entries(m).map(([k,v])=>[k,typeof v==="number"?round(v):v])),wholeCurvePass:fit});
    }
  }
  const roleEvidence=source.layer;
  let disposition;
  if(source.type==="POINT")disposition=outputMatches.length===1?"one output POINT record lies within tolerance; semantic identity/layer role unproved":outputMatches.length>1?"multiple output POINT records lie within tolerance; mapping is ambiguous":"no distinct output POINT; nearby output path coincidence is not a preserved point marker";
  else if(source.type==="LINE")disposition=outputMatches.length===1?"unique output path geometry matches within tolerance; source meaning/layer semantics unproved":outputMatches.length>1?"ambiguous multiple output paths match":"no output line/path matches as a separate segment within tolerance";
  else if(source.type==="CIRCLE")disposition=outputMatches.some(m=>m.wholeCurvePass)?"output circle/closed polyline passes center/radius and whole-curve tolerances; layer semantics unproved":outputMatches.length?"radial candidate exists but whole-curve test fails":"no circle-shaped output candidate in this piece";
  else disposition="source primitive not specifically evaluated";
  let linePathCandidates=[];
  if(source.type==="LINE")linePathCandidates=candidates.filter(c=>segs(c).length).map(c=>({entityIndex:c.index,type:c.type,layer:c.layer,metrics:lineHausdorff(source,c),targetPathLengthCm:segs(c).reduce((n,[a,b])=>n+dist(a,b),0),geometry:c.points??[c.a,c.b]})).sort((a,b)=>a.metrics.sourceToOutputMaxCm-b.metrics.sourceToOutputMaxCm).slice(0,5).map(c=>({...c,metrics:Object.fromEntries(Object.entries(c.metrics).map(([k,v])=>[k,round(v)])),targetPathLengthCm:round(c.targetPathLengthCm)}));
  const sourceContourCoverage=source.type==="LINE"?[{layer:piece.cut.layer,entityIndex:piece.cut.index},{layer:piece.sew.layer,entityIndex:piece.sew.index}].map((info,i)=>{const contour=i===0?piece.cut:piece.sew;const metrics=lineHausdorff(source,contour);return {...info,sourceToContourMaxCm:round(metrics.sourceToOutputMaxCm),wholeLineOnContour:metrics.sourceToOutputMaxCm<=thresholdCm};}):[];
  if(source.type==="LINE"&&outputMatches.length===0&&linePathCandidates[0]?.metrics.sourceToOutputMaxCm<=thresholdCm){
    disposition=sourceContourCoverage.some(x=>x.wholeLineOnContour)
      ?"source line lies on a CUT/SEW contour and output path, but is not a separate mark segment"
      :"output path covers the source line geometry, but no separate mark segment is present";
  }
  return {source:{entityIndex:source.index,piece:piece.name,sourceLayer:source.layer,sourceType:source.type,representative:rp,geometry:source.type==="POINT"?source.p:source.type==="LINE"?[source.a,source.b]:source.type==="CIRCLE"?{center:source.center,radiusCm:source.radius}:source.points},pieceBinding:{method:containing.length===1?"representative lies within unique source CUT polygon":"nearest source CUT/SEW contour fallback",candidatePieces:distances.slice(0,3).map(x=>({...x,cutBoundaryDistanceCm:round(x.cutBoundaryDistanceCm),sewBoundaryDistanceCm:round(x.sewBoundaryDistanceCm)})),containingCutPieces:containing.map(x=>x.name),receiverBlock:piece.receiverBlock},sourceContourCoverage,output:{entityCountsByTypeLayer:Object.fromEntries(Object.entries(Object.groupBy(candidates,e=>`${e.type}/${e.layer}`)).map(([k,v])=>[k,v.length])),directOrWholeCurveMatches:outputMatches,nearestOutputCandidates:nearest.slice(0,3).map(x=>({entityIndex:x.entity.index,type:x.entity.type,layer:x.entity.layer,distanceCm:round(x.distanceCm)})),linePathCandidates},disposition};
});
const outputInventory=sourcePieces.map(p=>{
  const es=outByBlock.get(p.receiverBlock);
  return {sourcePiece:p.name,receiverBlock:p.receiverBlock,outputEntityCountsByTypeLayer:Object.fromEntries(Object.entries(Object.groupBy(es,e=>`${e.type}/${e.layer}`)).map(([k,v])=>[k,v.length]))};
});
const pointMarks=marks.filter(m=>m.source.sourceType==="POINT");
const pointTargetUse=new Map();
for(const mark of pointMarks)for(const target of mark.output.directOrWholeCurveMatches){const key=`${mark.pieceBinding.receiverBlock}/${target.outputEntityIndex}`;if(!pointTargetUse.has(key))pointTargetUse.set(key,[]);pointTargetUse.get(key).push(mark.source.entityIndex);}
const summary={sourceMarkCount:marks.length,sourceMarkCountsByLayerType:Object.fromEntries(Object.entries(Object.groupBy(sourceMarks,e=>`${e.layer}/${e.type}`)).map(([k,v])=>[k,v.length])),sourcePointMarkCount:pointMarks.length,sourcePointsWithExactlyOneOutputPointCandidate:pointMarks.filter(m=>m.output.directOrWholeCurveMatches.length===1).length,sourcePointsWithMultipleOutputPointCandidates:pointMarks.filter(m=>m.output.directOrWholeCurveMatches.length>1).length,sourcePointsWithoutDistinctOutputPoint:pointMarks.filter(m=>m.output.directOrWholeCurveMatches.length===0).length,uniqueOutputPointRecordsMatched:pointTargetUse.size,outputPointRecordsSharedByMultipleSourcePoints:[...pointTargetUse].filter(([,ids])=>ids.length>1).map(([target,sourceEntityIndices])=>({target,sourceEntityIndices})),lineUniqueGeometryMatchCount:marks.filter(m=>m.source.sourceType==="LINE"&&m.output.directOrWholeCurveMatches.length===1).length,sourceLineCount:marks.filter(m=>m.source.sourceType==="LINE").length,sourceLinesWithoutSeparatePathMatch:marks.filter(m=>m.source.sourceType==="LINE"&&m.output.directOrWholeCurveMatches.length===0).map(m=>m.source.entityIndex),circleWholeCurvePassCount:marks.filter(m=>m.source.sourceType==="CIRCLE"&&m.output.directOrWholeCurveMatches.some(x=>x.wholeCurvePass)).length,sourceCircleCount:marks.filter(m=>m.source.sourceType==="CIRCLE").length,outputEntityKindsWithSourceSemanticLayer:0,markAssignmentsUsingNearestContourFallback:marks.filter(m=>m.pieceBinding.containingCutPieces.length!==1).map(m=>m.source.entityIndex)};
const report={slice:"S632",experiment:`CLO 2026.1.310 DXF-ASTM import, export, and reimport path; output generation ${generation} compared to unchanged S617 Polo M cm-header source`,thresholdCm:thresholdCm,artifacts:Object.fromEntries([...expected].map(([path,digest])=>[path,{sha256:digest}])),method:{pieceBinding:"Source mark representative is assigned to the unique CUT polygon containing it; otherwise nearest CUT/SEW boundary fallback is explicitly labeled. Source CUT/SEW order and prior S617 fine report bind each named piece to its receiver block.",outputCoordinates:"CLO block entities transformed through the hash-pinned output INSERT scale/rotation/translation before comparison.",layerSemantics:"numeric receiver layers are retained as observed; no source role is inferred from a numeric value",limits:"geometric match does not prove semantic identity, industrial-profile conformance, rights, option/grade coverage, or manufacturing use"},sourceMarkInventory:sourceMarks.map(e=>({entityIndex:e.index,type:e.type,layer:e.layer,geometry:e.type==="POINT"?e.p:e.type==="LINE"?{a:e.a,b:e.b}:e.type==="CIRCLE"?{center:e.center,radiusCm:e.radius}:e.type==="POLYLINE"?{closed:e.closed,points:e.points}:null})),outputInventory,summary,marks};
for(const mark of marks)assert(mark.pieceBinding.candidatePieces.every(x=>Number.isFinite(x.cutBoundaryDistanceCm)&&Number.isFinite(x.sewBoundaryDistanceCm)),`nonfinite piece-binding distance for ${mark.source.entityIndex}`);
assert.equal(outputInventory.length,9);
await mkdir(evidenceRoot,{recursive:true});
await writeFile(reportPath,`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify({reportPath,reportSha256:sha(Buffer.from(`${JSON.stringify(report,null,2)}\n`)),summary,sourceInventory:summary.sourceMarkCountsByLayerType,outputInventory},null,2));
