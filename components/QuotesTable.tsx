import Link from "next/link";
import { formatDate, formatMoney } from "@/lib/format";
import type { QuoteListItem } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function QuotesTable({ quotes, caption }: { quotes: QuoteListItem[]; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-md border-2 border-text bg-surface">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b-2 border-text bg-primary-soft">
            <th scope="col" className="p-3">N°</th>
            <th scope="col" className="p-3">Objet</th>
            <th scope="col" className="p-3">Client</th>
            <th scope="col" className="p-3">Statut</th>
            <th scope="col" className="p-3 text-right">Montant</th>
            <th scope="col" className="p-3">Créé le</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <tr key={q.id} className="border-b border-text/30 last:border-0 hover:bg-background">
              <td className="p-3 whitespace-nowrap">
                <Link href={`/quotes/${q.id}`} className="font-semibold">
                  {q.number}
                  <span className="sr-only"> – voir le devis {q.title}</span>
                </Link>
              </td>
              <td className="p-3">{q.title}</td>
              <td className="p-3">{q.client.company || q.client.name}</td>
              <td className="p-3">
                <StatusBadge status={q.status} />
              </td>
              <td className="p-3 text-right whitespace-nowrap">{formatMoney(q.totalCents)}</td>
              <td className="p-3 whitespace-nowrap">{formatDate(q.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
