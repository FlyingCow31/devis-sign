"use client";

import Link from "next/link";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/States";
import { QuotesTable } from "@/components/QuotesTable";
import { statusMeta } from "@/components/StatusBadge";
import { api, useApi } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { QuoteStatus } from "@/lib/types";

const pipeline: QuoteStatus[] = ["draft", "sent", "viewed", "signed", "declined", "expired"];

export default function DashboardPage() {
  const { data, error, loading, reload } = useApi(api.dashboard);

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Vue d’ensemble de vos devis."
        actions={
          <Link href="/quotes/new" className="btn btn-primary">
            <span aria-hidden="true">+</span> Nouveau devis
          </Link>
        }
      />

      {loading && <LoadingState />}
      {error && <ErrorState message={error.message} onRetry={reload} />}

      {data && (
        <div className="space-y-10">
          <section aria-labelledby="kpi-h">
            <h2 id="kpi-h" className="sr-only">Chiffres clés</h2>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="panel">
                <dt className="font-semibold text-muted">En attente de signature</dt>
                <dd className="mt-1 text-3xl font-bold">{formatMoney(data.pendingTotalCents)}</dd>
                <dd className="text-sm text-muted">
                  {data.counts.sent + data.counts.viewed} devis envoyés ou consultés
                </dd>
              </div>
              <div className="panel bg-success-soft">
                <dt className="font-semibold">Signé ce mois-ci</dt>
                <dd className="mt-1 text-3xl font-bold">{formatMoney(data.signedTotalCents)}</dd>
              </div>
              <div className="panel">
                <dt className="font-semibold text-muted">Taux de signature</dt>
                <dd className="mt-1 text-3xl font-bold">
                  {Math.round(data.signatureRate * 100)}&nbsp;%
                </dd>
                <dd className="text-sm text-muted">signés / (signés + refusés + expirés)</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="pipeline-h">
            <h2 id="pipeline-h" className="mb-3 text-xl font-bold">Par statut</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {pipeline.map((s) => (
                <li key={s}>
                  <Link
                    href={`/quotes?status=${s}`}
                    className={`block rounded-md border-2 border-text p-3 text-text no-underline hover:underline ${statusMeta[s].className}`}
                  >
                    <span className="block text-sm font-semibold">
                      <span aria-hidden="true">{statusMeta[s].symbol} </span>
                      {statusMeta[s].label}
                    </span>
                    <span className="block text-2xl font-bold">{data.counts[s]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="recent-h">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id="recent-h" className="text-xl font-bold">Devis récents</h2>
              <Link href="/quotes">Voir tous les devis</Link>
            </div>
            {data.recent.length === 0 ? (
              <EmptyState
                title="Aucun devis pour l’instant"
                action={{ href: "/quotes/new", label: "Créer mon premier devis" }}
              >
                Créez un devis, envoyez-le, et suivez sa signature ici.
              </EmptyState>
            ) : (
              <QuotesTable quotes={data.recent} caption="Devis récents" />
            )}
          </section>
        </div>
      )}
    </>
  );
}
