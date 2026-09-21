# Epic 8 Slice 163 — artifact, legal, and worker admission packet

Status: **complete as a proof-only/no-go admission packet; no runtime artifact
or worker is admitted**

Date: 2026-09-21  
Owner: Codex  
Precondition: `aa93154` (Slice 162) is an ancestor of `origin/main`.  
Evidence root: `docs/research/epic8/sparrow-wasm/`

This packet is the safe successor to Slice 162. It tests whether the candidate
Sparrow/Jagua source can be locked, legally redistributed, rebuilt offline, and
contained behind a worker. It does not add a solver dependency, invoke WASM,
change `nestPieces`, alter UI/persistence/writers, move an export baseline, or
claim a production marker.

## Decision

The source and notice evidence is now retained under an InfiniDrip-owned
evidence directory, but the admission gates do not pass. The exact lock and
notice files are useful provenance; they are not a reproducible artifact
manifest until a generated WASM binary, pinned build toolchain, offline vendor
tree, and independent worker pressure run exist.

Do not implement the original Slice 163 adapter or proceed to Slices 164–168.
Do not add a runtime dependency or an opt-in UI/export path. `nestPieces`
remains the only runtime nesting behavior and the unconditional fallback by
architecture. A proof-only/no-go Epic 8 exit is the next valid state.

This is an engineering admission decision, not legal advice. Any future
distribution requires release-counsel review of the exact executable, source
offer, notices, and modification record.

## Exact source and artifact evidence

The captured manifest is
[`ARTIFACT-MANIFEST.json`](epic8/sparrow-wasm/ARTIFACT-MANIFEST.json). It records
the following exact revisions, Git tree IDs, source-archive hashes, license
hashes, lock hashes, build flags, and missing generated-artifact hashes:

| Component | Revision | License | Evidence |
| --- | --- | --- | --- |
| Sparrow | `7f0e10f946f70a86138d3938548a13ee46464f39` | MIT | source archive hash and direct license hash in the manifest; this repository revision has no `Cargo.lock` |
| Jagua-RS | `a15ddd4909c5bd4d619c1878342c7b71ab27ac4a`, crate `0.8.3` | MPL-2.0 | registry checksum from the locked crate plus exact upstream source archive and MPL text hash |
| Sparrow Studio WASM wrapper | `2eabe10698e899ce2c59124ff97ca28479484bf6` | MIT | reference build wrapper only; no Studio runtime is imported |

The InfiniDrip-owned evidence copies are:

- `Cargo.toml` and `Cargo.lock` for the exact Studio WASM crate, including the
  git-pinned Sparrow revision and registry checksums for the transitive Rust
  graph;
- `package-lock.json` for the reference web wrapper, retained as provenance
  only and not as an InfiniDrip runtime dependency;
- `rust-toolchain.toml` and `build-wasm.mjs`, which expose the target, release
  settings, four serial/threaded SIMD variants, and linker flags;
- `THIRD_PARTY_NOTICES.txt`, including the generator's declared 132 Rust
  packages, 41 production npm packages, 129 deduplicated full license-text
  blocks, source URLs and per-text SHA-256 references; and
- `DATASET-NOTICE.txt`, because the reference corpus is not silently treated as
  solver code or as InfiniDrip-owned data.

The notice file is a checked-in evidence copy, not a claim that the reference
web application or its npm graph has entered InfiniDrip. The lock contains 150
package entries (147 unique package names) because it includes platform and
optional entries; notice generation resolves the wasm32 target with the
`threads` feature and records a conservative package superset.

## Reproducibility and offline rebuild

The upstream reference command is:

```text
npm ci && npm run wasm:build
```

Its four outputs are serial SIMD, serial non-SIMD, threaded SIMD, and threaded
non-SIMD. The threaded variants use nightly `2026-08-30`, `-Z build-std`,
shared-memory linker flags, and a `--max-memory=1073741824` linker setting.
The serial variants use stable Rust and explicit `+simd128` or `-simd128`.
`wasm-opt` is disabled. No `target-cpu=native` flag was observed.

An InfiniDrip offline rebuild would additionally need to:

1. verify the three upstream commits, the captured source-archive hashes, and
   every evidence-file hash;
2. install the exact stable target and pinned nightly plus `rust-src`, with
   the compiler/library notice files captured;
3. pin a specific `wasm-pack` and `wasm-bindgen` tool version, which the
   reference build currently does not do;
4. vendor every registry crate and the Sparrow git source, record the vendor
   archive hashes, and use Cargo source replacement so the build cannot reach
   the network;
5. run the four builds with the recorded flags in a clean disposable checkout;
6. hash every generated `.wasm`, JS glue, worker helper, and source map, then
   replay each build from the same offline cache; and
7. retain the raw build logs, host/toolchain versions, inputs, and hashes with
   the release record.

The current packet cannot claim those steps passed. There is no vendored cache
or Cargo source-replacement configuration, no pinned `wasm-pack`, and no
generated WASM artifact at the selected Studio revision. The current Windows
host has no `cargo`, `rustc`, `rustup`, `wasm-pack`, or `wasm-bindgen` command,
so no local Rust build, cargo metadata resolution, cargo audit/deny run, or
offline replay was possible. These are recorded failures/unknowns, not
assumptions.

For separation from candidate evidence, `npm audit --json` on the existing
InfiniDrip development graph reported 9 advisories (3 moderate, 4 high, 2
critical). This slice does not upgrade unrelated tooling or treat that report
as a Rust/WASM audit; the withheld candidate has no runtime package install.

## MPL-2.0 obligations recorded for a future release

The locked `jagua-rs 0.8.3` package declares MPL-2.0 and its full license text
is retained in the notice evidence. The downloaded crate was independently
verified at 77,254 bytes with SHA-256
`f86db7f872ee10076adcbf44cbc9b68efb21dcbd8b0fd003994fca5a350d4f57`; its
`.cargo_vcs_info.json` records source revision
`a15ddd4909c5bd4d619c1878342c7b71ab27ac4a` and path `jagua-rs`. Before
distributing any executable that
contains it, the release packet must, at minimum and subject to counsel's
review:

- retain the MPL license text, copyright/attribution notices, and the complete
  transitive notice set with the executable or its distribution;
- identify the exact covered source and provide a durable, reasonable way for
  recipients to obtain that source, including the exact Jagua source revision
  and any InfiniDrip changes needed to reproduce the executable;
- keep modifications to MPL-covered files separately identifiable, preserve
  the applicable notices, and publish the corresponding modified source;
- retain the InfiniDrip-owned lock, vendor tree, toolchain/build flags,
  generated-artifact hashes, and source-offer mapping so the shipped binary is
  traceable; and
- have release counsel approve the final notice/source-offer wording and the
  treatment of a WASM executable before packaging.

No Jagua source file is modified or bundled by this packet, and no executable
is distributed. That fact keeps the current repository outside the unresolved
runtime distribution question; it does not waive the obligations above.

## Worker isolation pressure test

The audit inspected the exact Studio coordinator/runtime worker and WASM
bridge. The observed behavior is not sufficient for InfiniDrip admission:

| Scenario | Observed evidence | Gate |
| --- | --- | --- |
| Hard wall-clock timeout | Rust uses cooperative phase deadlines. The coordinator has startup timers and can terminate child workers, but `useSolver` clears its watchdog after the first phase and has no parent hard deadline for a running solve. | **Fail** |
| Cancellation | Stop terminates the coordinator's runtime and Rayon workers; exploration skip is cooperative through shared memory. There is no proven bounded acknowledgement or result-level fallback contract for a blocked call. | **Partial / fail for admission** |
| Memory | Threaded linking requests a 1 GiB maximum, but serial memory is not bounded and no host/runtime memory measurement or kill policy is supplied. A linker maximum is not an InfiniDrip worker memory budget. | **Fail** |
| Malformed output | The bridge `JSON.parse`s messages, but casts them to a TypeScript union without runtime schema validation. `candidateResult` maps item IDs by array position and marks candidates as passed before an InfiniDrip-owned geometry/identity validator runs. | **Fail** |
| Deterministic replay | The WASM function accepts a seed, but the application chooses a fresh cryptographic seed and threaded Rayon scheduling is not shown to be byte-stable. No fixed-seed binary/result replay artifact is present. | **Unproven** |
| Offline/network containment | Local worker modules are loaded through the web build, while the reference build and service-worker setup do not constitute a clean offline package proof. No InfiniDrip package or network-deny test exists. | **Unproven** |
| Shelf fallback | The reference worker reports errors/stopped states, but it does not return InfiniDrip's current `nestPieces` result. No adapter exists to guarantee fallback on every failure. | **Fail** |

This matrix is deliberately stronger than the upstream application's own
worker tests. The candidate must meet InfiniDrip's contract: hard bounded
execution, cancellation, memory containment, runtime message validation,
fixed-seed replay, and a visible deterministic shelf result on every failure.

## Gate result and next safe state

| Admission gate | Result | Durable evidence |
| --- | --- | --- |
| Exact revisions and lock | Evidence captured; InfiniDrip vendor lock still not complete | `ARTIFACT-MANIFEST.json`, copied `Cargo.lock` |
| Full transitive notices | Evidence captured in a checked-in notice copy | `THIRD_PARTY_NOTICES.txt` and its manifest hash |
| MPL source/modification plan | Obligations recorded; counsel review still required for distribution | This packet, notice source references |
| Offline reproducible build | **Fail** | no toolchain, no vendored cache, no pinned `wasm-pack`, no generated artifact hashes |
| Supply-chain and artifact provenance | **Unproven** | cargo audit/deny and artifact replay unavailable |
| Worker hard isolation | **Fail** | pressure-test matrix above |
| Current recipe semantics | Narrow contract only; fold/pair/multi-material remain rejected | Slice 162 contract and tests |
| Fallback/default behavior | Preserved; no current nesting code was changed | diff and existing Epic 7 boundary |

Because the offline-build and worker-containment gates fail, the original
Slice 163 solver adapter is not admitted. Epic 8 should take the proof-only/
no-go exit unless a later maintainer-authorized packet supplies every missing
gate and reopens the sequence. No physical-fit, material-savings,
production-marker, sewability, or manufacturing claim follows from this
evidence.

## Contributor packet and Codex review

Claude Code was given one bounded read-only packet using the requested Opus 5
class model alias. Its boundary was the exact three upstream revisions and
their source/license/notice evidence. It could read the disposable upstream
checkouts and public source pages, but could not edit files, install tools,
change Git state, push, or decide admission. Its required return was JSON with
`revisions`, `directLicenses`, `transitiveEvidence`,
`noticeAndMplObligations`, `provenanceGaps`, and `recommendedNoGoGates`.

The contributor corroborated the missing Sparrow lock, the exact Jagua crate
checksum/VCS mapping, missing Cargo license metadata for Sparrow, the MPL
root-license placement, and the notice-count reconciliation gap. Codex
independently re-cloned the three revisions, fetched and hashed the published
Jagua crate, inspected `.cargo_vcs_info.json`, compared the `a15ddd` to
`a037426` source change, copied the evidence files, and reviewed the actual
working-tree diff. No contributor modified the repository or pushed `main`.
