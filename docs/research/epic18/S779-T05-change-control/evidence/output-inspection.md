# S779 rendered and output evidence

## Local browser sequence

`browser-change-control.mjs` passed against the final S779 source in a fresh
Chromium context on the local Vite app. It created a local style, selected a
six-field cover review, recorded self-attested review and approval labels,
froze the complete local share, downloaded both files, edited and saved the
Tech Pack, then downloaded the prior share again. The original manifest
`f0f7d708-09cc-4b88-8a5e-96237411f744` remains bound to revision
`fc755cbb-4850-44c3-9981-cc26e26a2646`; the saved edit creates current revision
`2e5c32d7-64f0-4ff9-b266-3c92c8b07bca` and returns its approval to Draft.

| Historical artifact | Bytes before edit | SHA-256 before and after edit |
| --- | ---: | --- |
| ZIP | 3,739 | `9a1274bcf9a581ef0e63e69d1416f16a0ded4372cde535783f5eac7db46a9072` |
| PDF | 12,082 | `ae0dd34ca90436700327369653e927e64f298dde821383487e97a0acbd9e430a` |

The ZIP contains `manifest.json`, `records/tech-pack.json`, and
`documents/production-pack.pdf`; the embedded PDF equals the separate PDF
byte-for-byte. Chromium keyboard activation with Enter also downloaded the
same historical PDF. The browser report records zero page errors. The freeze
confirmation named the exact saved revision and retained the local-storage,
no-fit, no-supplier, and no-production disclaimers.

## Responsive review

- At 1280×800, document and body widths were 1280px. Screenshots are
  `stale-current-1280x800.png` and `historical-downloads-1280x800.png`.
- At 390×844, document and body widths were 390px. Screenshots are
  `stale-current-390x844.png` and `historical-downloads-390x844.png`.
- At both sizes the historical ZIP and PDF controls remained readable and
  operable. At 390×844 their top edges were y=744 and y=798 respectively.
- The stale/current screen showed the actionable historical-state guidance and
  retained-download path after the edit.

## PDF inspection

Poppler `pdfinfo` reports a valid, unencrypted, seven-page A4 PDF 1.4 at
12,082 bytes. Text extraction retained the saved revision, content digest,
complete-pack preset, unresolved field reasons and next actions. The first
page was rendered to `reviewed-production-pack-page1.png` and visually
inspected; its hierarchy and text are legible. `pdftoppm` exited successfully
with fallback-font notices for `Symbol` and `ArialUnicode`; the page rendered
cleanly.
