import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';
const j=JSON.parse(await readFile('docs/research/epic17/S454-woven-foreground-mask-study/current-production-replay/matrix.json','utf8'));
const {JSDOM}=createRequire(import.meta.url)('jsdom');const d=new JSDOM(j.rows[0].svg,{contentType:'image/svg+xml'}).window.document;
let p=[...d.querySelectorAll('path')].find(x=>(x.getAttribute('data-entity-id')||'').includes('view-seam:front:neckline'));
console.log('root',d.documentElement.getAttribute('viewBox'),d.documentElement.getAttribute('preserveAspectRatio'),d.documentElement.getAttribute('width'),d.documentElement.getAttribute('height'));
for(let n=p;n&&n.nodeType===1;n=n.parentElement)console.log(n.tagName,n.getAttribute('transform'),n.getAttribute('data-layer-group'));
console.log('d',p?.getAttribute('d'));
