import type { Metadata } from "next";
import { cookies } from "next/headers";
import UploadForm from "./upload-form";

export const metadata: Metadata = {
  title: "Dashboard Admin",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function AdminDashboard() {
  const c = await cookies();
  const cookie = c.get("font4tat_admin");
  if (!cookie) {
    return (
      <main className="min-h-screen grid place-items-center p-10">
        <div className="text-center">
          <p className="text-lg">Non autorizzato</p>
          <p className="text-sm text-neutral-600 mt-2">Accedi dalla pagina /admin.</p>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen p-6 md:p-10">
      <h1 className="text-2xl font-semibold">Gestione Font</h1>
      <p className="text-sm text-neutral-600 mt-1">Carica nuovi font e gestisci i metadati.</p>
      <section className="mt-8">
        <UploadForm />
      </section>
    </main>
  );
}