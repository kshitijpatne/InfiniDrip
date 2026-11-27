export const controlLabels = ['Torso length', 'Shoulder breadth', 'Chest girth', 'Seat girth'];
const assetHash = '9609f5f444c79eff36cb3ccc4901aa287fc13687d209681329e9b57bd33d2d08';
const receiptHash = '99d3fa15a9ba61a2919e101eb1e67e6a0a10119cd198835e3fdfe61aa83d0967';
export const fileLimit = 4 * 1024 * 1024;
const decoder = new TextDecoder('utf-8', {fatal: true});
const encoder = new TextEncoder();

function check(ok, message) {
  if (!ok) throw new Error(message);
}

function parse(buffer) {
  check(buffer.byteLength >= 28 && buffer.byteLength <= fileLimit, 'File size is outside the D01 limit.');
  const v = new DataView(buffer);
  const u = i => v.getUint32(i, true);
  check(u(0) === 0x46546c67 && u(4) === 2 && u(8) === v.byteLength, 'Invalid or truncated GLB.');
  const end = 20 + u(12);
  check(end <= 65556 && end % 4 === 0 && end + 8 <= v.byteLength && u(16) === 0x4e4f534a, 'Invalid GLB JSON chunk.');
  check(u(end + 4) === 0x004e4942 && u(end) % 4 === 0 && end + 8 + u(end) === v.byteLength,
    'Invalid or truncated GLB data chunk.');
  let doc;
  try { doc = JSON.parse(decoder.decode(new Uint8Array(buffer, 20, end - 20))); }
  catch { throw new Error('Malformed GLB metadata.'); }
  return {doc, bin: new Uint8Array(buffer, end + 8)};
}

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

const pair = w => w.flatMap(v => [Math.max(v, 0), Math.max(-v, 0)]);

export async function loadModel() {
  const [buffer, receipt] = await Promise.all([
    fetch('../assets/mannequin-controls-v1.glb').then(r => { check(r.ok, 'Local GLB is missing.'); return r.arrayBuffer(); }),
    fetch('../evidence/controls.json').then(r => { check(r.ok, 'Local configuration receipt is missing.'); return r.arrayBuffer(); }),
  ]);
  const hash = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
    b => b.toString(16).padStart(2, '0')).join('');
  check(await hash(buffer) === assetHash, 'The local asset does not match the reviewed geometry.');
  check(await hash(receipt) === receiptHash, 'The local shape list does not match the reviewed receipt.');
  const evidence = JSON.parse(decoder.decode(receipt));
  check(evidence.assetSha256 === assetHash, 'The shape receipt describes a different asset.');
  check(Number.isFinite(evidence.conservativeProjectedAreaLowerRatio) && evidence.conservativeProjectedAreaLowerRatio > 0,
    'The local orientation certificate is invalid.');
  const states = evidence.samples.map(r => r.signed);
  check(states.length === 43 && new Set(states.map(w => JSON.stringify(w))).size === 43 &&
    states.every(w => w.length === 4 && w.every(v => Number.isFinite(v) && Math.abs(v) <= 1)),
    'Invalid verified configuration inventory.');
  const {doc, bin} = parse(buffer);
  const plain = d => {
    check(d?.meshes?.length === 1 && Array.isArray(d.meshes[0]?.weights), 'Expected D01 shape controls.');
    const w = d.meshes[0].weights;
    delete d.meshes[0].weights;
    return w;
  };
  const frozen = canonical((() => { const d = structuredClone(doc); plain(d); return d; })());
  const array = (i, Typed) => {
    const view = doc.bufferViews[doc.accessors[i].bufferView];
    return new Typed(bin.buffer, bin.byteOffset + view.byteOffset, view.byteLength / Typed.BYTES_PER_ELEMENT);
  };
  const base = array(0, Float32Array);
  const faces = array(2, Uint16Array);
  const deltas = doc.meshes[0].primitives[0].targets.map(t => array(t.POSITION, Float32Array));
  const {landmarks, rings} = doc.extras;

  function open(buffer) {
    const candidate = parse(buffer);
    const weights = plain(candidate.doc);
    check(canonical(candidate.doc) === frozen, 'This file changes D01 geometry metadata, landmark roles, or target definitions.');
    check(candidate.bin.length === bin.length && candidate.bin.every((v, i) => v === bin[i]),
      'This file changes the frozen D01 mesh or target data.');
    const index = states.findIndex(s => weights.length === 8 && pair(s).every((v,i) => v === weights[i]));
    check(index !== -1, 'This weight combination is outside the 43 verified D01 shapes.');
    return index;
  }

  function encode(index) {
    const d = structuredClone(doc);
    d.meshes[0].weights = pair(states[index]);
    const str = JSON.stringify(d);
    const json = encoder.encode(str + ' '.repeat((4 - str.length % 4) % 4));
    const buffer = new ArrayBuffer(28 + json.length + bin.length);
    const v = new DataView(buffer);
    [0x46546c67, 2, buffer.byteLength, json.length, 0x4e4f534a].forEach((x,i) => v.setUint32(i*4,x,true));
    new Uint8Array(buffer,20,json.length).set(json);
    v.setUint32(20+json.length,bin.length,true);
    v.setUint32(24+json.length,0x004e4942,true);
    new Uint8Array(buffer,28+json.length).set(bin);
    return buffer;
  }

  function shape(index) {
    const w = pair(states[index]);
    const poses = new Float32Array(base.length);
    const normals = new Float32Array(base.length);
    for (let i=0;i<base.length;i++) {
      let x=base[i];
      for (let j=0;j<w.length;j++) if (w[j]) x+=w[j]*deltas[j][i];
      poses[i]=x;
    }
    for (let i=0;i<faces.length;i+=3) {
      const a=faces[i]*3, b=faces[i+1]*3, c=faces[i+2]*3;
      const x=poses[b]-poses[a], y=poses[b+1]-poses[a+1], z=poses[b+2]-poses[a+2];
      const u=poses[c]-poses[a], v=poses[c+1]-poses[a+1], w=poses[c+2]-poses[a+2];
      for (const j of [a,b,c]) {
        normals[j]+=y*w-z*v;
        normals[j+1]+=z*u-x*w;
        normals[j+2]+=x*v-y*u;
      }
    }
    for (let i=0;i<normals.length;i+=3) {
      const length=Math.hypot(normals[i],normals[i+1],normals[i+2]);
      normals[i]/=length; normals[i+1]/=length; normals[i+2]/=length;
    }
    const point = key => poses.subarray(3*landmarks[key],3*landmarks[key]+3);
    const length = ids => ids.reduce((sum,id,i) => {
      const a=id*3, b=ids[(i+1)%ids.length]*3;
      return sum+Math.hypot(poses[a]-poses[b],poses[a+1]-poses[b+1],poses[a+2]-poses[b+2]);
    },0);
    return {poses,normals,point, measurements: {
      Height:point('crown')[1],
      'Torso length':(point('neck-left')[1]+point('neck-right')[1]-point('hip-left')[1]-point('hip-right')[1])/2,
      'Shoulder breadth':point('shoulder-left')[0]-point('shoulder-right')[0],
      Chest:length(rings.chest), Waist:length(rings.waist), Seat:length(rings.seat),
    }};
  }

  return {states, faces, landmarks:Object.keys(landmarks), open, encode, shape};
}
