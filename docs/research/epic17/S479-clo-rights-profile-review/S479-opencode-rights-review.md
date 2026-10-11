# S479 independent OpenCode review

OpenCode used the required `opencode/muse-spark-1.3-contributor-free` model at
`xhigh` in normal mode, on branch `opencode/slice-479-clo-rights-review` in a
separate worktree. It made no file edits or CLO contact and returned the
explicit `WORK FINISHED` signal. Its review was a research cross-check, not a
legal opinion; Codex checked the cited clauses and claims against the official
pages below.

## Cross-checked findings

- CLO Software Additional Terms §2.2.1 says an Individual license may cover a
  natural person using it personally, or a qualifying one-person/self-employed
  business acting for its own internal business needs. §2.2.2 makes an
  Enterprise license applicable in CLO's discretion under enumerated
  conditions, including a full-time employee beyond the owner, corporate
  account indicators, or failing the Individual license conditions. §§5.1.1–
  5.1.4 define the separate Individual, Enterprise, Academic, and Trial
  classes. A Trial License is limited to evaluation/demonstration and expressly
  excludes competitive analysis and commercial, promotional, marketing,
  advertising, or for-profit purposes.
- General Terms §7(h) leaves Work Product owned by the user, but grants CLO
  limited rights to process it to operate the software and for internal
  Content Analytics, including file/structural characteristics. General Terms
  §6(c)–(d) permits required hosted-content connections and remote
  authentication. The observed local File > Import/Export workflow does not
  prove that every part of software processing is local-only. No S475–S478
  fixture was uploaded to CLO-SET/CONNECT.
- Official CLO help documents the named DXF-AAMA, DXF-ASTM, and Standard DXF
  modes and the associated import/export settings. It does not publish a
  conformance certificate, normative layer table, or numeric-layer meaning.
  CLO's menu label is evidence of a selectable mode only.
- S475–S478 therefore establish bounded technical behavior for observed
  synthetic fixtures: Woven M geometric contour matching passed its stated
  coordinate gate; Polo M did not pass its source contour gate. Neither
  establishes a generally compatible profile. S476's separate results record
  nine Polo and twelve Woven pieces; those counts must not be conflated.

## Conclusion and limitations

The trial is not a rights-cleared V03 receiver/profile candidate on the
available record. The exact license grant/class and the scope under which these
product-development evaluations were conducted are not established by the
version screen, feature availability, or observed account access. The
published Trial Purpose exclusions mean Codex must not infer that the trial
authorizes for-profit product development. This review does not determine that
any prior act violated terms; it leaves that classification unresolved.

Technical observations remain valid, bounded evidence of how CLO 2026.1.310
handled the local files during the observed UI sessions. The DXF-ASTM/AAMA
standard claim, numeric-layer semantics, Polo round-trip defects, broad
receiver interoperability, and production/factory acceptance remain unproven.
Do not conduct further CLO pattern trials for V03 until the applicable use
rights are evidenced or an alternative rights-compatible receiver is found.

## Sources

- [CLO General Terms of Use](https://legal.clo-set.com/modal-tou-general) §§2(a), 6(c)–(d), 7(h), current page last updated 2026-03-30.
- [CLO Software Additional Terms](https://legal.clo-set.com/additional-clo) §§2.1, 2.2.1–2.2.2, 3.1, 5.1.1–5.1.4, current page last updated 2024-09-02.
- [CLO free-trial eligibility help](https://support.clo3d.com/hc/en-us/articles/115012788967-How-do-I-start-a-CLO-free-trial-version).
- [CLO license type help](https://support.clo3d.com/hc/en-us/articles/115012951968-What-kind-of-licenses-do-you-offer) and [Individual vs Enterprise help](https://support.clo3d.com/hc/en-us/articles/115013509228-What-is-the-difference-between-CLO-for-Individual-and-CLO-for-Enterprise).
- [CLO 2D Pattern DXF Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export), updated 2026-09-28.
- [ASTM D6673-04 public record](https://store.astm.org/d6673-04.html) and [D6673-10 public record](https://store.astm.org/d6673-10.html). Only public catalog scope/status was reviewed; detailed standard provisions require licensed access.
- S476 official-source review: `docs/research/epic17/S476-clo-representative-roundtrips/S476-opencode-research-result.md`.
