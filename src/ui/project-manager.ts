import type { LoadedProject, ProjectRepositoryError } from "./project-repository";
import type { RecoveryPayload, SavedDesign, StyleRecord } from "./project-records";
import { ProjectWorkflow } from "./project-workflow";
import type { ArtworkAssetStore } from "../surface/artwork-store";
import type { InspectedArtworkFile } from "../surface/artwork-file";
import {
  createProjectPackage,
  importProjectPackage,
  ProjectPackageError,
  readProjectPackage,
  type ProjectPackageOptions,
  type ProjectPackageProgress,
} from "./project-package";

export interface ProjectManagerOptions {
  readonly host: HTMLElement;
  readonly workflow: ProjectWorkflow;
  readonly getCurrentDesign: () => SavedDesign | null;
  readonly getBlankDesign: () => SavedDesign;
  readonly hasUnsavedChanges: () => boolean;
  readonly onStyleLoaded: (loaded: LoadedProject, recovery: RecoveryPayload | null) => void;
  readonly setBusy: (busy: boolean) => void;
  readonly artworkStore?: ArtworkAssetStore;
  readonly inspectAsset?: (file: File) => Promise<InspectedArtworkFile>;
  readonly savePackage?: (filename: string, blob: Blob) => Promise<boolean>;
  readonly confirm?: (message: string) => boolean;
  readonly packageOptions?: Pick<ProjectPackageOptions, "idFactory" | "now">;
}

type ProjectAction = "create" | "duplicate" | "rename" | "reload" | "switch" | "archive" | "restore"
  | "switch-project" | "export-package" | "import-package";

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

function projectPackageFilename(name: string): string {
  const safe = name.normalize("NFKC").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "project";
  return `${safe}.infinidrip.zip`;
}

function progressLabel(value: ProjectPackageProgress): string {
  const percent = value.totalBytes === 0 ? 100 : Math.min(100, Math.floor((value.completedBytes / value.totalBytes) * 100));
  const phase = value.phase === "prepare" ? "Preparing artwork" : value.phase === "write" ? "Writing backup"
    : value.phase === "validate" ? "Checking package" : value.phase === "stage" ? "Staging artwork" : "Saving project records";
  return `${phase} · ${percent}%`;
}

export function recoveryPayloadOrNull(loaded: LoadedProject): RecoveryPayload | null {
  const recovery = loaded.activeRecovery;
  return recovery ? recovery.payload : null;
}

export class ProjectManager {
  private message = "Saved project is ready on this device.";
  private busy = false;
  private controller: AbortController | null = null;
  private progressState: ProjectPackageProgress | null = null;
  private progressPaintedBytes = 0;
  private projects: readonly LoadedProject[];
  private readonly cancelPortal: HTMLDivElement;

  constructor(private readonly options: ProjectManagerOptions) {
    this.projects = [options.workflow.snapshot];
    let portal = document.querySelector<HTMLDivElement>("#project-operation-cancel");
    if (!portal) {
      portal = document.createElement("div");
      portal.id = "project-operation-cancel";
      portal.className = "project-operation-cancel";
      portal.innerHTML = `<span role="status" aria-live="polite">Project backup in progress.</span><button type="button">Cancel</button>`;
      document.body.append(portal);
    }
    this.cancelPortal = portal;
    this.cancelPortal.querySelector("button")!.onclick = () => this.controller?.abort();
    options.host.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-project-action]") : null;
      const action = target?.dataset.projectAction as ProjectAction | undefined;
      if (!action || this.busy) return;
      event.preventDefault();
      void this.handle(action, target?.dataset.styleId);
    });
    options.host.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.id !== "project-package-file") return;
      const file = target.files?.[0] ?? null;
      target.value = "";
      if (file) void this.importPackage(file);
    });
    this.render();
    const repository = options.workflow.repository as ProjectWorkflow["repository"] | undefined;
    if (repository && typeof repository.listProjects === "function") {
      void repository.listProjects().then((projects) => { this.projects = projects; this.render(); }).catch(() => undefined);
    }
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
      `${this.progressState ? `<progress id="project-package-progress" max="${Math.max(1, this.progressState.totalBytes)}" value="${Math.min(this.progressState.completedBytes, this.progressState.totalBytes)}" aria-label="Project package progress"></progress><p class="project-package-progress-label">${escapeHtml(progressLabel(this.progressState))}</p>` : ""}` +
      `<section class="project-backup-controls" aria-label="Project backup and switching">` +
      `<label for="project-select">Local project</label><select id="project-select"${this.busy ? " disabled" : ""}>` +
      this.projects.map((project) => `<option value="${escapeHtml(project.project.id)}"${project.project.id === loaded.project.id ? " selected" : ""}>${escapeHtml(project.project.name)}</option>`).join("") +
      `</select><button type="button" data-project-action="switch-project"${this.busy ? " disabled" : ""}>Open selected project</button>` +
      `<div class="project-manager-actions"><button type="button" data-project-action="export-package"${this.busy || !this.options.artworkStore ? " disabled" : ""}>Export project backup</button>` +
      `<button type="button" data-project-action="import-package"${this.busy || !this.options.artworkStore ? " disabled" : ""}>Import project backup</button></div>` +
      `<input id="project-package-file" type="file" accept=".zip,application/zip" hidden aria-label="Choose an InfiniDrip project backup"/>` +
      `</section>` +
      `<label for="project-style-name">Style name</label>` +
      `<input id="project-style-name" type="text" maxlength="80" autocomplete="off" placeholder="Name a new style or rename this one">` +
      `<div class="project-manager-actions">` +
      `<button type="button" data-project-action="create"${this.busy ? " disabled" : ""}>Create blank style</button>` +
      `<button type="button" data-project-action="duplicate"${this.busy ? " disabled" : ""}>Duplicate current design</button>` +
      `<button type="button" data-project-action="rename"${this.busy ? " disabled" : ""}>Rename current style</button>` +
      `<button type="button" data-project-action="reload"${this.busy ? " disabled" : ""}>Reload project</button>` +
      `</div>` + this.renderStyles(loaded.styles, loaded.activeStyle.id) + `</div></details>`;
    this.cancelPortal.hidden = !(this.busy && this.controller);
    if (this.busy && this.controller) {
      this.cancelPortal.querySelector("span")!.textContent = this.message;
    }
  }

  private async run(operation: () => Promise<void>, message = "Saving the style change…"): Promise<void> {
    this.busy = true;
    this.message = message;
    this.options.setBusy(true);
    this.render();
    try {
      await operation();
    } catch (error) {
      this.message = errorMessage(error);
    } finally {
      this.busy = false;
      this.controller = null;
      this.progressState = null;
      this.options.setBusy(false);
      this.render();
    }
  }

  private nameInput(): HTMLInputElement {
    return this.options.host.querySelector<HTMLInputElement>("#project-style-name")!;
  }

  private async handle(action: ProjectAction, styleId?: string): Promise<void> {
    if (action === "export-package") return this.exportPackage();
    if (action === "import-package") {
      this.options.host.querySelector<HTMLInputElement>("#project-package-file")?.click();
      return;
    }
    if (action === "switch-project") {
      const selectedId = this.options.host.querySelector<HTMLSelectElement>("#project-select")?.value;
      if (!selectedId) {
        this.message = "Choose a local project first.";
        this.render();
        return;
      }
      if (selectedId === this.options.workflow.snapshot.project.id) {
        this.message = "That project is already open.";
        this.render();
        return;
      }
      if (this.options.hasUnsavedChanges() && !this.confirm(
        "This design has unsaved edits. Switch projects and keep the current project's last saved version?")) return;
      return this.run(async () => {
        const loaded = await this.options.workflow.switchProject(selectedId);
        this.options.onStyleLoaded(loaded, recoveryPayloadOrNull(loaded));
        this.projects = await this.options.workflow.repository.listProjects();
        this.message = `Opened ${loaded.project.name}.`;
      }, "Opening project…");
    }
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

  private packageOptions(signal: AbortSignal) {
    return {
      signal,
      inspectAsset: this.options.inspectAsset,
      ...this.options.packageOptions,
      onProgress: (value: ProjectPackageProgress): void => {
        if (value.phase === "commit") this.controller = null;
        const shouldPaint = value.completedBytes >= this.progressPaintedBytes + 1024 * 1024
          || value.completedBytes >= value.totalBytes || value.phase !== this.progressState?.phase;
        this.progressState = value;
        if (shouldPaint) {
          this.progressPaintedBytes = value.completedBytes;
          this.message = progressLabel(value);
          this.render();
        }
      },
    };
  }

  private async exportPackage(): Promise<void> {
    const artworkStore = this.options.artworkStore;
    if (!artworkStore) {
      this.message = "Project backup is unavailable because local artwork storage is not connected.";
      this.render();
      return;
    }
    return this.run(async () => {
      const controller = new AbortController();
      this.controller = controller;
      this.progressPaintedBytes = 0;
      this.render();
      const snapshot = await this.options.workflow.repository.readProjectBundle(this.options.workflow.snapshot.project.id);
      if (!snapshot) throw new ProjectPackageError("storage", "The active project disappeared before its backup could be created.");
      const blob = await createProjectPackage(snapshot, artworkStore, this.packageOptions(controller.signal));
      const saved = this.options.savePackage
        ? await this.options.savePackage(projectPackageFilename(snapshot.project.name), blob)
        : await this.downloadPackage(projectPackageFilename(snapshot.project.name), blob);
      this.message = saved ? "Project backup exported." : "Backup export canceled; the project was unchanged.";
    }, "Preparing project backup…");
  }

  private async importPackage(file: File): Promise<void> {
    const artworkStore = this.options.artworkStore;
    if (!artworkStore) {
      this.message = "Project backup is unavailable because local artwork storage is not connected.";
      this.render();
      return;
    }
    return this.run(async () => {
      const controller = new AbortController();
      this.controller = controller;
      this.progressPaintedBytes = 0;
      this.render();
      if (file.size > 256 * 1024 * 1024) throw new ProjectPackageError("limit-exceeded", "Project backup must be no larger than 256 MiB.");
      const archive = await readProjectPackage(file, this.packageOptions(controller.signal));
      const options = this.packageOptions(controller.signal);
      const initialResult = await importProjectPackage(
        this.options.workflow.repository, artworkStore, archive, false, options,
      );
      let result: Exclude<typeof initialResult, { readonly status: "copy-required" }>;
      if (initialResult.status === "copy-required") {
        const confirmCopy = (message: string): boolean => this.confirm(message);
        if (!confirmCopy(initialResult.reason + "\n\nImport this backup as a separate copy?")) {
          this.message = "Project backup import canceled; local data was unchanged.";
          return;
        }
        result = await importProjectPackage(
          this.options.workflow.repository, artworkStore, archive, true, options,
        );
      } else {
        result = initialResult;
      }
      if (result.status === "already-imported") {
        this.message = `This project backup was already imported on ${new Date(result.receipt.importedAt).toLocaleString()}.`;
        this.projects = await this.options.workflow.repository.listProjects();
        return;
      }
      const loaded = await this.options.workflow.reload();
      this.options.onStyleLoaded(loaded, recoveryPayloadOrNull(loaded));
      this.projects = await this.options.workflow.repository.listProjects();
      this.message = result.importedAsCopy
        ? `Imported a separate copy: ${loaded.project.name}.`
        : `Imported project: ${loaded.project.name}.`;
    }, "Checking project backup…");
  }

  private async downloadPackage(filename: string, blob: Blob): Promise<boolean> {
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      return true;
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }

  private confirm(message: string): boolean {
    return this.options.confirm ? this.options.confirm(message) : window.confirm(message);
  }
}
