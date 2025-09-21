"use client";

import React from "react";
import { toPng } from "html-to-image";
import { EditorToolbar } from "@/components/EditorToolbar";

type PreviewCardProps = {
  fontId?: string;
  fontName: string;
  fontCssFamily: string;
  text: string;
  premium?: boolean;
  supports?: { bold?: boolean; italic?: boolean };
  baseFontSizePx?: number; // global default size
  defaultColor?: string; // global default color
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
};

export function PreviewCard({ fontId, fontName, fontCssFamily, text, premium, supports, baseFontSizePx, defaultColor, isFavorite, onToggleFavorite }: PreviewCardProps) {
  const base = baseFontSizePx ?? 56; // global base
  const [settings, setSettings] = React.useState({
    letterSpacing: 0,
    color: defaultColor ?? "#111111",
    bold: false,
    italic: false,
    curve: 0,
    curveMode: "none" as "none" | "arc" | "circle",
    circleRadius: 220,
    circleStart: 0,
    fontSizePx: undefined as number | undefined,
  });
  const colorTouchedRef = React.useRef(false);
  const [toolsOpen, setToolsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const uid = React.useId();

  // Grandezza effettiva: locale se impostata, altrimenti globale
  const fs = settings.fontSizePx ?? base;

  React.useEffect(() => {
    // Update color from global only if user hasn't changed it locally
    if (!colorTouchedRef.current && defaultColor && defaultColor !== settings.color) {
      setSettings((s) => ({ ...s, color: defaultColor }));
    }
  }, [defaultColor, settings.color]);

  const onDownload = async () => {
    if (premium) return;
    if (!ref.current) return;
    
    try {
      const weight = settings.bold ? 700 : 400;
      const italic = settings.italic ? "italic " : "";
      const sizePx = Math.max(1, Math.round(fs));
      const family = `"${fontCssFamily}"`;

      type DocWithFonts = Document & { fonts?: { load: (font: string) => Promise<void>; ready: Promise<void> } };
      const doc = document as DocWithFonts;

      if (doc.fonts?.load) {
        try { await doc.fonts.load(`${italic}${weight} ${sizePx}px ${family}`); } catch {}
        try { await doc.fonts.ready; } catch {}
      }
    } catch {}

    // Determine explicit bitmap size to keep centering consistent
    const node = ref.current;
    if (!node) return;
    
    const rect = node.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    const dataUrl = await toPng(node, {
      backgroundColor: "white",
      pixelRatio: 3, // higher quality export
      canvasWidth: width * 3,
      canvasHeight: height * 3,
      style: {
        width: `${width}px`,
        height: `${height}px`,
      },
    });
    const link = document.createElement("a");
    link.download = `${fontName.replace(/\s+/g, "_")}_preview.png`;
    link.href = dataUrl;
    link.click();
  };

  const baseStyle: React.CSSProperties = {
    fontFamily: fontCssFamily,
    letterSpacing: `${settings.letterSpacing}px`,
    color: settings.color,
    fontWeight: settings.bold ? 700 : 400,
    fontStyle: settings.italic ? "italic" : "normal",
    fontSize: fs,
    lineHeight: 1.1,
  };

  const isArc = settings.curveMode === "arc" && settings.curve !== 0;
  const isCircle = settings.curveMode === "circle";
  const curved = isArc || isCircle;

  // Dimensioni container dinamiche in px (altezza), in funzione della grandezza font
  const baseHeight = Math.max(80, Math.round(fs * 1.8));
  const arcHeight = Math.max(140, Math.round(fs * 2.2));
  const circleHeight = Math.max(200, Math.round(fs * 2.6));
  const containerHeight = !curved ? baseHeight : (isArc ? arcHeight : circleHeight);

  // Impostazioni SVG (usiamo viewBox costanti per controllo e clamping)
  const vbW = 1000; // unità coordinate orizzontali
  const vbHArc = 500; // unità coordinate verticali per arco
  const vbHCirc = 1000; // unità per cerchio (quadrato)
  const pad = 40; // padding interno nel viewBox

  // ARC: ampiezza clampata per rimanere nel box
  const yMidArc = vbHArc / 2;
  const maxAmp = Math.max(0, yMidArc - pad - fs * 1.2);
  const amplitude = (settings.curve / 100) * maxAmp; // positivo = arco verso l'alto
  const x0 = pad;
  const x1 = vbW - pad;
  const midX = vbW / 2;
  const arcPathD = `M ${x0} ${yMidArc} Q ${midX} ${yMidArc - amplitude}, ${x1} ${yMidArc}`;

  // CIRCLE: raggio clampato per rimanere nel box (tenendo margine pari a ~0.7*fs)
  const c = vbHCirc / 2;
  const maxR = Math.max(10, c - (fs * 0.7));
  const rUnitsRaw = settings.circleRadius ?? 220;
  const r = Math.max(60, Math.min(maxR, rUnitsRaw));
  const circlePathD = `M ${c} ${c} m 0 -${r} a ${r},${r} 0 1,1 0 ${r * 2} a ${r},${r} 0 1,1 0 -${r * 2}`;
   const circleStartDeg = settings.circleStart ?? 270; // 0..360
   const circleStartPct = ((circleStartDeg % 360) / 360) * 100; // mappa gradi -> percentuale lunghezza

  return (
    <div className={`border border-neutral-200 rounded-lg overflow-hidden ${premium ? "opacity-70" : ""}`}>
      <div className="p-3 md:p-4 flex items-center justify-between gap-2 md:gap-3">
        <div className="text-sm font-medium flex items-center gap-2">
          <button
            type="button"
            onClick={() => fontId && onToggleFavorite?.(fontId)}
            className={`h-6 w-6 rounded hover:bg-neutral-100 flex items-center justify-center ${isFavorite ? 'text-yellow-500' : 'text-neutral-500'}`}
            title={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            aria-pressed={isFavorite ? 'true' : 'false'}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15 8.5 22 9 17 13.5 18.5 21 12 17.5 5.5 21 7 13.5 2 9 9 8.5 12 2" />
            </svg>
          </button>
          <span>{fontName}</span>
          {premium && (
            <span className="text-[10px] uppercase tracking-wide bg-neutral-900 text-white px-2 py-0.5 rounded">Premium</span>
          )}
        </div>
        <button
          onClick={onDownload}
          disabled={premium}
          className="text-sm px-2 py-1 md:px-3 md:py-1.5 border rounded-md hover:bg-neutral-50 disabled:opacity-50 flex items-center gap-1"
          aria-label="Scarica PNG"
          title="Scarica PNG"
        >
          <svg className="h-4 w-4 md:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="hidden md:inline">Scarica PNG</span>
        </button>
      </div>

      <div className="px-3 md:px-4 pb-3 md:pb-4">
        <div
          ref={ref}
          className={`bg-white flex items-center justify-center ${premium ? "pointer-events-none" : ""}`}
          style={{ backgroundColor: "white", height: containerHeight, width: "100%" }}
        >
          {!curved ? (
            <div style={baseStyle} className="text-center">
              {text || "Anteprima"}
            </div>
          ) : isArc ? (
            <div style={{ position: "relative", width: "100%" }}>
              <svg
                width="100%"
                height={containerHeight}
                viewBox={`0 0 ${vbW} ${vbHArc}`}
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <path id={`arcPath-${uid}`} d={arcPathD} />
                </defs>
                <text
                  fill={settings.color}
                  fontFamily={fontCssFamily}
                  fontWeight={settings.bold ? 700 : 400}
                  fontStyle={settings.italic ? "italic" : "normal"}
                  fontSize={fs}
                  style={{ letterSpacing: `${settings.letterSpacing}px` }}
                >
                  <textPath href={`#arcPath-${uid}`} startOffset="50%" textAnchor="middle">
                    {text || "Anteprima"}
                  </textPath>
                </text>
              </svg>
            </div>
          ) : (
            <div style={{ position: "relative", width: "100%" }}>
              <svg
                width="100%"
                height={containerHeight}
                viewBox={`0 0 ${vbW} ${vbHCirc}`}
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <path id={`circlePath-${uid}`} d={circlePathD} />
                </defs>
                <text
                  fill={settings.color}
                  fontFamily={fontCssFamily}
                  fontWeight={settings.bold ? 700 : 400}
                  fontStyle={settings.italic ? "italic" : "normal"}
                  fontSize={fs}
                  style={{ letterSpacing: `${settings.letterSpacing}px` }}
                >
                  <textPath href={`#circlePath-${uid}`} startOffset={`${circleStartPct}%`} textAnchor="middle">
                    {text || "Anteprima"}
                  </textPath>
                </text>
              </svg>
            </div>
          )}
        </div>

        <div className="mt-3 md:mt-4">
          <button
            type="button"
            className="text-sm px-2 py-1 md:px-3 md:py-1.5 border rounded-md hover:bg-neutral-50"
            onClick={() => setToolsOpen((o) => !o)}
            aria-expanded={toolsOpen}
            aria-controls={`tools-${fontName.replace(/\s+/g, "-").toLowerCase()}`}
          >
            {toolsOpen ? "Nascondi opzioni" : "Personalizza"}
          </button>

          {toolsOpen && (
            <div id={`tools-${fontName.replace(/\s+/g, "-").toLowerCase()}`} className="mt-3">
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
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}