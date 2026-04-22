"use client";

import React from "react";
import { toPng, toBlob } from "html-to-image";
import { EditorToolbar, type EffectSettings } from "@/components/EditorToolbar";
import { useLazyFont } from "@/hooks/useFontLoader";

type PreviewCardProps = {
  fontId?: string;
  fontName: string;
  fontCssFamily: string;
  fontFile: string;
  text: string;
  premium?: boolean;
  supports?: { bold?: boolean; italic?: boolean };
  baseFontSizePx?: number;
  defaultColor?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  rating?: number;
  reviewsCount?: number;
};

const DEFAULT_EFFECTS: EffectSettings = {
  letterSpacing: 0,
  color: "#111111",
  bold: false,
  italic: false,
  uppercase: false,
  curve: 0,
  curveMode: "none",
  circleRadius: 220,
  circleInvert: false,
  circleStart: 0,
  fontSizePx: undefined,
  // new effects
  outlineEnabled: false,
  outlineWidth: 2,
  outlineColor: "#111111",
  shadowEnabled: false,
  shadowX: 4,
  shadowY: 4,
  shadowBlur: 8,
  shadowColor: "rgba(0,0,0,0.35)",
  glowEnabled: false,
  glowIntensity: 12,
  glowColor: "#ff3b30",
  skinMode: false,
};

export function PreviewCard({
  fontId,
  fontName,
  fontCssFamily,
  fontFile,
  text,
  premium,
  supports,
  baseFontSizePx,
  defaultColor,
  isFavorite,
  onToggleFavorite,
  rating,
  reviewsCount,
}: PreviewCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const uid = React.useId();

  // Lazy load the font only when the card enters the viewport.
  useLazyFont(isVisible ? { name: fontCssFamily, file: fontFile } : null);
  const fontReady = useFontFaceReady(isVisible ? fontCssFamily : null);

  // IntersectionObserver: mark visible once, stay visible.
  React.useEffect(() => {
    if (!cardRef.current || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const el = cardRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setIsVisible(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin: "300px 0px", threshold: 0.01 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const base = baseFontSizePx ?? 56;
  const [settings, setSettings] = React.useState<EffectSettings>({
    ...DEFAULT_EFFECTS,
    color: defaultColor ?? DEFAULT_EFFECTS.color,
  });
  const colorTouchedRef = React.useRef(false);
  const [toolsOpen, setToolsOpen] = React.useState(false);

  const handleReset = () => {
    setSettings({ ...DEFAULT_EFFECTS, color: defaultColor ?? DEFAULT_EFFECTS.color });
    colorTouchedRef.current = false;
  };

  const fs = settings.fontSizePx ?? base;

  React.useEffect(() => {
    if (!colorTouchedRef.current && defaultColor && defaultColor !== settings.color) {
      setSettings((s) => ({ ...s, color: defaultColor }));
    }
  }, [defaultColor, settings.color]);

  const onDownload = async () => {
    if (premium) return;
    if (!previewRef.current) return;

    try {
      const weight = settings.bold ? 700 : 400;
      const italic = settings.italic ? "italic " : "";
      const sizePx = Math.max(1, Math.round(fs));
      const family = `"${fontCssFamily}", sans-serif`;

      type DocWithFonts = Document & {
        fonts?: { load: (font: string) => Promise<void>; ready: Promise<void> };
      };
      const doc = document as DocWithFonts;
      if (doc.fonts?.load) {
        try { await doc.fonts.load(`${italic}${weight} ${sizePx}px ${family}`); } catch {}
        try { await doc.fonts.ready; } catch {}
      }
      await new Promise((resolve) => setTimeout(resolve, 120));
    } catch {}

    const node = previewRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    const options = {
      backgroundColor: settings.skinMode ? "#f2d7c4" : "white",
      pixelRatio: 3,
      canvasWidth: width * 3,
      canvasHeight: height * 3,
      style: { width: `${width}px`, height: `${height}px` },
      // Do NOT bust cache: fonts are immutable and re-fetching them is wasteful.
      cacheBust: false,
    };

    try {
      try { await toPng(node, { ...options, pixelRatio: 1 }); } catch {}
      const blob = await toBlob(node, options);
      if (!blob) throw new Error("Blob creation failed");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${fontName.replace(/\s+/g, "_")}_preview.png`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Failed to generate preview", err);
    }
  };

  // Build text-shadow CSS combining drop shadow and glow.
  const buildTextShadow = (): string | undefined => {
    const parts: string[] = [];
    if (settings.shadowEnabled) {
      parts.push(
        `${settings.shadowX}px ${settings.shadowY}px ${settings.shadowBlur}px ${settings.shadowColor}`
      );
    }
    if (settings.glowEnabled) {
      const g = settings.glowIntensity;
      parts.push(`0 0 ${g * 0.5}px ${settings.glowColor}`);
      parts.push(`0 0 ${g}px ${settings.glowColor}`);
      parts.push(`0 0 ${g * 1.5}px ${settings.glowColor}`);
    }
    return parts.length ? parts.join(", ") : undefined;
  };

  const outlineStyle: React.CSSProperties = settings.outlineEnabled
    ? {
        WebkitTextStroke: `${settings.outlineWidth}px ${settings.outlineColor}`,
        color: "transparent",
      }
    : {};

  const baseStyle: React.CSSProperties = {
    fontFamily: `"${fontCssFamily}", "Noto Sans CJK SC", "Noto Sans CJK TC", "Noto Sans CJK JP", "Noto Sans CJK KR", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Heiti SC", "WenQuanYi Micro Hei", sans-serif`,
    letterSpacing: `${settings.letterSpacing}px`,
    color: settings.color,
    fontWeight: settings.bold ? 700 : 400,
    fontStyle: settings.italic ? "italic" : "normal",
    fontSize: fs,
    lineHeight: 1.1,
    textShadow: buildTextShadow(),
    ...outlineStyle,
  };

  const isArc = settings.curveMode === "arc" && settings.curve !== 0;
  const isCircle = settings.curveMode === "circle";
  const curved = isArc || isCircle;

  const rawText = text || "Anteprima";
  const content = settings.uppercase ? rawText.toUpperCase() : rawText;

  const approxCharWidth = fs * 0.6;
  const textLen = content.length;
  const estTextWidth = Math.max(200, textLen * approxCharWidth);

  const arcVbW = estTextWidth + fs * 4;
  const curveHeight = Math.abs(settings.curve * 1.25);
  const arcVbH = curveHeight + fs * 5;
  const arcCx = arcVbW / 2;
  const arcPadX = fs * 2;
  const arcYBase =
    settings.curve >= 0 ? curveHeight + fs * 2.5 : fs * 2.5;
  const arcPathD = `M ${arcPadX} ${arcYBase} Q ${arcCx} ${arcYBase - settings.curve * 2.5} ${arcVbW - arcPadX} ${arcYBase}`;

  const r = settings.circleRadius ?? 220;
  const circleVbSize = r * 2 + fs * 4;
  const c = circleVbSize / 2;
  const sweepFlag = settings.circleInvert ? 0 : 1;
  const circlePathD = `M ${c} ${c - r} A ${r} ${r} 0 1 ${sweepFlag} ${c} ${c + r} A ${r} ${r} 0 1 ${sweepFlag} ${c} ${c - r}`;
  const circleRot = settings.circleStart ?? 0;

  let containerHeightStr = "auto";
  if (isArc) containerHeightStr = "300px";
  else if (isCircle) containerHeightStr = "auto";
  else containerHeightStr = `${Math.max(160, fs * 2)}px`;

  const previewBg = settings.skinMode ? "" : "bg-white";
  const containerStyle: React.CSSProperties = {
    height: isCircle ? "auto" : containerHeightStr,
    width: "100%",
    aspectRatio: isCircle ? "1/1" : undefined,
    fontFamily: `"${fontCssFamily}", sans-serif`,
  };

  const fauxBoldStrokeWidth = settings.bold ? fs * 0.04 : 0;
  const fauxItalicTransform = settings.italic ? "skewX(-15)" : undefined;
  const fontFamilyStr = `"${fontCssFamily}", sans-serif`;

  // SVG text-shadow filter id (per-card unique)
  const filterId = `f4t-filter-${uid.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div
      ref={cardRef}
      className={`premium-card group border border-neutral-200/80 rounded-2xl bg-white overflow-hidden ${
        premium ? "opacity-95" : ""
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100 bg-gradient-to-b from-neutral-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-semibold text-neutral-900 text-[15px] tracking-tight truncate">
            {fontName}
          </h3>
          {premium && (
            <span className="flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-gradient-to-r from-neutral-900 to-neutral-700 text-white px-2 py-0.5 rounded-full shadow-sm">
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z" />
              </svg>
              Premium
            </span>
          )}
        </div>

        {(rating !== undefined || reviewsCount !== undefined) && (
          <div className="flex-shrink-0 flex items-center gap-1 text-xs text-neutral-500 bg-white/70 backdrop-blur px-2 py-1 rounded-full border border-neutral-100">
            <svg className="h-3 w-3 text-amber-400 fill-current" viewBox="0 0 24 24">
              <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <span className="font-semibold text-neutral-800">
              {typeof rating === "number" ? rating.toFixed(1) : ""}
            </span>
            <span className="text-neutral-300">·</span>
            <span>{typeof reviewsCount === "number" ? reviewsCount : ""}</span>
          </div>
        )}
      </div>

      {/* Preview area */}
      <div
        className={`relative px-4 py-6 md:py-10 flex items-center justify-center min-h-[180px] border-b border-neutral-100 ${
          settings.skinMode ? "skin-surface" : previewBg
        }`}
      >
        {!isVisible || !fontReady ? (
          <div className="w-3/4 h-8 rounded-md skeleton-shimmer" aria-label="Caricamento font..." />
        ) : (
          <div
            ref={previewRef}
            className={`flex items-center justify-center w-full ${
              premium ? "pointer-events-none grayscale-[0.3] opacity-85" : ""
            }`}
            style={containerStyle}
          >
            {!curved ? (
              <div style={baseStyle} className="text-center w-full break-words p-4 anim-fade-up">
                {content}
              </div>
            ) : isArc ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${arcVbW} ${arcVbH}`}
                  preserveAspectRatio="xMidYMid meet"
                  overflow="visible"
                >
                  <defs>
                    <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
                      {settings.shadowEnabled && (
                        <feDropShadow
                          dx={settings.shadowX}
                          dy={settings.shadowY}
                          stdDeviation={settings.shadowBlur / 2}
                          floodColor={settings.shadowColor}
                        />
                      )}
                      {settings.glowEnabled && (
                        <feDropShadow
                          dx={0}
                          dy={0}
                          stdDeviation={settings.glowIntensity / 2}
                          floodColor={settings.glowColor}
                        />
                      )}
                    </filter>
                  </defs>
                  <path id={`arcPath-${uid}`} d={arcPathD} fill="none" stroke="none" />
                  <text
                    fill={settings.outlineEnabled ? "none" : settings.color}
                    fontFamily={fontFamilyStr}
                    transform={fauxItalicTransform}
                    style={{
                      fontWeight: settings.bold ? 700 : 400,
                      fontStyle: settings.italic ? "oblique" : "normal",
                      letterSpacing: `${settings.letterSpacing}px`,
                    }}
                    stroke={
                      settings.outlineEnabled
                        ? settings.outlineColor
                        : settings.color
                    }
                    strokeWidth={
                      settings.outlineEnabled
                        ? settings.outlineWidth
                        : fauxBoldStrokeWidth
                    }
                    strokeLinejoin="round"
                    fontSize={fs}
                    dominantBaseline="middle"
                    filter={
                      settings.shadowEnabled || settings.glowEnabled
                        ? `url(#${filterId})`
                        : undefined
                    }
                  >
                    <textPath href={`#arcPath-${uid}`} startOffset="50%" textAnchor="middle">
                      {content}
                    </textPath>
                  </text>
                </svg>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${circleVbSize} ${circleVbSize}`}
                  preserveAspectRatio="xMidYMid meet"
                  overflow="visible"
                >
                  <defs>
                    <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
                      {settings.shadowEnabled && (
                        <feDropShadow
                          dx={settings.shadowX}
                          dy={settings.shadowY}
                          stdDeviation={settings.shadowBlur / 2}
                          floodColor={settings.shadowColor}
                        />
                      )}
                      {settings.glowEnabled && (
                        <feDropShadow
                          dx={0}
                          dy={0}
                          stdDeviation={settings.glowIntensity / 2}
                          floodColor={settings.glowColor}
                        />
                      )}
                    </filter>
                  </defs>
                  <path id={`circlePath-${uid}`} d={circlePathD} fill="none" stroke="none" />
                  <g style={{ transformOrigin: "center", transform: `rotate(${circleRot}deg)` }}>
                    <text
                      fill={settings.outlineEnabled ? "none" : settings.color}
                      fontFamily={fontFamilyStr}
                      transform={fauxItalicTransform}
                      style={{
                        fontWeight: settings.bold ? 700 : 400,
                        fontStyle: settings.italic ? "oblique" : "normal",
                        letterSpacing: `${settings.letterSpacing}px`,
                      }}
                      stroke={
                        settings.outlineEnabled
                          ? settings.outlineColor
                          : settings.color
                      }
                      strokeWidth={
                        settings.outlineEnabled
                          ? settings.outlineWidth
                          : fauxBoldStrokeWidth
                      }
                      strokeLinejoin="round"
                      fontSize={fs}
                      dominantBaseline="auto"
                      filter={
                        settings.shadowEnabled || settings.glowEnabled
                          ? `url(#${filterId})`
                          : undefined
                      }
                    >
                      <textPath href={`#circlePath-${uid}`} startOffset="50%" textAnchor="middle">
                        {content}
                      </textPath>
                    </text>
                  </g>
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Skin mode corner pill */}
        {settings.skinMode && (
          <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest bg-white/80 backdrop-blur text-neutral-700 px-2 py-1 rounded-full border border-neutral-200">
            Skin
          </span>
        )}
      </div>

      {/* Action Bar */}
      <div
        className={`px-3 py-3 border-t border-neutral-100 bg-gradient-to-b from-white to-neutral-50 flex items-center justify-between gap-3 ${
          !toolsOpen ? "rounded-b-2xl" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => fontId && onToggleFavorite?.(fontId)}
          className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
            isFavorite
              ? "bg-amber-50 text-amber-500 ring-1 ring-amber-200"
              : "text-neutral-400 hover:bg-white hover:text-neutral-600 hover:shadow-sm"
          }`}
          title={isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setToolsOpen((o) => !o)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            toolsOpen
              ? "bg-neutral-900 text-white shadow-lg shadow-neutral-900/20"
              : "bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          {toolsOpen ? "Chiudi editor" : "Personalizza"}
        </button>

        <button
          onClick={onDownload}
          disabled={premium}
          className="h-9 w-9 rounded-full flex items-center justify-center text-neutral-500 hover:bg-white hover:text-neutral-900 hover:shadow-sm transition-all disabled:opacity-30"
          title="Scarica anteprima PNG"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>

      {toolsOpen && (
        <div className="border-t border-neutral-100 bg-neutral-50/60 p-4 rounded-b-2xl">
          <div className="flex justify-end mb-3">
            <button
              onClick={handleReset}
              className="text-xs font-medium text-neutral-500 hover:text-red-500 flex items-center gap-1.5 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Ripristina
            </button>
          </div>
          <EditorToolbar
            value={settings}
            onChange={(patch) => {
              if (Object.prototype.hasOwnProperty.call(patch, "color")) {
                colorTouchedRef.current = true;
              }
              setSettings((s) => ({ ...s, ...patch }));
            }}
            disabled={premium}
            supports={supports}
            defaultFontSize={base}
          />
        </div>
      )}
    </div>
  );
}

// Hook: wait for a font family to be actually rendered-ready in the browser.
function useFontFaceReady(family: string | null): boolean {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (!family) { setReady(false); return; }
    let cancelled = false;
    type DocFonts = Document & {
      fonts?: { load: (f: string) => Promise<FontFace[]>; ready: Promise<void> };
    };
    const doc = document as DocFonts;
    const mark = () => { if (!cancelled) setReady(true); };
    if (doc.fonts?.load) {
      doc.fonts.load(`16px "${family}"`).then(mark).catch(mark);
    } else {
      mark();
    }
    return () => { cancelled = true; };
  }, [family]);
  return ready;
}
