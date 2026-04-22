import React from "react";
import { HexColorPicker } from "react-colorful";

export type EffectSettings = {
  letterSpacing: number;
  color: string;
  bold: boolean;
  italic: boolean;
  uppercase?: boolean;
  curve: number;
  curveMode?: "none" | "arc" | "circle";
  circleRadius?: number;
  circleInvert?: boolean;
  circleStart?: number;
  fontSizePx?: number;
  // New premium effects
  outlineEnabled: boolean;
  outlineWidth: number;
  outlineColor: string;
  shadowEnabled: boolean;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowColor: string;
  glowEnabled: boolean;
  glowIntensity: number;
  glowColor: string;
  skinMode: boolean;
};

export type ToolbarProps = {
  value: EffectSettings;
  onChange: (patch: Partial<EffectSettings>) => void;
  disabled?: boolean;
  supports?: { bold?: boolean; italic?: boolean };
  defaultFontSize?: number;
};

// Curated tattoo-oriented palette.
const PRESET_COLORS = [
  "#111111", // Ink Black
  "#3a2a1f", // Dark Sepia
  "#525252", // Grey Wash
  "#8B0000", // Blood Red
  "#d97706", // Amber
  "#4d6a3b", // Olive Green
  "#1e3a5f", // Navy
  "#6d28d9", // Royal Purple
];

const GLOW_PRESETS = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#00c7be", "#007aff", "#af52de", "#ffffff"];

export function EditorToolbar({ value, onChange, disabled, supports, defaultFontSize }: ToolbarProps) {
  const [activeTab, setActiveTab] = React.useState<"style" | "text" | "effects" | "fx">("style");
  const [showCustomColor, setShowCustomColor] = React.useState(false);

  const boldDisabled = disabled || supports?.bold === false;
  const italicDisabled = disabled || supports?.italic === false;

  const curveMode = value.curveMode ?? (value.curve !== 0 ? "arc" : "none");
  const localSize = value.fontSizePx ?? defaultFontSize ?? 56;

  const TABS = [
    { id: "style", label: "Stile" },
    { id: "text", label: "Testo" },
    { id: "effects", label: "Curve" },
    { id: "fx", label: "Premium" },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex p-1 bg-neutral-100 rounded-xl">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
              activeTab === tab.id
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.id === "fx" && (
              <svg className="h-3 w-3 text-amber-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z" />
              </svg>
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* STYLE */}
      {activeTab === "style" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <ToggleBlock
              active={value.bold}
              disabled={boldDisabled}
              onClick={() => onChange({ bold: !value.bold })}
              label="Bold"
              big={<span className="font-bold text-lg">B</span>}
            />
            <ToggleBlock
              active={value.italic}
              disabled={italicDisabled}
              onClick={() => onChange({ italic: !value.italic })}
              label="Italic"
              big={<span className="italic text-lg font-serif">I</span>}
            />
            <ToggleBlock
              active={!!value.uppercase}
              onClick={() => onChange({ uppercase: !value.uppercase })}
              label="Caps"
              big={<span className="text-lg font-medium tracking-tight">AA</span>}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">Colore</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { onChange({ color: c }); setShowCustomColor(false); }}
                  className={`w-8 h-8 rounded-full border border-neutral-200 transition-transform hover:scale-110 ${
                    value.color === c ? "ring-2 ring-neutral-900 ring-offset-2" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Colore ${c}`}
                />
              ))}
              <button
                onClick={() => setShowCustomColor(!showCustomColor)}
                className={`w-8 h-8 rounded-full border border-neutral-200 bg-gradient-to-br from-rose-400 via-amber-300 to-sky-400 flex items-center justify-center text-white shadow-inner ${
                  showCustomColor ? "ring-2 ring-neutral-900 ring-offset-2" : ""
                }`}
                title="Colore personalizzato"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
            {showCustomColor && (
              <div className="pt-2">
                <HexColorPicker color={value.color} onChange={(c) => onChange({ color: c })} className="!w-full !h-40" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEXT */}
      {activeTab === "text" && (
        <div className="space-y-4">
          <Slider
            label="Dimensione"
            value={localSize}
            min={16}
            max={200}
            unit="px"
            onChange={(v) => onChange({ fontSizePx: v })}
          />
          <Slider
            label="Spaziatura"
            value={value.letterSpacing}
            min={-30}
            max={80}
            unit="px"
            onChange={(v) => onChange({ letterSpacing: v })}
          />
        </div>
      )}

      {/* CURVE */}
      {activeTab === "effects" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "none", label: "Dritto", icon: <CurveIcon type="none" /> },
              { id: "arc", label: "Arco", icon: <CurveIcon type="arc" /> },
              { id: "circle", label: "Cerchio", icon: <CurveIcon type="circle" /> },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => onChange({ curveMode: mode.id as "none" | "arc" | "circle" })}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 border rounded-xl transition-all ${
                  curveMode === mode.id
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-md"
                    : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {mode.icon}
                <span className="text-xs font-semibold">{mode.label}</span>
              </button>
            ))}
          </div>

          {curveMode === "arc" && (
            <Slider
              label="Curvatura"
              value={value.curve}
              min={-360}
              max={360}
              onChange={(v) => onChange({ curve: v })}
            />
          )}

          {curveMode === "circle" && (
            <div className="space-y-3 pt-1">
              <Slider
                label="Raggio"
                value={value.circleRadius ?? 220}
                min={50}
                max={1200}
                unit="px"
                onChange={(v) => onChange({ circleRadius: v })}
              />
              <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                <label className="text-sm font-semibold text-neutral-700">Testo interno</label>
                <Switch
                  on={!!value.circleInvert}
                  onToggle={() => onChange({ circleInvert: !value.circleInvert })}
                />
              </div>
              <Slider
                label="Rotazione"
                value={value.circleStart ?? 0}
                min={0}
                max={360}
                unit="°"
                onChange={(v) => onChange({ circleStart: v })}
              />
            </div>
          )}
        </div>
      )}

      {/* PREMIUM FX */}
      {activeTab === "fx" && (
        <div className="space-y-4">
          <p className="text-[11px] text-neutral-500 leading-snug">
            Effetti avanzati: outline, ombra, bagliore e anteprima su pelle.
            Combinabili tra loro.
          </p>

          {/* Outline */}
          <EffectSection
            title="Outline"
            hint="Contorno vuoto, stile old-school"
            enabled={value.outlineEnabled}
            onToggle={() => onChange({ outlineEnabled: !value.outlineEnabled })}
          >
            <Slider
              label="Spessore"
              value={value.outlineWidth}
              min={1}
              max={12}
              unit="px"
              onChange={(v) => onChange({ outlineWidth: v })}
            />
            <ColorRow
              label="Colore"
              value={value.outlineColor}
              onChange={(c) => onChange({ outlineColor: c })}
            />
          </EffectSection>

          {/* Shadow */}
          <EffectSection
            title="Ombra"
            hint="Ombra 3D con offset e blur"
            enabled={value.shadowEnabled}
            onToggle={() => onChange({ shadowEnabled: !value.shadowEnabled })}
          >
            <div className="grid grid-cols-2 gap-3">
              <Slider
                label="X"
                value={value.shadowX}
                min={-30}
                max={30}
                unit="px"
                compact
                onChange={(v) => onChange({ shadowX: v })}
              />
              <Slider
                label="Y"
                value={value.shadowY}
                min={-30}
                max={30}
                unit="px"
                compact
                onChange={(v) => onChange({ shadowY: v })}
              />
            </div>
            <Slider
              label="Blur"
              value={value.shadowBlur}
              min={0}
              max={40}
              unit="px"
              onChange={(v) => onChange({ shadowBlur: v })}
            />
            <ColorRow
              label="Colore"
              value={value.shadowColor}
              onChange={(c) => onChange({ shadowColor: c })}
            />
          </EffectSection>

          {/* Glow / Neon */}
          <EffectSection
            title="Neon Glow"
            hint="Aura luminosa stile neon"
            enabled={value.glowEnabled}
            onToggle={() => onChange({ glowEnabled: !value.glowEnabled })}
          >
            <Slider
              label="Intensità"
              value={value.glowIntensity}
              min={2}
              max={40}
              unit="px"
              onChange={(v) => onChange({ glowIntensity: v })}
            />
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Colore bagliore
              </label>
              <div className="flex flex-wrap gap-1.5">
                {GLOW_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => onChange({ glowColor: c })}
                    className={`w-7 h-7 rounded-full border border-neutral-200 transition-transform hover:scale-110 ${
                      value.glowColor === c ? "ring-2 ring-neutral-900 ring-offset-2" : ""
                    }`}
                    style={{
                      backgroundColor: c,
                      boxShadow: `0 0 10px ${c}`,
                    }}
                    aria-label={`Glow ${c}`}
                  />
                ))}
              </div>
            </div>
          </EffectSection>

          {/* Skin Mode */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-gradient-to-br from-orange-50 to-amber-50">
            <div>
              <div className="text-sm font-semibold text-neutral-900">Anteprima su pelle</div>
              <div className="text-[11px] text-neutral-500">
                Mostra il testo su sfondo cutaneo realistico
              </div>
            </div>
            <Switch
              on={value.skinMode}
              onToggle={() => onChange({ skinMode: !value.skinMode })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------ SUB-COMPONENTS ------------ */

function ToggleBlock({
  active,
  disabled,
  onClick,
  label,
  big,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  big: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1 py-2.5 border rounded-xl transition-all ${
        active
          ? "bg-neutral-900 text-white border-neutral-900 shadow-md"
          : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
      } disabled:opacity-40`}
    >
      {big}
      <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  unit = "",
  onChange,
  compact,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (v: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">{label}</label>
        <span className="text-[11px] font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full cursor-pointer"
      />
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">{label}</label>
      <label className="relative cursor-pointer">
        <input
          type="color"
          value={value.startsWith("#") ? value : "#111111"}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
        <span
          className="block h-8 w-16 rounded-lg border border-neutral-200 shadow-inner"
          style={{ background: value }}
          title={value}
        />
      </label>
    </div>
  );
}

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        on ? "bg-neutral-900" : "bg-neutral-300"
      }`}
      aria-pressed={on}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function EffectSection({
  title,
  hint,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  hint: string;
  enabled: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border transition-all ${
        enabled
          ? "border-neutral-900/20 bg-white shadow-sm"
          : "border-neutral-200 bg-neutral-50/60"
      }`}
    >
      <div className="flex items-center justify-between p-3">
        <div>
          <div className="text-sm font-semibold text-neutral-900">{title}</div>
          <div className="text-[11px] text-neutral-500">{hint}</div>
        </div>
        <Switch on={enabled} onToggle={onToggle} />
      </div>
      {enabled && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-neutral-100">
          {children}
        </div>
      )}
    </div>
  );
}

function CurveIcon({ type }: { type: "none" | "arc" | "circle" }) {
  if (type === "none") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="4" y1="12" x2="20" y2="12" />
      </svg>
    );
  }
  if (type === "arc") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 18c0-9 8-10 8-10s8 1 8 10" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}
