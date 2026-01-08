"use client";

import React from "react";
import { toPng, toBlob } from "html-to-image";
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
  rating?: number;
  reviewsCount?: number;
};

export function PreviewCard({ fontId, fontName, fontCssFamily, text, premium, supports, baseFontSizePx, defaultColor, isFavorite, onToggleFavorite, rating, reviewsCount }: PreviewCardProps) {
  const base = baseFontSizePx ?? 56; // global base
  const [settings, setSettings] = React.useState({
    letterSpacing: 0,
    color: defaultColor ?? "#111111",
    bold: false,
    italic: false,
    uppercase: false,
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

  // Reset delle impostazioni locali
  const handleReset = () => {
    setSettings({
      letterSpacing: 0,
      color: defaultColor ?? "#111111",
      bold: false,
      italic: false,
      uppercase: false,
      curve: 0,
      curveMode: "none",
      circleRadius: 220,
      circleStart: 0,
      fontSizePx: undefined,
    });
    colorTouchedRef.current = false;
  };

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
      const family = `"${fontCssFamily}", "Noto Sans CJK SC", "Noto Sans CJK TC", "Noto Sans CJK JP", "Noto Sans CJK KR", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Heiti SC", "WenQuanYi Micro Hei", sans-serif`;

      type DocWithFonts = Document & { fonts?: { load: (font: string) => Promise<void>; ready: Promise<void> } };
      const doc = document as DocWithFonts;

      if (doc.fonts?.load) {
        try { await doc.fonts.load(`${italic}${weight} ${sizePx}px ${family}`); } catch {}
        try { await doc.fonts.ready; } catch {}
      }
      // Wait a bit to ensure layout is stable and fonts are applied
      await new Promise((resolve) => setTimeout(resolve, 250));
    } catch {}

    // Determine explicit bitmap size to keep centering consistent
    const node = ref.current;
    if (!node) return;
    
    const rect = node.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    const options = {
      backgroundColor: "white",
      pixelRatio: 3, // higher quality export
      canvasWidth: width * 3,
      canvasHeight: height * 3,
      style: {
        width: `${width}px`,
        height: `${height}px`,
      },
      cacheBust: true, // Force reloading resources
    };

    try {
      // Warmup run - helps with font loading issues
      try {
        await toPng(node, { ...options, pixelRatio: 1 });
      } catch (e) {
        // Ignore warmup errors
      }

      const blob = await toBlob(node, options);
      if (!blob) throw new Error("Blob creation failed");
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${fontName.replace(/\s+/g, "_")}_preview.png`;
      link.href = url;
      link.click();
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Failed to generate preview", err);
    }
  };

  const baseStyle: React.CSSProperties = {
    fontFamily: `"${fontCssFamily}", "Noto Sans CJK SC", "Noto Sans CJK TC", "Noto Sans CJK JP", "Noto Sans CJK KR", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Heiti SC", "WenQuanYi Micro Hei", sans-serif`,
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

  // Stima larghezza testo per calcoli viewBox dinamici
  const approxCharWidth = fs * 0.6; // Stima media larghezza carattere
  const textLen = text ? text.length : 9; // "Anteprima" = 9
  const estTextWidth = Math.max(200, textLen * approxCharWidth);

  // ARC LOGIC
  // Width dinamica basata sul testo + padding
  const arcVbW = estTextWidth + (fs * 4); 
  const arcVbH = fs * 4 + Math.abs(settings.curve * 3); // Altezza cresce con la curvatura
  const arcCx = arcVbW / 2;
  const arcCy = arcVbH / 2;
  
  // Calcolo curva: usiamo settings.curve come offset verticale diretto (amplificato)
  // Se curve > 0 (verso l'alto): il punto di controllo va su (y minore)
  // Se curve < 0 (verso il basso): il punto di controllo va giu (y maggiore)
  // La path parte da sinistra (padding) a destra (width - padding) a meta altezza
  const arcPadX = fs * 2;
  const arcYBase = arcCy + (settings.curve > 0 ? fs : -fs); // Spostiamo la base per centrare visivamente
  const arcPathD = `M ${arcPadX} ${arcYBase} Q ${arcCx} ${arcYBase - (settings.curve * 2.5)} ${arcVbW - arcPadX} ${arcYBase}`;

  // CIRCLE LOGIC
  const r = settings.circleRadius ?? 220;
  // Il viewBox deve contenere il cerchio completo + padding per il testo
  const circleVbSize = (r * 2) + (fs * 4);
  const c = circleVbSize / 2;
  
  // Path cerchio: parte da ORE 12 (Top) in senso orario
  // M cx (cy-r) -> Muovi al top
  // A r r 0 1 1 cx (cy+r) -> Arco di 180 gradi fino a bottom
  // A r r 0 1 1 cx (cy-r) -> Arco di 180 gradi ritorno a top
  const circlePathD = `M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c} ${c + r} A ${r} ${r} 0 1 1 ${c} ${c - r}`;

  // Calcolo rotazione visuale per "Circle Start"
  // Ruotiamo l'intero SVG o il gruppo per semplicità
  const circleRot = settings.circleStart ?? 0;

  // Altezza container effettiva per il CSS
  let containerHeightStr = "auto";
  if (isArc) containerHeightStr = `${Math.min(400, arcVbH)}px`; // Cap altezza arc
  else if (isCircle) containerHeightStr = `${Math.min(500, circleVbSize / 2)}px`; // Cerchio spesso grande, limitiamo
  else containerHeightStr = `${Math.max(160, fs * 2)}px`;

  // Override container style per adattarsi al contenuto
  const containerStyle = {
    backgroundColor: "white",
    height: isCircle ? "auto" : containerHeightStr,
    width: "100%",
    aspectRatio: isCircle ? "1/1" : undefined,
    maxHeight: isCircle ? "500px" : undefined
  };

  return (
    <div className={`group border border-neutral-200 rounded-xl overflow-hidden bg-white transition-all duration-300 hover:shadow-lg ${premium ? "opacity-90" : ""}`}>
      {/* Header: Nome e Info */}
      <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-neutral-800">{fontName}</h3>
          {premium && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-900 text-white px-2 py-0.5 rounded-full">Premium</span>
          )}
        </div>
        
        {(rating !== undefined || reviewsCount !== undefined) && (
          <div className="flex items-center gap-1 text-xs text-neutral-500 bg-white px-2 py-1 rounded-full border border-neutral-100 shadow-sm">
            <svg className="h-3 w-3 text-yellow-400 fill-current" viewBox="0 0 24 24">
              <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <span className="font-medium text-neutral-700">{typeof rating === "number" ? rating.toFixed(1) : ""}</span>
            <span className="text-neutral-300">|</span>
            <span>{typeof reviewsCount === "number" ? reviewsCount : ""}</span>
          </div>
        )}
      </div>

      {/* Area Anteprima */}
      <div className="relative px-4 py-6 md:py-8 bg-white flex items-center justify-center min-h-[160px]">
        <div
          ref={ref}
          className={`flex items-center justify-center w-full transition-all duration-300 ${premium ? "pointer-events-none grayscale-[0.5] opacity-80" : ""}`}
          style={containerStyle}
        >
          {!curved ? (
            <div style={baseStyle} className="text-center w-full break-words p-4">
              {text || "Anteprima"}
            </div>
          ) : isArc ? (
            <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${arcVbW} ${arcVbH}`}
                preserveAspectRatio="xMidYMid meet"
                overflow="visible"
              >
                <path id={`arcPath-${uid}`} d={arcPathD} fill="none" stroke="none" />
                <text
                  fill={settings.color}
                  fontFamily={`"${fontCssFamily}", "Noto Sans CJK SC", "Noto Sans CJK TC", "Noto Sans CJK JP", "Noto Sans CJK KR", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Heiti SC", "WenQuanYi Micro Hei", sans-serif`}
                  fontWeight={settings.bold ? 700 : 400}
                  fontStyle={settings.italic ? "italic" : "normal"}
                  fontSize={fs}
                  style={{ letterSpacing: `${settings.letterSpacing}px`, textTransform: settings.uppercase ? "uppercase" : "none" }}
                  dominantBaseline="middle"
                >
                  <textPath href={`#arcPath-${uid}`} startOffset="50%" textAnchor="middle">
                    {text || "Anteprima"}
                  </textPath>
                </text>
              </svg>
            </div>
          ) : (
            <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${circleVbSize} ${circleVbSize}`}
                preserveAspectRatio="xMidYMid meet"
                overflow="visible"
              >
                <path id={`circlePath-${uid}`} d={circlePathD} fill="none" stroke="none" />
                <g style={{ transformOrigin: "center", transform: `rotate(${circleRot}deg)` }}>
                  <text
                    fill={settings.color}
                    fontFamily={`"${fontCssFamily}", "Noto Sans CJK SC", "Noto Sans CJK TC", "Noto Sans CJK JP", "Noto Sans CJK KR", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Heiti SC", "WenQuanYi Micro Hei", sans-serif`}
                    fontWeight={settings.bold ? 700 : 400}
                    fontStyle={settings.italic ? "italic" : "normal"}
                    fontSize={fs}
                    style={{ letterSpacing: `${settings.letterSpacing}px`, textTransform: settings.uppercase ? "uppercase" : "none" }}
                    dominantBaseline="auto"
                  >
                    <textPath href={`#circlePath-${uid}`} startOffset="50%" textAnchor="middle">
                      {text || "Anteprima"}
                    </textPath>
                  </text>
                </g>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-3 py-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between gap-3">
        {/* Preferiti */}
        <button
          type="button"
          onClick={() => fontId && onToggleFavorite?.(fontId)}
          className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
            isFavorite 
              ? 'bg-yellow-50 text-yellow-500 ring-1 ring-yellow-200' 
              : 'text-neutral-400 hover:bg-white hover:text-neutral-600 hover:shadow-sm'
          }`}
          title={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
             <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>

        {/* Toggle Personalizza */}
        <button
          type="button"
          onClick={() => setToolsOpen((o) => !o)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            toolsOpen
              ? 'bg-neutral-800 text-white shadow-md'
              : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
          {toolsOpen ? "Chiudi" : "Personalizza"}
        </button>

        {/* Download */}
        <button
          onClick={onDownload}
          disabled={premium}
          className="h-9 w-9 rounded-full flex items-center justify-center text-neutral-400 hover:bg-white hover:text-neutral-800 hover:shadow-sm transition-all disabled:opacity-30"
          title="Scarica anteprima PNG"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>

      {/* Pannello Strumenti Espandibile */}
      {toolsOpen && (
        <div className="border-t border-neutral-100 bg-neutral-50 p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-end mb-3">
             <button 
               onClick={handleReset} 
               className="text-xs font-medium text-neutral-500 hover:text-red-500 flex items-center gap-1.5 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
             >
               <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                 <path d="M3 3v5h5" />
               </svg>
               Ripristina default
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