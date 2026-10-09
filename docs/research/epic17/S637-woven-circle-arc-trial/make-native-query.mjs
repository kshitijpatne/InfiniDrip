import { writeFile } from "node:fs/promises";

const path = "C:/G04-CLO-DXF-Exchange/S637-woven-circle-arc-trial/query-native-input.py";
const source = `import json
import traceback

OUTPUT_PATH = r"C:\\G04-CLO-DXF-Exchange\\S637-woven-circle-arc-trial\\Evidence\\native-input-information.json"
PROJECT_PATH = r"C:\\G04-CLO-DXF-Exchange\\S637-woven-circle-arc-trial\\Project\\S637-woven-circle-arc-trial.zprj"
PROJECT_SHA256 = "723F6CDDEC96172CFD322E496D937820A84893B866CA1ED164F738099880D698"
report = {
    "slice": "S637",
    "scope": "read-only native geometry query after one exact-circle-locus ARC import",
    "clo_build_observed_ui": "2026.1.310 (r58944)",
    "intended_project": PROJECT_PATH,
    "intended_project_sha256": PROJECT_SHA256,
    "stage_contract": "not documented; packet/hash and imported geometry must independently identify the open scene",
    "methods": ["pattern_api.GetPatternCount", "pattern_api.GetPatternPieceName(index)", "pattern_api.GetPatternInputInformation(index)"],
    "pattern_count": None,
    "patterns": [],
    "errors": []
}
try:
    import pattern_api
    report["pattern_count"] = pattern_api.GetPatternCount()
    for index in range(report["pattern_count"]):
        item = {"pattern_index": index}
        try:
            item["pattern_name"] = pattern_api.GetPatternPieceName(index)
            raw = pattern_api.GetPatternInputInformation(index)
            item["input_information_raw"] = raw
            try:
                item["input_information"] = json.loads(raw) if isinstance(raw, str) else raw
            except Exception as error:
                item["parse_error"] = repr(error)
                report["errors"].append({"pattern_index": index, "stage": "parse", "error": repr(error)})
        except Exception as error:
            item["error"] = repr(error)
            report["errors"].append({"pattern_index": index, "stage": "query", "error": repr(error)})
        report["patterns"].append(item)
except Exception as error:
    report["fatal_error"] = repr(error)
    report["traceback"] = traceback.format_exc()
with open(OUTPUT_PATH, "w", encoding="utf-8") as output:
    json.dump(report, output, indent=2, ensure_ascii=False, default=str)
    output.write("\\n")
`;
await writeFile(path, source, "utf8");
console.log(`Wrote S637 read-only query script to ${path}`);
