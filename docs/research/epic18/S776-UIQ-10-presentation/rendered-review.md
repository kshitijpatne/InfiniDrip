# S776 rendered and output review

**Review status:** Complete. **Date:** 2026-10-13. **Branch:**
`codex/epic-18-g05`. This file records actual S775 sample-file inspection and
the final mounted S776 presentation review.

## S775 PDF and ZIP files

The retained S775 synthetic fixtures were opened, parsed, rendered, and checked
as real files. These are separate from the live browser snapshot below.

| Fixture | PDF bytes / SHA-256 | ZIP bytes / SHA-256 |
| --- | --- | --- |
| Tee | 11,519 / `61a3e40dc9266bd9026a9f2f5da62ebc49e10f7353a824925dca86dea3a2795c` | 3,706 / `a0827b7cf0080e44e94f22ef2ad6cdcbbfd43a06170f5e5d1c1d03ecc967f904` |
| Woven Shirt | 11,599 / `5cc577f0801dc12563f0ab877c573e9890c48b9dd7446ab59e35f1267f350b9d` | 3,731 / `564dbc5f1fc84aefb48ec43329c95047b778c9f4f896513f6b3ed9a3d5a3bbba` |

Files: [Tee PDF](../S775-T04-output-package/generated/tee-production-pack.pdf),
[Tee ZIP](../S775-T04-output-package/generated/tee.techpack.zip),
[Woven Shirt PDF](../S775-T04-output-package/generated/woven-shirt-production-pack.pdf),
[Woven Shirt ZIP](../S775-T04-output-package/generated/woven-shirt.techpack.zip).

Both PDFs are seven-page A4 v1.4 files. All pages were rendered with Poppler
and visually inspected. Page breaks are clean, text and disclaimers are
legible, and no clipping or overlap was found. Poppler reported Symbol and
ArialUnicode fallback notices; no missing glyph appeared in the rendered
pages. Each ZIP contains exactly `manifest.json`, `records/tech-pack.json`,
and `documents/production-pack.pdf`; the embedded PDF is byte-identical to the
standalone PDF. The editable record declares schema v1. These synthetic
outputs do not establish construction, physical fit, supplier acceptance, or
production readiness.

## Live mounted presentation

The browser review used a fresh local Chromium session and the app's current
saved local Tee style. It generated the presentation from saved revision
`r1 · 278f3a43-b304-4e31-8f4e-3dbd3a87c2fe`, style ID
`a7ceb9de-701f-4716-892a-3c8c2e5022bc`, recipe `tee` (`unversioned`), and
revision content SHA-256
`c8f3808b5cedd6deca52105eea4492956ce956b2a9586fb51ff6453d2357e7ab`. The
browser's live snapshot is not either retained S775 sample fixture.

The Complete pack preset showed all seven sections. The Measurements + QA
preset showed exactly `identity`, `measurements-qa`, `sources-open-items`, and
`approval-disclaimer`; identity, sources/open items, and review scope remain
included as required. Section toggles and the selected-section list agreed.

The live saved Tee revision has six visible unresolved cover fields:
style code, style name, owner label, intended use, base size ID, and
measurement unit. Each is shown as **UNRESOLVED · UNCONFIRMED · INVALID** with
value `not supplied`, the reason that no sourced T01 value exists, and the
action to review and enter that value in the tech-pack editor. No field was
silently filled or hidden. The Complete pack's artwork section reports the
absence of a local attachment.

No review state is linked to this saved revision. The presentation states:
“No review state is linked to this saved revision. Any review state from
another revision is not shown.” The disclaimer states: “Local digital review
only; no supplier or production acceptance is established.” The preview did
not imply approval for another revision.

## Responsive, keyboard, and focus checks

| Viewport | Document width / scroll width | Table scroller width / table width | Keyboard review |
| --- | ---: | ---: | --- |
| 390×844 | 390 / 390 | 313 / 560 px | Enter on “Show reason and next action” reached scroll position 247; Enter on “Show field and state” returned to 0. |
| 1280×800 | 1280 / 1280 | 289 / 560 px | Enter on “Show reason and next action” reached scroll position 271; Enter on “Show field and state” returned to 0. |

There is no page-level horizontal overflow or browser page error at either
viewport. The table stays inside its pane and offers keyboard buttons plus
horizontal touch/trackpad scrolling. Both scroll positions were captured and
visually checked: field/state remain readable in the first view, and reason/
next action remain readable in the second. Tab from the panel summary focuses
the section-preset selector. Keyboard activation of both table navigation
buttons worked at both viewport sizes.

Screenshots are viewport-sized captures. SHA-256 values identify the retained
files under `evidence/`:

| Viewport | Capture | SHA-256 |
| --- | --- | --- |
| 390×844 | `mobile-measurements-qa-controls.png` | `bcfddde1a07912ac41bc87d87748b8be81590ced74b6763294571b7ae36c9689` |
| 390×844 | `mobile-measurements-qa-table-controls.png` | `7cbab44ffd4619c02604cd3f9deb650400e4a00403fc7e0bb3bccc33fd7545f0` |
| 390×844 | `mobile-measurements-qa-open-items-left.png` | `24af85da974427f36e8ccce7cad6f0a138466c20359f6762da44e8f465d032e5` |
| 390×844 | `mobile-measurements-qa-open-items-right.png` | `04d52daaddd5e4aaed71a136c9337d93dd14a408c44c015a01a82be9813b0f9a` |
| 1280×800 | `desktop-measurements-qa-controls.png` | `5193419e9e643341a3b63f788af73c1b8ca0a62d86d8061afab8fc2052d90afaa` |
| 1280×800 | `desktop-measurements-qa-table-controls.png` | `a20e0618dcabf8e9186eedd1d210c537eaffe1c05dbd2a3807174e2d9231140f1` |
| 1280×800 | `desktop-measurements-qa-open-items-left.png` | `9c051b319e4f5f527299d3a1c0bb7dcfb85848628ca0abe695b0b6007c623802` |
| 1280×800 | `desktop-measurements-qa-open-items-right.png` | `d916605e6a1dd807830dc50e2b0b6d767bab6c626ecf9e13549afae35583cd6f` |

The machine-readable browser measurements, visible identity, selected
sections, table content, approval wording, and screenshot paths are in
[viewport-review.json](evidence/viewport-review.json).
