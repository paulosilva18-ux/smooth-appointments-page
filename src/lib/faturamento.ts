import { duracaoServico } from "./duracao";
import { instanteAgendamento } from "./horarios";
import { precoDoServicoEmCentavos } from "./painel";

export type AtendimentoFinanceiro = { data: string; hora: string; servico: string };
export type PeriodoFaturamento = "dia" | "semana" | "mes" | "total";
export type ReceitaServico = { servico: string; quantidade: number; centavos: number };

export function nomeServicoFinanceiro(servico: string) {
  return servico.replace(/\s*\([^()]*R\$[^()]*\)\s*$/, "").trim() || servico;
}

export function calcularFaturamento(atendimentos: AtendimentoFinanceiro[], agora = Date.now()) {
  const hoje = new Date(agora - 3 * 3600_000).toISOString().slice(0, 10);
  const segunda = new Date(`${hoje}T12:00:00Z`);
  segunda.setUTCDate(segunda.getUTCDate() - (segunda.getUTCDay() + 6) % 7);
  const inicioSemana = segunda.toISOString().slice(0, 10);
  const inicioMes = `${hoje.slice(0, 7)}-01`;
  const totais = { dia: 0, semana: 0, mes: 0, total: 0 };
  const grupos: Record<PeriodoFaturamento, Map<string, ReceitaServico>> = {
    dia: new Map(), semana: new Map(), mes: new Map(), total: new Map(),
  };
  const semPreco = { dia: 0, semana: 0, mes: 0, total: 0 };
  for (const atendimento of atendimentos) {
    const fim = instanteAgendamento(atendimento.data, atendimento.hora) + duracaoServico(atendimento.servico) * 60_000;
    if (!Number.isFinite(fim) || fim > agora) continue;
    const centavos = precoDoServicoEmCentavos(atendimento.servico);
    const periodos: PeriodoFaturamento[] = ["total"];
    if (atendimento.data === hoje) periodos.push("dia");
    if (atendimento.data >= inicioSemana && atendimento.data <= hoje) periodos.push("semana");
    if (atendimento.data >= inicioMes && atendimento.data <= hoje) periodos.push("mes");
    for (const periodo of periodos) {
      if (centavos === null) { semPreco[periodo] += 1; continue; }
      totais[periodo] += centavos;
      const servico = nomeServicoFinanceiro(atendimento.servico);
      const chave = servico.toLocaleLowerCase("pt-BR");
      const grupo = grupos[periodo].get(chave) ?? { servico, quantidade: 0, centavos: 0 };
      grupo.quantidade += 1;
      grupo.centavos += centavos;
      grupos[periodo].set(chave, grupo);
    }
  }
  const ordenar = (periodo: PeriodoFaturamento) => [...grupos[periodo].values()].sort((a, b) => b.centavos - a.centavos || a.servico.localeCompare(b.servico, "pt-BR"));
  return {
    dia: totais.dia / 100, semana: totais.semana / 100, mes: totais.mes / 100, total: totais.total / 100,
    centavos: totais, semPreco, hoje, inicioSemana, inicioMes,
    porServico: { dia: ordenar("dia"), semana: ordenar("semana"), mes: ordenar("mes"), total: ordenar("total") },
  };
}