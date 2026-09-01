import { SERVICOS } from "@/lib/barbearia";

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
