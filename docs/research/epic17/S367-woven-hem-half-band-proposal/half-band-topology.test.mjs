import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root=new URL('./',import.meta.url);
const matrix=JSON.parse(readFileSync(new URL('half-band-topology-matrix.json',root),'utf8'));
const crossings=JSON.parse(readFileSync(new URL('half-band-crossing-pairs.json',root),'utf8'));
test('S367 source-topology half-band diagnostic remains exact-revision and held on every Woven option',()=>{
 assert.equal(matrix.configurationCount,28);assert.equal(matrix.faceRequests,56);assert.equal(matrix.revisionId,'live-draft:woven-shirt:14:14');
 assert.equal(matrix.records.length,28);assert.ok(matrix.records.every(r=>r.revisionId===matrix.revisionId));
 assert.ok(matrix.records.every(r=>r.join.maxMappedResidualCm<1e-10));
 assert.ok(matrix.records.every(r=>r.source.sleeveHem==='sleeve.hem[0,0.5]'&&r.source.bandTop==='sleeveBand.top[0,0.5]'));
 assert.equal(matrix.browser.errors.length,0);assert.equal(matrix.browser.cases.length,5);
});
test('cropped half-band candidate records visible seam, band, and opposite-sleeve conflicts',()=>{
 assert.equal(crossings.optionCount,28);assert.equal(crossings.rows.length,28);
 assert.equal(crossings.totals.hemSeamPair,28);assert.equal(crossings.totals.bandOuterPair,27);assert.equal(crossings.totals.bandToSleeve,54);
 assert.ok(crossings.rows.every(r=>r.seamCrossing.count===1&&[0,2].includes(r.bandToSleeveCrossing.count)));
 assert.equal(matrix.records.reduce((sum,r)=>sum+r.checks.bandSelfCrossings,0),0);
 assert.equal(matrix.records.reduce((sum,r)=>sum+r.checks.bodyYokeCrossings.reduce((a,x)=>a+x.right+x.left,0),0),0);
});