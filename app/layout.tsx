import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Font 4 Tattoo",
  title: {
    default: "Font 4 Tattoo — Fineline Font for Tattoo",
    template: "%s | Font 4 Tattoo",
  },
  description:
    "Font 4 Tattoo: anteprima testi in tempo reale dei migliori font per tatuaggi. Fine line tattoo, tatuaggi sottili, font eleganti e premium per tatuaggi piccoli ed eleganti. Elegant font, premium font, font for tattoo.",
  keywords: [
    // IT
    "font per tatuaggi",
    "font tatuaggi",
    "font per tattoo",
    "tatuaggi sottili",
    "font sottili",
    "font eleganti",
    "tatuaggi eleganti",
    "tatuaggi piccoli",
    "font gotico",
    // EN
    "font for tattoo",
    "fonts for tattoo",
    "fine line tattoo",
    "fineline font",
    "elegant font",
    "premium font",
  ],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Font 4 Tattoo",
    title: "Font 4 Tattoo — Fineline Font for Tattoo",
    description:
      "Anteprima font per tatuaggi: fine line, eleganti, premium. Prova il testo in tempo reale.",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "Font 4 Tattoo" },
    ],
    locale: "it_IT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Font 4 Tattoo — Fineline Font for Tattoo",
    description:
      "Anteprima font per tatuaggi: fine line, eleganti, premium. Prova il testo in tempo reale.",
    images: ["/og-image.png"],
  },
  category: "tattoo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Font 4 Tattoo",
    url: siteUrl,
    description:
      "Font 4 Tattoo: anteprima testi in tempo reale dei migliori font per tatuaggi. Fine line tattoo, tatuaggi sottili, font eleganti e premium.",
    inLanguage: "it-IT",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="it">
      <body className="bg-white text-neutral-900 antialiased selection:bg-black selection:text-white">
        {/* Header brand */}
        <header className="relative border-b border-neutral-200 bg-neutral-50 overflow-hidden">
          {/* Texture di sfondo: Pattern a puntini sottile */}
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#171717 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          </div>
          {/* Sfumatura leggera per profondità */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-transparent to-neutral-100/40 pointer-events-none"></div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 py-10 md:py-14">
            <div className="flex flex-col items-center justify-center gap-6 relative">
              
              {/* Logo e Titolo Principale - CENTRATO */}
              <div className="flex flex-col items-center text-center gap-3">
                <Link href="/" className="group flex flex-col items-center gap-3 w-fit">
                  <div className="relative">
                    <div className="absolute inset-0 bg-black blur-sm opacity-20 rounded-full group-hover:opacity-30 transition-opacity"></div>
                    <Image 
                      src="/favicon.svg" 
                      alt="Font 4 Tattoo" 
                      width={56} 
                      height={56} 
                      className="relative transform group-hover:scale-105 transition-transform duration-300"
                      priority 
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 leading-none group-hover:text-neutral-700 transition-colors">
                      FONT 4 TATTOO
                    </h1>
                    <p className="text-xs md:text-sm font-bold text-neutral-400 tracking-[0.2em] uppercase mt-2">
                      Fineline & Elegant Typefaces
                    </p>
                  </div>
                </Link>
              </div>

              {/* Curated By Section - Posizionato sotto o in posizione strategica */}
              <div className="flex flex-col items-center border-t border-neutral-100 pt-3 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 md:border-t-0 md:pt-0">
                <span className="text-[9px] md:text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 text-center">
                  Curated by
                </span>
                <div className="flex flex-col items-center md:items-end leading-tight text-neutral-800">
                  <span className="font-serif font-bold italic text-base md:text-lg">Mike Biscuit</span>
                  <span className="text-[10px] text-neutral-400 my-0.5">&</span>
                  <span className="font-serif font-bold italic text-base md:text-lg">Bobby&apos;s Tattoo</span>
                </div>
              </div>
            </div>
            
            {/* Tagline d'impatto opzionale sotto */}
            <div className="mt-4 pt-4 border-t border-neutral-100 hidden md:block">
               <p className="text-sm text-neutral-600 text-center font-medium max-w-2xl mx-auto leading-relaxed">
                Esplora e testa in tempo reale i font più esclusivi per il tuo prossimo tatuaggio. 
                <span className="text-neutral-400 mx-2">•</span> 
                Selezione professionale per scritte <span className="text-black font-semibold">Fine Line</span>, <span className="text-black font-semibold">Gotiche</span> ed <span className="text-black font-semibold">Eleganti</span>.
               </p>
            </div>
          </div>
        </header>
        {children}
        {/* JSON-LD */}
        <Script id="jsonld-website" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
