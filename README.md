# Devis Signés — front-end

Create quotes, send a signing link, and track signatures. **Front-end only:** every page calls `/api/...` routes that don't exist yet. All calls go through `lib/api.ts`, and the response types are in `lib/types.ts`.

```bash
npm install
npm run dev   # http://localhost:3000. Pages show an error state until the API exists.
```

## Pages

| Route | Purpose | Access |
|---|---|---|
| `/login` | Sign in | public |
| `/` | Dashboard: amounts pending and signed, signature rate, counts by status, recent quotes | private |
| `/quotes` | Quote list, filter with `?status=` | private |
| `/quotes/new` | Create a quote: client, line items, VAT, validity. Save as draft or send | private |
| `/quotes/[id]` | Quote detail: send or remind, copy the link, PDF, delete a draft, signature proof, history | private |
| `/settings` | Business details printed on quotes: SIRET, VAT mention, payment terms | private |
| `/sign/[token]` | **Client signing page**: review, sign (typed name or drawing), "Bon pour accord", or decline | public (token) |
| `/sign/[token]/done` | Confirmation and signed PDF | public (token) |

Protecting the private pages (middleware + session) is up to the backend.

## API contract to implement

Amounts are **integers in cents**. Dates are ISO strings. Errors use the format `{ "message": "..." }`, and the UI shows that message.

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` | 204 (401 if wrong) |
| POST | `/api/auth/logout` | — | 204 |
| GET | `/api/dashboard` | — | `DashboardData` |
| GET | `/api/quotes?status=` | — | `QuoteListItem[]` |
| POST | `/api/quotes` | `QuoteInput` (`sendNow: true` = send the email right away) | `Quote` |
| GET | `/api/quotes/:id` | — | `Quote` (404 if not found) |
| DELETE | `/api/quotes/:id` | — | 204 (drafts only) |
| POST | `/api/quotes/:id/send` | — | `Quote` (send, or remind if already sent) |
| GET | `/api/quotes/:id/pdf` | — | `application/pdf` |
| GET | `/api/settings` | — | `BusinessSettings` |
| PUT | `/api/settings` | `BusinessSettings` | `BusinessSettings` |
| GET | `/api/sign/:token` | — | `PublicQuote` (404/410 = invalid or expired link). **Should log a `viewed` event** |
| POST | `/api/sign/:token` | `SignInput` | `{ signedAt, documentHash }` |
| POST | `/api/sign/:token/decline` | `{ reason }` | 204 |
| GET | `/api/sign/:token/pdf` | — | `application/pdf` (signed version once signed) |

### What the backend should do when a quote is signed
1. Check the token: it exists, it hasn't expired, and the status is `sent` or `viewed`.
2. Generate the final PDF and compute its **SHA-256**.
3. Save the signer's name, the signature image, IP address, user-agent and timestamp, plus a `signed` event.
4. Email the signed PDF to both parties.

This is a *simple* electronic signature (eIDAS), not a qualified one, which is enough for a quote.

## Accessibility
- Palette checked for WCAG contrast. Dark text (`--text`) is used on every colored background, because white text on these colors fails AA. Darker shades are used for links and warnings.
- Statuses show a symbol and a label, never color alone.
- Skip link, `aria-current` in the nav, one strong focus outline, keyboard-friendly 44px targets.
- Forms: visible labels, an error summary that receives focus with links to each field, `aria-invalid` and `aria-describedby`.
- Signature can be done **without a mouse** ("Écrire mon nom"), or drawn with mouse, finger or stylus.
- Respects `prefers-reduced-motion` and the browser's font size.

## Stack
Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4. No other dependencies.
