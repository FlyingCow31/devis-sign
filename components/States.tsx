import Link from "next/link";
import type { ReactNode } from "react";

export function LoadingState({ label = "Chargement…" }: { label?: string }) {
  return (
    <p role="status" aria-live="polite" className="py-8 text-muted">
      {label}
    </p>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-md border-2 border-danger bg-danger-soft p-4">
      <p className="font-semibold">Une erreur est survenue</p>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary mt-3" onClick={onRetry}>
          Réessayer
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-md border-2 border-dashed border-text p-8 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {children && <p className="mt-1 text-muted">{children}</p>}
      {action && (
        <Link href={action.href} className="btn btn-primary mt-4">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-text pb-4">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
