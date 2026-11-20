"use client";

import { useParams } from "next/navigation";
import { endpoints } from "@/lib/api";

export default function SignedPage() {
  const { token } = useParams<{ token: string }>();

  return (
    <>
      <header className="border-b-2 border-text bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <p className="font-bold">Signature de devis</p>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-16">
        <div className="panel bg-success-soft text-center">
          <p aria-hidden="true" className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border-2 border-text bg-surface text-3xl">
            ✓
          </p>
          <h1 className="text-3xl font-bold">Merci, le devis est signé</h1>
          <p className="mt-3 text-lg">
            Une copie signée vient de vous être envoyée par e-mail. Vous pouvez aussi la télécharger dès
            maintenant.
          </p>
          <a href={endpoints.publicPdf(token)} className="btn btn-primary mt-6" download>
            Télécharger le devis signé (PDF)
          </a>
        </div>
      </main>
    </>
  );
}
