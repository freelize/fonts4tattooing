import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Accesso Admin",
    template: "%s | Admin | Font 4 Tattoo",
  },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}