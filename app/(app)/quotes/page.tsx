"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/States";
import { QuotesTable } from "@/components/QuotesTable";
import { statusMeta } from "@/components/StatusBadge";
import { api, useApi } from "@/lib/api";
import type { QuoteStatus } from "@/lib/types";

const filters: (QuoteStatus | "all")[] = ["all", "draft", "sent", "viewed", "signed", "declined", "expired"];

function QuotesList() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("status");
  const status = raw && raw in statusMeta ? (raw as QuoteStatus) : undefined;

  const { data, error, loading, reload } = useApi(() => api.listQuotes(status), [status]);

  return (
    <>
      <div className="mb-6 max-w-xs">
        <label htmlFor="status-filter" className="field-label">
          Filtrer par statut
        </label>
        <select
          id="status-filter"
          className="input"
          value={status ?? "all"}
          onChange={(e) =>
            router.push(e.target.value === "all" ? "/quotes" : `/quotes?status=${e.target.value}`)
          }
        >
          {filters.map((f) => (
            <option key={f} value={f}>
              {f === "all" ? "Tous les devis" : statusMeta[f].label}
            </option>
          ))}
        </select>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {data &&
        (data.length === 0 ? (
          <EmptyState
            title={status ? `Aucun devis « ${statusMeta[status].label} »` : "Aucun devis"}
            action={{ href: "/quotes/new", label: "Créer un devis" }}
          />
        ) : (
          <>
            <p className="mb-2 text-muted" aria-live="polite">
              {data.length} devis
            </p>
            <QuotesTable quotes={data} caption="Liste des devis" />
          </>
        ))}
    </>
  );
}

export default function QuotesPage() {
  return (
    <>
      <PageHeader
        title="Devis"
        actions={
          <Link href="/quotes/new" className="btn btn-primary">
            <span aria-hidden="true">+</span> Nouveau devis
          </Link>
        }
      />
      <Suspense fallback={<LoadingState />}>
        <QuotesList />
      </Suspense>
    </>
  );
}
