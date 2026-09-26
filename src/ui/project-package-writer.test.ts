import { webcrypto } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { STANDARD_M } from "../drafting";
import { migrateLegacySaveFile } from "./project-records";
import { serialize } from "./persist";

const zipControl = vi.hoisted(() => ({
  mode: "error" as "error" | "oversize",
  terminated: false,
  unzipPath: "",
}));

vi.mock("fflate", () => ({
  Zip: class {
    constructor(private readonly ondata: (error: Error | null, chunk: Uint8Array, final: boolean) => void) {}
    add(): void {}
    end(): void {
      if (zipControl.mode === "error") {
        this.ondata(new Error("simulated ZIP writer failure"), new Uint8Array(), false);
        this.ondata(null, new Uint8Array(), false);
      } else {
        this.ondata(null, { byteLength: 256 * 1024 * 1024 + 1 } as Uint8Array, false);
      }
    }
    terminate(): void { zipControl.terminated = true; }
  },
  ZipPassThrough: class {
    constructor(readonly filename: string) {}
    push(): void {}
  },
  Unzip: class {
    private emitted = false;
    constructor(private readonly onfile: (file: {
      name: string;
      compression: number;
      ondata: ((error: Error | null, chunk: Uint8Array, final: boolean) => void) | null;
      start(): void;
    }) => void) {}
    register(): void {}
    push(chunk: Uint8Array): void {
      if (this.emitted || chunk.byteLength === 0) return;
      this.emitted = true;
      const file = {
        name: zipControl.unzipPath,
        compression: 0,
        ondata: null as ((error: Error | null, chunk: Uint8Array, final: boolean) => void) | null,
        start() { this.ondata?.(new Error("simulated ZIP stream decode failure"), new Uint8Array(), false); },
      };
      this.onfile(file);
    }
  },
  UnzipPassThrough: class {},
}));

import {
  createProjectPackage,
  importProjectPackage,
  ProjectPackageError,
  PROJECT_PACKAGE_MAX_BYTES,
} from "./project-package";
import type { ArtworkAssetStore } from "../surface/artwork-store";
import type { ProjectPackageArchive } from "./project-package";
import type { ProjectRepository } from "./project-repository";

function emptySnapshot() {
  const migrated = migrateLegacySaveFile({
    json: serialize(STANDARD_M, "#3A4150"),
    projectId: "a02b8322-8f57-46bb-9d16-16ac1fcf6811",
    styleId: "b53a1a03-ea2e-4c4f-82dc-14ac86a29895",
    migratedAt: "2026-09-24T16:00:00.000Z",
  });
  if (!migrated.ok) throw new Error(migrated.error);
  return { project: migrated.value.project, styles: [migrated.value.style], recoveries: [] };
}

describe("bounded project package writer failure handling", () => {
  it("surfaces ZIP library errors and terminates output that exceeds the archive cap", async () => {
    const snapshot = emptySnapshot();
    const assets: ArtworkAssetStore = {
      put: async () => undefined,
      get: async () => null,
      remove: async () => undefined,
    };
    const options = { crypto: webcrypto as unknown as Crypto };

    zipControl.mode = "error";
    zipControl.terminated = false;
    await expect(createProjectPackage(snapshot, assets, options))
      .rejects.toMatchObject({ code: "invalid-package", message: "simulated ZIP writer failure" } satisfies Partial<ProjectPackageError>);
    expect(zipControl.terminated).toBe(true);

    zipControl.mode = "oversize";
    zipControl.terminated = false;
    await expect(createProjectPackage(snapshot, assets, options))
      .rejects.toMatchObject({ code: "limit-exceeded" });
    expect(zipControl.terminated).toBe(true);
    expect(PROJECT_PACKAGE_MAX_BYTES).toBe(256 * 1024 * 1024);
  });

  it("surfaces decoder errors from the stored-entry reader without leaving a rejected promise", async () => {
    const migrated = migrateLegacySaveFile({
      json: serialize(STANDARD_M, "#3A4150"),
      projectId: "a02b8322-8f57-46bb-9d16-16ac1fcf6811",
      styleId: "b53a1a03-ea2e-4c4f-82dc-14ac86a29895",
      migratedAt: "2026-09-24T16:00:00.000Z",
    });
    if (!migrated.ok) throw new Error(migrated.error);
    const assetId = "local-1234567890abcdef1234567890abcdef-png";
    const path = "assets/" + assetId;
    zipControl.unzipPath = path;
    const archive = {
      blob: new Blob([new Uint8Array([1])]),
      packageSha256: "a".repeat(64),
      manifest: {
        format: "infinidrip-project",
        packageVersion: 1,
        packageSha256: "a".repeat(64),
        project: migrated.value.project,
        styles: [migrated.value.style],
        recoveries: [],
        assets: [{
          assetId, path, name: "front.png", mimeType: "png", byteLength: 1,
          sha256: "b".repeat(64), attribution: [],
        }],
      },
      entries: new Map([
        ["manifest.json", { path: "manifest.json", localOffset: 0, dataOffset: 0, compressedSize: 1, uncompressedSize: 1, crc32: 0, spanEnd: 1 }],
        [path, { path, localOffset: 0, dataOffset: 0, compressedSize: 1, uncompressedSize: 1, crc32: 0, spanEnd: 1 }],
      ]),
    } as unknown as ProjectPackageArchive;
    const repository = {
      readProjectImportReceipt: async () => null,
      loadProject: async () => null,
      hasStyleIdCollision: async () => false,
      importProjectBundle: vi.fn(),
    } as unknown as ProjectRepository;
    const assets: ArtworkAssetStore = {
      put: async () => undefined,
      get: async () => null,
      remove: async () => undefined,
    };
    await expect(importProjectPackage(repository, assets, archive, false))
      .rejects.toMatchObject({ code: "invalid-package", message: "simulated ZIP stream decode failure" });
  });
});
