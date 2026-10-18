import { duracaoServico } from "./duracao";
import { instanteAgendamento } from "./horarios";
import { precoDoServico } from "./painel";

export type AtendimentoFinanceiro = { data: string; hora: string; servico: string };

export function calcularFaturamento(atendimentos: AtendimentoFinanceiro[], agora = Date.now()) {
  const hoje = new Date(agora - 3 * 3600_000).toISOString().slice(0, 10);
  const segunda = new Date(`${hoje}T12:00:00Z`);
  segunda.setUTCDate(segunda.getUTCDate() - (segunda.getUTCDay() + 6) % 7);
  const inicioSemana = segunda.toISOString().slice(0, 10);
  const inicioMes = `${hoje.slice(0, 7)}-01`;
  const totais = { dia: 0, semana: 0, mes: 0 };
  for (const atendimento of atendimentos) {
    const fim = instanteAgendamento(atendimento.data, atendimento.hora) + duracaoServico(atendimento.servico) * 60_000;
    if (!Number.isFinite(fim) || fim > agora) continue;
    const preco = precoDoServico(atendimento.servico);
    if (atendimento.data === hoje) totais.dia += preco;
    if (atendimento.data >= inicioSemana && atendimento.data <= hoje) totais.semana += preco;
    if (atendimento.data >= inicioMes && atendimento.data <= hoje) totais.mes += preco;
  }
  return { ...totais, hoje, inicioSemana, inicioMes };
}