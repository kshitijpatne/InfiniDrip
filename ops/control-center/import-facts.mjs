import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const COMMIT_PATTERN = /^[0-9a-f]{7,40}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/i;

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertRepoUri(value, field) {
  if (typeof value !== "string" || value.length === 0 || value.startsWith("/") || /^[a-z]+:/i.test(value) || value.split("/").includes("..")) {
    throw new Error(`${field} must be a non-empty repository-relative path`);
  }
}

function assertOptionalHash(value, field) {
  if (value !== null && (typeof value !== "string" || !SHA256_PATTERN.test(value))) {
    throw new Error(`${field} must be null or a 64-character SHA-256 hex value`);
  }
}

/**
 * Apply only explicitly verified facts to existing evidence records.
 *
 * This function deliberately does not infer dates, ownership, status or
 * delivery. Evidence identity and repository URI are immutable; a caller can
 * only fill the verifiable commit/hash/proof fields already represented on the
 * board.
 */
export function importFacts(board, facts) {
  if (!isRecord(board) || !Array.isArray(board.evidence)) throw new Error("board must contain an evidence array");
  if (!Array.isArray(facts) || facts.length === 0) throw new Error("facts must be a non-empty array");

  const evidenceById = new Map(board.evidence.map((evidence) => [evidence?.id, evidence]));
  const seen = new Set();
  const updates = new Map();
  for (const [index, fact] of facts.entries()) {
    if (!isRecord(fact)) throw new Error(`facts[${index}] must be an object`);
    const { evidenceId, uri, kind, commit, sha256, verified, note } = fact;
    if (typeof evidenceId !== "string" || evidenceId.length === 0) throw new Error(`facts[${index}].evidenceId is required`);
    if (seen.has(evidenceId)) throw new Error(`facts[${index}] duplicates ${evidenceId}`);
    seen.add(evidenceId);
    const existing = evidenceById.get(evidenceId);
    if (!existing) throw new Error(`facts[${index}] references unknown evidence ${evidenceId}`);
    if (uri !== existing.uri) throw new Error(`facts[${index}].uri must match the existing evidence URI`);
    if (kind !== existing.kind) throw new Error(`facts[${index}].kind must match the existing evidence kind`);
    assertRepoUri(uri, `facts[${index}].uri`);
    if (commit !== null && (typeof commit !== "string" || !COMMIT_PATTERN.test(commit))) throw new Error(`facts[${index}].commit must be null or a commit hash`);
    assertOptionalHash(sha256, `facts[${index}].sha256`);
    if (verified !== true) throw new Error(`facts[${index}].verified must be true for an imported fact`);
    if (commit === null && sha256 === null) throw new Error(`facts[${index}] must provide a commit or SHA-256 proof`);
    if (typeof note !== "string" || note.trim().length === 0) throw new Error(`facts[${index}].note is required`);
    updates.set(evidenceId, { ...existing, commit, sha256, verified: true, note });
  }

  return {
    ...board,
    evidence: board.evidence.map((evidence) => updates.get(evidence.id) ?? { ...evidence }),
  };
}

async function main() {
  const [boardPath, factsPath, outputPath] = process.argv.slice(2);
  if (!boardPath || !factsPath || !outputPath) {
    throw new Error("usage: node ops/control-center/import-facts.mjs <board.json> <facts.json> <output.json>");
  }
  const board = JSON.parse(await readFile(boardPath, "utf8"));
  const facts = JSON.parse(await readFile(factsPath, "utf8"));
  const imported = importFacts(board, facts);
  await writeFile(outputPath, `${JSON.stringify(imported, null, 2)}\n`, "utf8");
  console.log(`Imported ${facts.length} verified evidence record(s) into ${outputPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
