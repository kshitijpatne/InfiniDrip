import { GARMENTS, STANDARD_M, defaultGarmentOptions } from '../../../../src/drafting';
import { compileTechnicalFlatLiveView } from '../../../../src/render/technical-flat-live';
import type { TechnicalFlatPrimitive } from '../../../../src/render/technical-flat';
const recipe=GARMENTS.find(x=>x.name==='woven-shirt')!; const block=recipe.draft(STANDARD_M,defaultGarmentOptions(recipe.options??[]));
const key=(p:{x:number;y:number})=>`${Number(p.x.toFixed(4)).toString()},${Number(p.y.toFixed(4)).toString()}`;
for(const kind of ['FRONT_FLAT','BACK_FLAT'] as const){
 const {view,colorway}=compileTechnicalFlatLiveView({recipe,block,revisionId:'live-draft:woven-shirt:14:14',kind,placements:[],colorHex:'#334455',texture:'woven',shine:.15});
 console.log('\nFACE',kind,'targets',colorway?.targetRoleIds);
 for(const role of ['outerStand','upperCollar','underCollar']){
  const paths=view!.primitives.filter((p):p is Extract<TechnicalFlatPrimitive,{kind:'path'}>=>p.kind==='path'&&p.layer==='GARMENT_SILHOUETTE'&&p.source.sourceId.includes(`pattern:woven-shirt:role:${role}`)||p.kind==='path'&&p.layer==='GARMENT_SILHOUETTE'&&p.source.sourceId.includes(`view:woven-shirt:role:${role}:`));
  const edges:{owner:string;src:string|undefined;from:{x:number;y:number};to:{x:number;y:number}}[]=[];
  for(const p of paths){let index=-1,from:any=null,to:any=null; for(const c of p.commands){if(c.op==='move'){if(from&&to)edges.push({owner:p.id,src:p.sourceEdgeIds?.[index],from,to});index++;from=c.point;to=c.point}else if(c.op==='line'||c.op==='cubic'){to=c.point}else if(c.op==='close'){if(from&&to)edges.push({owner:p.id,src:p.sourceEdgeIds?.[index],from:to,to:from});from=null;to=null}} if(from&&to)edges.push({owner:p.id,src:p.sourceEdgeIds?.[index],from,to})}
  const prims=paths.filter(p=>p.colorwayBoundaryOnly!==true); const reflected=new Set(paths.filter(p=>p.id.endsWith(':attached-fold-reflection')).map(p=>p.source.sourceId));
  const excluded=new Set<string>(); for(const p of prims){const rf=paths.find(q=>q.id===`${p.id}:attached-fold-reflection`&&q.source.sourceId===p.source.sourceId&&q.source.revisionId===p.source.revisionId);if(rf?.sourceEdgeIds)for(const id of p.sourceEdgeIds??[])if(!rf.sourceEdgeIds.includes(id))excluded.add(`${p.id}\0${id}`)}
  const selected=edges.filter(e=>!e.src||!excluded.has(`${e.owner}\0${e.src}`));
  const adj=new Map<string,number[]>(); selected.forEach((e,i)=>{for(const k of [key(e.from),key(e.to)])adj.set(k,[...(adj.get(k)??[]),i])});
  const used=new Set<number>(),cycles:number[]=[]; for(let seed=0;seed<selected.length;seed++){if(used.has(seed))continue;let cur=selected[seed]!.to,start=selected[seed]!.from,count=1;used.add(seed);let safety=0;while(key(cur)!==key(start)&&safety++<selected.length+1){const next=(adj.get(key(cur))??[]).find(i=>!used.has(i));if(next===undefined)break;const e=selected[next]!;cur=key(e.from)===key(cur)?e.to:e.from;used.add(next);count++}cycles.push(count)}
  console.log('ROLE',role,'paths',paths.length,'edges',edges.length,'selectedEdges',selected.length,'degreeSet',[...new Set([...adj.values()].map(x=>x.length))],'cycles',cycles,'excluded', [...excluded]);
  for (const [node, incident] of adj) if (incident.length !== 2) console.log('NODE',node,'degree',incident.length,incident.map(index=>{const edge=selected[index]!;return [edge.owner.split(':').slice(-2).join(':'),edge.src?.split(':').at(-1),key(edge.from),key(edge.to)]}));
  console.log(selected.map(e=>[e.owner.split(':').slice(-2).join(':'),e.src?.split(':').at(-1),key(e.from),key(e.to)]));
 }
}
