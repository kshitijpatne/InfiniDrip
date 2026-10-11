import type { Measurements } from "../drafting";
import type { GarmentRecipe } from "../drafting/recipe";
import type { Block } from "../drafting/block";
import type { ArtworkPlacement } from "../surface/placement";
import { BLUEPRINT } from "../render";
import { validateTechnicalFlatOptions } from "../render/technical-flat-options";
import { compileTechnicalFlatLiveView, type TechnicalFlatLiveIssue } from "../render/technical-flat-live";
import { renderTechnicalFlatSvg, type TechnicalFlatMeasureText, type TechnicalFlatSvgIssue } from "../render/technical-flat-svg";
import type { TechnicalFlatViewKind } from "../render/technical-flat";
import { technicalFlatFaceToggleMarkup } from "./view";

export interface TechnicalFlatPanelInput {
  readonly recipe: GarmentRecipe;
  readonly measurements: Measurements;
  readonly rawOptions: unknown;
  readonly revisionId: string;
  readonly kind: TechnicalFlatViewKind;
  readonly placements: readonly ArtworkPlacement[];
  readonly colorHex: string;
  readonly texture: "smooth" | "woven" | "rib" | "heather";
  readonly shine: number;
  readonly sizeReady: boolean;
  readonly block: Block | null;
  readonly measureText: TechnicalFlatMeasureText;
}

export type TechnicalFlatPanelIssue = TechnicalFlatLiveIssue | TechnicalFlatSvgIssue | { readonly code: string; readonly message: string };

interface GroupedEdgeIssue {
  readonly issue: TechnicalFlatLiveIssue;
  readonly sourcePrefix: string;
  readonly edgeIds: string[];
}

function escapeUiText(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export function technicalFlatIssueList(issues: readonly TechnicalFlatPanelIssue[]): string {
  const rows: Array<TechnicalFlatPanelIssue | GroupedEdgeIssue> = [];
  const grouped = new Map<string, GroupedEdgeIssue>();
  for (const issue of issues) {
    if (!("stage" in issue) || issue.stage !== "geometry") {
      rows.push(issue);
      continue;
    }
    const edge = issue.sourceId.match(/^(pattern:[^:]+:role:[^:]+):edge:(.+)$/);
    if (!edge) {
      rows.push(issue);
      continue;
    }
    const [, sourcePrefix] = edge;
    const normalizedMessage = issue.message.replace(/edge “[^”]+”/, "edge “one of the listed source edges”");
    const key = `${issue.stage}\u0000${sourcePrefix}\u0000${normalizedMessage}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.edgeIds.push(issue.sourceId);
    } else {
      const entry: GroupedEdgeIssue = { issue, sourcePrefix, edgeIds: [issue.sourceId] };
      grouped.set(key, entry);
      rows.push(entry);
    }
  }
  return `<ul data-technical-flat-issues role="status" aria-label="Technical flat guidance" style="margin:8px 0;padding-left:22px;color:${BLUEPRINT.lineActive}">` +
    rows.map((row) => {
      if ("issue" in row && row.edgeIds.length > 1) {
        const message = row.issue.message.replace(/edge “[^”]+”/, "edge “one of the listed source edges”");
        const affected = ` Affected source edges: ${row.edgeIds.join(", ")}.`;
        return `<li><strong>${escapeUiText(row.issue.stage)} · ${escapeUiText(row.sourcePrefix)}:</strong> ${escapeUiText(message + affected)}</li>`;
      }
      const issue = "issue" in row ? row.issue : row;
      const label = "stage" in issue ? issue.stage : issue.code;
      const source = "sourceId" in issue ? issue.sourceId : "entityId" in issue ? issue.entityId : undefined;
      return `<li><strong>${escapeUiText(label)}${source ? ` · ${escapeUiText(source)}` : ""}:</strong> ${escapeUiText(issue.message)}</li>`;
    }).join("") + "</ul>";
}

/** Build the live panel from a single face/block/revision snapshot. */
export function technicalFlatPanelMarkup(input: TechnicalFlatPanelInput): string {
  const faceControls = technicalFlatFaceToggleMarkup(input.kind);
  const checked = validateTechnicalFlatOptions(input.recipe, input.measurements, input.rawOptions, input.revisionId);
  if (checked.issues.length > 0) {
    return faceControls + '<p role="status">Technical flat withheld. Correct the listed supported options or pattern source.</p>' +
      technicalFlatIssueList(checked.issues);
  }
  if (!input.sizeReady) {
    return faceControls + '<p role="status">Technical flat withheld. Review or rebase the current pattern edits before viewing this revision.</p>';
  }
  if (input.block === null) {
    return faceControls + '<p role="status">Technical flat withheld because the selected pattern size is unavailable.</p>';
  }

  const live = compileTechnicalFlatLiveView({ recipe: input.recipe, block: input.block, revisionId: input.revisionId,
    kind: input.kind, placements: input.placements, colorHex: input.colorHex, texture: input.texture, shine: input.shine });
  if (!live.view || live.issues.length > 0) {
    return faceControls + '<p role="status">Technical flat withheld. Resolve the source or assembly issues below; no partial face is shown.</p>' +
      technicalFlatIssueList(live.issues);
  }

  const rendered = renderTechnicalFlatSvg(live.view, { measureText: input.measureText,
    colorway: live.colorway as NonNullable<typeof live.colorway> | undefined,
    title: `${input.recipe.label} · ${input.kind === "FRONT_FLAT" ? "front" : "back"} technical flat` });
  const status = `<p data-technical-flat-revision="${escapeUiText(input.revisionId)}" role="status">` +
    `${escapeUiText(input.recipe.label)} · ${input.kind === "FRONT_FLAT" ? "Front" : "Back"} · live draft revision ${escapeUiText(input.revisionId)} · centimetres. ` +
    "This view updates from the current pattern; it is not a saved style history record.</p>";
  return faceControls + status + (rendered.svg
    ? `<div data-technical-flat-svg data-revision-id="${escapeUiText(input.revisionId)}">${rendered.svg}</div>`
    : '<p role="status">Technical flat withheld because the measured drawing is unreadable or incomplete.</p>' + technicalFlatIssueList(rendered.issues));
}
