"use client";

import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { QuoteDocument } from "@/components/QuoteDocument";
import { SignaturePad } from "@/components/SignaturePad";
import { ErrorState, LoadingState } from "@/components/States";
import { api, ApiError, endpoints, useApi } from "@/lib/api";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

export default function SignPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: quote, error, loading, reload } = useApi(() => api.getPublicQuote(token), [token]);

  const [signerName, setSignerName] = useState<string | null>(null);
  const [signature, setSignature] = useState<{ image: string; method: "drawn" | "typed" } | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [declineReason, setDeclineReason] = useState("");
  const [declined, setDeclined] = useState(false);
  const [declining, setDeclining] = useState(false);

  const errorRef = useRef<HTMLParagraphElement>(null);

  const name = signerName ?? quote?.client.name ?? "";

  async function sign(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    let msg: string | null = null;
    if (!name.trim()) msg = "Indiquez votre nom complet.";
    else if (!signature) msg = "Ajoutez votre signature.";
    else if (!accepted) msg = "Cochez la case « Bon pour accord » pour valider.";
    if (msg) {
      setFormError(msg);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    setSubmitting(true);
    try {
      await api.signQuote(token, {
        signerName: name.trim(),
        method: signature!.method,
        signatureImage: signature!.image,
        acceptedTerms: true,
      });
      router.push(`/sign/${token}/done`);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Erreur inattendue.");
      setSubmitting(false);
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  async function decline() {
    setDeclining(true);
    try {
      await api.declineQuote(token, declineReason.trim());
      setDeclined(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Erreur inattendue.");
    } finally {
      setDeclining(false);
    }
  }

  return (
    <>
      <header className="border-b-2 border-text bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <p className="font-bold">{quote ? quote.issuer.businessName : "Signature de devis"}</p>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-8">
        {loading && <LoadingState label="Chargement du devis…" />}

        {error &&
          (error.status === 404 || error.status === 410 ? (
            <div className="panel">
              <h1 className="text-2xl font-bold">Lien invalide ou expiré</h1>
              <p className="mt-2">
                Ce lien de signature n’est plus valide. Contactez la personne qui vous a envoyé le devis
                pour en recevoir un nouveau.
              </p>
            </div>
          ) : (
            <ErrorState message={error.message} onRetry={reload} />
          ))}

        {quote && declined && (
          <div className="panel" role="status">
            <h1 className="text-2xl font-bold">Devis refusé</h1>
            <p className="mt-2">
              Votre réponse a bien été transmise à {quote.issuer.businessName}. Merci d’avoir pris le temps de
              répondre.
            </p>
          </div>
        )}

        {quote && !declined && quote.status === "signed" && (
          <div className="panel bg-success-soft">
            <h1 className="text-2xl font-bold">
              <span aria-hidden="true">✓ </span>Ce devis est déjà signé
            </h1>
            <p className="mt-2">
              Signé le {quote.signedAt ? formatDateTime(quote.signedAt) : "—"}.
            </p>
            <a href={endpoints.publicPdf(token)} className="btn btn-primary mt-4" download>
              Télécharger le devis signé (PDF)
            </a>
          </div>
        )}

        {quote && !declined && (quote.status === "expired" || quote.status === "declined") && (
          <div className="panel bg-accent-soft">
            <h1 className="text-2xl font-bold">
              {quote.status === "expired" ? "Ce devis a expiré" : "Ce devis a été refusé"}
            </h1>
            <p className="mt-2">
              {quote.status === "expired"
                ? `Il était valable jusqu’au ${formatDate(quote.validUntil)}. `
                : ""}
              Contactez {quote.issuer.businessName} ({quote.issuer.email}) si vous souhaitez une nouvelle
              proposition.
            </p>
          </div>
        )}

        {quote && !declined && (quote.status === "sent" || quote.status === "viewed") && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Votre devis à signer</h1>
              <p className="mt-2 text-lg">
                {quote.issuer.businessName} vous propose un devis de{" "}
                <strong>{formatMoney(quote.totalCents)}</strong>. Relisez-le, puis signez en bas de page.
              </p>
              <a href={endpoints.publicPdf(token)} className="mt-3 inline-block" download>
                Télécharger le devis en PDF
              </a>
            </div>

            <section aria-labelledby="step1">
              <h2 id="step1" className="mb-3 text-xl font-bold">
                Étape 1 · Relisez le devis
              </h2>
              <QuoteDocument {...quote} />
            </section>

            <section aria-labelledby="step2">
              <h2 id="step2" className="mb-3 text-xl font-bold">
                Étape 2 · Signez
              </h2>
              <form noValidate onSubmit={sign} className="panel space-y-6">
                {formError && (
                  <p
                    ref={errorRef}
                    tabIndex={-1}
                    role="alert"
                    className="rounded-md border-2 border-danger bg-danger-soft p-3 font-semibold"
                  >
                    {formError}
                  </p>
                )}

                <div className="max-w-md">
                  <label htmlFor="signerName" className="field-label">
                    Nom et prénom du signataire *
                  </label>
                  <input
                    id="signerName"
                    className="input"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setSignerName(e.target.value)}
                  />
                </div>

                <SignaturePad signerName={name} onChange={setSignature} />

                <div className="flex items-start gap-3 rounded-md border-2 border-text bg-primary-soft p-4">
                  <input
                    id="accept"
                    type="checkbox"
                    className="mt-1 size-6 shrink-0 accent-[#050c0d]"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                  />
                  <label htmlFor="accept">
                    <strong>Bon pour accord.</strong> J’ai lu le devis n° {quote.number} et j’accepte les
                    prestations et le montant de {formatMoney(quote.totalCents)}.
                  </label>
                </div>

                <p className="text-sm text-muted">
                  En signant, la date, l’heure, votre adresse IP et une empreinte du document sont
                  enregistrées pour prouver votre accord. Vous recevrez une copie signée par e-mail.
                </p>

                <button type="submit" className="btn btn-primary w-full text-lg sm:w-auto" disabled={submitting}>
                  {submitting ? "Signature en cours…" : "Signer le devis"}
                </button>
              </form>
            </section>

            <details className="panel">
              <summary className="cursor-pointer font-semibold">Je ne souhaite pas accepter ce devis</summary>
              <div className="mt-4 space-y-3">
                <label htmlFor="reason" className="field-label">
                  Motif (facultatif)
                </label>
                <textarea
                  id="reason"
                  rows={3}
                  className="input"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                />
                <button type="button" className="btn btn-danger" onClick={decline} disabled={declining}>
                  {declining ? "Envoi…" : "Refuser le devis"}
                </button>
              </div>
            </details>
          </div>
        )}
      </main>
    </>
  );
}
