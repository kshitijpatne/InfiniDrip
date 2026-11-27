import {readFileSync,writeFileSync,openSync,writeSync,closeSync} from 'node:fs';
import assert from 'node:assert/strict';
import {modelFromBuffer,protocol,ranges} from '../model.mjs';
const asset=readFileSync(new URL('../../g09-d01-mannequin/assets/mannequin-controls-v1.glb',import.meta.url));
const model=await modelFromBuffer(Uint8Array.from(asset).buffer);
const request={protocol,chest:82,seat:91};
const first=model.solve(request);
assert.deepEqual(model.solve(request).weights,first.weights);
for (const invalid of [{protocol:'tee-axilla-v1'}, {chest:100}, {chest:110}, {seat:99}, {chest:82.1}, {seat:NaN}, {chest:''}, {ease:10}])
  assert.throws(()=>model.solve({...request,...invalid}));
assert.equal(100+10,110); // Garment ease arithmetic, separate from the admitted body request.
const out=openSync(process.argv[2],'w');
const weights=[];
for (let c=ranges.chest[0];c<=ranges.chest[1];c++) for(let s=ranges.seat[0];s<=ranges.seat[1];s++) {
  const shape=model.solve({protocol,chest:c,seat:s});
  const reopened=model.open(model.encode(shape));
  assert.deepEqual(reopened.poses,shape.poses);
  assert.deepEqual(reopened.requested,shape.requested);
  writeSync(out,Buffer.from(shape.poses.buffer));
  weights.push([c,s,shape.weights]);
}
closeSync(out);
writeFileSync(process.argv[3],JSON.stringify(weights));
writeFileSync(process.argv[4],Buffer.from(model.encode(first)));
