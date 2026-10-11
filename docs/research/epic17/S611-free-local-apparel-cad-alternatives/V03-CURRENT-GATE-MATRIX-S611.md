# G04 / V03 current evidence matrix — Slice 611

S611 screened documented receiver choices after two CLO routes failed the
same five Polo M CUT outlines. No receiver, scope, or acceptance criteria
changed.

| Candidate/gate | Finding | Remaining evidence / consequence |
|---|---|---|
| CLO 2026.1.310 | Authorized and locally handled for this specific trial, but S536 AAMA and S609 ASTM outputs both fail the same five Polo CUT contours at `0.001 cm`. | S612's isolated Standard-vs-AAMA import-mode experiment may localize the loss. No CLO profile is qualified yet. |
| Seamly2D | Upstream GPLv3+ and Windows builds are documented. Current README does not document a DXF apparel receiver path; historical issue #59 requests AAMA-to-ASTM export changes. | Free/local is insufficient; current AAMA/ASTM import and round-trip are unproven. Not selected. |
| OpenPatterns | Prior S480 test fails three input fixtures on a block-table assumption and has no DXF writer. | No viable path on current fixture. |
| Richpeace Super V8 | Prior S485 confirms DXF/PLT import and PLT save, not DXF export; cloud-conversion local handling remains unspecified. | Not a documented local apparel-DXF round-trip candidate. |
| garment.dev | Vendor claims AAMA/ASTM import/export validated against 34 files, but invites are required and pattern library is hosted/account-backed. | Hosted-service work is outside scope; local processing is unverified; no account/upload/permission. Do not use without explicit scope change and data-handling review. |
| Seven recipes/repeated exchange | Still incomplete. | All seven and required repeated generations. |
| CUT/SEW, identity, semantics, marks, grades/options, malformed-input and rendered detail | Still open; S609 only covers one Polo M first-generation output and gross render. | Each required gate must be demonstrated under a rights-reviewed receiver/profile. |
| Legacy DXF/protected byte identities | Preserved. | Preserve at integrated Epic gate. |

## S611 disposition

No free/local candidate identified in this bounded review is ready to qualify
as the receiver. All V03 holds remain. Next run one isolated Standard-DXF
import-mode test in the already authorized CLO session against the exact S609
fixture. The official CLO article documents the selector but does not promise
preserved apparel semantics or exact contour fidelity. Do not upload patterns
to garment.dev or broaden scope to a hosted service.
