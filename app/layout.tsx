import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  manifest: "/manifest.json",
  themeColor: "#000000",
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
      { url: "/icon-512x512.png", width: 512, height: 512, alt: "Font 4 Tattoo" },
    ],
    locale: "it_IT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Font 4 Tattoo — Fineline Font for Tattoo",
    description:
      "Anteprima font per tatuaggi: fine line, eleganti, premium. Prova il testo in tempo reale.",
    images: ["/icon-512x512.png"],
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
        <header className="border-b border-neutral-200">
          <div className="max-w-6xl mx-auto px-4 py-5">
            <div className="flex flex-col items-center gap-1">
              <Link href="/" className="inline-flex items-center gap-3">
                <Image src="/favicon.svg" alt="Font 4 Tattoo" width={48} height={48} priority />
                <span className="text-2xl md:text-3xl font-bold tracking-tight">Font 4 Tattoo</span>
                <span className="text-sm md:text-base font-medium text-neutral-500 md:text-neutral-600 tracking-wide italic">- selection by Mike Biscuit and Bobby's Tattoo</span>
              </Link>
              <p className="text-xs md:text-sm text-neutral-600 text-center">
                Anteprima in tempo reale · Font eleganti e sottili per tatuaggi · Fine line tattoo
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
