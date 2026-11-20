import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="flex min-h-screen items-center justify-center px-4">
      <div className="panel max-w-md text-center">
        <p className="text-5xl font-bold" aria-hidden="true">404</p>
        <h1 className="mt-2 text-2xl font-bold">Page introuvable</h1>
        <p className="mt-2">Cette page n’existe pas ou a été déplacée.</p>
        <Link href="/" className="btn btn-primary mt-6">
          Retour au tableau de bord
        </Link>
      </div>
    </main>
  );
}
