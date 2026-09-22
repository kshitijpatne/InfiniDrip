import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { executeBoardCommand, readBoardFile, DEFAULT_BOARD_PATH } from "./board-store.mjs";

const DEFAULT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const MAX_BODY_BYTES = 256 * 1024;
const STATIC_FILES = new Map([
  ["/app/", ["app/index.html", "text/html; charset=utf-8"]],
  ["/app/index.html", ["app/index.html", "text/html; charset=utf-8"]],
  ["/app/board.mjs", ["app/board.mjs", "text/javascript; charset=utf-8"]],
  ["/app/client.mjs", ["app/client.mjs", "text/javascript; charset=utf-8"]],
  ["/app/styles.css", ["app/styles.css", "text/css; charset=utf-8"]],
  ["/board-core.mjs", ["board-core.mjs", "text/javascript; charset=utf-8"]],
]);

function send(response, status, body, contentType = "application/json; charset=utf-8") {
  response.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(contentType.startsWith("application/json") ? `${JSON.stringify(body)}\n` : body);
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("Command body exceeds 256 KiB");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("Command body must be valid JSON");
  }
}

function commandErrorStatus(error) {
  return /Board changed since revision|Board is busy/.test(error.message) ? 409 : 400;
}

function isInside(root, candidate) {
  const pathFromRoot = relative(root, candidate);
  return pathFromRoot !== "" && !pathFromRoot.startsWith("..") && !isAbsolute(pathFromRoot);
}

async function serveEvidence(response, evidenceId, { boardPath, repositoryRoot }) {
  const board = await readBoardFile(boardPath);
  const evidence = board.evidence.find((entry) => entry.id === evidenceId);
  if (!evidence) return send(response, 404, { error: `Unknown evidence ${evidenceId}` });
  const pathOnly = evidence.uri.split("#", 1)[0];
  const root = await realpath(repositoryRoot);
  const candidate = await realpath(resolve(root, pathOnly)).catch(() => null);
  if (!candidate || !isInside(root, candidate)) return send(response, 404, { error: "Evidence file is unavailable" });
  const contentTypes = new Map([[".md", "text/markdown; charset=utf-8"], [".json", "application/json; charset=utf-8"], [".txt", "text/plain; charset=utf-8"]]);
  send(response, 200, await readFile(candidate), contentTypes.get(extname(candidate).toLowerCase()) ?? "application/octet-stream");
}

export function createControlCenterServer(options = {}) {
  const boardPath = options.boardPath ?? DEFAULT_BOARD_PATH;
  const repositoryRoot = resolve(options.repositoryRoot ?? DEFAULT_ROOT);
  const controlCenterRoot = resolve(options.controlCenterRoot ?? fileURLToPath(new URL(".", import.meta.url)));
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (request.method === "GET" && url.pathname === "/") {
        response.writeHead(302, { location: "/app/", "cache-control": "no-store" });
        return response.end();
      }
      if (request.method === "GET" && url.pathname === "/api/board") {
        return send(response, 200, await readBoardFile(boardPath));
      }
      if (request.method === "POST" && url.pathname === "/api/commands") {
        try {
          const board = await executeBoardCommand(await readJsonBody(request), { boardPath });
          return send(response, 200, board);
        } catch (error) {
          return send(response, commandErrorStatus(error), { error: error.message });
        }
      }
      if (request.method === "GET" && url.pathname.startsWith("/api/evidence/")) {
        return await serveEvidence(response, decodeURIComponent(url.pathname.slice(14)), { boardPath, repositoryRoot });
      }
      const staticFile = request.method === "GET" ? STATIC_FILES.get(url.pathname) : undefined;
      if (staticFile) {
        const [localPath, type] = staticFile;
        return send(response, 200, await readFile(resolve(controlCenterRoot, localPath)), type);
      }
      return send(response, 404, { error: "Not found" });
    } catch (error) {
      return send(response, 500, { error: `Control Center failed: ${error.message}` });
    }
  });
}

export async function startControlCenterServer(options = {}) {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 4174;
  const server = createControlCenterServer(options);
  await new Promise((resolveReady, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolveReady);
  });
  return server;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const server = await startControlCenterServer();
  const address = server.address();
  console.log(`InfiniDrip Control Center: http://127.0.0.1:${address.port}/app/`);
}
