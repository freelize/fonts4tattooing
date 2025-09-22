"use client";

import React from "react";

type FontRow = {
  id: string;
  name: string;
  rating?: number;
  reviewsCount?: number;
};

type EditableRow = FontRow & {
  ratingLocal: string;
  reviewsLocal: string;
  saving?: boolean;
  savedAt?: number;
  error?: string | null;
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function pickRating(id: string) {
  const variants = [4.3, 4.7, 4.9] as const;
  return variants[hash(id) % variants.length];
}
function pickReviews(id: string) {
  const h = hash(id);
  const min = 17;
  const max = 45;
  return min + (h % (max - min + 1));
}

export default function ReviewsManager() {
  const [rows, setRows] = React.useState<EditableRow[]>([]);
  const [filter, setFilter] = React.useState("");
  const [fonts, setFonts] = React.useState<FontRow[]>([]);

  React.useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/fonts?all=1");
      const data = await res.json();
      if (data.fonts) {
        setFonts(data.fonts);
      }
    };
    load().catch(() => {});
  }, []);

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, filter]);

  const setRow = (id: string, patch: Partial<EditableRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const onSuggest = (r: EditableRow) => {
    const rating = pickRating(r.id);
    const reviews = pickReviews(r.id);
    setRow(r.id, { ratingLocal: String(rating), reviewsLocal: String(reviews) });
  };

  const onSave = async (r: EditableRow) => {
    const nextRating = r.ratingLocal.trim() === "" ? undefined : Number(r.ratingLocal);
    const nextReviews = r.reviewsLocal.trim() === "" ? undefined : Number(r.reviewsLocal);

    if (nextRating != null && (isNaN(nextRating) || nextRating < 0 || nextRating > 5)) {
      setRow(r.id, { error: "Rating fuori range (0–5)" });
      return;
    }
    if (nextReviews != null && (isNaN(nextReviews) || nextReviews < 0)) {
      setRow(r.id, { error: "Numero recensioni non valido" });
      return;
    }

    setRow(r.id, { saving: true, error: null });
    try {
      const res = await fetch(`/api/fonts/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: nextRating,
          reviewsCount: nextReviews,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Errore ${res.status}`);
      }
      setRow(r.id, {
        rating: nextRating,
        reviewsCount: nextReviews,
        saving: false,
        savedAt: Date.now(),
        error: null,
      });
    } catch (e: any) {
      setRow(r.id, { saving: false, error: e?.message || "Errore salvataggio" });
    }
  };

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">Recensioni (rating e numero)</h2>
      <p className="text-sm text-neutral-600 mt-1">
        Modifica i valori e salva. Puoi usare “Suggerisci” per riempire con i valori fittizi richiesti (4.3/4.7/4.9 e 17–45).
      </p>

      <div className="mt-4 flex items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtra per nome font…"
          className="w-full md:w-80 rounded-md border border-neutral-200 px-3 py-2"
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-3">Font</th>
              <th className="py-2 pr-3">Rating (0–5)</th>
              <th className="py-2 pr-3"># Recensioni</th>
              <th className="py-2 pr-3">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const dirty =
                (r.ratingLocal.trim() === "" ? undefined : Number(r.ratingLocal)) !== r.rating ||
                (r.reviewsLocal.trim() === "" ? undefined : Number(r.reviewsLocal)) !== r.reviewsCount;

              return (
                <tr key={r.id} className="border-b hover:bg-neutral-50/50">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-neutral-500 text-xs">id: {r.id}</div>
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={5}
                      value={r.ratingLocal}
                      onChange={(e) => setRow(r.id, { ratingLocal: e.target.value })}
                      className="w-24 rounded-md border border-neutral-200 px-2 py-1"
                      placeholder="es. 4.7"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      step="1"
                      min={0}
                      value={r.reviewsLocal}
                      onChange={(e) => setRow(r.id, { reviewsLocal: e.target.value })}
                      className="w-24 rounded-md border border-neutral-200 px-2 py-1"
                      placeholder="es. 32"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSuggest(r)}
                        className="px-2 py-1 border rounded-md hover:bg-neutral-100"
                        title="Suggerisci valori fittizi"
                      >
                        Suggerisci
                      </button>
                      <button
                        type="button"
                        onClick={() => onSave(r)}
                        disabled={!dirty || r.saving}
                        className="px-2 py-1 border rounded-md hover:bg-neutral-100 disabled:opacity-50"
                        title="Salva modifiche"
                      >
                        {r.saving ? "Salvataggio…" : "Salva"}
                      </button>
                    </div>
                    {r.error && <div className="text-xs text-red-600 mt-1">{r.error}</div>}
                    {!r.error && r.savedAt && <div className="text-xs text-green-700 mt-1">Salvato!</div>}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-neutral-500">
                  Nessun font trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}