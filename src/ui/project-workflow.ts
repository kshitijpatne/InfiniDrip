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
import {
  appendRecoveryFieldObservations,
  createFieldObservationRecord,
  reconcileDesignFieldObservations,
  type FieldInputReference,
  type InitialObservationOrigin,
} from "./field-provenance";
import {
  ARTWORK_CATALOG,
} from "../surface/artwork-library/catalog";
import { isLocalArtworkAssetId, type ArtworkAssetStore } from "../surface/artwork-store";
import {
  canonicalizeJcs,
  createFrozenOutputManifest,
  createStyleRevision,
  sha256Hex,
  verifyFrozenOutputManifest,
  verifyStyleRevision,
  type FrozenArtifactInput,
  type FrozenOutputManifestRecord,
  type RevisionArtworkDigest,
  type StyleRevisionRecord,
} from "./style-revisions";

export interface ProjectWorkflowOptions {
  readonly repositoryOptions?: ProjectRepositoryOptions;
  readonly storage?: Pick<Storage, "getItem">;
  readonly idFactory?: () => string;
  readonly now?: () => string;
  readonly revisionIdFactory?: () => string;
  readonly artworkStore?: ArtworkAssetStore;
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

async function revisionArtworkDigests(
  design: SavedDesign,
  artworkStore?: ArtworkAssetStore,
  crypto?: Crypto,
  digestCache?: Map<string, RevisionArtworkDigest>,
): Promise<RevisionArtworkDigest[]> {
  const references = new Set<string>();
  for (const surface of Object.values(design.surface)) {
    const placements = (surface as { readonly placements?: readonly { readonly assetId?: string }[] } | null)?.placements ?? [];
    for (const placement of placements) {
      if (placement.assetId) references.add(placement.assetId);
    }
  }
  const digests: RevisionArtworkDigest[] = [];
  for (const assetId of [...references].sort()) {
    const cached = digestCache?.get(assetId);
    if (cached) {
      digests.push(cached);
      continue;
    }
    if (isLocalArtworkAssetId(assetId)) {
      if (!artworkStore) throw new ProjectRepositoryError("unavailable", `Revision capture is blocked because local artwork storage is unavailable for ${assetId}.`);
      const asset = await artworkStore.get(assetId);
      if (!asset) throw new ProjectRepositoryError("invalid-data", `Revision capture is blocked because referenced artwork ${assetId} is missing.`);
      const digest: RevisionArtworkDigest = {
        assetId,
        mimeType: asset.mimeType,
        byteLength: asset.blob.size,
        sha256: await sha256Hex(new Uint8Array(await asset.blob.arrayBuffer()), crypto),
      };
      digestCache?.set(assetId, digest);
      digests.push(digest);
      continue;
    }
    const bundled = ARTWORK_CATALOG.find((record) => record.assetId === assetId);
    if (!bundled) throw new ProjectRepositoryError("invalid-data", `Revision capture cannot verify artwork ${assetId}; select a bundled or locally stored asset.`);
    const digest: RevisionArtworkDigest = {
      assetId,
      mimeType: bundled.image.mimeType,
      byteLength: bundled.image.byteLength,
      sha256: bundled.image.sha256,
    };
    digestCache?.set(assetId, digest);
    digests.push(digest);
  }
  return digests;
}

async function verifyRevisionArtworkHistory(
  loaded: LoadedProject,
  artworkStore?: ArtworkAssetStore,
  crypto?: Crypto,
): Promise<void> {
  const digestCache = new Map<string, RevisionArtworkDigest>();
  for (const revision of loaded.styleRevisions) {
    const actual = await revisionArtworkDigests(revision.payload.design, artworkStore, crypto, digestCache);
    if (canonicalizeJcs(actual) !== canonicalizeJcs(revision.payload.artwork)) {
      throw new ProjectRepositoryError("invalid-data", `The source artwork captured by style revision ${revision.revisionId} has changed or is unavailable.`);
    }
  }
}

export function changedPaths(before: unknown, after: unknown): readonly string[] {
  const result: string[] = [];
  const visit = (left: unknown, right: unknown, path: string): void => {
    if (Object.is(left, right)) return;
    const leftIsRecord = typeof left === "object" && left !== null && !Array.isArray(left);
    const rightIsRecord = typeof right === "object" && right !== null && !Array.isArray(right);
    if ((left === undefined && rightIsRecord) || (right === undefined && leftIsRecord)) {
      const leftRecord = leftIsRecord ? left as Record<string, unknown> : {};
      const rightRecord = rightIsRecord ? right as Record<string, unknown> : {};
      const keys = [...new Set([...Object.keys(leftRecord), ...Object.keys(rightRecord)])].sort();
      if (keys.length === 0) result.push(path || "$design");
      else for (const key of keys) visit(leftRecord[key], rightRecord[key], path ? `${path}.${key}` : key);
      return;
    }
    if (typeof left !== "object" || left === null || typeof right !== "object" || right === null
      || Array.isArray(left) !== Array.isArray(right)) {
      result.push(path || "$design");
      return;
    }
    const leftRecord = left as Record<string, unknown>;
    const rightRecord = right as Record<string, unknown>;
    const keys = [...new Set([...Object.keys(leftRecord), ...Object.keys(rightRecord)])].sort();
    for (const key of keys) visit(leftRecord[key], rightRecord[key], path ? `${path}.${key}` : key);
  };
  visit(before, after, "");
  return result;
}

async function seedRevisionHeadsForProject(
  repository: ProjectRepository,
  loaded: LoadedProject,
  artworkStore: ArtworkAssetStore | undefined,
  revisionIdFactory: () => string,
  now: () => string,
  crypto?: Crypto,
): Promise<LoadedProject> {
  const unseeded = loaded.styles.filter((style) => style.revisionHeadId === null);
  if (unseeded.length === 0) return loaded;
  const time = monotonicTimestamp(now(), loaded.project.updatedAt);
  const revisions: StyleRevisionRecord[] = [];
  const seedIds = new Map(unseeded.map((style) => [style.id, revisionIdFactory()]));
  const updatedStyles = loaded.styles.map((style) => {
    if (style.revisionHeadId !== null) return style;
    const observations = loaded.fieldObservations.find((record) => record.styleId === style.id);
    if (!observations) throw new ProjectRepositoryError("invalid-data", `Style ${style.id} has no field-history record to seed its first immutable revision.`);
    return { ...style, revision: style.revision + 1, updatedAt: time, revisionHeadId: seedIds.get(style.id)! };
  });
  for (const style of updatedStyles) {
    const old = loaded.styles.find((candidate) => candidate.id === style.id)!;
    if (old.revisionHeadId !== null) continue;
    const observations = loaded.fieldObservations.find((record) => record.styleId === style.id)!;
    revisions.push(await createStyleRevision({
      styleId: style.id,
      revisionId: seedIds.get(style.id)!,
      parentRevisionId: null,
      revisionNumber: 1,
      design: style.design,
      fieldObservations: observations,
      artwork: await revisionArtworkDigests(style.design, artworkStore, crypto),
      createdAt: time,
    }, crypto));
  }
  const project = {
    ...loaded.project,
    revision: loaded.project.revision + 1,
    updatedAt: time,
  };
  await repository.saveProjectBundle({
    project,
    styles: updatedStyles,
    fieldObservations: loaded.fieldObservations,
    styleRevisions: revisions,
    expectedProjectRevision: loaded.project.revision,
  });
  const refreshed = await repository.loadProject(project.id);
  if (!refreshed) throw new ProjectRepositoryError("not-found", "The local project disappeared while its immutable history was initialized.");
  return refreshed;
}

async function seedRevisionHeadsWithRetry(
  repository: ProjectRepository,
  loaded: LoadedProject,
  artworkStore: ArtworkAssetStore | undefined,
  revisionIdFactory: () => string,
  now: () => string,
  crypto?: Crypto,
): Promise<LoadedProject> {
  try {
    return await seedRevisionHeadsForProject(repository, loaded, artworkStore, revisionIdFactory, now, crypto);
  } catch (error) {
    if ((error as { code?: unknown } | null)?.code !== "conflict") throw error;
    const latest = await repository.loadProject(loaded.project.id);
    if (!latest) throw new ProjectRepositoryError("not-found", "The local project disappeared during revision initialization.");
    if (latest.styles.every((style) => style.revisionHeadId !== null)) return latest;
    return seedRevisionHeadsForProject(repository, latest, artworkStore, revisionIdFactory, now, crypto);
  }
}

export class ProjectWorkflow {
  private tail: Promise<void> = Promise.resolve();

  constructor(
    readonly repository: ProjectRepository,
    private loaded: LoadedProject,
    private readonly idFactory: () => string = uuid,
    private readonly now: () => string = canonicalNow,
    private readonly revisionIdFactory: () => string = uuid,
    private readonly artworkStore?: ArtworkAssetStore,
    private readonly cryptoProvider?: Crypto,
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
    this.loaded = await this.ensureRevisionHeads(loaded);
    return this.loaded;
  }

  private async ensureRevisionHeads(loaded: LoadedProject): Promise<LoadedProject> {
    let ready: LoadedProject;
    try {
      ready = await seedRevisionHeadsForProject(
        this.repository, loaded, this.artworkStore, this.revisionIdFactory, this.now, this.cryptoProvider,
      );
    } catch (error) {
      if ((error as { code?: unknown } | null)?.code !== "conflict") throw error;
      const latest = await this.repository.loadProject(loaded.project.id);
      if (!latest) throw new ProjectRepositoryError("not-found", "The local project disappeared during revision initialization.");
      ready = latest.styles.every((style) => style.revisionHeadId !== null)
        ? latest
        : await seedRevisionHeadsForProject(
          this.repository, latest, this.artworkStore, this.revisionIdFactory, this.now, this.cryptoProvider,
        );
    }
    await verifyRevisionArtworkHistory(ready, this.artworkStore, this.cryptoProvider);
    return ready;
  }

  async reload(): Promise<LoadedProject> {
    return this.enqueue(async () => {
      const loaded = await this.repository.readActiveProject();
      if (!loaded) throw new ProjectRepositoryError("not-found", "There is no active local project.");
      this.loaded = await this.ensureRevisionHeads(loaded);
      return this.loaded;
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

  async recordFieldHistory(styleId: string, payload: RecoveryPayload, changedInput: FieldInputReference): Promise<void> {
    return this.enqueue(async () => {
      const current = this.loaded;
      if (styleId !== current.activeStyle.id) throw new ProjectRepositoryError("conflict", "The active style changed before its field edit was recorded.");
      const previous = current.fieldObservations.find((record) => record.styleId === styleId);
      if (!previous) throw new ProjectRepositoryError("invalid-data", "The active style has no field history record.");
      const time = monotonicTimestamp(this.now(), current.project.updatedAt);
      const next = appendRecoveryFieldObservations(previous, current.activeStyle, payload, time, changedInput);
      if (next === previous) return;
      await this.repository.saveRecovery(
        { schemaVersion: RECOVERY_RECORD_VERSION, styleId, payload },
        current.project.revision,
        time,
        next,
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
    return this.enqueue(() => this.saveDesignInQueue(design, false));
  }

  private async saveDesignInQueue(design: SavedDesign, forceRevision: boolean): Promise<LoadedProject> {
      const current = this.loaded;
      const time = monotonicTimestamp(this.now(), current.project.updatedAt, current.activeStyle.updatedAt);
      const previousObservations = current.fieldObservations.find((record) => record.styleId === current.activeStyle.id);
      if (!previousObservations) throw new ProjectRepositoryError("invalid-data", "The active style has no field history record.");
      const style: StyleRecord = {
        ...current.activeStyle,
        recipeId: design.workspace.garment,
        recipePresetId: design.workspace.targetStyle,
        design,
        revision: current.activeStyle.revision + 1,
        updatedAt: time,
      };
      const observations = reconcileDesignFieldObservations(previousObservations, style, design, time);
      const head = current.styleRevisions.find((record) => record.revisionId === current.activeStyle.revisionHeadId);
      if (!head) throw new ProjectRepositoryError("invalid-data", "The active style has no verified immutable revision head.");
      const designChanged = canonicalizeJcs(head.payload.design) !== canonicalizeJcs(design);
      const newRevision = forceRevision || designChanged
        ? await createStyleRevision({
          styleId: style.id,
          revisionId: this.revisionIdFactory(),
          parentRevisionId: head.revisionId,
          revisionNumber: head.revisionNumber + 1,
          design,
          fieldObservations: observations,
          artwork: await revisionArtworkDigests(design, this.artworkStore, this.cryptoProvider),
          createdAt: time,
        }, this.cryptoProvider)
        : null;
      const updatedStyle = newRevision ? { ...style, revisionHeadId: newRevision.revisionId } : style;
      const project = {
        ...current.project,
        revision: current.project.revision + 1,
        updatedAt: time,
      };
      await this.repository.saveProjectBundle({
        project,
        styles: current.styles.map((candidate) => candidate.id === style.id ? updatedStyle : candidate),
        fieldObservations: [observations],
        styleRevisions: newRevision ? [newRevision] : [],
        clearRecoveryStyleIds: [style.id],
        expectedProjectRevision: current.project.revision,
      });
      return this.reloadLoaded();
  }

  compareStyleRevisions(leftId: string, rightId: string): readonly string[] {
    const left = this.loaded.styleRevisions.find((revision) => revision.styleId === this.loaded.activeStyle.id && revision.revisionId === leftId);
    const right = this.loaded.styleRevisions.find((revision) => revision.styleId === this.loaded.activeStyle.id && revision.revisionId === rightId);
    if (!left || !right) throw new ProjectRepositoryError("not-found", "Choose two revisions from the current style history.");
    return [
      ...changedPaths(left.payload.design, right.payload.design).map((path) => `design.${path}`),
      ...changedPaths(left.payload.fieldObservations, right.payload.fieldObservations).map((path) => `fieldObservations.${path}`),
    ];
  }

  async restoreStyleRevision(revisionId: string): Promise<LoadedProject> {
    return this.enqueue(async () => {
      const revision = this.loaded.styleRevisions.find((candidate) => candidate.styleId === this.loaded.activeStyle.id && candidate.revisionId === revisionId);
      if (!revision || !await verifyStyleRevision(revision, this.cryptoProvider)) {
        throw new ProjectRepositoryError("invalid-data", "The selected revision is missing or failed its integrity check.");
      }
      const actualAssets = await revisionArtworkDigests(revision.payload.design, this.artworkStore, this.cryptoProvider);
      if (canonicalizeJcs(actualAssets) !== canonicalizeJcs(revision.payload.artwork)) {
        throw new ProjectRepositoryError("invalid-data", "The selected revision's source artwork has changed or is unavailable; restore was not applied.");
      }
      return this.saveDesignInQueue(revision.payload.design, true);
    });
  }

  async freezeOutputs(
    artifacts: readonly FrozenArtifactInput[],
    selectedSizes: readonly { readonly sizeId: string; readonly label: string }[],
    unresolved: readonly string[],
    expectedRevisionId: string,
  ): Promise<FrozenOutputManifestRecord> {
    return this.enqueue(async () => {
      const current = this.loaded;
      const revision = current.styleRevisions.find((candidate) => candidate.revisionId === current.activeStyle.revisionHeadId);
      if (!revision || revision.revisionId !== expectedRevisionId) {
        throw new ProjectRepositoryError("conflict", "The saved style changed while outputs were being prepared; retry the capture.");
      }
      const capturedAt = monotonicTimestamp(this.now(), current.project.updatedAt, current.activeStyle.updatedAt);
      const manifest = await createFrozenOutputManifest({
        manifestId: this.revisionIdFactory(),
        styleId: current.activeStyle.id,
        revision,
        capturedAt,
        selectedSizes,
        unresolved,
        artifacts,
      }, this.cryptoProvider);
      const project = { ...current.project, revision: current.project.revision + 1, updatedAt: capturedAt };
      await this.repository.saveProjectBundle({
        project,
        styles: current.styles,
        exportManifests: [manifest],
        expectedProjectRevision: current.project.revision,
      });
      const loaded = await this.reloadLoaded();
      const saved = loaded.exportManifests.find((candidate) => candidate.manifestId === manifest.manifestId);
      if (!saved) throw new ProjectRepositoryError("invalid-data", "The frozen output manifest was not present after its atomic save.");
      return saved;
    });
  }

  async readFrozenArtifact(manifestId: string, artifactId: string): Promise<{ readonly manifest: FrozenOutputManifestRecord; readonly artifact: FrozenOutputManifestRecord["artifacts"][number] }> {
    const manifest = this.loaded.exportManifests.find((candidate) => candidate.styleId === this.loaded.activeStyle.id && candidate.manifestId === manifestId);
    if (!manifest || !await verifyFrozenOutputManifest(manifest, this.cryptoProvider)) {
      throw new ProjectRepositoryError("invalid-data", "The frozen output capture or its artifact bytes failed integrity validation.");
    }
    const artifact = manifest.artifacts.find((candidate) => candidate.artifactId === artifactId);
    if (!artifact) throw new ProjectRepositoryError("not-found", "The selected frozen output file is not in this capture.");
    return { manifest, artifact };
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

  async switchProject(projectId: string): Promise<LoadedProject> {
    return this.enqueue(async () => {
      if (projectId === this.loaded.project.id) return this.loaded;
      const loaded = await this.repository.selectActiveProject(projectId);
      this.loaded = await this.ensureRevisionHeads(loaded);
      return this.loaded;
    });
  }

  async createStyle(
    nameInput: string,
    design: SavedDesign,
    origin: Extract<InitialObservationOrigin, "first-run-default" | "copied-style"> = "copied-style",
  ): Promise<LoadedProject> {
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
        revisionHeadId: null,
        design,
      };
      const observations = createFieldObservationRecord(style, time, origin);
      const revision = await createStyleRevision({
        styleId: style.id,
        revisionId: this.revisionIdFactory(),
        parentRevisionId: null,
        revisionNumber: 1,
        design,
        fieldObservations: observations,
        artwork: await revisionArtworkDigests(design, this.artworkStore, this.cryptoProvider),
        createdAt: time,
      }, this.cryptoProvider);
      const versionedStyle = { ...style, revisionHeadId: revision.revisionId };
      const project = {
        ...current.project,
        styleIds: [...current.project.styleIds, id],
        activeStyleId: id,
        revision: current.project.revision + 1,
        updatedAt: time,
      };
      await this.repository.saveProjectBundle({
        project,
        styles: [...current.styles, versionedStyle],
        fieldObservations: [observations],
        styleRevisions: [revision],
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
    const revisionIdFactory = options.revisionIdFactory ?? uuid;
    const projects = typeof repository.listProjects === "function" ? await repository.listProjects() : [loaded];
    for (const project of projects) {
      const latest = typeof repository.loadProject === "function"
        ? await repository.loadProject(project.project.id) : project;
      if (latest && latest.styles.some((style) => style.revisionHeadId === null)) {
        const seeded = await seedRevisionHeadsWithRetry(
          repository,
          latest,
          options.artworkStore,
          revisionIdFactory,
          options.now ?? canonicalNow,
          options.repositoryOptions?.crypto,
        );
        if (seeded.project.id === loaded.project.id) loaded = seeded;
      }
    }
    if (typeof repository.listProjects === "function") loaded = await repository.readActiveProject();
    if (!loaded) throw new ProjectRepositoryError("not-found", "Revision initialization finished without an active style.");
    await verifyRevisionArtworkHistory(loaded, options.artworkStore, options.repositoryOptions?.crypto);
    return new ProjectWorkflow(
      repository,
      loaded,
      options.idFactory ?? uuid,
      options.now ?? canonicalNow,
      revisionIdFactory,
      options.artworkStore,
      options.repositoryOptions?.crypto,
    );
  } catch (error) {
    repository.close();
    throw error;
  }
}
