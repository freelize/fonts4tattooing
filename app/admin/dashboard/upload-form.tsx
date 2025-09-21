"use client";

import React from "react";
import { useFontLoader } from "@/hooks/useFontLoader";

export default function UploadForm() {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [isPremium, setIsPremium] = React.useState(false);
  const [supportsBold, setSupportsBold] = React.useState<boolean>(true);
  const [supportsItalic, setSupportsItalic] = React.useState<boolean>(true);
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);

  // Fonts list state
  const [fonts, setFonts] = React.useState<Array<{
    id: string;
    name: string;
    category: string;
    file: string;
    isPremium: boolean;
    supports?: { bold?: boolean; italic?: boolean };
    visible?: boolean;
  }>>([]);
  const [loadingFonts, setLoadingFonts] = React.useState<boolean>(false);
  const [fontsError, setFontsError] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<string[]>([]);

  // Filtri e ordinamento
  const [filterCategory, setFilterCategory] = React.useState<string>("Tutte");
  const [filterVisibility, setFilterVisibility] = React.useState<"all" | "visible" | "hidden">("all");
  const [filterPremium, setFilterPremium] = React.useState<"all" | "yes" | "no">("all");
  const [sortBy, setSortBy] = React.useState<"name_asc" | "name_desc" | "category_asc" | "category_desc">("name_asc");

  // Selezione multipla
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  // Conferma modale
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<null | { type: "delete_one" | "delete_bulk"; payload?: any }>(null);

  const fetchFontsList = React.useCallback(async () => {
    setLoadingFonts(true);
    setFontsError(null);
    try {
      const res = await fetch("/api/fonts", { cache: "no-store" });
      const data = (await res.json()) as { categories?: string[]; fonts?: any[] };
      setFonts(Array.isArray(data.fonts) ? data.fonts : []);
      const cats: string[] = Array.isArray(data.categories) && data.categories.length
        ? data.categories
        : Array.from(new Set(((Array.isArray(data.fonts) ? data.fonts : []) as any[]).map((f: any) => String(f.category || "")))).filter(Boolean);
      setCategories(cats);
      setSelected(new Set());
    } catch (e) {
      setFontsError("Impossibile caricare l'elenco dei font");
    } finally {
      setLoadingFonts(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFontsList();
  }, [fetchFontsList]);

  // Precarica i font per l'anteprima nella lista
  useFontLoader(fonts.map((f) => ({ name: f.name, file: f.file })));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    if (!file || !trimmedName || !trimmedCategory) {
      setStatus("Compila tutti i campi, seleziona un file, nome e categoria non possono essere vuoti");
      return;
    }
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!["ttf", "otf", "woff2"].includes(ext)) {
      setStatus("Formato non supportato. Usa .ttf, .otf o .woff2");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", trimmedName);
    fd.append("category", trimmedCategory);
    fd.append("isPremium", String(isPremium));
    fd.append("supportsBold", String(supportsBold));
    fd.append("supportsItalic", String(supportsItalic));

    const res = await fetch("/api/fonts/upload", { method: "POST", body: fd });
    if (res.ok) {
      setStatus("Font caricato con successo");
      setName("");
      setCategory("");
      setIsPremium(false);
      setSupportsBold(true);
      setSupportsItalic(true);
      setFile(null);
      // Refresh list
      fetchFontsList();
    } else {
      const j = await res.json().catch(() => ({ error: "Errore" }));
      setStatus(j.error || "Errore nel caricamento");
    }
  };

  async function performDeleteFont(id: string) {
    const res = await fetch(`/api/fonts/${id}`, { method: "DELETE" });
    if (res.ok) fetchFontsList();
  }

  async function toggleVisibility(f: any) {
    const res = await fetch(`/api/fonts/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: !f.visible }),
    });
    if (res.ok) fetchFontsList();
  }

  const filteredFonts = React.useMemo(() => {
    let list = [...fonts];
    // Visibilità
    if (filterVisibility === "visible") list = list.filter((f) => f.visible !== false);
    if (filterVisibility === "hidden") list = list.filter((f) => f.visible === false);
    // Categoria
    if (filterCategory !== "Tutte") list = list.filter((f) => f.category === filterCategory);
    // Premium
    if (filterPremium === "yes") list = list.filter((f) => !!f.isPremium);
    if (filterPremium === "no") list = list.filter((f) => !f.isPremium);
    // Ordinamento
    const cmp = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });
    switch (sortBy) {
      case "name_asc": list.sort((a, b) => cmp(a.name, b.name)); break;
      case "name_desc": list.sort((a, b) => cmp(b.name, a.name)); break;
      case "category_asc": list.sort((a, b) => cmp(a.category, b.category)); break;
      case "category_desc": list.sort((a, b) => cmp(b.category, a.category)); break;
    }
    return list;
  }, [fonts, filterCategory, filterVisibility, filterPremium, sortBy]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const allSelected = filteredFonts.length > 0 && filteredFonts.every((f) => selected.has(f.id));
  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (allSelected) return new Set();
      const next = new Set<string>(prev);
      filteredFonts.forEach((f) => next.add(f.id));
      return next;
    });
  };

  async function bulkSetVisibility(visible: boolean) {
    if (selected.size === 0) return;
    await Promise.all(Array.from(selected).map((id) => fetch(`/api/fonts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible }),
    })));
    setSelected(new Set());
    fetchFontsList();
  }

  async function performBulkDelete() {
    if (selected.size === 0) return;
    await Promise.all(Array.from(selected).map((id) => fetch(`/api/fonts/${id}`, { method: "DELETE" })));
    setSelected(new Set());
    fetchFontsList();
  }

  function EditRow({ f, selected, onToggleSelect }: { f: any; selected: boolean; onToggleSelect: () => void }) {
    const [edit, setEdit] = React.useState(false);
    const [name, setName] = React.useState(f.name);
    const [category, setCategory] = React.useState(f.category);
    const [isPremium, setIsPremium] = React.useState(!!f.isPremium);
    const [supportsBold, setSupportsBold] = React.useState(!!f.supports?.bold);
    const [supportsItalic, setSupportsItalic] = React.useState(!!f.supports?.italic);
    const [error, setError] = React.useState<string | null>(null);

    const save = async () => {
      const trimmedName = String(name || "").trim();
      const trimmedCategory = String(category || "").trim();
      if (!trimmedName || !trimmedCategory) {
        setError("Nome e categoria non possono essere vuoti");
        return;
      }
      setError(null);
      const res = await fetch(`/api/fonts/${f.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, category: trimmedCategory, isPremium, supportsBold, supportsItalic }),
      });
      if (res.ok) {
        setEdit(false);
        fetchFontsList();
      }
    };

    return (
      <tr className="border-t border-neutral-200">
        <td className="py-2 pr-4 align-top">
          <input type="checkbox" checked={selected} onChange={onToggleSelect} />
        </td>
        <td className="py-2 pr-4">
          {edit ? (
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-40 rounded border border-neutral-200 px-2 py-1" />
          ) : (
            <span>{f.name}</span>
          )}
          {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
        </td>
        <td className="py-2 pr-4">
          {edit ? (
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-32 rounded border border-neutral-200 px-2 py-1" />
          ) : (
            <span>{f.category}</span>
          )}
        </td>
        <td className="py-2 pr-4">
          {edit ? (
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} /> Premium</label>
          ) : (
            <span>{f.isPremium ? "Sì" : "No"}</span>
          )}
        </td>
        <td className="py-2 pr-4">
          {edit ? (
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={supportsBold} onChange={(e) => setSupportsBold(e.target.checked)} /> Bold</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={supportsItalic} onChange={(e) => setSupportsItalic(e.target.checked)} /> Italic</label>
            </div>
          ) : (
            <span className="text-neutral-700">
              {f.supports?.bold ? "Bold" : ""}{f.supports?.bold && f.supports?.italic ? ", " : ""}{f.supports?.italic ? "Italic" : ""}
              {!f.supports?.bold && !f.supports?.italic ? "—" : ""}
            </span>
          )}
        </td>
        <td className="py-2 pr-4">
          <span style={{ fontFamily: f.name }} className="inline-block px-2 py-1 rounded bg-neutral-50">
            Anteprima
          </span>
        </td>
        <td className="py-2 pr-4 whitespace-nowrap">
          <button onClick={() => toggleVisibility(f)} className="mr-2 rounded border px-2 py-1 text-xs">
            {f.visible === false ? "Rendi visibile" : "Nascondi"}
          </button>
          {edit ? (
            <>
              <button onClick={save} className="mr-2 rounded bg-black text-white px-2 py-1 text-xs">Salva</button>
              <button onClick={() => setEdit(false)} className="rounded border px-2 py-1 text-xs">Annulla</button>
            </>
          ) : (
            <>
              <button onClick={() => setEdit(true)} className="mr-2 rounded border px-2 py-1 text-xs">Modifica</button>
              <button onClick={() => { setConfirmAction({ type: "delete_one", payload: { id: f.id, name: f.name } }); setConfirmOpen(true); }} className="rounded border border-red-300 text-red-700 px-2 py-1 text-xs">Elimina</button>
            </>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="border border-neutral-200 rounded-xl p-6 bg-white">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-neutral-600">File del font</label>
            <input type="file" accept=".ttf,.otf,.woff2" className="mt-2 block w-full" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div>
            <label className="text-sm text-neutral-600">Nome visualizzato</label>
            <input type="text" className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-2" placeholder="Es. Blackletter X" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-neutral-600">Categoria</label>
            <input type="text" className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-2" placeholder="Es. Gotico" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id="premium" type="checkbox" className="rounded" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
            <label htmlFor="premium" className="text-sm text-neutral-700">Premium</label>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id="supportsBold" type="checkbox" className="rounded" checked={supportsBold} onChange={(e) => setSupportsBold(e.target.checked)} />
            <label htmlFor="supportsBold" className="text-sm text-neutral-700">Supporta grassetto</label>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id="supportsItalic" type="checkbox" className="rounded" checked={supportsItalic} onChange={(e) => setSupportsItalic(e.target.checked)} />
            <label htmlFor="supportsItalic" className="text-sm text-neutral-700">Supporta corsivo</label>
          </div>
        </div>
        <button type="submit" className="mt-6 rounded-md bg-black text-white px-4 py-2">Salva</button>
        {status && <p className="mt-3 text-sm text-neutral-700">{status}</p>}
      </form>

      <section className="border border-neutral-200 rounded-xl p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Font esistenti</h2>
          {loadingFonts && <span className="text-sm text-neutral-500">Caricamento…</span>}
        </div>

        {/* Barra filtri e azioni */}
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="text-xs text-neutral-600">Categoria</label>
            <select className="block rounded-md border border-neutral-200 px-2 py-1" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="Tutte">Tutte</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-600">Visibilità</label>
            <select className="block rounded-md border border-neutral-200 px-2 py-1" value={filterVisibility} onChange={(e) => setFilterVisibility(e.target.value as any)}>
              <option value="all">Tutti</option>
              <option value="visible">Visibili</option>
              <option value="hidden">Nascosti</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-600">Premium</label>
            <select className="block rounded-md border border-neutral-200 px-2 py-1" value={filterPremium} onChange={(e) => setFilterPremium(e.target.value as any)}>
              <option value="all">Tutti</option>
              <option value="yes">Premium</option>
              <option value="no">Non premium</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-600">Ordina per</label>
            <select className="block rounded-md border border-neutral-200 px-2 py-1" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="name_asc">Nome A→Z</option>
              <option value="name_desc">Nome Z→A</option>
              <option value="category_asc">Categoria A→Z</option>
              <option value="category_desc">Categoria Z→A</option>
            </select>
          </div>

          {/* Azioni bulk */}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => bulkSetVisibility(true)} disabled={selected.size === 0} className="rounded border px-3 py-1 text-xs disabled:opacity-50">Rendi visibili</button>
            <button onClick={() => bulkSetVisibility(false)} disabled={selected.size === 0} className="rounded border px-3 py-1 text-xs disabled:opacity-50">Nascondi selezionati</button>
            <button onClick={() => { setConfirmAction({ type: "delete_bulk" }); setConfirmOpen(true); }} disabled={selected.size === 0} className="rounded border border-red-300 text-red-700 px-3 py-1 text-xs disabled:opacity-50">Elimina selezionati</button>
          </div>
        </div>

        {fontsError && (
          <p className="text-sm text-red-600">{fontsError}</p>
        )}
        {!fontsError && fonts.length === 0 && !loadingFonts && (
          <p className="text-sm text-neutral-600">Nessun font presente.</p>
        )}
        {fonts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-600">
                  <th className="py-2 pr-4"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} /></th>
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">Categoria</th>
                  <th className="py-2 pr-4">Premium</th>
                  <th className="py-2 pr-4">Supporti</th>
                  <th className="py-2 pr-4">Anteprima</th>
                  <th className="py-2 pr-4">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredFonts.map((f) => (
                  <EditRow key={f.id} f={f} selected={selected.has(f.id)} onToggleSelect={() => toggleSelect(f.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modale conferma */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg">
            <h3 className="text-base font-semibold mb-2">Confermi l'eliminazione?</h3>
            <p className="text-sm text-neutral-600 mb-4">
              {confirmAction?.type === "delete_one" ? `Il font "${confirmAction?.payload?.name}" verrà eliminato definitivamente.` : `Verranno eliminati ${selected.size} font. L'operazione è irreversibile.`}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setConfirmOpen(false); setConfirmAction(null); }} className="rounded border px-3 py-1 text-sm">Annulla</button>
              <button onClick={async () => {
                if (confirmAction?.type === "delete_one") {
                  await performDeleteFont(confirmAction.payload.id);
                } else if (confirmAction?.type === "delete_bulk") {
                  await performBulkDelete();
                }
                setConfirmOpen(false);
                setConfirmAction(null);
              }} className="rounded bg-red-600 text-white px-3 py-1 text-sm">Elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}