import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import board from "./data/board.json" with { type: "json" };
import { startControlCenterServer } from "./server.mjs";

async function withServer(run) {
  const root = await mkdtemp(join(tmpdir(), "infinidrip-control-center-"));
  const boardPath = join(root, "board.json");
  await writeFile(boardPath, `${JSON.stringify(board, null, 2)}\n`);
  await mkdir(join(root, "proof"));
  await writeFile(join(root, "proof", "test.md"), "verified proof\n");
  const fixture = JSON.parse(JSON.stringify(board));
  fixture.evidence[0].uri = "proof/test.md#result";
  await writeFile(boardPath, `${JSON.stringify(fixture, null, 2)}\n`);
  const server = await startControlCenterServer({ port: 0, boardPath, repositoryRoot: root });
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await run({ base, fixture }); } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
    assert.ok(root.startsWith(tmpdir()));
    await rm(root, { recursive: true, force: true });
  }
}

test("localhost API persists commands and rejects stale writers", async () => {
  await withServer(async ({ base, fixture }) => {
    const loaded = await (await fetch(`${base}/api/board`)).json();
    assert.equal(loaded.revision, fixture.revision);
    const savedResponse = await fetch(`${base}/api/commands`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "editItem", itemId: "SLICE-175", expectedRevision: fixture.revision, patch: { owner: "Local editor" } }),
    });
    assert.equal(savedResponse.status, 200);
    assert.equal((await savedResponse.json()).revision, fixture.revision + 1);
    const stale = await fetch(`${base}/api/commands`, {
      method: "POST", body: JSON.stringify({ type: "editItem", itemId: "SLICE-175", expectedRevision: fixture.revision, patch: { owner: "Stale" } }),
    });
    assert.equal(stale.status, 409);
    assert.match((await stale.json()).error, /reload revision/);
  });
});

test("service exposes only intended static and referenced evidence routes", async () => {
  await withServer(async ({ base, fixture }) => {
    const redirect = await fetch(base, { redirect: "manual" });
    assert.equal(redirect.status, 302);
    assert.equal(redirect.headers.get("location"), "/app/");
    assert.equal((await fetch(`${base}/app/`)).status, 200);
    const proof = await fetch(`${base}/api/evidence/${fixture.evidence[0].id}`);
    assert.equal(await proof.text(), "verified proof\n");
    assert.equal((await fetch(`${base}/api/evidence/UNKNOWN`)).status, 404);
    assert.equal((await fetch(`${base}/package.json`)).status, 404);
  });
});

test("malformed commands fail without mutating the board", async () => {
  await withServer(async ({ base, fixture }) => {
    const malformed = await fetch(`${base}/api/commands`, { method: "POST", body: "{" });
    assert.equal(malformed.status, 400);
    assert.match((await malformed.json()).error, /valid JSON/);
    assert.equal((await (await fetch(`${base}/api/board`)).json()).revision, fixture.revision);
  });
});
