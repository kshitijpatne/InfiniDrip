const assert=require('node:assert/strict');
const {readFile}=require('node:fs/promises');
const {createServer}=require('node:http');
const {join}=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=join(__dirname,'../..');
const d01='/g09-d01-mannequin/';
const d02='/g09-d02-measurements/';
const allowed=new Set([
  ...['index.html','main.mjs','model.mjs','style.css'].map(p=>d02+p),
  ...['index.html','main.mjs','model.mjs','style.css','view.mjs'].map(p=>d01+'preview/'+p),
  d01+'evidence/controls.json',d01+'assets/mannequin-controls-v1.glb',
]);
const mime={html:'text/html',mjs:'text/javascript',css:'text/css',json:'application/json',glb:'model/gltf-binary'};
(async()=>{
  const server=createServer(async(req,res)=>{
    const path=req.url.endsWith('/')?req.url+'index.html':req.url;
    if(!allowed.has(path)) return res.writeHead(404).end();
    res.writeHead(200,{'content-type':mime[path.split('.').at(-1)]});
    res.end(await readFile(join(root,path.slice(1))));
  }).listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  let browser;
  const external=[], errors=[];
  try {
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    async function profile(opts={},fallback=false,route=d02) {
      const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900},...opts});
      await ctx.route('**/*',r=>{
        if(r.request().url().startsWith(origin+'/')) return r.continue();
        external.push(r.request().url());return r.abort();
      });
      if(fallback) await ctx.addInitScript(()=>{
        const get=HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext=function(k,...args){return k.startsWith('webgl')?null:get.call(this,k,...args);};
      });
      const p=await ctx.newPage();
      p.on('pageerror',e=>errors.push(e.message));
      await p.goto(origin+route);
      await p.locator('#open:enabled').waitFor();
      await ctx.setOffline(true);
      return {p,ctx};
    }
    const status=(p,s)=>p.waitForFunction(x=>document.querySelector('#status').textContent.includes(x),s);
    const accepted=p=>p.locator('#measurements,#coordinates').allTextContents();
    const waitFrame=(p,n=0)=>p.waitForFunction(old=>Number(document.querySelector('canvas').dataset.frame)>old,n);
    const frame=p=>p.locator('canvas').getAttribute('data-frame');
    const camera=p=>p.locator('canvas').getAttribute('data-view');
    async function apply(p,chest,seat) {
      await p.locator('#chest').fill(String(chest));
      await p.locator('#seat').fill(String(seat));
      await p.locator('#apply').click();
    }
    async function save(p) {
      const then=p.waitForEvent('download'); await p.locator('#save').click();
      return (await then).path();
    }
    const {p}=await profile();
    const initial=await accepted(p);
    await apply(p,82,91);
    await status(p,'applied');
    const first=await accepted(p);
    assert.notDeepEqual(first,initial);
    assert.match(first[0],/Chest82 cm82.00 cmSeat91 cm91.00 cm/);
    const file=await save(p);
    const payload=await readFile(file);
    await apply(p,100,91);
    await status(p,'Accepted shape kept');
    assert.deepEqual(await accepted(p),first);
    assert.deepEqual(await readFile(await save(p)),payload);
    await waitFrame(p);
    const screenshot=await p.locator('canvas').screenshot();
    const cold=(await profile()).p;
    const chooser=cold.waitForEvent('filechooser');
    await cold.locator('#open').click();
    await (await chooser).setFiles(file);
    await status(cold,'Opened');
    assert.deepEqual(await accepted(cold),first);
    assert.deepEqual(await cold.locator('canvas').screenshot(),screenshot);
    function changeMetadata(change) {
      const end=20+payload.readUInt32LE(12);
      const text=change(payload.subarray(20,end).toString().trim());
      const padded=Buffer.from(text+' '.repeat((4-Buffer.byteLength(text)%4)%4));
      const data=Buffer.concat([payload.subarray(0,20),padded,payload.subarray(end)]);
      data.writeUInt32LE(data.length,8);
      data.writeUInt32LE(padded.length,12);
      return data;
    }
    const choose=async(name,buffer)=>{
      const picker=cold.waitForEvent('filechooser');
      await cold.locator('#open').click();
      await (await picker).setFiles({name,mimeType:'model/gltf-binary',buffer});
    };
    const record='"chest":82';
    assert.ok(payload.includes(record));
    // A single escaped name still describes the same object, and keys in other
    // scopes (e.g. accessor names) remain legal.
    await choose('escaped-valid.glb',changeMetadata(text=>text.replace(record,'"ch\\u0065st":82')
      .replace('"2.0"','"\\u0032.0"')));
    await status(cold,'Opened escaped-valid.glb');
    assert.deepEqual(await accepted(cold),first);
    for(const [filename,duplicate] of [
      ['duplicate.glb','"chest":87,'+record],
      ['escaped-duplicate.glb','"ch\\u0065st":87,'+record],
    ]) {
      await choose(filename,changeMetadata(text=>text.replace(record,duplicate)));
      await status(cold,'Duplicate object key');
      assert.deepEqual(await accepted(cold),first);
      assert.deepEqual(await cold.locator('canvas').screenshot(),screenshot);
      assert.deepEqual(await readFile(await save(cold)),payload);
    }
    const wrongPlane=Buffer.from(payload);
    const marker=wrongPlane.indexOf('d01-horizontal-body-cm-v1');
    assert.ok(marker>0);
    wrongPlane.write('tee-axilla-survey-body-v1',marker,'utf8');
    await cold.locator('#file').setInputFiles({name:'wrong-plane.glb',mimeType:'model/gltf-binary',buffer:wrongPlane});
    await status(cold,'horizontal body measurement protocol');
    assert.deepEqual(await accepted(cold),first);
    // Pause one real upload before decoding and let a newer form submit win.
    await cold.evaluate(()=>{
      const read=File.prototype.arrayBuffer;
      File.prototype.arrayBuffer=function(){
        return new Promise(resolve=>{window.releaseOldFile=()=>resolve(read.call(this));});
      };
    });
    await cold.locator('#file').setInputFiles(file);
    await status(cold,'Checking GLB');
    await apply(cold,90,83);
    await status(cold,'applied');
    const newest=await accepted(cold);
    await cold.evaluate(()=>window.releaseOldFile());
    await cold.evaluate(()=>new Promise(resolve=>setTimeout(resolve,80)));
    assert.deepEqual(await accepted(cold),newest);
    await status(cold,'applied');
    const oldFrame=Number(await frame(cold));
    await cold.evaluate(()=>{
      window.loss=document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');
      window.loss.loseContext();
    });
    await cold.locator('#fallback:visible').waitFor();
    await apply(cold,78,95);
    const paused=await accepted(cold);
    await cold.evaluate(()=>window.loss.restoreContext());
    await waitFrame(cold,oldFrame);
    assert.deepEqual(await accepted(cold),paused);
    const view=await camera(cold);
    await cold.locator('canvas').focus();
    await cold.keyboard.press('ArrowRight');
    await cold.waitForFunction(v=>document.querySelector('canvas').dataset.view!==v,view);
    await cold.keyboard.press('Home');
    await cold.waitForFunction(v=>document.querySelector('canvas').dataset.view===v,view);
    const narrow=await profile({viewport:{width:320,height:860},hasTouch:true,isMobile:true});
    await apply(narrow.p,91,81);
    await waitFrame(narrow.p);
    assert.equal(await narrow.p.evaluate(()=>document.documentElement.scrollWidth),320);
    const seatHelp=narrow.p.locator('#seat-help');
    assert.match(await seatHelp.textContent(),/94\.05 cm above ground/);
    assert.match(await narrow.p.locator('.details').textContent(),/Garment fit is outside/);
    assert.ok(await seatHelp.evaluate(el=>{
      const range=document.createRange();
      range.selectNodeContents(el);
      return range.getClientRects().length>1 && el.scrollWidth===el.clientWidth;
    }));
    const canvas=narrow.p.locator('canvas');
    await canvas.scrollIntoViewIfNeeded();
    const box=await canvas.boundingBox();
    const client=await narrow.ctx.newCDPSession(narrow.p);
    const before=await camera(narrow.p);
    for(const [type,dx] of [['touchStart',0],['touchMove',45],['touchEnd',0]]) {
      await client.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:box.x+70+dx,y:box.y+60}]});
    }
    await narrow.p.waitForFunction(v=>document.querySelector('canvas').dataset.view!==v,before);
    const noGL=(await profile({},true)).p;
    await noGL.locator('#fallback:visible').waitFor();
    await noGL.locator('#file').setInputFiles(file);
    await status(noGL,'Opened');
    assert.deepEqual(await accepted(noGL),first);
    assert.deepEqual(await readFile(await save(noGL)),payload);
    const prior=(await profile({},false,d01+'preview/')).p;
    assert.equal(await prior.locator('#shape option').count(),43);
    const d01file=await save(prior);
    await prior.locator('#file').setInputFiles(file);
    await status(prior,'Current shape kept');
    await prior.locator('#file').setInputFiles(d01file);
    await status(prior,'Opened');
    assert.deepEqual(external,[]);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({browser:browser.version(),externalRequests:external.length,errors:errors.length,
      roundTrip:first,duplicateKeyRollback:true,seatGuidance320:true,invalidRollback:true,staleUpload:true,contextRestore:true,noWebGL:true,keyboard:true,touch320:true,d01Compatibility:true}));
  } finally {await browser?.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
