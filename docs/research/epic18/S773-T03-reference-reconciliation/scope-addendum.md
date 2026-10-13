# S773 scope clarification — T01 raw roles and T03 stable IDs

**Recorded:** 2026-10-13. **Applies to:** Slice 773 only.

Review of the admitted start packet found one sentence broader than the
existing T03 record contract: it said to accept an exact `Block.roles` key or
its lowercase ID for both T01 and T03 references. The S771/S772 T03 parser
accepts only lowercase stable IDs. S773 preserves that established contract;
it does not broaden the parser or migrate existing T03 records.

The implemented rule is:

- T01 `componentRef` values may match the exact pattern role key or its
  deterministic lowercase stable component ID.
- T03 operation component and seam references use the lowercase stable IDs
  shown in the inventory. For a role already spelled as a valid lowercase ID,
  that string is also its exact role key. Camel-cased role names are retained
  and shown for identity but are not valid T03 reference strings.
- A reference match only identifies an in-app role or stitch declaration. It
  does not promote provenance, establish construction evidence, or prove
  sewability, physical fit, or production validity.

This is a documentation clarification within the admitted boundary. It avoids
weakening the S771 schema and keeps the existing revision and export
contracts unchanged. Focused tests cover exact camel-cased T01 role matching,
strict rejection of camel-cased T03 references, and conflict priority when a
T01 value is empty.
