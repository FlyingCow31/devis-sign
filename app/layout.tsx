import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Devis Signés", template: "%s · Devis Signés" },
  description: "Créez, envoyez et faites signer vos devis en ligne.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border-2 focus:border-text focus:bg-surface focus:px-4 focus:py-2 focus:font-semibold"
        >
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  );
}
