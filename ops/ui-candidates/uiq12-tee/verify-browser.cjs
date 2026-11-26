// Slice 1342. Use the production-built, localhost-only candidate.
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { performance } = require("node:perf_hooks");
const { chromium } = require("playwright");

const CANDIDATE = __dirname;
const ROOT = path.resolve(CANDIDATE, "../../..");
const BUILD = process.env.UIQ12_BUILD || path.join(CANDIDATE, "dist");
const BASELINE = "d43370b686852d279d347257d06fde8ae824c5dc";
const VIEWPORT = { width: 1920, height: 1080 };
const IDLE_MS = 2000;
const EDIT_SAMPLES = 30;
const INTERACTION_MS = 60000;
const MIB = 1024 ** 2;
const mode = process.argv[2] || "all";
const EVIDENCE = mode === "all"
  ? path.resolve(ROOT, "docs/research/uiq12")
  : fs.mkdtempSync(path.join(os.tmpdir(), "uiq12-browser-"));
const executable = process.env.UIQ12_CHROMIUM || (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
const launchArgs = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildReceipt(directory) {
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, ".vite/manifest.json"), "utf8"));
  const records = Object.entries(manifest);
  const entry = records.find(([, item]) => item.isEntry);
  assert.ok(entry, "the expected production HTML entry is built");
  const staticClosure = (key, files = new Set()) => {
    const item = manifest[key];
    assert.ok(item);
    if (files.has(item.file)) return files;
    files.add(item.file);
    for (const dependency of item.imports || []) staticClosure(dependency, files);
    return files;
  };
  const initial = [...staticClosure(entry[0])].filter((file) => file.endsWith(".js")).sort();
  const deferredEntries = records.filter(([, item]) => item.isDynamicEntry);
  const deferred = [...new Set(deferredEntries.flatMap(([key]) => [...staticClosure(key)]))]
    .filter((file) => file.endsWith(".js") && !initial.includes(file)).sort();
  const renderer = deferredEntries.find(([key]) => key.includes("direct-three"))?.[1]?.file
    ?? deferred.find((file) => file.includes("direct-three"));
  assert.ok(renderer, "Direct Three is in an explicitly deferred renderer graph");
  assert.ok(!initial.includes(renderer));
  const artifacts = fs.readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const artifact = path.join(entry.parentPath, entry.name);
      const bytes = fs.readFileSync(artifact);
      return { file: path.relative(directory, artifact).split(path.sep).join("/"), bytes: bytes.length, sha256: digest(bytes) };
    }).sort((a, b) => a.file.localeCompare(b.file));
  return { initial, deferred, renderer, artifacts };
}

async function preview(directory) {
  const listener = net.createServer();
  await new Promise((resolve, reject) => listener.once("error", reject).listen(0, "127.0.0.1", resolve));
  const { port } = listener.address();
  await new Promise((resolve) => listener.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  const vite = require.resolve("vite/package.json", { paths: [CANDIDATE] });
  const child = spawn(process.execPath, [
    path.join(path.dirname(vite), "bin/vite.js"), "preview",
    "--host", "127.0.0.1", "--port", String(port), "--strictPort", "--outDir", directory,
  ], { cwd: CANDIDATE, stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  for (const stream of [child.stdout, child.stderr]) stream.on("data", (chunk) => { output += chunk; });
  const expected = fs.readFileSync(path.join(directory, "index.html"), "utf8");
  try {
    for (let i = 0; i < 100 && child.exitCode === null; i += 1) {
      const response = await fetch(base).catch(() => undefined);
      if (response?.ok && await response.text() === expected) return { base, close: () => child.kill() };
      await wait(100);
    }
    throw new Error(`candidate preview did not serve its built HTML\n${output}`);
  } catch (error) {
    child.kill();
    throw error;
  }
}

function instrument(denyWebGL) {
  const native = {
    raf: window.requestAnimationFrame.bind(window),
    cancelRaf: window.cancelAnimationFrame.bind(window),
    interval: window.setInterval.bind(window),
    cancelInterval: window.clearInterval.bind(window),
    timeout: window.setTimeout.bind(window),
    cancelTimeout: window.clearTimeout.bind(window),
  };
  const pendingRaf = new Set();
  const pendingIntervals = new Set();
  const pendingTimeouts = new Set();
  let callbacks = 0;
  let ticks = 0;
  let timeouts = 0;
  window.requestAnimationFrame = (callback) => {
    const id = native.raf((time) => {
      pendingRaf.delete(id);
      callbacks += 1;
      callback(time);
    });
    pendingRaf.add(id);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    pendingRaf.delete(id);
    native.cancelRaf(id);
  };
  window.setInterval = (callback, delay, ...args) => {
    if (typeof callback !== "function") return native.interval(callback, delay, ...args);
    const id = native.interval((...values) => {
      ticks += 1;
      callback(...values);
    }, delay, ...args);
    pendingIntervals.add(id);
    return id;
  };
  window.clearInterval = (id) => {
    pendingIntervals.delete(id);
    native.cancelInterval(id);
  };
  window.setTimeout = (callback, delay, ...args) => {
    if (typeof callback !== "function") return native.timeout(callback, delay, ...args);
    const id = native.timeout((...values) => {
      pendingTimeouts.delete(id);
      timeouts += 1;
      callback(...values);
    }, delay, ...args);
    pendingTimeouts.add(id);
    return id;
  };
  window.clearTimeout = (id) => {
    pendingTimeouts.delete(id);
    native.cancelTimeout(id);
  };
  window.__teeIdle = () => ({
    callbacks, ticks, timeouts, pendingRaf: pendingRaf.size, pendingIntervals: pendingIntervals.size, pendingTimeouts: pendingTimeouts.size,
  });
  if (denyWebGL) {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...options) {
      return /webgl/i.test(type) ? null : getContext.call(this, type, ...options);
    };
  }
}

async function session(browser, base, task, denyWebGL = false) {
  const context = await browser.newContext({
    viewport: VIEWPORT, deviceScaleFactor: 1, serviceWorkers: "block",
  });
  try {
    const page = await context.newPage();
    const requests = [];
    const failures = [];
    const consoleMessages = [];
    const pageErrors = [];
    const blocked = [];
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin === base) return route.continue();
      blocked.push(url.href);
      return route.abort();
    });
    await page.addInitScript(instrument, denyWebGL);
    page.on("request", (request) => requests.push({ path: new URL(request.url()).pathname, type: request.resourceType() }));
    page.on("requestfailed", (request) => failures.push({ path: new URL(request.url()).pathname, reason: request.failure()?.errorText }));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) consoleMessages.push({ type: message.type(), text: message.text() });
    });
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    try {
      const value = await task({ page, context, requests, failures });
      assert.deepEqual(blocked, [], "no external traffic with browser egress denied");
      assert.deepEqual(pageErrors, [], "no unhandled browser errors");
      return { ...value, requests, failures, consoleMessages, blocked };
    } catch (error) {
      const state = await page.evaluate(() => window.teeProof?.diagnostics()).catch(() => null);
      const statusText = await page.locator("#status").textContent({ timeout: 1500 }).catch(() => null);
      const diagnostics = state && { state: state.state, revision: state.revision, generation: state.generation,
        assemblyStatus: state.assembly?.diagnostics };
      throw new Error(`${error.stack}\n${JSON.stringify({ diagnostics, statusText, pageErrors, failures, consoleMessages })}`, { cause: error });
    }
  } finally {
    await context.close();
  }
}

const diag = (page) => page.evaluate(() => window.teeProof.diagnostics());
const summary = (page) => page.evaluate(() => {
  const record = window.teeProof.diagnostics();
  return {
    state: record.state, revision: record.revision, generation: record.generation, selectedSeam: record.selectedSeam,
    renderer: record.renderer, timings: record.timings, camera: record.camera, identity: record.identity,
  };
});
const idle = (page) => page.evaluate(() => window.__teeIdle());
const canvasCount = (page) => page.locator("#renderer canvas").count();
const patternMarkup = (page) => page.locator("#pattern").evaluate((svg) => svg.innerHTML);
const buildScripts = (requests) => [...new Set(requests
  .map(({ path: url }) => url.slice(1)).filter((file) => file.endsWith(".js")))].sort();

async function status(page, expected) {
  await page.locator(`#status[data-state="${expected}"]`).waitFor({ state: "attached", timeout: 15000 });
  assert.equal((await summary(page)).state, expected);
}

async function navigate(page, base, build, requests) {
  await page.goto(base, { waitUntil: "networkidle" });
  await status(page, "closed");
  await page.waitForFunction(() => Boolean(document.querySelector("#pattern").dataset.revision));
  assert.equal(await page.locator("#pattern").isVisible(), true);
  assert.equal(await canvasCount(page), 0);
  assert.deepEqual(buildScripts(requests), build.initial, "cold 2D requests only the initial JavaScript graph");
}

async function ready(page) {
  await status(page, "ready");
  const state = await summary(page);
  assert.equal(await canvasCount(page), 1);
  assert.ok(state.renderer?.geometries > 0, "the active WebGL frame owns real geometry");
  assert.ok(state.renderer?.draws > 0, "the candidate drew a frame");
  return state;
}

async function open(page) {
  await page.locator("#open-3d").click();
  return ready(page);
}

async function close(page) {
  await page.locator("#close-3d").click();
  await status(page, "closed");
  assert.equal(await canvasCount(page), 0);
}

async function capture(locator, filename) {
  const bytes = await locator.screenshot({ path: path.join(EVIDENCE, filename), animations: "disabled" });
  return {
    file: filename, bytes: bytes.length, sha256: digest(bytes), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20),
  };
}

async function gpu(page) {
  return page.locator("#renderer canvas").evaluate((canvas) => {
    const gl = canvas.getContext("webgl2");
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      unmaskedVendor: info ? gl.getParameter(info.UNMASKED_VENDOR_WEBGL) : null,
      unmaskedRenderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : null,
      webglVersion: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      loseContextSupported: Boolean(gl.getExtension("WEBGL_lose_context")),
      canvasWidth: canvas.width, canvasHeight: canvas.height,
      devicePixelRatio: window.devicePixelRatio,
    };
  });
}

function measure(samples) {
  assert.ok(samples.length);
  const sorted = [...samples].sort((a, b) => a - b);
  return { count: samples.length, p50: sorted[Math.ceil(sorted.length * 0.50) - 1],
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1], max: sorted.at(-1), samples };
}

async function stableIdle(page, name) {
  await wait(400);
  const before = await idle(page);
  const rendererBefore = (await summary(page)).renderer;
  await wait(IDLE_MS);
  const after = await idle(page);
  assert.deepEqual(after, before, `${name} has no idle renderer callbacks`);
  assert.equal(after.pendingRaf + after.pendingIntervals + after.pendingTimeouts, 0);
  assert.deepEqual((await summary(page)).renderer, rendererBefore);
  return { idleMs: IDLE_MS, before, after };
}

function oneProcess(pid, type) {
  try {
    const statusText = fs.readFileSync(`/proc/${pid}/status`, "utf8");
    const match = (text, field) => {
      const kb = new RegExp(`^${field}:\\s+(\\d+) kB$`, "m").exec(text)?.[1];
      return kb === undefined ? null : Number(kb) * 1024;
    };
    const rss = match(statusText, "VmRSS");
    let pss = null;
    try {
      pss = match(fs.readFileSync(`/proc/${pid}/smaps_rollup`, "utf8"), "Pss");
    } catch {
      // Shared-page proportional usage is optional on restricted hosts.
    }
    return { pid, type, rss, pss };
  } catch (error) {
    return { pid, type, rss: null, pss: null, reason: error.code || String(error) };
  }
}

async function workingSet(cdp, started) {
  const { processInfo } = await cdp.send("SystemInfo.getProcessInfo");
  const processes = processInfo.map(({ id, type }) => oneProcess(id, type));
  const rssKnown = processes.filter(({ rss }) => rss !== null);
  const pssKnown = processes.filter(({ pss }) => pss !== null);
  return {
    elapsedMs: performance.now() - started, processes,
    rssBytes: processes.length && rssKnown.length === processes.length ? rssKnown.reduce((a, { rss }) => a + rss, 0) : null,
    pssBytes: processes.length && pssKnown.length === processes.length ? pssKnown.reduce((a, { pss }) => a + pss, 0) : null,
  };
}

async function interaction(page) {
  return page.evaluate(async (durationMs) => {
    const buttons = [document.querySelector("#turn-right"), document.querySelector("#zoom-in"),
      document.querySelector("#turn-left"), document.querySelector("#zoom-out"), document.querySelector("#reset-view")];
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    let previous = await frame();
    const started = previous;
    const intervals = [];
    const submissions = [];
    let gestures = 0;
    while (previous - started < durationMs) {
      const drawStart = performance.now();
      buttons[gestures % buttons.length].click();
      submissions.push(performance.now() - drawStart);
      const now = await frame();
      intervals.push(now - previous);
      previous = now;
      gestures += 1;
    }
    return { elapsedMs: previous - started, intervals, submissions, gestures };
  }, INTERACTION_MS);
}

const checkpoints = {
  default: {
    fingerprint: "25f9a0f6a9b4657eb69b5a75bbb8baa4ae870ca4ae5f7e74485f54d4f42763e0",
    effective: "25f9a0f6a9b4657eb69b5a75bbb8baa4ae870ca4ae5f7e74485f54d4f42763e0",
    frontArmhole: 20.8458006662, backArmhole: 20.8458006662,
    capFront: 21.5957477752, capBack: 21.5957477752,
    halfHem: 27.5, side: 46, width3D: 47.30, height3D: 70, wrongApex: 0, totalEase: 1.5,
  },
  edited: {
    fingerprint: "df1e992da557b99b95873f4f4924e2f64c135c74f9ec77cdc10b1e359a57d5bb",
    effective: "7db7523c001bdc32adc33b3d7fcfc12ba78fb005f36613ceb69503deda600527",
    frontArmhole: 21.7311337994, backArmhole: 21.1443842867,
    capFront: 21.8943769935, capBack: 21.8943769935,
    halfHem: 28.5, side: 49, width3D: 49.02, height3D: 73, wrongApex: 0.2932779768, totalEase: 0.9134440473,
  },
};
const capIds = ["cap-front:right", "cap-back:right", "cap-front:left", "cap-back:left"];

function approx(value, expected, tolerance, label) {
  assert.ok(Number.isFinite(value) && Math.abs(value - expected) <= tolerance,
    `${label}: expected ${expected} ±${tolerance}, received ${value}`);
}

async function waitChange(page, before) {
  await page.waitForFunction(({ generation, revision }) => {
    const state = window.teeProof.diagnostics();
    return state.generation > generation && state.revision !== revision && state.state === "ready";
  }, before, { timeout: 15000 });
  return ready(page);
}

async function compactAssembly(page) {
  return page.evaluate(() => {
    const { identity, revision, assembly } = window.teeProof.diagnostics();
    if (!assembly) return null;
    return {
      revision, identity, assemblyRevision: assembly.revision, version: assembly.version, units: assembly.units,
      diagnostics: assembly.diagnostics,
      panels: assembly.panels.map(({ id, role, indices, positions }) => ({
        id, role, triangleCount: indices.length / 3, vertexCount: positions.length / 3,
      })),
      seams: assembly.seams.map(({ id, sides }) => ({
        id, sides: sides.map(({ role, edge, instance, reversed, parameters }) => ({
          role, edge, instance, reversed, start: parameters[0], end: parameters.at(-1),
        })),
      })),
    };
  });
}

async function pathLengths(page) {
  return page.locator("#pattern").evaluate((svg) => {
    const length = (role, instance, edge) => {
      const path = svg.querySelector(`[data-role="${role}"][data-instance="${instance}"] [data-edge="${edge}"]`);
      return path?.getTotalLength() ?? null;
    };
    return {
      frontArmhole: length("front", "front:right", "armhole"),
      backArmhole: length("back", "back:right", "armhole"),
      capFront: length("sleeve", "sleeve:right", "capLeft"),
      capBack: length("sleeve", "sleeve:right", "capRight"),
      halfHem: length("front", "front:right", "hem"),
      side: length("front", "front:right", "side"),
      distinctCutContours: svg.querySelectorAll('[data-line="cut"]').length,
    };
  });
}

function seamReferences(id) {
  const [seam, hand] = id.split(":");
  const front = seam === "cap-front";
  return [
    { role: "sleeve", instance: `sleeve:${hand}`, edge: front ? "capLeft" : "capRight", start: 0, end: 1, reversed: false },
    { role: front ? "front" : "back", instance: `${front ? "front" : "back"}:${hand}`, edge: "armhole",
      start: front ? 1 : 0, end: front ? 0 : 1, reversed: front },
  ];
}

function landmarkReferences(hand) {
  // Source traversal is capLeft → capRight → sideRight → hem → sideLeft
  // on the sleeve and shoulder → armhole → side on each bodice piece.
  // Each corner retains both incident source endpoints, for either hand.
  const sleeve = `sleeve:${hand}`, front = `front:${hand}`, back = `back:${hand}`;
  return {
    [`${hand}:front-underarm`]: [
      `${sleeve}/capLeft@0`, `${sleeve}/sideLeft@1`, `${front}/armhole@1`, `${front}/side@0`,
    ],
    [`${hand}:apex`]: [
      `${sleeve}/capLeft@1`, `${sleeve}/capRight@0`, `${front}/armhole@0`, `${front}/shoulder@1`,
      `${back}/armhole@0`, `${back}/shoulder@1`,
    ],
    [`${hand}:back-underarm`]: [
      `${sleeve}/capRight@1`, `${sleeve}/sideRight@0`, `${back}/armhole@1`, `${back}/side@0`,
    ],
  };
}

async function inspectFixture(page, name) {
  const state = await compactAssembly(page);
  const expected = checkpoints[name];
  assert.ok(state, `${name} 3D assembly is ready for numerical checks`);
  assert.equal(state.units, "cm");
  assert.equal(state.version, 1);
  assert.equal(state.assemblyRevision, state.revision);
  const viewRevisions = await page.evaluate(() => ({
    drawing: document.querySelector("#pattern").dataset.revision,
    canvas: document.querySelector("#renderer canvas").dataset.revision,
    receipt: document.querySelector("#draft-revision").dataset.revision,
    effectiveBlockDigest: document.querySelector("#draft-revision").dataset.effectiveBlockDigest,
  }));
  assert.deepEqual(viewRevisions, {
    drawing: state.revision, canvas: state.revision, receipt: state.revision,
    effectiveBlockDigest: state.identity.effectiveBlockDigest,
  });
  assert.equal(state.identity.baselineCommit, BASELINE);
  assert.equal(state.identity.recipeId, "tee");
  assert.equal(state.identity.construction, "set-in");
  assert.equal(state.identity.sizeStep, 0);
  assert.equal(state.identity.baseSourceFingerprint, `semantic-edit:v2:sha256:${expected.fingerprint}`);
  assert.equal(state.identity.effectiveBlockDigest, `semantic-edit:v2:sha256:${expected.effective}`);
  assert.match(state.identity.editOperationDigest, /^[a-f0-9]{64}$/);
  assert.deepEqual(state.panels.map(({ id }) => id).sort(), ["back", "front", "sleeve:left", "sleeve:right"]);
  assert.ok(state.panels.every(({ triangleCount, vertexCount }) => triangleCount > 0 && vertexCount > 0));
  const d = state.diagnostics;
  approx(d.frontVerticalSpanCm, expected.height3D, 1e-6, `${name} vertical 3D hem span`);
  approx(d.frontHemSpanCm, expected.width3D, 1e-6, `${name} transverse 3D hem span at 0.86 placement scale`);
  approx(d.wrongWholeSeamApexMissCm, expected.wrongApex, 0.001, `${name} wrong single-ratio rest-seam apex miss`);
  approx(d.signedCapEaseCm, expected.totalEase, 0.001, `${name} total signed sleeve cap ease`);
  assert.ok(d.maxSeamGapCm <= 0.01 && d.maxArcAuditErrorCm <= 0.001);
  assert.equal(d.intersections, 0);
  assert.ok(d.minWorldAreaCm2 > 0.000001 && d.minRestAreaCm2 > 0.000001);
  const references = { ...landmarkReferences("left"), ...landmarkReferences("right") };
  assert.deepEqual(d.landmarks.map(({ id }) => id).sort(), Object.keys(references).sort(),
    "exact six landmark identities including multiplicity");
  for (const { id, references: actual, point, residualCm } of d.landmarks) {
    assert.deepEqual(actual, references[id], `exact source station refs for ${id}`);
    assert.ok(point.every(Number.isFinite) && residualCm <= 0.01, `resolved landmark ${id}`);
  }
  for (const id of capIds) {
    const front = id.startsWith("cap-front");
    const interval = d.capIntervals.find((candidate) => candidate.id === id);
    assert.ok(interval, `cap length evidence for ${id}`);
    approx(interval.capCm, expected[front ? "capFront" : "capBack"], 0.001, `${name} ${id} sleeve arc`);
    approx(interval.armholeCm, expected[front ? "frontArmhole" : "backArmhole"], 0.001, `${name} ${id} body arc`);
    approx(interval.easeCm, interval.capCm - interval.armholeCm, 1e-6, `${name} ${id} signed ease`);
    assert.deepEqual(state.seams.find((candidate) => candidate.id === id)?.sides, seamReferences(id));
  }
  const lengths = await pathLengths(page);
  for (const field of ["halfHem", "side"]) approx(lengths[field], expected[field], 1e-4, `${name} actual SVG ${field}`);
  for (const field of ["frontArmhole", "backArmhole", "capFront", "capBack"]) {
    approx(lengths[field], expected[field], 0.02, `${name} browser SVG-path ${field}`);
  }
  assert.ok(lengths.distinctCutContours > 0, "the 2D SVG also renders separate cutting lines");
  return { ...state, lengths, patternSha256: digest(await patternMarkup(page)) };
}

async function pickResult(page, seamId) {
  await page.waitForFunction((id) => window.teeProof.diagnostics().selectedSeam === id, seamId, { timeout: 4000 });
  const result = await page.evaluate(() => ({
    detail: document.querySelector("#seam-detail").textContent,
    sourceRevision: document.querySelector("#seam-detail").dataset.sourceRevision,
    highlighted: [...document.querySelectorAll("#pattern [data-edge][data-highlighted='true']")].map((edge) => {
      const group = edge.closest("[data-role][data-instance]");
      return { role: group.dataset.role, instance: group.dataset.instance, edge: edge.dataset.edge,
        start: Number(edge.dataset.parameterStart), end: Number(edge.dataset.parameterEnd) };
    }),
  }));
  const expected = seamReferences(seamId);
  const sorted = (refs) => [...refs].sort((a, b) => a.instance.localeCompare(b.instance));
  assert.deepEqual(sorted(result.highlighted), sorted(expected.map(({ role, instance, edge, start, end }) => ({ role, instance, edge, start, end }))));
  assert.ok(result.detail && result.detail.includes(expected[0].edge) && result.detail.includes(expected[1].edge),
    "the seam receipt displays both precise source edges");
  for (const { instance } of expected) assert.ok(result.detail.includes(instance), `${instance} occurs in the source receipt`);
  assert.match(result.detail, /(?:0(?:\.0+)?\s*(?:→|–|to)\s*1|1(?:\.0+)?\s*(?:→|–|to)\s*0)/u);
  return result;
}

async function keyboardPick(page, seamId) {
  const select = page.locator("#seams");
  const optionIndex = await select.evaluate((element, id) => [...element.options].findIndex((option) => option.value === id), seamId);
  assert.ok(optionIndex >= 0);
  await select.focus();
  await page.keyboard.press("Home");
  for (let i = 0; i < optionIndex; i += 1) await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  assert.equal(await select.inputValue(), seamId);
  return pickResult(page, seamId);
}

async function visibleSeamPoint(page, seamId) {
  await page.locator("#reset-view").click();
  let point;
  let turns = 0;
  while (turns <= 32) {
    point = await page.evaluate((id) => window.teeProof.projectSeam(id), seamId);
    if (point) break;
    await page.locator("#turn-right").click();
    turns += 1;
  }
  assert.ok(point, `viewport projection provides a visible clickable point for ${seamId}`);
  return { turns, point };
}

async function spatialPick(page, seamId) {
  const { turns, point } = await visibleSeamPoint(page, seamId);
  await page.mouse.click(point.x, point.y);
  return { turns, point, ...await pickResult(page, seamId) };
}

async function stalePointer(page) {
  const keep = "cap-front:left";
  const oldTarget = "cap-front:right";
  await keyboardPick(page, keep);
  const { point } = await visibleSeamPoint(page, oldTarget);
  const first = await summary(page);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  try {
    await page.locator("#undo").evaluate((button) => button.click());
    const undone = await waitChange(page, first);
    await page.locator("#redo").evaluate((button) => button.click());
    const redone = await waitChange(page, undone);
    assert.equal(redone.revision, first.revision, "redo returns to identical content under a new generation");
    assert.ok(redone.generation > first.generation);
  } finally {
    await page.mouse.up();
  }
  return { attempted: oldTarget, retained: keep, ...await pickResult(page, keep) };
}

async function fixedCapture(page, name, resetCamera = true) {
  if (resetCamera) await page.locator("#reset-view").click();
  const canvas = page.locator("#renderer canvas");
  const saved = await canvas.evaluate((element) => {
    const slot = element.parentElement;
    const saved = [element.getAttribute("style"), slot.getAttribute("style")];
    Object.assign(slot.style, {
      position: "fixed", top: "0", left: "0", zIndex: "10",
      width: "1024px", height: "768px", borderRadius: "0",
    });
    Object.assign(element.style, { width: "1024px", height: "768px" });
    return saved;
  });
  try {
    const screenshot = await capture(canvas, name);
    assert.deepEqual([screenshot.width, screenshot.height], [1024, 768]);
    const dimensions = await canvas.evaluate((element) => ({
      backingWidth: element.width, backingHeight: element.height, rect: element.getBoundingClientRect().toJSON(),
    }));
    assert.deepEqual([dimensions.backingWidth, dimensions.backingHeight], [1024, 768]);
    const landmarks = await page.evaluate(() => window.teeProof.projectLandmarks());
    assert.equal(Object.keys(landmarks).length, 6);
    const relativeLandmarks = Object.fromEntries(Object.entries(landmarks).map(([id, location]) => [
      id, [location.x - dimensions.rect.x, location.y - dimensions.rect.y],
    ]));
    for (const location of Object.values(relativeLandmarks)) {
      assert.ok(location[0] >= 0 && location[0] <= screenshot.width && location[1] >= 0 && location[1] <= screenshot.height);
    }
    return { ...screenshot, relativeLandmarks, backing: [dimensions.backingWidth, dimensions.backingHeight] };
  } finally {
    await canvas.evaluate((element, styles) => {
      const targets = [element, element.parentElement];
      for (let i = 0; i < targets.length; i += 1) {
        if (styles[i] === null) targets[i].removeAttribute("style");
        else targets[i].setAttribute("style", styles[i]);
      }
    }, saved);
  }
}

async function fixedPattern(page, name) {
  const svg = page.locator("#pattern");
  const saved = await svg.evaluate((element) => {
    const prior = element.getAttribute("style");
    Object.assign(element.style, {
      position: "fixed", top: "0", left: "0", zIndex: "10",
      width: "525px", height: "390px", borderRadius: "0",
    });
    return prior;
  });
  try {
    const image = await capture(svg, name);
    assert.deepEqual([image.width, image.height], [525, 390]);
    return image;
  } finally {
    await svg.evaluate((element, prior) => {
      if (prior === null) element.removeAttribute("style");
      else element.setAttribute("style", prior);
    }, saved);
  }
}

async function lockedView(page, name) {
  const { camera, revision } = await summary(page);
  const pattern = await fixedPattern(page, `${name}-locked-2d.png`);
  const surface = await fixedCapture(page, `${name}-locked-3d.png`, false);
  assert.deepEqual((await summary(page)).camera, camera);
  return { camera, revision, pattern, surface };
}

function comparisonPage(defaultView, editedView) {
  assert.deepEqual(editedView.camera, defaultView.camera, "default and edited comparison use exactly the same camera in world coordinates");
  assert.notEqual(editedView.pattern.sha256, defaultView.pattern.sha256);
  assert.notEqual(editedView.surface.sha256, defaultView.surface.sha256);
  const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Slice 1342 fixed-camera comparison</title>
<style>
body { margin: 2rem; background: #14242f; color: #edf7f7; font: 1rem/1.5 system-ui, sans-serif; }
main { max-width: 94rem; margin: auto; }
.pairs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
figure { margin: 0; }
img { display: block; width: 100%; height: auto; }
figcaption { margin-block: .4rem 1rem; }
@media (max-width: 35rem) { body { margin: .8rem; } .pairs { gap: .45rem; } }
</style>
<main>
  <h1>Default and edited set-in Tee</h1>
  <p>Both pattern images use one source scale. Both assembled images use the same camera position, orientation and zoom.</p>
  <h2>2D sewing and cutting lines</h2>
  <div class="pairs">
    <figure><img src="${defaultView.pattern.file}" width="525" height="390" alt="Default cut and sewing lines for the front, back and sleeves.">
      <figcaption>Default · 27.5 cm half-hem and 46 cm front side seam</figcaption></figure>
    <figure><img src="${editedView.pattern.file}" width="525" height="390" alt="Edited cut and sewing lines for the front, back and sleeves.">
      <figcaption>Edited · 28.5 cm half-hem and 49 cm front side seam</figcaption></figure>
  </div>
  <h2>3D placement</h2>
  <div class="pairs">
    <figure><img src="${defaultView.surface.file}" width="1024" height="768" alt="Default assembled Tee in fixed-camera view.">
      <figcaption>Default · 47.30 cm front hem span and 70 cm vertical span</figcaption></figure>
    <figure><img src="${editedView.surface.file}" width="1024" height="768" alt="Edited assembled Tee in the same fixed-camera view.">
      <figcaption>Edited · 49.02 cm front hem span and 73 cm vertical span</figcaption></figure>
  </div>
</main>
</html>
`;
  const file = "S1342-fixed-camera-comparison.html";
  fs.writeFileSync(path.join(EVIDENCE, file), html);
  return { file, bytes: Buffer.byteLength(html), sha256: digest(html), defaultView, editedView };
}

async function silhouette(page, first, repeat) {
  const images = [first, repeat].map(({ file }) => fs.readFileSync(path.join(EVIDENCE, file)).toString("base64"));
  const result = await page.evaluate(async (encoded) => {
    const width = 1024;
    const height = 768;
    async function boundary(base64) {
      const bytes = Uint8Array.from(atob(base64), (value) => value.charCodeAt(0));
      const picture = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
      const canvas = new OffscreenCanvas(width, height);
      const rgba = canvas.getContext("2d");
      rgba.drawImage(picture, 0, 0);
      picture.close();
      const image = rgba.getImageData(0, 0, width, height).data;
      const inside = new Uint8Array(width * height);
      for (let i = 0; i < inside.length; i += 1) {
        const offset = i * 4;
        inside[i] = Number(Math.abs(image[offset] - image[0]) + Math.abs(image[offset + 1] - image[1]) +
          Math.abs(image[offset + 2] - image[2]) >= 12);
      }
      const edge = new Uint8Array(width * height);
      const indices = [];
      for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
          const here = y * width + x;
          if (inside[here] && !(inside[here - 1] && inside[here + 1] && inside[here - width] && inside[here + width])) {
            edge[here] = 1;
            indices.push(here);
          }
        }
      }
      return { edge, indices };
    }
    function directedDistances(from, to) {
      return from.indices.map((here) => {
        if (to.edge[here]) return 0;
        const x = here % width;
        const y = Math.floor(here / width);
        let best = 25;
        for (let dy = -4; dy <= 4; dy += 1) {
          for (let dx = -4; dx <= 4; dx += 1) {
            const square = dx * dx + dy * dy;
            if (square >= best || x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
            if (to.edge[here + dy * width + dx]) best = square;
          }
        }
        return Math.sqrt(best);
      });
    }
    const [before, after] = await Promise.all(encoded.map(boundary));
    const distances = [...directedDistances(before, after), ...directedDistances(after, before)].sort((a, b) => a - b);
    return { populations: [before.indices.length, after.indices.length],
      p95Px: distances[Math.ceil(distances.length * 0.95) - 1], rangeCensoredAtPx: 5 };
  }, images);
  assert.ok(result.populations.every((size) => size > 50), "both images contain a visible silhouette");
  assert.ok(result.p95Px <= 2, `fixed-view silhouette p95 ${result.p95Px} px exceeds 2 px`);
  return result;
}

async function repeatedCapture(page, name) {
  const first = await fixedCapture(page, `${name}-fixed-1024.png`);
  await close(page);
  await open(page);
  const repeat = await fixedCapture(page, `${name}-repeat-1024.png`);
  const measuredSilhouette = await silhouette(page, first, repeat);
  const namedLandmarkMaxDeviationPx = Math.max(...Object.keys(first.relativeLandmarks).map((id) => (
    Math.hypot(...first.relativeLandmarks[id].map((px, axis) => px - repeat.relativeLandmarks[id][axis]))
  )));
  assert.ok(namedLandmarkMaxDeviationPx <= 2);
  return { first, repeat, silhouette: measuredSilhouette, namedLandmarkMaxDeviationPx };
}

async function acceptedFixtures(browser, base, build) {
  return session(browser, base, async ({ page, requests, context }) => {
    await navigate(page, base, build, requests);
    const defaultState = await open(page);
    assert.ok(buildScripts(requests).includes(build.renderer), "3D requests its deferred renderer when opened");
    const defaultDraft = await inspectFixture(page, "default");
    const defaultCapture = await repeatedCapture(page, "default");
    let before = await summary(page);
    const box = await page.locator("#renderer canvas").boundingBox();
    assert.ok(box);
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5 - 24, box.y + box.height * 0.5 + 8, { steps: 3 });
    await page.mouse.up();
    assert.notDeepEqual((await summary(page)).camera, before.camera, "pointer orbit changes the 3D camera");
    await page.locator("#zoom-out").click();
    const moved = await summary(page);
    assert.notDeepEqual(moved.camera, before.camera);
    const comparisonDefault = await lockedView(page, "default");
    await page.locator("#chest").fill("104");
    const widened = await waitChange(page, before);
    assert.deepEqual(widened.camera, moved.camera, "real width edit retains the camera's pose");
    assert.equal(await page.evaluate(() => document.activeElement.id), "chest", "real width edit retains input focus");
    before = widened;
    await page.locator("#length").fill("73");
    before = await waitChange(page, before);
    await page.locator("#edit-controls summary").click();
    await page.locator("#apply-asymmetric").click();
    const editedState = await waitChange(page, before);
    const editedDraft = await inspectFixture(page, "edited");
    const comparison = comparisonPage(comparisonDefault, await lockedView(page, "edited"));
    const editedCapture = await repeatedCapture(page, "edited");
    assert.notEqual(editedDraft.patternSha256, defaultDraft.patternSha256);
    assert.notEqual(editedCapture.first.sha256, defaultCapture.first.sha256);
    assert.notEqual(editedState.revision, defaultState.revision);

    const picks = {};
    for (const id of capIds) {
      const keyboard = await keyboardPick(page, id);
      const opposite = id.endsWith(":left") ? id.replace(":left", ":right") : id.replace(":right", ":left");
      await keyboardPick(page, opposite);
      const pointer = await spatialPick(page, id);
      picks[id] = { keyboard, pointer };
    }
    const pairedSelection = await capture(page.locator("body"), "edited-seam-inspection.png");
    const heldPointer = await stalePointer(page);

    await page.locator("#save-draft").click();
    const preUndo = await summary(page);
    await page.locator("#undo").click();
    const undone = await waitChange(page, preUndo);
    await page.locator("#redo").click();
    const redone = await waitChange(page, undone);
    assert.equal(redone.revision, editedState.revision);
    assert.ok(redone.generation > editedState.generation);
    await page.locator("#fixture-default").click();
    const defaultAgain = await waitChange(page, redone);
    assert.equal(defaultAgain.revision, defaultState.revision);
    await page.locator("#reopen-draft").click();
    const reopened = await waitChange(page, defaultAgain);
    assert.equal(reopened.revision, editedState.revision, "saved semantic document regenerates exact content");
    assert.deepEqual(reopened.identity, editedState.identity);
    await page.reload({ waitUntil: "networkidle" });
    await status(page, "closed");
    await page.locator("#reopen-draft").click();
    const reload = await open(page);
    assert.equal(reload.revision, editedState.revision, "saved source also reopens after browser reload");
    const beforeStaleSource = await patternMarkup(page);
    await page.locator("#chest").fill("105");
    await status(page, "error");
    assert.match(await page.locator("#draft-message").textContent(), /source pattern|reviewed inputs|changed/i);
    assert.notEqual(await patternMarkup(page), beforeStaleSource, "stale semantic edit continues to show the newly drafted base in 2D");
    await page.locator("#undo").click();
    assert.equal((await ready(page)).revision, editedState.revision);

    const requestCount = requests.length;
    await context.setOffline(true);
    await close(page);
    const warmOffline = await open(page);
    assert.equal(warmOffline.revision, editedState.revision);
    assert.equal(requests.length, requestCount, "warm local 3D reopens while browser networking is offline");
    await context.setOffline(false);
    await close(page);
    return {
      defaultDraft, editedDraft, defaultCapture, editedCapture, comparison, picks, pairedSelection, heldPointer,
      revisions: { undone: undone.revision, redone: redone.revision, reopened: reopened.revision, reload: reload.revision },
      warmOffline: true,
    };
  });
}

async function noWebGL(browser, base, build) {
  return session(browser, base, async ({ page, requests }) => {
    await navigate(page, base, build, requests);
    const initial = await patternMarkup(page);
    await page.locator("#open-3d").click();
    await status(page, "unsupported");
    assert.equal(await canvasCount(page), 0);
    assert.equal(await patternMarkup(page), initial);
    await page.locator("#length").fill("71");
    await page.waitForFunction((source) => document.querySelector("#pattern").innerHTML !== source, initial);
    assert.equal(await page.locator("#pattern").isVisible(), true);
    const screenshot = await capture(page.locator("body"), "startup-no-webgl.png");
    return { before: digest(initial), after: digest(await patternMarkup(page)), screenshot };
  }, true);
}

async function rendererLoadFailure(browser, base, build) {
  return session(browser, base, async ({ page, requests, failures }) => {
    await navigate(page, base, build, requests);
    const prior = await patternMarkup(page);
    await page.route(`${base}/${build.renderer}`, (route) => route.abort("failed"), { times: 1 });
    await page.locator("#open-3d").click();
    await status(page, "error");
    assert.ok(failures.some(({ path: failed }) => failed === `/${build.renderer}`));
    assert.equal(await page.locator("#renderer canvas:visible").count(), 0);
    assert.equal(await patternMarkup(page), prior);
    await page.locator("#length").fill("71");
    await page.waitForFunction((source) => document.querySelector("#pattern").innerHTML !== source, prior);
    await close(page);
    return { priorPattern: digest(prior), editedPattern: digest(await patternMarkup(page)) };
  });
}

async function retiredCanvas(page, candidate) {
  await page.waitForFunction((name) => window[name].gl.isContextLost(), candidate, { timeout: 5000 });
  return page.locator("#renderer canvas").evaluate((canvas, name) => {
    const previous = window[name];
    delete window[name];
    const context = canvas.getContext("webgl2");
    return { replacedCanvas: canvas !== previous.canvas, replacedContext: context !== previous.gl,
      oldDetached: !previous.canvas.isConnected, oldLost: previous.gl.isContextLost(), replacementActive: !context.isContextLost() };
  }, candidate);
}

async function nativeRecovery(browser, base, build) {
  return session(browser, base, async ({ page, requests }) => {
    await navigate(page, base, build, requests);
    const first = await open(page);
    const viewportGPU = await gpu(page);
    const original = await patternMarkup(page);
    const openIdle = await stableIdle(page, "open and untouched");
    const loss = { extensionSupported: viewportGPU.loseContextSupported };
    if (loss.extensionSupported) {
      await page.locator("#renderer canvas").evaluate((canvas) => {
        const gl = canvas.getContext("webgl2");
        const extension = gl.getExtension("WEBGL_lose_context");
        const tracking = { canvas, gl, extension, lost: 0, restored: 0 };
        window.__teeLost = tracking;
        canvas.addEventListener("webglcontextlost", () => { tracking.lost += 1; }, { once: true });
        canvas.addEventListener("webglcontextrestored", () => { tracking.restored += 1; }, { once: true });
        extension.loseContext();
      });
      await status(page, "lost");
      assert.equal(await page.evaluate(() => window.__teeLost.gl.isContextLost()), true);
      assert.equal(await patternMarkup(page), original);
      loss.screenshot = await capture(page.locator("body"), "native-context-lost.png");
      await page.locator("#length").fill("71");
      await page.waitForFunction((source) => document.querySelector("#pattern").innerHTML !== source, original);
      const revised = await summary(page);
      assert.notEqual(revised.revision, first.revision);
      await page.evaluate(() => new Promise((resolve) => setTimeout(() => {
        window.__teeLost.extension.restoreContext();
        resolve();
      }, 120)));
      const restored = await ready(page);
      assert.equal(restored.revision, revised.revision, "restored 3D renders the newest 2D source");
      loss.events = await page.locator("#renderer canvas").evaluate((canvas) => {
        const tracking = window.__teeLost;
        const result = {
          lost: tracking.lost, restored: tracking.restored, freshCanvas: canvas !== tracking.canvas,
          freshContext: canvas.getContext("webgl2") !== tracking.gl, oldDetached: !tracking.canvas.isConnected,
        };
        delete window.__teeLost;
        return result;
      });
      assert.deepEqual(loss.events, { lost: 1, restored: 1, freshCanvas: true, freshContext: true, oldDetached: true });
      loss.restore = await capture(page.locator("#renderer canvas"), "native-context-restored.png");
      loss.revision = restored.revision;
    }

    const cycles = [];
    for (let index = 0; index < 6; index += 1) {
      const extension = await page.locator("#renderer canvas").evaluate((canvas) => {
        const gl = canvas.getContext("webgl2");
        window.__teeRetired = { canvas, gl };
        return Boolean(gl.getExtension("WEBGL_lose_context"));
      });
      await close(page);
      await open(page);
      if (extension) {
        const retirement = await retiredCanvas(page, "__teeRetired");
        assert.ok(Object.values(retirement).every(Boolean));
        cycles.push(retirement);
      }
    }
    await close(page);
    const closedIdle = await stableIdle(page, "closed");
    return { loss, cycles, openIdle, closedIdle, gpu: viewportGPU };
  });
}

async function invalidAndNarrow(browser, base, build) {
  return session(browser, base, async ({ page, requests }) => {
    await navigate(page, base, build, requests);
    const initial = await patternMarkup(page);
    await open(page);
    await page.locator("#chest").fill("59");
    await status(page, "error");
    assert.equal(await page.locator("#pattern").isVisible(), true);
    assert.equal(await patternMarkup(page), initial, "invalid source preserves the last usable 2D geometry");
    assert.match(await page.locator("#draft-message").textContent(), /chest|60|range/i);
    await page.locator("#chest").fill("102");
    await ready(page);
    assert.notEqual(await patternMarkup(page), initial);

    const responsive = [];
    for (const width of [320, 390, 1920]) {
      await close(page);
      await page.setViewportSize({ width, height: width === 1920 ? 1080 : 800 });
      await page.locator("#open-3d").focus();
      await page.keyboard.press("Enter");
      await ready(page);
      const layout = await page.evaluate(() => ({
        innerWidth, scrollWidth: document.documentElement.scrollWidth, statusRole: document.querySelector("#status").getAttribute("role"),
        labels: [...document.querySelectorAll("input,select")]
          .map((element) => ({ id: element.id, labels: [...element.labels].map((label) => label.textContent.trim()) })),
      }));
      assert.equal(layout.innerWidth, width);
      assert.ok(layout.scrollWidth <= width, `responsive view has no horizontal overflow at ${width}px`);
      assert.equal(layout.statusRole, "status");
      assert.ok(layout.labels.every(({ labels }) => labels.some(Boolean)), "each editable number and seam select has a visible label");
      const viewer = await keyboardPick(page, "cap-front:left");
      const screenshot = width === 320 ? await capture(page.locator("body"), "narrow-keyboard-320.png") : null;
      responsive.push({ ...layout, viewer, screenshot });
    }
    await close(page);
    return { classification: "invalid draft retained 2D and recovered", responsive };
  });
}

async function lazyRace(browser, base, build, closeDuringImport) {
  return session(browser, base, async ({ page, requests }) => {
    await navigate(page, base, build, requests);
    const target = `${base}/${build.renderer}`;
    let release;
    const pending = new Promise((resolve) => { release = resolve; });
    let intercepted;
    const arrive = new Promise((resolve) => { intercepted = resolve; });
    await page.route(target, async (route) => {
      intercepted();
      await pending;
      await route.continue();
    }, { times: 1 });
    try {
      await page.locator("#open-3d").click();
      await status(page, "loading");
      await Promise.race([arrive, wait(6000).then(() => { throw new Error("the delayed renderer chunk was not requested"); })]);
      const previous = await summary(page);
      if (closeDuringImport) await close(page);
      await page.locator("#chest").fill("101");
      await page.locator("#chest").fill("102");
      await page.locator("#fixture-edited").click();
      await page.locator("#undo").click();
      await page.locator("#redo").click();
      const response = page.waitForResponse(target, { timeout: 8000 });
      release();
      assert.equal((await response).ok(), true);
      if (closeDuringImport) {
        await status(page, "closed");
        assert.equal(await canvasCount(page), 0, "late import never mounts a closed view");
        await open(page);
      }
      await ready(page);
      const draft = await inspectFixture(page, "edited");
      assert.ok((await summary(page)).generation > previous.generation);
      await close(page);
      return { closeDuringImport, lastRevision: draft.revision };
    } finally {
      release();
    }
  });
}

const demand = {
  chest: 112, shoulderWidth: 49, bicep: 42, length: 74, armholeDepth: 27, sleeveLength: 32, ease: 12, chestEase: 12,
};

async function useDemand(page) {
  for (const [key, value] of Object.entries(demand)) {
    if (key === "chestEase") await page.locator("#use-chest-ease").check();
    await page.locator(`#${key}`).fill(String(value));
  }
  await page.locator("#size").selectOption("2");
  await status(page, "closed");
  await page.waitForFunction(() => window.teeProof.diagnostics().identity?.sizeStep === 2);
  return summary(page);
}

async function sizeReplay(browser, base, build) {
  return session(browser, base, async ({ page, requests }) => {
    await navigate(page, base, build, requests);
    let current = await open(page);
    const sizes = [];
    for (const step of [-2, -1, 0, 1, 2, "custom"]) {
      await page.locator("#size").selectOption(String(step));
      current = await waitChange(page, current);
      const assembly = await compactAssembly(page);
      assert.equal(assembly.identity.sizeStep, step);
      const localStep = step === "custom" ? 0 : step;
      const measured = await pathLengths(page);
      approx(measured.halfHem, (110 + localStep * 5) / 4, 1e-5, `size ${step} source half-hem`);
      approx(measured.side, 46 + localStep * 1.4, 1e-5, `size ${step} source side`);
      approx(assembly.diagnostics.frontVerticalSpanCm, 70 + 2 * localStep, 1e-6, `size ${step} 3D height`);
      assert.equal(assembly.diagnostics.intersections, 0);
      sizes.push({ step, measured, revision: current.revision, dimensions: assembly.diagnostics });
    }
    await close(page);
    return { sizes };
  });
}

async function performanceProof(browser, base, build) {
  return session(browser, base, async ({ page, requests }) => {
    await navigate(page, base, build, requests);
    const demanded2D = await useDemand(page);
    const cdp = await browser.newBrowserCDPSession();
    const started = performance.now();
    const baseline = [];
    for (let i = 0; i < 7; i += 1) {
      baseline.push(await workingSet(cdp, started));
      await wait(100);
    }
    const earliest = await open(page);
    assert.equal(earliest.revision, demanded2D.revision, "2D-only and mounted process samples use identical draft source");
    const demandAssembly = await compactAssembly(page);
    assert.equal(demandAssembly.identity.sizeStep, 2);
    const actualGPU = await gpu(page);
    const warm = await page.evaluate(async (count) => {
      const input = document.querySelector("#chest");
      const status = document.querySelector("#status");
      const revision = document.querySelector("#draft-revision");
      const size = document.querySelector("#size");
      const values = [];
      for (let i = 0; i < count; i += 1) {
        const previous = window.teeProof.diagnostics();
        const started = performance.now();
        const value = i % 2 === 0 ? "113" : "112";
        const sample = await new Promise((resolve, reject) => {
          const observer = new MutationObserver(() => {
            const state = window.teeProof.diagnostics();
            if (state.state === "error" && state.generation > previous.generation) {
              observer.disconnect();
              clearTimeout(timeout);
              reject(new Error(`demanding XL warm input ${value} failed: ${status.textContent}`));
              return;
            }
            if (state.state !== "ready" || !state.renderer?.draws ||
                state.revision === previous.revision || state.generation <= previous.generation) return;
            observer.disconnect();
            clearTimeout(timeout);
            resolve({ elapsedMs: performance.now() - started, input: value, generation: state.generation,
              revision: state.revision, size: size.value, softwareTiming: state.timings });
          });
          observer.observe(status, { attributes: true, childList: true });
          observer.observe(revision, { attributes: true, childList: true });
          const timeout = setTimeout(() => {
            observer.disconnect();
            reject(new Error(`warm input ${value} failed to reach a distinct 3D revision`));
          }, 12000);
          input.value = value;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        });
        values.push(sample);
      }
      return values;
    }, EDIT_SAMPLES);
    assert.equal(warm.length, EDIT_SAMPLES);
    assert.ok(warm.every(({ size }) => size === "2"));
    let active = true;
    const running = [];
    const workSamples = (async () => {
      while (active) {
        running.push(await workingSet(cdp, started));
        await wait(750);
      }
    })();
    let frame;
    try {
      frame = await interaction(page);
    } finally {
      active = false;
      await workSamples;
    }
    assert.ok(frame.elapsedMs >= INTERACTION_MS);
    const frameBudget = measure(frame.intervals);
    const warmBudget = measure(warm.map(({ elapsedMs }) => elapsedMs));
    const baselineValues = baseline.map(({ rssBytes }) => rssBytes);
    const mountedValues = running.map(({ rssBytes }) => rssBytes);
    const completeRss = [...baselineValues, ...mountedValues].every(Number.isFinite);
    const addedRssMiB = completeRss ? (Math.max(...mountedValues) - Math.min(...baselineValues)) / MIB : null;
    const budget = {
      editP95Ms: { threshold: 200, actual: warmBudget.p95, pass: warmBudget.p95 <= 200 },
      browserFrameP95Ms: { threshold: 33.3, actual: frameBudget.p95, pass: frameBudget.p95 <= 33.3 },
      addedProcessRssMiB: { threshold: 256, actual: addedRssMiB, pass: addedRssMiB === null ? null : addedRssMiB <= 256 },
    };
    const screenshot = await capture(page.locator("body"), "demanding-xl.png");
    await close(page);
    return {
      demand, adjacentChestCm: 113, assembly: demandAssembly, gpu: actualGPU, warm, warmBudget, frameBudget,
      cpuSubmissionMs: measure(frame.submissions), interaction: { elapsedMs: frame.elapsedMs, gestures: frame.gestures },
      memory: {
        method: "Sum VmRSS for Browser CDP SystemInfo.getProcessInfo Chrome PIDs; charged process names and proportional PSS when accessible are in each sample. Peak mounted minus minimum 2D-only same-draft RSS.",
        baseline, running, gpuDedicatedBytes: null,
      },
      budget, screenshot,
    };
  });
}

async function browserInfo(browser) {
  const cdp = await browser.newBrowserCDPSession();
  const { userAgent } = await cdp.send("Browser.getVersion");
  const distribution = fs.existsSync("/etc/os-release")
    ? /^PRETTY_NAME=(.*)$/m.exec(fs.readFileSync("/etc/os-release", "utf8"))?.[1]?.replace(/^"|"$/g, "") : null;
  return {
    platform: os.platform(), distribution, architecture: os.arch(), release: os.release(), cpu: os.cpus()[0]?.model,
    logicalCpus: os.cpus().length, availableParallelism: os.availableParallelism(), totalMemoryBytes: os.totalmem(),
    chromium: browser.version(), playwright: require("playwright/package.json").version, executable,
    userAgent, node: process.version, viewport: VIEWPORT, devicePixelRatio: 1, args: launchArgs,
  };
}

async function projectOneSize(browser, base, build) {
  const saved = fs.readFileSync(process.env.UIQ12_PROJECT_SNAPSHOT, "utf8");
  const { projectSource } = JSON.parse(saved);
  const { project, activeStyle } = projectSource;
  const key = "infinidrip-uiq12-tee-draft-v1";
  return session(browser, base, async ({ page, requests }) => {
    await navigate(page, base, build, requests);
    await page.evaluate(([key, saved]) => localStorage.setItem(key, saved), [key, saved]);
    await page.locator("#reopen-draft").click();
    await page.waitForFunction(id => document.querySelector("#draft-revision").dataset.projectStyleId === id, activeStyle.id);
    assert.equal(await page.locator("#size").inputValue(), "custom");
    assert.ok(await page.locator("#size").isDisabled());
    assert.equal(await page.locator("#chest").inputValue(), "108");
    assert.equal(await page.locator("#length").inputValue(), "72");
    assert.ok(!buildScripts(requests).includes(build.renderer), "project reopen leaves the 3D renderer unloaded");
    await open(page);
    const first = await compactAssembly(page);
    assert.equal(first.assemblyRevision, first.revision);
    assert.deepEqual(first.identity.provenance.projectStyle, {
      projectId: project.id, styleId: activeStyle.id, styleRevision: activeStyle.revision, revisionHeadId: activeStyle.revisionHeadId,
      parentDesignDigest: first.identity.provenance.projectStyle.parentDesignDigest,
    });
    assert.match(first.identity.provenance.projectStyle.parentDesignDigest, /^[a-f0-9]{64}$/);
    approx(first.diagnostics.frontVerticalSpanCm, 72, 1e-6, "captured one-size height");
    approx(first.diagnostics.frontHemSpanCm, 50.31, 1e-6, "captured one-size hem span");
    const baseRevision = await page.locator("#draft-revision").getAttribute("data-working-revision");
    const beforeEdit = await summary(page);
    await page.locator("#chest").fill("108.5");
    await waitChange(page, beforeEdit);
    const edited = await compactAssembly(page);
    const workingRevision = await page.locator("#draft-revision").getAttribute("data-working-revision");
    assert.match(workingRevision, /^[a-f0-9]{64}$/);
    assert.notEqual(workingRevision, baseRevision);
    assert.notEqual(edited.revision, first.revision);
    assert.deepEqual(edited.identity.provenance, first.identity.provenance);
    const pick = await keyboardPick(page, "cap-front:right");
    assert.equal(pick.sourceRevision, edited.revision);
    await page.locator("#save-draft").click();
    await page.getByText("Draft saved locally.", { exact: true }).waitFor();
    await page.reload();
    await page.locator("#reopen-draft").click();
    await page.waitForFunction(revision => document.querySelector("#draft-revision").dataset.revision === revision, edited.revision);
    assert.equal(await page.locator("#draft-revision").getAttribute("data-working-revision"), workingRevision);
    await open(page);
    assert.deepEqual(await compactAssembly(page), edited);
    assert.deepEqual(await keyboardPick(page, "cap-front:right"), pick);
    return { baselineRevision: first.revision, revision: edited.revision, workingRevision,
      projectStyle: edited.identity.provenance.projectStyle, pick,
      heightCm: first.diagnostics.frontVerticalSpanCm, hemSpanCm: first.diagnostics.frontHemSpanCm, gpu: await gpu(page) };
  });
}

async function main() {
  assert.ok(["all", "smoke", "demand-smoke", "project-smoke", "functional", "lifecycle", "perf"].includes(mode),
    "choose all, smoke, demand-smoke, project-smoke, functional, lifecycle, or perf");
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "uiq12-preview-"));
  const staged = path.join(work, "dist");
  let build;
  let server;
  try {
    fs.cpSync(BUILD, staged, { recursive: true });
    build = buildReceipt(staged);
    if (mode === "all") assert.deepEqual(buildReceipt(BUILD), build, "the staged production binary matches the frozen build");
    server = await preview(staged);
  } catch (error) {
    fs.rmSync(work, { recursive: true, force: true });
    throw error;
  }
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const report = {
    slice: 1342, baseline: BASELINE, mode, runAt: new Date().toISOString(), build,
    verifierSha256: digest(fs.readFileSync(__filename)), results: {},
    methodology: [
      "Pattern length comes from SVG path geometry in source centimetres, with the independent approved arc oracle separately compared to assembled rest lengths.",
      "Fixed captures use native 1024×768 pixels at DPR 1, with the viewport crop anchored to integer coordinates. The verifier compares the visible foreground boundary in both directions and named landmarks projected by the actual camera.",
      "Warm latency is page-input event to distinct ready revision with a submitted draw. Frame p95 is the main-thread requestAnimationFrame interval during the full fixed 60-second command sequence.",
      "Performance uses a fresh Chromium process; only the one nominated preview is open. Software-renderer results are in the named Linux environment. Dedicated GPU bytes and hardware performance remain unavailable.",
    ],
  };
  let browser;
  try {
    browser = await chromium.launch({ executablePath: executable, headless: true, args: launchArgs });
    report.environment = await browserInfo(browser);
    if (mode === "smoke") {
      report.results.initial = await session(browser, server.base, async ({ page, requests }) => {
        await navigate(page, server.base, build, requests);
        await open(page);
        return { draft: await inspectFixture(page, "default"), gpu: await gpu(page) };
      });
    }
    if (mode === "project-smoke") report.results.project = await projectOneSize(browser, server.base, build);
    if (mode === "demand-smoke") {
      report.results.demand = await session(browser, server.base, async ({ page, requests }) => {
        await navigate(page, server.base, build, requests);
        const source = await useDemand(page);
        const first = await open(page);
        assert.equal(first.revision, source.revision);
        await page.locator("#chest").fill("113");
        const revised = await waitChange(page, first);
        const cdp = await browser.newBrowserCDPSession();
        return { first, revised, charged: await workingSet(cdp, performance.now()), gpu: await gpu(page) };
      });
    }
    if (mode === "all" || mode === "functional") {
      process.stderr.write("UIQ-12 browser fixtures, picks, revision and reopen\n");
      report.results.fixtures = await acceptedFixtures(browser, server.base, build);
      report.results.race = await lazyRace(browser, server.base, build, false);
      report.results.closeRace = await lazyRace(browser, server.base, build, true);
      report.results.invalidAndNarrow = await invalidAndNarrow(browser, server.base, build);
      report.results.sizeReplay = await sizeReplay(browser, server.base, build);
    }
    if (mode === "all" || mode === "lifecycle") {
      process.stderr.write("UIQ-12 browser native context recovery and no-WebGL fallback\n");
      report.results.nativeLifecycle = await nativeRecovery(browser, server.base, build);
      report.results.noWebGL = await noWebGL(browser, server.base, build);
      report.results.rendererLoadFailure = await rendererLoadFailure(browser, server.base, build);
    }
    if (mode === "all" || mode === "perf") {
      await browser.close();
      browser = await chromium.launch({ executablePath: executable, headless: true, args: launchArgs });
      process.stderr.write("UIQ-12 browser demanding XL performance and working set\n");
      report.results.performance = await performanceProof(browser, server.base, build);
      const gates = Object.values(report.results.performance.budget);
      if (gates.some(({ pass }) => pass !== true)) throw new Error(`performance budget open: ${JSON.stringify(report.results.performance.budget)}`);
    }
    assert.deepEqual(buildReceipt(staged), build, "the artifact served by the replay remained frozen");
    if (mode === "all") assert.deepEqual(buildReceipt(BUILD), build, "the production candidate stayed frozen throughout the definitive replay");
    report.status = report.results.nativeLifecycle?.loss.extensionSupported === false ? "native-loss-evidence-unavailable" : "passed";
  } catch (error) {
    report.status = "failed";
    report.failure = error.stack || String(error);
    process.exitCode = 1;
  } finally {
    await browser?.close();
    server.close();
    fs.rmSync(work, { recursive: true, force: true });
  }
  const reportPath = path.join(EVIDENCE, "S1342-browser.json");
  const contents = JSON.stringify(report, null, 2) + "\n";
  fs.writeFileSync(reportPath, contents);
  console.log(JSON.stringify({ status: report.status, report: reportPath, sha256: digest(contents), failure: report.failure }));
}

main().catch((error) => {
  console.error("UIQ-12 BROWSER VERIFY FAILED", error.stack || error);
  process.exitCode = 1;
});
