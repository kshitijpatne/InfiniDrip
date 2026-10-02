import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { cubicLength, point } from "../../../../src/geometry";
import { block, rolePiece } from "../../../../src/drafting/block";
import { STANDARD_M } from "../../../../src/drafting/measurements";
import { draftPolo } from "../../../../src/drafting/polo";
import { POLO } from "../../../../src/drafting/recipe";
import { pieceEdge, edgeLength, edgeStart, edgeEnd } from "../../../../src/drafting/piece";
import { stitchChecks } from "../../../../src/drafting/stitch";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection";
import { compileTechnicalFlatLiveView } from "../../../../src/render/technical-flat-live";
import { renderTechnicalFlatSvg } from "../../../../src/render/technical-flat-svg";
import { chromium } from "playwright";

const root = process.cwd();
const baseline = JSON.parse(await readFile(resolve(root, "docs/research/epic17/S331-polo-browser-final/matrix.json"), "utf8"));
const easeCandidates = [0, 1.5];
const widthReductionsCm = [0, 0.5, 1, 1.308541933230025, 1.5];

function capCurves(width: number, capHeight: number) {
  const half = width / 2;
  return [
    { start: point(0, capHeight), control1: point(half * 0.5, capHeight),
      control2: point(half * 0.55, capHeight * 0.15), end: point(half, 0) },
    { start: point(half, 0), control1: point(width - half * 0.55, capHeight * 0.15),
      control2: point(width - half * 0.5, capHeight), end: point(width, capHeight) },
  ] as const;
}

function capLength(width: number, height: number): number {
  return capCurves(width, height).reduce((sum, curve) => sum + cubicLength(curve), 0);
}

function solveHeight(width: number, targetLength: number): number {
  let low = 0;
  let high = width;
  for (let index = 0; index < 30; index += 1) {
    const middle = (low + high) / 2;
    if (capLength(width, middle) < targetLength) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

function withEase(blockValue: ReturnType<typeof draftPolo>, ease: number, widthReductionCm: number) {
  const sleeve = rolePiece(blockValue, "sleeve");
  const sourceWidth = edgeStart(pieceEdge(sleeve, "sideRight")).x;
  const width = sourceWidth - widthReductionCm;
  const bodyArmholeLength = edgeLength(pieceEdge(rolePiece(blockValue, "front"), "armhole"))
    + edgeLength(pieceEdge(rolePiece(blockValue, "back"), "armhole"));
  const height = solveHeight(width, bodyArmholeLength + ease);
  const [left, right] = capCurves(width, height);
  const sourceHeight = edgeStart(pieceEdge(sleeve, "capLeft")).y;
  const sleeveLength = edgeEnd(pieceEdge(sleeve, "sideRight")).y - sourceHeight;
  const hemY = height + sleeveLength;
  const rightHem = point(width - 3, hemY);
  const leftHem = point(3, hemY);
  const edges = sleeve.edges.map((edge) => {
    if (edge.name === "capLeft") return { kind: "curve" as const, name: edge.name, curve: left };
    if (edge.name === "capRight") return { kind: "curve" as const, name: edge.name, curve: right };
    if (edge.name === "sideRight") return { kind: "line" as const, name: edge.name,
      start: point(width, height), end: rightHem };
    if (edge.name === "hem") return { kind: "line" as const, name: edge.name, start: rightHem, end: leftHem };
    if (edge.name === "sideLeft") return { kind: "line" as const, name: edge.name,
      start: leftHem, end: point(0, height) };
    return edge;
  });
  const candidateBlock = block({ ...blockValue.roles, sleeve: { ...sleeve, edges } }, blockValue.stitches);
  const candidateSleeve = rolePiece(candidateBlock, "sleeve");
  const joinResiduals = [
    Math.hypot(edgeStart(pieceEdge(candidateSleeve, "capLeft")).x - edgeEnd(pieceEdge(candidateSleeve, "sideLeft")).x,
      edgeStart(pieceEdge(candidateSleeve, "capLeft")).y - edgeEnd(pieceEdge(candidateSleeve, "sideLeft")).y),
    Math.hypot(edgeEnd(pieceEdge(candidateSleeve, "capLeft")).x - edgeStart(pieceEdge(candidateSleeve, "capRight")).x,
      edgeEnd(pieceEdge(candidateSleeve, "capLeft")).y - edgeStart(pieceEdge(candidateSleeve, "capRight")).y),
    Math.hypot(edgeEnd(pieceEdge(candidateSleeve, "capRight")).x - edgeStart(pieceEdge(candidateSleeve, "sideRight")).x,
      edgeEnd(pieceEdge(candidateSleeve, "capRight")).y - edgeStart(pieceEdge(candidateSleeve, "sideRight")).y),
    Math.hypot(edgeEnd(pieceEdge(candidateSleeve, "sideRight")).x - edgeStart(pieceEdge(candidateSleeve, "hem")).x,
      edgeEnd(pieceEdge(candidateSleeve, "sideRight")).y - edgeStart(pieceEdge(candidateSleeve, "hem")).y),
    Math.hypot(edgeEnd(pieceEdge(candidateSleeve, "hem")).x - edgeStart(pieceEdge(candidateSleeve, "sideLeft")).x,
      edgeEnd(pieceEdge(candidateSleeve, "hem")).y - edgeStart(pieceEdge(candidateSleeve, "sideLeft")).y),
  ];
  const capEaseCheck = stitchChecks(candidateBlock, candidateBlock.stitches.filter((stitch) => stitch.label === "Sleeve-cap ease"));
  const sleevePomValues = Object.fromEntries(POLO.poms.filter((pom) => /Sleeve (bicep width|length \(cap–hem\)|hem)/i.test(pom.label))
    .map((pom) => [pom.label, pom.measure(candidateBlock)]));
  return { block: candidateBlock,
    metrics: { easeCm: ease, widthReductionCm, sourceWidthCm: sourceWidth,
      bodyArmholeLengthCm: bodyArmholeLength, sleeveWidthCm: width,
      capHeightCm: height, sourceCapLengthCm: edgeLength(pieceEdge(sleeve, "capLeft"))
        + edgeLength(pieceEdge(sleeve, "capRight")), candidateCapLengthCm: edgeLength({ kind: "curve", name: "capLeft", curve: left })
          + edgeLength({ kind: "curve", name: "capRight", curve: right }),
      sourceSleeveLengthCm: sleeveLength, hemYChangeCm: height - sourceHeight,
      maxPieceClosureGapCm: Math.max(...joinResiduals), capEaseCheck, sleevePomValues } };
}

const rows = [];
const diagnosticOutputs = [];
const selectedRenderCases = new Set(["polo-default", "polo-standHeight-max", "polo-collarLeafDepth-max"]);
const browser = await chromium.launch({ headless: true });
for (const entry of baseline.cases) {
  const sourceBlock = draftPolo(STANDARD_M, entry.options);
  for (const ease of easeCandidates) for (const widthReductionCm of widthReductionsCm) {
    const candidate = withEase(sourceBlock, ease, widthReductionCm);
    const revisionId = `s357-ease-${ease}-width-minus-${widthReductionCm}:${entry.caseId}`;
    const projection = createG04TechnicalFlatProjectionMap("polo", candidate.block, revisionId);
    const faces = [];
    for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
      const assembly = assembleTechnicalFlatRoles("polo", candidate.block, kind, projection);
      const residuals = assembly.issues.filter((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL")
        .map((issue) => ({ sourceId: issue.sourceId, message: issue.message }));
      const sleeveCapStitch = candidate.block.stitches.find((stitch) => stitch.label === "Sleeve-cap ease");
      faces.push({ kind, issueCount: assembly.issues.length, residuals,
        transforms: Object.keys(assembly.transforms).sort(),
        sleeveStitchStillAuthored: !!sleeveCapStitch,
        });
    }
    rows.push({ caseId: entry.caseId, options: entry.options, revisionId, ...candidate.metrics, faces });
    if (ease === 0 && widthReductionCm === 1.5 && selectedRenderCases.has(entry.caseId)) {
      for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
        const renderedView = compileTechnicalFlatLiveView({ recipe: { ...POLO, poms: [] }, block: candidate.block,
          revisionId, kind, placements: [], colorHex: "#3A4150", texture: "woven", shine: 0 });
        if (!renderedView.view) {
          diagnosticOutputs.push({ caseId: entry.caseId, kind, revisionId, issues: renderedView.issues });
          continue;
        }
        let svgResult = renderTechnicalFlatSvg(renderedView.view, { colorway: renderedView.colorway,
          title: `Polo ${kind} diagnostic candidate — ease 0 cm, sleeve width −1.5 cm — ${entry.caseId}`,
          measureText: (text, fontSizeCm) => ({ widthCm: text.length * fontSizeCm * 0.35,
            ascentCm: fontSizeCm * 0.7, descentCm: fontSizeCm * 0.2 }) });
        const colorwayIssues = svgResult.issues;
        if (!svgResult.svg) svgResult = renderTechnicalFlatSvg(renderedView.view, {
          title: `Polo ${kind} diagnostic candidate with colorway withheld — ${entry.caseId}`,
          measureText: (text, fontSizeCm) => ({ widthCm: text.length * fontSizeCm * 0.35,
            ascentCm: fontSizeCm * 0.7, descentCm: fontSizeCm * 0.2 }) });
        if (!svgResult.svg) throw new Error(`${entry.caseId}/${kind}: candidate SVG failed ${JSON.stringify(svgResult.issues)}`);
        const watermarked = svgResult.svg.replace("</svg>",
          '<g data-diagnostic-warning="true"><rect x="-45" y="-27" width="90" height="1.3" fill="#fff7ed" stroke="#b45309" stroke-width=".08"/><text x="0" y="-26.1" text-anchor="middle" font-family="Arial,sans-serif" font-size=".65" fill="#713c16">DIAGNOSTIC ONLY — 0 cm cap ease, sleeve width −1.5 cm, POM/colorway overlays omitted — NOT ACCEPTED</text></g></svg>');
        const name = `${entry.caseId}-${kind.toLowerCase()}-ease0-widthminus1_5`;
        await writeFile(resolve(root, `docs/research/epic17/S357-polo-ease-residual/${name}.svg`), watermarked);
        const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
        await page.setContent(watermarked, { waitUntil: "load" });
        await page.locator("svg").screenshot({ path: resolve(root, `docs/research/epic17/S357-polo-ease-residual/${name}.png`) });
        await page.close();
        if (errors.length) throw new Error(`${entry.caseId}/${kind}: browser errors ${JSON.stringify(errors)}`);
        diagnosticOutputs.push({ caseId: entry.caseId, kind, revisionId, svg: `${name}.svg`, png: `${name}.png`,
          colorwayIssues, poms: "omitted for silhouette-only diagnostic", errors });
      }
    }
  }
}
await browser.close();

const report = { source: "current draftPolo(STANDARD_M, S331 options); cap curve formula and 30-iteration height solver reproduced verbatim from src/drafting/sleeve.ts; diagnostic candidate changes cap ease and/or reduces sleeve width in memory, then rebuilds cap/side/hem edges.",
  configurations: baseline.cases.length, candidateEaseCm: easeCandidates, widthReductionsCm, rows, diagnosticOutputs };
const directory = resolve(root, "docs/research/epic17/S357-polo-ease-residual");
await mkdir(directory, { recursive: true });
await writeFile(resolve(directory, "ease-candidate-matrix.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ configurations: report.configurations, variants: easeCandidates.length * widthReductionsCm.length,
  rows: rows.length, faceCount: rows.reduce((sum, row) => sum + row.faces.length, 0),
  summary: easeCandidates.flatMap((ease) => widthReductionsCm.map((widthReductionCm) => {
    const variant = rows.filter((row) => row.easeCm === ease && row.widthReductionCm === widthReductionCm);
    const residualFaceCount = variant.reduce((sum, row) => sum + row.faces.filter((face) => face.residuals.length).length, 0);
    const residualValues = variant.flatMap((row) => row.faces.flatMap((face) => face.residuals.map((issue) =>
      Number(issue.message.match(/([\d.]+) cm/)?.[1] ?? 0))));
    const maxResidual = residualValues.length ? Math.max(...residualValues) : 0;
    return { easeCm: ease, widthReductionCm, facesWithResidual: residualFaceCount, maxResidualCm: maxResidual,
      minCapLengthCm: Math.min(...variant.map((row) => row.candidateCapLengthCm)),
      maxCapLengthCm: Math.max(...variant.map((row) => row.candidateCapLengthCm)),
      maxSleeveHeightChangeCm: Math.max(...variant.map((row) => Math.abs(row.hemYChangeCm))) };
  })) }, null, 2));
