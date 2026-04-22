import type { Metadata, Viewport } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  style: ["italic"],
  variable: "--font-playfair",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
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
    "font per tatuaggi",
    "font tatuaggi",
    "font per tattoo",
    "tatuaggi sottili",
    "font sottili",
    "font eleganti",
    "tatuaggi eleganti",
    "tatuaggi piccoli",
    "font gotico",
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
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Font 4 Tattoo",
    title: "Font 4 Tattoo — Fineline Font for Tattoo",
    description:
      "Anteprima font per tatuaggi: fine line, eleganti, premium. Prova il testo in tempo reale.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Font 4 Tattoo" }],
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
    <html lang="it" className={`${outfit.variable} ${playfair.variable}`}>
      <body className="bg-neutral-50 text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white">
        {/* Header brand premium */}
        <header className="relative isolate border-b border-neutral-200/80 overflow-hidden">
          {/* Background layer: soft radial glow + fine dot pattern */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-neutral-100 via-white to-neutral-50" />
          <div
            className="absolute inset-0 -z-10 opacity-[0.12] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(#171717 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              maskImage:
                "radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 85%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 85%)",
            }}
          />
          <div
            aria-hidden
            className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-[140%] -z-10 opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(120, 120, 120, 0.18), transparent 60%)",
            }}
          />

          <div className="relative max-w-6xl mx-auto px-4 py-10 md:py-16">
            <div className="flex flex-col items-center text-center gap-5">
              <Link href="/" className="group inline-flex flex-col items-center gap-3">
                {/* Eyebrow */}
                <span className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.3em] uppercase text-neutral-500">
                  <span className="h-px w-8 bg-neutral-300" />
                  Anteprima Font Tattoo
                  <span className="h-px w-8 bg-neutral-300" />
                </span>

                {/* Logo mark */}
                <div className="relative">
                  <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-neutral-200/60 to-neutral-100/0 blur-md group-hover:from-neutral-300/70 transition-all duration-500" />
                  <div className="relative h-14 w-14 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-lg shadow-neutral-900/10 ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300">
                    <span className="font-serif italic text-2xl leading-none">F</span>
                    <span className="absolute -right-1 -bottom-1 h-5 w-5 rounded-full bg-white border border-neutral-900 flex items-center justify-center text-[10px] font-black text-neutral-900">
                      4T
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div className="flex flex-col items-center">
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900 leading-none">
                    FONT 4 TATTOO
                  </h1>
                  <p className="mt-3 font-serif italic text-sm md:text-base text-neutral-500">
                    Fineline &amp; Elegant Typefaces
                  </p>
                </div>
              </Link>

              {/* Curated by */}
              <div className="mt-2 flex items-center gap-3 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.25em]">
                <span className="h-px w-8 bg-neutral-200" />
                Curated by
                <span className="font-serif italic font-semibold text-neutral-700 normal-case tracking-normal text-sm">
                  Mike Biscuit
                </span>
                <span className="text-neutral-300 normal-case">&amp;</span>
                <span className="font-serif italic font-semibold text-neutral-700 normal-case tracking-normal text-sm">
                  Bobby&apos;s Tattoo
                </span>
                <span className="h-px w-8 bg-neutral-200" />
              </div>

              {/* Tagline */}
              <p className="max-w-2xl text-sm md:text-[15px] text-neutral-600 leading-relaxed">
                Esplora e testa in tempo reale i font più esclusivi per il tuo
                prossimo tatuaggio.{" "}
                <span className="hidden md:inline text-neutral-400 mx-1">•</span>
                <span className="block md:inline mt-1 md:mt-0">
                  Selezione professionale per scritte{" "}
                  <span className="text-neutral-900 font-semibold">Fine Line</span>
                  ,{" "}
                  <span className="text-neutral-900 font-semibold">Gotiche</span>
                  {" "}ed{" "}
                  <span className="text-neutral-900 font-semibold">Eleganti</span>.
                </span>
              </p>
            </div>
          </div>
        </header>

        {children}

        <Script
          id="jsonld-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
