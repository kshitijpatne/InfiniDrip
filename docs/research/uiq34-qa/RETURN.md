# UIQ03/UIQ04 independent QA return

Model: opencode/muse-spark-1.3-contributor-free, xhigh, normal build. No fast/substitution/OpenAI.
Branch: opencode/uiq34-clarity-qa. HEAD: a5af5e13c2e967946b3f6035fcea66ff03a5e0e0.
Read: QA-HANDOFF.md, UIQ-CLARITY-ADMISSION.md fully + CONTEXT-INDEX, PROJECT-STATE, REVIEW-MATRIX, both CONTRIBUTOR-RETURNs, all frozen source/CSS/tests/previews, foundation/ease/appearance/journey/note. No other worktree, no Epic17 contact.
Frozen hashes: before 27/27 OK, after BAD:[]. Candidate hashes in evidence/input-hashes.log.

## Verdicts (REVIEW-MATRIX rows)
- Journey/validity/fit/checklist/legacy-done/blocked independence: PASS (adversarial).
- Severity/detail/unknown/empty literal, Unicode unbroken, duplicate atomicity, no fabricated rationale: PASS.
- Callback aliasing/optional-field/replace/remove/detached/multi-mount/dispose/post-dispose: PASS.
- Reorder + sync controlled update node/focus/open disclosure: PASS.
- Preset exact-match, collision custom, 125/101/250 usable no cap, -5/NaN/Infinity literal unclamped: PASS.
- Appearance 4 textures + shine 0/100, invalid URL color/texture/shine 101/NaN withheld + raw literal, null unavailable distinct from default, no unsafe style/class/URL, no compatibility inference: PASS.
- Compatibility mismatch/unknown retained, review never disabled: PASS.
- Isolation (one root, siblings, independent IDs, listener cleanup, scoped CSS): PASS (static + DOM).
- Accessibility/reflow/contrast/forced-colors/reduced-motion rendered measurement: PENDING (Codex-owned; static tokens/media + 44px + textContent verified only).
- No egress (hostile literal, no script/URL/import): PASS in jsdom; browser no-egress: PENDING (Codex-owned).
- No new deps/assets/math/persistence/export/wiring/physical claims: PASS (grep + previews read-only).
- Full gates/export identity/browser screenshots: PENDING (Codex-owned per packet).

## Key independent probes (30/30)
- G: warn+valid co-visible; null/unknown/empty distinct; done→output current with exported=false incomplete; current+complete+blocked on measure; blocker different step; hostile 2000-char + Unicode zero `<script>`, `__qa_pwned` undefined; duplicate update throws prior DOM intact; `detail:""` keeps empty disclosure, missing detail removes it; payload fresh object (mutate→next emit unaffected); field absent-key→add→remove; reorder n1/n2 same nodes + open + focus after sync callback update; stale detached click inert; double dispose + post-dispose update safe; dup ids independent.
- M: 5 presets literal; name-collision custom; 125 usable; invalid literal + `not clamped`; null fabric/ease explicit; shine 0/100 + smooth/woven/rib/heather cues; `cornflowerblue`/`url(javascript:…)`/`#fff`/evil/empty → swatch hidden, style cleared, `Preview unavailable` + raw literal, cue withheld; plaid/101/NaN/Infinity → cue hidden + raw + `not clamped`; null → `Appearance not supplied`; `{}` → invalid literal no crash; `undefined` fabric/appearance → throws fail-closed, never silent DEFAULT_APPEARANCE (observed, not defect); mismatch retained + buttons enabled; hostile all-fields inert; 2 buttons exact once, no mount/update emit; sync update same nodes + focus; 5 updates single listener; hygiene: no suggestedEase/fabricEaseNote, no `.innerHTML` code, every CSS selector requires own root.
- Rerun: contributor suites 186/186 pass (89+97). `npx tsc --noEmit` clean. No install/full gate/source edit/config/board/commit/push.

## Limitations (honest)
- jsdom only. No browser opened, no screenshots/contrast/target/reflow/forced-colors/reduced-motion pixel proof, no live no-egress capture. All rendered claims remain Codex-owned. JSDOM not substituted for browser.
- No coverage gate, no build, no export identity, no operational/board tests run.
- Contrast cited from frozen UIQ-02 hex reuse, not re-measured.

## Follow-ups for Codex
- Rendered browser proof + full settled gates + export identity + protected-hash comparison.
- Optional hardening: explicit unavailable (not throw) for `undefined` fabric/appearance; all other malformed already fail-closed literal.
- No source correction made by QA.

## WORK FINISHED
```json
{
  "status": "complete",
  "summary": "Independent read-only audit of frozen UIQ03/UIQ04 done: 30 new adversarial probes pass, 186 contributor tests re-pass, tsc clean, hashes intact, no browser proof claimed.",
  "branch": "opencode/uiq34-clarity-qa",
  "changed_files": [
    "ops/ui-candidates/qa/qa-guidance.test.ts",
    "ops/ui-candidates/qa/qa-material.test.ts",
    "docs/research/uiq34-qa/RETURN.md",
    "docs/research/uiq34-qa/evidence/qa-adversarial.log",
    "docs/research/uiq34-qa/evidence/focused-rerun.log",
    "docs/research/uiq34-qa/evidence/typecheck.log",
    "docs/research/uiq34-qa/evidence/input-hashes.log"
  ],
  "tests_run": [
    "npx vitest run ops/ui-candidates/qa/qa-guidance.test.ts ops/ui-candidates/qa/qa-material.test.ts --reporter=basic",
    "npx vitest run src/ui/enhancements/guidance/guidance-panel.test.ts src/ui/enhancements/material/material-panel.test.ts --reporter=basic",
    "npx tsc --noEmit"
  ],
  "coverage": "Not measured by QA; contributor claims 100% four-metric each (89+97). QA asserts pass counts only: 30/30 new, 186/186 rerun.",
  "build_and_typecheck": "npx tsc --noEmit clean, exit 0. No npm run build (out of scope).",
  "rendered_or_export_evidence": [
    "None by QA (jsdom DOM assertions only). No browser/screenshot/contrast/reflow/no-egress captured; Codex-owned."
  ],
  "known_limitations": [
    "jsdom only; rendered/contrast/target/reflow/forced-colors/reduced-motion/no-egress browser proof pending Codex",
    "No full/global coverage gate, build, export identity, or operational tests run",
    "undefined fabric/appearance throws fail-closed (not silent default); explicit-unavailable hardening left to Codex"
  ],
  "follow_up_needed": [
    "Codex: browser screenshots/DOM/action/contrast/target/reflow/media/no-egress + settled full gates + export identity + protected-hash diff",
    "Codex: decide on explicit-unavailable vs throw for undefined fabric/appearance"
  ]
}
```
