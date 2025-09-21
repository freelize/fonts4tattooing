import React from "react";
import { HexColorPicker } from "react-colorful";

export type ToolbarProps = {
  value: {
    letterSpacing: number;
    color: string;
    bold: boolean;
    italic: boolean;
    curve: number; // -100 to 100 (per arco)
    curveMode?: "none" | "arc" | "circle";
    circleRadius?: number; // px
    circleStart?: number; // degrees 0..360
    fontSizePx?: number; // grandezza locale
  };
  onChange: (patch: Partial<ToolbarProps["value"]>) => void;
  disabled?: boolean;
  supports?: { bold?: boolean; italic?: boolean };
};

export function EditorToolbar({ value, onChange, disabled, supports }: ToolbarProps) {
  const boldDisabled = disabled || supports?.bold === false;
  const italicDisabled = disabled || supports?.italic === false;

  const curveMode = value.curveMode ?? (value.curve !== 0 ? "arc" : "none");
  const circleRadius = value.circleRadius ?? 220;
  const circleStart = value.circleStart ?? 270; // top by default
  const localSize = value.fontSizePx ?? 56;

  return (
    <div className="flex flex-col gap-6 p-4 border border-neutral-200 rounded-lg bg-white/80">
      {/* Sezione Testo - Grandezza e Spaziatura */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-neutral-700 border-b border-neutral-200 pb-1">Testo</h3>
        
        <div className="flex items-center justify-between gap-4">
          <label className="text-sm text-neutral-600 min-w-[120px]">Grandezza (locale)</label>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="range"
              min={16}
              max={160}
              step={1}
              value={localSize}
              onChange={(e) => onChange({ fontSizePx: parseInt(e.target.value, 10) })}
              disabled={disabled}
              className="flex-1"
            />
            <span className="text-xs text-neutral-500 min-w-[35px]">{localSize}px</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <label className="text-sm text-neutral-600 min-w-[120px]">Spaziatura</label>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="range"
              min={-2}
              max={10}
              step={0.1}
              value={value.letterSpacing}
              onChange={(e) => onChange({ letterSpacing: parseFloat(e.target.value) })}
              disabled={disabled}
              className="flex-1"
            />
            <span className="text-xs text-neutral-500 min-w-[35px]">{value.letterSpacing.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Sezione Stile - Colore e Formattazione */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-neutral-700 border-b border-neutral-200 pb-1">Stile</h3>
        
        <div className="flex flex-col gap-3">
          <label className="text-sm text-neutral-600">Colore</label>
          <div className="flex justify-center">
            <HexColorPicker 
              color={value.color} 
              onChange={(c) => onChange({ color: c })} 
              className={disabled ? 'pointer-events-none opacity-50' : ''} 
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onChange({ bold: !value.bold })}
            disabled={boldDisabled}
            className={`px-4 py-2 border rounded-md text-sm font-bold transition-colors ${
              value.bold 
                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            } disabled:opacity-50`}
            aria-disabled={boldDisabled}
            title={supports?.bold === false ? 'Bold non supportato' : 'Bold'}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => onChange({ italic: !value.italic })}
            disabled={italicDisabled}
            className={`px-4 py-2 border rounded-md text-sm italic transition-colors ${
              value.italic 
                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            } disabled:opacity-50`}
            aria-disabled={italicDisabled}
            title={supports?.italic === false ? 'Italic non supportato' : 'Italic'}
          >
            I
          </button>
        </div>
      </div>

      {/* Sezione Curvatura */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-neutral-700 border-b border-neutral-200 pb-1">Curvatura</h3>
        
        <div className="flex items-center justify-between gap-4">
          <label className="text-sm text-neutral-600 min-w-[120px]">Tipo curvatura</label>
          <select
            className="border border-neutral-200 rounded-md bg-white px-3 py-2 text-sm flex-1 max-w-[150px]"
            value={curveMode}
            onChange={(e) => onChange({ curveMode: e.target.value as "none" | "arc" | "circle" })}
            disabled={disabled}
          >
            <option value="none">Nessuna</option>
            <option value="arc">Arco</option>
            <option value="circle">Cerchio</option>
          </select>
        </div>

        {curveMode === "arc" && (
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm text-neutral-600 min-w-[120px]">Intensità arco</label>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="range"
                min={-100}
                max={100}
                step={1}
                value={value.curve}
                onChange={(e) => onChange({ curve: parseInt(e.target.value, 10) })}
                disabled={disabled}
                className="flex-1"
              />
              <span className="text-xs text-neutral-500 min-w-[35px]">{value.curve}</span>
            </div>
          </div>
        )}

        {curveMode === "circle" && (
          <>
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm text-neutral-600 min-w-[120px]">Raggio cerchio</label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="range"
                  min={60}
                  max={600}
                  step={1}
                  value={circleRadius}
                  onChange={(e) => onChange({ circleRadius: parseInt(e.target.value, 10) })}
                  disabled={disabled}
                  className="flex-1"
                />
                <span className="text-xs text-neutral-500 min-w-[35px]">{circleRadius}px</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm text-neutral-600 min-w-[120px]">Posizione (°)</label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={circleStart}
                  onChange={(e) => onChange({ circleStart: parseInt(e.target.value, 10) })}
                  disabled={disabled}
                  className="flex-1"
                />
                <span className="text-xs text-neutral-500 min-w-[35px]">{circleStart}°</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}