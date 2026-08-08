import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BARBEIROS } from "@/lib/barbearia";
import {
  HORARIOS,
  lidosIds,
  removerId,
  dentroDaJanela,
  POLITICA_CANCELAMENTO,
  JANELA_CANCELAMENTO_HORAS,
} from "@/lib/horarios";
import {
  cancelarAgendamento,
  listarHorariosOcupados,
  listarMeusAgendamentos,
  reagendarAgendamento,
} from "@/lib/agendamentos.functions";
import { avisarWhatsApp, linkWhatsApp } from "@/lib/notificacoes";


type Agendamento = {
  id: string;
  nome: string;
  servico: string;
  barbeiro: string;
  data: string;
  hora: string;
};

const fieldClass =
  "w-full rounded-sm border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary";

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : iso;
}

export function MyBookings({ recarregar = 0 }: { recarregar?: number }) {
  const [itens, setItens] = useState<Agendamento[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [novaData, setNovaData] = useState("");
  const [novaHora, setNovaHora] = useState("");
  const [ocupados, setOcupados] = useState<string[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ url: string; label: string } | null>(null);


  const buscar = useServerFn(listarMeusAgendamentos);
  const cancelar = useServerFn(cancelarAgendamento);
  const reagendar = useServerFn(reagendarAgendamento);
  const buscarOcupados = useServerFn(listarHorariosOcupados);

  const carregar = useCallback(async () => {
    const ids = lidosIds();
    if (ids.length === 0) {
      setItens([]);
      return;
    }
    try {
      const res = await buscar({ data: { ids } });
      setItens(res);
      const vivos = new Set(res.map((r) => r.id));
      ids.filter((id) => !vivos.has(id)).forEach(removerId);
    } catch {
      setItens([]);
    }
  }, [buscar]);

  useEffect(() => {
    void carregar();
  }, [carregar, recarregar]);

  const item = itens.find((i) => i.id === editando);

  useEffect(() => {
    if (!item || !novaData) {
      setOcupados([]);
      return;
    }
    let ativo = true;
    buscarOcupados({ data: { barbeiro: item.barbeiro, data: novaData } })
      .then((res) => {
        if (ativo) setOcupados(res.filter((h) => !(novaData === item.data && h === item.hora)));
      })
      .catch(() => ativo && setOcupados([]));
    return () => {
      ativo = false;
    };
  }, [item, novaData, buscarOcupados]);

  const abrirEdicao = (a: Agendamento) => {
    setEditando(a.id);
    setNovaData(a.data);
    setNovaHora(a.hora);
    setMensagem(null);
  };

  const foraDoPrazoMsg = `Prazo encerrado: só é possível alterar até ${JANELA_CANCELAMENTO_HORAS} h antes. Fale com o barbeiro no WhatsApp.`;

  const handleCancelar = async (a: Agendamento) => {
    if (!dentroDaJanela(a.data, a.hora)) {
      setMensagem(foraDoPrazoMsg);
      return;
    }
    if (!window.confirm(`Cancelar o horário de ${formatarData(a.data)} às ${a.hora}?`)) return;
    setOcupado(true);
    try {
      const res = await cancelar({ data: { id: a.id } });
      if (!res.ok) {
        setMensagem(res.motivo === "prazo" ? foraDoPrazoMsg : "Esse agendamento não existe mais.");
        return;
      }
      removerId(a.id);
      setItens((prev) => prev.filter((i) => i.id !== a.id));
      setMensagem("Agendamento cancelado. O horário voltou a ficar livre.");
    } catch {
      setMensagem("Não foi possível cancelar agora. Tente novamente.");
    } finally {
      setOcupado(false);
    }
  };

  const handleReagendar = async () => {
    if (!item || !novaData || !novaHora) return;
    if (!dentroDaJanela(novaData, novaHora)) {
      setMensagem(`Escolha um horário com pelo menos ${JANELA_CANCELAMENTO_HORAS} h de antecedência.`);
      return;
    }
    setOcupado(true);
    setMensagem(null);
    try {
      const res = await reagendar({ data: { id: item.id, data: novaData, hora: novaHora } });
      if (!res.ok) {
        setMensagem(
          res.motivo === "ocupado"
            ? "Esse horário já está reservado. Escolha outro."
            : res.motivo === "prazo"
              ? foraDoPrazoMsg
              : "Esse agendamento não existe mais.",
        );
        return;
      }
      setItens((prev) => prev.map((i) => (i.id === item.id ? res.agendamento : i)));
      setEditando(null);
      setMensagem("Horário remarcado com sucesso.");
    } catch {
      setMensagem("Não foi possível remarcar agora. Tente novamente.");
    } finally {
      setOcupado(false);
    }
  };

  if (itens.length === 0) return null;

  return (
    <div className="mt-12 border border-border bg-secondary/30 p-6">
      <p className="eyebrow">Seus horários</p>
      <h3 className="text-display mt-1 mb-2 text-2xl">Cancelar ou remarcar</h3>
      <p className="mb-5 text-xs leading-relaxed text-muted-foreground">{POLITICA_CANCELAMENTO}</p>

      <ul className="space-y-3">
        {itens.map((a) => {
          const prof = BARBEIROS.find((b) => b.nome === a.barbeiro);
          const alteravel = dentroDaJanela(a.data, a.hora);
          return (
            <li key={a.id} className="border border-border bg-background/40 p-4">
              <p className="text-sm font-semibold text-foreground">
                {formatarData(a.data)} · {a.hora}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {a.servico} — com {prof?.nome ?? a.barbeiro}
              </p>

              {editando === a.id ? (
                <div className="mt-4 space-y-3">
                  <input
                    type="date"
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className={fieldClass}
                    aria-label="Nova data"
                  />
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {HORARIOS.map((h) => {
                      const bloqueado =
                        ocupados.includes(h) || (!!novaData && !dentroDaJanela(novaData, h));
                      return (
                        <button
                          key={h}
                          type="button"
                          disabled={bloqueado}
                          onClick={() => setNovaHora(h)}
                          className={`rounded-sm border px-2 py-2 text-sm transition-colors ${
                            bloqueado
                              ? "cursor-not-allowed border-border/50 bg-secondary/40 text-muted-foreground/50 line-through"
                              : novaHora === h
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-secondary text-muted-foreground hover:border-primary hover:text-foreground"
                          }`}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={ocupado || !novaHora || !novaData}
                      onClick={handleReagendar}
                      className="flex-1 rounded-sm bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-50"
                    >
                      {ocupado ? "Salvando…" : "Confirmar novo horário"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditando(null)}
                      className="rounded-sm border border-border px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:border-primary hover:text-foreground"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!alteravel}
                    onClick={() => abrirEdicao(a)}
                    className="rounded-sm border border-primary px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-primary"
                  >
                    Remarcar
                  </button>
                  <button
                    type="button"
                    disabled={ocupado || !alteravel}
                    onClick={() => handleCancelar(a)}
                    className="rounded-sm border border-border px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                  {!alteravel && (
                    <span className="text-xs text-muted-foreground">
                      Prazo de {JANELA_CANCELAMENTO_HORAS} h encerrado — fale no WhatsApp.
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {mensagem && <p className="mt-4 text-center text-xs text-muted-foreground">{mensagem}</p>}
    </div>
  );
}
