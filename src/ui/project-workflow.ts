/** User-led local project/style operations layered over the transactional repository. */
import {
  openProjectRepository,
  ProjectRepositoryError,
  type LoadedProject,
  type ProjectRepository,
  type ProjectRepositoryOptions,
} from "./project-repository";
import {
  RECOVERY_RECORD_VERSION,
  STYLE_RECORD_VERSION,
  type RecoveryPayload,
  type SavedDesign,
  type StyleRecord,
} from "./project-records";
import { LEGACY_RECOVERY_STORAGE_KEY, LEGACY_SAVE_STORAGE_KEY } from "./persist";

export interface ProjectWorkflowOptions {
  readonly repositoryOptions?: ProjectRepositoryOptions;
  readonly storage?: Pick<Storage, "getItem">;
  readonly idFactory?: () => string;
  readonly now?: () => string;
  readonly openRepository?: (options?: ProjectRepositoryOptions) => Promise<ProjectRepository>;
}

function uuid(): string {
  const value = globalThis.crypto?.randomUUID?.();
  if (!value) throw new ProjectRepositoryError("unavailable", "Secure style IDs are unavailable in this application context.");
  return value;
}

function canonicalNow(): string {
  return new Date().toISOString();
}

function monotonicTimestamp(now: string, ...prior: string[]): string {
  const candidate = Date.parse(now);
  if (!Number.isFinite(candidate) || new Date(candidate).toISOString() !== now) {
    throw new ProjectRepositoryError("invalid-data", "Style update time must be canonical UTC ISO time.");
  }
  return new Date(Math.max(candidate, ...prior.map((value) => Date.parse(value)))).toISOString();
}

function cleanedName(value: string): string {
  if (typeof value !== "string") throw new ProjectRepositoryError("invalid-data", "Style name must be text.");
  const name = value.trim();
  if (!name || name.length > 80) throw new ProjectRepositoryError("invalid-data", "Style name must contain 1–80 characters.");
  return name;
}

function ensureUniqueName(name: string, styles: readonly StyleRecord[], exceptId?: string): void {
  const normalized = name.toLocaleLowerCase();
  if (styles.some((style) => style.id !== exceptId && style.name.trim().toLocaleLowerCase() === normalized)) {
    throw new ProjectRepositoryError("conflict", "A style with that name already exists in this project.");
  }
}

export class ProjectWorkflow {
  private tail: Promise<void> = Promise.resolve();

  constructor(
    readonly repository: ProjectRepository,
    private loaded: LoadedProject,
    private readonly idFactory: () => string = uuid,
    private readonly now: () => string = canonicalNow,
  ) {}

  get snapshot(): LoadedProject {
    return this.loaded;
  }

  close(): void {
    this.repository.close();
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.tail.then(operation, operation);
    this.tail = result.then(() => undefined, () => undefined);
    return result;
  }

  private async reloadLoaded(): Promise<LoadedProject> {
    const loaded = await this.repository.loadProject(this.loaded.project.id);
    if (!loaded) throw new ProjectRepositoryError("not-found", "The local project no longer exists.");
    this.loaded = loaded;
    return loaded;
  }

  async reload(): Promise<LoadedProject> {
    return this.enqueue(async () => {
      const loaded = await this.repository.readActiveProject();
      if (!loaded) throw new ProjectRepositoryError("not-found", "There is no active local project.");
      this.loaded = loaded;
      return loaded;
    });
  }

  async saveRecovery(styleId: string, payload: RecoveryPayload): Promise<void> {
    return this.enqueue(async () => {
      const current = this.loaded;
      await this.repository.saveRecovery(
        { schemaVersion: RECOVERY_RECORD_VERSION, styleId, payload },
        current.project.revision,
        monotonicTimestamp(this.now(), current.project.updatedAt),
      );
      await this.reloadLoaded();
    });
  }

  async clearRecovery(styleId: string): Promise<void> {
    return this.enqueue(async () => {
      const current = this.loaded;
      await this.repository.clearRecovery(
        styleId,
        current.project.revision,
        monotonicTimestamp(this.now(), current.project.updatedAt),
      );
      await this.reloadLoaded();
    });
  }

  async saveActiveDesign(design: SavedDesign): Promise<LoadedProject> {
    return this.enqueue(async () => {
      const current = this.loaded;
      const time = monotonicTimestamp(this.now(), current.project.updatedAt, current.activeStyle.updatedAt);
      const style: StyleRecord = {
        ...current.activeStyle,
        recipeId: design.workspace.garment,
        recipePresetId: design.workspace.targetStyle,
        design,
        revision: current.activeStyle.revision + 1,
        updatedAt: time,
      };
      const project = {
        ...current.project,
        revision: current.project.revision + 1,
        updatedAt: time,
      };
      await this.repository.saveProjectBundle({
        project,
        styles: current.styles.map((candidate) => candidate.id === style.id ? style : candidate),
        clearRecoveryStyleIds: [style.id],
        expectedProjectRevision: current.project.revision,
      });
      return this.reloadLoaded();
    });
  }

  async switchStyle(styleId: string): Promise<LoadedProject> {
    return this.enqueue(async () => {
      const target = this.loaded.styles.find((style) => style.id === styleId);
      if (!target) throw new ProjectRepositoryError("not-found", "That style is not in this project.");
      if (target.archivedAt !== null) throw new ProjectRepositoryError("invalid-data", "Restore this archived style before switching to it.");
      if (target.id === this.loaded.activeStyle.id) return this.loaded;
      await this.repository.selectActiveStyle(
        this.loaded.project.id,
        target.id,
        this.loaded.project.revision,
        monotonicTimestamp(this.now(), this.loaded.project.updatedAt),
      );
      return this.reloadLoaded();
    });
  }

  async createStyle(nameInput: string, design: SavedDesign): Promise<LoadedProject> {
    return this.enqueue(async () => {
      const current = this.loaded;
      const name = cleanedName(nameInput);
      ensureUniqueName(name, current.styles);
      const time = monotonicTimestamp(this.now(), current.project.updatedAt);
      const id = this.idFactory();
      const style: StyleRecord = {
        schemaVersion: STYLE_RECORD_VERSION,
        id,
        projectId: current.project.id,
        name,
        recipeId: design.workspace.garment,
        recipePresetId: design.workspace.targetStyle,
        createdAt: time,
        updatedAt: time,
        revision: 1,
        archivedAt: null,
        design,
      };
      const project = {
        ...current.project,
        styleIds: [...current.project.styleIds, id],
        activeStyleId: id,
        revision: current.project.revision + 1,
        updatedAt: time,
      };
      await this.repository.saveProjectBundle({
        project,
        styles: [...current.styles, style],
        expectedProjectRevision: current.project.revision,
      });
      return this.reloadLoaded();
    });
  }

  async renameActiveStyle(nameInput: string): Promise<LoadedProject> {
    return this.enqueue(async () => {
      const current = this.loaded;
      const previous = current.activeStyle;
      const name = cleanedName(nameInput);
      ensureUniqueName(name, current.styles, previous.id);
      const time = monotonicTimestamp(this.now(), current.project.updatedAt, previous.updatedAt);
      const style = { ...previous, name, revision: previous.revision + 1, updatedAt: time };
      const project = { ...current.project, revision: current.project.revision + 1, updatedAt: time };
      await this.repository.saveProjectBundle({
        project,
        styles: current.styles.map((candidate) => candidate.id === style.id ? style : candidate),
        expectedProjectRevision: current.project.revision,
      });
      return this.reloadLoaded();
    });
  }

  async archiveStyle(styleId: string): Promise<LoadedProject> {
    return this.enqueue(async () => {
      const current = this.loaded;
      const target = current.styles.find((style) => style.id === styleId);
      if (!target) throw new ProjectRepositoryError("not-found", "That style is not in this project.");
      if (target.id === current.activeStyle.id) throw new ProjectRepositoryError("invalid-data", "Switch to another style before archiving the active style.");
      if (target.archivedAt !== null) throw new ProjectRepositoryError("invalid-data", "That style is already archived.");
      const time = monotonicTimestamp(this.now(), current.project.updatedAt, target.updatedAt);
      return this.updateStyle(target, { archivedAt: time, revision: target.revision + 1, updatedAt: time });
    });
  }

  async restoreStyle(styleId: string): Promise<LoadedProject> {
    return this.enqueue(async () => {
      const current = this.loaded;
      const target = current.styles.find((style) => style.id === styleId);
      if (!target) throw new ProjectRepositoryError("not-found", "That style is not in this project.");
      if (target.archivedAt === null) throw new ProjectRepositoryError("invalid-data", "That style is already available.");
      const time = monotonicTimestamp(this.now(), current.project.updatedAt, target.updatedAt);
      return this.updateStyle(target, { archivedAt: null, revision: target.revision + 1, updatedAt: time });
    });
  }

  private async updateStyle(target: StyleRecord, update: Pick<StyleRecord, "archivedAt" | "revision" | "updatedAt">): Promise<LoadedProject> {
    const current = this.loaded;
    const style = { ...target, ...update };
    const project = { ...current.project, revision: current.project.revision + 1, updatedAt: update.updatedAt };
    await this.repository.saveProjectBundle({
      project,
      styles: current.styles.map((candidate) => candidate.id === style.id ? style : candidate),
      expectedProjectRevision: current.project.revision,
    });
    return this.reloadLoaded();
  }
}

export async function openProjectWorkflow(options: ProjectWorkflowOptions = {}): Promise<ProjectWorkflow> {
  const repository = await (options.openRepository ?? openProjectRepository)(options.repositoryOptions);
  try {
    let loaded = await repository.readActiveProject();
    if (!loaded) {
      const storage = options.storage ?? globalThis.localStorage;
      if (!storage) throw new ProjectRepositoryError("unavailable", "Local storage is unavailable; legacy data was not changed.");
      const saveJson = storage.getItem(LEGACY_SAVE_STORAGE_KEY);
      const recoveryJson = storage.getItem(LEGACY_RECOVERY_STORAGE_KEY);
      if (saveJson !== null || recoveryJson !== null) {
        try {
          await repository.migrateLegacy({
            saveJson,
            recoveryJson,
            projectId: (options.idFactory ?? uuid)(),
            styleId: (options.idFactory ?? uuid)(),
            migratedAt: (options.now ?? canonicalNow)(),
          });
        } catch (error) {
          loaded = await repository.readActiveProject();
          if (!loaded) throw error;
        }
      } else {
        try {
          await repository.initializeFirstRun(
            (options.idFactory ?? uuid)(),
            (options.idFactory ?? uuid)(),
            (options.now ?? canonicalNow)(),
          );
        } catch (error) {
          loaded = await repository.readActiveProject();
          if (!loaded) throw error;
        }
      }
      loaded ??= await repository.readActiveProject();
    }
    if (!loaded) throw new ProjectRepositoryError("not-found", "Local project setup finished without an active style.");
    return new ProjectWorkflow(repository, loaded, options.idFactory ?? uuid, options.now ?? canonicalNow);
  } catch (error) {
    repository.close();
    throw error;
  }
}
