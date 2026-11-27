const assetHash = '9609f5f444c79eff36cb3ccc4901aa287fc13687d209681329e9b57bd33d2d08';
export const fileLimit = 4 * 1024 * 1024;
const decoder = new TextDecoder('utf-8', {fatal: true});
const encoder = new TextEncoder();

function check(ok, message) {
  if (!ok) throw new Error(message);
}

// Walk JSON structure before JSON.parse can discard duplicate members.
// The GLB reader caps the source at 64 KiB, and this walk caps nesting.
function parseUniqueJson(text) {
  let cursor = 0;
  const malformed = 'Malformed GLB metadata.';
  const whitespace = ch => ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t';
  function skipWhitespace() {
    while (whitespace(text[cursor])) cursor++;
  }
  function string() {
    check(text[cursor] === '"', malformed);
    const start = cursor++;
    while (cursor < text.length) {
      const ch = text[cursor++];
      if (ch === '"') return text.slice(start, cursor);
      if (ch === '\\') cursor++;
    }
    throw new Error(malformed);
  }
  function value(depth) {
    check(depth <= 32, 'GLB metadata nesting exceeds the D02 limit.');
    skipWhitespace();
    const ch = text[cursor];
    if (ch === '"') {
      string();
      return;
    }
    if (ch !== '{' && ch !== '[') {
      // The final parse validates the spelling of scalar values.
      const start = cursor;
      while (cursor < text.length && !whitespace(text[cursor]) && !',]}'.includes(text[cursor])) cursor++;
      check(cursor > start, malformed);
      return;
    }
    cursor++;
    const keys = ch === '{' ? new Set() : null;
    const close = keys ? '}' : ']';
    skipWhitespace();
    if (text[cursor] !== close) {
      while (true) {
        if (keys) {
          const token = string();
          let key;
          try { key = JSON.parse(token); }
          catch { throw new Error(malformed); }
          check(!keys.has(key), 'Duplicate object key in GLB metadata.');
          keys.add(key);
          skipWhitespace();
          check(text[cursor++] === ':', malformed);
        }
        value(depth + 1);
        skipWhitespace();
        if (text[cursor] !== ',') break;
        cursor++;
        skipWhitespace();
      }
    }
    check(text[cursor++] === close, malformed);
  }
  value(0);
  skipWhitespace();
  check(cursor === text.length, malformed);
  try { return JSON.parse(text); }
  catch { throw new Error(malformed); }
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
  let json;
  try { json = decoder.decode(new Uint8Array(buffer, 20, end - 20)); }
  catch { throw new Error('Malformed GLB metadata.'); }
  const doc = parseUniqueJson(json);
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

export const protocol = 'd01-horizontal-body-cm-v1';
export const ranges = {chest:[78,91], seat:[81,95]};

export async function loadModel() {
  const response = await fetch('../g09-d01-mannequin/assets/mannequin-controls-v1.glb');
  check(response.ok, 'The pinned D01 asset is unavailable.');
  return modelFromBuffer(await response.arrayBuffer());
}

export async function modelFromBuffer(buffer) {
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)),
    b=>b.toString(16).padStart(2,'0')).join('');
  check(hash === assetHash,'Unexpected D01 asset revision.');
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

  function solve(request) {
    check(request?.protocol === protocol,'Use the D01 horizontal body measurement protocol.');
    check(Object.keys(request).length === 3 && Object.hasOwn(request,'chest') && Object.hasOwn(request,'seat'),
      'Enter only body chest and seat measurements.');
    const signed = [0,0];
    for (const [i, role] of ['chest','seat'].entries()) {
      const [min,max] = ranges[role];
      check(Number.isInteger(request[role]) && request[role]>=min && request[role]<=max,
        `Enter ${role} as a whole number from ${min} to ${max} cm.`);
      const delta=deltas[4+2*i];
      const point=(id,axis,w)=>base[3*id+axis]+w*delta[3*id+axis];
      const ids=rings[role];
      const cm=w=>100*ids.reduce((sum,id,j)=>{
        const next=ids[(j+1)%ids.length];
        return sum+Math.hypot(...[0,1,2].map(k=>point(id,k,w)-point(next,k,w)));
      },0);
      let lo=-1,hi=1;
      check(request[role]>=cm(lo) && request[role]<=cm(hi), 'Measurement is outside the model range.');
      for (let n=0;n<48;n++) {
        const mid=(lo+hi)/2;
        if (cm(mid)<request[role]) lo=mid; else hi=mid;
      }
      signed.push((lo+hi)/2);
    }
    const result=shape(pair(signed));
    for (const role of ['chest','seat']) {
      const actual=result.measurements[role==='chest'?'Chest':'Seat'];
      check(Math.abs(actual-request[role]/100)<=.00001, 'Model measurement residual exceeds 0.01 mm.');
    }
    return {...result, weights:pair(signed), requested:{protocol,chest:request.chest,seat:request.seat}};
  }

  function open(buffer) {
    const candidate = parse(buffer);
    const weights = plain(candidate.doc);
    const request = candidate.doc.extras?.d02;
    check(request, 'Expected a D02 measurement GLB.');
    delete candidate.doc.extras.d02;
    check(canonical(candidate.doc) === frozen, 'This file changes the pinned D01 metadata or introduces unsupported resources.');
    check(candidate.bin.length === bin.length && candidate.bin.every((v,i)=>v===bin[i]),
      'This file changes the pinned D01 geometry or targets.');
    const result=solve(request);
    check(weights.length===8 && result.weights.every((w,i)=>w===weights[i]),
      'File weights disagree with the recorded body measurements.');
    return result;
  }

  function encode(result) {
    const accepted=solve(result.requested);
    const d=structuredClone(doc);
    d.meshes[0].weights=accepted.weights;
    d.extras.d02=accepted.requested;
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

  function shape(w) {
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

  return {faces, landmarks:Object.keys(landmarks), open, encode, solve, neutral:()=>shape(Array(8).fill(0))};
}
