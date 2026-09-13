# Numeric edit controls — Slice 104

_Research and product decision recorded 2026-09-12._

## Scope

Replace the browser's small, hard-to-discover number spinners with a shared
control that supports direct entry, click/hold increment and decrement, and a
quiet but always-visible indication of the declared lower and upper limits.
The control must work for every garment, recipe-owned numeric option, the
fabric-width nesting setting, and the exploratory Edit coordinates.

## Reviewed sources

The following sources were used for interaction and accessibility patterns:

- [WAI-ARIA Authoring Practices — Spinbutton Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/): a numeric control should support direct text editing as well as increment/decrement, expose the current value and declared minimum/maximum to assistive technology, and surface invalid values rather than hiding them.
- [Carbon Design System — Number input usage](https://carbondesignsystem.com/components/number-input/usage/): a two-sided add/subtract control is appropriate for small changes; wide-range numeric exploration can use a separate range treatment, and the input anatomy should keep the value visually central.
- [Adobe Spectrum — Number Field](https://opensource.adobe.com/spectrum-design-data/components/number-field/): increment/decrement actions are optional but should stop at declared bounds while direct entry remains available.
- [Adobe React Spectrum — NumberField](https://react-spectrum.adobe.com/v3/NumberField.html): min, max, step, and disabled boundary actions are established semantics for a number field.
- [CHI-MED number-entry guidance](https://wp1.cs.ucl.ac.uk/chi-med/wp-content/uploads/sites/12/2020/07/CHIMED-number-entry-design-guidance-1.pdf): press-and-hold can provide repeated changes, but the repeat must be bounded and predictable.

These sources establish interaction and accessibility patterns. They do not
establish InfiniDrip's garment measurement bounds, which remain the existing
recipe/data contract in `src/ui/controls.ts` and each recipe's option table.

## Product decision — the Boundary Rail

InfiniDrip uses a compact “Boundary Rail” under every numeric control. It is a
number line, not a new explanatory paragraph:

- The exact declared minimum and maximum are the two visible endpoints.
- A green fill and marker show where the current valid value sits between them.
- An out-of-range typed value is preserved exactly for guidance; its marker is
  held at the relevant end and changes to the warning color, with an accessible
  state describing below-minimum or above-maximum.
- An empty/non-finite entry has no invented position. The endpoints remain
  visible and the marker disappears until a usable value exists.
- A bounded control disables only the action that is already at its boundary.
  An explicit action on an invalid/empty value recovers it to the nearest
  declared boundary; this is intentional user input, not silent clamping.
- Exploratory Edit coordinates have no product min/max contract. They use the
  same +/- and direct-entry behavior, but the rail shows open `−∞`/`+∞`
  endpoints and no false position.

This gives the user the answer to “how far can I take this?” at the point of
editing, without adding per-field instruction copy or requiring trial-and-error
clicks. The same primitive also makes the options and nesting setting feel like
members of one measurement language instead of unrelated controls.

## Estimates and unresolved questions

The 350 ms repeat delay and 80 ms repeat cadence are product usability
estimates, selected to make a short hold distinct from a click while keeping a
long hold controllable. They are not garment or physical-fit standards.

The rails communicate digital declared ranges only. They are not evidence that
any body measurement fits a person, that a drafted garment has been sewn, or
that a style is production-ready. Physical validation remains deferred.

## Verification boundary

The implementation is UI-only. It must preserve raw invalid-input behavior,
all recipe drafting and export contracts, all existing legacy export bytes, and
the project's 100% coverage/typecheck/build gate. Rendered browser checks must
exercise the rails and +/- actions across existing garments, the trouser, recipe
options, nesting width, Edit coordinates, responsive widths, and manual invalid
entries.
