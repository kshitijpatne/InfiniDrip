import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/";
const evidence = [
  ["Input/polo-standard-m.dxf", "796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA"],
  ["S498-practical-retest/Output/polo-standard-m-s498-clo-export.dxf", "523DBD2D7F2E1E6440A1DEFF254EFA1137B1BF37BB0C9070DA6681144594722C"],
  ["S498-practical-retest/Output/polo-standard-m-s498-generation-2.dxf", "2A878FA0D00D289CF733718DEBC77B755C2E033B9834E53B1A9E76D948F0A0F8"],
  ["S503-polo-import-options/Output/polo-aama-opt-off-s503.dxf", "694929062CED7A585C32DD0CAE50A887085E31E2E90742FBC2CB2CDA5B0C025A"],
  ["S503-polo-import-options/Output/polo-aama-opt-on-s503.dxf", "630195B57D63EC0D381F5CAD56B301B1D580FF35983C515E1DF9EEC4299E97C6"],
  ["S503-polo-import-options/Output/polo-astm-opt-off-s503.dxf", "F2EE29811C7D23442C0AFB23B40E2E69ED20EDF21745841CDF62F2FC9D292582"],
  ["S503-polo-import-options/Output/polo-astm-opt-on-s503.dxf", "5468BD3128ED4253B9AE15257474D997EBAFF42B348A33E60180C9DA4C6033D6"],
  ["S508-polo-standard-export-roundtrip/Output/polo-standard-1000-export.dxf", "2B27BF1ED1EDE414E6B67CC83FC0221B87D358691F6E59FCBD73C067943A0AFB"],
  ["S508-polo-standard-export-roundtrip/Output/polo-standard-100-roundtrip-export2.dxf", "ED1E13DDB359F4AB0E1FFFF1CA638AD8500A26A5A62FFBABDFAF230E8798CA04"],
  ["S516-clo-aama-roundtrip/Output/polo-aama-export-01.dxf", "BB5D4D572F51CB30EEB9EF983C3D600757117F8A9C0863A1146B33409CE55ED1"],
  ["S574-polo-line-chain-representation/Input/polo-source-m-cut-lines.dxf", "A95E2CBAFAA14555421517505CA83225E9E0ACB26DBADB4B7FA62AC5A0D1B675"],
  ["S574-polo-line-chain-representation/Output/polo-line-chain-gen1.dxf", "346F38A02748F96247716D9E5A992912CC018CB2EEB4506C092C4F43EEDAF1E3"],
  ["S574-polo-line-chain-representation/Evidence/clo-after-line-chain-import.zprj", "43AB4CD6DE6A823CF671BF7FE748ABC4052744A396E3DBCB0FE9539055D39E25"],
  ["S584-preexport-clo-input-isolation/Evidence/preexport-pattern-input-information.json", "E422018EB0735BB4C34004506CCF5B53C810C83FEC4BA8F48EDE1B38515B4736"],
];

for (const [relativePath, expected] of evidence) {
  const bytes = await readFile(`${root}${relativePath}`);
  const actual = createHash("sha256").update(bytes).digest("hex").toUpperCase();
  assert.equal(actual, expected, `${relativePath} hash mismatch`);
}

const s584 = JSON.parse(await readFile(`${root}S584-preexport-clo-input-isolation/Evidence/preexport-pattern-input-information.json`, "utf8"));
assert.equal(s584.pattern_count, 9);
assert.equal(s584.patterns.length, 9);
assert.equal(s584.error, null);
for (let index = 0; index < 9; index += 1) {
  const getter = s584.patterns[index].information.GetPatternInputInformation;
  assert.equal(getter.call_error, null);
  assert.equal(getter.parse_error, null);
}
console.log(`S585 verified ${evidence.length} existing CLO artifact hashes and all nine S584 getter records.`);
