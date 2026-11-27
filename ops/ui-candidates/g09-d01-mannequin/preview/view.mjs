const vertex = `#version 300 es
in vec3 p, n;
uniform vec3 right, up, toward;
uniform vec2 scale;
out vec3 normal;
void main() {
  vec3 q = p - vec3(0,.855,0);
  gl_Position = vec4(dot(q,right)*scale.x,dot(q,up)*scale.y,-dot(q,toward)*.5,1.);
  normal = n;
}`;
const fragment = `#version 300 es
precision highp float;
in vec3 normal;
uniform vec3 light;
out vec4 color;
void main() {
  float illumination = .39 + .57 * max(0.,dot(normalize(normal),light));
  color = vec4(vec3(.34,.57,.55)*illumination + .07,1.);
}`;

export function makeView(canvas, marker, availability, faces) {
  let gl, drawState, pose, key, raf, yaw, pitch, zoom, generation=0;
  const pointers = new Map();
  const getContext = () => canvas.getContext('webgl2',{antialias:true,alpha:true});
  const resize = new ResizeObserver(request);
  resize.observe(canvas);

  function initialize() {
    let ready = false;
    try {
      gl = getContext();
      if (!gl) throw new Error('no WebGL');
      const program = gl.createProgram();
      for (const [kind,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]) {
        const shader = gl.createShader(kind);
        gl.shaderSource(shader,source);
        gl.compileShader(shader);
        gl.attachShader(program,shader);
        gl.deleteShader(shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      const buffers = ['p','n'].map(name => {
        const b = gl.createBuffer(), loc = gl.getAttribLocation(program,name);
        gl.bindBuffer(gl.ARRAY_BUFFER,b);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);
        return b;
      });
      const indices = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indices);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,faces,gl.STATIC_DRAW);
      const uniforms = Object.fromEntries(['right','up','toward','scale','light'].map(k=>[k,gl.getUniformLocation(program,k)]));
      drawState = {program,buffers,indices,uniforms};
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0,0,0,0);
      ready = true;
      upload();
    } catch {
      drawState = null;
    }
    availability(ready,ready ? '' : '3D is unavailable on this device.');
    request();
  }

  function request() {
    if (!raf && drawState) raf = requestAnimationFrame(draw);
  }

  function upload() {
    if (!pose || !drawState) return;
    [pose.poses,pose.normals].forEach((data,i) => {
      gl.bindBuffer(gl.ARRAY_BUFFER,drawState.buffers[i]);
      gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
    });
  }

  const dot = (a,b) => a.reduce((sum,x,i)=>sum+x*b[i],0);
  function draw() {
    raf = 0;
    if (!drawState || !pose) return;
    const {uniforms:u} = drawState;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    const dpr = Math.min(devicePixelRatio,2);
    const pixels = [Math.round(width*dpr), Math.round(height*dpr)];
    if (canvas.width !== pixels[0] || canvas.height !== pixels[1]) [canvas.width, canvas.height] = pixels;
    const right = [Math.cos(yaw),0,-Math.sin(yaw)];
    const toward = [Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];
    const up = [-Math.sin(pitch)*Math.sin(yaw),Math.cos(pitch),-Math.sin(pitch)*Math.cos(yaw)];
    const sy = Math.min(1.02, width/height*1.7)*zoom, sx = sy*height/width;
    const light = right.map((x,i)=>-.3*x+.59*up[i]+.74*toward[i]);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform3fv(u.right,right); gl.uniform3fv(u.up,up); gl.uniform3fv(u.toward,toward);
    gl.uniform3fv(u.light,light); gl.uniform2f(u.scale,sx,sy);
    gl.drawElements(gl.TRIANGLES,faces.length,gl.UNSIGNED_SHORT,0);
    const p = [...pose.point(key)]; p[1]-=.855;
    marker.style.left = `${50+50*sx*dot(p,right)}%`;
    marker.style.top = `${50-50*sy*dot(p,up)}%`;
    canvas.dataset.view = [yaw,pitch,zoom].map(x=>x.toFixed(4)).join(',');
    canvas.dataset.frame = String(++generation);
  }

  function move(dy,dp) {
    yaw+=dy; pitch=Math.max(-1.25,Math.min(1.25,pitch+dp)); request();
  }
  function scale(factor) { zoom=Math.max(.7,Math.min(1.65,zoom*factor)); request(); }
  function reset() { yaw=.55; pitch=.04; zoom=1; request(); }
  canvas.addEventListener('keydown',e => {
    const actions = {
      ArrowLeft:()=>move(-.15,0),ArrowRight:()=>move(.15,0),ArrowUp:()=>move(0,.12),ArrowDown:()=>move(0,-.12),
      '+':()=>scale(1.12), '=':()=>scale(1.12), '-':()=>scale(.89), Home:reset,
    };
    if (Object.hasOwn(actions,e.key)) { e.preventDefault(); actions[e.key](); }
  });
  canvas.addEventListener('wheel',e=>{e.preventDefault(); scale(Math.exp(-e.deltaY*.001));},{passive:false});
  canvas.addEventListener('pointerdown',e=>{
    canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId,[e.clientX,e.clientY]);
  });
  canvas.addEventListener('pointermove',e=>{
    const old=pointers.get(e.pointerId);
    if (!old) return;
    const next=[e.clientX,e.clientY], other=[...pointers].find(([id])=>id!==e.pointerId)?.[1];
    if (other) {
      const dist=p=>Math.hypot(p[0]-other[0],p[1]-other[1]);
      if (dist(old)>0) scale(dist(next)/dist(old));
    } else move((next[0]-old[0])*.01,(next[1]-old[1])*.01);
    pointers.set(e.pointerId,next);
  });
  for (const event of ['pointercancel','lostpointercapture','pointerup']) {
    canvas.addEventListener(event,e=>pointers.delete(e.pointerId));
  }
  canvas.addEventListener('webglcontextlost',e=>{
    e.preventDefault(); drawState=null;
    cancelAnimationFrame(raf); raf=0;
    availability(false,'3D paused. Measurements and GLB files are still available.');
  });
  canvas.addEventListener('webglcontextrestored',initialize);
  window.addEventListener('pagehide',e=>{
    if (e.persisted) return;
    resize.disconnect(); cancelAnimationFrame(raf);
    if (drawState) {
      for (const buf of [...drawState.buffers,drawState.indices]) gl.deleteBuffer(buf);
      gl.deleteProgram(drawState.program);
    }
  });
  reset(); initialize();
  return {reset,scale, update(next,landmark) {
    if (pose!==next) { pose=next; upload(); }
    key=landmark; request();
  }};
}
