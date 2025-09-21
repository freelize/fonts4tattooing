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
  const [fonts, setFonts] = React.useState<Array<{
    id: string;
    name: string;
    category: string;
    file: string;
    isPremium: boolean;
    supports?: { bold?: boolean; italic?: boolean };
    visible?: boolean;
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

  // localStorage: load
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
    } catch {}
  }, []);

  // localStorage: persist
  React.useEffect(() => {
    try { localStorage.setItem("f4t:columns", String(columns)); } catch {}
  }, [columns]);
  React.useEffect(() => {
    try { localStorage.setItem("f4t:category", selectedCategory); } catch {}
  }, [selectedCategory]);
  React.useEffect(() => {
    try { localStorage.setItem("f4t:favorites", JSON.stringify(Array.from(favorites))); } catch {}
  }, [favorites]);

  // Precarica i font scaricabili direttamente dal pubblico (solo quelli visibili)
  useFontLoader(fonts.filter((f) => f.visible !== false).map((f) => ({ name: f.name, file: f.file })));

  const visibleFonts = React.useMemo(() => {
    let list = fonts.filter((f) => f.visible !== false);
    if (selectedCategory !== "Tutti") list = list.filter((f) => f.category === selectedCategory);
    if (onlyFavorites) list = list.filter((f) => favorites.has(f.id));
    return list;
  }, [fonts, selectedCategory, onlyFavorites, favorites]);

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

        {/* Categoria e Preferiti */}
        <section className="mt-3 w-full flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm text-neutral-600">Categoria</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="rounded-md border border-neutral-200 px-3 py-2">
              <option value="Tutti">Tutti</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 ml-auto text-sm">
              <input type="checkbox" checked={onlyFavorites} onChange={(e) => setOnlyFavorites(e.target.checked)} />
              Solo preferiti
            </label>
          </div>
        </section>

        {/* Griglia preview */}
        <section className={`mt-6 grid ${gridGapClass}`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {visibleFonts.map((f) => (
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
              <summary className="font-medium cursor-pointer">Posso visualizzare l'anteprima del mio testo?</summary>
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
