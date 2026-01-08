"use client";

import React from "react";
import Script from "next/script";
import { PreviewCard } from "@/components/PreviewCard";
import { useFontLoader } from "@/hooks/useFontLoader";

async function fetchFonts() {
  const res = await fetch("/api/fonts");
  return (await res.json()) as {
    categories: string[];
    fonts: {
      id: string;
      name: string;
      category: string;
      file: string;
      isPremium: boolean;
      supports?: { bold?: boolean; italic?: boolean };
      visible?: boolean;
      rating?: number;
      reviewsCount?: number;
    }[];
  };
}

export default function Home() {
  const [text, setText] = React.useState("");
  // Aggiunto stato di loading
  const [isLoading, setIsLoading] = React.useState(true);
  // Aggiorna il tipo per includere sortOrder
  const [fonts, setFonts] = React.useState<Array<{
    id: string;
    name: string;
    category: string;
    file: string;
    isPremium: boolean;
    supports?: { bold?: boolean; italic?: boolean };
    visible?: boolean;
    sortOrder?: number;
    rating?: number;
    reviewsCount?: number;
  }>>([]);

  // global default controls
  const [baseFontSizePx, setBaseFontSizePx] = React.useState<number>(50);
  const [defaultColor, setDefaultColor] = React.useState<string>("#111111");
  const [columns, setColumns] = React.useState<number>(1); // inizia con 1 colonna

  // categories
  const [categories, setCategories] = React.useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("Tutti");
  // (rimosso) const popularCategories = React.useMemo(() => [...], []);

  // preferiti
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set());
  const [onlyFavorites, setOnlyFavorites] = React.useState<boolean>(false);

  React.useEffect(() => {
    setIsLoading(true);
    fetchFonts().then((data) => {
      // Fallback deterministici: 4.3/4.7/4.9 e 17..45
      const hash = (s: string) => {
        let h = 0;
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return h;
      };
      const pickRating = (id: string) => {
        const variants = [4.3, 4.7, 4.9] as const;
        return variants[hash(id) % variants.length];
      };
      const pickReviews = (id: string) => {
        const h = hash(id);
        const min = 17;
        const max = 45;
        return min + (h % (max - min + 1));
      };

      const withDefaults = data.fonts.map(f => ({
        ...f,
        rating: typeof f.rating === "number" ? f.rating : pickRating(f.id),
        reviewsCount: typeof f.reviewsCount === "number" ? f.reviewsCount : pickReviews(f.id),
      }));

      setFonts(withDefaults);
      const cats = (data.categories && data.categories.length)
        ? data.categories
        : Array.from(new Set(data.fonts.map((f) => f.category)));
      setCategories(cats);
      setIsLoading(false);
    }).catch((error) => {
      console.error('Errore nel caricamento dei font:', error);
      setIsLoading(false);
    });
  }, []);

  // Imposta valori di default basati sulla dimensione dello schermo
  React.useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768; // breakpoint md di Tailwind
      
      // Controlla se ci sono valori salvati nel localStorage
      const savedCols = localStorage.getItem("f4t:columns");
      
      // Se c'è un valore salvato, usalo
      if (savedCols) {
        setColumns(parseInt(savedCols, 10));
      } else {
        // Altrimenti usa il default responsive
        setColumns(isMobile ? 1 : 2);
      }
    };

    // Imposta i valori al caricamento
    handleResize();

    // Ascolta i cambiamenti di dimensione della finestra
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Nuovi stati per la paginazione
  const [itemsPerPage, setItemsPerPage] = React.useState<number | 'all'>(20);
  const [currentPage, setCurrentPage] = React.useState<number>(1);

  // Refs per lo scroll
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const isFirstRender = React.useRef(true);

  // localStorage: load - aggiungi il caricamento della paginazione
  React.useEffect(() => {
    try {
      const savedCols = localStorage.getItem("f4t:columns");
      if (savedCols) setColumns(parseInt(savedCols, 10));
      const savedCat = localStorage.getItem("f4t:category");
      if (savedCat) setSelectedCategory(savedCat);
      const savedFavs = localStorage.getItem("f4t:favorites");
      if (savedFavs) {
        const arr: string[] = JSON.parse(savedFavs);
        setFavorites(new Set(arr));
      }
      // Carica impostazioni paginazione
      const savedItemsPerPage = localStorage.getItem("f4t:itemsPerPage");
      if (savedItemsPerPage) {
        setItemsPerPage(savedItemsPerPage === 'all' ? 'all' : parseInt(savedItemsPerPage, 10));
      }
    } catch {}
  }, []);

  // localStorage: persist - aggiungi il salvataggio della paginazione
  React.useEffect(() => {
    try { localStorage.setItem("f4t:columns", String(columns)); } catch {}
  }, [columns]);
  React.useEffect(() => {
    try { localStorage.setItem("f4t:category", selectedCategory); } catch {}
  }, [selectedCategory]);
  React.useEffect(() => {
    try { localStorage.setItem("f4t:favorites", JSON.stringify(Array.from(favorites))); } catch {}
  }, [favorites]);
  // Salva impostazioni paginazione
  React.useEffect(() => {
    try { localStorage.setItem("f4t:itemsPerPage", String(itemsPerPage)); } catch {}
  }, [itemsPerPage]);

  // Reset pagina corrente quando cambiano filtri o items per pagina
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, onlyFavorites, itemsPerPage]);

  // Scroll automatico ai risultati quando cambia la pagina o i filtri
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (resultsRef.current) {
      // Scrolla all'ancora dei risultati
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentPage, selectedCategory, onlyFavorites, itemsPerPage]);

  // Precarica i font scaricabili direttamente dal pubblico (solo quelli visibili)
  useFontLoader(fonts.filter((f) => f.visible !== false).map((f) => ({ name: f.name, file: f.file })));

  // Modifica visibleFonts per includere la paginazione
  const { paginatedFonts, totalPages, totalItems } = React.useMemo(() => {
    let filtered = fonts.filter((font) => {
      if (!font.visible && font.visible !== undefined) return false;
      if (selectedCategory !== "Tutti" && font.category !== selectedCategory) return false;
      if (onlyFavorites && !favorites.has(font.id)) return false;
      return true;
    });

    // Ordina per sortOrder se disponibile, altrimenti per nome
    filtered = filtered.sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name);
    });

    const totalItems = filtered.length;
    
    if (itemsPerPage === 'all') {
      return {
        paginatedFonts: filtered,
        totalPages: 1,
        totalItems
      };
    }

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFonts = filtered.slice(startIndex, endIndex);

    return {
      paginatedFonts,
      totalPages,
      totalItems
    };
  }, [fonts, selectedCategory, onlyFavorites, favorites, itemsPerPage, currentPage]);

  // Gap dinamico: su mobile, se ci sono più colonne, riduci lo spazio
  const gridGapClass = columns > 1 ? "gap-1 md:gap-6" : "gap-6";

  const toggleFavorite = React.useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Quali sono i migliori font per tatuaggi fine line?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "I font fine line per tatuaggi sono caratterizzati da linee sottili ed eleganti. Su Font 4 Tattoo puoi provarli in tempo reale e scegliere tra stili eleganti, serif, sans serif e gotici.",
        },
      },
      {
        "@type": "Question",
        name: "Posso vedere un'anteprima del mio testo con i font per tattoo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sì, inserisci il tuo testo e visualizza subito l'anteprima su decine di font per tatuaggi, anche premium.",
        },
      },
      {
        "@type": "Question",
        name: "Ci sono font eleganti e sottili per tatuaggi piccoli?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Certo. Trovi molti elegant font e fine line perfetti per tatuaggi piccoli e raffinati.",
        },
      },
      {
        "@type": "Question",
        name: "Il sito è disponibile anche in inglese?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La pagina è in italiano ma include contenuti ottimizzati anche per ricerche in inglese (es. 'elegant font for tattoo', 'fine line tattoo').",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen p-3 md:p-10">
      <section className="max-w-6xl mx-auto">
        {/* H1 solo per SEO, non visibile */}
        <h1 className="sr-only">Font 4 Tattoo: anteprima font per tatuaggi — fine line, eleganti e premium</h1>

        {/* Editor globale e Filtri - Ridisegnato */}
        <section className="mt-8 mb-10 bg-white rounded-xl shadow-sm border border-neutral-100 p-6 md:p-8">
          {/* Riga 1: Input Testo Principale */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-neutral-400 uppercase tracking-widest mb-3">
              Il tuo testo
            </label>
            <div className="relative">
              <input 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                className="w-full text-2xl md:text-3xl font-serif bg-neutral-50 border-b-2 border-neutral-200 focus:border-black focus:bg-white transition-all px-4 py-4 outline-none placeholder:text-neutral-300 placeholder:italic" 
                placeholder="Scrivi qui il tuo tatuaggio..." 
              />
              {!text && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
              )}
            </div>
          </div>

          {/* Riga 2: Controlli e Filtri */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sinistra: Controlli Visivi (Dimensione, Colore, Colonne) */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Dimensione */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Dimensione</label>
                  <span className="text-xs font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">{baseFontSizePx}px</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400">Aa</span>
                  <input
                    type="range"
                    min={12}
                    max={200}
                    step={1}
                    value={baseFontSizePx}
                    onChange={(e) => setBaseFontSizePx(parseInt(e.target.value || "0", 10) || 64)}
                    className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                  <span className="text-lg text-neutral-800">Aa</span>
                </div>
              </div>

              {/* Colore */}
              <div className="space-y-3">
                 <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Colore</label>
                 <div className="flex items-center gap-3">
                    <div className="relative w-full h-10 rounded-md overflow-hidden border border-neutral-200 shadow-sm cursor-pointer group">
                      <input 
                        type="color" 
                        value={defaultColor} 
                        onChange={(e) => setDefaultColor(e.target.value)} 
                        className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0" 
                      />
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-white/0 group-hover:bg-white/10 transition-colors">
                        <span className="text-[10px] font-mono mix-blend-difference text-white opacity-0 group-hover:opacity-100 transition-opacity uppercase">{defaultColor}</span>
                      </div>
                    </div>
                 </div>
              </div>

              {/* Colonne */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Layout</label>
                  <span className="text-xs font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">{columns} col</span>
                </div>
                <div className="flex items-center gap-2 bg-neutral-50 p-1 rounded-lg border border-neutral-100">
                  {[1, 2, 3, 4].map((col) => (
                    <button
                      key={col}
                      onClick={() => setColumns(col)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                        columns === col 
                          ? 'bg-white text-black shadow-sm border border-neutral-200' 
                          : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Separatore Verticale (solo desktop) */}
            <div className="hidden lg:block w-px h-24 bg-neutral-100 mx-auto"></div>

            {/* Destra: Filtri (Categoria, Paginazione) */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Categoria */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Stile Font</label>
                <div className="relative">
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)} 
                    className="w-full appearance-none bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-lg px-4 py-2.5 pr-8 focus:outline-none focus:border-neutral-400 focus:bg-white transition-colors cursor-pointer"
                  >
                    <option value="Tutti">Tutti gli stili</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>

              {/* Toggle Preferiti e Paginazione */}
              <div className="flex items-center justify-between gap-4">
                <label className={`flex items-center gap-2.5 cursor-pointer px-3 py-2 rounded-lg border transition-all select-none ${onlyFavorites ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
                  <input type="checkbox" checked={onlyFavorites} onChange={(e) => setOnlyFavorites(e.target.checked)} className="hidden" />
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={onlyFavorites ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                  <span className="text-sm font-medium">Preferiti</span>
                </label>

                <div className="flex items-center gap-2">
                   <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Mostra</label>
                   <select 
                      value={itemsPerPage} 
                      onChange={(e) => setItemsPerPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))} 
                      className="appearance-none bg-neutral-50 border border-neutral-200 rounded-md px-2 py-1 text-sm focus:outline-none cursor-pointer text-center min-w-[3rem]"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value="all">Tutti</option>
                    </select>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Ancora per lo scroll */}
        <div ref={resultsRef} className="scroll-mt-8" />

        {/* Paginazione Superiore */}
        {itemsPerPage !== 'all' && totalPages > 1 && (
             <div className="mb-6 flex justify-end">
                  <div className="inline-flex items-center bg-white rounded-lg border border-neutral-200 p-1 shadow-sm">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-md text-sm font-medium text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
                      >
                        ← Prev
                      </button>
                      <div className="px-3 py-1.5 border-l border-r border-neutral-100 text-xs font-mono text-neutral-400">
                        {currentPage} / {totalPages}
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-md text-sm font-medium text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
                      >
                        Next →
                      </button>
                  </div>
             </div>
        )}

        {/* Griglia preview - usa paginatedFonts invece di visibleFonts */}
        {isLoading ? (
          <div className="mt-6 flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-800 mb-4"></div>
            <p className="text-neutral-600 text-lg">Caricamento font...</p>
            <p className="text-neutral-500 text-sm mt-1">Stiamo preparando la tua collezione di font per tatuaggi</p>
          </div>
        ) : (
          <section className={`mt-6 grid ${gridGapClass}`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {paginatedFonts.map((f) => (
              <PreviewCard
                key={f.id}
                fontId={f.id}
                fontName={f.name}
                fontCssFamily={f.name}
                text={text || "Anteprima"}
                premium={f.isPremium}
                supports={f.supports}
                baseFontSizePx={baseFontSizePx}
                defaultColor={defaultColor}
                isFavorite={favorites.has(f.id)}
                onToggleFavorite={toggleFavorite}
                rating={f.rating}
                reviewsCount={f.reviewsCount}
              />
            ))}
          </section>
        )}

        {/* Controlli di paginazione inferiori */}
        {itemsPerPage !== 'all' && totalPages > 1 && (
          <div className="py-3">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm text-neutral-600">
                  Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-{Math.min(currentPage * itemsPerPage, totalItems)} di {totalItems} font
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md border border-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                  >
                    Precedente
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-2 py-1 rounded-md text-sm ${
                            isActive
                              ? 'bg-neutral-800 text-white'
                              : 'border border-neutral-200 hover:bg-neutral-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-md border border-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                  >
                    Successiva
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="mt-12">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Domande frequenti sui font per tatuaggi</h2>
          <div className="mt-4 grid gap-3 max-w-3xl mx-auto">
            <details className="border rounded-md p-4">
              <summary className="font-medium cursor-pointer">Quali sono i migliori font per tatuaggi fine line?</summary>
              <p className="mt-2 text-sm text-neutral-700">I font fine line hanno linee sottili e pulite, ideali per tatuaggi eleganti e discreti. Provali con il tuo testo per vedere subito il risultato.</p>
            </details>
            <details className="border rounded-md p-4">
              <summary className="font-medium cursor-pointer">Posso visualizzare l&apos;anteprima del mio testo?</summary>
              <p className="mt-2 text-sm text-neutral-700">Sì, scrivi il tuo testo nella casella in alto e confronta instantaneamente più stili, anche premium.</p>
            </details>
            <details className="border rounded-md p-4">
              <summary className="font-medium cursor-pointer">Avete font eleganti e sottili per tatuaggi piccoli?</summary>
              <p className="mt-2 text-sm text-neutral-700">Certo, la nostra selezione include elegant font e fine line perfetti per piccoli tatuaggi raffinati.</p>
            </details>
          </div>
        </section>

        <Script id="jsonld-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      </section>
    </main>
  );
}
