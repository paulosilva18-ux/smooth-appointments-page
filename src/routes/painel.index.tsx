import { createFileRoute, Link } from "@tanstack/react-router";
import { PAINEIS } from "@/lib/painel";

export const Route = createFileRoute("/painel/")({
  head: () => ({
    meta: [
      { title: "Área do barbeiro — Fabrício Barbeiro" },
      { name: "description", content: "Acesso ao painel de agendamentos e faturamento da barbearia." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Área do barbeiro — Fabrício Barbeiro" },
      { property: "og:description", content: "Painel interno da barbearia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelIndex,
});

function PainelIndex() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-20">
      <p className="eyebrow">Área interna</p>
      <h1 className="text-display mt-1 text-4xl">Painel do barbeiro</h1>
      <p className="mt-3 text-sm text-muted-foreground">Escolha o seu painel para entrar.</p>
      <div className="mt-8 space-y-3">
        {PAINEIS.map((p) => (
          <Link
            key={p.slug}
            to="/painel/$barbeiro"
            params={{ barbeiro: p.slug }}
            className="block border border-border bg-secondary/40 px-5 py-4 text-sm uppercase tracking-[0.2em] text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {p.nome}
          </Link>
        ))}
      </div>
      <Link to="/" className="mt-10 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
        ← Voltar ao site
      </Link>
    </main>
  );
}
