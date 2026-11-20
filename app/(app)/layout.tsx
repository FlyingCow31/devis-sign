import { AppHeader } from "@/components/AppHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </>
  );
}
