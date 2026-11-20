"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/States";
import { api, ApiError } from "@/lib/api";
import { addDays, computeTotals, formatMoney, parseEurosToCents } from "@/lib/format";
import type { QuoteInput } from "@/lib/types";

interface Row {
  key: number;
  description: string;
  quantity: string;
  unit: string;
  price: string;
}

type Errors = Record<string, string>;

let nextKey = 1;
const emptyRow = (): Row => ({ key: nextKey++, description: "", quantity: "1", unit: "", price: "" });

const units = ["", "forfait", "jour", "heure", "page", "mois"];
const vatRates = [0, 5.5, 10, 20];

export default function NewQuotePage() {
  const router = useRouter();
  const summaryRef = useRef<HTMLDivElement>(null);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [title, setTitle] = useState("");
  const [validUntil, setValidUntil] = useState(addDays(30));
  const [vatRate, setVatRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState<null | "draft" | "send">(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  // Use the default validity from settings when available (silently ignored if the API isn't there yet)
  useEffect(() => {
    api
      .getSettings()
      .then((s) => setValidUntil(addDays(s.defaultValidityDays)))
      .catch(() => {});
  }, []);

  const parsedItems = rows.map((r) => ({
    quantity: parseFloat(r.quantity.replace(",", ".")),
    unitPriceCents: parseEurosToCents(r.price),
  }));
  const totals = computeTotals(
    parsedItems.map((i) => ({
      quantity: Number.isFinite(i.quantity) ? i.quantity : 0,
      unitPriceCents: Number.isFinite(i.unitPriceCents) ? i.unitPriceCents : 0,
    })),
    vatRate,
  );

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    const row = emptyRow();
    setRows((rs) => [...rs, row]);
    setLiveMessage(`Ligne ${rows.length + 1} ajoutée`);
    // move focus to the new description field
    requestAnimationFrame(() => document.getElementById(`desc-${row.key}`)?.focus());
  }

  function removeRow(key: number, index: number) {
    setRows((rs) => rs.filter((r) => r.key !== key));
    setLiveMessage(`Ligne ${index + 1} supprimée`);
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!clientName.trim()) e.clientName = "Indiquez le nom du client.";
    if (!/^\S+@\S+\.\S+$/.test(clientEmail.trim())) e.clientEmail = "Indiquez une adresse e-mail valide.";
    if (!title.trim()) e.title = "Indiquez l’objet du devis.";
    if (!validUntil || validUntil < new Date().toISOString().slice(0, 10))
      e.validUntil = "La date de validité doit être aujourd’hui ou plus tard.";
    rows.forEach((r, i) => {
      if (!r.description.trim()) e[`desc-${r.key}`] = `Ligne ${i + 1} : décrivez la prestation.`;
      const q = parsedItems[i].quantity;
      if (!Number.isFinite(q) || q <= 0) e[`qty-${r.key}`] = `Ligne ${i + 1} : quantité invalide.`;
      if (!Number.isFinite(parsedItems[i].unitPriceCents))
        e[`price-${r.key}`] = `Ligne ${i + 1} : prix invalide (ex. 450 ou 450,50).`;
    });
    if (rows.length === 0) e.rows = "Ajoutez au moins une prestation.";
    return e;
  }

  async function submit(mode: "draft" | "send") {
    setServerError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    const input: QuoteInput = {
      title: title.trim(),
      client: {
        name: clientName.trim(),
        email: clientEmail.trim(),
        company: clientCompany.trim() || undefined,
        address: clientAddress.trim() || undefined,
      },
      items: rows.map((r, i) => ({
        description: r.description.trim(),
        quantity: parsedItems[i].quantity,
        unit: r.unit || undefined,
        unitPriceCents: parsedItems[i].unitPriceCents,
      })),
      vatRate,
      notes: notes.trim() || undefined,
      validUntil,
      sendNow: mode === "send",
    };

    setSubmitting(mode);
    try {
      const quote = await api.createQuote(input);
      router.push(`/quotes/${quote.id}?created=${mode}`);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Erreur inattendue.");
      setSubmitting(null);
    }
  }

  const fieldProps = (id: string) => ({
    id,
    "aria-invalid": errors[id] ? (true as const) : undefined,
    "aria-describedby": errors[id] ? `${id}-error` : undefined,
  });
  const fieldError = (id: string) =>
    errors[id] ? (
      <span id={`${id}-error`} className="field-error">
        {errors[id]}
      </span>
    ) : null;

  const errorList = Object.entries(errors);

  return (
    <>
      <PageHeader title="Nouveau devis" description="Les champs marqués * sont obligatoires." />

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit("send");
        }}
        className="space-y-8"
      >
        {errorList.length > 0 && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            className="rounded-md border-2 border-danger bg-danger-soft p-4"
          >
            <h2 className="font-bold">
              {errorList.length} erreur{errorList.length > 1 ? "s" : ""} à corriger
            </h2>
            <ul className="mt-2 list-disc pl-6">
              {errorList.map(([id, msg]) => (
                <li key={id}>
                  <a href={`#${id}`}>{msg}</a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {serverError && (
          <div role="alert" className="rounded-md border-2 border-danger bg-danger-soft p-4">
            {serverError}
          </div>
        )}

        {/* Client */}
        <fieldset className="panel grid gap-4 sm:grid-cols-2">
          <legend className="px-1 text-xl font-bold">Client</legend>
          <div>
            <label htmlFor="clientName" className="field-label">Nom du contact *</label>
            <input {...fieldProps("clientName")} className="input" autoComplete="off" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            {fieldError("clientName")}
          </div>
          <div>
            <label htmlFor="clientEmail" className="field-label">E-mail *</label>
            <input {...fieldProps("clientEmail")} type="email" className="input" autoComplete="off" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
            <span className="field-hint">Le lien de signature sera envoyé à cette adresse.</span>
            {fieldError("clientEmail")}
          </div>
          <div>
            <label htmlFor="clientCompany" className="field-label">Entreprise</label>
            <input id="clientCompany" className="input" value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} />
          </div>
          <div>
            <label htmlFor="clientAddress" className="field-label">Adresse</label>
            <textarea id="clientAddress" rows={2} className="input" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
          </div>
        </fieldset>

        {/* Quote info */}
        <fieldset className="panel grid gap-4 sm:grid-cols-3">
          <legend className="px-1 text-xl font-bold">Devis</legend>
          <div className="sm:col-span-3">
            <label htmlFor="title" className="field-label">Objet *</label>
            <input {...fieldProps("title")} className="input" placeholder="Ex. Création d’un site vitrine" value={title} onChange={(e) => setTitle(e.target.value)} />
            {fieldError("title")}
          </div>
          <div>
            <label htmlFor="validUntil" className="field-label">Valable jusqu’au *</label>
            <input {...fieldProps("validUntil")} type="date" className="input" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            {fieldError("validUntil")}
          </div>
          <div>
            <label htmlFor="vatRate" className="field-label">Taux de TVA</label>
            <select id="vatRate" className="input" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} aria-describedby="vat-hint">
              {vatRates.map((r) => (
                <option key={r} value={r}>
                  {r.toLocaleString("fr-FR")} %{r === 0 ? " (non applicable)" : ""}
                </option>
              ))}
            </select>
            <span id="vat-hint" className="field-hint">À 0 %, la mention de vos paramètres est ajoutée au devis.</span>
          </div>
        </fieldset>

        {/* Line items */}
        <fieldset className="panel">
          <legend className="px-1 text-xl font-bold">Prestations</legend>
          <p className="sr-only" aria-live="polite">{liveMessage}</p>

          <ol className="space-y-4">
            {rows.map((r, i) => {
              const lineTotal =
                Number.isFinite(parsedItems[i].quantity) && Number.isFinite(parsedItems[i].unitPriceCents)
                  ? Math.round(parsedItems[i].quantity * parsedItems[i].unitPriceCents)
                  : 0;
              return (
                <li key={r.key} className="rounded-md border-2 border-text/40 p-4">
                  <fieldset>
                    <legend className="mb-2 font-semibold">Ligne {i + 1}</legend>
                    <div className="grid gap-3 md:grid-cols-12">
                      <div className="md:col-span-5">
                        <label htmlFor={`desc-${r.key}`} className="field-label">Description *</label>
                        <input {...fieldProps(`desc-${r.key}`)} className="input" value={r.description} onChange={(e) => updateRow(r.key, { description: e.target.value })} />
                        {fieldError(`desc-${r.key}`)}
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor={`qty-${r.key}`} className="field-label">Quantité *</label>
                        <input {...fieldProps(`qty-${r.key}`)} inputMode="decimal" className="input" value={r.quantity} onChange={(e) => updateRow(r.key, { quantity: e.target.value })} />
                        {fieldError(`qty-${r.key}`)}
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor={`unit-${r.key}`} className="field-label">Unité</label>
                        <select id={`unit-${r.key}`} className="input" value={r.unit} onChange={(e) => updateRow(r.key, { unit: e.target.value })}>
                          {units.map((u) => (
                            <option key={u} value={u}>{u || "—"}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label htmlFor={`price-${r.key}`} className="field-label">Prix unitaire HT (€) *</label>
                        <input {...fieldProps(`price-${r.key}`)} inputMode="decimal" className="input" placeholder="0,00" value={r.price} onChange={(e) => updateRow(r.key, { price: e.target.value })} />
                        {fieldError(`price-${r.key}`)}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p>
                        Total ligne : <strong>{formatMoney(lineTotal)}</strong>
                      </p>
                      {rows.length > 1 && (
                        <button type="button" className="btn btn-danger" onClick={() => removeRow(r.key, i)}>
                          Supprimer la ligne {i + 1}
                        </button>
                      )}
                    </div>
                  </fieldset>
                </li>
              );
            })}
          </ol>

          <button type="button" className="btn btn-secondary mt-4" onClick={addRow}>
            <span aria-hidden="true">+</span> Ajouter une prestation
          </button>

          <dl className="ml-auto mt-6 w-full max-w-xs space-y-1" aria-live="polite">
            <div className="flex justify-between"><dt>Total HT</dt><dd>{formatMoney(totals.subtotalCents)}</dd></div>
            <div className="flex justify-between"><dt>TVA</dt><dd>{formatMoney(totals.vatCents)}</dd></div>
            <div className="flex justify-between border-t-2 border-text pt-1 text-lg font-bold">
              <dt>Total TTC</dt><dd>{formatMoney(totals.totalCents)}</dd>
            </div>
          </dl>
        </fieldset>

        <div className="panel">
          <label htmlFor="notes" className="field-label">Notes pour le client</label>
          <textarea id="notes" rows={3} className="input" placeholder="Délais, conditions particulières…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t-2 border-text pt-6">
          <Link href="/quotes" className="btn btn-secondary">Annuler</Link>
          <button type="button" className="btn btn-secondary" disabled={!!submitting} onClick={() => submit("draft")}>
            {submitting === "draft" ? "Enregistrement…" : "Enregistrer en brouillon"}
          </button>
          <button type="submit" className="btn btn-primary" disabled={!!submitting}>
            {submitting === "send" ? "Envoi…" : "Enregistrer et envoyer au client"}
          </button>
        </div>
      </form>
    </>
  );
}
