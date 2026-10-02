import { SERVICOS } from "@/lib/barbearia";
import { turnosDoBarbeiro } from "@/lib/horarios";

/** Converte textos como "1 h 30 min" ou "40 min" em minutos. */
export function minutosDeTexto(texto: string): number {
  const horas = /(\d+)\s*h/i.exec(texto);
  const mins = /(\d+)\s*min/i.exec(texto);
  const total = (horas ? Number(horas[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0);
  return total > 0 ? total : 0;
}

/**
 * Duração (minutos) de um serviço. Aceita tanto o nome puro ("Corte")
 * quanto o texto salvo no banco ("Corte (40 min · R$ 30)").
 */
export function duracaoServico(servico: string): number {
  // O texto entre parênteses é a duração escolhida quando a reserva foi feita.
  // Alterações posteriores no catálogo não devem alterar reservas existentes.
  const detalhe = servico.match(/\(([^)]*)\)/)?.[1];
  const duracaoSalva = detalhe ? minutosDeTexto(detalhe) : 0;
  if (duracaoSalva > 0) return duracaoSalva;
  const nome = servico.split("(")[0]!.trim().toLowerCase();
  const exato = SERVICOS.find((s) => s.nome.toLowerCase() === nome);
  if (exato) return minutosDeTexto(exato.tempo) || 30;
  const doTexto = minutosDeTexto(servico);
  if (doTexto > 0) return doTexto;
  return 30;
}

export function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(":");
  return Number(h) * 60 + Number(m ?? 0);
}

export type Reserva = { hora: string; servico: string };

export function minutosParaHora(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

export function horarioCabeNoTurno(barbeiro: string, data: string, hora: string, duracao: number): boolean {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora) || !Number.isFinite(duracao) || duracao <= 0) return false;
  const inicio = horaParaMinutos(hora);
  return turnosDoBarbeiro(barbeiro, data).some(([a, b]) =>
    inicio >= horaParaMinutos(a) && inicio + duracao <= horaParaMinutos(b),
  );
}

/** Grade regular mais os términos exatos dos atendimentos, sempre dentro do turno. */
export function horariosDisponiveis(
  barbeiro: string,
  data: string,
  reservas: Reserva[],
  duracao: number,
): string[] {
  const turnos = turnosDoBarbeiro(barbeiro, data);
  const candidatos = new Set<number>();
  for (const [a, b] of turnos) {
    for (let minuto = horaParaMinutos(a); minuto < horaParaMinutos(b); minuto += 30) {
      candidatos.add(minuto);
    }
  }
  for (const reserva of reservas) {
    const fim = horaParaMinutos(reserva.hora) + duracaoServico(reserva.servico);
    if (Number.isFinite(fim)) candidatos.add(fim);
  }
  return [...candidatos].sort((a, b) => a - b).map(minutosParaHora).filter((hora) =>
    horarioCabeNoTurno(barbeiro, data, hora, duracao) &&
    !reservas.some((r) => conflita(horaParaMinutos(hora), duracao, horaParaMinutos(r.hora), duracaoServico(r.servico))),
  );
}

function conflita(inicioA: number, durA: number, inicioB: number, durB: number) {
  return inicioA < inicioB + durB && inicioB < inicioA + durA;
}

/**
 * Retorna todos os horários da grade que ficam indisponíveis, considerando
 * a duração dos serviços já reservados e a duração do serviço escolhido.
 */
export function horariosBloqueados(
  horarios: string[],
  reservas: Reserva[],
  duracaoNova: number,
): string[] {
  const ocupacoes = reservas.map((r) => ({
    inicio: horaParaMinutos(r.hora),
    dur: duracaoServico(r.servico),
  }));
  return horarios.filter((h) => {
    const inicio = horaParaMinutos(h);
    return ocupacoes.some((o) => conflita(inicio, duracaoNova, o.inicio, o.dur));
  });
}
