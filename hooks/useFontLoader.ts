"use client";

import { useEffect } from "react";

export type LoadableFont = { name: string; file: string };

function ensureFontFaceStyleTag(): HTMLStyleElement {
  const id = "f4t-fontfaces-style";
  let tag = document.getElementById(id) as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = id;
    document.head.appendChild(tag);
  }
  return tag;
}

function extToFormat(file: string): string | null {
  const ext = (file.split(".").pop() || "").toLowerCase();
  if (ext === "ttf") return "truetype";
  if (ext === "otf") return "opentype";
  if (ext === "woff2") return "woff2";
  if (ext === "woff") return "woff";
  return null;
}

export function useFontLoader(fonts: LoadableFont[]) {
  useEffect(() => {
    let cancelled = false;

    async function loadFonts() {
      const styleTag = typeof document !== "undefined" ? ensureFontFaceStyleTag() : null;
      const existing = new Set<string>(
        (styleTag?.textContent || "")
          .split("@font-face")
          .map((s) => (s.match(/font-family:\s*['\"]([^'\"]+)['\"]/i)?.[1] || ""))
          .filter(Boolean)
      );

      const promises = fonts.map(async (f) => {
        try {
          const face = new FontFace(f.name, `url(${f.file})`, { display: "swap" });
          await face.load();
          if (!cancelled) {
            (document as any).fonts?.add(face);
          }
          // Also inject @font-face so html-to-image can embed it
          if (styleTag) {
            const fam = f.name;
            if (!existing.has(fam)) {
              const fmt = extToFormat(f.file);
              const familyEsc = fam.replace(/([\\"'])/g, "\\$1");
              const variants = [
                { weight: 400 as const, style: "normal" as const },
                { weight: 700 as const, style: "normal" as const },
                { weight: 400 as const, style: "italic" as const },
                { weight: 700 as const, style: "italic" as const },
              ];
              for (const v of variants) {
                const rule = `@font-face{font-family:"${familyEsc}";src:url("${f.file}")${fmt ? ` format("${fmt}")` : ""};font-weight:${v.weight};font-style:${v.style};font-display:swap;}`;
                styleTag.appendChild(document.createTextNode(rule));
              }
              existing.add(fam);
            }
          }
        } catch (e) {
          // ignore loading failure of specific font
        }
      });
      await Promise.all(promises);
    }

    if (fonts.length > 0) loadFonts();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fonts.map((f) => `${f.name}|${f.file}`).join("|")]);
}