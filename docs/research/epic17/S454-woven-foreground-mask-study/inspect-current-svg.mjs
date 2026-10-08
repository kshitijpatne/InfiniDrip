import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const { JSDOM } = createRequire(import.meta.url)('jsdom');
const folder = fileURLToPath(new URL('./', import.meta.url));
const matrix = JSON.parse(await readFile(new URL('./current-production-replay/matrix.json', import.meta.url), 'utf8'));
assert.equal(matrix.rows.length, 28);
const row = matrix.rows.find(x => x.caseId === 'woven-shirt-default');
const doc = new JSDOM(row.svg, { contentType: 'image/svg+xml' }).window.document;
const entities = [...doc.querySelectorAll('path[data-source-id]')].filter(n => /role:(front|outerStand|innerStand|upperCollar|underCollar)(:|$)/u.test(n.getAttribute('data-source-id') || '')).map(n => ({
  entityId:n.getAttribute('data-entity-id'), sourceId:n.getAttribute('data-source-id'), fill:n.getAttribute('fill'), stroke:n.getAttribute('stroke'),
  fillRule:n.getAttribute('fill-rule'), mask:n.getAttribute('mask'), clipPath:n.getAttribute('clip-path'),
  layer:n.closest('[data-layer-group]')?.getAttribute('data-layer-group'), d:n.getAttribute('d')
}));
const masks=[...doc.querySelectorAll('mask')].map(n=>({id:n.id,paths:[...n.querySelectorAll('path')].map(p=>({d:p.getAttribute('d'),fill:p.getAttribute('fill'),rule:p.getAttribute('fill-rule')}))}));
await writeFile(join(folder,'default-collar-entities.json'),JSON.stringify({revision:row.revisionId,entities,masks},null,2)+'\n');
console.log(JSON.stringify({revision:row.revisionId,entityCount:entities.length, entities:entities.map(({entityId,sourceId,fill,stroke,fillRule,mask,clipPath,layer,d})=>({entityId,sourceId,fill,stroke,fillRule,mask,clipPath,layer,d:d?.slice(0,110)})),masks:masks.map(m=>({id:m.id,pathCount:m.paths.length,paths:m.paths.map(p=>({fill:p.fill,rule:p.rule,d:p.d?.slice(0,100)}))}))},null,2));
