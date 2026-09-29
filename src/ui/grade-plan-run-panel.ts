import type { GradePlanRunEvaluation, GradePlanRunSize } from "./grade-plan-run";
import { getFieldDefinitions } from "./field-provenance";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function raw(value: number | null): string {
  return value === null ? "—" : String(value);
}

/**
 * Every generated drafting input for one declared size, labelled from the
 * shared recipe/field definitions for the evaluation's recipeId. Measurement
 * rows carry their centimetre unit; design-option rows carry their declared
 * unit. Values fall back to their raw key only when the recipe has no shared
 * definition (an unknown recipe id), so nothing is buried or mislabelled.
 */
function sizeInputsMarkup(recipeId: string, size: GradePlanRunSize): string {
  if (size.measurements === null || size.options === null) {
    return "<p>Generated inputs are unavailable until the listed input blockers resolve.</p>";
  }
  const definitions = getFieldDefinitions(recipeId);
  const measurements = size.measurements as unknown as Readonly<Record<string, number>>;
  const options = size.options as unknown as Readonly<Record<string, number>>;
  const knownMeasurements = new Set(
    definitions.filter((definition) => definition.inputKind === "measurement").map((definition) => definition.inputKey),
  );
  const knownOptions = new Set(
    definitions.filter((definition) => definition.inputKind === "option").map((definition) => definition.inputKey),
  );
  const rows = [
    ...definitions
      .filter((definition) => definition.inputKind === "measurement")
      .map((definition) => {
        const value = measurements[definition.inputKey];
        const shown = typeof value === "number" ? `${String(value)} ${definition.unit}` : raw(null);
        return `<tr><th scope="row">${escapeHtml(definition.label)}</th><td>Measurement</td><td>${escapeHtml(shown)}</td></tr>`;
      }),
    ...Object.entries(measurements)
      .filter(([key]) => !knownMeasurements.has(key))
      .map(([key, value]) =>
        `<tr><th scope="row">${escapeHtml(key)}</th><td>Measurement</td><td>${escapeHtml(String(value))}</td></tr>`),
    ...definitions
      .filter((definition) => definition.inputKind === "option")
      .map((definition) => {
        const value = options[definition.inputKey];
        const shown = typeof value === "number" ? `${String(value)} ${definition.unit}` : raw(null);
        return `<tr><th scope="row">${escapeHtml(definition.label)}</th><td>Design option</td><td>${escapeHtml(shown)}</td></tr>`;
      }),
    ...Object.entries(options)
      .filter(([key]) => !knownOptions.has(key))
      .map(([key, value]) =>
        `<tr><th scope="row">${escapeHtml(key)}</th><td>Design option</td><td>${escapeHtml(String(value))}</td></tr>`),
  ];
  if (rows.length === 0) {
    return "<p>No generated inputs recorded for this size.</p>";
  }
  return `<div class="grade-plan-inputs-table-wrap"><table><caption>${escapeHtml(size.label)} · generated drafting inputs</caption>` +
    `<thead><tr><th scope="col">Input</th><th scope="col">Kind</th><th scope="col">Value</th></tr></thead>` +
    `<tbody>${rows.join("")}</tbody></table></div>`;
}

/** Read-only Check panel for output readiness and the exact unrounded POM comparison. */
export function gradePlanRunMarkup(
  evaluation: GradePlanRunEvaluation,
  outputBaseSaved = true,
  gradePlanExists = true,
): string {
  const headline = !gradePlanExists
    ? "Create and approve a grade plan to review graded-size and whole-run readiness."
    : !outputBaseSaved
    ? "Save the style, then refresh, review, and approve its grade plan before exporting graded sizes or whole-run files."
    : evaluation.wholeRunReady
    ? "Every declared size passes geometry and exact POM reconciliation."
    : "Graded outputs stay blocked until the listed size checks pass.";
  const blockers = evaluation.sizes.length === 0
    ? evaluation.issues
    : [];
  const blockerMarkup = blockers.length
    ? `<ul class="grade-plan-run-blockers">${blockers.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>`
    : "";
  const sizeMarkup = evaluation.sizes.map((size) => {
    const ready = outputBaseSaved && size.ready;
    const issues = size.issues.length
      ? `<ul>${size.issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>`
      : `<p>No drafting or POM blockers for this size.</p>`;
    const rows = size.poms.map((pom) => `<tr><th scope="row">${escapeHtml(pom.label)}</th>` +
      (pom.exceptionReason
        ? `<td>Not applicable</td><td>—</td><td>—</td><td>${escapeHtml(pom.exceptionReason)}</td>`
        : `<td>${escapeHtml(raw(pom.expected))} ${escapeHtml(pom.unit)}</td>` +
          `<td>${escapeHtml(raw(pom.actual))} ${escapeHtml(pom.unit)}</td>` +
          `<td>${escapeHtml(raw(pom.difference))} ${escapeHtml(pom.unit)}</td>` +
          `<td>${pom.matches ? "Exact match" : "Blocked"}</td>`)
      + `</tr>`).join("");
    const table = rows
      ? `<div class="grade-plan-pom-table-wrap"><table><caption>${escapeHtml(size.label)} · raw centimetre POM reconciliation</caption>` +
        `<thead><tr><th scope="col">Point of measure</th><th scope="col">Target</th><th scope="col">Generated</th><th scope="col">Difference</th><th scope="col">Result / exception</th></tr></thead>` +
        `<tbody>${rows}</tbody></table></div>`
      : "<p>No applicable POM rows.</p>";
    const status = ready ? "ready" : !outputBaseSaved ? "blocked — save the current style first" : "blocked";
    return `<details class="grade-plan-run-size"${ready ? "" : " open"}><summary>${escapeHtml(size.label)} — ${status}</summary>${issues}${sizeInputsMarkup(evaluation.recipeId, size)}${table}</details>`;
  }).join("");
  return `<section class="grade-plan-run-review" aria-label="Approved grade-plan output checks">` +
    `<h3>Declared size run</h3><p>${headline}</p>` +
    `${gradePlanExists && !outputBaseSaved ? '<p role="status">The saved style does not include all current output-affecting changes.</p>' : ""}` +
    `${blockerMarkup}${sizeMarkup}</section>`;
}
