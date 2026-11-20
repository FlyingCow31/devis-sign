"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";

const links = [
  { href: "/", label: "Tableau de bord" },
  { href: "/quotes", label: "Devis" },
  { href: "/settings", label: "Paramètres" },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  async function logout() {
    try {
      await api.logout();
    } finally {
      router.push("/login");
    }
  }

  return (
    <header className="border-b-2 border-text bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-text no-underline">
          <span aria-hidden="true" className="mr-2 inline-block rounded border-2 border-text bg-primary px-1.5">
            ✍
          </span>
          Devis&nbsp;Signés
        </Link>

        <nav aria-label="Navigation principale">
          <ul className="flex flex-wrap items-center gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`block rounded-md px-3 py-2 font-semibold text-text no-underline hover:bg-primary-soft ${
                    isActive(l.href) ? "bg-primary-soft underline decoration-2 underline-offset-4" : ""
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/quotes/new" className="btn btn-primary ml-2">
                <span aria-hidden="true">+</span> Nouveau devis
              </Link>
            </li>
            <li>
              <button type="button" onClick={logout} className="ml-1 rounded-md px-3 py-2 font-semibold underline underline-offset-4 hover:bg-primary-soft">
                Déconnexion
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
