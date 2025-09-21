"use client";

import React from "react";
import { useFontLoader } from "@/hooks/useFontLoader";

// Definizione del tipo FontListItem
type FontListItem = {
  id: string;
  name: string;
  category: string;
  file: string;
  isPremium: boolean;
  supports?: { bold?: boolean; italic?: boolean };
  visible?: boolean;
  sortOrder?: number;
};

export default function UploadForm() {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [showCustomCategory, setShowCustomCategory] = React.useState(false);
  const [isPremium, setIsPremium] = React.useState(false);
  const [supportsBold, setSupportsBold] = React.useState<boolean>(true);
  const [supportsItalic, setSupportsItalic] = React.useState<boolean>(true);
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Stati per la gestione dei font
  const [fonts, setFonts] = React.useState<FontListItem[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [loadingFonts, setLoadingFonts] = React.useState<boolean>(false);
  const [fontsError, setFontsError] = React.useState<string | null>(null);

  // Filtri e ordinamento
  const [filterCategory, setFilterCategory] = React.useState<string>("Tutte");
  const [filterVisibility, setFilterVisibility] = React.useState<"all" | "visible" | "hidden">("all");
  const [filterPremium, setFilterPremium] = React.useState<"all" | "yes" | "no">("all");
  const [sortBy, setSortBy] = React.useState<"sortOrder" | "name_asc" | "name_desc" | "category_asc" | "category_desc">("sortOrder");

  // Selezione multipla
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  // Conferma modale
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<
    null | { type: "delete_one" | "delete_bulk"; payload?: { id: string; name?: string } }
  >(null);

  const fetchFontsList = React.useCallback(async () => {
    setLoadingFonts(true);
    setFontsError(null);
    try {
      // Aggiungi un timestamp per evitare il caching
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/fonts?_t=${timestamp}`, { 
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = (await res.json()) as { categories?: string[]; fonts?: FontListItem[] };
      setFonts(Array.isArray(data.fonts) ? data.fonts : []);
      const cats: string[] =
        Array.isArray(data.categories) && data.categories.length
          ? data.categories
          : Array.from(
              new Set(((Array.isArray(data.fonts) ? data.fonts : []) as Array<{ category: string }>).map((f) => String(f.category || ""))))
              .filter(Boolean);
      setCategories(cats);
      setSelected(new Set());
    } catch {
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

  async function toggleVisibility(f: { id: string; visible?: boolean }) {
    const res = await fetch(`/api/fonts/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: !f.visible }),
    });
    if (res.ok) fetchFontsList();
  }

  // Aggiungi stato per drag and drop
  const [draggedItem, setDraggedItem] = React.useState<string | null>(null);
  const [reorderMode, setReorderMode] = React.useState<boolean>(false);
  const [draggedOverItem, setDraggedOverItem] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const [dragStartPos, setDragStartPos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const draggedElementRef = React.useRef<HTMLElement | null>(null);

  // Prima definisci filteredFonts
  const filteredFonts = React.useMemo(() => {
    let list = [...fonts];
    
    // Applica filtri
    if (filterVisibility === "visible") list = list.filter((f) => f.visible !== false);
    if (filterVisibility === "hidden") list = list.filter((f) => f.visible === false);
    if (filterCategory !== "Tutte") list = list.filter((f) => f.category === filterCategory);
    if (filterPremium === "yes") list = list.filter((f) => !!f.isPremium);
    if (filterPremium === "no") list = list.filter((f) => !f.isPremium);
    
    // Ordinamento
    const cmp = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });
    switch (sortBy) {
      case "sortOrder":
        list.sort((a, b) => {
          if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
            return a.sortOrder - b.sortOrder;
          }
          if (a.sortOrder !== undefined) return -1;
          if (b.sortOrder !== undefined) return 1;
          return cmp(a.name, b.name);
        });
        break;
      case "name_asc": list.sort((a, b) => cmp(a.name, b.name)); break;
      case "name_desc": list.sort((a, b) => cmp(b.name, a.name)); break;
      case "category_asc": list.sort((a, b) => cmp(a.category, b.category)); break;
      case "category_desc": list.sort((a, b) => cmp(b.category, a.category)); break;
    }
    
    return list;
  }, [fonts, filterCategory, filterVisibility, filterPremium, sortBy]);

  // Funzione per riordinare i font
  const handleReorder = React.useCallback(async (fontIds: string[], category?: string) => {
    try {
      const response = await fetch('/api/fonts/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fontIds, category })
      });
      
      if (response.ok) {
        // Forza il refresh della lista con cache busting
        await fetchFontsList();
        setStatus('Ordine aggiornato con successo!');
        // Disattiva la modalità riordinamento dopo il successo
        setReorderMode(false);
      } else {
        setStatus('Errore nell\'aggiornamento dell\'ordine');
      }
    } catch (error) {
      console.error('Errore nel riordinamento:', error);
      setStatus('Errore nell\'aggiornamento dell\'ordine');
    }
  }, [fetchFontsList]);

  // Gestori drag and drop per desktop
  const handleDragStart = React.useCallback((e: React.DragEvent, fontId: string) => {
    setDraggedItem(fontId);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', fontId);
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent, fontId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverItem(fontId);
  }, []);

  const handleDragLeave = React.useCallback(() => {
    setDraggedOverItem(null);
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent, targetFontId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetFontId) {
      setDraggedItem(null);
      setDraggedOverItem(null);
      setIsDragging(false);
      return;
    }

    const currentFonts = filteredFonts;
    const draggedIndex = currentFonts.findIndex(f => f.id === draggedItem);
    const targetIndex = currentFonts.findIndex(f => f.id === targetFontId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...currentFonts];
    const [draggedFont] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedFont);

    const fontIds = newOrder.map(f => f.id);
    const category = filterCategory !== 'Tutte' ? filterCategory : undefined;
    
    handleReorder(fontIds, category);
    setDraggedItem(null);
    setDraggedOverItem(null);
    setIsDragging(false);
  }, [draggedItem, filteredFonts, filterCategory, handleReorder]);

  // Gestori touch migliorati per iOS
  const handleTouchStart = React.useCallback((e: React.TouchEvent, fontId: string) => {
    // Previeni il comportamento di default solo se necessario
    const touch = e.touches[0];
    setDragStartPos({ x: touch.clientX, y: touch.clientY });
    
    const targetElement = e.currentTarget as HTMLElement;
    draggedElementRef.current = targetElement;

    // Timeout più breve per iOS
    dragTimeoutRef.current = setTimeout(() => {
      setDraggedItem(fontId);
      setIsDragging(true);
      
      // Feedback tattile per iOS
      if (navigator.vibrate) {
        navigator.vibrate([50]);
      }
      
      // Feedback visivo immediato
      if (targetElement) {
        targetElement.style.transform = 'scale(1.02)';
        targetElement.style.zIndex = '1000';
      }
    }, 100); // Ridotto da 150ms a 100ms per iOS
  }, []);

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - dragStartPos.x);
    const deltaY = Math.abs(touch.clientY - dragStartPos.y);
    
    // Se non stiamo ancora trascinando, controlla se iniziare
    if (!isDragging) {
      // Cancella il drag se movimento orizzontale troppo grande
      if (deltaX > deltaY && deltaX > 15) {
        if (dragTimeoutRef.current) {
          clearTimeout(dragTimeoutRef.current);
          dragTimeoutRef.current = null;
        }
        return;
      }
      
      // Previeni scroll solo se movimento verticale significativo
      if (deltaY > 5) {
        e.preventDefault();
      }
      return;
    }

    // Se stiamo trascinando, previeni sempre il default
    e.preventDefault();
    
    // Trova l'elemento sotto il dito
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetRow = elementBelow?.closest('[data-font-id]');
    const targetId = targetRow?.getAttribute('data-font-id');
    
    setDraggedOverItem(targetId || null);
  }, [isDragging, dragStartPos]);

  const handleTouchEnd = React.useCallback((e: React.TouchEvent) => {
    // Cleanup del timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }

    // Reset dello stile
    if (draggedElementRef.current) {
      draggedElementRef.current.style.transform = '';
      draggedElementRef.current.style.zIndex = '';
      draggedElementRef.current = null;
    }

    if (!isDragging || !draggedItem) {
      setDraggedItem(null);
      setIsDragging(false);
      setDraggedOverItem(null);
      return;
    }

    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetRow = elementBelow?.closest('[data-font-id]');
    const targetId = targetRow?.getAttribute('data-font-id');

    if (targetId && targetId !== draggedItem) {
      const currentFonts = filteredFonts;
      const draggedIndex = currentFonts.findIndex(f => f.id === draggedItem);
      const targetIndex = currentFonts.findIndex(f => f.id === targetId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newOrder = [...currentFonts];
        const [draggedFont] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedFont);

        const fontIds = newOrder.map(f => f.id);
        const category = filterCategory !== 'Tutte' ? filterCategory : undefined;
        
        handleReorder(fontIds, category);
        
        // Feedback tattile di successo
        if (navigator.vibrate) {
          navigator.vibrate([30, 50, 30]);
        }
      }
    }

    setDraggedItem(null);
    setIsDragging(false);
    setDraggedOverItem(null);
  }, [isDragging, draggedItem, filteredFonts, filterCategory, handleReorder]);

  // Cleanup del timeout
  React.useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  
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

  function EditRow({ f, selected, onToggleSelect }: { f: FontListItem; selected: boolean; onToggleSelect: () => void }) {
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
            <div className="mt-2">
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".ttf,.otf,.woff2" 
                className="hidden" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-md border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-600 hover:border-neutral-400 hover:bg-neutral-100 transition-colors"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-neutral-800 font-medium">{file.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Clicca per selezionare un file font</span>
                  </div>
                )}
              </button>
              {file && (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="mt-2 text-xs text-red-600 hover:text-red-800"
                >
                  Rimuovi file
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm text-neutral-600">Nome visualizzato</label>
            <input type="text" className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-2" placeholder="Es. Blackletter X" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-neutral-600">Categoria</label>
            <div className="mt-2 space-y-2">
              <select 
                className="w-full rounded-md border border-neutral-200 px-3 py-2" 
                value={showCustomCategory ? "custom" : category}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setShowCustomCategory(true);
                    setCategory("");
                  } else {
                    setShowCustomCategory(false);
                    setCategory(e.target.value);
                  }
                }}
              >
                <option value="">Seleziona una categoria esistente</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="custom">+ Crea nuova categoria</option>
              </select>
              
              {showCustomCategory && (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 rounded-md border border-neutral-200 px-3 py-2" 
                    placeholder="Scrivi il nome della nuova categoria" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomCategory(false);
                      setCategory("");
                    }}
                    className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700"
                  >
                    Annulla
                  </button>
                </div>
              )}
            </div>
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
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-600">Visibilità</label>
            <select
              className="block rounded-md border border-neutral-200 px-2 py-1"
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value as "all" | "visible" | "hidden")}
            >
              <option value="all">Tutti</option>
              <option value="visible">Visibili</option>
              <option value="hidden">Nascosti</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-600">Premium</label>
            <select
              className="block rounded-md border border-neutral-200 px-2 py-1"
              value={filterPremium}
              onChange={(e) => setFilterPremium(e.target.value as "all" | "yes" | "no")}
            >
              <option value="all">Tutti</option>
              <option value="yes">Premium</option>
              <option value="no">Non premium</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-600">Ordina per</label>
            <select
              className="block rounded-md border border-neutral-200 px-2 py-1"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "name_asc" | "name_desc" | "category_asc" | "category_desc")
              }
            >
              <option value="sortOrder">Ordine personalizzato</option>
              <option value="name_asc">Nome (A-Z)</option>
              <option value="name_desc">Nome (Z-A)</option>
              <option value="category_asc">Categoria A→Z</option>
              <option value="category_desc">Categoria Z→A</option>
            </select>
          </div>

          {/* Azioni bulk */}
          <div className="ml-auto flex items-center gap-2">
            <button 
              onClick={() => setReorderMode(!reorderMode)} 
              className={`rounded border px-3 py-1 text-xs ${
                reorderMode 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {reorderMode ? 'Esci da riordino' : 'Riordina font'}
            </button>
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
                  reorderMode ? (
                    <tr 
                      key={f.id}
                      data-font-id={f.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, f.id)}
                      onDragOver={(e) => handleDragOver(e, f.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, f.id)}
                      onTouchStart={(e) => handleTouchStart(e, f.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className={`border-t border-neutral-200 cursor-move select-none transition-all duration-150 ${
                        draggedItem === f.id 
                          ? 'opacity-70 bg-blue-100 shadow-xl transform scale-105 z-50' 
                          : draggedOverItem === f.id 
                            ? 'bg-blue-50 border-blue-300 shadow-md' 
                            : 'hover:bg-gray-50'
                      }`}
                      style={{
                        touchAction: 'pan-y', // Permette scroll verticale ma previene altri gesti
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        WebkitTouchCallout: 'none', // Previene il menu contestuale su iOS
                        WebkitTapHighlightColor: 'transparent', // Rimuove l'highlight su iOS
                        position: draggedItem === f.id ? 'relative' : 'static',
                        zIndex: draggedItem === f.id ? 1000 : 'auto'
                      }}
                    >
                      <td className="py-3 pr-4 align-middle">
                        <div className={`flex items-center justify-center w-8 h-8 rounded transition-colors ${
                          isDragging && draggedItem === f.id 
                            ? 'text-blue-600 bg-blue-100' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM4 6a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM5 13a1 1 0 100 2h10a1 1 0 100-2H5z"/>
                          </svg>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-medium">{f.name}</td>
                      <td className="py-3 pr-4 text-gray-600">{f.category}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          f.isPremium 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {f.isPremium ? "Premium" : "Standard"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-neutral-700 text-sm">
                          {f.supports?.bold ? "Bold" : ""}{f.supports?.bold && f.supports?.italic ? ", " : ""}{f.supports?.italic ? "Italic" : ""}
                          {!f.supports?.bold && !f.supports?.italic ? "—" : ""}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span style={{ fontFamily: f.name }} className="inline-block px-3 py-1 rounded bg-neutral-50 text-sm">
                          Anteprima
                        </span>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isDragging && draggedItem === f.id ? (
                            <div className="flex items-center gap-1 text-blue-600">
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                              <span className="text-xs font-medium">Trascinando...</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Tieni premuto per trascinare</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <EditRow key={f.id} f={f} selected={selected.has(f.id)} onToggleSelect={() => toggleSelect(f.id)} />
                  )
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
            <h3 className="text-base font-semibold mb-2">Confermi l&apos;eliminazione?</h3>
            <p className="text-sm text-neutral-600 mb-4">
              {confirmAction?.type === "delete_one"
                ? `Il font "${confirmAction?.payload?.name}" verrà eliminato definitivamente.`
                : `Verranno eliminati ${selected.size} font. L&apos;operazione è irreversibile.`}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setConfirmOpen(false); setConfirmAction(null); }} className="rounded border px-3 py-1 text-sm">Annulla</button>
              <button onClick={async () => {
                if (confirmAction?.type === "delete_one" && confirmAction.payload?.id) {
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

 