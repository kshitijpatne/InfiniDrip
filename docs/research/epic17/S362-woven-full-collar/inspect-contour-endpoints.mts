import { GARMENTS, STANDARD_M, defaultGarmentOptions } from '../../../../src/drafting';
import { compileTechnicalFlatLiveView } from '../../../../src/render/technical-flat-live';
const recipe = GARMENTS.find((item) => item.name === 'woven-shirt')!;
const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
for (const kind of ['FRONT_FLAT','BACK_FLAT'] as const) {
  const {view,colorway,issues}=compileTechnicalFlatLiveView({recipe,block,revisionId:'live-draft:woven-shirt:14:14',kind,placements:[],colorHex:'#334455',texture:'woven',shine:0.15});
  console.log('\nFACE',kind,'issues',issues.map(x=>x.message));
  for (const roleId of ['outerStand','upperCollar','underCollar']) {
    const ps=view!.primitives.filter(p=>p.kind==='path' && (p.source.sourceId.includes(`pattern:woven-shirt:role:${roleId}`) || p.source.sourceId.includes(`view:woven-shirt:role:${roleId}:`)) && p.layer==='GARMENT_SILHOUETTE');
    const adj=new Map<string, {id:string; edge:string; at:'from'|'to'}[]>();
    const key=(p:any)=>`${p.x.toFixed(4)},${p.y.toFixed(4)}`;
    for (const p of ps as any[]) {
      let g:any[]=[]; for(const c of p.commands){ if(c.op==='move'&&g.length){g.push(c); const pts=g.filter(x=>x.point).map(x=>x.point);const a=pts[0],b=pts.at(-1);for(const [at,pt] of [['from',a],['to',b]] as const){const k=key(pt);adj.set(k,[...(adj.get(k)??[]),{id:p.id,edge:p.sourceEdgeIds?.[g.filter(x=>x.op==='move').length-1]??p.source.sourceId,at}])};g=[c]} else g.push(c)} if(g.length){const pts=g.filter(x=>x.point).map(x=>x.point);const a=pts[0],b=pts.at(-1);for(const [at,pt] of [['from',a],['to',b]] as const){const k=key(pt);adj.set(k,[...(adj.get(k)??[]),{id:p.id,edge:p.sourceEdgeIds?.[g.filter(x=>x.op==='move').length-1]??p.source.sourceId,at}])}}
    }
    console.log('ROLE',roleId,'allmatching',view!.primitives.filter(p=>p.kind==='path' && p.source.sourceId.includes(roleId)).map(p=>[p.id,p.layer,p.source.sourceId,p.sourceEdgeIds])); console.log('ROLEPATHS',ps.map(p=>[p.id,p.layer,p.source.sourceId,p.sourceEdgeIds])); console.log('ROLE',roleId,'paths',ps.length,'endpointNodes',adj.size,'degrees', [...new Set([...adj.values()].map(x=>x.length))]);
    for(const [k,v] of adj) if(v.length!==2) console.log(' DEG',k,'degree',v.length,JSON.stringify(v));
    for(const p of ps as any[]) console.log(' PATH',p.colorwayBoundaryOnly?'BOUNDARY':'OUTLINE',p.id,p.sourceEdgeIds, p.commands.filter((c:any)=>c.op==='move'||c.op==='line').map((c:any)=>[c.op,c.point.x.toFixed(4),c.point.y.toFixed(4)]));
  }
}
