import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dir = fileURLToPath(new URL('./', import.meta.url));
const s394Dir = fileURLToPath(new URL('../S394-polo-h-glyph-offset/', import.meta.url));
const matrix = JSON.parse(await readFile(join(s394Dir, 'polo-keyed-marker-trial-matrix.json'), 'utf8'));
assert.equal(matrix.rows.length, 17);
const directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const radii = [0.3,0.45,0.6,0.75,1,1.25,1.5,2];
const candidates = directions.flatMap(([x,y]) => radii.map((r) => ({ dx: x*r/Math.hypot(x,y), dy: y*r/Math.hypot(x,y) })));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on('pageerror', (error) => browserErrors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
const rows = [];
try {
  for (const row of matrix.rows) {
    const svg = await readFile(join(s394Dir, 'rendered', `${row.caseId}-collar-point.svg`), 'utf8');
    assert.ok(svg.includes(`data-revision-id="${row.revisionId}"`));
    await page.setContent(svg, { waitUntil: 'load' });
    const result = await page.evaluate(({ candidates }) => {
      const doc = document, root = doc.querySelector('svg'), paper = doc.querySelector('rect[data-technical-flat-paper]');
      const pb = paper.getBBox(), frame = { minX:pb.x,minY:pb.y,maxX:pb.x+pb.width,maxY:pb.y+pb.height };
      const gapBox = (a,b) => Math.hypot(Math.max(0,a.minX-b.maxX,b.minX-a.maxX),Math.max(0,a.minY-b.maxY,b.minY-a.maxY));
      const group = doc.querySelector('g[data-pom-key="FG"]'), text = group?.querySelector('text');
      if (!group || !text) throw new Error('missing FG marker');
      const x=Number(text.getAttribute('x')), y=Number(text.getAttribute('y'));
      const targetIds=(group.getAttribute('data-callout-target')??'').split('|');
      const paths=[...doc.querySelectorAll('path[data-entity-id]')].filter((p)=>(p.getAttribute('data-source-id')??'').startsWith('pattern:polo:')&&!p.hasAttribute('data-colorway-fill-for')&&!targetIds.includes(p.getAttribute('data-entity-id'))).map((p)=>{
        const len=p.getTotalLength(), n=Math.max(1,Math.ceil(len/0.02)), points=[];
        for(let i=0;i<=n;i++){const q=p.getPointAtLength(len*i/n);points.push({x:q.x,y:q.y});}
        return {id:p.getAttribute('data-entity-id'),sourceId:p.getAttribute('data-source-id'),stroke:Number.parseFloat(p.getAttribute('stroke-width')??'0')/2,points};
      });
      const marks=[...doc.querySelectorAll('[data-mark-kind]')].filter((m)=>!targetIds.includes(m.getAttribute('data-entity-id'))).map((m)=>{const b=m.getBBox();return{id:m.getAttribute('data-entity-id'),sourceId:m.getAttribute('data-source-id')??m.closest('[data-source-id]')?.getAttribute('data-source-id'),box:{minX:b.x,minY:b.y,maxX:b.x+b.width,maxY:b.y+b.height}};});
      const otherText=[...doc.querySelectorAll('text')].filter((n)=>n!==text).map((n)=>{const b=n.getBBox();return{id:n.closest('[data-entity-id]')?.getAttribute('data-entity-id')??n.getAttribute('data-label-for')??'unidentified-text',text:n.textContent,box:{minX:b.x,minY:b.y,maxX:b.x+b.width,maxY:b.y+b.height}};});
      const ring=group.querySelector('circle'), cx=Number(ring.getAttribute('cx')),cy=Number(ring.getAttribute('cy')),r=Number(ring.getAttribute('r'));
      const measured=candidates.map((c)=>{
        const dx=Number(c.dx.toFixed(6)),dy=Number(c.dy.toFixed(6)); text.setAttribute('x',String(x+dx));text.setAttribute('y',String(y+dy));
        const b=text.getBBox(), s=Number.parseFloat(text.getAttribute('stroke-width')??'0')/2;
        const glyph={minX:b.x-s,minY:b.y-s,maxX:b.x+b.width+s,maxY:b.y+b.height+s};
        const pathGap=(p)=>{let best=Infinity;for(const q of p.points){const px=Math.max(0,glyph.minX-q.x,q.x-glyph.maxX),py=Math.max(0,glyph.minY-q.y,q.y-glyph.maxY);best=Math.min(best,Math.hypot(px,py)-p.stroke);}return best;};
        const pg=paths.map((p)=>({...p,clearanceCm:pathGap(p)})).sort((a,b)=>a.clearanceCm-b.clearanceCm)[0]??null;
        const mg=marks.map((m)=>({...m,clearanceCm:gapBox(glyph,m.box)})).sort((a,b)=>a.clearanceCm-b.clearanceCm)[0]??null;
        const tg=otherText.map((t)=>({...t,clearanceCm:gapBox(glyph,t.box)})).sort((a,b)=>a.clearanceCm-b.clearanceCm)[0]??null;
        const frameClearanceCm=Math.min(glyph.minX-frame.minX,glyph.minY-frame.minY,frame.maxX-glyph.maxX,frame.maxY-glyph.maxY);
        const dxRing=Math.max(0,glyph.minX-cx,cx-glyph.maxX),dyRing=Math.max(0,glyph.minY-cy,cy-glyph.maxY);
        const ringClearanceCm=Math.hypot(dxRing,dyRing)-r-Number.parseFloat(ring.getAttribute('stroke-width')??'0')/2;
        return{dx,dy,pathClearanceCm:pg?.clearanceCm??null,nearestPath:pg?{id:pg.id,sourceId:pg.sourceId}:null,markClearanceCm:mg?.clearanceCm??null,nearestMark:mg?{id:mg.id,sourceId:mg.sourceId}:null,textClearanceCm:tg?.clearanceCm??null,nearestText:tg?{id:tg.id,text:tg.text}:null,frameClearanceCm,ringClearanceCm};
      });
      return{revisionId:root.getAttribute('data-revision-id'),anchor:[cx,cy],ringRadiusCm:r,baseGlyph:{x,y},measured};
    }, { candidates });
    assert.equal(result.revisionId,row.revisionId,`${row.caseId}: revision changed`);
    rows.push({caseId:row.caseId,options:row.options,revisionId:row.revisionId,...result});
  }
} finally { await browser.close(); }
const summary=candidates.map((candidate,index)=>{
  const cases=rows.map((row)=>({caseId:row.caseId,...row.measured[index]}));
  const mins={path:Math.min(...cases.map(x=>x.pathClearanceCm??Infinity)),mark:Math.min(...cases.map(x=>x.markClearanceCm??Infinity)),text:Math.min(...cases.map(x=>x.textClearanceCm??Infinity)),frame:Math.min(...cases.map(x=>x.frameClearanceCm)),ring:Math.min(...cases.map(x=>x.ringClearanceCm))};
  const screenPass=Object.values(mins).every((v)=>v>0);
  return{...candidate,minimumClearancesCm:mins,screenPass,firstFail:screenPass?null:cases.find(x=>[x.pathClearanceCm,x.markClearanceCm,x.textClearanceCm,x.frameClearanceCm,x.ringClearanceCm].some(v=>v<=0))};
}).sort((a,b)=>Number(b.screenPass)-Number(a.screenPass)||Math.min(...Object.values(b.minimumClearancesCm))-Math.min(...Object.values(a.minimumClearancesCm)));
const output={source:'S394 retained actual production-renderer SVGs and exact 17 option rows; only FG text coordinates were changed in-memory for measurement.',testedCandidates:candidates.length,browserErrors:browserErrors.length,criterion:'Strict diagnostic screen: shared offset must have positive measured box/path, independent-mark, other-text, frame, and ring-stroke clearance in every option. This is not a production acceptance threshold.',summary,rows};
await writeFile(join(dir,'fg-offset-trial-matrix.json'),`${JSON.stringify(output,null,2)}\n`);
const selected={dx:-0.424264,dy:-0.424264};
const renderedDir=join(dir,'rendered');await mkdir(renderedDir,{recursive:true});
const renderBrowser=await chromium.launch({headless:true});
const renderPage=await renderBrowser.newPage({viewport:{width:1500,height:1200},deviceScaleFactor:1});
for(const caseId of ['polo-default','polo-collarPointExtension-min']){
  const row=matrix.rows.find((item)=>item.caseId===caseId),original=await readFile(join(s394Dir,'rendered',`${caseId}-collar-point.svg`),'utf8');
  const match=original.match(/(<g\b[^>]*data-pom-key="FG"[^>]*>[\s\S]*?<text\b[^>]*\bx=")(-?\d+(?:\.\d+)?)(" y=")(-?\d+(?:\.\d+)?)/u);
  assert.ok(match,`${caseId}: FG glyph not found`);
  const svg=original.replace(match[0],`${match[1]}${(Number(match[2])+selected.dx).toFixed(6)}${match[3]}${(Number(match[4])+selected.dy).toFixed(6)}`);
  await writeFile(join(renderedDir,`${caseId}-FG-offset-trial.svg`),svg);
  const crop=svg.replace(/viewBox="[^"]+"/u,'viewBox="-2.5 5.5 5 5"');
  await renderPage.setContent(crop,{waitUntil:'load'});
  await renderPage.screenshot({path:join(renderedDir,`${caseId}-FG-offset-trial.png`),fullPage:true});
  assert.ok(svg.includes(`data-revision-id="${row.revisionId}"`));
}
await renderBrowser.close();
console.log(JSON.stringify({testedCandidates:output.testedCandidates,browserErrors:output.browserErrors,passing:summary.filter(x=>x.screenPass).length,top:summary.slice(0,8)},null,2));
