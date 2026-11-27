import {controlLabels, fileLimit, loadModel} from './model.mjs';
import {makeView} from './view.mjs';

const $ = name => document.getElementById(name);
const select = $('shape'), points = $('landmark'), file = $('file');
const canvas = document.querySelector('canvas'), marker = document.querySelector('.marker');
const number = x => `${(1000*x).toFixed(2)} mm`;
const formatPoint = x => x.replaceAll('-', ' ').replace(/^./,c=>c.toUpperCase());
let revision=0;
function status(text,error=false) {
  $('status').textContent=text;
  $('status').classList.toggle('error',error);
}
function options(node, labels) {
  node.replaceChildren(...labels.map((label,i)=>new Option(label,i)));
}
function table(id, rows) {
  $(id).replaceChildren(...rows.map(([label,value])=>{
    const row=document.createElement('div'), dt=document.createElement('dt'), dd=document.createElement('dd');
    dt.textContent=label; dd.textContent=value; row.append(dt,dd); return row;
  }));
}
const low = ['Shorter torso','Narrower shoulders','Smaller chest','Smaller seat'];
const high = ['Longer torso','Broader shoulders','Larger chest','Larger seat'];
function configuration(w,i) {
  const active=w.flatMap((v,j)=> v ? [v<0 ? low[j] : high[j]] : []);
  if (active.length===0) return 'Neutral';
  if (active.length===1) return active[0];
  const short=w.map((v,j)=>v<0 ? ['Short','Narrow','Small','Small'][j] : ['Long','Broad','Large','Large'][j]);
  const group=w.every(v=>Math.abs(v)===1) ? 'Full' : `Blend ${i-24}`;
  return `${group} · ${short.join(' / ')}`;
}

try {
  const model=await loadModel();
  const names=model.states.map(configuration);
  options(select,names);
  select.title='Configurations list torso, shoulders, chest and seat in that order.';
  options(points,model.landmarks.map(formatPoint));
  points.value=String(model.landmarks.indexOf('shoulder-left'));
  let index, pose;
  const view=makeView(canvas,marker,(ready,message)=>{
    const refocus=!ready && document.activeElement===canvas;
    canvas.hidden=marker.hidden=$('orbit-help').hidden=!ready;
    $('fallback').hidden=ready;
    $('fallback').textContent=message;
    for (const id of ['less','more','reset']) $(id).disabled=!ready;
    if (refocus) select.focus();
  },model.faces);
  function inspect() {
    const key=model.landmarks[Number(points.value)];
    marker.textContent=formatPoint(key);
    $('coordinates').textContent=[...pose.point(key)].map((x,i)=>`${'XYZ'[i]} ${number(x)}`).join(' · ');
    view.update(pose,key);
  }
  function apply(next) {
    const fresh=model.shape(next);
    index=next; pose=fresh;
    select.value=String(index);
    table('weights',model.states[index].map((w,i)=>[controlLabels[i],w>0 ? `+${w}` : String(w)]));
    table('measurements',Object.entries(pose.measurements).map(([k,m])=>[k,number(m)]));
    inspect();
  }
  apply(0);
  status('Neutral shape loaded.');
  [select,points,$('open'),$('save')].forEach(e=>e.disabled=false);
  select.onchange=()=>{
    revision++;
    apply(Number(select.value));
    status('Shape updated.');
  };
  points.onchange=inspect;
  $('reset').onclick=view.reset;
  $('more').onclick=()=>view.scale(1.12);
  $('less').onclick=()=>view.scale(.89);
  $('open').onclick=()=>file.click();
  file.onchange=async()=>{
    const input=file.files[0];
    file.value='';
    if (!input) return;
    const current=++revision;
    status('Checking GLB…');
    try {
      if (input.size>fileLimit) throw new Error('GLB exceeds the 4 MiB file limit.');
      const next=model.open(await input.arrayBuffer());
      if (current!==revision) return;
      apply(next);
      status(`Opened ${input.name}.`);
    } catch(error) {
      if (current===revision) status(`${error.message} Current shape kept.`,true);
    }
  };
  $('save').onclick=()=>{
    const url=URL.createObjectURL(new Blob([model.encode(index)],{type:'model/gltf-binary'}));
    const a=document.createElement('a');
    a.download='D01-'+(index===0?'neutral':`shape-${index}`)+'.glb';
    a.href=url;
    a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
} catch(error) {
  canvas.hidden=true;
  $('fallback').hidden=false;
  $('fallback').textContent='Local mannequin unavailable.';
  status(error.message,true);
}
