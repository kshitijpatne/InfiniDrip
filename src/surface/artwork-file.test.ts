// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { File as NodeFile } from "node:buffer";
import { ARTWORK_FILE_LIMITS, inspectArtworkFile, sanitizeSvg, type ArtworkFileRuntime } from "./artwork-file";

const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const webpHeader = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const svg = (inner: string, attrs = ""): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 30" ${attrs}>${inner}</svg>`;
const file = (name: string, bytes: BlobPart, type = ""): File =>
  new NodeFile([bytes as unknown as import("node:buffer").BlobPart], name, { type }) as unknown as File;

function bitmapRuntime(width = 20, height = 30): ArtworkFileRuntime {
  return {
    createImageBitmap: vi.fn(async () => ({ width, height, close: vi.fn() } as unknown as ImageBitmap)),
  };
}

describe("inspectArtworkFile", () => {
  it.each([
    ["shirt.png", pngHeader, "image/png"],
    ["shirt.jpg", jpegHeader, "image/jpeg"],
    ["shirt.jpeg", jpegHeader, "image/jpeg"],
    ["shirt.webp", webpHeader, "image/webp"],
  ] as const)("accepts a signed and decodable %s image", async (name, bytes, mimeType) => {
    const runtime = bitmapRuntime();
    const result = await inspectArtworkFile(file(name, bytes, mimeType), runtime);
    expect(result.mimeType).toBe(mimeType);
    expect(result.name).toBe(name);
    expect(result.widthPx).toBe(20);
    expect(result.heightPx).toBe(30);
    expect(result.blob.type).toBe(mimeType);
    expect(runtime.createImageBitmap).toHaveBeenCalledOnce();
  });

  it("normalizes path-like names and accepts a blank or generic browser MIME after signature checks", async () => {
    const result = await inspectArtworkFile(file("C:\\fakepath\\print.PNG", pngHeader, "application/octet-stream"), bitmapRuntime());
    expect(result.name).toBe("print.PNG");
    expect(result.mimeType).toBe("image/png");
    expect((await inspectArtworkFile(file("print.png", pngHeader), bitmapRuntime())).name).toBe("print.png");
  });

  it("rejects empty and extensionless names without attempting to decode them", async () => {
    await expect(inspectArtworkFile(file("", pngHeader), bitmapRuntime())).rejects.toThrow("Unsupported artwork type");
    await expect(inspectArtworkFile(file("pattern", pngHeader), bitmapRuntime())).rejects.toThrow("Unsupported artwork type");
  });

  it("rejects empty, oversized, and unsupported files", async () => {
    await expect(inspectArtworkFile(file("empty.png", new Uint8Array()), bitmapRuntime())).rejects.toThrow("non-empty");
    await expect(inspectArtworkFile(file("huge.png", new Uint8Array(ARTWORK_FILE_LIMITS.fileBytes + 1)), bitmapRuntime())).rejects.toThrow("10 MB");
    await expect(inspectArtworkFile(file("notes.gif", pngHeader), bitmapRuntime())).rejects.toThrow("Unsupported artwork type");
  });

  it("rejects mismatched signature and reported image type", async () => {
    await expect(inspectArtworkFile(file("wrong.png", jpegHeader, "image/jpeg"), bitmapRuntime())).rejects.toThrow("extension and image contents");
    await expect(inspectArtworkFile(file("wrong.png", pngHeader, "image/jpeg"), bitmapRuntime())).rejects.toThrow("reported file type");
    await expect(inspectArtworkFile(file("short.webp", webpHeader.subarray(0, 11), "image/webp"), bitmapRuntime()))
      .rejects.toThrow("extension and image contents");
  });

  it("rejects undecodable and invalid-dimension rasters and enforces the maximum edge", async () => {
    await expect(inspectArtworkFile(file("broken.png", pngHeader), {})).rejects.toThrow("cannot decode");
    await expect(inspectArtworkFile(file("broken.png", pngHeader), {
      createImageBitmap: vi.fn(async () => { throw new Error("decode"); }),
    })).rejects.toThrow("could not be decoded");
    await expect(inspectArtworkFile(file("zero.png", pngHeader), bitmapRuntime(0, 3))).rejects.toThrow("dimensions are invalid");
    await expect(inspectArtworkFile(file("wide.webp", webpHeader), bitmapRuntime(4097, 1))).rejects.toThrow("4096 px");
  });

  it("closes a successfully decoded bitmap", async () => {
    const close = vi.fn();
    await inspectArtworkFile(file("shirt.png", pngHeader), {
      createImageBitmap: vi.fn(async () => ({ width: 1, height: 1, close } as unknown as ImageBitmap)),
    });
    expect(close).toHaveBeenCalledOnce();
  });

  it("accepts decoded bitmaps without an optional close method", async () => {
    const result = await inspectArtworkFile(file("shirt.png", pngHeader), {
      createImageBitmap: vi.fn(async () => ({ width: 12, height: 14 } as ImageBitmap)),
    });
    expect(result).toMatchObject({ widthPx: 12, heightPx: 14 });
  });

  it("accepts static SVG, sanitizes it, and retains explicit pixel dimensions", async () => {
    const safe = svg('<path d="M0 0L10 10" fill="#abc"/><title>Leaf</title>', 'width="400" height="300"');
    const result = await inspectArtworkFile(file("leaf.svg", safe, "image/svg+xml"));
    expect(sanitizeSvg(safe)).toContain('width="400"');
    expect(result.mimeType).toBe("image/svg+xml");
    expect(result.widthPx).toBe(400);
    expect(result.heightPx).toBe(300);
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it("leaves unknown, non-pixel, zero, and non-finite SVG dimensions unset", async () => {
    const unknown = await inspectArtworkFile(file("unknown.svg", svg("<path d=\"M0 0\"/>"), "image/svg+xml"));
    expect(unknown).not.toHaveProperty("widthPx");
    expect(unknown).not.toHaveProperty("heightPx");

    const invalid = await inspectArtworkFile(file("invalid.svg", svg("<path d=\"M0 0\"/>", 'width="50%" height="0"'), "image/svg+xml"));
    expect(invalid).not.toHaveProperty("widthPx");
    expect(invalid).not.toHaveProperty("heightPx");

    const nonFinite = await inspectArtworkFile(file("large-dimension.svg", svg("<path d=\"M0 0\"/>", `width="${"9".repeat(400)}" height="1"`), "image/svg+xml"));
    expect(nonFinite).not.toHaveProperty("widthPx");
    expect(nonFinite.heightPx).toBe(1);
  });

  it("fails closed when the browser XML parser is unavailable", () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, "DOMParser");
    Object.defineProperty(globalThis, "DOMParser", { configurable: true, value: undefined });
    try {
      expect(() => sanitizeSvg(svg("<path d=\"M0 0\"/>"))).toThrow("cannot safely inspect SVG");
    } finally {
      if (previous) Object.defineProperty(globalThis, "DOMParser", previous);
      else Reflect.deleteProperty(globalThis, "DOMParser");
    }
  });

  it("accepts internal gradient references but rejects invalid internal links", () => {
    const gradient = svg('<defs><linearGradient id="ink"><stop offset="0" stop-color="#123"/></linearGradient></defs><rect width="10" height="10" fill="url(#ink)"/>');
    expect(sanitizeSvg(gradient)).toContain("url(#ink)");
    expect(() => sanitizeSvg(svg('<rect fill="url(#missing)"/>'))).toThrow("attribute fill");
    expect(() => sanitizeSvg(svg('<rect fill="url(https://example.test/a)"/>'))).toThrow("attribute fill");
  });

  it.each([
    ["script", "<script>alert(1)</script>", "scripts"],
    ["animation", "<animate attributeName=\"x\"/>", "animation"],
    ["link", "<a href=\"https://example.test\"><path d=\"M0 0\"/></a>", "links"],
    ["embedded HTML", "<foreignObject><div/></foreignObject>", "Embedded HTML"],
    ["embedded image", "<image href=\"https://example.test/a.png\"/>", "not supported"],
  ])("rejects SVG %s elements", (_label, inner, message) => {
    expect(() => sanitizeSvg(svg(inner))).toThrow(message);
  });

  it.each([
    ["event handlers", '<path d="M0 0" onload="alert(1)"/>', "event-handler"],
    ["external href", '<path d="M0 0" href="https://example.test/a.svg#x"/>', "links and external references"],
    ["inline styles", '<path d="M0 0" style="fill:red"/>', "CSS/style"],
    ["unknown attributes", '<path d="M0 0" data-x="1"/>', "attribute data-x"],
    ["external CSS values", '<path d="M0 0" fill="url(javascript:alert(1))"/>', "attribute fill"],
    ["invalid path data", '<path d="javascript:alert(1)"/>', "attribute d"],
  ])("rejects SVG %s", (_label, inner, message) => {
    expect(() => sanitizeSvg(svg(inner))).toThrow(message);
  });

  it("validates allowed static SVG attribute values", () => {
    expect(sanitizeSvg(svg('<path d="M0 0" stroke-linecap="round" stroke-linejoin="bevel" fill-rule="evenodd"/>'))).toContain("stroke-linecap");
    expect(() => sanitizeSvg(svg('<path d="M0 0" stroke-linecap="triangle"/>'))).toThrow("stroke-linecap");
    expect(() => sanitizeSvg(svg('<path d="M0 0" stroke-linejoin="sharp"/>'))).toThrow("stroke-linejoin");
    expect(() => sanitizeSvg(svg('<path d="M0 0" fill-rule="winding"/>'))).toThrow("fill-rule");
    expect(sanitizeSvg(svg('<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" spreadMethod="reflect"><stop offset="0"/></linearGradient></defs>'))).toContain("spreadMethod");
    expect(() => sanitizeSvg(svg('<defs><linearGradient id="g" spreadMethod="march"/></defs>'))).toThrow("spreadMethod");
    expect(() => sanitizeSvg(svg('<defs><clipPath id="c" clipPathUnits="pixel"/></defs>'))).toThrow("clipPathUnits");
  });

  it("rejects malformed XML, declarations, invalid roots, namespaces, and text outside text elements", () => {
    expect(() => sanitizeSvg("<svg")).toThrow("well-formed XML");
    expect(() => sanitizeSvg('<!DOCTYPE svg><svg xmlns="http://www.w3.org/2000/svg"/>')).toThrow("document types");
    expect(() => sanitizeSvg('<html xmlns="http://www.w3.org/1999/xhtml"/>')).toThrow("SVG root");
    expect(() => sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg"><g xmlns="urn:other"/></svg>')).toThrow("unexpected XML namespace");
    expect(() => sanitizeSvg(svg("unsafe text"))).toThrow("only allowed inside");
    expect(() => sanitizeSvg(svg("<![CDATA[unsafe]]>"))).toThrow("CDATA");
  });

  it("rejects invalid and duplicate IDs, non-root namespace attributes, and excessive SVG structure", () => {
    expect(() => sanitizeSvg(svg('<g id="bad id"/>'))).toThrow("invalid or duplicate");
    expect(() => sanitizeSvg(svg('<g id="same"/><path id="same" d="M0 0"/>'))).toThrow("invalid or duplicate");
    expect(() => sanitizeSvg(svg('<g xmlns="http://www.w3.org/2000/svg"/>'))).toThrow("attribute xmlns");
    if (process.env.INFINIDRIP_COVERAGE === "1") {
      // The ordinary suite parses the real 10,001-node hostile SVG below.
      // Under instrumentation, return the same oversized parser result without
      // paying the coverage-amplified XML tree allocation cost.
      const element = { getAttribute: () => null };
      const excessElements = Array.from({ length: ARTWORK_FILE_LIMITS.svgElementCount + 1 }, () => element);
      const Parser = class {
        parseFromString() {
          return {
            doctype: null,
            documentElement: { localName: "svg", namespaceURI: "http://www.w3.org/2000/svg" },
            getElementsByTagName: (name: string) => name === "parsererror" ? [] : excessElements,
          };
        }
      } as unknown as typeof DOMParser;
      const Serializer = class {
        serializeToString(): string { return ""; }
      } as unknown as typeof XMLSerializer;
      expect(() => sanitizeSvg("<svg/>", { DOMParser: Parser, XMLSerializer: Serializer }))
        .toThrow("too many elements");
    } else {
      const many = `<svg xmlns="http://www.w3.org/2000/svg">${"<g/>".repeat(ARTWORK_FILE_LIMITS.svgElementCount + 1)}</svg>`;
      expect(() => sanitizeSvg(many)).toThrow("too many elements");
    }
  });

  it("rejects unsafe references, SVG MIME mismatches, and SVGs above the source limit", async () => {
    await expect(inspectArtworkFile(file("bad.svg", svg("<script/>"), "image/png"))).rejects.toThrow("does not match");
    await expect(inspectArtworkFile(file("large.svg", new Uint8Array(ARTWORK_FILE_LIMITS.svgBytes + 1), "image/svg+xml"))).rejects.toThrow("2 MB");
    await expect(inspectArtworkFile(file("bad.svg", "<svg", "image/svg+xml"))).rejects.toThrow("well-formed XML");
  });
});
