import {loadModel,fileLimit,protocol} from './model.mjs';
import {makeView} from '../g09-d01-mannequin/preview/view.mjs';

const $ = id => document.getElementById(id);
const canvas=document.querySelector('canvas'), marker=document.querySelector('.marker');
const file=$('file'), points=$('landmark');
const name = key => key[0].toUpperCase()+key.slice(1).replaceAll('-',' ');
let revision=0;

function status(text,error=false) {
  $('status').textContent=text;
  $('status').classList.toggle('error',error);
}

try {
  const model=await loadModel();
  points.replaceChildren(...model.landmarks.map(role=>new Option(name(role),role)));
  points.value='shoulder-left';
  let accepted=model.neutral();
  const view=makeView(canvas,marker,(ready,message)=>{
    const refocus=!ready && document.activeElement===canvas;
    canvas.hidden=marker.hidden=$('orbit-help').hidden=!ready;
    $('fallback').hidden=ready;
    $('fallback').textContent=message;
    for (const id of ['less','more','reset']) $(id).disabled=!ready;
    if (refocus) $('apply').focus();
  },model.faces);
  function inspect() {
    const role=points.value;
    marker.textContent=name(role);
    $('coordinates').textContent=[...accepted.point(role)].map((p,i)=>`${'XYZ'[i]} ${(1000*p).toFixed(2)} mm`).join(' · ');
    view.update(accepted,role);
  }
  function render() {
    $('measurements').replaceChildren(...['chest','seat'].map(role=>{
      const row=document.createElement('tr');
      const label=document.createElement('th');label.scope='row';label.textContent=name(role);
      const target=document.createElement('td'), achieved=document.createElement('td');
      target.textContent=accepted.requested ? `${accepted.requested[role]} cm` : '—';
      achieved.textContent=`${(100*accepted.measurements[name(role)]).toFixed(2)} cm`;
      row.append(label,target,achieved);
      return row;
    }));
    $('save').disabled=!accepted.requested;
    inspect();
  }
  render();
  status('Neutral mannequin loaded. Enter both body targets.');
  for (const id of ['open','apply','landmark']) $(id).disabled=false;
  $('targets').oninput=()=>{
    ++revision;
    status('Targets edited. The accepted shape is still displayed.');
  };
  $('targets').onsubmit=event=>{
    event.preventDefault();
    ++revision;
    try {
      const result=model.solve({protocol,chest:$('chest').valueAsNumber,seat:$('seat').valueAsNumber});
      accepted=result;
      render();
      status('Body targets applied.');
    } catch (error) {
      status(`${error.message} Accepted shape kept.`,true);
    }
  };
  $('open').onclick=()=>file.click();
  file.onchange=async()=>{
    const input=file.files[0];
    file.value='';
    if (!input) return;
    const current=++revision;
    status('Checking GLB…');
    try {
      if (input.size>fileLimit) throw new Error('GLB exceeds the 4 MiB file limit.');
      const result=model.open(await input.arrayBuffer());
      if (current!==revision) return;
      accepted=result;
      for (const role of ['chest','seat']) $(role).value=result.requested[role];
      render();
      status(`Opened ${input.name}.`);
    } catch (error) {
      if (current===revision) status(`${error.message} Accepted shape kept.`,true);
    }
  };
  $('save').onclick=()=>{
    const url=URL.createObjectURL(new Blob([model.encode(accepted)],{type:'model/gltf-binary'}));
    const a=document.createElement('a'); a.href=url; a.download='D02-body-measurements.glb';
    a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  points.onchange=inspect;
  $('reset').onclick=view.reset;
  $('less').onclick=()=>view.scale(.89);
  $('more').onclick=()=>view.scale(1.12);
} catch (error) {
  canvas.hidden=true;
  $('fallback').hidden=false;
  $('fallback').textContent='Local mannequin unavailable.';
  status(error.message,true);
}
