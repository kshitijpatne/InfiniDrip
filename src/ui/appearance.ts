export const APPEARANCE_TEXTURES = [
  { id: "smooth", label: "Smooth", detail: "Flat screen cue" },
  { id: "woven", label: "Fine weave", detail: "Crosshatch cue" },
  { id: "rib", label: "Rib", detail: "Directional cue" },
  { id: "heather", label: "Heather", detail: "Soft fleck cue" },
] as const;

export type AppearanceTexture = typeof APPEARANCE_TEXTURES[number]["id"];

export interface Appearance {
  readonly texture: AppearanceTexture;
  readonly shine: number;
}

export const DEFAULT_APPEARANCE: Appearance = { texture: "smooth", shine: 0 };

export interface HslColor {
  readonly h: number;
  readonly s: number;
  readonly l: number;
}

const HEX = /^#[0-9a-f]{6}$/i;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export function normalizeHex(value: string): string | null {
  return HEX.test(value) ? value.toUpperCase() : null;
}

export function hexToHsl(value: string): HslColor | null {
  const normalized = normalizeHex(value);
  if (!normalized) return null;
  const red = parseInt(normalized.slice(1, 3), 16) / 255;
  const green = parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: lightness };
  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue: number;
  if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0);
  else if (max === green) hue = (blue - red) / delta + 2;
  else hue = (red - green) / delta + 4;
  return { h: hue * 60, s: saturation, l: lightness };
}

export function hslToHex(hue: number, saturation: number, lightness: number): string {
  const h = ((hue % 360) + 360) % 360 / 360;
  const s = clamp(saturation, 0, 1);
  const l = clamp(lightness, 0, 1);
  if (s === 0) {
    const gray = Math.round(l * 255).toString(16).padStart(2, "0");
    return `#${gray}${gray}${gray}`.toUpperCase();
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const rgb = [h + 1 / 3, h, h - 1 / 3].map((t) => {
    const wrapped = ((t % 1) + 1) % 1;
    let value: number;
    if (wrapped < 1 / 6) value = p + (q - p) * 6 * wrapped;
    else if (wrapped < 1 / 2) value = q;
    else if (wrapped < 2 / 3) value = p + (q - p) * (2 / 3 - wrapped) * 6;
    else value = p;
    return Math.round(value * 255).toString(16).padStart(2, "0");
  });
  return `#${rgb.join("")}`.toUpperCase();
}

export function parseAppearance(value: unknown): Appearance | null {
  if (value === undefined) return DEFAULT_APPEARANCE;
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const raw = value as { texture?: unknown; shine?: unknown };
  const texture = APPEARANCE_TEXTURES.find((option) => option.id === raw.texture)?.id;
  if (!texture || typeof raw.shine !== "number" || !Number.isFinite(raw.shine) || raw.shine < 0 || raw.shine > 100) return null;
  return { texture, shine: raw.shine };
}

function appearanceDefs(color: string, appearance: Appearance): string {
  const texture = appearance.texture === "smooth" ? "" :
    `<pattern id="appearance-texture" patternUnits="userSpaceOnUse" width="2" height="2">` +
    `<rect width="2" height="2" fill="${color}"/>` +
    (appearance.texture === "woven"
      ? `<path d="M0 0H2 M0 1H2 M0 0V2 M1 0V2" stroke="#FFFFFF" stroke-opacity=".1" stroke-width=".22"/>`
      : appearance.texture === "rib"
        ? `<path d="M.35 0V2 M1.35 0V2" stroke="#FFFFFF" stroke-opacity=".16" stroke-width=".25"/>`
        : `<circle cx=".35" cy=".4" r=".16" fill="#FFFFFF" fill-opacity=".18"/><circle cx="1.4" cy="1.25" r=".12" fill="#000000" fill-opacity=".15"/>`) +
    `</pattern>`;
  const sheen = appearance.shine === 0 ? "" :
    `<linearGradient id="appearance-sheen" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/>` +
    `<stop offset=".5" stop-color="#FFFFFF" stop-opacity=".7"/>` +
    `<stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>` +
    `</linearGradient>`;
  return `<defs>${texture}${sheen}</defs>`;
}

/** Decorates only the assembled screen preview; drafting and export SVGs stay unchanged. */
export function applyAppearanceToSvg(svg: string, color: string, appearance: Appearance): string {
  const normalized = normalizeHex(color);
  if (!normalized || (appearance.texture === "smooth" && appearance.shine === 0)) return svg;
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const surface = new RegExp(`(<(?:path|polygon)\\b[^>]*\\bfill="${escaped}"[^>]*\\/>)`, "g");
  const decorated = svg.replace(surface, (tag) => {
    const base = appearance.texture === "smooth"
      ? tag
      : tag.replace(`fill="${normalized}"`, `fill="url(#appearance-texture)"`);
    if (appearance.shine === 0) return base;
    const overlay = tag.replace(`fill="${normalized}"`, `fill="url(#appearance-sheen)"`)
      .replace(/stroke="[^"]*"/, `stroke="none"`)
      .replace(/\/>$/, ` opacity="${(0.04 + appearance.shine / 300).toFixed(3)}"/>`);
    return `${base}${overlay}`;
  });
  return decorated.replace(/(<svg\b[^>]*>)/, `$1${appearanceDefs(normalized, appearance)}`);
}
