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
    let cancelled = false;

    (async () => {
      try {
        injectFontFace(font.name, font.file);
        if (typeof FontFace !== "undefined") {
          const face = new FontFace(font.name, `url(${font.file})`, { display: "swap" });
          await face.load();
          if (!cancelled) {
            type DocFonts = Document & { fonts?: { add: (f: FontFace) => void } };
            (document as DocFonts).fonts?.add(face);
          }
        }
      } catch {
        // swallow font-specific load errors
      }
    })();

    return () => { cancelled = true; };
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
