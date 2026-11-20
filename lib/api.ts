"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  BusinessSettings,
  DashboardData,
  PublicQuote,
  Quote,
  QuoteInput,
  QuoteListItem,
  QuoteStatus,
  SignInput,
} from "./types";

/**
 * Every call the front-end makes goes through this file.
 * No route handlers exist yet: each endpoint below is the contract
 * the backend has to implement (see README.md for request/response shapes).
 */
export const endpoints = {
  login: "/api/auth/login",
  logout: "/api/auth/logout",
  dashboard: "/api/dashboard",
  quotes: "/api/quotes",
  quote: (id: string) => `/api/quotes/${encodeURIComponent(id)}`,
  sendQuote: (id: string) => `/api/quotes/${encodeURIComponent(id)}/send`,
  quotePdf: (id: string) => `/api/quotes/${encodeURIComponent(id)}/pdf`,
  settings: "/api/settings",
  publicQuote: (token: string) => `/api/sign/${encodeURIComponent(token)}`,
  signQuote: (token: string) => `/api/sign/${encodeURIComponent(token)}`,
  declineQuote: (token: string) => `/api/sign/${encodeURIComponent(token)}/decline`,
  publicPdf: (token: string) => `/api/sign/${encodeURIComponent(token)}/pdf`,
} as const;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "Impossible de joindre le serveur. Vérifiez votre connexion.");
  }

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      /* body was not JSON */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/* ---------- Typed calls ---------- */

export const api = {
  login: (email: string, password: string) =>
    apiFetch<void>(endpoints.login, { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => apiFetch<void>(endpoints.logout, { method: "POST" }),

  dashboard: () => apiFetch<DashboardData>(endpoints.dashboard),

  listQuotes: (status?: QuoteStatus) =>
    apiFetch<QuoteListItem[]>(
      status ? `${endpoints.quotes}?status=${status}` : endpoints.quotes,
    ),
  getQuote: (id: string) => apiFetch<Quote>(endpoints.quote(id)),
  createQuote: (input: QuoteInput) =>
    apiFetch<Quote>(endpoints.quotes, { method: "POST", body: JSON.stringify(input) }),
  deleteQuote: (id: string) => apiFetch<void>(endpoints.quote(id), { method: "DELETE" }),
  sendQuote: (id: string) => apiFetch<Quote>(endpoints.sendQuote(id), { method: "POST" }),

  getSettings: () => apiFetch<BusinessSettings>(endpoints.settings),
  saveSettings: (s: BusinessSettings) =>
    apiFetch<BusinessSettings>(endpoints.settings, { method: "PUT", body: JSON.stringify(s) }),

  getPublicQuote: (token: string) => apiFetch<PublicQuote>(endpoints.publicQuote(token)),
  signQuote: (token: string, input: SignInput) =>
    apiFetch<{ signedAt: string; documentHash: string }>(endpoints.signQuote(token), {
      method: "POST",
      body: JSON.stringify(input),
    }),
  declineQuote: (token: string, reason: string) =>
    apiFetch<void>(endpoints.declineQuote(token), {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

/* ---------- Data-loading hook ---------- */

export function useApi<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await run());
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, "Erreur inattendue."));
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}
