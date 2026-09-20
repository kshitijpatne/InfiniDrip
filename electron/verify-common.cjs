// Shared helpers for the developer-only Electron verification scripts.
// These helpers deliberately make the supported package target explicit and
// keep every run isolated from a developer's real Electron profile.
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { _electron: electron } = require("playwright");

const ROOT = path.resolve(__dirname, "..");

function packagedCandidates() {
  if (process.platform === "win32") {
    return [path.join(ROOT, "release", "win-unpacked", "InfiniDrip.exe")];
  }
  if (process.platform === "darwin") {
    return [
      path.join(ROOT, "release", "mac", "InfiniDrip.app", "Contents", "MacOS", "InfiniDrip"),
      path.join(ROOT, "release", "mac-arm64", "InfiniDrip.app", "Contents", "MacOS", "InfiniDrip"),
      path.join(ROOT, "release", "mac-x64", "InfiniDrip.app", "Contents", "MacOS", "InfiniDrip"),
    ];
  }
  return [path.join(ROOT, "release", "linux-unpacked", "InfiniDrip")];
}

function packagedExecutable() {
  const found = packagedCandidates().find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error([
      "No supported unpacked Electron artifact was found.",
      `Expected one of: ${packagedCandidates().join(", ")}`,
      "Run `npm run electron:pack` first.",
    ].join(" "));
  }
  return found;
}

function electronArgs(userDataDir, offline = false) {
  return [
    ...(process.platform === "linux" ? ["--no-sandbox"] : []),
    ...(offline ? ["--host-rules=MAP * ~NOTFOUND"] : []),
    `--user-data-dir=${userDataDir}`,
  ];
}

async function launch({ packaged = false, userDataDir, devServerUrl, offline = false }) {
  if (!userDataDir) throw new Error("Electron verification requires an isolated user-data directory.");
  if (packaged) {
    return electron.launch({
      executablePath: packagedExecutable(),
      args: electronArgs(userDataDir, offline),
    });
  }
  return electron.launch({
    executablePath: require("electron"),
    args: [path.join(ROOT, "dist-electron", "main.cjs"), ...electronArgs(userDataDir, offline)],
    env: { ...process.env, VITE_DEV_SERVER_URL: devServerUrl },
  });
}

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function removeTempDir(dir) {
  if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function listFiles(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else files.push({
        path: path.relative(root, absolute).split(path.sep).join("/"),
        bytes: fs.statSync(absolute).size,
        sha256: sha256(absolute),
      });
    }
  };
  visit(root);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function waitForHttp(url, timeoutMs = 15000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });
      request.on("error", retry);
      request.setTimeout(500, () => request.destroy());
    };
    const retry = () => {
      if (Date.now() - started >= timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(attempt, 100);
    };
    attempt();
  });
}

async function startPreviewServer() {
  const port = 4173 + (process.pid % 200);
  const url = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [
    path.join(ROOT, "node_modules", "vite", "bin", "vite.js"),
    "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort",
  ], { cwd: ROOT, env: process.env, stdio: "ignore", windowsHide: true });
  try {
    await waitForHttp(url);
  } catch (error) {
    child.kill();
    throw error;
  }
  return {
    url,
    stop: () => {
      if (!child.killed) child.kill();
    },
  };
}

async function closeApp(app) {
  if (!app) return;
  try { await app.close(); } catch { /* cleanup must not hide the original failure */ }
}

module.exports = {
  ROOT,
  closeApp,
  electronArgs,
  launch,
  listFiles,
  makeTempDir,
  packagedCandidates,
  packagedExecutable,
  removeTempDir,
  sha256,
  startPreviewServer,
};
