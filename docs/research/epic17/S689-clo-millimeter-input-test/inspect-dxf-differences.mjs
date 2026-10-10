import { readFile, writeFile } from "node:fs/promises";
const sourcePath="C:/G04-CAD-Interchange/S683-current-package-clo-roundtrip/polo-default-M.dxf";
const normalizedReturnPath="C:/G04-CAD-Interchange/S689-clo-millimeter-input-test/Evidence/polo-default-M-mm-clo-standard-return-normalized-cm.dxf";
const manifestPath="C:/G04-CAD-Interchange/S683-current-package-clo-roundtrip/polo-default-M.manifest.json";
const outPath="C:/G04-CAD-Interchange/S689-clo-millimeter-input-test/Evidence/S689-difference-localization.json";
const parse=async(path)=>{
  const lines=(await readFile(path,"utf8")).split(/\r?\n/); if(lines.at(-1)==="") lines.pop();
  const pairs=[]; for(let i=0;i<lines.length;i+=2) pairs.push([Number(lines[i]),lines[i+1]]);
  const sections=new Map(); const blocks=new Map(); let section=""; let block=null;
  for(let i=0;i<pairs.length;){
    const [code,value]=pairs[i];
    if(code===0&&value==="SECTION"&&pairs[i+1]?.[0]===2){section=pairs[i+1][1];sections.set(section,[]);i+=2;continue;}
    if(code===0&&value==="ENDSEC"){section="";block=null;i++;continue;}
    if(section==="BLOCKS"&&code===0&&value==="BLOCK"){
      let end=i+1;while(end<pairs.length&&pairs[end][0]!==0)end++;
      const name=pairs.slice(i+1,end).find(([c])=>c===2)?.[1]; block={name,entities:[]}; blocks.set(name,block); i=end;continue;
    }
    if(section==="BLOCKS"&&code===0&&value==="ENDBLK"){block=null;i++;continue;}
    if(code!==0||["SEQEND","EOF","ENDSEC"].includes(value)){i++;continue;}
    const type=value;let end=i+1;while(end<pairs.length&&pairs[end][0]!==0)end++;
    const fields=pairs.slice(i+1,end);const get=c=>fields.find(([k])=>k===c)?.[1];
    const entity={type,layer:get(8)??"(missing)",fields};
    if(type==="POLYLINE"){
      entity.vertices=[];entity.closed=(Number(get(70)??0)&1)===1;i=end;
      while(pairs[i]?.[0]===0&&pairs[i][1]==="VERTEX"){
        let stop=i+1;while(stop<pairs.length&&pairs[stop][0]!==0)stop++;
        const vf=pairs.slice(i+1,stop);entity.vertices.push({x:Number(vf.find(([c])=>c===10)?.[1]),y:Number(vf.find(([c])=>c===20)?.[1]),bulge:Number(vf.find(([c])=>c===42)?.[1]??0)});i=stop;
      }
      if(pairs[i]?.[0]===0&&pairs[i][1]==="SEQEND")i++;
    } else if(type==="LWPOLYLINE"){
      entity.vertices=[];for(let k=0;k<fields.length;k++)if(fields[k][0]===10&&fields[k+1]?.[0]===20)entity.vertices.push({x:Number(fields[k][1]),y:Number(fields[k+1][1]),bulge:Number(fields[k+2]?.[0]===42?fields[k+2][1]:0)});entity.closed=(Number(get(70)??0)&1)===1;i=end;
    } else i=end;
    if(section&&sections.has(section))sections.get(section).push(entity);if(block)block.entities.push(entity);
  }
  return {sections,blocks};
};
const src=await parse(sourcePath), ret=await parse(normalizedReturnPath), manifest=JSON.parse(await readFile(manifestPath,"utf8"));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const segmentDistance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy,t=den?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/den)):0;return distance(p,{x:a.x+dx*t,y:a.y+dy*t});};
const segs=path=>{const v=path.vertices??[],n=v.length-1+(path.closed&&v.length>2?1:0),s=[];for(let i=0;i<n;i++)s.push([v[i],v[(i+1)%v.length]]);return s;};
const outline=src.sections.get("ENTITIES").filter(e=>e.type==="POLYLINE"&&["CUT","SEW"].includes(e.layer));
const missed=[];
const pieceResults=manifest.pieces.map((piece,i)=>{
  const block=ret.blocks.get(`${i}_M`);if(!block)throw new Error(`missing ${i}_M`);
  const paths=block.entities.filter(e=>e.vertices?.length>=2);
  const role=(sourcePath,role)=>{
    const sorted=paths.map(p=>({p,dist:Math.max(...sourcePath.vertices.map(v=>Math.min(...segs(p).map(([a,b])=>segmentDistance(v,a,b)))))})).sort((a,b)=>a.dist-b.dist);
    const chosen=sorted[0].p;
    const failures=sourcePath.vertices.map((v,index)=>({index,x:v.x,y:v.y,minDistance:Math.min(...segs(chosen).map(([a,b])=>segmentDistance(v,a,b))),previous:sourcePath.vertices[(index-1+sourcePath.vertices.length)%sourcePath.vertices.length],next:sourcePath.vertices[(index+1)%sourcePath.vertices.length]})).filter(v=>v.minDistance>0.001);
    missed.push(...failures.map(f=>({piece:piece.id,role,...f})));
    return {role,sourceVertices:sourcePath.vertices.length,returnVertices:chosen.vertices.length,returnLayer:chosen.layer,maxSourceVertexDistance:Math.max(...sourcePath.vertices.map(v=>Math.min(...segs(chosen).map(([a,b])=>segmentDistance(v,a,b))))),missedVertices:failures};
  };
  return {piece:piece.id,cut:role(outline[i*2],"CUT"),sew:role(outline[i*2+1],"SEW")};
});
const report={sourcePath,normalizedReturnPath,gateCm:0.001,method:"Exact source-vertex-to-return-segment distance on matching manifest piece blocks; pairwise source/return vertex counts; source units converted only by declared mm-to-cm normalization.",pieceResults,missedSourceVertices:missed};
await writeFile(outPath,`${JSON.stringify(report,null,2)}\n`);console.log(JSON.stringify({outPath,pieces:pieceResults.filter(p=>p.cut.maxSourceVertexDistance>0.001||p.sew.maxSourceVertexDistance>0.001),missedSourceVertices:missed},null,2));
