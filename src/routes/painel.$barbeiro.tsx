import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  entrarPainel,
  sairPainel,
  statusPainel,
  agendaDoBarbeiro,
  cancelarComoBarbeiro,
  remarcarComoBarbeiro,
} from "@/lib/painel.functions";
import { nomePorSlug, precoDoServico, moeda, formatarData } from "@/lib/painel";
import { SERVICOS, BARBEIROS } from "@/lib/barbearia";
import { horariosDoBarbeiro } from "@/lib/horarios";
import {
  Scissors,
  Calendar,
  Clock,
  DollarSign,
  LogOut,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/painel/$barbeiro")({
  head: ({ params }) => ({
    meta: [
      { title: `Painel ${nomePorSlug(params.barbeiro) ?? ""} — Fabrício Barbeiro` },
      { name: "description", content: "Painel administrativo da barbearia." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PainelBarbeiro,
});

function PainelBarbeiro() {
  const { barbeiro } = Route.useParams();
  const nome = nomePorSlug(barbeiro);
  const queryClient = useQueryClient();

  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<"agenda" | "servicos" | "faturamento">("agenda");
  const [remarcandoId, setRemarcandoId] = useState<string | null>(null);
  const [novaData, setNovaData] = useState("");
  const [novaHora, setNovaHora] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const doEntrar = useServerFn(entrarPainel);
  const doSair = useServerFn(sairPainel);
  const doStatus = useServerFn(statusPainel);
  const doAgenda = useServerFn(agendaDoBarbeiro);
  const doCancelar = useServerFn(cancelarComoBarbeiro);
  const doRemarcar = useServerFn(remarcarComoBarbeiro);

  const { data: status } = useQuery({
    queryKey: ["painel-status", barbeiro],
    queryFn: () => doStatus({ data: { slug: barbeiro } }),
    refetchOnWindowFocus: false,
  });

  const { data: agendaData, refetch: refetchAgenda } = useQuery({
    queryKey: ["painel-agenda", barbeiro],
    queryFn: () => doAgenda({ data: { slug: barbeiro } }),
    enabled: status?.autenticado === true,
    refetchOnWindowFocus: false,
  });

  if (!nome) {
    return (
      <main className="min-h-screen bg-[#141414] text-stone-100 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Painel não encontrado</h1>
          <Link to="/painel" className="mt-4 inline-block text-amber-500 hover:underline">
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    const res = await doEntrar({ data: { slug: barbeiro, senha } });
    if (!res.ok) {
      setErro("Senha incorreta.");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["painel-status", barbeiro] });
    setSenha("");
  };

  const handleSair = async () => {
    await doSair();
    queryClient.invalidateQueries({ queryKey: ["painel-status", barbeiro] });
  };

  const handleCancelar = async (id: string) => {
    if (!confirm("Cancelar este agendamento?")) return;
    await doCancelar({ data: { slug: barbeiro, id } });
    refetchAgenda();
    setMsg("Agendamento cancelado.");
  };

  const iniciarRemarcar = (item: { id: string; data: string; hora: string }) => {
    setRemarcandoId(item.id);
    setNovaData(item.data);
    setNovaHora(item.hora);
    setMsg(null);
  };

  const handleRemarcar = async (id: string) => {
    const res = await doRemarcar({ data: { slug: barbeiro, id, data: novaData, hora: novaHora } });
    if (!res.ok) {
      setMsg(res.motivo === "ocupado" ? "Horário já ocupado." : "Agendamento não encontrado.");
      return;
    }
    setRemarcandoId(null);
    refetchAgenda();
    setMsg("Agendamento remarcado.");
  };

  const agora = new Date();
  const hojeIso = agora.toISOString().split("T")[0] ?? "";

  const agendamentos = agendaData?.agendamentos ?? [];
  const futuros = agendamentos.filter((a) => a.data > hojeIso || (a.data === hojeIso && a.hora >= agora.toTimeString().slice(0, 5)));
  const passados = agendamentos.filter((a) => !futuros.includes(a));

  const faturamentoHoje = agendamentos
    .filter((a) => a.data === hojeIso)
    .reduce((s, a) => s + precoDoServico(a.servico), 0);
  const seteDiasAtras = new Date(agora);
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);
  const faturamentoSemana = agendamentos
    .filter((a) => a.data >= seteDiasAtras.toISOString().split("T")[0]!)
    .reduce((s, a) => s + precoDoServico(a.servico), 0);
  const faturamentoMes = agendamentos
    .filter((a) => a.data.startsWith(hojeIso.slice(0, 7)))
    .reduce((s, a) => s + precoDoServico(a.servico), 0);

  const porServico: Record<string, number> = {};
  agendamentos.forEach((a) => {
    porServico[a.servico] = (porServico[a.servico] ?? 0) + precoDoServico(a.servico);
  });

  if (!status?.autenticado) {
    return (
      <main className="min-h-screen bg-[#141414] text-stone-100 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center justify-center gap-3">
            <Scissors className="h-8 w-8 text-amber-500" />
            <h1 className="font-['Bebas_Neue'] text-3xl tracking-wide text-white">
              Painel {nome}
            </h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4 rounded-xl border border-white/10 bg-[#1b1b1b] p-6">
            <div>
              <label className="mb-1 block text-sm text-stone-400">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-3 text-white placeholder-stone-600 focus:border-amber-500 focus:outline-none"
                placeholder="Digite a senha"
              />
            </div>
            {erro && (
              <div className="flex items-center gap-2 text-sm text-rose-400">
                <AlertCircle className="h-4 w-4" />
                {erro}
              </div>
            )}
            <button
              type="submit"
              className="w-full rounded-lg bg-amber-600 px-4 py-3 font-semibold text-white transition hover:bg-amber-500"
            >
              Entrar
            </button>
          </form>
          <Link to="/painel" className="block text-center text-sm text-stone-500 hover:text-amber-500">
            ← Outros painéis
          </Link>
        </div>
      </main>
    );
  }

  const horarios = horariosDoBarbeiro(nome);

  return (
    <main className="min-h-screen bg-[#141414] text-stone-100">
      <header className="border-b border-white/10 bg-[#1b1b1b]">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Scissors className="h-7 w-7 text-amber-500" />
            <div>
              <h1 className="font-['Bebas_Neue'] text-2xl tracking-wide text-white">
                Painel {nome}
              </h1>
              <p className="text-xs text-stone-400">{BARBEIROS.find((b) => b.nome === nome)?.display}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetchAgenda()}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-stone-300 hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
            <button
              onClick={handleSair}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-stone-300 hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {(["agenda", "servicos", "faturamento"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAba(t)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                aba === t
                  ? "bg-amber-600 text-white"
                  : "border border-white/10 text-stone-400 hover:text-white"
              }`}
            >
              {t === "agenda" ? "Agendamentos" : t === "servicos" ? "Serviços" : "Faturamento"}
            </button>
          ))}
        </div>

        {msg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <CheckCircle2 className="h-4 w-4" />
            {msg}
          </div>
        )}

        {aba === "agenda" && (
          <section className="space-y-8">
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Calendar className="h-5 w-5 text-amber-500" />
                Próximos agendamentos
              </h2>
              {futuros.length === 0 ? (
                <p className="text-stone-500">Nenhum agendamento futuro.</p>
              ) : (
                <div className="grid gap-3">
                  {futuros.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-xl border border-white/10 bg-[#1b1b1b] p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-white">{a.nome}</p>
                          <p className="text-sm text-stone-400">
                            {a.servico} · {formatarData(a.data)} às {a.hora}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {remarcandoId === a.id ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="date"
                                value={novaData}
                                min={hojeIso}
                                onChange={(e) => setNovaData(e.target.value)}
                                className="rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white"
                              />
                              <select
                                value={novaHora}
                                onChange={(e) => setNovaHora(e.target.value)}
                                className="rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white"
                              >
                                {horarios.map((h) => (
                                  <option key={h} value={h}>
                                    {h}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleRemarcar(a.id)}
                                className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setRemarcandoId(null)}
                                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-stone-300 hover:bg-white/5"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => iniciarRemarcar(a)}
                                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-stone-300 hover:bg-white/5"
                              >
                                Remarcar
                              </button>
                              <button
                                onClick={() => handleCancelar(a.id)}
                                className="flex items-center gap-1 rounded-lg border border-rose-500/20 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                Cancelar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Clock className="h-5 w-5 text-stone-500" />
                Histórico
              </h2>
              {passados.length === 0 ? (
                <p className="text-stone-500">Nenhum agendamento anterior.</p>
              ) : (
                <div className="grid gap-3 opacity-70">
                  {passados.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-xl border border-white/10 bg-[#1b1b1b] p-4"
                    >
                      <p className="font-semibold text-white">{a.nome}</p>
                      <p className="text-sm text-stone-400">
                        {a.servico} · {formatarData(a.data)} às {a.hora}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {aba === "servicos" && (
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Scissors className="h-5 w-5 text-amber-500" />
              Tabela de serviços
            </h2>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#1b1b1b] text-stone-400">
                  <tr>
                    <th className="px-4 py-3">Serviço</th>
                    <th className="px-4 py-3">Tempo</th>
                    <th className="px-4 py-3">Preço</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-[#141414]">
                  {SERVICOS.map((s) => (
                    <tr key={s.nome}>
                      <td className="px-4 py-3 text-white">{s.nome}</td>
                      <td className="px-4 py-3 text-stone-400">{s.tempo}</td>
                      <td className="px-4 py-3 font-medium text-amber-500">{s.preco}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {aba === "faturamento" && (
          <section className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-[#1b1b1b] p-5">
                <p className="text-sm text-stone-400">Hoje</p>
                <p className="mt-1 text-2xl font-bold text-white">{moeda(faturamentoHoje)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#1b1b1b] p-5">
                <p className="text-sm text-stone-400">Últimos 7 dias</p>
                <p className="mt-1 text-2xl font-bold text-white">{moeda(faturamentoSemana)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#1b1b1b] p-5">
                <p className="text-sm text-stone-400">Mês atual</p>
                <p className="mt-1 text-2xl font-bold text-white">{moeda(faturamentoMes)}</p>
              </div>
            </div>

            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <DollarSign className="h-5 w-5 text-amber-500" />
                Faturamento por serviço
              </h2>
              {Object.keys(porServico).length === 0 ? (
                <p className="text-stone-500">Nenhum agendamento registrado.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#1b1b1b] text-stone-400">
                      <tr>
                        <th className="px-4 py-3">Serviço</th>
                        <th className="px-4 py-3">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-[#141414]">
                      {Object.entries(porServico).map(([servico, total]) => (
                        <tr key={servico}>
                          <td className="px-4 py-3 text-white">{servico}</td>
                          <td className="px-4 py-3 font-medium text-amber-500">{moeda(total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
