import { createFileRoute, Link } from "@tanstack/react-router";
import { PAINEIS } from "@/lib/painel";
import { Scissors } from "lucide-react";

export const Route = createFileRoute("/painel/")({
  head: () => ({
    meta: [
      { title: "Área do barbeiro — Fabrício Barbeiro" },
      { name: "description", content: "Acesso aos painéis administrativos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PainelIndex,
});

function PainelIndex() {
  return (
    <main className="min-h-screen bg-[#141414] text-stone-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <Scissors className="h-8 w-8 text-amber-500" />
          <h1 className="font-['Bebas_Neue'] text-4xl tracking-wide text-white">
            Área do barbeiro
          </h1>
        </div>
        <p className="text-stone-400">
          Escolha seu painel para gerenciar agendamentos e faturamento.
        </p>
        <div className="grid gap-4">
          {PAINEIS.map((p) => (
            <Link
              key={p.slug}
              to="/painel/$barbeiro"
              params={{ barbeiro: p.slug }}
              className="rounded-xl border border-white/10 bg-[#1b1b1b] p-6 text-left transition hover:border-amber-500/40 hover:bg-[#222]"
            >
              <span className="block text-lg font-semibold text-white">
                {p.nome}
              </span>
              <span className="text-sm text-stone-400">
                Acessar painel →
              </span>
            </Link>
          ))}
        </div>
        <Link to="/" className="inline-block text-sm text-stone-500 hover:text-amber-500">
          Voltar ao site
        </Link>
      </div>
    </main>
  );
}
