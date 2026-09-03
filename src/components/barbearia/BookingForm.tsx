import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SERVICOS, BARBEIROS } from "@/lib/barbearia";
import { useCatalogo } from "@/lib/useCatalogo";
import { horariosDoBarbeiro, salvarId, POLITICA_CANCELAMENTO } from "@/lib/horarios";
import {
  criarAgendamento,
  listarHorariosOcupados,
} from "@/lib/agendamentos.functions";
import { linkWhatsApp } from "@/lib/notificacoes";
import { duracaoServico, horariosBloqueados, type Reserva } from "@/lib/duracao";



const fieldClass =
  "w-full rounded-sm border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground";

export function BookingForm({
  compact = false,
  onReservado,
}: {
  compact?: boolean;
  onReservado?: () => void;
}) {

  const catalogo = useCatalogo();
  const servicos = catalogo.servicos.length ? catalogo.servicos : SERVICOS;
  const barbeiros = catalogo.barbeiros.length ? catalogo.barbeiros : BARBEIROS;

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servico, setServico] = useState<string>(SERVICOS[0]!.nome);
  const [barbeiro, setBarbeiro] = useState<string>(BARBEIROS[0]!.nome);

  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);


  const buscarOcupados = useServerFn(listarHorariosOcupados);
  const agendar = useServerFn(criarAgendamento);

  const selecionado = servicos.find((s) => s.nome === servico);
  const profissional = barbeiros.find((b) => b.nome === barbeiro) ?? barbeiros[0]!;

  useEffect(() => {
    if (!data) {
      setReservas([]);
      return;
    }
    let ativo = true;
    setCarregando(true);
    buscarOcupados({ data: { barbeiro, data } })
      .then((res) => {
        if (ativo) setReservas(res);
      })
      .catch(() => {
        if (ativo) setReservas([]);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [barbeiro, data, buscarOcupados]);

  const horarios = horariosDoBarbeiro(profissional.nome);
  const duracao = duracaoServico(selecionado?.nome ?? servico);
  const ocupados = horariosBloqueados(horarios, reservas, duracao);
  const livres = horarios.filter((h) => !ocupados.includes(h));

  useEffect(() => {
    if (hora && ocupados.includes(hora)) setHora("");
  }, [ocupados, hora]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hora) {
      setMensagem("Escolha um horário disponível.");
      return;
    }
    setEnviando(true);
    setMensagem(null);
    try {
      const detalhe = selecionado
        ? `${selecionado.nome} (${selecionado.tempo} · ${selecionado.preco})`
        : servico;
      const res = await agendar({
        data: { nome, telefone, servico: detalhe, barbeiro: profissional.nome, data, hora },
      });
      if (!res.ok) {
        setMensagem("Esse horário conflita com outra reserva. Escolha outro.");
        setHora("");
        try {
          setReservas(await buscarOcupados({ data: { barbeiro: profissional.nome, data } }));
        } catch {
          /* mantém a grade atual */
        }
        return;
      }
      setReservas((prev) => [...prev, { hora, servico: detalhe }]);
      salvarId(res.id);
      onReservado?.();
      setAviso(
        linkWhatsApp("reserva", {
          nome,
          servico: detalhe,
          barbeiro: profissional.nome,
          data,
          hora,
        }),
      );
      setHora("");
      setMensagem(
        res.confirmacaoEnviada
          ? "Agendamento confirmado! Enviamos a confirmação no seu WhatsApp e vamos lembrar você 1h30 antes."
          : "Agendamento confirmado e horário bloqueado. Não precisa aguardar retorno do barbeiro.",
      );



    } catch {
      setMensagem("Não foi possível reservar agora. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-5" : "space-y-6"}>
      <div>
        <label className={labelClass} htmlFor="nome">
          Seu nome
        </label>
        <input
          id="nome"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Como podemos te chamar?"
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="servico">
          Serviço
        </label>
        <select
          id="servico"
          value={servico}
          onChange={(e) => setServico(e.target.value)}
          className={fieldClass}
        >
          {servicos.map((s) => (
            <option key={s.nome} value={s.nome}>
              {s.nome} — {s.tempo} · {s.preco}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className={labelClass}>Barbeiro</span>
        <div className="flex flex-wrap gap-2">
          {barbeiros.map((b) => (
            <button
              key={b.nome}
              type="button"
              onClick={() => setBarbeiro(b.nome)}
              className={`rounded-sm border px-4 py-2 text-sm transition-colors ${
                barbeiro === b.nome
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-muted-foreground hover:border-primary hover:text-foreground"
              }`}
            >
              {b.nome}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="data">
          Data
        </label>
        <input
          id="data"
          type="date"
          required
          value={data}
          onChange={(e) => setData(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <span className={labelClass}>
          Horário {carregando && <span className="normal-case">· verificando…</span>}
        </span>
        {!data ? (
          <p className="text-sm text-muted-foreground">Escolha a data para ver os horários livres.</p>
        ) : livres.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum horário livre com {profissional.nome} nesta data.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {horarios.map((h) => {
              const bloqueado = ocupados.includes(h);
              return (
                <button
                  key={h}
                  type="button"
                  disabled={bloqueado || carregando}
                  onClick={() => setHora(h)}
                  className={`rounded-sm border px-2 py-2 text-sm transition-colors ${
                    bloqueado
                      ? "cursor-not-allowed border-border/50 bg-secondary/40 text-muted-foreground/50 line-through"
                      : hora === h
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary text-muted-foreground hover:border-primary hover:text-foreground"
                  }`}
                >
                  {h}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-sm border border-border bg-secondary/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Política de cancelamento
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {POLITICA_CANCELAMENTO} Ao confirmar, você concorda com essa regra.
        </p>
      </div>

      <button
        type="submit"
        disabled={enviando || !hora}
        className="w-full rounded-sm bg-primary px-6 py-4 text-sm font-bold uppercase tracking-[0.25em] text-primary-foreground transition-transform hover:scale-[1.01] active:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ boxShadow: "var(--shadow-brass)" }}
      >
        {enviando ? "Reservando…" : "Confirmar agendamento"}
      </button>

      {aviso && (
        <a
          href={aviso}
          target="_blank"
          rel="noopener"
          className="block rounded-sm border border-primary px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Enviar confirmação no WhatsApp
        </a>
      )}

      <p className="text-center text-xs text-muted-foreground">

        {mensagem ??
          `Reservado, o horário e os ${duracao} min do serviço ficam bloqueados na agenda.`}
      </p>
    </form>
  );
}
