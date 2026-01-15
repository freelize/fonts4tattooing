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
    circleInvert: false,
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
      circleInvert: false,
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
      } catch {
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

  // Preparazione testo (Uppercase gestito via JS per compatibilità SVG/Path)
  const rawText = text || "Anteprima";
  const content = settings.uppercase ? rawText.toUpperCase() : rawText;

  // Stima larghezza testo per calcoli viewBox dinamici
  const approxCharWidth = fs * 0.6; // Stima media larghezza carattere
  const textLen = content.length;
  const estTextWidth = Math.max(200, textLen * approxCharWidth);

  // ARC LOGIC
  // Width dinamica basata sul testo + padding
  const arcVbW = estTextWidth + (fs * 4); 
  
  // Calcolo altezza ottimizzata per la curva
  // Altezza reale della curva (Quadratic Bezier peak is at t=0.5, height is 0.5 * control_point_offset)
  // Control point offset is curve * 2.5. So peak height is curve * 1.25.
  const curveHeight = Math.abs(settings.curve * 1.25);
  const arcVbH = curveHeight + (fs * 5); // Height + padding (fs*5 per sicurezza sopra/sotto)
  const arcCx = arcVbW / 2;
  
  // Posizioniamo la base della curva in modo da massimizzare lo spazio
  const arcPadX = fs * 2;
  let arcYBase;
  if (settings.curve >= 0) {
      // Arch (Verso l'alto): La curva va in alto. La base deve stare in basso.
      // Peak Y = arcYBase - curveHeight. Vogliamo Peak Y a circa fs * 2.5 (padding top)
      arcYBase = curveHeight + (fs * 2.5);
  } else {
      // Smile (Verso il basso): La curva va in basso. La base deve stare in alto.
      // Base a fs * 2.5 (padding top)
      arcYBase = (fs * 2.5);
  }

  const arcPathD = `M ${arcPadX} ${arcYBase} Q ${arcCx} ${arcYBase - (settings.curve * 2.5)} ${arcVbW - arcPadX} ${arcYBase}`;

  // CIRCLE LOGIC
  const r = settings.circleRadius ?? 220;
  // Il viewBox deve contenere il cerchio completo + padding per il testo
  const circleVbSize = (r * 2) + (fs * 4);
  const c = circleVbSize / 2;
  
  // Path cerchio: parte da ORE 12 (Top)
  // Se circleInvert è false (default): Senso Orario (CW) -> Testo Esterno
  // Se circleInvert è true: Senso Anti-Orario (CCW) -> Testo Interno
  const sweepFlag = settings.circleInvert ? 0 : 1;
  const circlePathD = `M ${c} ${c - r} A ${r} ${r} 0 1 ${sweepFlag} ${c} ${c + r} A ${r} ${r} 0 1 ${sweepFlag} ${c} ${c - r}`;

  // Calcolo rotazione visuale per "Circle Start"
  // Ruotiamo l'intero SVG o il gruppo per semplicità
  const circleRot = settings.circleStart ?? 0;

  // Altezza container effettiva per il CSS
  let containerHeightStr = "auto";
  if (isArc) containerHeightStr = "300px"; // Altezza fissa per evitare che i controlli saltino
  else if (isCircle) containerHeightStr = "auto"; // Lasciamo che il cerchio si espanda
  else containerHeightStr = `${Math.max(160, fs * 2)}px`;

  // Override container style per adattarsi al contenuto
  const containerStyle = {
    backgroundColor: "white",
    height: isCircle ? "auto" : containerHeightStr,
    width: "100%",
    aspectRatio: isCircle ? "1/1" : undefined,
    maxHeight: undefined, // Rimosso limite altezza per cerchi grandi
    // Importante: impostiamo il font anche sul container per aiutare html-to-image a rilevarlo durante l'export SVG
    fontFamily: `"${fontCssFamily}", "Noto Sans CJK SC", "Noto Sans CJK TC", "Noto Sans CJK JP", "Noto Sans CJK KR", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Heiti SC", "WenQuanYi Micro Hei", sans-serif`,
  };

  // Faux Bold: Se il font non supporta il grassetto nativo, usiamo un bordo dello stesso colore
  // Aumentato spessore a 0.04 (4% del font size) per renderlo più visibile
  const fauxBoldStrokeWidth = settings.bold ? fs * 0.04 : 0;
  
  // Faux Italic: Se il font non supporta il corsivo, usiamo una trasformazione SVG
  const fauxItalicTransform = settings.italic ? "skewX(-15)" : undefined;
  const fontFamilyStr = `"${fontCssFamily}", "Noto Sans CJK SC", "Noto Sans CJK TC", "Noto Sans CJK JP", "Noto Sans CJK KR", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Heiti SC", "WenQuanYi Micro Hei", sans-serif`;

  return (
    <div className={`group border border-neutral-200 rounded-xl bg-white transition-all duration-300 hover:shadow-lg ${premium ? "opacity-90" : ""}`}>
      {/* Header: Nome e Info */}
      <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between rounded-t-xl">
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
      <div className="sticky top-0 z-30 px-4 py-4 md:py-8 bg-white/95 backdrop-blur-sm flex items-center justify-center min-h-[160px] border-b border-neutral-100 shadow-sm">
        <div
          ref={ref}
          className={`flex items-center justify-center w-full transition-all duration-300 ${premium ? "pointer-events-none grayscale-[0.5] opacity-80" : ""}`}
          style={containerStyle}
        >
          {!curved ? (
            <div style={baseStyle} className="text-center w-full break-words p-4">
              {content}
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
                  fontFamily={fontFamilyStr}
                  transform={fauxItalicTransform}
                  style={{ 
                    fontWeight: settings.bold ? 700 : 400,
                    fontStyle: settings.italic ? "oblique" : "normal", // Oblique forza meglio l'inclinazione se manca il corsivo
                    letterSpacing: `${settings.letterSpacing}px`, 
                  }}
                  stroke={settings.color}
                  strokeWidth={fauxBoldStrokeWidth}
                  strokeLinejoin="round"
                  fontSize={fs}
                  dominantBaseline="middle"
                >
                  <textPath href={`#arcPath-${uid}`} startOffset="50%" textAnchor="middle">
                    {content}
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
                    fontFamily={fontFamilyStr}
                    transform={fauxItalicTransform}
                    style={{ 
                      fontWeight: settings.bold ? 700 : 400,
                      fontStyle: settings.italic ? "oblique" : "normal",
                      letterSpacing: `${settings.letterSpacing}px`, 
                    }}
                    stroke={settings.color}
                    strokeWidth={fauxBoldStrokeWidth}
                    strokeLinejoin="round"
                    fontSize={fs}
                    dominantBaseline="auto"
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
      </div>

      {/* Action Bar */}
      <div className={`px-3 py-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between gap-3 ${!toolsOpen ? "rounded-b-xl" : ""}`}>
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
        <div className="border-t border-neutral-100 bg-neutral-50 p-4 animate-in slide-in-from-top-2 duration-200 rounded-b-xl">
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