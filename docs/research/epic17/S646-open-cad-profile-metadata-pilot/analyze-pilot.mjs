import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
const root="C:/G04-CLO-DXF-Exchange/S646-open-cad-profile-metadata-pilot";
const files={input:root+"/Input/polo-m-idr-profile-r14.dxf",first:root+"/Output/polo-m-idr-profile-r14-first.dxf",second:root+"/Output/polo-m-idr-profile-r14-second.dxf"};
const revision="ef28519c21314eed0280ed4e6982849284da16b6";
const parse=t=>{const l=t.replace(/\r\n/gu,"\n").trimEnd().split("\n");assert.equal(l.length%2,0);return Array.from({length:l.length/2},(_,i)=>[+l[2*i].trim(),l[2*i+1].trim()])};
const bounds=(p,n)=>{for(let i=0;i<p.length-1;i++)if(p[i][0]===0&&p[i][1]==="SECTION"&&p[i+1][1]===n){const e=p.findIndex((x,j)=>j>i+1&&x[0]===0&&x[1]==="ENDSEC");assert(e>=0);return{i,e}}return null};
const val=(p,c)=>p.find(x=>x[0]===c)?.[1];
const num=x=>Number(x);
function entityRecord(type,fields,vertices=[]){
 const layer=val(fields,8)??vertices.map(v=>val(v,8)).find(Boolean)??"(none)";
 if(type==="POLYLINE"||type==="LWPOLYLINE"){
   const points=type==="POLYLINE"?vertices.map(v=>[num(val(v,10)),num(val(v,20))]):[];
   if(type==="LWPOLYLINE"){const xs=fields.filter(x=>x[0]===10).map(x=>num(x[1]));const ys=fields.filter(x=>x[0]===20).map(x=>num(x[1]));points.push(...xs.map((x,i)=>[x,ys[i]]))}
   return{type,layer,closed:(num(val(fields,70)??"0")&1)===1,points};
 }
 if(type==="LINE")return{type,layer,points:[[10,20],[11,21]].map(([x,y])=>[num(val(fields,x)),num(val(fields,y))])};
 if(type==="CIRCLE")return{type,layer,center:[num(val(fields,10)),num(val(fields,20))],radius:num(val(fields,40))};
 if(type==="POINT")return{type,layer,point:[num(val(fields,10)),num(val(fields,20))]};
 return null;
}
function blocks(p){
 const s=bounds(p,"BLOCKS");assert(s);const out=new Map();
 for(let i=s.i+2;i<s.e;){
   if(p[i][0]!==0||p[i][1]!=="BLOCK"){i++;continue}
   i++;const head=[];while(i<s.e&&p[i][0]!==0)head.push(p[i++]);const name=val(head,2);const ents=[];
   while(i<s.e&&!(p[i][0]===0&&p[i][1]==="ENDBLK")){
     const type=p[i++][1];const fields=[];
     while(i<s.e&&p[i][0]!==0)fields.push(p[i++]);
     if(type==="POLYLINE"){
       const verts=[];
       while(i<s.e&&p[i][0]===0&&p[i][1]==="VERTEX"){
         i++;const v=[];while(i<s.e&&p[i][0]!==0)v.push(p[i++]);verts.push(v);
       }
       if(p[i]?.[0]===0&&p[i][1]==="SEQEND"){i++;while(i<s.e&&p[i][0]!==0)i++}
       const rec=entityRecord(type,fields,verts);if(rec)ents.push(rec);
     }else{const rec=entityRecord(type,fields);if(rec)ents.push(rec)}
   }
   if(p[i]?.[1]==="ENDBLK"){i++;while(i<s.e&&p[i][0]!==0)i++}
   if(name?.startsWith("IDR_POLO_"))out.set(name,ents);
 }
 return out;
}
const loaded={};for(const [k,f]of Object.entries(files))loaded[k]=parse((await readFile(f)).toString("utf8"));
const maps=Object.fromEntries(Object.entries(loaded).map(([k,p])=>[k,blocks(p)]));
const category=map=>{const c={};for(const [name,es]of map)for(const e of es){const k=e.type+"/"+e.layer;c[k]=(c[k]??0)+1}return Object.fromEntries(Object.entries(c).sort(([a],[b])=>a.localeCompare(b)))};
const residual=(a,b)=>{if(a.type!==b.type||a.layer!==b.layer)return Infinity;const pairs=[];if(a.points)pairs.push(...a.points.map((pt,i)=>pt.map((x,j)=>Math.abs(x-(b.points?.[i]?.[j]??Infinity)))));if(a.center)pairs.push(a.center.map((x,i)=>Math.abs(x-(b.center?.[i]??Infinity))),[Math.abs(a.radius-(b.radius??Infinity))]);if(a.point)pairs.push(a.point.map((x,i)=>Math.abs(x-(b.point?.[i]??Infinity))));return Math.max(0,...pairs.flat())};
const compare=(a,b)=>{assert.deepEqual([...a.keys()].sort(),[...b.keys()].sort());let max=0,count=0;for(const name of a.keys()){assert.equal(a.get(name).length,b.get(name).length,name);for(let i=0;i<a.get(name).length;i++){const d=residual(a.get(name)[i],b.get(name)[i]);max=Math.max(max,d);assert(d<=0.001,`${name} entity ${i} differs by ${d} cm`);count++}}return{pieceBlocks:a.size,entities:count,maxCoordinateDeltaCm:max,allWithin001cm:true}};
const geometries={inputToFirst:compare(maps.input,maps.first),firstToSecond:compare(maps.first,maps.second)};
const metadata=p=>{const variable=name=>{const i=p.findIndex((x,j)=>x[0]===9&&x[1]===name&&p[j+1]?.[0]===1);return i<0?null:p[i+1][1]};return{appid:p.filter(x=>x[0]===1001&&x[1]==="INFINIDRIP").length,profile:p.filter(x=>x[0]===1000&&x[1]==="profile=idr-pattern-exchange/1").length,revision:p.filter(x=>x[0]===1000&&x[1]==="revision="+revision).length,pieces:p.filter(x=>x[0]===1000&&x[1].startsWith("piece=")).map(x=>x[1]).sort(),units:p.some((x,i)=>x[0]===9&&x[1]==="$INSUNITS"&&p[i+1]?.[0]===70&&p[i+1][1]==="5"),version:variable("$ACADVER")}};
for(const [key,p]of Object.entries(loaded)){assert.equal(metadata(p).appid,9,key);assert.equal(metadata(p).profile,9,key);assert.equal(metadata(p).revision,9,key);assert.equal(metadata(p).pieces.length,9,key);assert.equal(metadata(p).units,true,key);if(key!=="input")assert.equal(metadata(p).version,"AC1014",key)}
assert.equal(maps.input.size,9);assert.equal(maps.first.size,9);assert.deepEqual(category(maps.input),category(maps.first));assert.deepEqual(category(maps.first),category(maps.second));
const result={slice:"S646",categories:category(maps.input),geometries,metadata:Object.fromEntries(Object.entries(loaded).map(([k,p])=>[k,metadata(p)])),limits:["Polo M only","generic DXF application profile pilot; no AAMA/ASTM claim","all-seven/options/grades/rendered output still pending"]};
await writeFile(root+"/Evidence/profile-geometry-analysis.json",JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify(result,null,2));
