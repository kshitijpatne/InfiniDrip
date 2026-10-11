import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { STANDARD_M } from "../../../../src/drafting/measurements";
import { draftPolo } from "../../../../src/drafting/polo";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";

type P = { x: number; y: number };
type Edge = { kind: "line"; name: string; start: P; end: P } | { kind: "curve"; name: string; curve: { start: P; control1: P; control2: P; end: P } };
type T = { offset: P; rotationDegrees: number; mirrorX?: boolean };
const block = draftPolo(STANDARD_M);
const fakeMap = { recipeId: "polo", revisionId: "live-draft:polo:1:1", faces: [
 { kind: "FRONT_FLAT", roles: [{ roleId: "sleeve", reversedStitchEdges: [{ stitchLabel: "Sleeve-cap ease", pieceId: "front", edgeId: "armhole" }] }] },
 { kind: "BACK_FLAT", roles: [{ roleId: "sleeve", localYReflection: { axis: "LOCAL_Y", basis: "APPROVED_VIEW_CONVENTION", decisionId: "G04-S321-TEE-FITTED-SLEEVE-VIEW-PAIR" } }] },
] } as any;
function point(e: Edge, end: "start" | "end"): P { return e.kind === "line" ? e[end] : e.curve[end]; }
function transform(p: P, t: T): P { const a=t.rotationDegrees*Math.PI/180; const x=t.mirrorX?-p.x:p.x; return {x:x*Math.cos(a)-p.y*Math.sin(a)+t.offset.x,y:x*Math.sin(a)+p.y*Math.cos(a)+t.offset.y}; }
function distance(a:P,b:P):number{return Math.hypot(a.x-b.x,a.y-b.y)}
function dEdge(e: Edge,t?:T, reflect=false): string {
 const tp=(p:P)=>{let q=t?transform(p,t):p;if(reflect)q={...q,x:-q.x};return `${q.x},${q.y}`};
 if(e.kind==="line")return `M ${tp(e.start)} L ${tp(e.end)}`;
 return `M ${tp(e.curve.start)} C ${tp(e.curve.control1)} ${tp(e.curve.control2)} ${tp(e.curve.end)}`;
}
function svgWrap(title:string, body:string, viewBox:string):string{return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="820" viewBox="${viewBox}"><rect width="100%" height="100%" fill="#fff"/><style>text{font:0.8px Arial,sans-serif}.title{font-size:1.4px;font-weight:bold}.label{font-size:0.72px;paint-order:stroke;stroke:#fff;stroke-width:0.16px;stroke-linejoin:round}.note{font-size:0.85px;fill:#7c2d12}.body{fill:#eef2ff;stroke:#334155;stroke-width:.16}.sleeve{fill:#ffedd5;stroke:#c2410c;stroke-width:.18}.candidate{fill:none;stroke:#c2410c;stroke-width:.22}.gap{fill:none;stroke:#dc2626;stroke-width:.22;stroke-dasharray:.35 .2}.gapDot{fill:#fff;stroke:#dc2626;stroke-width:.2}.join{stroke:#2563eb;stroke-width:.18;stroke-dasharray:.7 .45}.axis{stroke:#15803d;stroke-width:.15;stroke-dasharray:.6 .4}</style>${body}</svg>`}
function allEdgePaths(role:string,t?:T,reflect=false,cls="body"):string{
 const piece=block.roles[role]!;return (piece.edges as Edge[]).map(e=>`<path class="${cls}" d="${dEdge(e,t,reflect)}"/>`).join("");
}
const sleeve=block.roles.sleeve!.edges as Edge[];
function candidateRuns(kind:"FRONT_FLAT"|"BACK_FLAT",t:T,reflect=false):string{
 const edge=(id:string)=>sleeve.find(e=>e.name===id)!;
 const cap=kind==="FRONT_FLAT"?"capLeft":"capRight";
 const side=kind==="FRONT_FLAT"?"sideLeft":"sideRight";
 const hem=edge("hem");
 const mid={x:(hem.start.x+hem.end.x)/2,y:(hem.start.y+hem.end.y)/2};
 const hemPart:Edge={kind:"line",name:"hem-half",start:kind==="FRONT_FLAT"?hem.end:hem.start,end:mid};
 return [edge(cap),edge(side),hemPart].map(e=>`<path class="candidate" d="${dEdge(e,t,reflect)}"/>`).join("");
}
function shoulderGap(kind:"FRONT_FLAT"|"BACK_FLAT",t:T,reflect=false):string{
 const cap=sleeve.find(e=>e.name===(kind==="FRONT_FLAT"?"capLeft":"capRight"))!;
 const arm=(block.roles[kind==="FRONT_FLAT"?"front":"back"].edges as Edge[]).find(e=>e.name==="armhole")!;
 const sleevePoint=transform(point(cap,kind==="FRONT_FLAT"?"end":"start"),t);
 const bodyPoint=point(arm,"start");
 const a=reflect?{...sleevePoint,x:-sleevePoint.x}:sleevePoint;const b=reflect?{...bodyPoint,x:-bodyPoint.x}:bodyPoint;
 return `<path class="gap" d="M ${a.x},${a.y} L ${b.x},${b.y}"/><circle class="gapDot" cx="${a.x}" cy="${a.y}" r=".35"/><circle class="gapDot" cx="${b.x}" cy="${b.y}" r=".35"/>`;
}
const stitch=block.stitches.find(s=>s.label==="Sleeve-cap ease")!;
const sourceJson={recipe:"polo",size:"STANDARD_M",options:Object.fromEntries((block.metadata?.options??[]) as any),blockRoles:block.roles,stitch,classification:{directlyEncoded:["ordered capLeft+capRight to front.armhole+back.armhole stitch interfaces","shared cap crown; cap-side underarm joins; armhole shoulder and underarm endpoints","front/back center folds"],proposed:["front half capLeft+sideLeft+left hem; front armhole traversal reversed","back half capRight+sideRight+right hem; back armhole traversal direct","two mirrored display sleeve instances; no visible crown/hem partition"]}};
await mkdir(new URL("./",import.meta.url),{recursive:true});
for(const kind of ["FRONT_FLAT","BACK_FLAT"] as const){
 const result=assembleTechnicalFlatRoles("polo",block,kind,fakeMap);const tr=result.transforms.sleeve as T;
 const bodyRole=kind==="FRONT_FLAT"?"front":"back";
 const output=`<text class="title" x="-8" y="-10">${kind} · diagnostic candidate only · no face accepted</text><line class="axis" x1="0" y1="-2" x2="0" y2="75"/><text class="label" x=".5" y="-1">center ${kind.toLowerCase().split("_")[0]} fold axis</text>${allEdgePaths(bodyRole)}${allEdgePaths(bodyRole,undefined,true)}${candidateRuns(kind,tr,false)}${candidateRuns(kind,tr,true)}${shoulderGap(kind,tr,false)}${shoulderGap(kind,tr,true)}<text class="note" x="-8" y="78">Transform: (${tr.offset.x.toFixed(3)}, ${tr.offset.y.toFixed(3)}) cm; ${tr.rotationDegrees.toFixed(3)}° · mirrored pair shown as proposal</text><text class="note" x="-8" y="81">Orange: proposed visible cap/side/hem half-runs, mirrored across fold axis; no partition stroke.</text><text class="note" x="-8" y="84">Red dashed: 0.96 cm shoulder endpoint residual; current assembly gate rejects both faces. Candidate only.</text><text class="note" x="-8" y="87">Layer order: silhouette → artwork → seam → construction → darts/pleats → closure → topstitch → callout → annotation.</text>`;
 await writeFile(new URL(`./${kind.toLowerCase()}-candidate.svg`,import.meta.url),svgWrap(`${kind} candidate overlay`,output,"-55 -12 110 92"));
}
const frontTransform=assembleTechnicalFlatRoles("polo",block,"FRONT_FLAT",fakeMap).transforms.sleeve as T;
const backTransform=assembleTechnicalFlatRoles("polo",block,"BACK_FLAT",fakeMap).transforms.sleeve as T;
const capLeft=sleeve.find(e=>e.name==="capLeft") as Edge;const capRight=sleeve.find(e=>e.name==="capRight") as Edge;
const frontArm=(block.roles.front.edges as Edge[]).find(e=>e.name==="armhole") as Edge;const backArm=(block.roles.back.edges as Edge[]).find(e=>e.name==="armhole") as Edge;
const endpointResiduals={frontUnderarmCm:distance(transform(point(capLeft,"start"),frontTransform),point(frontArm,"end")),frontShoulderCm:distance(transform(point(capLeft,"end"),frontTransform),point(frontArm,"start")),backShoulderCm:distance(transform(point(capRight,"start"),backTransform),point(backArm,"start")),backUnderarmCm:distance(transform(point(capRight,"end"),backTransform),point(backArm,"end"))};
await writeFile(new URL("./source-trace.json",import.meta.url),JSON.stringify({recipe:"polo",size:"STANDARD_M",blockRevision:"live-draft:polo:1:1",transforms:{front:frontTransform,back:backTransform},endpointResiduals,issues:{front:assembleTechnicalFlatRoles("polo",block,"FRONT_FLAT",fakeMap).issues,back:assembleTechnicalFlatRoles("polo",block,"BACK_FLAT",fakeMap).issues},joins:stitch,sourcePieces:{front:block.roles.front,back:block.roles.back,sleeve:block.roles.sleeve},classification:sourceJson.classification},null,2)+"\n");
const matrix=JSON.parse(await readFile(path.resolve("docs/research/epic17/S331-polo-browser-final/matrix.json"),"utf8"));
const edgeSignature=(draft:any)=>({
 sleeve:draft.roles.sleeve.edges,
 frontArmhole:draft.roles.front.edges.filter((edge:any)=>edge.name==="armhole"),
 backArmhole:draft.roles.back.edges.filter((edge:any)=>edge.name==="armhole"),
 onFoldAxes:{front:draft.roles.front.onFold&&draft.roles.front.edges.some((edge:any)=>edge.name==="centerFront"&&edge.start.x===0&&edge.end.x===0),back:draft.roles.back.onFold&&draft.roles.back.edges.some((edge:any)=>edge.name==="centerBack"&&edge.start.x===0&&edge.end.x===0)},
});
const baseSignature=JSON.stringify(edgeSignature(block));
const optionTrace=matrix.cases.map((entry:any)=>{
 const draft=draftPolo(STANDARD_M,entry.options);
 const files=["front","back"].map(face=>`polo-${entry.caseId.replace(/^polo-/ ,"")}-${face}.svg`);
 const ids=files.map(async file=>{
  const text=await readFile(path.resolve("docs/research/epic17/S331-polo-browser",file),"utf8");
  return text.match(/data-revision-id="([^"]+)"/)?.[1]??null;
 });
 return {caseId:entry.caseId,options:entry.options,sourceTopologyMatchesDefault:JSON.stringify(edgeSignature(draft))===baseSignature,browserFiles:files,browserRevisionIds:ids};
});
for(const entry of optionTrace) entry.browserRevisionIds=await Promise.all(entry.browserRevisionIds);
await writeFile(new URL("./option-topology.json",import.meta.url),JSON.stringify({basis:"S331 live production browser case options, redrafted against current S332 recipe source",currentDefaultRevision:"live-draft:polo:1:1",sourceEdgesCompared:["sleeve all edges","front.armhole","back.armhole","onFold center axes remain x=0"],allMatchDefault:optionTrace.every((entry:any)=>entry.sourceTopologyMatchesDefault),cases:optionTrace},null,2)+"\n");
