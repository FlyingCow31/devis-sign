const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const date = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const dateTime = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatMoney = (cents: number) => eur.format(cents / 100);
export const formatDate = (iso: string) => date.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));

/** "12,50" or "12.50" -> 1250. Returns NaN for invalid input. */
export function parseEurosToCents(value: string): number {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  if (normalized === "" || !/^\d+(\.\d{0,2})?$/.test(normalized)) return NaN;
  return Math.round(parseFloat(normalized) * 100);
}

export function computeTotals(
  items: { quantity: number; unitPriceCents: number }[],
  vatRate: number,
) {
  const subtotalCents = items.reduce(
    (sum, i) => sum + Math.round((i.quantity || 0) * (i.unitPriceCents || 0)),
    0,
  );
  const vatCents = Math.round((subtotalCents * vatRate) / 100);
  return { subtotalCents, vatCents, totalCents: subtotalCents + vatCents };
}

export function addDays(days: number, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
