import type { QuoteStatus } from "@/lib/types";

// Each status has a text label AND a symbol, so meaning never relies on color alone.
export const statusMeta: Record<QuoteStatus, { label: string; symbol: string; className: string }> = {
  draft: { label: "Brouillon", symbol: "○", className: "bg-surface" },
  sent: { label: "Envoyé", symbol: "→", className: "bg-primary-soft" },
  viewed: { label: "Consulté", symbol: "◉", className: "bg-secondary-soft" },
  signed: { label: "Signé", symbol: "✓", className: "bg-success-soft" },
  declined: { label: "Refusé", symbol: "✕", className: "bg-danger-soft" },
  expired: { label: "Expiré", symbol: "⌛", className: "bg-accent-soft" },
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  const meta = statusMeta[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-text px-2.5 py-0.5 text-sm font-semibold ${meta.className}`}
    >
      <span aria-hidden="true">{meta.symbol}</span>
      {meta.label}
    </span>
  );
}
