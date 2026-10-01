import { mkdir, writeFile } from "node:fs/promises";
import { STANDARD_M } from "../../../../src/drafting/measurements";
import { TEE, FITTED, POLO, WOVEN_SHIRT, TROUSER } from "../../../../src/drafting/recipe";

type P = { x: number; y: number };
type E = { kind: "line"; name: string; start: P; end: P } | { kind: "curve"; name: string; curve: { start: P; control1: P; control2: P; end: P } };
type Piece = { name: string; onFold: boolean; edges: E[]; marks?: any[] };
type Recipe = typeof TEE;

const cases: Array<{ id: string; recipe: Recipe; roles: string[]; options?: Record<string, number> }> = [
  { id: "tee", recipe: TEE, roles: ["sleeve", "front", "back"] },
  { id: "fitted", recipe: FITTED, roles: ["sleeve", "front", "back"] },
  { id: "polo", recipe: POLO, roles: ["outerStand", "innerStand", "upperCollar", "underCollar", "front", "back", "buttonPlacket", "buttonholePlacket"] },
  { id: "woven", recipe: WOVEN_SHIRT, roles: ["front", "yoke", "back", "outerStand", "innerStand", "upperCollar", "underCollar", "buttonPlacket", "buttonholePlacket", "sleeve", "sleeveBand"] },
  { id: "trouser", recipe: TROUSER, roles: ["frontLeft", "frontRight", "flyShield", "waistband"] },
];

function esc(s: unknown): string { return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function points(e: E): P[] { return e.kind === "line" ? [e.start, e.end] : [e.curve.start, e.curve.control1, e.curve.control2, e.curve.end]; }
function mid(e: E): P {
  if (e.kind === "line") return { x: (e.start.x + e.end.x) / 2, y: (e.start.y + e.end.y) / 2 };
  const c = e.curve;
  return { x: (c.start.x + 3*c.control1.x + 3*c.control2.x + c.end.x) / 8, y: (c.start.y + 3*c.control1.y + 3*c.control2.y + c.end.y) / 8 };
}
function pointAlong(e: E, fraction: number): P {
  const t = Math.max(0, Math.min(1, fraction));
  if (e.kind === "line") return { x: e.start.x + (e.end.x-e.start.x)*t, y: e.start.y + (e.end.y-e.start.y)*t };
  const c=e.curve;
  const at=(u:number):P=>{const v=1-u;return{x:v*v*v*c.start.x+3*v*v*u*c.control1.x+3*v*u*u*c.control2.x+u*u*u*c.end.x,y:v*v*v*c.start.y+3*v*v*u*c.control1.y+3*v*u*u*c.control2.y+u*u*u*c.end.y};};
  const samples=Array.from({length:1001},(_,i)=>at(i/1000));
  const lengths=[0]; for(let i=1;i<samples.length;i++) lengths.push(lengths[i-1]+Math.hypot(samples[i].x-samples[i-1].x,samples[i].y-samples[i-1].y));
  const target=lengths[lengths.length-1]*t;
  let i=1;while(i<lengths.length-1&&lengths[i]<target)i++;
  const span=lengths[i]-lengths[i-1], f=span? (target-lengths[i-1])/span:0;
  return {x:samples[i-1].x+(samples[i].x-samples[i-1].x)*f,y:samples[i-1].y+(samples[i].y-samples[i-1].y)*f};
}
function path(e: E, tx: number, ty: number, scale: number): string {
  const f = (p: P) => `${tx + p.x*scale},${ty + p.y*scale}`;
  return e.kind === "line" ? `M ${f(e.start)} L ${f(e.end)}` : `M ${f(e.curve.start)} C ${f(e.curve.control1)} ${f(e.curve.control2)} ${f(e.curve.end)}`;
}
function edgeColor(name: string): string {
  if (/capLeft|frontNeckline|frontCollar|buttonPlacket|frontLeft|left/i.test(name)) return "#1d4ed8";
  if (/capRight|backNeckline|backCollar|buttonholePlacket|frontRight|right/i.test(name)) return "#c2410c";
  if (/waist|centerFront|centerBack|neckline|stand|collarBase/i.test(name)) return "#15803d";
  return "#334155";
}

await mkdir(new URL("./", import.meta.url), { recursive: true });
for (const current of cases) {
  const options = Object.fromEntries((current.recipe.options ?? []).map(o => [o.id, o.defaultValue])) as Record<string, number>;
  Object.assign(options, current.options ?? {});
  const block = current.recipe.draft(STANDARD_M, options);
  const pieces = current.roles.flatMap(role => block.roles[role] ? [{ role, piece: block.roles[role] as Piece }] : []);
  const scale = current.id === "trouser" ? 2.5 : current.id === "polo" ? 12 : current.id === "woven" ? 8 : 3.4;
  const tileW = current.id === "woven" || current.id === "polo" ? 420 : 480;
  const tileH = 350;
  const cols = 3;
  const rows = Math.ceil(pieces.length / cols);
  const headerH = 54;
  const svg: string[] = [`<svg xmlns="http://www.w3.org/2000/svg" width="${cols*tileW}" height="${headerH+rows*tileH}" viewBox="0 0 ${cols*tileW} ${headerH+rows*tileH}">`,
    `<rect width="100%" height="100%" fill="#fff"/><style>text{font-family:Arial,sans-serif}.title{font-size:20px;font-weight:bold}.role{font-size:15px;font-weight:bold}.edge{font-size:10px;paint-order:stroke;stroke:white;stroke-width:3px;stroke-linejoin:round}.note{font-size:11px;fill:#7c2d12}.small{font-size:10px;fill:#475569}</style>`,
    `<text class="title" x="16" y="28">${esc(current.id)} · exact live draft pieces · STANDARD_M</text>`,
    `<text class="small" x="16" y="45">Default recipe options; coordinates in cm; source geometry is drawn without transforms</text>`];
  const dump: any = {
    recipe: current.id,
    size: "STANDARD_M",
    options,
    sourceCommit: "5e03d371dc0986a95e4472bd642d63b07d201468",
    geometryBasis: "drafted directly from current recipe source at the S320 commit; no flat revision is claimed",
    roles: {},
    stitches: block.stitches,
  };
  pieces.forEach(({ role, piece }, index) => {
    const col = index % cols, row = Math.floor(index / cols);
    const ox = col * tileW, oy = headerH + row * tileH;
    const allPts = piece.edges.flatMap(points);
    const minX = Math.min(...allPts.map(p=>p.x)), maxX = Math.max(...allPts.map(p=>p.x));
    const minY = Math.min(...allPts.map(p=>p.y)), maxY = Math.max(...allPts.map(p=>p.y));
    const w = maxX-minX, h=maxY-minY;
    const s = Math.min(scale, (tileW-80)/Math.max(w,1), (tileH-100)/Math.max(h,1));
    const tx = ox+40 + (tileW-80-w*s)/2-minX*s;
    const ty = oy+54 + (tileH-100-h*s)/2-minY*s;
    svg.push(`<rect x="${ox+5}" y="${oy+5}" width="${tileW-10}" height="${tileH-10}" rx="5" fill="#f8fafc" stroke="#cbd5e1"/>`);
    svg.push(`<text class="role" x="${ox+16}" y="${oy+27}">${esc(role)} · ${esc(piece.name)} · onFold=${piece.onFold}</text>`);
    for (const edge of piece.edges) {
      const color = edgeColor(edge.name);
      svg.push(`<path d="${path(edge,tx,ty,s)}" fill="none" stroke="${color}" stroke-width="2.3"/>`);
      const p=mid(edge);
      svg.push(`<text class="edge" x="${tx+p.x*s+3}" y="${ty+p.y*s-4}" fill="${color}">${esc(edge.name)}</text>`);
    }
    let proposedLandmark: P | undefined;
    let proposedLabel = "";
    if (current.id === "polo" && role === "outerStand") {
      const b=piece.edges.find(e=>e.name==="backCollar"), f=piece.edges.find(e=>e.name==="frontCollar");
      if(b&&f) { proposedLandmark=b.kind==="line"?b.end:b.curve.end; proposedLabel="source junction: backCollar → frontCollar shoulder"; }
    }
    if (current.id === "woven" && role === "outerStand") {
      const line=piece.edges.find(e=>e.name==="neckline");
      const bodyBack=block.roles.yoke ?? block.roles.back;
      if(line&&bodyBack) {
        const frontNeck=block.roles.front.edges.find(e=>e.name==="neckline");
        const backNeck=bodyBack.edges.find(e=>e.name==="neckline");
        if(frontNeck&&backNeck) { const fraction=edgeApproxLength(backNeck)/(edgeApproxLength(backNeck)+edgeApproxLength(frontNeck)); proposedLandmark=pointAlong(line,1-fraction); proposedLabel="source interface station: rear neckline length"; }
      }
    }
    if ((current.id === "polo" && (role === "upperCollar" || role === "underCollar")) || (current.id === "woven" && (role === "upperCollar" || role === "underCollar"))) {
      const outer=piece.edges.find(e=>e.name==="outer");
      const baseBack=piece.edges.find(e=>e.name===(current.id==="polo"?"backCollarBase":"stand"));
      const baseFront=piece.edges.find(e=>e.name===(current.id==="polo"?"frontCollarBase":"stand"));
      let fraction:number|undefined;
      if(current.id==="polo"&&baseBack&&baseFront) fraction=edgeApproxLength(baseBack)/(edgeApproxLength(baseBack)+edgeApproxLength(baseFront));
      if(current.id==="woven") {
        const bodyBack=block.roles.yoke ?? block.roles.back;
        const frontNeck=block.roles.front.edges.find(e=>e.name==="neckline");
        const backNeck=bodyBack.edges.find(e=>e.name==="neckline");
        if(frontNeck&&backNeck) fraction=edgeApproxLength(backNeck)/(edgeApproxLength(backNeck)+edgeApproxLength(frontNeck));
      }
      if(outer&&fraction!==undefined) { proposedLandmark=pointAlong(outer,1-fraction); proposedLabel="PROPOSAL only: same normalized CB→CF fraction"; }
    }
    if(proposedLandmark) {
      svg.push(`<circle cx="${tx+proposedLandmark.x*s}" cy="${ty+proposedLandmark.y*s}" r="5" fill="#f59e0b" stroke="#7c2d12" stroke-width="1.5"/>`);
      svg.push(`<text class="note" x="${tx+proposedLandmark.x*s+7}" y="${ty+proposedLandmark.y*s+14}">${esc(proposedLabel)}</text>`);
    }
    if (current.id === "woven" && role === "outerStand") {
      const outer=piece.edges.find(e=>e.name==="collar");
      const bodyBack=block.roles.yoke ?? block.roles.back;
      const frontNeck=block.roles.front.edges.find(e=>e.name==="neckline");
      const backNeck=bodyBack.edges.find(e=>e.name==="neckline");
      if(outer&&frontNeck&&backNeck) {
        const fraction=edgeApproxLength(backNeck)/(edgeApproxLength(backNeck)+edgeApproxLength(frontNeck));
        const p=pointAlong(outer,fraction);
        svg.push(`<circle cx="${tx+p.x*s}" cy="${ty+p.y*s}" r="5" fill="#f59e0b" stroke="#7c2d12" stroke-width="1.5"/>`);
        svg.push(`<text class="note" x="${tx+p.x*s+7}" y="${ty+p.y*s-7}">PROPOSAL only: transfer source seam fraction to outer edge</text>`);
      }
    }
    for (const mark of piece.marks ?? []) {
      const pts = "at" in mark ? [mark.at] : [mark.start,mark.end];
      if (pts.length===1) {
        const p=pts[0]; svg.push(`<circle cx="${tx+p.x*s}" cy="${ty+p.y*s}" r="3.2" fill="#7c3aed"/>`);
        svg.push(`<text class="small" x="${tx+p.x*s+4}" y="${ty+p.y*s-5}">${esc(mark.name)}</text>`);
      } else {
        const [a,b]=pts; svg.push(`<path d="M ${tx+a.x*s},${ty+a.y*s} L ${tx+b.x*s},${ty+b.y*s}" stroke="#7c3aed" stroke-width="1.5" stroke-dasharray="4 3"/>`);
        const p={x:(a.x+b.x)/2,y:(a.y+b.y)/2}; svg.push(`<text class="small" x="${tx+p.x*s+3}" y="${ty+p.y*s-3}">${esc(mark.name)}</text>`);
      }
    }
    if (role === "sleeve") {
      const crown = piece.edges.find(e=>e.name==="capLeft");
      const hem = piece.edges.find(e=>e.name==="hem");
      if (crown?.kind === "curve" && hem?.kind === "line") {
        const x=crown.curve.end.x, y=(hem.start.y+hem.end.y)/2;
        svg.push(`<path d="M ${tx+x*s},${ty+crown.curve.end.y*s} L ${tx+x*s},${ty+y*s}" stroke="#d97706" stroke-width="2" stroke-dasharray="6 4"/>`);
        svg.push(`<text class="note" x="${tx+x*s+4}" y="${ty+(crown.curve.end.y+y)*s/2}">candidate split; no source mark</text>`);
      }
    }
    dump.roles[role] = piece;
  });
  svg.push(`</svg>`);
  await writeFile(new URL(`./${current.id}-source-topology.svg`, import.meta.url), svg.join("\n"));
  await writeFile(new URL(`./${current.id}-source-topology.json`, import.meta.url), JSON.stringify(dump,null,2)+"\n");
}

function edgeApproxLength(e:E):number {
  const ps=e.kind==="line"?[e.start,e.end]:Array.from({length:1001},(_,i)=>pointAlong(e,i/1000));
  let sum=0;for(let i=1;i<ps.length;i++)sum+=Math.hypot(ps[i].x-ps[i-1].x,ps[i].y-ps[i-1].y);return sum;
}
