"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.login(email, password);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "E-mail ou mot de passe incorrect."
          : err instanceof ApiError
            ? err.message
            : "Erreur inattendue.",
      );
      setLoading(false);
    }
  }

  return (
    <main id="main" tabIndex={-1} className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-2xl font-bold">
          <span aria-hidden="true" className="mr-2 inline-block rounded border-2 border-text bg-primary px-1.5">
            ✍
          </span>
          Devis&nbsp;Signés
        </p>
        <form onSubmit={submit} className="panel space-y-5">
          <h1 className="text-2xl font-bold">Connexion</h1>

          {error && (
            <p role="alert" className="rounded-md border-2 border-danger bg-danger-soft p-3 font-semibold">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="email" className="field-label">E-mail</label>
            <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="field-label">Mot de passe</label>
            <input id="password" type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
