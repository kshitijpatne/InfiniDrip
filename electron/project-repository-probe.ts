import { STANDARD_M } from "../src/drafting";
import { DEFAULT_APPEARANCE } from "../src/ui/appearance";
import { DEFAULT_WORKSPACE, serialize, serializeRecovery } from "../src/ui/persist";
import { openProjectRepository } from "../src/ui/project-repository";

const PROJECT_ID = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const STYLE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const MIGRATED_AT = "2026-09-24T16:00:00.000Z";
const FABRIC = "#3A4150";
const SAVE_KEY = "patternworks_save_v1";
const RECOVERY_KEY = "patternworks_recovery_v1";

function legacyRecoveryJson(): string {
  return serializeRecovery({
    savedAt: 123,
    measurements: { ...Object.fromEntries(Object.entries(STANDARD_M)), chest: null },
    rawMeasurements: { chest: "", neck: "40" },
    fabric: FABRIC,
    appearance: DEFAULT_APPEARANCE,
    garmentOptions: { tee: {} },
    rawOptions: { tee: {} },
    workspace: DEFAULT_WORKSPACE,
    materialSelectionExplicit: false,
    surface: {},
    rawNestingIntelligence: { buffer: "10", available: "", napAware: true },
  });
}

export async function runProjectRepositoryProbe(mode: "write" | "read"): Promise<Record<string, unknown>> {
  const saveJson = serialize(STANDARD_M, FABRIC);
  const recoveryJson = legacyRecoveryJson();
  if (mode === "write") {
    localStorage.setItem(SAVE_KEY, saveJson);
    localStorage.setItem(RECOVERY_KEY, recoveryJson);
  }
  const durabilityAttempts: Array<string | null> = [];
  const nativeTransaction = IDBDatabase.prototype.transaction;
  IDBDatabase.prototype.transaction = function (
    stores: string | string[],
    transactionMode?: IDBTransactionMode,
    options?: IDBTransactionOptions,
  ): IDBTransaction {
    if (transactionMode === "readwrite") durabilityAttempts.push(options?.durability ?? null);
    return nativeTransaction.call(this, stores, transactionMode as IDBTransactionMode, options);
  };
  let repository: Awaited<ReturnType<typeof openProjectRepository>> | undefined;
  try {
    repository = await openProjectRepository();
    const migration = await repository.migrateLegacy({
      saveJson: localStorage.getItem(SAVE_KEY),
      recoveryJson: localStorage.getItem(RECOVERY_KEY),
      projectId: PROJECT_ID,
      styleId: STYLE_ID,
      migratedAt: MIGRATED_AT,
    });
    const active = await repository.readActiveProject();
    return {
      mode,
      protocol: location.protocol,
      href: location.href,
      migrationStatus: migration.status,
      project: active?.project ?? null,
      style: active?.activeStyle ?? null,
      recovery: active?.activeRecovery ?? null,
      readWriteDurabilityAttempts: [...durabilityAttempts],
      legacySaveUnchanged: localStorage.getItem(SAVE_KEY) === saveJson,
      legacyRecoveryUnchanged: localStorage.getItem(RECOVERY_KEY) === recoveryJson,
    };
  } finally {
    repository?.close();
    IDBDatabase.prototype.transaction = nativeTransaction;
  }
}
