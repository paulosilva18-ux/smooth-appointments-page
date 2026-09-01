import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  entrarAdmin,
  sairAdmin,
  statusAdmin,
  agendaAdmin,
  cancelarAdmin,
  remarcarAdmin,
  criarBloqueio,
  removerBloqueio,
  listarCatalogoAdmin,
  salvarServico,
  removerServico,
  salvarBarbeiro,
  removerBarbeiro,
} from "@/lib/admin.functions";
import { horariosDoBarbeiro } from "@/lib/horarios";
import { formatarData, moeda, precoDoServico } from "@/lib/painel";
import {
  AlertCircle,
  Ban,
  CalendarDays,
  Filter,
  LogOut,
  Lock,
  Plus,
  RefreshCw,
  Scissors,
  Trash2,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração — Fabrício Barbeiro" },
      { name: "description", content: "Área restrita de gestão da barbearia." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const input =
  "w-full rounded-md border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white outline-none focus:border-amber-500";
const btn =
  "rounded-md border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-200 transition hover:border-amber-500 hover:text-amber-400";
const btnPrim =
  "rounded-md bg-amber-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-amber-500 disabled:opacity-50";

function hojeIso() {
  return new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
}

type ServicoRow = {
  id: string;
  nome: string;
  categoria: string;
  duracao_min: number;
  preco: number;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
};
type BarbeiroRow = {
  id: string;
  slug: string;
  nome: string;
  whatsapp: string;
  display: string;
  ativo: boolean;
};

function AdminPage() {
  const qc = useQueryClient();
  const doEntrar = useServerFn(entrarAdmin);
  const doSair = useServerFn(sairAdmin);
  const doStatus = useServerFn(statusAdmin);
  const doAgenda = useServerFn(agendaAdmin);

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const { data: status } = useQuery({
    queryKey: ["admin-status"],
    queryFn: () => doStatus(),
    refetchOnWindowFocus: false,
  });
  const perfil = status?.perfil ?? null;

  const [dia, setDia] = useState(hojeIso());
  const [filtroBarbeiro, setFiltroBarbeiro] = useState<string>("");

  const { data: agenda, refetch } = useQuery({
    queryKey: ["admin-agenda", perfil?.slug, filtroBarbeiro],
    queryFn: () => doAgenda({ data: { barbeiro: filtroBarbeiro || null } }),
    enabled: Boolean(perfil),
    refetchOnWindowFocus: false,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    const res = await doEntrar({ data: { usuario, senha } });
    if (!res.ok) {
      setErro("Usuário ou senha inválidos.");
      return;
    }
    setSenha("");
    qc.invalidateQueries({ queryKey: ["admin-status"] });
  };

  if (!perfil) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#141414] p-6 text-stone-100">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4 rounded-xl border border-white/10 bg-[#1b1b1b] p-6"
        >
          <div className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" />
            <h1 className="font-['Bebas_Neue'] text-2xl tracking-wide">Área restrita</h1>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-stone-400">Usuário</label>
            <input
              className={input}
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="fabricio, victor ou admin"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-stone-400">Senha</label>
            <input
              className={input}
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {erro && (
            <p className="flex items-center gap-2 text-sm text-rose-400">
              <AlertCircle className="h-4 w-4" /> {erro}
            </p>
          )}
          <button type="submit" className={`${btnPrim} w-full py-3`}>
            Entrar
          </button>
        </form>
      </main>
    );
  }

  const agendamentos = agenda?.agendamentos ?? [];
  const bloqueios = agenda?.bloqueios ?? [];
  const barbeiros = agenda?.barbeiros ?? [];

  return (
    <main className="min-h-screen bg-[#141414] text-stone-100">
      <header className="border-b border-white/10 bg-[#1b1b1b]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <Scissors className="h-6 w-6 text-amber-500" />
            <div>
              <h1 className="font-['Bebas_Neue'] text-2xl tracking-wide">
                {perfil.admin ? "Administração geral" : `Agenda de ${perfil.nome}`}
              </h1>
              <p className="text-xs text-stone-400">
                {perfil.admin ? "Acesso total" : "Perfil barbeiro"}
              </p>
            </div>
          </div>
          <button
            className={btn}
            onClick={async () => {
              await doSair();
              qc.invalidateQueries({ queryKey: ["admin-status"] });
            }}
          >
            <span className="flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 p-5">
        <AgendaSecao
          perfilAdmin={perfil.admin}
          perfilNome={perfil.nome}
          dia={dia}
          setDia={setDia}
          filtroBarbeiro={filtroBarbeiro}
          setFiltroBarbeiro={setFiltroBarbeiro}
          agendamentos={agendamentos}
          bloqueios={bloqueios}
          barbeiros={barbeiros}
          refetch={refetch}
        />
        {perfil.admin && <GestaoSecao />}
      </div>
    </main>
  );
}

type Agendamento = {
  id: string;
  nome: string;
  servico: string;
  barbeiro: string;
  data: string;
  hora: string;
};
type Bloqueio = {
  id: string;
  barbeiro: string;
  data: string;
  hora: string | null;
  motivo: string | null;
};

function AgendaSecao({
  perfilAdmin,
  perfilNome,
  dia,
  setDia,
  filtroBarbeiro,
  setFiltroBarbeiro,
  agendamentos,
  bloqueios,
  barbeiros,
  refetch,
}: {
  perfilAdmin: boolean;
  perfilNome: string;
  dia: string;
  setDia: (v: string) => void;
  filtroBarbeiro: string;
  setFiltroBarbeiro: (v: string) => void;
  agendamentos: Agendamento[];
  bloqueios: Bloqueio[];
  barbeiros: BarbeiroRow[];
  refetch: () => void;
}) {
  const doCancelar = useServerFn(cancelarAdmin);
  const doRemarcar = useServerFn(remarcarAdmin);
  const doBloquear = useServerFn(criarBloqueio);
  const doDesbloquear = useServerFn(removerBloqueio);

  const [msg, setMsg] = useState<string | null>(null);
  const [remarcandoId, setRemarcandoId] = useState<string | null>(null);
  const [novaData, setNovaData] = useState("");
  const [novaHora, setNovaHora] = useState("");
  const [modalBloqueio, setModalBloqueio] = useState(false);

  const doDia = useMemo(
    () => agendamentos.filter((a) => a.data === dia).sort((a, b) => a.hora.localeCompare(b.hora)),
    [agendamentos, dia],
  );
  const bloqueiosDoDia = bloqueios.filter((b) => b.data === dia);
  const faturamentoDia = doDia.reduce((s, a) => s + precoDoServico(a.servico), 0);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-[#1b1b1b] p-4">
        <div>
          <label className="mb-1 flex items-center gap-2 text-xs uppercase text-stone-400">
            <CalendarDays className="h-3.5 w-3.5" /> Dia
          </label>
          <input type="date" className={input} value={dia} onChange={(e) => setDia(e.target.value)} />
        </div>
        {perfilAdmin && (
          <div>
            <label className="mb-1 flex items-center gap-2 text-xs uppercase text-stone-400">
              <Filter className="h-3.5 w-3.5" /> Barbeiro
            </label>
            <select
              className={input}
              value={filtroBarbeiro}
              onChange={(e) => setFiltroBarbeiro(e.target.value)}
            >
              <option value="">Todos</option>
              {barbeiros.map((b) => (
                <option key={b.id} value={b.nome}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>
        )}
        <button className={btn} onClick={() => refetch()}>
          <span className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </span>
        </button>
        <button className={btnPrim} onClick={() => setModalBloqueio(true)}>
          <span className="flex items-center gap-2">
            <Ban className="h-4 w-4" /> Bloqueio de emergência
          </span>
        </button>
        <p className="ml-auto text-sm text-stone-400">
          {doDia.length} agendamento(s) · {moeda(faturamentoDia)}
        </p>
      </div>

      {msg && <p className="text-sm text-amber-400">{msg}</p>}

      <div className="space-y-3">
        {doDia.length === 0 && (
          <p className="rounded-xl border border-white/10 bg-[#1b1b1b] p-6 text-center text-sm text-stone-400">
            Nenhum agendamento em {formatarData(dia)}.
          </p>
        )}
        {doDia.map((a) => (
          <article key={a.id} className="rounded-xl border border-white/10 bg-[#1b1b1b] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">
                  {a.hora} · {a.nome}
                </p>
                <p className="text-sm text-stone-400">
                  {a.servico} {perfilAdmin && <span className="text-amber-500">· {a.barbeiro}</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className={btn}
                  onClick={() => {
                    setRemarcandoId(a.id);
                    setNovaData(a.data);
                    setNovaHora(a.hora);
                    setMsg(null);
                  }}
                >
                  Remarcar
                </button>
                <button
                  className={`${btn} hover:border-rose-500 hover:text-rose-400`}
                  onClick={async () => {
                    if (!confirm(`Cancelar o horário de ${a.nome}?`)) return;
                    await doCancelar({ data: { id: a.id } });
                    setMsg("Agendamento cancelado.");
                    refetch();
                  }}
                >
                  <span className="flex items-center gap-1">
                    <Trash2 className="h-3.5 w-3.5" /> Cancelar
                  </span>
                </button>
              </div>
            </div>
            {remarcandoId === a.id && (
              <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-white/10 pt-3">
                <input
                  type="date"
                  className={`${input} max-w-[170px]`}
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                />
                <select
                  className={`${input} max-w-[130px]`}
                  value={novaHora}
                  onChange={(e) => setNovaHora(e.target.value)}
                >
                  {horariosDoBarbeiro(a.barbeiro).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <button
                  className={btnPrim}
                  onClick={async () => {
                    const res = await doRemarcar({
                      data: { id: a.id, data: novaData, hora: novaHora },
                    });
                    setMsg(
                      res.ok
                        ? "Agendamento remarcado."
                        : res.motivo === "ocupado"
                          ? "Horário já ocupado."
                          : "Agendamento não encontrado.",
                    );
                    if (res.ok) setRemarcandoId(null);
                    refetch();
                  }}
                >
                  Salvar
                </button>
                <button className={btn} onClick={() => setRemarcandoId(null)}>
                  Cancelar
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#1b1b1b] p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-300">
          <Ban className="h-4 w-4 text-rose-400" /> Bloqueios de {formatarData(dia)}
        </h2>
        {bloqueiosDoDia.length === 0 ? (
          <p className="text-sm text-stone-500">Nenhum bloqueio neste dia.</p>
        ) : (
          <ul className="space-y-2">
            {bloqueiosDoDia.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-md border border-white/10 px-3 py-2 text-sm"
              >
                <span>
                  {b.hora ?? "Dia inteiro"}
                  {perfilAdmin && <span className="text-amber-500"> · {b.barbeiro}</span>}
                  {b.motivo && <span className="text-stone-500"> — {b.motivo}</span>}
                </span>
                <button
                  className={btn}
                  onClick={async () => {
                    await doDesbloquear({ data: { id: b.id } });
                    refetch();
                  }}
                >
                  Liberar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalBloqueio && (
        <ModalBloqueio
          perfilAdmin={perfilAdmin}
          perfilNome={perfilNome}
          barbeiros={barbeiros}
          diaPadrao={dia}
          onFechar={() => setModalBloqueio(false)}
          onSalvar={async (payload) => {
            const res = await doBloquear({ data: payload });
            setMsg(res.ok ? "Horários bloqueados." : "Selecione ao menos um horário.");
            setModalBloqueio(false);
            refetch();
          }}
        />
      )}
    </section>
  );
}

function ModalBloqueio({
  perfilAdmin,
  perfilNome,
  barbeiros,
  diaPadrao,
  onFechar,
  onSalvar,
}: {
  perfilAdmin: boolean;
  perfilNome: string;
  barbeiros: BarbeiroRow[];
  diaPadrao: string;
  onFechar: () => void;
  onSalvar: (p: {
    barbeiro: string;
    data: string;
    horas: string[];
    diaInteiro: boolean;
    motivo: string;
  }) => void;
}) {
  const [barbeiro, setBarbeiro] = useState(
    perfilAdmin ? (barbeiros[0]?.nome ?? perfilNome) : perfilNome,
  );
  const [data, setData] = useState(diaPadrao);
  const [diaInteiro, setDiaInteiro] = useState(false);
  const [horas, setHoras] = useState<string[]>([]);
  const [motivo, setMotivo] = useState("");

  const grade = horariosDoBarbeiro(barbeiro);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg space-y-4 rounded-xl border border-white/10 bg-[#1b1b1b] p-5">
        <h3 className="font-['Bebas_Neue'] text-xl tracking-wide">Bloqueio de emergência</h3>
        {perfilAdmin && (
          <div>
            <label className="mb-1 block text-xs uppercase text-stone-400">Barbeiro</label>
            <select className={input} value={barbeiro} onChange={(e) => setBarbeiro(e.target.value)}>
              {barbeiros.map((b) => (
                <option key={b.id} value={b.nome}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs uppercase text-stone-400">Data</label>
          <input type="date" className={input} value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-300">
          <input
            type="checkbox"
            checked={diaInteiro}
            onChange={(e) => setDiaInteiro(e.target.checked)}
          />
          Bloquear o dia inteiro
        </label>
        {!diaInteiro && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {grade.map((h) => {
              const on = horas.includes(h);
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() =>
                    setHoras((prev) => (on ? prev.filter((x) => x !== h) : [...prev, h]))
                  }
                  className={`rounded-md border px-2 py-2 text-xs ${
                    on
                      ? "border-rose-500 bg-rose-600/20 text-rose-300"
                      : "border-white/10 text-stone-300 hover:border-amber-500"
                  }`}
                >
                  {h}
                </button>
              );
            })}
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs uppercase text-stone-400">Motivo (opcional)</label>
          <input
            className={input}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Imprevisto, consulta, etc."
          />
        </div>
        <div className="flex justify-end gap-2">
          <button className={btn} onClick={onFechar}>
            Fechar
          </button>
          <button
            className={btnPrim}
            onClick={() => onSalvar({ barbeiro, data, horas, diaInteiro, motivo })}
          >
            Bloquear
          </button>
        </div>
      </div>
    </div>
  );
}

function GestaoSecao() {
  const doCatalogo = useServerFn(listarCatalogoAdmin);
  const doSalvarServico = useServerFn(salvarServico);
  const doRemoverServico = useServerFn(removerServico);
  const doSalvarBarbeiro = useServerFn(salvarBarbeiro);
  const doRemoverBarbeiro = useServerFn(removerBarbeiro);

  const { data, refetch } = useQuery({
    queryKey: ["admin-catalogo"],
    queryFn: () => doCatalogo(),
    refetchOnWindowFocus: false,
  });

  const servicos = (data?.servicos ?? []) as ServicoRow[];
  const barbeiros = (data?.barbeiros ?? []) as BarbeiroRow[];
  const [novoServico, setNovoServico] = useState(false);
  const [novoBarbeiro, setNovoBarbeiro] = useState(false);

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-[#1b1b1b] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-300">
            <Scissors className="h-4 w-4 text-amber-500" /> Serviços
          </h2>
          <button className={btn} onClick={() => setNovoServico((v) => !v)}>
            <span className="flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Novo
            </span>
          </button>
        </div>
        <div className="space-y-3">
          {novoServico && (
            <ServicoForm
              onSalvar={async (p) => {
                await doSalvarServico({ data: p });
                setNovoServico(false);
                refetch();
              }}
            />
          )}
          {servicos.map((s) => (
            <ServicoForm
              key={s.id}
              servico={s}
              onSalvar={async (p) => {
                await doSalvarServico({ data: p });
                refetch();
              }}
              onRemover={async () => {
                if (!confirm(`Remover "${s.nome}"?`)) return;
                await doRemoverServico({ data: { id: s.id } });
                refetch();
              }}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#1b1b1b] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-300">
            <Users className="h-4 w-4 text-amber-500" /> Barbeiros
          </h2>
          <button className={btn} onClick={() => setNovoBarbeiro((v) => !v)}>
            <span className="flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Novo
            </span>
          </button>
        </div>
        <div className="space-y-3">
          {novoBarbeiro && (
            <BarbeiroForm
              onSalvar={async (p) => {
                await doSalvarBarbeiro({ data: p });
                setNovoBarbeiro(false);
                refetch();
              }}
            />
          )}
          {barbeiros.map((b) => (
            <BarbeiroForm
              key={b.id}
              barbeiro={b}
              onSalvar={async (p) => {
                await doSalvarBarbeiro({ data: p });
                refetch();
              }}
              onRemover={async () => {
                if (!confirm(`Remover ${b.nome}?`)) return;
                await doRemoverBarbeiro({ data: { id: b.id } });
                refetch();
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicoForm({
  servico,
  onSalvar,
  onRemover,
}: {
  servico?: ServicoRow;
  onSalvar: (p: {
    id: string | null;
    nome: string;
    categoria: string;
    duracao_min: number;
    preco: number;
    descricao: string | null;
    ativo: boolean;
    ordem: number;
  }) => void;
  onRemover?: () => void;
}) {
  const [nome, setNome] = useState(servico?.nome ?? "");
  const [categoria, setCategoria] = useState(servico?.categoria ?? "Corte");
  const [duracao, setDuracao] = useState(String(servico?.duracao_min ?? 30));
  const [preco, setPreco] = useState(String(servico?.preco ?? 30));
  const [ativo, setAtivo] = useState(servico?.ativo ?? true);
  const [ordem, setOrdem] = useState(String(servico?.ordem ?? 99));

  return (
    <div className="space-y-2 rounded-md border border-white/10 p-3">
      <div className="grid grid-cols-2 gap-2">
        <input className={input} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" />
        <input
          className={input}
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          placeholder="Categoria"
        />
        <input
          className={input}
          type="number"
          value={duracao}
          onChange={(e) => setDuracao(e.target.value)}
          placeholder="Minutos"
        />
        <input
          className={input}
          type="number"
          step="0.01"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          placeholder="Preço"
        />
        <input
          className={input}
          type="number"
          value={ordem}
          onChange={(e) => setOrdem(e.target.value)}
          placeholder="Ordem"
        />
        <label className="flex items-center gap-2 text-xs text-stone-300">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          Ativo
        </label>
      </div>
      <div className="flex justify-end gap-2">
        {onRemover && (
          <button className={`${btn} hover:border-rose-500 hover:text-rose-400`} onClick={onRemover}>
            Remover
          </button>
        )}
        <button
          className={btnPrim}
          onClick={() =>
            onSalvar({
              id: servico?.id ?? null,
              nome,
              categoria,
              duracao_min: Number(duracao) || 30,
              preco: Number(preco) || 0,
              descricao: servico?.descricao ?? null,
              ativo,
              ordem: Number(ordem) || 0,
            })
          }
        >
          Salvar
        </button>
      </div>
    </div>
  );
}

function BarbeiroForm({
  barbeiro,
  onSalvar,
  onRemover,
}: {
  barbeiro?: BarbeiroRow;
  onSalvar: (p: {
    id: string | null;
    slug: string;
    nome: string;
    whatsapp: string;
    display: string;
    ativo: boolean;
  }) => void;
  onRemover?: () => void;
}) {
  const [slug, setSlug] = useState(barbeiro?.slug ?? "");
  const [nome, setNome] = useState(barbeiro?.nome ?? "");
  const [whatsapp, setWhatsapp] = useState(barbeiro?.whatsapp ?? "");
  const [display, setDisplay] = useState(barbeiro?.display ?? "");
  const [ativo, setAtivo] = useState(barbeiro?.ativo ?? true);

  return (
    <div className="space-y-2 rounded-md border border-white/10 p-3">
      <div className="grid grid-cols-2 gap-2">
        <input className={input} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" />
        <input
          className={input}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="apelido (ex.: victor)"
        />
        <input
          className={input}
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="5581999999999"
        />
        <input
          className={input}
          value={display}
          onChange={(e) => setDisplay(e.target.value)}
          placeholder="(81) 99999-9999"
        />
        <label className="flex items-center gap-2 text-xs text-stone-300">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          Ativo
        </label>
      </div>
      <div className="flex justify-end gap-2">
        {onRemover && (
          <button className={`${btn} hover:border-rose-500 hover:text-rose-400`} onClick={onRemover}>
            Remover
          </button>
        )}
        <button
          className={btnPrim}
          onClick={() =>
            onSalvar({
              id: barbeiro?.id ?? null,
              slug: slug.trim().toLowerCase(),
              nome,
              whatsapp,
              display,
              ativo,
            })
          }
        >
          Salvar
        </button>
      </div>
    </div>
  );
}
