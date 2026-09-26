# EPIC-15/G02 — F01 portable project package (Slice 234)

**Result:** implemented and verified. Slice 234 completes the admitted F01
package scope. F01 is ready to close after its evidence is linked on the
canonical Control Center; F02 starts only after that recorded transition.

## Delivered behavior

The project manager now exports a named `.infinidrip.zip` local backup and
imports one through an accessible file picker. The browser uses its normal
download path. Electron presents a save dialog and transfers the archive as
binary bytes through the isolated preload bridge; the bridge does not send a
base64 copy through renderer storage. Both routes report progress, cancellation
and actionable failures. The project is unchanged when export is canceled or
package validation fails.

The archive contains the versioned project record, every active or archived
style, style-scoped recovery, and the referenced local artwork bytes. It keeps
stable source IDs, source labels and image hashes. A source label is retained as
attribution metadata; it is not a rights or license determination. A canonical
manifest digest and each artwork's SHA-256 are integrity checks, not signatures
or proof of authorship.

Package import is idempotent by package digest. When source project/style IDs or
artwork IDs conflict with different local records, the UI requires an explicit
copy decision. A copy gets new project/style/artwork IDs, keeps its source
lineage, and remaps style recovery and artwork placements. Existing identical
artwork bytes can be reused without changing the design's references.

## Format and trust boundary

Package version 1 is a strict stored-ZIP profile implemented with the pinned
`fflate` 0.8.3 dependency (MIT license). It has these enforced limits:

- 256 MiB maximum archive size and 256 MiB maximum total uncompressed content.
- 128 referenced local artwork assets; each asset is limited by the existing
  artwork validator to 10 MiB.
- 1 MiB maximum manifest size.
- ASCII, allow-listed paths; one leading manifest; local/central directory and
  data-descriptor agreement; per-entry CRC; package and artwork SHA-256.
- No ZIP64, multi-disk archives, compression, archive comments, extra fields,
  per-entry comments, duplicate paths, unlisted bytes, or path traversal.

Import checks the archive structure, manifest and digest, record schemas,
artwork bytes, and safe-image inspection before writing project records. It
then stages and reads back local artwork before one IndexedDB transaction writes
the project/style/recovery/import-receipt records. A transaction failure removes
staged unreferenced artwork; cleanup failure is surfaced as an explicit storage
error. Collisions, races, cancellation, quota errors, malformed bytes, missing
assets, corrupt inspection output, and repeated imports have tested outcomes.

The ZIP reader streams entry bytes for validation and checks that the stream
still matches the preflighted directory. Export packages ZIP output as Blob
parts. The feature is local-first and user-initiated: it adds no cloud backup,
account, remote asset transfer, supplier workflow, or background upload.

## Verification evidence

| Gate | Result |
| --- | --- |
| Full uninstrumented Vitest suite | 118 files; 1,650/1,650 tests passed, including the 250 MiB package stress case. |
| Repository-wide coverage | 100% statements, branches, functions and lines. The single 250 MiB stress test was excluded from instrumentation and passed in the full ordinary run. |
| Protected legacy exports | All eight byte-identity checks passed; no baseline moved. |
| Production build and TypeScript | `npm run build`, Electron runtime build and `npx tsc --noEmit` passed. |
| Control Center | `npm run control-center:test`: 33/33 passed. |
| Production dependency audit | `npm audit --omit=dev`: zero vulnerabilities. |
| Browser/Electron runtime proof | `npm run electron:verify-project-package` passed in Headless Chromium 151.0.7922.34 and Electron 44.1.0 / Chromium 152.0.7977.65. Three styles, one recovery record and 114 artwork bytes survived a clean-profile restart in each runtime; the artwork hash matched `d5f71bac55b2f07fb249542aabff0c77cef853dda86523fe18996440484621c9`. |

The runtime proof wrote a 4,421-byte package in each runtime. Package digests
differed because the two independent runs create separate project/recovery
records; each package validated and its local artwork hash matched after
restart. This proof verifies app integration, not cross-browser profile
portability or permanent storage.

In the focused uninstrumented package run, the 64 MiB round trip took about 8.6
seconds; the 250 MiB round trip took about 33.6 seconds and the sampled process
peak RSS was about 791 MB. Under the full-suite load, the same fixtures took
about 25 seconds and 59 seconds. This is a real resource cost: the 256 MiB cap
is a hard ceiling, not a promise that a low-memory browser can safely process a
maximum-sized package. The implementation does not claim bounded-memory
streaming.

## Limits and handoff

Browser IndexedDB can still be cleared, evicted, or run out of quota. The backup
is not automatic and must be saved somewhere the user controls. A valid digest
detects accidental or adversarial byte changes relative to the manifest; it
does not authenticate the sender, authorize artwork use, or guarantee that an
asset is harmless outside the existing safe-image checks. Version 1 deliberately
rejects broader ZIP features instead of trying to interpret them.

F01's previously accepted storage, legacy migration, recovery and browser/
Electron restart evidence remains in S230–S233. Together with this package gate,
the admitted F01 scope is complete. F02's field provenance and dependency
invalidation starts after the canonical Control Center records F01 Done and
F02 In Progress. No garment recipe, physical sample, supplier contact, paid or
hosted service, user-facing AI designer, physical-fit claim, or
production-readiness claim was added.
