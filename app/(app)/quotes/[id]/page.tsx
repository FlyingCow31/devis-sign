"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { QuoteDocument } from "@/components/QuoteDocument";
import { ErrorState, LoadingState, PageHeader } from "@/components/States";
import { StatusBadge } from "@/components/StatusBadge";
import { api, ApiError, endpoints, useApi } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { AuditEventType } from "@/lib/types";

const eventLabels: Record<AuditEventType, string> = {
  created: "Devis créé",
  sent: "Envoyé au client",
  viewed: "Ouvert par le client",
  signed: "Signé par le client",
  declined: "Refusé par le client",
  expired: "Arrivé à expiration",
  reminder_sent: "Relance envoyée",
};

function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const created = useSearchParams().get("created");
  const { data: quote, error, loading, reload, setData } = useApi(() => api.getQuote(id), [id]);

  const [busy, setBusy] = useState<null | "send" | "delete">(null);
  const [notice, setNotice] = useState<string | null>(
    created === "send"
      ? "Devis créé et envoyé au client."
      : created === "draft"
        ? "Brouillon enregistré."
        : null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) return <LoadingState />;
  if (error)
    return error.status === 404 ? (
      <ErrorState message="Ce devis n’existe pas ou a été supprimé." />
    ) : (
      <ErrorState message={error.message} onRetry={reload} />
    );
  if (!quote) return null;

  async function send() {
    setBusy("send");
    setActionError(null);
    try {
      setData(await api.sendQuote(id));
      setNotice(quote!.status === "draft" ? "Devis envoyé au client." : "Relance envoyée au client.");
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Erreur inattendue.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!window.confirm(`Supprimer définitivement le brouillon ${quote!.number} ?`)) return;
    setBusy("delete");
    try {
      await api.deleteQuote(id);
      router.push("/quotes");
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Erreur inattendue.");
      setBusy(null);
    }
  }

  async function copyLink() {
    if (!quote?.signUrl) return;
    try {
      await navigator.clipboard.writeText(quote.signUrl);
      setNotice("Lien de signature copié dans le presse-papiers.");
    } catch {
      setActionError("Copie impossible. Sélectionnez le lien manuellement.");
    }
  }

  const canSend = ["draft", "sent", "viewed"].includes(quote.status);

  return (
    <>
      <p className="mb-4">
        <Link href="/quotes">← Retour aux devis</Link>
      </p>

      <PageHeader
        title={`Devis ${quote.number}`}
        description={`${quote.client.company || quote.client.name} · ${quote.client.email}`}
        actions={
          <>
            <a href={endpoints.quotePdf(id)} className="btn btn-secondary" download>
              Télécharger le PDF
            </a>
            {quote.status === "draft" && (
              <button type="button" className="btn btn-danger" onClick={remove} disabled={!!busy}>
                {busy === "delete" ? "Suppression…" : "Supprimer"}
              </button>
            )}
            {canSend && (
              <button type="button" className="btn btn-primary" onClick={send} disabled={!!busy}>
                {busy === "send" ? "Envoi…" : quote.status === "draft" ? "Envoyer au client" : "Relancer le client"}
              </button>
            )}
          </>
        }
      />

      <div aria-live="polite">
        {notice && (
          <p className="mb-6 rounded-md border-2 border-text bg-success-soft p-3 font-semibold">
            <span aria-hidden="true">✓ </span>
            {notice}
          </p>
        )}
      </div>
      {actionError && (
        <p role="alert" className="mb-6 rounded-md border-2 border-danger bg-danger-soft p-3">
          {actionError}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <QuoteDocument {...quote} />
        </div>

        <aside className="space-y-6" aria-label="Suivi du devis">
          <section className="panel" aria-labelledby="status-h">
            <h2 id="status-h" className="mb-2 text-lg font-bold">Statut</h2>
            <StatusBadge status={quote.status} />
            {quote.declineReason && (
              <p className="mt-3">
                <strong>Motif du refus :</strong> {quote.declineReason}
              </p>
            )}
            {quote.signUrl && quote.status !== "draft" && (
              <div className="mt-4">
                <label htmlFor="sign-url" className="field-label">Lien de signature</label>
                <input id="sign-url" readOnly className="input text-sm" value={quote.signUrl} onFocus={(e) => e.target.select()} />
                <button type="button" className="btn btn-secondary mt-2 w-full" onClick={copyLink}>
                  Copier le lien
                </button>
              </div>
            )}
          </section>

          {quote.signature && (
            <section className="panel bg-success-soft" aria-labelledby="sig-h">
              <h2 id="sig-h" className="mb-2 text-lg font-bold">Signature</h2>
              {quote.signature.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={quote.signature.imageUrl}
                  alt={`Signature de ${quote.signature.signerName}`}
                  className="mb-3 w-full rounded-md border-2 border-text bg-surface"
                />
              )}
              <dl className="space-y-2 text-sm">
                <div><dt className="font-semibold">Signataire</dt><dd>{quote.signature.signerName}</dd></div>
                <div><dt className="font-semibold">Date</dt><dd>{formatDateTime(quote.signature.signedAt)}</dd></div>
                <div><dt className="font-semibold">Méthode</dt><dd>{quote.signature.method === "drawn" ? "Signature manuscrite" : "Nom saisi"}</dd></div>
                <div><dt className="font-semibold">Adresse IP</dt><dd>{quote.signature.ip}</dd></div>
                <div>
                  <dt className="font-semibold">Empreinte SHA-256 du document</dt>
                  <dd className="break-all font-mono text-xs">{quote.signature.documentHash}</dd>
                </div>
              </dl>
            </section>
          )}

          <section className="panel" aria-labelledby="audit-h">
            <h2 id="audit-h" className="mb-3 text-lg font-bold">Historique</h2>
            {quote.events.length === 0 ? (
              <p className="text-muted">Aucun événement.</p>
            ) : (
              <ol className="space-y-3 border-l-2 border-text pl-4">
                {quote.events.map((ev) => (
                  <li key={ev.id}>
                    <p className="font-semibold">{eventLabels[ev.type]}</p>
                    <p className="text-sm text-muted">
                      <time dateTime={ev.at}>{formatDateTime(ev.at)}</time>
                      {ev.ip && <> · IP {ev.ip}</>}
                    </p>
                    {ev.detail && <p className="text-sm">{ev.detail}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

export default function QuoteDetailPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <QuoteDetail />
    </Suspense>
  );
}
