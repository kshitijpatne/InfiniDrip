import type { ArtworkMimeType, InspectedArtworkFile } from "./artwork-file";
import { ARTWORK_FILE_LIMITS } from "./artwork-file";

export interface StoredArtworkAsset {
  readonly assetId: string;
  readonly name: string;
  readonly mimeType: ArtworkMimeType;
  readonly blob: Blob;
}

export interface ArtworkAssetStore {
  put(asset: StoredArtworkAsset): Promise<void>;
  get(assetId: string): Promise<StoredArtworkAsset | null>;
  remove(assetId: string): Promise<void>;
}

export interface ArtworkAssetWireRecord {
  readonly assetId: string;
  readonly name: string;
  readonly mimeType: ArtworkMimeType;
  readonly bytes: Uint8Array;
}

/** Narrow bridge implemented by Electron preload; it exposes no filesystem paths. */
export interface ArtworkAssetBridge {
  putArtworkAsset(asset: ArtworkAssetWireRecord): Promise<void>;
  getArtworkAsset(assetId: string): Promise<ArtworkAssetWireRecord | null>;
  removeArtworkAsset(assetId: string): Promise<void>;
}

const DATABASE_NAME = "infinidrip-local-artwork";
const DATABASE_VERSION = 1;
const STORE_NAME = "assets";
const ASSET_ID = /^local-[0-9a-f]{32}-(?:png|jpg|webp|svg)$/i;
const EXTENSION_BY_MIME: Readonly<Record<ArtworkMimeType, string>> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const validStoredAsset = (asset: StoredArtworkAsset): boolean =>
  isLocalArtworkAssetId(asset.assetId) && asset.assetId.endsWith(`-${EXTENSION_BY_MIME[asset.mimeType]}`) &&
  asset.name.length > 0 && asset.name.length <= 180 && !/[\\/\u0000-\u001f\u007f]/.test(asset.name) &&
  asset.blob.size > 0 && asset.blob.size <= ARTWORK_FILE_LIMITS.fileBytes &&
  (asset.mimeType !== "image/svg+xml" || asset.blob.size <= ARTWORK_FILE_LIMITS.svgBytes) &&
  asset.blob.type === asset.mimeType;

export function isLocalArtworkAssetId(value: unknown): value is string {
  return typeof value === "string" && ASSET_ID.test(value);
}

export function createLocalArtworkAssetId(
  mimeType: ArtworkMimeType,
  uuid: string = globalThis.crypto.randomUUID(),
): string {
  if (!Object.prototype.hasOwnProperty.call(EXTENSION_BY_MIME, mimeType)) throw new Error("Unsupported local artwork image type.");
  const compactUuid = uuid.toLowerCase().replace(/-/g, "");
  if (!/^[0-9a-f]{32}$/.test(compactUuid)) throw new Error("Could not create a safe local artwork ID.");
  return `local-${compactUuid}-${EXTENSION_BY_MIME[mimeType]}`;
}

export function createIndexedDbArtworkStore(
  factory: IDBFactory,
  databaseName = DATABASE_NAME,
): ArtworkAssetStore {
  let databasePromise: Promise<IDBDatabase> | undefined;
  const openDatabase = (): Promise<IDBDatabase> => {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      let request: IDBOpenDBRequest;
      try {
        request = factory.open(databaseName, DATABASE_VERSION);
      } catch {
        reject(new Error("Local artwork storage is unavailable in this app profile."));
        return;
      }
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME, { keyPath: "assetId" });
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => {
          database.close();
          databasePromise = undefined;
        };
        resolve(database);
      };
      request.onerror = () => reject(new Error("Could not open the local artwork store."));
      request.onblocked = () => reject(new Error("Local artwork storage is busy; close other InfiniDrip tabs and retry."));
    }).catch((error: unknown) => {
      databasePromise = undefined;
      throw error;
    });
    return databasePromise!;
  };

  const run = async <T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> => {
    const database = await openDatabase();
    return new Promise<T>((resolve, reject) => {
      let transaction: IDBTransaction;
      let request: IDBRequest<T>;
      try {
        transaction = database.transaction(STORE_NAME, mode);
        request = action(transaction.objectStore(STORE_NAME));
      } catch {
        reject(new Error("Could not access the local artwork store."));
        return;
      }
      let result: T;
      request.onsuccess = () => { result = request.result; };
      request.onerror = () => reject(new Error("Could not read or save artwork in the local store."));
      transaction.oncomplete = () => resolve(result!);
      transaction.onerror = () => reject(new Error("The local artwork transaction failed."));
      transaction.onabort = () => reject(new Error("The local artwork transaction was cancelled."));
    });
  };

  return {
    async put(asset): Promise<void> {
      if (!validStoredAsset(asset)) throw new Error("Artwork metadata, size, or type is invalid for local storage.");
      await run("readwrite", (store) => store.add(asset));
    },
    async get(assetId): Promise<StoredArtworkAsset | null> {
      if (!isLocalArtworkAssetId(assetId)) throw new Error("Invalid local artwork ID.");
      const asset = await run("readonly", (store) => store.get(assetId));
      return asset ?? null;
    },
    async remove(assetId): Promise<void> {
      if (!isLocalArtworkAssetId(assetId)) throw new Error("Invalid local artwork ID.");
      await run("readwrite", (store) => store.delete(assetId));
    },
  };
}

export function createElectronArtworkStore(bridge: ArtworkAssetBridge): ArtworkAssetStore {
  const asStoredAsset = (asset: ArtworkAssetWireRecord): StoredArtworkAsset => {
    if (!asset || !isLocalArtworkAssetId(asset.assetId) ||
        !Object.prototype.hasOwnProperty.call(EXTENSION_BY_MIME, asset.mimeType) ||
        !(asset.bytes instanceof Uint8Array)) {
      throw new Error("The desktop artwork store returned invalid asset data.");
    }
    const bytes = asset.bytes.slice();
    const stored: StoredArtworkAsset = {
      assetId: asset.assetId,
      name: asset.name,
      mimeType: asset.mimeType,
      blob: new Blob([bytes.buffer], { type: asset.mimeType }),
    };
    if (!validStoredAsset(stored)) throw new Error("The desktop artwork store returned invalid asset data.");
    return stored;
  };

  return {
    async put(asset): Promise<void> {
      if (!validStoredAsset(asset)) throw new Error("Artwork metadata, size, or type is invalid for local storage.");
      let raw: ArrayBuffer;
      if (typeof asset.blob.arrayBuffer === "function") {
        raw = await asset.blob.arrayBuffer();
      } else {
        raw = await new Promise<ArrayBuffer>((resolve, reject) => {
          if (typeof FileReader === "undefined") {
            reject(new Error("This desktop app cannot read the selected artwork bytes."));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => reader.result instanceof ArrayBuffer
            ? resolve(reader.result)
            : reject(new Error("Could not read the selected artwork bytes."));
          reader.onerror = () => reject(new Error("Could not read the selected artwork bytes."));
          reader.onabort = () => reject(new Error("Reading the selected artwork was cancelled."));
          reader.readAsArrayBuffer(asset.blob);
        });
      }
      const bytes = new Uint8Array(raw);
      await bridge.putArtworkAsset({ assetId: asset.assetId, name: asset.name, mimeType: asset.mimeType, bytes });
    },
    async get(assetId): Promise<StoredArtworkAsset | null> {
      if (!isLocalArtworkAssetId(assetId)) throw new Error("Invalid local artwork ID.");
      const asset = await bridge.getArtworkAsset(assetId);
      if (asset === null) return null;
      if (asset.assetId !== assetId) throw new Error("The desktop artwork store returned a different asset ID.");
      return asStoredAsset(asset);
    },
    async remove(assetId): Promise<void> {
      if (!isLocalArtworkAssetId(assetId)) throw new Error("Invalid local artwork ID.");
      await bridge.removeArtworkAsset(assetId);
    },
  };
}

export function createUnavailableArtworkStore(message: string): ArtworkAssetStore {
  const fail = async (): Promise<never> => { throw new Error(message); };
  return { put: fail, get: fail, remove: fail };
}

export async function storeArtworkFile(
  file: InspectedArtworkFile,
  store: ArtworkAssetStore = createIndexedDbArtworkStore(globalThis.indexedDB),
  uuid?: string,
): Promise<string> {
  const assetId = createLocalArtworkAssetId(file.mimeType, uuid);
  await store.put({ assetId, name: file.name, mimeType: file.mimeType, blob: file.blob });
  return assetId;
}

export async function loadArtworkAsset(
  assetId: string,
  store: ArtworkAssetStore = createIndexedDbArtworkStore(globalThis.indexedDB),
): Promise<StoredArtworkAsset | null> {
  return store.get(assetId);
}
