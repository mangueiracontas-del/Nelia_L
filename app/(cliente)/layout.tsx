import { AuthPrompt } from "@/components/cliente/AuthPrompt";

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark-scope min-h-screen bg-ink text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-primary">Lanchonete Premium</h1>
          <a
            href="/carrinho"
            className="rounded-lg bg-gold px-3 py-1.5 text-sm font-semibold text-zinc-950"
            aria-label="Ir para o carrinho"
          >
            🛒 Carrinho
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-4">{children}</main>
      <AuthPrompt />
    </div>
  );
}
