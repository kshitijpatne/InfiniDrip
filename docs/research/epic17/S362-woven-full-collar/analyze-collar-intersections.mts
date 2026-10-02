import { GARMENTS, STANDARD_M, defaultGarmentOptions } from '../../../../src/drafting';
import { compileTechnicalFlatLiveView } from '../../../../src/render/technical-flat-live';
const recipe=GARMENTS.find(x=>x.name==='woven-shirt')!; const block=recipe.draft(STANDARD_M,defaultGarmentOptions(recipe.options??[]));
const cross=(a:any,b:any,c:any)=> (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const close=(a:any,b:any)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-5;
for(const kind of ['FRONT_FLAT','BACK_FLAT'] as const){
 const {view}=compileTechnicalFlatLiveView({recipe,block,revisionId:'live-draft:woven-shirt:14:14',kind,placements:[],colorHex:'#334455',texture:'woven',shine:.15});
 const segs:any[]=[];
 for(const p of view!.primitives.filter((p:any)=>p.kind==='path'&&p.id.includes(':component:')&&['outerStand','innerStand','upperCollar','underCollar'].some(r=>p.id.includes(`component:${r}:outline`)))){
  let ei=-1,cur:any; for(const c of p.commands){if(c.op==='move'){ei++;cur=c.point}else if(c.op==='line'){segs.push({id:p.id,edge:p.sourceEdgeIds?.[ei],a:cur,b:c.point});cur=c.point}else if(c.op==='cubic'){let prior=cur;for(let i=1;i<=32;i++){const t=i/32,u=1-t;const point={x:u**3*cur.x+3*u*u*t*c.control1.x+3*u*t*t*c.control2.x+t**3*c.point.x,y:u**3*cur.y+3*u*u*t*c.control1.y+3*u*t*t*c.control2.y+t**3*c.point.y};segs.push({id:p.id,edge:p.sourceEdgeIds?.[ei],a:prior,b:point});prior=point}cur=c.point}}
 }
 const crossings:any[]=[];const overlaps:any[]=[];
 for(let i=0;i<segs.length;i++)for(let j=i+1;j<segs.length;j++){
  const a=segs[i]!,b=segs[j]!;if(a.id===b.id)continue;
  const r={x:a.b.x-a.a.x,y:a.b.y-a.a.y},s={x:b.b.x-b.a.x,y:b.b.y-b.a.y};const den=r.x*s.y-r.y*s.x;
  const q={x:b.a.x-a.a.x,y:b.a.y-a.a.y};
  if(Math.abs(den)<1e-8){if(Math.abs(q.x*r.y-q.y*r.x)<1e-7){const rr=r.x*r.x+r.y*r.y; if(rr){const t0=(q.x*r.x+q.y*r.y)/rr;const t1=t0+(s.x*r.x+s.y*r.y)/rr;const lo=Math.max(0,Math.min(t0,t1)),hi=Math.min(1,Math.max(t0,t1));if(hi-lo>1e-4)overlaps.push({a:[a.id.split(':').slice(-2).join(':'),a.edge?.split(':').at(-1)],b:[b.id.split(':').slice(-2).join(':'),b.edge?.split(':').at(-1)],length:(hi-lo)*Math.sqrt(rr)})}}continue}
  const t=(q.x*s.y-q.y*s.x)/den,u=(q.x*r.y-q.y*r.x)/den;
  if(t>=-1e-8&&t<=1+1e-8&&u>=-1e-8&&u<=1+1e-8){const pt={x:a.a.x+t*r.x,y:a.a.y+t*r.y};const endpointA=t<1e-5||t>1-1e-5,endpointB=u<1e-5||u>1-1e-5;if(endpointA&&endpointB&&close(pt,t<.5?a.a:a.b)&&close(pt,u<.5?b.a:b.b))continue;crossings.push({at:[+pt.x.toFixed(3),+pt.y.toFixed(3)],a:[a.id.split(':').slice(-2).join(':'),a.edge?.split(':').at(-1)],b:[b.id.split(':').slice(-2).join(':'),b.edge?.split(':').at(-1)],t:+t.toFixed(3),u:+u.toFixed(3)})}
 }
 console.log(JSON.stringify({face:kind,segments:segs.length,crossings:crossings.slice(0,80),crossingCount:crossings.length,overlapCount:overlaps.length,overlaps:overlaps.sort((a,b)=>b.length-a.length).slice(0,30)},null,2));
}
