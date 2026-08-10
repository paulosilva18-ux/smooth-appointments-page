import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SERVICOS } from "@/lib/barbearia";
import { HORARIOS } from "@/lib/horarios";
import { formatarData, moeda, nomePorSlug, precoDoServico } from "@/lib/painel";
import {
  agendaDoBarbeiro,
  cancelarComoBarbeiro,
  entrarPainel,
  remarcarComoBarbeiro,
  sairPainel,
  statusPainel,
} from "@/lib/painel.functions";

export const Route = createFileRoute("/painel/$barbeiro")({
  head: () => ({
    meta: [
      { title: "Painel do barbeiro — Fabrício Barbeiro" },
      {
        name: "description",
        content: "Gerencie agendamentos, serviços e faturamento da barbearia.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Painel do barbeiro — Fabrício Barbeiro" },
      { property: "og:description", content: "Área interna da barbearia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelBarbeiro,
});

type Agendamento = {
  id: string;
  nome: string;
  servico: string;
  barbeiro: string;
  data: string;
  hora: string;
  created_at: string;
};

const fieldClass =
  "w-full rounded-sm border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary";

const hoje = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Recife" });

function inicioSemana(iso: string) {
  const d = new Date(`${iso}T12:00:00-03:00`);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Recife" });
}

function PainelBarbeiro() {
  const { barbeiro } = Route.useParams();
  const nome = nomePorSlug(barbeiro);

  const login = useServerFn(entrarPainel);
  const logout = useServerFn(sairPainel);
  const status = useServerFn(statusPainel);
  const agenda = useServerFn(agendaDoBarbeiro);
  const cancelar = useServerFn(cancelarComoBarbeiro);
  const remarcar = useServerFn(remarcarComoBarbeiro);

  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [itens, setItens] = useState<Agendamento[]>([]);
  const [aba, setAba] = useState<"agenda" | "servicos" | "faturamento">("agenda");
  const [editando, setEditando] = useState<string | null>(null);
  const [novaData, setNovaData] = useState("");
  const [novaHora, setNovaHora] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const res = await agenda({ data: { slug: barbeiro } });
      setItens(res.agendamentos as Agendamento[]);
      setAutenticado(true);
    } catch {
      setAutenticado(false);
    }
  }, [agenda, barbeiro]);

  useEffect(() => {
    if (!nome) return;
    status({ data: { slug: barbeiro } })
      .then((r) => (r.autenticado ? carregar() : setAutenticado(false)))
      .catch(() => setAutenticado(false));
  }, [nome, barbeiro, status, carregar]);

  const hojeIso = hoje();
  const semanaIso = inicioSemana(hojeIso);
  const mesIso = hojeIso.slice(0, 7);

  const resumo = useMemo(() => {
    const soma = (fn: (a: Agendamento) => boolean) =>
      itens.filter(fn).reduce((t, a) => t + precoDoServico(a.servico), 0);
    return {
      hoje: soma((a) => a.data === hojeIso),
      semana: soma((a) => a.data >= semanaIso && a.data <= hojeIso),
      mes: soma((a) => a.data.startsWith(mesIso)),
      total: soma(() => true),
      qtdHoje: itens.filter((a) => a.data === hojeIso).length,
    };
  }, [itens, hojeIso, semanaIso, mesIso]);

  const porServico = useMemo(() => {
    const mapa = new Map<string, { qtd: number; total: number }>();
    itens.forEach((a) => {
      const chave = a.servico.replace(/\s*\(.*\)\s*$/, "");
      const atual = mapa.get(chave) ?? { qtd: 0, total: 0 };
      mapa.set(chave, { qtd: atual.qtd + 1, total: atual.total + precoDoServico(a.servico) });
    });
    return [...mapa.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [itens]);

  if (!nome) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-display text-3xl">Painel não encontrado</h1>
        <Link to="/painel" className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-primary">
          Ver painéis disponíveis
        </Link>
      </main>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setOcupado(true);
    try {
      const res = await login({ data: { slug: barbeiro, senha } });
      if (!res.ok) {
        setErro("Senha incorreta.");
        return;
      }
      setSenha("");
      await carregar();
    } catch {
      setErro("Não foi possível entrar agora.");
    } finally {
      setOcupado(false);
    }
  };

  const handleSair = async () => {
    await logout();
    setAutenticado(false);
    setItens([]);
  };

  const handleCancelar = async (a: Agendamento) => {
    if (!window.confirm(`Cancelar ${a.nome} — ${formatarData(a.data)} às ${a.hora}?`)) return;
    setOcupado(true);
    try {
      await cancelar({ data: { slug: barbeiro, id: a.id } });
      setItens((prev) => prev.filter((i) => i.id !== a.id));
    } catch {
      setErro("Não foi possível cancelar.");
    } finally {
      setOcupado(false);
    }
  };

  const handleRemarcar = async (a: Agendamento) => {
    if (!novaData || !novaHora) return;
    setOcupado(true);
    setErro(null);
    try {
      const res = await remarcar({
        data: { slug: barbeiro, id: a.id, data: novaData, hora: novaHora },
      });
      if (!res.ok) {
        setErro(res.motivo === "ocupado" ? "Você já tem alguém nesse horário." : "Agendamento não encontrado.");
        return;
      }
      setItens((prev) =>
        prev.map((i) => (i.id === a.id ? (res.agendamento as Agendamento) : i)),
      );
      setEditando(null);
    } catch {
      setErro("Não foi possível remarcar.");
    } finally {
      setOcupado(false);
    }
  };

  if (autenticado === null) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center text-sm text-muted-foreground">
        Carregando painel…
      </main>
    );
  }

  if (!autenticado) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-20">
        <p className="eyebrow">Área interna</p>
        <h1 className="text-display mt-1 text-4xl">Painel de {nome}</h1>
        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha do painel"
            autoComplete="current-password"
            className={fieldClass}
            aria-label="Senha do painel"
          />
          <button
            type="submit"
            disabled={ocupado || !senha}
            className="w-full rounded-sm bg-primary px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-50"
          >
            {ocupado ? "Entrando…" : "Entrar"}
          </button>
          {erro && <p className="text-center text-xs text-destructive">{erro}</p>}
        </form>
        <Link to="/" className="mt-10 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
          ← Voltar ao site
        </Link>
      </main>
    );
  }

  const proximos = itens.filter((a) => a.data >= hojeIso);
  const passados = itens.filter((a) => a.data < hojeIso).reverse();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="eyebrow">Painel do barbeiro</p>
          <h1 className="text-display mt-1 text-4xl">{nome}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
            Site
          </Link>
          <button
            type="button"
            onClick={handleSair}
            className="rounded-sm border border-border px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:border-primary hover:text-primary"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Hoje", valor: moeda(resumo.hoje) },
          { label: "Semana", valor: moeda(resumo.semana) },
          { label: "Mês", valor: moeda(resumo.mes) },
          { label: "Cortes hoje", valor: String(resumo.qtdHoje) },
        ].map((c) => (
          <div key={c.label} className="border border-border bg-secondary/40 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{c.label}</p>
            <p className="text-display mt-1 text-2xl text-primary">{c.valor}</p>
          </div>
        ))}
      </div>

      <nav className="mt-8 flex gap-2">
        {(
          [
            ["agenda", "Agendamentos"],
            ["servicos", "Serviços"],
            ["faturamento", "Faturamento"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id)}
            className={`rounded-sm border px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors ${
              aba === id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {erro && <p className="mt-4 text-xs text-destructive">{erro}</p>}

      {aba === "agenda" && (
        <section className="mt-6 space-y-8">
          <div>
            <h2 className="text-display text-2xl">Próximos ({proximos.length})</h2>
            {proximos.length === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">Nenhum horário marcado.</p>
            )}
            <ul className="mt-4 space-y-3">
              {proximos.map((a) => (
                <li key={a.id} className="border border-border bg-secondary/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatarData(a.data)} · {a.hora} — {a.nome}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{a.servico}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditando(editando === a.id ? null : a.id);
                          setNovaData(a.data);
                          setNovaHora(a.hora);
                        }}
                        className="rounded-sm border border-primary px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        Remarcar
                      </button>
                      <button
                        type="button"
                        disabled={ocupado}
                        onClick={() => handleCancelar(a)}
                        className="rounded-sm border border-border px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>

                  {editando === a.id && (
                    <div className="mt-4 space-y-3">
                      <input
                        type="date"
                        value={novaData}
                        onChange={(e) => setNovaData(e.target.value)}
                        className={fieldClass}
                        aria-label="Nova data"
                      />
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {HORARIOS.map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setNovaHora(h)}
                            className={`rounded-sm border px-2 py-2 text-sm transition-colors ${
                              novaHora === h
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-secondary text-muted-foreground hover:border-primary hover:text-foreground"
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={ocupado}
                        onClick={() => handleRemarcar(a)}
                        className="w-full rounded-sm bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-50"
                      >
                        Salvar novo horário
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {passados.length > 0 && (
            <div>
              <h2 className="text-display text-2xl">Histórico</h2>
              <ul className="mt-4 space-y-2">
                {passados.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap justify-between gap-2 border border-border/60 px-4 py-3 text-xs text-muted-foreground"
                  >
                    <span>
                      {formatarData(a.data)} · {a.hora} — {a.nome}
                    </span>
                    <span>{a.servico}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {aba === "servicos" && (
        <section className="mt-6">
          <h2 className="text-display text-2xl">Tabela de serviços</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Preços e tempos usados no agendamento do site.
          </p>
          <ul className="mt-4 divide-y divide-border border border-border">
            {SERVICOS.map((s) => (
              <li key={s.nome} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <p className="text-sm text-foreground">{s.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.categoria} · {s.tempo}
                  </p>
                </div>
                <span className="text-display text-xl text-primary">{s.preco}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {aba === "faturamento" && (
        <section className="mt-6">
          <h2 className="text-display text-2xl">Faturamento por serviço</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Baseado nos agendamentos registrados no site. Total geral: {moeda(resumo.total)}
          </p>
          {porServico.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Ainda não há agendamentos.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border border border-border">
              {porServico.map(([servico, v]) => (
                <li key={servico} className="flex items-center justify-between gap-2 px-4 py-3">
                  <span className="text-sm text-foreground">
                    {servico} <span className="text-xs text-muted-foreground">×{v.qtd}</span>
                  </span>
                  <span className="text-display text-xl text-primary">{moeda(v.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
