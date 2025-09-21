"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin/dashboard");
    } else {
      setError("Password errata");
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-10 grid place-items-center">
      <form onSubmit={onSubmit} className="w-full max-w-sm border border-neutral-200 rounded-xl p-6 bg-white">
        <h1 className="text-xl font-semibold">Accesso Admin</h1>
        <p className="text-sm text-neutral-600 mt-1">Inserisci la password per continuare.</p>
        <input
          type="password"
          className="mt-4 w-full rounded-md border border-neutral-200 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-black"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button type="submit" className="mt-4 w-full rounded-md bg-black text-white py-2.5 hover:opacity-90">Entra</button>
      </form>
    </main>
  );
}