import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
import { chromium } from "playwright";

const output = path.resolve("docs/research/epic17/S325-trouser-source-proposal");
await fs.mkdir(output, { recursive: true });
const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
let browser;
try {
  const [{ GARMENTS }, { STANDARD_M }, { defaultGarmentOptions }, { assembleTechnicalFlatRoles }, { G04_TECHNICAL_FLAT_MAPPINGS }, { edgeRef, markRef }] =
    await Promise.all([
      vite.ssrLoadModule("/src/drafting/recipe.ts"),
      vite.ssrLoadModule("/src/drafting/measurements.ts"),
      vite.ssrLoadModule("/src/drafting/options.ts"),
      vite.ssrLoadModule("/src/render/technical-flat-assembly.ts"),
      vite.ssrLoadModule("/src/render/technical-flat-mapping.ts"),
      vite.ssrLoadModule("/src/drafting/stitch.ts"),
    ]);
  const recipe = GARMENTS.find((candidate) => candidate.name === "trouser");
  const defaults = defaultGarmentOptions(recipe.options ?? []);
  const configurations = [{ id: "default", options: {} }];
  for (const option of recipe.options ?? []) {
    configurations.push({ id: `${option.id}-min`, options: { [option.id]: option.min } });
    configurations.push({ id: `${option.id}-max`, options: { [option.id]: option.max } });
  }
  const combination = { frontRiseEase: 2, backRiseEase: 11, thighEase: 10, kneeEase: 7, legOpening: 48 };
  configurations.push({ id: "combined-supported", options: combination });

  const originalMapping = G04_TECHNICAL_FLAT_MAPPINGS.trouser;
  G04_TECHNICAL_FLAT_MAPPINGS.trouser = {
    ...originalMapping,
    faces: originalMapping.faces.map((face) => face.kind === "FRONT_FLAT"
      ? { ...face, roles: [...face.roles, { roleId: "flyUnderlap", treatment: "INTERIOR_HIDDEN" }] }
      : face),
  };
  const matrix = [];
  let defaultBlock;
  for (const configuration of configurations) {
    const options = { ...defaults, ...configuration.options };
    const block = recipe.draft(STANDARD_M, options);
    if (configuration.id === "default") defaultBlock = block;
    const current = assembleTechnicalFlatRoles("trouser", block, "FRONT_FLAT");
    const length = options.flyLength;
    const width = 3.5;
    const flyUnderlap = {
      name: "PROPOSED trouser fly underlap extension — research fixture only",
      onFold: false,
      edges: [
        { kind: "line", name: "frontEdge", start: { x: 0, y: 0 }, end: { x: 0, y: length } },
        { kind: "line", name: "bottom", start: { x: 0, y: length }, end: { x: -width, y: length } },
        { kind: "line", name: "shieldEdge", start: { x: -width, y: length }, end: { x: -width, y: 0 } },
        { kind: "line", name: "top", start: { x: -width, y: 0 }, end: { x: 0, y: 0 } },
      ],
      marks: [],
    };
    const roles = { ...block.roles, flyUnderlap };
    const stitches = block.stitches.filter((stitch) => stitch.label !== "Right front fly ↔ shield");
    stitches.push(
      { label: "Right front fly ↔ proposed underlap", a: { edges: [markRef("frontRight", "flyEdge", "right")] }, b: { edges: [edgeRef("flyUnderlap", "frontEdge")] } },
      { label: "Proposed underlap ↔ shield.right", a: { edges: [edgeRef("flyUnderlap", "shieldEdge")] }, b: { edges: [edgeRef("flyShield", "right")] } },
    );
    const proposedBlock = { ...block, roles, stitches };
    const candidate = assembleTechnicalFlatRoles("trouser", proposedBlock, "FRONT_FLAT");
    const originalLeftWaist = block.roles.frontLeft.edges.find((edge) => edge.name === "waist");
    const originalRightWaist = block.roles.frontRight.edges.find((edge) => edge.name === "waist");
    const proposalLeftWaist = proposedBlock.roles.frontLeft.edges.find((edge) => edge.name === "waist");
    const proposalRightWaist = proposedBlock.roles.frontRight.edges.find((edge) => edge.name === "waist");
    const unchangedWaist = JSON.stringify(originalLeftWaist) === JSON.stringify(proposalLeftWaist)
      && JSON.stringify(originalRightWaist) === JSON.stringify(proposalRightWaist);
    const transforms = candidate.transforms;
    const upright = Math.abs(transforms.frontLeft?.rotationDegrees ?? 999) < 1e-8
      && Math.abs(transforms.frontRight?.rotationDegrees ?? 999) < 1e-8;
    const axes = [block.roles.frontLeft, block.roles.frontRight].map((piece) => {
      const edge = piece.edges.find((candidateEdge) => candidateEdge.name === "centerFront");
      return edge?.kind === "line" ? { start: edge.start, end: edge.end } : null;
    });
    const sameBandFragments = JSON.stringify(current.sourceFragments) === JSON.stringify(candidate.sourceFragments);
    const centerJoinResidualCm = axes[0] && axes[1]
      ? Math.max(
        Math.hypot(axes[0].start.x + (transforms.frontLeft?.offset.x ?? 0)
          - axes[1].start.x - (transforms.frontRight?.offset.x ?? 0),
          axes[0].start.y + (transforms.frontLeft?.offset.y ?? 0)
          - axes[1].start.y - (transforms.frontRight?.offset.y ?? 0)),
        Math.hypot(axes[0].end.x + (transforms.frontLeft?.offset.x ?? 0)
          - axes[1].end.x - (transforms.frontRight?.offset.x ?? 0),
          axes[0].end.y + (transforms.frontLeft?.offset.y ?? 0)
          - axes[1].end.y - (transforms.frontRight?.offset.y ?? 0)),
      ) : Number.POSITIVE_INFINITY;
    matrix.push({
      caseId: configuration.id,
      options: configuration.options,
      flyLengthCm: length,
      shieldWidthCm: width,
      existing: {
        issues: current.issues,
        transforms: current.transforms,
        frontWaistJoins: { frontLeft: originalLeftWaist, frontRight: originalRightWaist },
        flyMarks: ["frontLeft", "frontRight"].map((roleId) => {
          const mark = block.roles[roleId].marks?.find((candidateMark) => candidateMark.name === "flyEdge");
          return { roleId, mark: mark && "start" in mark ? { start: mark.start, end: mark.end } : null };
        }),
      },
      proposalFixture: {
        issues: candidate.issues,
        transforms,
        joinedStitchLabels: candidate.joinedStitchLabels,
        sourceFragments: candidate.sourceFragments,
        unchangedWaistEdges: unchangedWaist,
        uprightPanels: upright,
        sameBandFragments,
        centerJoinResidualCm,
        coincidentOriginalCenterFrontAxes: axes[0] && axes[1]
          ? Math.abs(axes[0].start.x - axes[1].start.x) < 1e-10
            && Math.abs(axes[0].end.x - axes[1].end.x) < 1e-10
            && Math.abs(axes[0].start.y - axes[1].start.y) < 1e-10
            && Math.abs(axes[0].end.y - axes[1].end.y) < 1e-10
          : false,
        sourceRolesAddedOnlyInMemory: ["flyUnderlap"],
        stitchChangesOnlyInMemory: ["Right front fly ↔ proposed underlap", "Proposed underlap ↔ shield.right"],
      },
    });
  }
  G04_TECHNICAL_FLAT_MAPPINGS.trouser = originalMapping;
  const matrixReport = {
    currentSourceCommit: "4beeafe3f8805b0b0685ae8d03175ed406432fb9",
    sourceFilesChanged: false,
    candidatePersistedToRecipe: false,
    acceptedOutput: false,
    scopeNote: "The proposed flyUnderlap role/stitches exist only in this process. This is assembly feasibility evidence, not source implementation or construction approval.",
    configurationCount: matrix.length,
    optionFieldCount: recipe.options?.length ?? 0,
    matrix,
    summary: {
      candidateIssueCases: matrix.filter((entry) => entry.proposalFixture.issues.length > 0).map((entry) => entry.caseId),
      nonUprightCases: matrix.filter((entry) => !entry.proposalFixture.uprightPanels).map((entry) => entry.caseId),
      changedWaistCases: matrix.filter((entry) => !entry.proposalFixture.unchangedWaistEdges).map((entry) => entry.caseId),
      missingFrontJoinCases: matrix.filter((entry) => !entry.proposalFixture.coincidentOriginalCenterFrontAxes).map((entry) => entry.caseId),
      changedBandFragmentCases: matrix.filter((entry) => !entry.proposalFixture.sameBandFragments).map((entry) => entry.caseId),
      nonzeroCenterJoinCases: matrix.filter((entry) => entry.proposalFixture.centerJoinResidualCm > 1e-8).map((entry) => entry.caseId),
    },
  };
  await fs.writeFile(path.join(output, "assembly-feasibility-matrix.json"), `${JSON.stringify(matrixReport, null, 2)}\n`);

  const block = defaultBlock;
  const left = block.roles.frontLeft;
  const right = block.roles.frontRight;
  const shield = block.roles.flyShield;
  const waistband = block.roles.waistband;
  const label = (x, y, text, color = "#172b3a", size = 15) => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}">${text}</text>`;
  const line = (a, b, color = "#334155", width = 3, dash = "") => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" stroke-width="${width}" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`;
  const pathPiece = (piece, tx, ty, scale, color = "#334155") => piece.edges.map((edge) => {
    const a = edge.kind === "line" ? edge.start : edge.curve.start;
    const b = edge.kind === "line" ? edge.end : edge.curve.end;
    return line({ x: tx + a.x * scale, y: ty + a.y * scale }, { x: tx + b.x * scale, y: ty + b.y * scale }, /waist|centerFront|fly/i.test(edge.name) ? "#15803d" : color, 3);
  }).join("");
  const frontMark = left.marks.find((mark) => mark.name === "flyEdge");
  const rightMark = right.marks.find((mark) => mark.name === "flyEdge");
  const L = defaults.flyLength;
  const W = 3.5;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1040" viewBox="0 0 1500 1040">
  <defs><clipPath id="front-left-zoom"><rect x="25" y="130" width="460" height="245"/></clipPath><clipPath id="front-right-zoom"><rect x="520" y="130" width="460" height="245"/></clipPath></defs>
  <rect width="1500" height="1040" fill="#f1f5f9"/><rect x="18" y="15" width="1464" height="50" rx="5" fill="#8b1d2c"/><text x="38" y="48" fill="white" font-family="Arial" font-size="22" font-weight="bold">S325 TROUSER FLY — SOURCE EVIDENCE AND PROPOSAL ONLY · NOT AN ACCEPTED FLAT</text>
  <rect x="20" y="82" width="470" height="405" rx="8" fill="white" stroke="#94a3b8"/><text x="40" y="112" font-family="Arial" font-size="18" font-weight="bold">Current frontLeft · exact source piece</text>
  <g clip-path="url(#front-left-zoom)">${pathPiece(left, 112, 148, 5.7)}</g>${label(114,153,"flyEdge = x0; current mark (0,0) → (0,15)","#6d28d9",13)}
  <rect x="515" y="82" width="470" height="405" rx="8" fill="white" stroke="#94a3b8"/><text x="535" y="112" font-family="Arial" font-size="18" font-weight="bold">Current frontRight + proposed extension</text>
  <g clip-path="url(#front-right-zoom)">${pathPiece(right, 842, 148, 5.7)}</g>
  <rect x="822" y="148" width="19.95" height="85.5" fill="#f59e0b" fill-opacity="0.28" stroke="#c2410c" stroke-width="3" stroke-dasharray="7 4"/>
  ${label(560,153,"source flyEdge is at x0", "#6d28d9",13)}${label(560,174,"PROPOSAL: add a separate 3.5 cm × flyLength underlap", "#c2410c",13)}${label(560,195,"frontEdge x0 joins frontRight.flyEdge; shieldEdge x−3.5 joins shield.right", "#c2410c",12)}
  ${label(40,455,"Top panels cropped below y≈40 cm; lower legs omitted. Green = unchanged joins; violet = marks; orange = proposal.", "#475569",12)}
  <rect x="20" y="510" width="470" height="480" rx="8" fill="white" stroke="#94a3b8"/><text x="40" y="542" font-family="Arial" font-size="18" font-weight="bold">Current flyShield · exact source edges</text>
  ${line({x:135,y:650},{x:135,y:735},"#2563eb",6)}${line({x:155,y:650},{x:155,y:735},"#c2410c",6)}${line({x:135,y:650},{x:155,y:650},"#334155",3)}${line({x:155,y:735},{x:135,y:735},"#334155",3)}
  ${label(70,638,"left: (0,15) → (0,0)","#2563eb",13)}${label(168,691,"right: (3.5,0) → (3.5,15)","#c2410c",13)}${label(55,780,"Current role has two distinct 15 cm edges, 3.5 cm apart.","#475569",13)}
  <rect x="515" y="510" width="470" height="480" rx="8" fill="white" stroke="#94a3b8"/><text x="535" y="542" font-family="Arial" font-size="18" font-weight="bold">Proposal-level assembly relation</text>
  ${line({x:610,y:650},{x:610,y:735},"#2563eb",7)}${line({x:750,y:650},{x:750,y:735},"#c2410c",7)}${line({x:610,y:650},{x:750,y:650},"#c2410c",4,"7 4")}${line({x:750,y:735},{x:610,y:735},"#c2410c",4,"7 4")}
  ${label(540,630,"frontLeft.flyEdge", "#2563eb",13)}${label(765,630,"frontRight.flyEdge", "#c2410c",13)}${label(620,760,"left mark → shield.left", "#2563eb",13)}${label(620,785,"right mark → new underlap.frontEdge", "#c2410c",13)}${label(620,810,"new underlap.shieldEdge → shield.right", "#c2410c",13)}
  ${label(535,860,"Underlap is hidden interior output. Its outer edge reaches the second, distinct shield edge.","#475569",12)}${label(535,884,"Both original waist edges and panel centerFront endpoints stay at their source coordinates.","#15803d",12)}
  <rect x="1010" y="82" width="470" height="908" rx="8" fill="white" stroke="#94a3b8"/><text x="1030" y="112" font-family="Arial" font-size="18" font-weight="bold">Waistband join preservation</text>
  ${line({x:1080,y:205},{x:1400,y:205},"#15803d",8)}${line({x:1080,y:235},{x:1400,y:235},"#64748b",8)}${label(1080,185,"one current waistband source role", "#15803d",13)}${label(1080,266,"current bottom edge length equals the four authored waist edges", "#475569",12)}
  ${label(1040,355,"Exact unchanged front joins:","#172b3a",16)}${label(1040,385,"frontLeft.waist starts at (0,0)","#15803d",14)}${label(1040,412,"frontRight.waist starts at (0,0)","#15803d",14)}${label(1040,439,"both centerFront edges start at x=0", "#15803d",14)}
  ${label(1040,530,"Open product decision:","#8b1d2c",16)}${label(1040,560,"frontRight underlap layer sits behind frontLeft at CF.","#8b1d2c",13)}${label(1040,585,"This is a proposed style choice, not pattern evidence.","#8b1d2c",13)}
  ${label(1040,685,"Feasibility prototype only:","#172b3a",16)}${label(1040,715,"candidate role/stitches added in memory for 24 options;", "#475569",12)}${label(1040,740,"no source file or export was modified.", "#475569",12)}${label(1040,820,"Proposal does not prove physical sewing or fit.","#475569",13)}
  <text x="40" y="1020" font-family="Arial" font-size="12" fill="#475569">Current geometry from S325 source revision 4beeafe · all measurements in cm · orange proposal must be approved before implementation</text>
  </svg>`;
  await fs.writeFile(path.join(output, "trouser-source-and-proposal.svg"), svg, "utf8");
  const sourceRecord = {
    sourceCommit: "4beeafe3f8805b0b0685ae8d03175ed406432fb9",
    size: "STANDARD_M",
    options: defaults,
    roles: Object.fromEntries(["frontLeft", "frontRight", "flyShield", "waistband"].map((roleId) => [roleId, block.roles[roleId]])),
    stitches: block.stitches.filter((stitch) => /Waistband|front fly/.test(stitch.label)),
    proposal: { newRole: "flyUnderlap", widthCm: W, lengthOption: "flyLength", addedInMemoryOnly: true },
    feasibility: matrixReport.summary,
  };
  await fs.writeFile(path.join(output, "trouser-source-and-proposal.json"), `${JSON.stringify(sourceRecord, null, 2)}\n`, "utf8");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1040 }, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(output, "trouser-source-and-proposal.png"), fullPage: true, animations: "disabled" });
  process.stdout.write(`${JSON.stringify({ image: "trouser-source-and-proposal.png", ...matrixReport.summary,
    configurations: matrixReport.configurationCount, options: matrixReport.optionFieldCount }, null, 2)}\n`);
} finally {
  await browser?.close();
  await vite.close();
}
