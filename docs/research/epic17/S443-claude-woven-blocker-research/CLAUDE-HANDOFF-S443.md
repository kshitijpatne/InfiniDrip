You are the read-only research contributor for Slice 443. Use the exact model `claude-opus-5-5` with xhigh reasoning, normal mode and read-only permissions. Work in the separate checkout at exact S442 commit `eed90823a7b2d909a449e87cf651e3d4452f5246`. Do not modify files, source, tests, board, decisions, or state. Do not render or run trial mappings. Return one JSON object and the exact standalone line `WORK FINISHED`.

Question: Can the current Woven FRONT_FLAT neckline/collar contact or BACK_FLAT sleeve-hem crossing be resolved by an actually source-encoded fact or a specific pattern/construction reference while preserving the user's decisions below? If yes, state a concrete, falsifiable mapping and the source evidence. If no, identify the exact missing fact and the smallest future product decision/scope change needed. This is not a request to invent a convention or relax the all-seven criterion.

Read first: `AGENTS.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md`, `ARCHITECTURE.md`, `docs/planning/EPIC-17-ADMISSION.md`, `docs/OPENCODE-WORKFLOW.md`, and the S431 handoff and result. Then read S373/S381, S406, S417, S437, S440, S441 and S442 packet/evidence. Inspect the exact current Woven recipe source, stitch relations, projection metadata and retained all-option output/results; do not repeat broad scans or the S431 Polo work.

Controlling maintainer choices:

- Keep the Woven body neckline continuous and visible as one base seam; S425/S437 retain the 28 front holds. The proposed clip removing 0.8426–0.8433 cm per side is rejected.
- Keep both complete source sleeve hems and their authored sleeve-band joins. Do not imply a hem break or invent an unencoded sleeve-to-sleeve order.
- Keep the approved S370 detached-band details at their existing side-gutter positions and retain all 28 Woven back holds. Do not use S441's local-Y mapping because it requires relocating those details and expanding the frame materially.
- Do not change all-seven V02 acceptance, source/cut geometry, stitches, POMs, production mappings, export identities or V03 gating. Keep all 56 Woven and 34 Polo faces held.

Research method: use exact source topology first. Search externally only if a specific primary source could establish one of these precise view facts. The general construction references cited in the conversation and S431 were already checked; do not repeat them. Do not call a convention “source-backed.” For every reference provide a direct URL, title/author/date and page/section, proposition it proves, and limits. If no pattern-specific evidence is available, say so.

Return JSON only, then `WORK FINISHED`, with this schema:

```json
{
  "status": "complete|blocked|needs_follow_up",
  "summary": "...",
  "model": "claude-opus-5-5",
  "commit": "eed90823a7b2d909a449e87cf651e3d4452f5246",
  "changed_files": [],
  "blockers": [
    {
      "area": "Woven front|Woven back",
      "source_encoded_facts": [],
      "pattern_specific_references": [],
      "existing_output_evidence": [],
      "verified_fix": null,
      "candidate_or_missing_fact": "...",
      "assumptions_and_effect": [],
      "faces_that_remain_held": "..."
    }
  ],
  "scope_recommendation": "preserve current all-seven scope|name one exact change",
  "follow_up_needed": []
}
```

If the model or read-only setup is unavailable, stop and report that exact limitation; do not substitute another model or ask for implementation authority.
