import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
const DxfParser=require("C:/G04-CLO-DXF-Exchange/Tools/open-patterns-astm-parser/node_modules/dxf-parser");
const sourcePath="C:/G04-CLO-DXF-Exchange/S664-getonagain-grainline-profile-trial/Candidate/polo-m-idr-profile-r14-grainline.dxf";
const outputPath="C:/G04-CLO-DXF-Exchange/S667-dgs-design-mode-source-matched/Output/polo-design-autocad.dxf";
const reportPath="C:/G04-CLO-DXF-Exchange/S667-dgs-design-mode-source-matched/Evidence/S667-design-export-comparison.json";
const sha=b=>createHash("sha256").update(b).digest("hex").toUpperCase();
const parse=async path=>{const bytes=await readFile(path);const text=bytes.toString("utf8");return{bytes,text,dxf:new DxfParser().parseSync(text)};};
const src=await parse(sourcePath),out=await parse(outputPath);
const srcInserts=src.dxf.entities.filter(e=>e.type==="INSERT");
const srcPolylines=srcInserts.flatMap(ins=>(src.dxf.blocks[ins.name]?.entities||[]).filter(e=>e.type==="POLYLINE").map(e=>({piece:ins.name,sourceLayer:e.layer,closed:e.shape,vertices:e.vertices.map(v=>[v.x,v.y])})));
const outPolylines=out.dxf.entities.filter(e=>e.type==="POLYLINE").map(e=>({layer:e.layer,closed:e.shape,vertices:e.vertices.map(v=>[v.x,v.y])}));
const pairRows=[];
for(let i=0;i<Math.min(srcPolylines.length,outPolylines.length);i++){
 const a=srcPolylines[i],b=outPolylines[i],bv=[...b.vertices];
 const closureDuplicate=bv.length>1&&bv[0][0]===bv.at(-1)[0]&&bv[0][1]===bv.at(-1)[1];
 if(closureDuplicate)bv.pop();
 const comparable=a.vertices.length===bv.length;
 let rawMax=null,physicalMax=null;
 if(comparable){
  rawMax=0;physicalMax=0;
  for(let j=0;j<a.vertices.length;j++){
   rawMax=Math.max(rawMax,Math.hypot(a.vertices[j][0]-bv[j][0],a.vertices[j][1]-bv[j][1]));
   const dx=a.vertices[j][0]*10-bv[j][0],dy=a.vertices[j][1]*10-bv[j][1];
   physicalMax=Math.max(physicalMax,Math.hypot(dx,dy)/10);
  }
 }
 pairRows.push({index:i,piece:a.piece,sourceLayer:a.sourceLayer,outputLayer:b.layer,sourceClosed:a.closed,outputClosed:b.closed,sourceVertexCount:a.vertices.length,outputVertexCount:b.vertices.length,closureDuplicate,comparedVertexCount:bv.length,comparable,maxRawCoordinateResidual:rawMax,maxPhysicalResidualCm:physicalMax});
}
const sourceLayers=[...new Set(srcPolylines.map(p=>p.sourceLayer))].sort(),outputLayers=[...new Set(out.dxf.entities.map(e=>e.layer))].sort();
const sourceBlockEntityCount=srcInserts.reduce((n,i)=>n+(src.dxf.blocks[i.name]?.entities?.length||0),0);
const maxPhysical=pairRows.reduce((m,r)=>r.maxPhysicalResidualCm===null?m:Math.max(m,r.maxPhysicalResidualCm),0);
const maxRaw=pairRows.reduce((m,r)=>r.maxRawCoordinateResidual===null?m:Math.max(m,r.maxRawCoordinateResidual),0);
const result={
 source:{bytes:src.bytes.length,sha256:sha(src.bytes),insunits:src.dxf.header.$INSUNITS,insertCount:srcInserts.length,insertNames:srcInserts.map(i=>i.name),blockEntityCount:sourceBlockEntityCount,blockCount:Object.keys(src.dxf.blocks).length,polylines:srcPolylines.length,polylineLayers:sourceLayers,profileStrings:srcInserts.map(i=>i.extendedData?.customStrings?.find(s=>s.startsWith("profile="))||null)},
 output:{bytes:out.bytes.length,sha256:sha(out.bytes),insunits:out.dxf.header.$INSUNITS,topLevelEntityCount:out.dxf.entities.length,topLevelTypeCounts:out.dxf.entities.reduce((o,e)=>(o[e.type]=(o[e.type]||0)+1,o),{}),topLevelLayers:outputLayers,insertCount:out.dxf.entities.filter(e=>e.type==="INSERT").length,blockCount:Object.keys(out.dxf.blocks).length,polylines:outPolylines.length},
 comparison:{samePolylineCount:srcPolylines.length===outPolylines.length,allPairedVertexCountsMatchAfterClosureNormalization:pairRows.length===srcPolylines.length&&pairRows.every(r=>r.comparable),allClosedFlagsMatch:pairRows.every(r=>r.sourceClosed===r.outputClosed),maxRawCoordinateResidual:maxRaw,maxPhysicalResidualCm:maxPhysical,toleranceCm:0.001,geometryPassAtTolerance:pairRows.length===srcPolylines.length&&pairRows.every(r=>r.comparable&&r.maxPhysicalResidualCm<=0.001&&r.sourceClosed===r.outputClosed),semanticIdentityPass:srcInserts.length===out.dxf.entities.filter(e=>e.type==="INSERT").length&&Object.keys(src.dxf.blocks).length===Object.keys(out.dxf.blocks).length,layerSemanticsPass:sourceLayers.every(x=>outputLayers.includes(x)),sourcePieceIdentityPresentInOutput:srcInserts.every(i=>out.dxf.entities.some(e=>e.type==="INSERT"&&e.name===i.name)),pairRows},
 disposition:"Diagnostic only: source coordinates are centimeters ($INSUNITS=5); output coordinates are millimeters ($INSUNITS=4); physical residual converts source coordinate values ×10 mm before comparing."
};
await writeFile(reportPath,JSON.stringify(result,null,2)+String.fromCharCode(10),"utf8");
console.log(JSON.stringify(result,null,2));
