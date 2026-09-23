/** Local artwork validation. Files are decoded/sanitized before reaching storage. */

export const ARTWORK_FILE_LIMITS = Object.freeze({
  fileBytes: 10 * 1024 * 1024,
  svgBytes: 2 * 1024 * 1024,
  rasterDimensionPx: 4096,
  svgElementCount: 10000,
});

export type ArtworkMimeType = "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";

export interface InspectedArtworkFile {
  readonly name: string;
  readonly mimeType: ArtworkMimeType;
  readonly blob: Blob;
  readonly widthPx?: number;
  readonly heightPx?: number;
}

export interface ArtworkFileRuntime {
  readonly createImageBitmap?: typeof createImageBitmap;
  readonly DOMParser?: typeof DOMParser;
  readonly XMLSerializer?: typeof XMLSerializer;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const MIME_BY_EXTENSION: Readonly<Record<string, ArtworkMimeType>> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
};

const SAFE_ELEMENTS = new Set([
  "svg", "g", "defs", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon",
  "title", "desc", "text", "tspan", "linearGradient", "radialGradient", "stop", "clipPath", "mask",
]);
const TEXT_ELEMENTS = new Set(["title", "desc", "text", "tspan"]);
const SAFE_ATTRIBUTES = new Set([
  "xmlns", "id", "viewBox", "preserveAspectRatio", "width", "height", "x", "y", "cx", "cy",
  "r", "rx", "ry", "x1", "y1", "x2", "y2", "fx", "fy", "fr", "d", "points", "fill",
  "fill-rule", "fill-opacity", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
  "stroke-dasharray", "stroke-dashoffset", "stroke-opacity", "opacity", "transform", "offset",
  "stop-color", "stop-opacity", "gradientUnits", "gradientTransform", "spreadMethod", "clipPathUnits",
  "maskUnits", "maskContentUnits", "clip-path", "mask", "vector-effect",
]);
const SVG_ID = /^[A-Za-z_][A-Za-z0-9_.-]{0,127}$/;
const LOCAL_URL = /^url\(#([A-Za-z_][A-Za-z0-9_.-]{0,127})\)$/;
const GENERIC_VALUE = /^[A-Za-z0-9_.,%+\-#()\s]+$/;
const PATH_VALUE = /^[A-Za-z0-9_.,+\-\s]+$/;

function normalizedFileName(name: string): string {
  const pieces = name.split(/[\\/]/);
  const leaf = pieces[pieces.length - 1]!;
  const safe = leaf.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 180);
  return safe;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot + 1).toLowerCase();
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

function sniffRasterMime(bytes: Uint8Array): ArtworkMimeType | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (bytes.length >= 12 && startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
      startsWith(bytes.subarray(8), [0x57, 0x45, 0x42, 0x50])) return "image/webp";
  return null;
}

function rasterExtensionMatches(extension: string, mimeType: ArtworkMimeType): boolean {
  return MIME_BY_EXTENSION[extension] === mimeType;
}

function parsedSvg(source: string, Parser: typeof DOMParser): XMLDocument {
  if (/<!\s*(?:DOCTYPE|ENTITY)|<\?xml-stylesheet/i.test(source)) {
    throw new Error("SVG document types, entities, and stylesheet links are not allowed.");
  }
  const document = new Parser().parseFromString(source, "image/svg+xml");
  if (document.doctype || document.getElementsByTagName("parsererror").length > 0) {
    throw new Error("SVG is not well-formed XML. Repair it and try again.");
  }
  const root = document.documentElement;
  if (root.localName !== "svg" || root.namespaceURI !== SVG_NS) {
    throw new Error("Choose a valid SVG image with an SVG root element.");
  }
  return document;
}

function svgIds(document: XMLDocument): Set<string> {
  const ids = new Set<string>();
  const elements = [...document.getElementsByTagName("*")];
  if (elements.length > ARTWORK_FILE_LIMITS.svgElementCount) {
    throw new Error(`SVG has too many elements (maximum ${ARTWORK_FILE_LIMITS.svgElementCount}).`);
  }
  for (const element of elements) {
    const id = element.getAttribute("id");
    if (id === null) continue;
    if (!SVG_ID.test(id) || ids.has(id)) throw new Error("SVG contains an invalid or duplicate internal ID.");
    ids.add(id);
  }
  return ids;
}

function safeSvgAttribute(name: string, value: string, ids: ReadonlySet<string>, root: boolean): boolean {
  if (!SAFE_ATTRIBUTES.has(name)) return false;
  if (name === "xmlns") return root && value === SVG_NS;
  if (name === "id") return SVG_ID.test(value);
  if (["fill", "stroke", "clip-path", "mask"].includes(name) && value.startsWith("url(")) {
    const match = LOCAL_URL.exec(value.trim());
    return match !== null && ids.has(match[1]!);
  }
  if (["d", "points"].includes(name)) return PATH_VALUE.test(value);
  if (name === "stroke-linecap") return ["butt", "round", "square"].includes(value);
  if (name === "stroke-linejoin") return ["miter", "round", "bevel"].includes(value);
  if (name === "fill-rule") return ["nonzero", "evenodd"].includes(value);
  if (name === "spreadMethod") return ["pad", "reflect", "repeat"].includes(value);
  if (["gradientUnits", "clipPathUnits", "maskUnits", "maskContentUnits"].includes(name)) {
    return ["userSpaceOnUse", "objectBoundingBox"].includes(value);
  }
  return GENERIC_VALUE.test(value) && !/(?:javascript|https?|data|file):|\/\//i.test(value);
}

function copySvgElement(
  source: Element,
  target: Element,
  ids: ReadonlySet<string>,
  document: XMLDocument,
): void {
  if (!SAFE_ELEMENTS.has(source.localName)) {
    const name = source.localName.toLowerCase();
    if (["script"].includes(name)) throw new Error("SVG scripts are not allowed.");
    if (["animate", "animatemotion", "animatetransform", "set"].includes(name)) {
      throw new Error("SVG animation is not allowed.");
    }
    if (name === "a") throw new Error("SVG links are not allowed.");
    if (name === "foreignobject") throw new Error("Embedded HTML is not allowed in SVG artwork.");
    throw new Error(`SVG element <${source.localName}> is not supported by the safe static-artwork importer.`);
  }
  const root = source.localName === "svg";
  const names = new Set<string>();
  for (const attribute of [...source.attributes]) {
    const name = attribute.name;
    if (!safeSvgAttribute(name, attribute.value, ids, root)) {
      if (name.toLowerCase().startsWith("on")) throw new Error("SVG event-handler scripts are not allowed.");
      if (["href", "xlink:href"].includes(name.toLowerCase())) {
        throw new Error("SVG links and external references are not allowed.");
      }
      if (name === "style") throw new Error("SVG CSS/style attributes are not allowed; convert artwork to static paths.");
      throw new Error(`SVG attribute ${name} is not supported by the safe static-artwork importer.`);
    }
    names.add(name);
  }
  for (const attribute of [...source.attributes]) {
    // createDocument creates the root namespace declaration itself. Copying
    // that declaration again creates duplicate xmlns attributes in XML output.
    if (root && attribute.name === "xmlns") continue;
    target.setAttribute(attribute.name, attribute.value);
  }

  for (const child of [...source.childNodes]) {
    if (child.nodeType === 1) {
      const element = child as Element;
      if (element.namespaceURI !== SVG_NS) throw new Error("SVG contains an unexpected XML namespace.");
      const safeChild = document.createElementNS(SVG_NS, element.localName);
      copySvgElement(element, safeChild, ids, document);
      target.appendChild(safeChild);
    } else if (child.nodeType === 3) {
      const text = child.nodeValue as string;
      if (text.trim() !== "" && !TEXT_ELEMENTS.has(source.localName)) {
        throw new Error("Text is only allowed inside SVG title, description, or text elements.");
      }
      if (text !== "") target.appendChild(document.createTextNode(text));
    } else if (child.nodeType === 7 || child.nodeType === 4) {
      throw new Error("SVG processing instructions and CDATA sections are not allowed.");
    }
  }
}

export function sanitizeSvg(source: string, runtime: ArtworkFileRuntime = {}): string {
  const Parser = runtime.DOMParser ?? globalThis.DOMParser;
  const Serializer = runtime.XMLSerializer ?? globalThis.XMLSerializer;
  if (!Parser || !Serializer) throw new Error("This browser cannot safely inspect SVG artwork.");
  const parsed = parsedSvg(source, Parser);
  const ids = svgIds(parsed);
  const sanitized = parsed.implementation.createDocument(SVG_NS, "svg", null);
  copySvgElement(parsed.documentElement, sanitized.documentElement, ids, sanitized);
  return new Serializer().serializeToString(sanitized);
}

function svgPixelDimension(value: string | null): number | undefined {
  if (value === null || !/^\d+(?:\.\d+)?(?:px)?$/i.test(value.trim())) return undefined;
  const dimension = Number(value.trim().replace(/px$/i, ""));
  return Number.isFinite(dimension) && dimension > 0 ? dimension : undefined;
}

async function bitmapDimensions(blob: Blob, runtime: ArtworkFileRuntime): Promise<{ width: number; height: number }> {
  const decode = runtime.createImageBitmap ?? globalThis.createImageBitmap;
  if (!decode) throw new Error("This browser cannot decode the selected artwork image.");
  let bitmap: ImageBitmap | undefined;
  let width = 0;
  let height = 0;
  try {
    bitmap = await decode(blob);
    if (!Number.isInteger(bitmap.width) || !Number.isInteger(bitmap.height) || bitmap.width <= 0 || bitmap.height <= 0) {
      throw new Error("Image dimensions are invalid.");
    }
    width = bitmap.width;
    height = bitmap.height;
  } catch (error) {
    bitmap?.close?.();
    if (error instanceof Error && error.message === "Image dimensions are invalid.") throw error;
    throw new Error("Artwork could not be decoded as a complete supported image.");
  }
  bitmap?.close?.();
  return { width, height };
}

/** Check extension, signature, decoded dimensions, file size, and SVG safety. */
export async function inspectArtworkFile(
  file: File,
  runtime: ArtworkFileRuntime = {},
): Promise<InspectedArtworkFile> {
  if (file.size <= 0) throw new Error("Choose a non-empty artwork file.");
  if (file.size > ARTWORK_FILE_LIMITS.fileBytes) throw new Error("Artwork files must be 10 MB or smaller.");
  const extension = extensionOf(file.name);
  const extensionMime = MIME_BY_EXTENSION[extension];
  if (!extensionMime) throw new Error("Unsupported artwork type. Choose PNG, JPEG, WebP, or SVG.");
  const name = normalizedFileName(file.name);
  if (extensionMime === "image/svg+xml") {
    if (file.size > ARTWORK_FILE_LIMITS.svgBytes) throw new Error("SVG source files must be 2 MB or smaller.");
    if (file.type && file.type !== "image/svg+xml" && file.type !== "application/octet-stream") {
      throw new Error("The selected file type does not match its .svg extension.");
    }
    const sanitized = sanitizeSvg(await file.text(), runtime);
    const root = new (runtime.DOMParser ?? globalThis.DOMParser)().parseFromString(sanitized, "image/svg+xml").documentElement;
    return {
      name,
      mimeType: "image/svg+xml",
      blob: new Blob([sanitized], { type: "image/svg+xml" }),
      ...(svgPixelDimension(root.getAttribute("width")) === undefined ? {} : { widthPx: svgPixelDimension(root.getAttribute("width"))! }),
      ...(svgPixelDimension(root.getAttribute("height")) === undefined ? {} : { heightPx: svgPixelDimension(root.getAttribute("height"))! }),
    };
  }
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const sniffedMime = sniffRasterMime(bytes);
  if (sniffedMime === null || sniffedMime !== extensionMime || !rasterExtensionMatches(extension, sniffedMime)) {
    throw new Error("The file extension and image contents do not match a supported format.");
  }
  if (file.type && file.type !== sniffedMime && file.type !== "application/octet-stream") {
    throw new Error("The browser-reported file type does not match the image contents.");
  }
  const dimensions = await bitmapDimensions(file, runtime);
  if (dimensions.width > ARTWORK_FILE_LIMITS.rasterDimensionPx || dimensions.height > ARTWORK_FILE_LIMITS.rasterDimensionPx) {
    throw new Error("Raster images must be no larger than 4096 px in either dimension.");
  }
  return { name, mimeType: sniffedMime, blob: file.slice(0, file.size, sniffedMime), widthPx: dimensions.width, heightPx: dimensions.height };
}
