import React from "react";
import { HexColorPicker } from "react-colorful";

export type ToolbarProps = {
  value: {
    letterSpacing: number;
    color: string;
    bold: boolean;
    italic: boolean;
    uppercase?: boolean;
    curve: number; // -100 to 100 (per arco)
    curveMode?: "none" | "arc" | "circle";
    circleRadius?: number; // px
    circleStart?: number; // degrees 0..360
    fontSizePx?: number; // grandezza locale
  };
  onChange: (patch: Partial<ToolbarProps["value"]>) => void;
  disabled?: boolean;
  supports?: { bold?: boolean; italic?: boolean };
  defaultFontSize?: number;
};

export function EditorToolbar({ value, onChange, disabled, supports, defaultFontSize }: ToolbarProps) {
  const [activeTab, setActiveTab] = React.useState<"style" | "text" | "effects">("style");
  const [showCustomColor, setShowCustomColor] = React.useState(false);

  const boldDisabled = disabled || supports?.bold === false;
  const italicDisabled = disabled || supports?.italic === false;
  
  const curveMode = value.curveMode ?? (value.curve !== 0 ? "arc" : "none");
  const localSize = value.fontSizePx ?? defaultFontSize ?? 56;

  const TABS = [
    { id: "style", label: "Stile", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg> },
    { id: "text", label: "Testo", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
    { id: "effects", label: "Effetti", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M10 13a2 2 0 0 0 2 2 2 2 0 0 0 2-2"/></svg> },
  ] as const;

  const PRESET_COLORS = [
    "#111111", // Black
    "#DC2626", // Red
    "#2563EB", // Blue
    "#16A34A", // Green
    "#9333EA", // Purple
    "#EA580C", // Orange
    "#525252", // Neutral
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex p-1 bg-neutral-100 rounded-lg">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab.id
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-1">
        {activeTab === "style" && (
          <div className="space-y-6">
            {/* Grassetto / Corsivo / Maiuscolo */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChange({ bold: !value.bold })}
                disabled={boldDisabled}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 border rounded-lg transition-all ${
                  value.bold
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                } disabled:opacity-50`}
                title="Grassetto"
              >
                <span className="font-bold text-xl">B</span>
                <span className="text-[10px] uppercase tracking-wide">Bold</span>
              </button>
              <button
                type="button"
                onClick={() => onChange({ italic: !value.italic })}
                disabled={italicDisabled}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 border rounded-lg transition-all ${
                  value.italic
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                } disabled:opacity-50`}
                title="Corsivo"
              >
                <span className="italic text-xl font-serif">I</span>
                <span className="text-[10px] uppercase tracking-wide">Italic</span>
              </button>
              <button
                type="button"
                onClick={() => onChange({ uppercase: !value.uppercase })}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 border rounded-lg transition-all ${
                  value.uppercase
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                }`}
                title="Maiuscolo"
              >
                <span className="text-xl font-medium">AA</span>
                <span className="text-[10px] uppercase tracking-wide">Caps</span>
              </button>
            </div>

            {/* Colori */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-700">Colore</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { onChange({ color: c }); setShowCustomColor(false); }}
                    className={`w-8 h-8 rounded-full border border-neutral-200 transition-transform hover:scale-110 ${value.color === c ? "ring-2 ring-neutral-900 ring-offset-2" : ""}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Colore ${c}`}
                  />
                ))}
                <button
                  onClick={() => setShowCustomColor(!showCustomColor)}
                  className={`w-8 h-8 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-500 hover:bg-neutral-50 ${showCustomColor ? "ring-2 ring-neutral-900 ring-offset-2" : ""}`}
                  title="Colore personalizzato"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                </button>
              </div>
              
              {showCustomColor && (
                <div className="pt-2 animate-in fade-in zoom-in duration-200">
                  <HexColorPicker color={value.color} onChange={(c) => onChange({ color: c })} className="!w-full !h-40" />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "text" && (
          <div className="space-y-6">
             {/* Dimensione */}
             <div className="space-y-3">
               <div className="flex justify-between items-center">
                 <label className="text-sm font-medium text-neutral-700">Dimensione</label>
                 <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">{localSize}px</span>
               </div>
               <input
                 type="range"
                 min={16}
                 max={160}
                 value={localSize}
                 onChange={(e) => onChange({ fontSizePx: parseInt(e.target.value, 10) })}
                 className="w-full accent-neutral-900 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
               />
             </div>

             {/* Spaziatura */}
             <div className="space-y-3">
               <div className="flex justify-between items-center">
                 <label className="text-sm font-medium text-neutral-700">Spaziatura lettere</label>
                 <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">{value.letterSpacing.toFixed(1)}px</span>
               </div>
               <input
                 type="range"
                 min={-2}
                 max={10}
                 step={0.1}
                 value={value.letterSpacing}
                 onChange={(e) => onChange({ letterSpacing: parseFloat(e.target.value) })}
                 className="w-full accent-neutral-900 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
               />
             </div>
          </div>
        )}

        {activeTab === "effects" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "none", label: "Normale", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="20" y2="12"/></svg> },
                { id: "arc", label: "Arco", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 18c0-9 8-10 8-10s8 1 8 10"/></svg> },
                { id: "circle", label: "Cerchio", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg> },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => onChange({ curveMode: mode.id as any })}
                  className={`flex flex-col items-center justify-center gap-2 p-3 border rounded-xl transition-all ${
                    curveMode === mode.id
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {mode.icon}
                  <span className="text-xs font-medium">{mode.label}</span>
                </button>
              ))}
            </div>

            {curveMode === "arc" && (
              <div className="space-y-3 pt-2">
                 <div className="flex justify-between items-center">
                   <label className="text-sm font-medium text-neutral-700">Curvatura</label>
                   <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">{value.curve}</span>
                 </div>
                 <input
                   type="range"
                   min={-100}
                   max={100}
                   value={value.curve}
                   onChange={(e) => onChange({ curve: parseInt(e.target.value, 10) })}
                   className="w-full accent-neutral-900 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                 />
                 <div className="flex justify-between text-[10px] text-neutral-400">
                   <span>Verso il basso</span>
                   <span>Verso l'alto</span>
                 </div>
              </div>
            )}

            {curveMode === "circle" && (
              <div className="space-y-4 pt-2">
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                     <label className="text-sm font-medium text-neutral-700">Raggio</label>
                     <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">{value.circleRadius ?? 220}px</span>
                   </div>
                   <input
                     type="range"
                     min={60}
                     max={600}
                     value={value.circleRadius ?? 220}
                     onChange={(e) => onChange({ circleRadius: parseInt(e.target.value, 10) })}
                     className="w-full accent-neutral-900 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                   />
                </div>
                
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                     <label className="text-sm font-medium text-neutral-700">Rotazione</label>
                     <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">{value.circleStart ?? 270}°</span>
                   </div>
                   <input
                     type="range"
                     min={0}
                     max={360}
                     value={value.circleStart ?? 270}
                     onChange={(e) => onChange({ circleStart: parseInt(e.target.value, 10) })}
                     className="w-full accent-neutral-900 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                   />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
