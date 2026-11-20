import { formatDate, formatMoney } from "@/lib/format";
import type { BusinessSettings, Client, LineItem } from "@/lib/types";

interface Props {
  number: string;
  title: string;
  issuer?: BusinessSettings;
  client: Client;
  items: LineItem[];
  vatRate: number;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  notes?: string;
  createdAt: string;
  validUntil: string;
}

/** Readable, printable view of a quote. Used on the detail page and the signing page. */
export function QuoteDocument(q: Props) {
  return (
    <article aria-labelledby="quote-title" className="panel">
      <header className="flex flex-wrap justify-between gap-6 border-b-2 border-text pb-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Devis n° {q.number}</p>
          <h2 id="quote-title" className="text-2xl font-bold">
            {q.title}
          </h2>
          <p className="mt-1 text-muted">
            Émis le {formatDate(q.createdAt)} · Valable jusqu’au{" "}
            <strong className="text-text">{formatDate(q.validUntil)}</strong>
          </p>
        </div>
      </header>

      <div className="grid gap-6 py-5 sm:grid-cols-2">
        {q.issuer && (
          <section aria-labelledby="issuer-h">
            <h3 id="issuer-h" className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">
              Prestataire
            </h3>
            <address className="not-italic">
              <strong>{q.issuer.businessName}</strong>
              <br />
              {q.issuer.ownerName}
              <br />
              <span className="whitespace-pre-line">{q.issuer.address}</span>
              <br />
              SIRET : {q.issuer.siret}
              <br />
              {q.issuer.email}
            </address>
          </section>
        )}
        <section aria-labelledby="client-h">
          <h3 id="client-h" className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">
            Client
          </h3>
          <address className="not-italic">
            <strong>{q.client.company || q.client.name}</strong>
            {q.client.company && (
              <>
                <br />
                {q.client.name}
              </>
            )}
            {q.client.address && (
              <>
                <br />
                <span className="whitespace-pre-line">{q.client.address}</span>
              </>
            )}
            <br />
            {q.client.email}
          </address>
        </section>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Détail des prestations</caption>
          <thead>
            <tr className="border-y-2 border-text bg-primary-soft">
              <th scope="col" className="p-2">Prestation</th>
              <th scope="col" className="p-2 text-right">Qté</th>
              <th scope="col" className="hidden p-2 text-right sm:table-cell">Prix unitaire</th>
              <th scope="col" className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {q.items.map((item) => (
              <tr key={item.id} className="border-b border-text/30">
                <td className="p-2">
                  {item.description}
                  <span className="block text-sm text-muted sm:hidden">
                    {formatMoney(item.unitPriceCents)} l’unité
                  </span>
                </td>
                <td className="p-2 text-right whitespace-nowrap">
                  {item.quantity}
                  {item.unit
                    ? ` ${item.unit}${item.quantity > 1 && !item.unit.endsWith("s") ? "s" : ""}`
                    : ""}
                </td>
                <td className="hidden p-2 text-right whitespace-nowrap sm:table-cell">{formatMoney(item.unitPriceCents)}</td>
                <td className="p-2 text-right whitespace-nowrap">
                  {formatMoney(Math.round(item.quantity * item.unitPriceCents))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto mt-4 w-full max-w-xs space-y-1">
        <div className="flex justify-between">
          <dt>Total HT</dt>
          <dd>{formatMoney(q.subtotalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>TVA ({q.vatRate.toLocaleString("fr-FR")} %)</dt>
          <dd>{formatMoney(q.vatCents)}</dd>
        </div>
        <div className="flex justify-between border-t-2 border-text pt-1 text-lg font-bold">
          <dt>Total TTC</dt>
          <dd>{formatMoney(q.totalCents)}</dd>
        </div>
      </dl>

      {(q.vatRate === 0 && q.issuer?.vatMention) || q.notes || q.issuer?.paymentTerms ? (
        <footer className="mt-6 space-y-2 border-t-2 border-text pt-4 text-sm">
          {q.vatRate === 0 && q.issuer?.vatMention && <p>{q.issuer.vatMention}</p>}
          {q.issuer?.paymentTerms && (
            <p>
              <strong>Conditions de paiement :</strong> {q.issuer.paymentTerms}
            </p>
          )}
          {q.notes && <p className="whitespace-pre-line">{q.notes}</p>}
        </footer>
      ) : null}
    </article>
  );
}
