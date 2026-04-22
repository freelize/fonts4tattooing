"use client";

import { useEffect } from "react";

export type LoadableFont = { name: string; file: string };

const STYLE_TAG_ID = "f4t-fontfaces-style";
const injectedFamilies = new Set<string>();

function ensureFontFaceStyleTag(): HTMLStyleElement | null {
  if (typeof document === "undefined") return null;
  let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = STYLE_TAG_ID;
    document.head.appendChild(tag);
  }
  return tag;
}

function extToFormat(file: string): string | null {
  const ext = (file.split(".").pop() || "").split("?")[0].toLowerCase();
  if (ext === "ttf") return "truetype";
  if (ext === "otf") return "opentype";
  if (ext === "woff2") return "woff2";
  if (ext === "woff") return "woff";
  return null;
}

function injectFontFace(name: string, file: string) {
  if (injectedFamilies.has(name)) return;
  const tag = ensureFontFaceStyleTag();
  if (!tag) return;
  const familyEsc = name.replace(/([\\"'])/g, "\\$1");
  const fmt = extToFormat(file);
  // Single @font-face rule: browser will synth bold/italic as fallback.
  // Emitting 4 rules pointing to the SAME file is wasteful and can confuse
  // html-to-image font embedding.
  const rule = `@font-face{font-family:"${familyEsc}";src:url("${file}")${
    fmt ? ` format("${fmt}")` : ""
  };font-weight:100 900;font-style:normal;font-display:swap;}`;
  tag.appendChild(document.createTextNode(rule));
  injectedFamilies.add(name);
}

/**
 * Load a single font lazily and inject an @font-face rule.
 * Pass null to skip (useful before the card has been scrolled into view).
 */
export function useLazyFont(font: LoadableFont | null): void {
  useEffect(() => {
    if (!font) return;
    // Single source of truth: inject a CSS @font-face rule with
    // font-display:swap. The browser will fetch the file lazily when
    // a node uses that family. We deliberately avoid creating a
    // second FontFace via the API: it caused duplicate downloads on
    // some mobile browsers and raced against document.fonts.load.
    injectFontFace(font.name, font.file);
  }, [font?.name, font?.file]);
}

/**
 * Legacy: batch preload multiple fonts at once. Retained for compatibility,
 * but prefer `useLazyFont` inside a component that enters the viewport.
 */
export function useFontLoader(fonts: LoadableFont[]) {
  useEffect(() => {
    fonts.forEach((f) => injectFontFace(f.name, f.file));
  }, [fonts.map((f) => `${f.name}|${f.file}`).join("|")]);
}

/** Avoid warming thousands of files when the grid shows "tutti". */
const MAX_WARMUP_FAMILIES = 72;

type DocWithFontsLoad = Document & {
  fonts?: { load: (desc: string) => Promise<FontFace[]> };
};

/**
 * Compromise between global preload (bb34648) and pure lazy cards: register
 * @font-face for the current page slice and kick document.fonts.load for the
 * usual preview styles so scroll/repaint hits warmed faces and FOUT drops.
 */
export function usePaginatedFontWarmup(
  fonts: LoadableFont[],
  previewSizePx: number
): void {
  const serialized = fonts.map((f) => `${f.name}\0${f.file}`).join("\x1e");

  useEffect(() => {
    if (typeof document === "undefined" || !fonts.length) return;

    const capped =
      fonts.length > MAX_WARMUP_FAMILIES
        ? fonts.slice(0, MAX_WARMUP_FAMILIES)
        : fonts;

    const byName = new Map<string, LoadableFont>();
    for (const f of capped) {
      if (!byName.has(f.name)) byName.set(f.name, f);
    }
    const list = Array.from(byName.values());
    list.forEach((f) => injectFontFace(f.name, f.file));

    const doc = document as DocWithFontsLoad;
    if (!doc.fonts?.load) return;

    const px = Math.max(1, Math.round(previewSizePx));
    const loads: Array<Promise<FontFace[]>> = [];
    for (const f of list) {
      const esc = f.name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      const fam = `"${esc}"`;
      loads.push(doc.fonts.load(`normal 400 ${px}px ${fam}`));
      loads.push(doc.fonts.load(`italic 400 ${px}px ${fam}`));
      loads.push(doc.fonts.load(`normal 700 ${px}px ${fam}`));
      loads.push(doc.fonts.load(`italic 700 ${px}px ${fam}`));
    }
    void Promise.allSettled(loads);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `serialized` fingerprints `fonts`
  }, [serialized, previewSizePx]);
}
