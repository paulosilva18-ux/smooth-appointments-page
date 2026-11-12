// Acesso ao Netlify Database (somente no servidor).
export { db, agendamentos, bloqueios, servicos, barbeiros } from "../../db/index";

/** Código SQLSTATE do Postgres, mesmo quando o erro vem embrulhado pelo Drizzle. */
export function codigoErro(e: unknown): string | undefined {
  let atual: unknown = e;
  for (let i = 0; i < 4 && atual && typeof atual === "object"; i++) {
    const code = (atual as { code?: unknown }).code;
    if (typeof code === "string") return code;
    atual = (atual as { cause?: unknown }).cause;
  }
  return undefined;
}

/** Conflito de horário (índice único ou gatilho de sobreposição). */
export function ehConflito(e: unknown): boolean {
  return codigoErro(e) === "23505";
}

import { agendamentos as ag } from "../../db/index";

/** Colunas de agendamento no formato usado pelos painéis. */
export const colunasAgendamento = {
  id: ag.id,
  nome: ag.nome,
  telefone: ag.telefone,
  servico: ag.servico,
  barbeiro: ag.barbeiro,
  data: ag.data,
  hora: ag.hora,
  created_at: ag.createdAt,
};
