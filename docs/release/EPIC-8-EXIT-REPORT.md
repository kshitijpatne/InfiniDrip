# Epic 8 Exit Report — Proof-only / No-go

Status: **complete as a rigorously documented proof-only/no-go exit**  
Date: **2026-09-21**  
Owner: **Codex**  
Slice 162 baseline: **`aa93154`**, verified as an ancestor of `origin/main` before this work  
Slice 163 packet commit: **`f06031e`** (`Slice 163: record artifact admission no-go`)

## Decision

Epic 8 does not admit a Sparrow/Jagua runtime, solver adapter, worker, owned
validator, benchmark promotion, UI mode, persistence, export path, or legacy
baseline change. The artifact/legal/worker packet was completed in the required
order, but offline reproducibility and worker-containment gates failed or
remain unproven. The exit is therefore proof-only/no-go, not an incomplete
runtime implementation.

`nestPieces` remains the default and unconditional runtime behavior. No current
garment, drafting, guidance, writer, or export behavior was changed. No
physical fit, sewability, production-marker quality, or material-savings claim
follows from this packet.

## Slice lineage and evidence

Slice 162 admitted only the additive reject-by-default contract in
[`EPIC-8-SLICE-162-ADMISSION.md`](../research/EPIC-8-SLICE-162-ADMISSION.md):
explicit one-material, non-fold, non-mirrored, finite-loop inputs may be
described for a future proof; unknown, multi-material, folded, mirrored, and
unsupported facts are rejected. It added no solver runtime.

The safe next packet is
[`EPIC-8-SLICE-163-ADMISSION.md`](../research/EPIC-8-SLICE-163-ADMISSION.md).
Its InfiniDrip-owned evidence is under
[`docs/research/epic8/sparrow-wasm/`](../research/epic8/sparrow-wasm/), including
the locked inputs, generated notices, dataset notice, build wrapper, and
[`ARTIFACT-MANIFEST.json`](../research/epic8/sparrow-wasm/ARTIFACT-MANIFEST.json).

The packet reviewed the actual source and evidence diff. Claude Code received
one bounded, read-only legal/source/license inventory using the requested Opus
5 class model alias; it could not edit, push, install tools, or decide
admission. Codex independently re-cloned, hashed, compared, validated, and
reviewed the evidence. No contributor pushed `main`.

## Exact revisions, provenance, and legal obligations

| Component | Exact identity | Recorded provenance |
| --- | --- | --- |
| Sparrow | Git `7f0e10f946f70a86138d3938548a13ee46464f39` | MIT; Git tree, source-archive SHA-256, raw license SHA-256, and normalized license-text SHA-256 in the manifest; no upstream `Cargo.lock` |
| Jagua-RS | crate `0.8.3`; source `a15ddd4909c5bd4d619c1878342c7b71ab27ac4a` | MPL-2.0; published crate 77,254 bytes with SHA-256 `f86db7f872ee10076adcbf44cbc9b68efb21dcbd8b0fd003994fca5a350d4f57`, matching the locked registry checksum; `.cargo_vcs_info.json` maps to the exact source revision and `jagua-rs` path |
| Sparrow Studio WASM wrapper | Git `2eabe10698e899ce2c59124ff97ca28479484bf6` | MIT reference build wrapper only; selected source archive and license hashes are recorded; no Studio runtime or npm graph was imported |

The copied Cargo lock has 150 package entries and 147 unique package names.
The retained notice evidence records the reference generator's 132 Rust
packages, 41 production npm packages, 129 deduplicated full license-text
blocks, source URLs, and per-text hashes. The manifest also records the exact
Cargo manifest, lock, toolchain, build-script, package-lock, notice, source
archive, direct-license, and Jagua registry hashes.

The future MPL-2.0 release packet must retain the license and attribution
notices, identify the exact covered source, provide a durable source offer,
separately identify and publish modifications to covered files, preserve the
lock/vendor/toolchain/build provenance, and obtain release-counsel approval of
the final WASM distribution wording. No Jagua source was modified and no
executable is distributed here. This is an engineering record, not legal
advice.

## Reproducibility result

The reference command and four variants are recorded: serial SIMD, serial
non-SIMD, threaded SIMD, and threaded non-SIMD. The packet preserves the
stable/nightly toolchain choices, `rust-src`/`-Z build-std` requirement, SIMD
and shared-memory flags, 1 GiB threaded linker maximum, TLS exports, release
settings, and disabled `wasm-opt` setting.

The gate did not pass. The reference build does not pin `wasm-pack`; no Cargo
vendor tree or source-replacement configuration is captured; no generated
WASM, glue, worker-helper, or source-map hashes exist; and the supported host
has no `cargo`, `rustc`, `rustup`, `wasm-pack`, or `wasm-bindgen` executable.
Consequently, local Rust resolution, cargo audit/deny, offline rebuild, and
deterministic artifact replay were not proven. The 1 GiB linker flag is not a
runtime memory budget or host kill policy.

For separation from candidate evidence, the existing InfiniDrip development
graph reported 9 npm audit advisories (3 moderate, 4 high, 2 critical). This
slice did not upgrade unrelated tooling, and the withheld candidate has no
runtime package installation; that report is not a Rust/WASM audit.

## Worker pressure result

| Required behavior | Result | Reason for no-go |
| --- | --- | --- |
| Hard timeout | **Fail** | Cooperative phase deadlines exist, but the parent watchdog is cleared after the first phase and no hard deadline for a running solve is proven. |
| Cancellation | **Partial / fail for admission** | Child termination and cooperative stop exist, but bounded acknowledgement and a result-level fallback for a blocked call are not proven. |
| Memory containment | **Fail** | Threaded linking requests a 1 GiB maximum; serial runtime memory and host/runtime measurement or kill policy are not bounded. |
| Malformed output | **Fail** | Messages are parsed and cast to a TypeScript union without runtime schema validation; candidate identity is positional and is marked passed before an InfiniDrip-owned geometry/identity validator. |
| Deterministic replay | **Unproven** | A seed is accepted, but the application uses a fresh cryptographic seed and threaded scheduling is not shown byte-stable; no fixed-seed binary/result replay exists. |
| Offline/network containment | **Unproven** | No InfiniDrip offline package, network-deny test, generated artifact, or source-replacement build exists. |
| Shelf fallback | **Fail** | The inspected worker reports errors/stopped states but does not return the current `nestPieces` result; no adapter guarantees fallback on every failure. |

The present product behavior therefore remains the owned shelf packer alone.

## Verification completed

- `npm ci` completed without changing package files.
- `npm test`: **104 test files passed; 1,415 tests passed**.
- `npm run coverage`: **100% statements, branches, functions, and lines**;
  104 files and 1,415 tests passed.
- `npm run build`: TypeScript and Vite build passed, with 105 modules
  transformed.
- The manifest parsed as JSON; all recorded SHA-256 fields were valid; all
  copied lock/manifest/notice inputs matched their manifest hashes.
- The published Jagua crate checksum and `.cargo_vcs_info.json` mapping were
  independently checked; the `a15ddd` versus `a037426` source comparison was
  limited to the two upstream homepage removals.
- Existing full-suite evidence retained parsed-output behavior and legacy
  export byte-identity coverage; no export baseline moved.
- `git diff --check` passed. The final changed-file set is limited to Epic 8
  state/planning/architecture/context/release evidence; no Web Platform files,
  deployment accounts, production environments, or unrelated garment code were
  changed.

## Reopen conditions

Epic 8 may be reconsidered only through a new maintainer-authorized packet that
closes every failed gate: pinned tools and vendored/source-replaced offline
build, generated artifact and glue hashes with replay logs, complete legal
source/notice mapping, hard worker timeout/cancellation/memory containment,
runtime message validation, fixed-seed replay, owned geometry/identity
validation, seven-recipe/two-scope benchmark evidence, and an unconditional
visible `nestPieces` fallback. Only then may the sequence reconsider the
adapter and later implementation slices.

