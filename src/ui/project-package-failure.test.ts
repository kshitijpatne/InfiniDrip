import { webcrypto } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STANDARD_M } from "../drafting";
import { serialize } from "./persist";
import { migrateLegacySaveFile } from "./project-records";
import {
  createProjectPackage,
  PROJECT_PACKAGE_MAX_BYTES,
  readProjectPackage,
} from "./project-package";
import type { ArtworkAssetStore } from "../surface/artwork-store";

const mockState = vi.hoisted(() => ({ mode: "", terminated: false }));

vi.mock("fflate", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fflate")>();
  class TestZip {
    private emitted = false;

    constructor(private readonly output: (error: Error | null, chunk: Uint8Array, final: boolean) => void) {}

    add(file: unknown): void {
      const stream = file as { ondata?: (error: Error | null, chunk: Uint8Array, final: boolean) => void };
      stream.ondata = () => undefined;
      if (this.emitted) return;
      this.emitted = true;
      if (mockState.mode === "writer-error" || mockState.mode === "writer-error-followup") {
        this.output(new Error("synthetic ZIP writer failure"), new Uint8Array(), false);
        if (mockState.mode === "writer-error-followup") {
          this.output(null, new Uint8Array([1, 2, 3]), false);
        }
      } else if (mockState.mode === "archive-limit") {
        const chunk = new Proxy(new Uint8Array(), {
          get(target, property) {
            return property === "byteLength"
              ? PROJECT_PACKAGE_MAX_BYTES + 1
              : Reflect.get(target, property, target);
          },
        });
        this.output(null, chunk as Uint8Array, false);
      }
    }

    end(): void {}
    terminate(): void { mockState.terminated = true; }
  }

  class FailingUnzip {
    private sent = false;

    constructor(private readonly onFile: (file: unknown) => void) {}

    register(): void {}

    push(): void {
      if (this.sent) return;
      this.sent = true;
      if (mockState.mode !== "inflate-error") return;
      const file: {
        name: string;
        compression: number;
        ondata?: (error: Error | null, chunk: Uint8Array, final: boolean) => void;
        start: () => void;
      } = {
        name: "manifest.json",
        compression: 0,
        start() { file.ondata?.(new Error("synthetic inflater failure"), new Uint8Array(), true); },
      };
      this.onFile(file);
    }
  }

  return { ...actual, Zip: TestZip, Unzip: FailingUnzip };
});

const PROJECT_ID = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const STYLE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const TIME = "2026-09-24T16:00:00.000Z";

function packageSnapshot() {
  const migrated = migrateLegacySaveFile({
    json: serialize(STANDARD_M, "#3A4150"), projectId: PROJECT_ID, styleId: STYLE_ID, migratedAt: TIME,
  });
  if (!migrated.ok) throw new Error(migrated.error);
  return { project: migrated.value.project, styles: [migrated.value.style], recoveries: [] };
}

const noAssets: ArtworkAssetStore = {
  put: async () => undefined,
  get: async () => null,
  remove: async () => undefined,
};

function emptyManifestZip(): Blob {
  const name = new TextEncoder().encode("manifest.json");
  const descriptorOffset = 30 + name.length;
  const centralOffset = descriptorOffset + 16;
  const centralSize = 46 + name.length;
  const eocdOffset = centralOffset + centralSize;
  const bytes = new Uint8Array(eocdOffset + 22);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0008, true);
  view.setUint16(26, name.length, true);
  bytes.set(name, 30);
  view.setUint32(descriptorOffset, 0x08074b50, true);

  view.setUint32(centralOffset, 0x02014b50, true);
  view.setUint16(centralOffset + 4, 20, true);
  view.setUint16(centralOffset + 6, 20, true);
  view.setUint16(centralOffset + 8, 0x0008, true);
  view.setUint16(centralOffset + 28, name.length, true);
  view.setUint32(centralOffset + 42, 0, true);
  bytes.set(name, centralOffset + 46);

  view.setUint32(eocdOffset, 0x06054b50, true);
  view.setUint16(eocdOffset + 8, 1, true);
  view.setUint16(eocdOffset + 10, 1, true);
  view.setUint32(eocdOffset + 12, centralSize, true);
  view.setUint32(eocdOffset + 16, centralOffset, true);
  return new Blob([bytes]);
}

afterEach(() => {
  mockState.mode = "";
  mockState.terminated = false;
});

describe("project package streaming failure gates", () => {
  it("surfaces the ZIP writer error without accepting a partial archive", async () => {
    mockState.mode = "writer-error";
    await expect(createProjectPackage(packageSnapshot(), noAssets, { crypto: webcrypto as unknown as Crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: "synthetic ZIP writer failure" });
  });

  it("ignores late ZIP chunks after the writer has already failed", async () => {
    mockState.mode = "writer-error-followup";
    await expect(createProjectPackage(packageSnapshot(), noAssets, { crypto: webcrypto as unknown as Crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: "synthetic ZIP writer failure" });
  });

  it("terminates the ZIP writer when generated archive bytes exceed the hard cap", async () => {
    mockState.mode = "archive-limit";
    await expect(createProjectPackage(packageSnapshot(), noAssets, { crypto: webcrypto as unknown as Crypto }))
      .rejects.toMatchObject({ code: "limit-exceeded", message: expect.stringContaining("archive limit") });
    expect(mockState.terminated).toBe(true);
  });

  it("wraps a streaming inflater failure as an invalid package", async () => {
    mockState.mode = "inflate-error";
    await expect(readProjectPackage(emptyManifestZip(), { crypto: webcrypto as unknown as Crypto }))
      .rejects.toMatchObject({ code: "invalid-package", message: expect.stringContaining("synthetic inflater failure") });
  });
});
