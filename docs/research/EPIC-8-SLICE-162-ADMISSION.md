# Epic 8 Slice 162 — constraint and legal admission record

Status: **complete as a proof-contract/no-runtime-admission decision**

Date: 2026-09-21  
Owner: Codex  
Scope: a versioned, InfiniDrip-owned input contract and upstream evidence only.
No solver, WASM, UI, persistence, export, marker, or `nestPieces` behavior is
added by this slice.

## Decision

The source-level contract is admitted as an isolated, additive boundary in
`src/export/nesting-proof-contract.ts`. A Sparrow/Jagua runtime artifact is
**not admitted**. The proof remains unable to invoke an external optimizer
until a later packet produces an InfiniDrip-owned, locked artifact manifest,
full notices, source-availability plan, reproducible offline build evidence and
worker failure harness.

This is a deliberate no-runtime decision, not a license finding that MPL-2.0
is unusable. It prevents a bundled executable from reaching users under an
unverified source/notice/rebuild story. This engineering record is not legal
advice; release counsel must review any actual distribution plan.

## Exact upstream evidence inspected

| Component | Exact revision / package | License evidence | Admission consequence |
| --- | --- | --- | --- |
| `JeroenGar/sparrow` | `7f0e10f946f70a86138d3938548a13ee46464f39` (2026-09-15, `Require jagua-rs 0.8.3 for robust clearance buffering`) | Repository `LICENSE` is MIT. `Cargo.toml` declares Rust 1.90 and `jagua-rs = 0.8.3`, but the repository has no committed `Cargo.lock`. | Source is a candidate only. Semver dependency resolution is not an artifact pin. |
| `JeroenGar/jagua-rs` | upstream `a037426a7123ab2f4e610d455b098b00b26cb6cd` inspected; the published `0.8.3` source revision identified by Studio notices is `a15ddd4909c5bd4d619c1878342c7b71ab27ac4a` | Repository `LICENSE` is MPL-2.0. | Any shipped executable containing it needs retained MPL notices and a reasonable way for recipients to obtain covered source, including any modified MPL-covered files. |
| `JeroenGar/sparrow-studio` | `2eabe10698e899ce2c59124ff97ca28479484bf6` (2026-09-15) | Repository `LICENSE` is MIT. Its `web/wasm/Cargo.toml` pins Sparrow at `7f0e10f...` and `jagua-rs = 0.8.3`; its generated notice file inventories a conservative 132 Cargo packages plus 41 production npm packages. | Useful evidence and a possible future reference implementation, not a license shortcut or a trusted artifact. |

The Studio notice file points to the `jagua-rs` 0.8.3 crate archive and the
`a15ddd...` source revision. It is not copied into InfiniDrip, and no Studio
wrapper code, generated WASM, JavaScript, package lock, source text, or dataset
is reused by this slice.

## Owned proof contract

`NESTING_PROOF_INSTANCE_VERSION` is `1`. The contract carries an explicit
fixed seed, fabric width/edge margin/clearance, original `FlatPiece` cut and
sew loops, stable piece identity, physical quantity, material ID, fold,
pairing, allowed rotations and nap.

The only currently admitted subset is intentionally narrow:

- one material per instance;
- finite three-or-more-point cyclic cut and sew loops;
- positive whole physical quantity;
- no cut-on-fold piece;
- no mirrored pair;
- no unknown fold or pairing fact;
- rotation policy of `0` or `180` only; directional nap allows `0` only; and
- a non-negative safe-integer fixed seed and usable fabric constraints.

The contract does **not** infer quantity from display labels, treat an
export-only unfolded piece as a physical quantity, double a fold piece, create
a mirror, combine lining/rib/main material, or allow 90/270-degree rotation.
It structurally checks finite loops, but it intentionally does not yet claim
polygon simplicity, clearance, containment, collision, transform validity or
deterministic solver output. Those are later owned-validator work.

Every rejection returns a machine-readable reason and human-readable detail:
`empty-input`, `malformed-input`, `unknown-physical-semantics`,
`unsupported-fold`, `unsupported-pairing`, `unsupported-multi-material`, or
`unsupported-orientation`. A future caller must surface the reason and use the
existing shelf packer; this slice has no caller, so it cannot affect users.

## Runtime admission gates still open

Before any adapter invokes Sparrow or a binary/WASM reaches an InfiniDrip
package, a new explicit packet must require all of the following:

1. An InfiniDrip-owned lockfile/manifest that resolves the entire transitive
   tree, records package/source hashes, license identifiers and full notice
   texts. Do not rely on an upstream repository head or a semver range.
2. A reproducible offline build on each supported host, with Rust toolchain,
   compiler target, build flags, input artifact hashes and generated WASM hash
   recorded. The build must not use `target-cpu=native` as a portability claim.
3. A distribution notice/source-offer plan satisfying MPL-2.0 for every
   covered executable and any modified covered source. Changes to MPL-covered
   files must remain separately identifiable and available in source form.
4. Supply-chain review of direct and transitive dependencies, generated
   artifact provenance, vulnerability result and update/rollback owner.
5. A contained worker protocol with hard time/memory/cancellation limits and
   an adversarial malformed-output test matrix. It must always return the
   existing `nestPieces` result on failure.
6. A current-recipe adapter audit proving which present and future pieces have
   the physical semantics required by the narrow contract. Unsupported facts
   remain visible and fall back; they are not reconstructed from names.

## Verification

- `src/export/nesting-proof-contract.test.ts`: 3 focused tests covering valid,
  empty, malformed, unknown and unsupported semantic instances.
- Focused test: pass (3/3).
- Focused module coverage: 100% statements, branches, functions and lines.
- Strict TypeScript: pass.
- The full repository gate remains required before integration; this slice does
  not move export baselines or invoke a solver.

## Safe next work

Do not begin Slice 163 as originally written, because it promises solver input
and raw diagnostics. The next safe option is a newly scoped **artifact and
worker reproducibility packet** satisfying the six gates above. Otherwise Epic
8 may exit proof-only with the current shelf packer unchanged.
