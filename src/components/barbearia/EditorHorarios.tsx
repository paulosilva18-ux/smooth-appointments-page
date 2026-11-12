import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Plus, RotateCcw, Save, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHorarios } from "@/lib/useHorarios";
import { salvarHorarios, restaurarHorarios } from "@/lib/agenda-horarios.functions";
import {
  configuracaoDoBarbeiro,
  datasEspeciais,
  gradeDosTurnos,
  semanaDoBarbeiro,
} from "@/lib/horarios";
import { horarioEditadoSchema, type Turno } from "@/lib/agenda-config";
import { duracaoServico, horariosBloqueados } from "@/lib/duracao";
import { formatarData } from "@/lib/painel";

const dias = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
const campo =
  "min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
type Reserva = { data: string; hora: string; servico: string };
type Config = {
  chave: string;
  turnos: Turno[];
  ultimo_inicio: string | null;
  extras: string[];
  retirados: string[];
};

export function EditorHorarios({
  slug,
  nome,
  reservas,
}: {
  slug: "fabricio" | "victor";
  nome: string;
  reservas: Reserva[];
}) {
  const horarios = useHorarios();
  const [modo, setModo] = useState("data");
  const [data, setData] = useState(() =>
    new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10),
  );
  const [dia, setDia] = useState("1");
  const config =
    modo === "data"
      ? { chave: data, ...configuracaoDoBarbeiro(nome, data, horarios.data) }
      : semanaDoBarbeiro(nome, horarios.data)[Number(dia)];
  return (
    <section aria-label={`Horários de ${nome}`} className="space-y-5 text-foreground">
      <h2 className="flex items-center gap-2 text-xl">
        <Clock className="size-5 text-primary" /> Meus horários · {nome}
      </h2>
      <div className="flex flex-wrap items-end gap-4">
        <Tabs value={modo} onValueChange={setModo}>
          <TabsList>
            <TabsTrigger value="data">Uma data</TabsTrigger>
            <TabsTrigger value="semana">Semana padrão</TabsTrigger>
          </TabsList>
        </Tabs>
        {modo === "data" ? (
          <label className="grid gap-1 text-sm text-muted-foreground">
            Data
            <input
              aria-label="Data dos horários"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className={campo}
            />
          </label>
        ) : (
          <label className="grid gap-1 text-sm text-muted-foreground">
            Dia da semana
            <select
              aria-label="Dia da semana"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
              className={campo}
            >
              {dias.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {modo === "data" && (
        <div className="flex flex-wrap gap-2">
          {datasEspeciais(nome, horarios.data)
            .filter((d) => d >= new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10))
            .map((d) => (
              <Button
                key={d}
                variant={d === data ? "secondary" : "outline"}
                size="sm"
                onClick={() => setData(d)}
              >
                {formatarData(d)}
              </Button>
            ))}
        </div>
      )}
      {horarios.isPending ? (
        <p className="text-muted-foreground">Carregando horários…</p>
      ) : horarios.isError ? (
        <p role="alert" className="text-destructive">
          Não foi possível consultar os horários.{" "}
          <Button variant="link" onClick={() => horarios.refetch()}>
            Tentar novamente
          </Button>
        </p>
      ) : (
        config &&
        (modo !== "data" || /^\d{4}-\d{2}-\d{2}$/.test(data)) && (
          <Edicao
            key={`${slug}:${config.chave}`}
            slug={slug}
            config={config}
            reservas={modo === "data" ? reservas.filter((r) => r.data === data) : []}
            porData={modo === "data"}
            editado={
              horarios.data?.some((h) => h.slug === slug && h.chave === config.chave) ?? false
            }
          />
        )
      )}
    </section>
  );
}

function Edicao({
  slug,
  config,
  reservas,
  porData,
  editado,
}: {
  slug: "fabricio" | "victor";
  config: Config;
  reservas: Reserva[];
  porData: boolean;
  editado: boolean;
}) {
  const salvar = useServerFn(salvarHorarios);
  const restaurar = useServerFn(restaurarHorarios);
  const qc = useQueryClient();
  const [turnos, setTurnos] = useState<Turno[]>(config.turnos.map(([a, b]) => [a, b]));
  const [inclusivo, setInclusivo] = useState(config.ultimo_inicio !== null);
  const [extras, setExtras] = useState(config.extras);
  const [retirados, setRetirados] = useState(config.retirados);
  const [novaHora, setNovaHora] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);
  const assinatura = JSON.stringify(config);
  useEffect(() => {
    const atual = JSON.parse(assinatura) as Config;
    setTurnos(atual.turnos);
    setInclusivo(atual.ultimo_inicio !== null);
    setExtras(atual.extras);
    setRetirados(atual.retirados);
  }, [assinatura]);
  const grade = [
    ...new Set([
      ...gradeDosTurnos(turnos),
      ...extras,
      ...retirados,
      ...reservas.map((r) => r.hora),
    ]),
  ].sort();
  const reservados = horariosBloqueados(grade, reservas, 30);
  const payload = {
    chave: config.chave,
    turnos,
    ultimo_inicio: inclusivo ? (turnos[turnos.length - 1]?.[1] ?? null) : null,
    extras,
    retirados,
  };
  async function gravar() {
    const validado = horarioEditadoSchema.safeParse(payload);
    if (!validado.success) {
      setErro(true);
      setMensagem(validado.error.issues[0]?.message ?? "Confira os horários.");
      return;
    }
    setOcupado(true);
    setErro(false);
    setMensagem("");
    try {
      const result = await salvar({ data: { slug, horario: validado.data } });
      await qc.invalidateQueries({ queryKey: ["horarios-barbeiros"] });
      setMensagem(
        result.foraDoHorario
          ? `Horários salvos. ${result.foraDoHorario} reserva(s) existente(s) fora do novo expediente foram mantidas.`
          : "Horários salvos. Agendamentos existentes preservados.",
      );
    } catch {
      setErro(true);
      setMensagem("Não foi possível salvar os horários. Tente novamente.");
    } finally {
      setOcupado(false);
    }
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <h3 className="text-lg">Turnos de atendimento</h3>
        <Button
          variant="outline"
          size="sm"
          disabled={turnos.length >= 4 || ocupado}
          onClick={() => setTurnos([...turnos, ["", ""]])}
        >
          <Plus />
          Adicionar turno
        </Button>
      </div>
      <div className="space-y-3">
        {turnos.length === 0 && <p className="text-muted-foreground">Fechado</p>}
        {turnos.map(([a, b], i) => (
          <div key={i} className="flex flex-wrap items-end gap-3">
            <label className="grid min-w-0 gap-1 text-sm text-muted-foreground">
              Início
              <input
                type="time"
                aria-label={`Início do turno ${i + 1}`}
                value={a}
                className={campo}
                onChange={(e) =>
                  setTurnos(turnos.map((t, n) => (n === i ? [e.target.value, t[1]] : t)))
                }
              />
            </label>
            <label className="grid min-w-0 gap-1 text-sm text-muted-foreground">
              Fim
              <input
                type="time"
                aria-label={`Fim do turno ${i + 1}`}
                value={b}
                className={campo}
                onChange={(e) =>
                  setTurnos(turnos.map((t, n) => (n === i ? [t[0], e.target.value] : t)))
                }
              />
            </label>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Retirar turno ${i + 1}`}
              title={`Retirar turno ${i + 1}`}
              disabled={ocupado}
              onClick={() => setTurnos(turnos.filter((_, n) => n !== i))}
            >
              <Trash2 className="text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      {turnos.length > 0 && (
        <label className="flex flex-wrap items-center gap-3 text-sm">
          <Switch
            checked={inclusivo}
            onCheckedChange={setInclusivo}
            disabled={ocupado}
            aria-label="Permitir início no fim do último turno"
          />{" "}
          Liberar início às {turnos[turnos.length - 1]?.[1]}
          {inclusivo && <span className="text-muted-foreground">(pode terminar depois)</span>}
        </label>
      )}
      {porData && (
        <>
          <div className="flex flex-wrap items-end gap-3 border-t border-border pt-5">
            <label className="grid gap-1 text-sm text-muted-foreground">
              Vaga extra
              <input
                aria-label="Horário extra"
                type="time"
                value={novaHora}
                onChange={(e) => setNovaHora(e.target.value)}
                className={campo}
              />
            </label>
            <Button
              variant="outline"
              disabled={
                !novaHora || ocupado || horariosBloqueados([novaHora], reservas, 30).length > 0
              }
              onClick={() => {
                setExtras([...new Set([...extras, novaHora])].sort());
                setRetirados(retirados.filter((h) => h !== novaHora));
                setNovaHora("");
              }}
            >
              <Plus /> Adicionar horário
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-3">Horário</th>
                  <th className="py-3">Situação</th>
                  <th className="py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {grade.map((h) => {
                  const reservado = reservados.includes(h);
                  const retirado = retirados.includes(h);
                  const extra = extras.includes(h);
                  return (
                    <tr key={h} className="border-b border-border">
                      <td
                        className={`py-2 font-medium ${retirado ? "text-muted-foreground line-through" : "text-foreground"}`}
                      >
                        {h}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {reservado
                          ? "Reservado"
                          : retirado
                            ? "Retirado"
                            : extra
                              ? "Vaga extra"
                              : "No turno"}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={reservado || ocupado}
                          aria-label={`${retirado ? "Liberar" : "Retirar"} horário ${h}`}
                          title={
                            reservado
                              ? `Reservado por ${duracaoServico(reservas.find((r) => r.hora === h)?.servico ?? "")} min`
                              : retirado
                                ? `Liberar ${h}`
                                : `Retirar ${h}`
                          }
                          onClick={() => {
                            if (retirado) setRetirados(retirados.filter((t) => t !== h));
                            else if (extra) setExtras(extras.filter((t) => t !== h));
                            else setRetirados([...retirados, h]);
                          }}
                        >
                          {retirado ? <Undo2 /> : <Trash2 className="text-destructive" />}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {retirados.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Horários retirados bloqueiam 30 minutos. Reservas existentes não são canceladas.
            </p>
          )}
        </>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Button disabled={ocupado} onClick={gravar}>
          <Save />
          {ocupado ? "Salvando…" : "Salvar horários"}
        </Button>
        {editado && (
          <Button
            variant="outline"
            disabled={ocupado}
            onClick={async () => {
              if (
                !window.confirm(
                  "Restaurar os horários anteriores? As reservas existentes serão mantidas.",
                )
              )
                return;
              setOcupado(true);
              try {
                await restaurar({ data: { slug, chave: config.chave } });
                await qc.invalidateQueries({ queryKey: ["horarios-barbeiros"] });
              } catch {
                setErro(true);
                setMensagem("Não foi possível restaurar os horários.");
              } finally {
                setOcupado(false);
              }
            }}
          >
            <RotateCcw />
            Restaurar padrão
          </Button>
        )}
      </div>
      {mensagem && (
        <p
          role={erro ? "alert" : "status"}
          className={erro ? "text-sm text-destructive" : "text-sm text-primary"}
        >
          {mensagem}
        </p>
      )}
    </div>
  );
}
