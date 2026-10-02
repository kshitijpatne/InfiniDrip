import { GARMENTS, STANDARD_M, defaultGarmentOptions } from '../../../../src/drafting';
import { compileTechnicalFlatLiveView } from '../../../../src/render/technical-flat-live';
const recipe=GARMENTS.find(x=>x.name==='woven-shirt')!; const block=recipe.draft(STANDARD_M,defaultGarmentOptions(recipe.options??[]));
for(const kind of ['FRONT_FLAT','BACK_FLAT'] as const){
 const {view}=compileTechnicalFlatLiveView({recipe,block,revisionId:'live-draft:woven-shirt:14:14',kind,placements:[],colorHex:'#334455',texture:'woven',shine:.15});
 console.log('\nFACE',kind);
 for(const p of view!.primitives.filter(p=>p.kind==='path'&&['outerStand','innerStand','upperCollar','underCollar'].some(r=>p.id.includes(`component:${r}:outline`)))){
  console.log('\n',p.id,p.source.sourceId,p.sourceEdgeIds);
  let ei=-1;let cur:any; for(const c of p.commands){if(c.op==='move'){ei++;cur=c.point;console.log(' edge',p.sourceEdgeIds?.[ei]);}else if(c.op==='line'){console.log(' ',cur.x.toFixed(3),cur.y.toFixed(3),'->',c.point.x.toFixed(3),c.point.y.toFixed(3));cur=c.point}else if(c.op==='cubic'){console.log(' cubic',cur.x.toFixed(3),cur.y.toFixed(3),'->',c.point.x.toFixed(3),c.point.y.toFixed(3));cur=c.point}}
 }
}
