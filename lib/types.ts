// Shared types. These describe the JSON the (future) backend must return.
// All money amounts are integers in cents to avoid floating-point errors.

export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "signed"
  | "declined"
  | "expired";

export interface Client {
  name: string;
  email: string;
  company?: string;
  address?: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit?: string; // "jour", "heure", "forfait"...
  unitPriceCents: number;
}

export type AuditEventType =
  | "created"
  | "sent"
  | "viewed"
  | "signed"
  | "declined"
  | "expired"
  | "reminder_sent";

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  at: string; // ISO date
  ip?: string;
  userAgent?: string;
  detail?: string;
}

export interface SignatureInfo {
  signerName: string;
  method: "drawn" | "typed";
  signedAt: string;
  ip: string;
  documentHash: string; // SHA-256 of the PDF that was signed
  imageUrl?: string;
}

export interface Quote {
  id: string;
  number: string; // e.g. "D-2026-014"
  title: string;
  client: Client;
  items: LineItem[];
  vatRate: number; // 0, 5.5, 10, 20
  notes?: string;
  validUntil: string; // ISO date
  status: QuoteStatus;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  signedAt?: string;
  signUrl?: string; // public link sent to the client
  signature?: SignatureInfo;
  declineReason?: string;
  events: AuditEvent[];
}

export type QuoteListItem = Pick<
  Quote,
  "id" | "number" | "title" | "client" | "status" | "totalCents" | "createdAt" | "validUntil"
>;

export interface DashboardData {
  counts: Record<QuoteStatus, number>;
  pendingTotalCents: number; // sent + viewed
  signedTotalCents: number; // signed this month
  signatureRate: number; // 0..1, signed / (signed + declined + expired)
  recent: QuoteListItem[];
}

export interface QuoteInput {
  title: string;
  client: Client;
  items: Omit<LineItem, "id">[];
  vatRate: number;
  notes?: string;
  validUntil: string;
  sendNow: boolean;
}

export interface BusinessSettings {
  businessName: string;
  ownerName: string;
  siret: string;
  address: string;
  email: string;
  phone?: string;
  vatMention: string; // e.g. "TVA non applicable, art. 293 B du CGI"
  paymentTerms: string;
  defaultValidityDays: number;
}

/** What the public signing page receives. No internal data, no audit trail. */
export interface PublicQuote {
  number: string;
  title: string;
  issuer: BusinessSettings;
  client: Client;
  items: LineItem[];
  vatRate: number;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  notes?: string;
  createdAt: string;
  validUntil: string;
  status: QuoteStatus;
  signedAt?: string;
}

export interface SignInput {
  signerName: string;
  method: "drawn" | "typed";
  signatureImage: string; // PNG data URL
  acceptedTerms: true;
}
