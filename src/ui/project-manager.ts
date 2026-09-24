import type { LoadedProject, ProjectRepositoryError } from "./project-repository";
import type { RecoveryPayload, SavedDesign, StyleRecord } from "./project-records";
import { ProjectWorkflow } from "./project-workflow";

export interface ProjectManagerOptions {
  readonly host: HTMLElement;
  readonly workflow: ProjectWorkflow;
  readonly getCurrentDesign: () => SavedDesign | null;
  readonly getBlankDesign: () => SavedDesign;
  readonly hasUnsavedChanges: () => boolean;
  readonly onStyleLoaded: (loaded: LoadedProject, recovery: RecoveryPayload | null) => void;
  readonly setBusy: (busy: boolean) => void;
}

type ProjectAction = "create" | "duplicate" | "rename" | "reload" | "switch" | "archive" | "restore";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  })[character]!);
}

function errorMessage(error: unknown): string {
  const repositoryError = error as Partial<ProjectRepositoryError> | null;
  if (repositoryError?.code === "conflict") return "This project changed in another tab. Reload it before continuing.";
  if (error instanceof Error && error.message) return error.message;
  return "The style change failed. The saved project was left unchanged.";
}

function styleLabel(style: StyleRecord): string {
  return `${style.name} · ${style.recipeId} · ${style.recipePresetId}`;
}

export class ProjectManager {
  private message = "Saved project is ready on this device.";
  private busy = false;

  constructor(private readonly options: ProjectManagerOptions) {
    options.host.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-project-action]") : null;
      const action = target?.dataset.projectAction as ProjectAction | undefined;
      if (!action || this.busy) return;
      event.preventDefault();
      void this.handle(action, target?.dataset.styleId);
    });
    this.render();
  }

  refresh(message?: string): void {
    if (message !== undefined) this.message = message;
    this.render();
  }

  private renderStyles(styles: readonly StyleRecord[], activeId: string): string {
    const available = styles.filter((style) => style.archivedAt === null);
    const archived = styles.filter((style) => style.archivedAt !== null);
    return `<section class="project-style-list" aria-labelledby="available-styles-title">` +
      `<h3 id="available-styles-title">Available styles</h3><ul>` + available.map((style) =>
        `<li><button type="button" data-project-action="switch" data-style-id="${escapeHtml(style.id)}"` +
        ` aria-current="${style.id === activeId ? "true" : "false"}"${style.id === activeId || this.busy ? " disabled" : ""}>` +
        `${escapeHtml(styleLabel(style))}${style.id === activeId ? " · Current" : ""}</button>` +
        `<button type="button" data-project-action="archive" data-style-id="${escapeHtml(style.id)}"` +
        `${style.id === activeId || this.busy ? " disabled" : ""} aria-label="Archive ${escapeHtml(style.name)}">Archive</button></li>`
      ).join("") + `</ul></section>` +
      `<section class="project-style-list" aria-labelledby="archived-styles-title">` +
      `<h3 id="archived-styles-title">Archived styles</h3>` +
      (archived.length ? `<ul>${archived.map((style) =>
        `<li><span>${escapeHtml(styleLabel(style))}</span>` +
        `<button type="button" data-project-action="restore" data-style-id="${escapeHtml(style.id)}"` +
        `${this.busy ? " disabled" : ""} aria-label="Restore ${escapeHtml(style.name)}">Restore</button></li>`
      ).join("")}</ul>` : `<p>No archived styles.</p>`) + `</section>`;
  }

  private render(): void {
    const loaded = this.options.workflow.snapshot;
    const open = this.options.host.querySelector<HTMLDetailsElement>(".project-manager-details")?.open ?? false;
    this.options.host.innerHTML = `<details class="project-manager-details"${open ? " open" : ""}>` +
      `<summary>Project & styles · ${escapeHtml(loaded.activeStyle.name)}</summary>` +
      `<div class="project-manager" aria-busy="${this.busy}">` +
      `<p class="project-current"><strong>${escapeHtml(loaded.project.name)}</strong>` +
      `<span>Current style: ${escapeHtml(loaded.activeStyle.name)}</span></p>` +
      `<p id="project-manager-status" role="status" aria-live="polite">${escapeHtml(this.message)}</p>` +
      `<label for="project-style-name">Style name</label>` +
      `<input id="project-style-name" type="text" maxlength="80" autocomplete="off" placeholder="Name a new style or rename this one">` +
      `<div class="project-manager-actions">` +
      `<button type="button" data-project-action="create"${this.busy ? " disabled" : ""}>Create blank style</button>` +
      `<button type="button" data-project-action="duplicate"${this.busy ? " disabled" : ""}>Duplicate current design</button>` +
      `<button type="button" data-project-action="rename"${this.busy ? " disabled" : ""}>Rename current style</button>` +
      `<button type="button" data-project-action="reload"${this.busy ? " disabled" : ""}>Reload project</button>` +
      `</div>` + this.renderStyles(loaded.styles, loaded.activeStyle.id) + `</div></details>`;
  }

  private async run(operation: () => Promise<void>): Promise<void> {
    this.busy = true;
    this.message = "Saving the style change…";
    this.options.setBusy(true);
    this.render();
    try {
      await operation();
    } catch (error) {
      this.message = errorMessage(error);
    } finally {
      this.busy = false;
      this.options.setBusy(false);
      this.render();
    }
  }

  private nameInput(): HTMLInputElement {
    return this.options.host.querySelector<HTMLInputElement>("#project-style-name")!;
  }

  private async handle(action: ProjectAction, styleId?: string): Promise<void> {
    if (action === "create") {
      const name = this.nameInput().value;
      return this.run(async () => {
        const loaded = await this.options.workflow.createStyle(name, this.options.getBlankDesign());
        this.options.onStyleLoaded(loaded, loaded.activeRecovery?.payload ?? null);
        this.message = `Created ${loaded.activeStyle.name}.`;
      });
    }
    if (action === "duplicate") {
      const design = this.options.getCurrentDesign();
      if (!design) {
        this.message = "Correct invalid design values before duplicating this style.";
        this.render();
        return;
      }
      const base = `Copy of ${this.options.workflow.snapshot.activeStyle.name}`;
      const name = base.length <= 80 ? base : `${base.slice(0, 74)}…`;
      return this.run(async () => {
        const loaded = await this.options.workflow.createStyle(name, design);
        this.options.onStyleLoaded(loaded, loaded.activeRecovery?.payload ?? null);
        this.message = `Created a copy named ${loaded.activeStyle.name}.`;
      });
    }
    if (action === "rename") {
      const name = this.nameInput().value;
      return this.run(async () => {
        const loaded = await this.options.workflow.renameActiveStyle(name);
        this.message = `Renamed style to ${loaded.activeStyle.name}.`;
      });
    }
    if (action === "reload") {
      const hadUnsaved = this.options.hasUnsavedChanges();
      return this.run(async () => {
        const loaded = await this.options.workflow.reload();
        this.options.onStyleLoaded(loaded, loaded.activeRecovery?.payload ?? null);
        this.message = hadUnsaved
          ? `Reloaded ${loaded.activeStyle.name}. The latest stored project version is now loaded.`
          : `Reloaded ${loaded.activeStyle.name}.`;
      });
    }
    if (action !== "switch" && action !== "archive" && action !== "restore") {
      this.message = "That style action is not supported.";
      this.render();
      return;
    }
    if (!styleId) {
      this.message = "The selected style action is missing its style ID.";
      this.render();
      return;
    }
    if (action === "switch") {
      const hadUnsaved = this.options.hasUnsavedChanges();
      return this.run(async () => {
        const loaded = await this.options.workflow.switchStyle(styleId);
        this.options.onStyleLoaded(loaded, loaded.activeRecovery?.payload ?? null);
        this.message = hadUnsaved
          ? `Switched to ${loaded.activeStyle.name}. The previous style's latest stored version remains available.`
          : `Switched to ${loaded.activeStyle.name}.`;
      });
    }
    if (action === "archive") {
      return this.run(async () => {
        const loaded = await this.options.workflow.archiveStyle(styleId);
        this.message = `Archived ${loaded.styles.find((style) => style.id === styleId)?.name ?? "style"}.`;
      });
    }
    if (action === "restore") {
      return this.run(async () => {
        const loaded = await this.options.workflow.restoreStyle(styleId);
        this.message = `Restored ${loaded.styles.find((style) => style.id === styleId)?.name ?? "style"}.`;
      });
    }
  }
}
