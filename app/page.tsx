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
    }[];
  };
}

export default function Home() {
  const [text, setText] = React.useState("");
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
    fetchFonts().then((data) => {
      setFonts(data.fonts);
      const cats = (data.categories && data.categories.length)
        ? data.categories
        : Array.from(new Set(data.fonts.map((f) => f.category)));
      setCategories(cats);
    });
  }, []);

  // Imposta valori di default basati sulla dimensione dello schermo
  React.useEffect(() => {
    const setDefaultValues = () => {
      const isMobile = window.innerWidth < 768; // breakpoint md di Tailwind
      
      // Controlla se ci sono valori salvati nel localStorage
      const savedCols = localStorage.getItem("f4t:columns");
      
      // Se non ci sono valori salvati, imposta i default basati sul dispositivo
      if (!savedCols) {
        setColumns(isMobile ? 1 : 2); // 1 colonna su mobile, 2 su desktop
      }
    };

    // Imposta i valori al caricamento
    setDefaultValues();

    // Ascolta i cambiamenti di dimensione della finestra
    window.addEventListener('resize', setDefaultValues);
    
    return () => window.removeEventListener('resize', setDefaultValues);
  }, []);

  // Nuovi stati per la paginazione
  const [itemsPerPage, setItemsPerPage] = React.useState<number | 'all'>(20);
  const [currentPage, setCurrentPage] = React.useState<number>(1);

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

        {/* Editor globale */}
        <section className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="space-y-3">
<label className="text-base md:text-lg font-semibold text-neutral-800 tracking-wide ">Testo</label>
            <input value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded-md border border-neutral-200 px-3 py-2" placeholder="Scrivi qui…" />
          </div>
          <div className="grid grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-sm md:text-base text-neutral-600">
                Dimensione base <span className="text-neutral-500">({baseFontSizePx}px)</span>
              </label>
              <input
                type="range"
                min={12}
                max={200}
                step={1}
                value={baseFontSizePx}
                onChange={(e) => setBaseFontSizePx(parseInt(e.target.value || "0", 10) || 64)}
                className="w-full h-10 md:h-auto accent-neutral-800"
              />
            </div>
            <div>
              <label className="text-sm md:text-base text-neutral-600">Colore default</label>
              <input type="color" value={defaultColor} onChange={(e) => setDefaultColor(e.target.value)} className="w-full h-[42px] rounded-md border border-neutral-200 px-1" />
            </div>
            <div>
              <label className="text-sm md:text-base text-neutral-600">Colonne</label>
              <input
                type="range"
                min={1}
                max={4}
                step={1}
                value={columns}
                onChange={(e) => setColumns(parseInt(e.target.value, 10))}
                className="w-full h-10 md:h-auto accent-neutral-800"
              />
            </div>
          </div>
        </section>

        {/* Categoria, Preferiti e Paginazione */}
        <section className="mt-3 w-full flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm text-neutral-600">Categoria</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="rounded-md border border-neutral-200 px-3 py-2">
              <option value="Tutti">Tutti</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            
            {/* Controllo elementi per pagina */}
            <label className="text-sm text-neutral-600">Elementi per pagina</label>
            <select 
              value={itemsPerPage} 
              onChange={(e) => setItemsPerPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))} 
              className="rounded-md border border-neutral-200 px-3 py-2"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">Tutte</option>
            </select>
            
            <label className="inline-flex items-center gap-2 ml-auto text-sm">
              <input type="checkbox" checked={onlyFavorites} onChange={(e) => setOnlyFavorites(e.target.checked)} />
              Solo preferiti
            </label>
          </div>
          
          {/* Informazioni paginazione e controlli */}
          {itemsPerPage !== 'all' && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm text-neutral-600">
                Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-{Math.min(currentPage * itemsPerPage, totalItems)} di {totalItems} font
              </div>
              
              {totalPages > 1 && (
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
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-md border ${
                            currentPage === pageNum
                              ? 'bg-neutral-800 text-white border-neutral-800'
                              : 'border-neutral-200 hover:bg-neutral-50'
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
              )}
            </div>
          )}
        </section>

        {/* Griglia preview - usa paginatedFonts invece di visibleFonts */}
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
            />
          ))}
        </section>

        {/* FAQ SEO */}
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
