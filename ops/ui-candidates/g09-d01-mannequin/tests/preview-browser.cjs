const assert = require('node:assert/strict');
const {readFile,writeFile} = require('node:fs/promises');
const {join} = require('node:path');
const {createServer} = require('node:http');
const {createHash} = require('node:crypto');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = join(__dirname,'..');
const asset = '/assets/mannequin-controls-v1.glb';
const routes = {
  '/preview/':'preview/index.html', '/preview/style.css':'preview/style.css',
  '/preview/main.mjs':'preview/main.mjs', '/preview/model.mjs':'preview/model.mjs',
  '/preview/view.mjs':'preview/view.mjs', [asset]:asset.slice(1),
  '/evidence/controls.json':'evidence/controls.json',
};
const mime={html:'text/html',css:'text/css',mjs:'text/javascript',json:'application/json',glb:'model/gltf-binary'};
const digest=b=>createHash('sha256').update(b).digest('hex');

function chunks(buffer) {
  const end=20+buffer.readUInt32LE(12);
  return [JSON.parse(buffer.subarray(20,end)),buffer.subarray(end+8)];
}
function pack(doc,bin) {
  let json=Buffer.from(JSON.stringify(doc));
  json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
  const raw=Buffer.alloc(28+json.length+bin.length);
  [0x46546c67,2,raw.length,json.length,0x4e4f534a].forEach((n,i)=>raw.writeUInt32LE(n,i*4));
  json.copy(raw,20);
  raw.writeUInt32LE(bin.length,20+json.length);
  raw.writeUInt32LE(0x004e4942,24+json.length);
  bin.copy(raw,28+json.length);
  return raw;
}

(async()=>{
  const server=createServer(async(req,res)=>{
    const path=routes[req.url];
    if (!path) return res.writeHead(404).end();
    res.writeHead(200,{'content-type':mime[path.split('.').at(-1)]});
    res.end(await readFile(join(root,path)));
  });
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const requests=[],errors=[];
  const result={browser:browser.version(),requestedAssets:requests,externalRequests:[],errors};
  async function profile(options={}, noGL=false) {
    const ctx=await browser.newContext(options);
    await ctx.route('**/*',r=>{
      const url=r.request().url();
      if (!url.startsWith(origin+'/')) {
        result.externalRequests.push(url);
        return r.abort();
      }
      requests.push(new URL(url).pathname);
      return r.continue();
    });
    if (noGL) await ctx.addInitScript(()=>{
      const original=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(type,...args) {
        return type.startsWith('webgl')?null:original.call(this,type,...args);
      };
    });
    const page=await ctx.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/preview/');
    await page.locator('#shape:not([disabled])').waitFor();
    // Loopback boot with external requests blocked, then disconnect the browser.
    await ctx.setOffline(true);
    return {ctx,page};
  }
  const inspect=p=>p.locator('#measurements, #coordinates, #weights').allTextContents();
  const status=(p,str)=>p.waitForFunction(x=>document.querySelector('#status').textContent.includes(x),str);
  const frame=p=>p.locator('canvas').getAttribute('data-frame');
  const camera=p=>p.locator('canvas').getAttribute('data-view');
  const afterFrame=(p,previous)=>p.waitForFunction(n=>Number(document.querySelector('canvas').dataset.frame)>Number(n),previous);
  const upload=(p,name,buffer)=>p.locator('#file').setInputFiles({name,mimeType:'model/gltf-binary',buffer});
  const renderBytes=p=>p.locator('canvas').screenshot();
  try {
    const {ctx,page}=await profile({viewport:{width:1280,height:900},acceptDownloads:true});
    await page.waitForFunction(()=>document.querySelector('canvas').dataset.frame);
    result.renderer=await page.evaluate(()=>{
      const g=document.querySelector('canvas').getContext('webgl2');
      const d=g.getExtension('WEBGL_debug_renderer_info');
      return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER);
    });
    assert.match(result.renderer,/SwiftShader/i);
    const neutral=await inspect(page);
    assert.match(neutral[1],/1700\.00 mm/);
    assert.equal(await page.locator('#shape option').count(),43);
    const initialCamera=await camera(page);
    await page.locator('canvas').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(v=>document.querySelector('canvas').dataset.view!==v,initialCamera);
    await page.keyboard.press('Home');
    await page.waitForFunction(v=>document.querySelector('canvas').dataset.view===v,initialCamera);
    const box=await page.locator('canvas').boundingBox();
    await page.mouse.move(box.x+100,box.y+100);
    await page.mouse.down();
    await page.mouse.move(box.x+155,box.y+126,{steps:3});
    await page.mouse.up();
    await page.waitForFunction(v=>document.querySelector('canvas').dataset.view!==v,initialCamera);
    await page.locator('#reset').click();
    await page.waitForFunction(v=>document.querySelector('canvas').dataset.view===v,initialCamera);

    const times=[];
    for (const index of [1,7,9,20,27,42,25,26,0,25]) {
      const previous=await frame(page);
      const start=performance.now();
      await page.locator('#shape').selectOption(String(index));
      await afterFrame(page,previous);
      times.push(performance.now()-start);
    }
    result.selectionAutomationMs=times;
    const shape=await inspect(page);
    assert.notDeepEqual(shape,neutral);
    const shot=await renderBytes(page);
    await page.screenshot({path:join(root,'evidence/preview-desktop.png'),fullPage:true});
    const downloaded=page.waitForEvent('download');
    await page.locator('#save').click();
    const download=await downloaded;
    const data=await readFile(await download.path());
    const base=await readFile(join(root,asset.slice(1)));
    const [baseDoc,baseBin]=chunks(base);
    const [doc,bin]=chunks(data);
    assert.deepEqual(doc.meshes[0].weights,[.375,0,0,.625,.875,0,0,.25]);
    assert.equal(digest(bin),digest(baseBin));
    // Independent numeric witness evaluated from the actual downloaded GLB.
    const readFloat=(idx,k)=>bin.readFloatLE(doc.bufferViews[doc.accessors[idx].bufferView].byteOffset+4*k);
    const component=k=>Math.fround(doc.meshes[0].weights.reduce(
      (x,w,j)=>x+w*readFloat(3+j,k),readFloat(0,k)));
    const point=id=>[0,1,2].map(axis=>component(id*3+axis));
    const ring=doc.extras.rings.chest.map(point);
    const chest=ring.reduce((sum,a,i)=>{
      const b=ring[(i+1)%ring.length];
      return sum+Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
    },0);
    const shoulder=point(doc.extras.landmarks['shoulder-left']);
    assert.ok(shape[1].includes('Chest'+(chest*1000).toFixed(2)+' mm'));
    assert.equal(shape[2],shoulder.map((v,i)=>'XYZ'[i]+' '+(v*1000).toFixed(2)+' mm').join(' · '));
    const opened=await profile({viewport:{width:1280,height:900}});
    const chooserPromise=opened.page.waitForEvent('filechooser');
    await opened.page.locator('#open').click();
    await (await chooserPromise).setFiles(await download.path());
    await status(opened.page,'Opened');
    assert.deepEqual(await inspect(opened.page),shape);
    assert.equal(digest(await renderBytes(opened.page)),digest(shot));
    result.reopen={weights:doc.meshes[0].weights,binSha256:digest(bin),glbSha256:digest(data),
      canvasSha256:digest(shot),measurements:shape};

    const negatives=[
      ['oversize',Buffer.alloc(4*1024*1024+1),'file limit'],
      ['truncated',data.subarray(0,-8),'truncated'],
      ['bad magic',Buffer.alloc(80),'Invalid or truncated GLB'],
      ['malformed JSON',Buffer.from(data),'Malformed GLB metadata'],
    ];
    negatives[3][1][20]=0x21;
    const modify=(name,edit,expected)=>{
      const d=structuredClone(baseDoc); edit(d);
      negatives.push([name,pack(d,baseBin),expected]);
    };
    modify('external reference',d=>d.buffers[0].uri='https://invalid.example/d01.bin','geometry metadata');
    modify('extension',d=>d.extensionsUsed=['EXT_unknown'],'geometry metadata');
    modify('swap chest and seat',d=>[d.extras.rings.chest,d.extras.rings.seat]=[d.extras.rings.seat,d.extras.rings.chest],'landmark roles');
    modify('wrong landmark',d=>d.extras.landmarks['neck-front']=d.extras.landmarks['neck-left'],'landmark roles');
    modify('renamed target',d=>d.meshes[0].extras.targetNames[0]='wrong','target definitions');
    modify('target accessor swap',d=>[d.meshes[0].primitives[0].targets[0],d.meshes[0].primitives[0].targets[2]]=
      [d.meshes[0].primitives[0].targets[2],d.meshes[0].primitives[0].targets[0]],'target definitions');
    modify('negative weight',d=>d.meshes[0].weights[0]=-.2,'outside the 43');
    modify('unverified signed state',d=>d.meshes[0].weights[0]=.2,'outside the 43');
    modify('both signs active',d=>d.meshes[0].weights.splice(0,2,.2,.2),'outside the 43');
    const corrupt=Buffer.from(baseBin);
    corrupt[baseDoc.bufferViews[3].byteOffset]^=1;
    negatives.push(['altered target payload',pack(baseDoc,corrupt),'target data']);
    for (const [label,bytes,message] of negatives) {
      await upload(opened.page,label+'.glb',bytes);
      await status(opened.page,message);
      assert.deepEqual(await inspect(opened.page),shape,label);
      assert.equal(await opened.page.locator('#shape').inputValue(),'25',label);
    }
    assert.equal(digest(await renderBytes(opened.page)),digest(shot));
    result.rejected=negatives.map(([name])=>name);

    const beforeLoss=await frame(page);
    await page.evaluate(()=>{
      window.lossExtension=document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');
      window.lossExtension.loseContext();
    });
    await page.locator('#fallback:visible').waitFor();
    assert.equal(await page.locator('canvas').isVisible(),false);
    assert.deepEqual(await inspect(page),shape);
    await page.locator('#shape').selectOption('3');
    const during=await inspect(page);
    await page.evaluate(()=>window.lossExtension.restoreContext());
    await page.locator('canvas:visible').waitFor();
    await afterFrame(page,beforeLoss);
    assert.deepEqual(await inspect(page),during);
    assert.equal(await page.locator('#shape').inputValue(),'3');
    result.contextRestored=true;

    const touch=await profile({viewport:{width:320,height:780},hasTouch:true,isMobile:true});
    await touch.page.waitForFunction(()=>document.querySelector('canvas').dataset.view);
    const old=await camera(touch.page);
    const b=await touch.page.locator('canvas').boundingBox();
    const cdp=await touch.ctx.newCDPSession(touch.page);
    const send=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});
    await send('touchStart',b.x+70,b.y+90);
    await send('touchMove',b.x+115,b.y+120);
    await send('touchEnd');
    await touch.page.waitForFunction(v=>document.querySelector('canvas').dataset.view!==v,old);
    assert.equal(await touch.page.evaluate(()=>document.documentElement.scrollWidth),320);
    await touch.page.locator('#reset').click();
    await touch.page.waitForFunction(v=>document.querySelector('canvas').dataset.view===v,old);
    await touch.page.screenshot({path:join(root,'evidence/preview-narrow.png'),fullPage:true});
    result.touchNarrow=true;
    const fallback=await profile({acceptDownloads:true},true);
    await fallback.page.locator('#fallback:visible').waitFor();
    await upload(fallback.page,'verified.glb',data);
    await status(fallback.page,'Opened');
    assert.deepEqual(await inspect(fallback.page),shape);
    const offlineDownload=fallback.page.waitForEvent('download');
    await fallback.page.locator('#save').click();
    assert.equal(digest(await readFile(await (await offlineDownload).path())),digest(data));
    await fallback.page.screenshot({path:join(root,'evidence/preview-fallback.png'),fullPage:true});
    result.noWebGLRoundTrip=true;
    assert.deepEqual(result.externalRequests,[]);
    assert.deepEqual(errors,[]);
    await writeFile(join(root,'evidence/preview-browser.json'),JSON.stringify(result,null,2)+'\n');
    console.log('D01 offline browser checks passed',result.browser,result.renderer);
    await ctx.close();
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
