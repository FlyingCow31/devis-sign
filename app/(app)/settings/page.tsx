"use client";

import { useEffect, useState } from "react";
import { ErrorState, LoadingState, PageHeader } from "@/components/States";
import { api, ApiError, useApi } from "@/lib/api";
import type { BusinessSettings } from "@/lib/types";

const empty: BusinessSettings = {
  businessName: "",
  ownerName: "",
  siret: "",
  address: "",
  email: "",
  phone: "",
  vatMention: "TVA non applicable, art. 293 B du CGI",
  paymentTerms: "Acompte de 30 % à la signature, solde à la livraison.",
  defaultValidityDays: 30,
};

export default function SettingsPage() {
  const { data, error, loading, reload } = useApi(api.getSettings);
  const [form, setForm] = useState<BusinessSettings>(empty);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (data) setForm({ ...empty, ...data });
  }, [data]);

  const set = <K extends keyof BusinessSettings>(k: K, v: BusinessSettings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await api.saveSettings(form);
      setStatus({ ok: true, msg: "Paramètres enregistrés." });
    } catch (err) {
      setStatus({ ok: false, msg: err instanceof ApiError ? err.message : "Erreur inattendue." });
    } finally {
      setSaving(false);
    }
  }

  const text = (id: keyof BusinessSettings, label: string, opts: { hint?: string; type?: string; required?: boolean; autoComplete?: string } = {}) => (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {opts.required && " *"}
      </label>
      <input
        id={id}
        type={opts.type ?? "text"}
        required={opts.required}
        autoComplete={opts.autoComplete}
        className="input"
        value={String(form[id] ?? "")}
        aria-describedby={opts.hint ? `${id}-hint` : undefined}
        onChange={(e) => set(id, (opts.type === "number" ? Number(e.target.value) : e.target.value) as never)}
      />
      {opts.hint && <span id={`${id}-hint`} className="field-hint">{opts.hint}</span>}
    </div>
  );

  return (
    <>
      <PageHeader title="Paramètres" description="Ces informations apparaissent sur tous vos devis." />

      {loading && <LoadingState />}
      {error && error.status !== 404 && <ErrorState message={error.message} onRetry={reload} />}

      {!loading && (
        <form onSubmit={save} className="max-w-3xl space-y-8">
          <fieldset className="panel grid gap-4 sm:grid-cols-2">
            <legend className="px-1 text-xl font-bold">Entreprise</legend>
            {text("businessName", "Nom commercial", { required: true, autoComplete: "organization" })}
            {text("ownerName", "Nom du dirigeant", { required: true, autoComplete: "name" })}
            {text("siret", "SIRET", { required: true, hint: "14 chiffres, obligatoire sur un devis." })}
            {text("email", "E-mail", { type: "email", required: true, autoComplete: "email" })}
            {text("phone", "Téléphone", { type: "tel", autoComplete: "tel" })}
            <div className="sm:col-span-2">
              <label htmlFor="address" className="field-label">Adresse *</label>
              <textarea id="address" rows={3} required className="input" autoComplete="street-address" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
          </fieldset>

          <fieldset className="panel grid gap-4">
            <legend className="px-1 text-xl font-bold">Devis par défaut</legend>
            {text("vatMention", "Mention TVA", { hint: "Affichée quand le taux de TVA est à 0 %." })}
            <div>
              <label htmlFor="paymentTerms" className="field-label">Conditions de paiement</label>
              <textarea id="paymentTerms" rows={2} className="input" value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} />
            </div>
            <div className="max-w-xs">
              {text("defaultValidityDays", "Durée de validité (jours)", { type: "number" })}
            </div>
          </fieldset>

          <div aria-live="polite">
            {status && (
              <p
                className={`rounded-md border-2 p-3 font-semibold ${
                  status.ok ? "border-text bg-success-soft" : "border-danger bg-danger-soft"
                }`}
              >
                {status.ok && <span aria-hidden="true">✓ </span>}
                {status.msg}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      )}
    </>
  );
}
