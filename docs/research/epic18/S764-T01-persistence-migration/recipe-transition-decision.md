# S764 clarification — recipe identity changes in existing styles

During focused S764 tests, the existing normal-style workflow's ability to
change recipes was confirmed. A T01 record also carries a recipe identity, so
leaving the pack tagged to the old recipe would fail strict persistence and
retargeting populated fields would risk applying facts to another recipe.

For this slice:

- A design save that keeps the recipe preserves the T01 record unchanged.
- A normal-style recipe change replaces the exact empty legacy placeholder
  (the factory-created all-unresolved cover, empty child lists, and DRAFT
  approval) with a new empty unresolved T01 record for the same style and new
  recipe. Its timestamps use the style change time.
- If any cover value/provenance, material, BOM row, colorway, non-default
  recipe-version marker, or review/approval state differs from that empty
  placeholder, reject the recipe change before saving. Keep the original pack,
  design, revision history and project intact. The user can create another
  style for the new recipe; moving populated pack facts across recipes requires
  a separately admitted mapping contract.
- The existing custom one-size rule remains: a custom style cannot change its
  recipe.

This is a persistence-integrity clarification within S764, not a new UI or
recipe-migration feature. It does not add revision hashing, source facts,
supplier data, or claims. Focused tests must prove empty-placeholder reset,
same-recipe preservation, populated-pack fail-closed behavior, and no partial
write on rejection.
