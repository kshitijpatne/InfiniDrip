import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const dir="docs/research/epic17/S632-astm-import-mode-polo";
const root="C:/G04-CLO-DXF-Exchange/S632-astm-import-mode-polo";
const packet=await readFile(`${dir}/S632-exit-packet.md`,"utf8");
const board=JSON.parse(await readFile("ops/control-center/data/board.json","utf8"));
assert.equal(board.revision,3672);
for(const [id,status] of [["G04-V01","Done"],["G04-V02","Done"],["G04-V03","In Progress"],["EPIC-17","In Progress"]])assert.equal(board.workItems.find(x=>x.id===id)?.status,status);
assert(board.evidence.some(x=>x.id==="E-G04-S632-START"&&x.verified));
assert(board.evidence.some(x=>x.id==="E-G04-S632-EXIT"&&x.verified));
const sha=async p=>createHash("sha256").update(await readFile(p)).digest("hex").toUpperCase();
assert.equal(await sha(`${root}/Input/polo-standard-m-cm-units-header.dxf`),"71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5");
assert.equal(await sha(`${root}/Output/polo-astm-generation-1.dxf`),"E35FDF07742F5CC8EEC3FAFB9D6525BC43F9F37521682C09A87AC3B821C7643E");
assert.equal(await sha(`${root}/Output/polo-astm-generation-2.dxf`),"C4664A013C42404D33144E38192AE5B5195CA2FC0B0EABFBA13D28F8E1C32233");
assert.equal(await sha(`${root}/Evidence/polo-astm-generation-2-final-scene.zprj`),"EEB127A21CF4270197526B826F2634B5AF32175C00127111B1A69CCAEC81223B");
assert.equal(await sha(`${root}/Evidence/generation-2-astm-final-render.png`),"3AE6147FDAE7C94C7B5D26729473D9F8DDE7B1B6117FEB8570AB8A98E1CF767E");
for(const [gen,expectedCut,expectedSew,geometryHash,marksHash] of [["1",4,9,"A4560033EE7001B7B16E80F5431E093B321551F9206CA686B989DF401EFF06AF","479AC6EF2F5036683113F83E87DA396444986865C2FB9AC70FDDB44D03AC7CDD"],["2",4,9,"724A1F28D46C30E1F38F80E3D1EB822C2359861EBF0AFB0F19757A956278608B","E47B375B68B8F16E10B5CBC99E262FB027C0590975B1696F9E367158A257849D"]]){
  const g=JSON.parse(await readFile(`${root}/Evidence/Analysis/S632-generation-${gen}-geometry-analysis.json`,"utf8"));
  const m=JSON.parse(await readFile(`${root}/Evidence/Analysis/S632-generation-${gen}-mark-analysis.json`,"utf8"));
  assert.equal(g.thresholdCm,0.001); assert.equal(g.strictCutPassCount,expectedCut); assert.equal(g.strictSewPassCount,expectedSew);
  assert.deepEqual(g.results.filter(x=>!x.cut.passes).map(x=>x.piece),["back","outer collar stand","inner collar stand","upper pointed collar","under pointed collar"]);
  assert.equal(m.summary.sourceMarkCount,38); assert.equal(m.summary.sourcePointsWithExactlyOneOutputPointCandidate,12); assert.equal(m.summary.sourcePointsWithMultipleOutputPointCandidates,6); assert.equal(m.summary.sourcePointsWithoutDistinctOutputPoint,3); assert.equal(m.summary.lineUniqueGeometryMatchCount,11); assert.equal(m.summary.circleWholeCurvePassCount,0); assert.equal(m.summary.outputEntityKindsWithSourceSemanticLayer,0);
  assert.equal(await sha(`${root}/Evidence/Analysis/S632-generation-${gen}-geometry-analysis.json`),geometryHash);
  assert.equal(await sha(`${root}/Evidence/Analysis/S632-generation-${gen}-mark-analysis.json`),marksHash);
}
assert.match(packet,/five failures/u); assert.match(packet,/CLO's DXF-ASTM menu mode/u); assert.match(packet,/clears no V03 acceptance gate/u);
execFileSync("git",["diff","--check"],{stdio:"inherit"});
console.log("S632 post-replay preflight passed: pinned input, both generation reports/marks, 4/9 CUT and 9/9 SEW, five named CUT failures, board revision 3672, and unchanged acceptance.");
