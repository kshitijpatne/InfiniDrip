import { describe, expect, it, vi } from "vitest";
import {
  createElectronArtworkStore, createIndexedDbArtworkStore, createLocalArtworkAssetId,
  createUnavailableArtworkStore, isLocalArtworkAssetId,
  loadArtworkAsset, storeArtworkFile, type ArtworkAssetBridge, type StoredArtworkAsset,
} from "./artwork-store";
import type { ArtworkMimeType, InspectedArtworkFile } from "./artwork-file";

interface FakeOptions {
  readonly open?: "throw" | "error" | "blocked";
  readonly transaction?: "throw" | "store-throw" | "request-error" | "transaction-error" | "abort";
  readonly storeExists?: boolean;
}

function fakeIndexedDB(options: FakeOptions = {}) {
  const records = new Map<string, StoredArtworkAsset>();
  let openCount = 0;
  let storeExists = options.storeExists ?? false;
  let database: IDBDatabase;
  const createObjectStore = vi.fn(() => { storeExists = true; });
  const factory = {
    open: vi.fn(() => {
      openCount += 1;
      if (options.open === "throw") throw new Error("open");
      const request: Record<string, unknown> = {
        result: undefined,
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        onblocked: null,
      };
      queueMicrotask(() => {
        if (options.open === "error") (request.onerror as (() => void) | null)?.();
        else if (options.open === "blocked") (request.onblocked as (() => void) | null)?.();
        else {
          request.result = database;
          (request.onupgradeneeded as (() => void) | null)?.();
          (request.onsuccess as (() => void) | null)?.();
        }
      });
      return request;
    }),
  } as unknown as IDBFactory;
  database = {
    objectStoreNames: { contains: () => storeExists } as unknown as DOMStringList,
    createObjectStore,
    close: vi.fn(),
    onversionchange: null,
    transaction: vi.fn(() => {
      if (options.transaction === "throw") throw new Error("transaction");
      const transaction: Record<string, unknown> = {
        oncomplete: null,
        onerror: null,
        onabort: null,
        objectStore: () => {
          if (options.transaction === "store-throw") throw new Error("object store");
          const makeRequest = <T>(operation: () => T): IDBRequest<T> => {
            const request: Record<string, unknown> = { result: undefined, onsuccess: null, onerror: null };
            queueMicrotask(() => {
              if (options.transaction === "request-error") {
                (request.onerror as (() => void) | null)?.();
                return;
              }
              let result: T;
              try { result = operation(); }
              catch {
                (request.onerror as (() => void) | null)?.();
                return;
              }
              request.result = result;
              (request.onsuccess as (() => void) | null)?.();
              queueMicrotask(() => {
                if (options.transaction === "transaction-error") {
                  (transaction.onerror as (() => void) | null)?.();
                } else if (options.transaction === "abort") {
                  (transaction.onabort as (() => void) | null)?.();
                } else (transaction.oncomplete as (() => void) | null)?.();
              });
            });
            return request as unknown as IDBRequest<T>;
          };
          return {
            add: (asset: StoredArtworkAsset) => makeRequest(() => {
              if (records.has(asset.assetId)) throw new Error("duplicate");
              records.set(asset.assetId, asset);
              return undefined;
            }),
            get: (assetId: string) => makeRequest(() => records.get(assetId)),
            delete: (assetId: string) => makeRequest(() => { records.delete(assetId); return undefined; }),
          };
        },
      };
      return transaction as unknown as IDBTransaction;
    }),
  } as unknown as IDBDatabase;
  return { factory, records, createObjectStore, openCount: () => openCount, database: () => database };
}

const validId = "local-11111111111141118111111111111111-png";
const validAsset = (overrides: Partial<StoredArtworkAsset> = {}): StoredArtworkAsset => ({
  assetId: validId,
  name: "leaf.png",
  mimeType: "image/png",
  blob: new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }),
  ...overrides,
});

describe("local artwork asset identifiers", () => {
  it("creates safe type-specific IDs and rejects malformed inputs", () => {
    const uuid = "11111111-1111-4111-8111-111111111111";
    expect(createLocalArtworkAssetId("image/png", uuid)).toBe(validId);
    expect(createLocalArtworkAssetId("image/jpeg", uuid)).toContain("-jpg");
    expect(createLocalArtworkAssetId("image/webp", uuid)).toContain("-webp");
    expect(createLocalArtworkAssetId("image/svg+xml", uuid)).toContain("-svg");
    expect(() => createLocalArtworkAssetId("text/html" as ArtworkMimeType, uuid)).toThrow("Unsupported");
    expect(() => createLocalArtworkAssetId("image/png", "../unsafe")).toThrow("safe local artwork ID");
    expect(isLocalArtworkAssetId(validId)).toBe(true);
    expect(isLocalArtworkAssetId("builtin-leaf")).toBe(false);
    expect(isLocalArtworkAssetId("../escape.svg")).toBe(false);
  });
});

describe("IndexedDB artwork store", () => {
  it("creates the store on upgrade, persists, reads, removes, and reuses its open database", async () => {
    const fake = fakeIndexedDB();
    const store = createIndexedDbArtworkStore(fake.factory, "test-artwork-db");
    const asset = validAsset();
    await store.put(asset);
    expect(fake.createObjectStore).toHaveBeenCalledWith("assets", { keyPath: "assetId" });
    expect(await store.get(validId)).toEqual(asset);
    expect(await store.get("local-22222222222242228222222222222222-png")).toBeNull();
    expect(fake.openCount()).toBe(1);
    await store.remove(validId);
    expect(await store.get(validId)).toBeNull();
  });

  it("does not recreate an existing object store and reopens after a version change", async () => {
    const fake = fakeIndexedDB({ storeExists: true });
    const store = createIndexedDbArtworkStore(fake.factory);
    await store.get(validId);
    expect(fake.createObjectStore).not.toHaveBeenCalled();
    fake.database().onversionchange?.({} as IDBVersionChangeEvent);
    await store.get(validId);
    expect(fake.openCount()).toBe(2);
    expect(fake.database().close).toHaveBeenCalledOnce();
  });

  it("rejects invalid identifiers, type mismatches, unsafe names, and bad sizes before writing", async () => {
    const store = createIndexedDbArtworkStore(fakeIndexedDB().factory);
    await expect(store.put(validAsset({ assetId: "../escape" }))).rejects.toThrow("metadata, size, or type");
    await expect(store.put(validAsset({ assetId: validId.replace("-png", "-jpg") }))).rejects.toThrow("metadata, size, or type");
    await expect(store.put(validAsset({ name: "C:\\fakepath\\art.png" }))).rejects.toThrow("metadata, size, or type");
    await expect(store.put(validAsset({ blob: new Blob([], { type: "image/png" }) }))).rejects.toThrow("metadata, size, or type");
    await expect(store.put(validAsset({ blob: new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: "image/png" }) }))).rejects.toThrow("metadata, size, or type");
    await expect(store.put(validAsset({
      assetId: "local-11111111111141118111111111111111-svg",
      name: "large.svg", mimeType: "image/svg+xml",
      blob: new Blob([new Uint8Array(2 * 1024 * 1024 + 1)], { type: "image/svg+xml" }),
    }))).rejects.toThrow("metadata, size, or type");
  });

  it("surfaces duplicate keys and invalid read/delete IDs", async () => {
    const store = createIndexedDbArtworkStore(fakeIndexedDB().factory);
    await store.put(validAsset());
    await expect(store.put(validAsset())).rejects.toThrow("read or save");
    await expect(store.get("invalid")).rejects.toThrow("Invalid local artwork ID");
    await expect(store.remove("invalid")).rejects.toThrow("Invalid local artwork ID");
  });

  it.each([
    ["synchronous open", { open: "throw" } as const, "unavailable"],
    ["open error", { open: "error" } as const, "Could not open"],
    ["blocked open", { open: "blocked" } as const, "busy"],
    ["transaction start", { transaction: "throw" } as const, "Could not access"],
    ["object-store access", { transaction: "store-throw" } as const, "Could not access"],
    ["request error", { transaction: "request-error" } as const, "Could not read or save"],
    ["transaction error", { transaction: "transaction-error" } as const, "transaction failed"],
    ["transaction abort", { transaction: "abort" } as const, "cancelled"],
  ])("reports %s clearly", async (_label, options, message) => {
    const store = createIndexedDbArtworkStore(fakeIndexedDB(options).factory);
    await expect(store.get(validId)).rejects.toThrow(message);
  });

  it("stores and loads inspected artwork by its stable ID", async () => {
    const fake = fakeIndexedDB();
    const store = createIndexedDbArtworkStore(fake.factory);
    const inspected: InspectedArtworkFile = {
      name: "leaf.png", mimeType: "image/png", blob: new Blob([new Uint8Array([1])], { type: "image/png" }),
      widthPx: 4, heightPx: 5,
    };
    const id = await storeArtworkFile(inspected, store, "11111111-1111-4111-8111-111111111111");
    expect(id).toBe(validId);
    expect(await loadArtworkAsset(id, store)).toMatchObject({ name: "leaf.png", mimeType: "image/png" });
    await expect(storeArtworkFile(inspected, store, "not-a-uuid")).rejects.toThrow("safe local artwork ID");
  });
});

describe("Electron artwork store bridge", () => {
  it("copies local bytes through the narrow bridge and reads/removes by stable ID", async () => {
    const records = new Map<string, { assetId: string; name: string; mimeType: "image/png"; bytes: Uint8Array }>();
    const bridge = {
      putArtworkAsset: vi.fn(async (asset: { assetId: string; name: string; mimeType: "image/png"; bytes: Uint8Array }) => {
        records.set(asset.assetId, asset);
      }),
      getArtworkAsset: vi.fn(async (assetId: string) => records.get(assetId) ?? null),
      removeArtworkAsset: vi.fn(async (assetId: string) => { records.delete(assetId); }),
    };
    const store = createElectronArtworkStore(bridge);
    const asset = validAsset();
    await store.put(asset);
    expect(bridge.putArtworkAsset).toHaveBeenCalledWith(expect.objectContaining({
      assetId: validId, name: "leaf.png", mimeType: "image/png", bytes: new Uint8Array([1, 2, 3]),
    }));
    expect(await store.get(validId)).toEqual(asset);
    await store.remove(validId);
    expect(await store.get(validId)).toBeNull();
    expect(bridge.removeArtworkAsset).toHaveBeenCalledWith(validId);
  });

  it("rejects invalid IDs before IPC and rejects malformed desktop records", async () => {
    const bridge = {
      putArtworkAsset: vi.fn(async () => undefined),
      getArtworkAsset: vi.fn(async () => ({
        assetId: "local-11111111111141118111111111111111-svg", name: "wrong.png",
        mimeType: "image/png" as const, bytes: new Uint8Array([1]),
      })),
      removeArtworkAsset: vi.fn(async () => undefined),
    };
    const store = createElectronArtworkStore(bridge);
    await expect(store.get("../outside")).rejects.toThrow("Invalid local artwork ID");
    expect(bridge.getArtworkAsset).not.toHaveBeenCalled();
    await expect(store.get(validId)).rejects.toThrow("different asset ID");
  });

  it("rejects malformed wire records and valid IDs with unsafe stored metadata", async () => {
    const invalidRecords: unknown[] = [
      { assetId: validId, name: "leaf.png", mimeType: "text/plain", bytes: new Uint8Array([1]) },
      { assetId: validId, name: "leaf.png", mimeType: "image/png", bytes: "not bytes" },
      { assetId: validId, name: "../leaf.png", mimeType: "image/png", bytes: new Uint8Array([1]) },
    ];
    const bridge = {
      putArtworkAsset: vi.fn(async () => undefined),
      getArtworkAsset: vi.fn(async () => invalidRecords.shift() as null),
      removeArtworkAsset: vi.fn(async () => undefined),
    } as unknown as ArtworkAssetBridge;
    const store = createElectronArtworkStore(bridge);
    await expect(store.put(validAsset({ name: "../unsafe.png" })))
      .rejects.toThrow("metadata, size, or type");
    for (let index = 0; index < 3; index++) {
      await expect(store.get(validId)).rejects.toThrow("invalid asset data");
    }
  });

  it("reports FileReader absence, unreadable results, read errors, and cancellation", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });
    Object.defineProperty(blob, "arrayBuffer", { configurable: true, value: undefined });
    const store = createElectronArtworkStore({
      putArtworkAsset: vi.fn(async () => undefined),
      getArtworkAsset: vi.fn(async () => null),
      removeArtworkAsset: vi.fn(async () => undefined),
    });
    const asset = validAsset({ blob });
    const previous = Object.getOwnPropertyDescriptor(globalThis, "FileReader");
    Object.defineProperty(globalThis, "FileReader", { configurable: true, value: undefined });
    try {
      await expect(store.put(asset)).rejects.toThrow("cannot read the selected artwork bytes");
    } finally {
      if (previous) Object.defineProperty(globalThis, "FileReader", previous);
      else Reflect.deleteProperty(globalThis, "FileReader");
    }

    for (const mode of ["wrong-result", "error", "abort"] as const) {
      class ControlledReader {
        result: unknown = mode === "wrong-result" ? "not an ArrayBuffer" : null;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        onabort: (() => void) | null = null;
        readAsArrayBuffer(): void {
          if (mode === "error") this.onerror?.();
          else if (mode === "abort") this.onabort?.();
          else this.onload?.();
        }
      }
      Object.defineProperty(globalThis, "FileReader", { configurable: true, value: ControlledReader });
      if (mode === "abort") await expect(store.put(asset)).rejects.toThrow("Reading the selected artwork was cancelled");
      else await expect(store.put(asset)).rejects.toThrow("Could not read the selected artwork bytes");
    }
    if (previous) Object.defineProperty(globalThis, "FileReader", previous);
    else Reflect.deleteProperty(globalThis, "FileReader");
  });

  it("reports unavailable desktop storage without falling back to browser storage", async () => {
    const store = createUnavailableArtworkStore("Desktop store is unavailable.");
    await expect(store.put(validAsset())).rejects.toThrow("Desktop store is unavailable");
    await expect(store.get(validId)).rejects.toThrow("Desktop store is unavailable");
    await expect(store.remove(validId)).rejects.toThrow("Desktop store is unavailable");
  });
});
