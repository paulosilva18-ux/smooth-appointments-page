import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const slotsInput = z.object({
  barbeiro: z.string().min(1),
  data: z.string().min(1),
});

const criarInput = slotsInput.extend({
  nome: z.string().min(1).max(120),
  servico: z.string().min(1).max(160),
  hora: z.string().min(1).max(10),
  telefone: z.string().max(30).optional(),
});

const idsInput = z.object({
  ids: z.array(z.string().uuid()).max(50),
});

const idInput = z.object({
  id: z.string().uuid(),
});

const reagendarInput = idInput.extend({
  data: z.string().min(1),
  hora: z.string().min(1).max(10),
});

/** Bloqueios manuais do barbeiro convertidos em "reservas" de 30 min. */
async function bloqueiosComoReservas(barbeiro: string, dataDia: string) {
  const { db, bloqueios } = await import("@/lib/db.server");
  const { and, eq } = await import("drizzle-orm");
  const { turnosDoBarbeiro } = await import("@/lib/horarios");
  const { horaParaMinutos } = await import("@/lib/duracao");
  const lista = await db
    .select({ hora: bloqueios.hora })
    .from(bloqueios)
    .where(and(eq(bloqueios.barbeiro, barbeiro), eq(bloqueios.data, dataDia)));
  if (lista.some((r) => !r.hora)) {
    return turnosDoBarbeiro(barbeiro, dataDia).map(([a, b]) => ({
      hora: a, servico: `Bloqueado (${Math.max(1, horaParaMinutos(b) - horaParaMinutos(a))} min)`,
    }));
  }
  return lista
    .filter((r): r is { hora: string } => Boolean(r.hora))
    .map((r) => ({ hora: r.hora, servico: "Bloqueado (30 min)" }));
}

export const listarHorariosOcupados = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => slotsInput.parse(data))
  .handler(async ({ data }) => {
    const { db, agendamentos } = await import("@/lib/db.server");
    const { and, eq } = await import("drizzle-orm");
    const rows = await db
      .select({ hora: agendamentos.hora, servico: agendamentos.servico })
      .from(agendamentos)
      .where(and(eq(agendamentos.barbeiro, data.barbeiro), eq(agendamentos.data, data.data)));
    const reservas = rows.map((r) => ({ hora: r.hora, servico: r.servico ?? "" }));
    return [...reservas, ...(await bloqueiosComoReservas(data.barbeiro, data.data))];
  });

/** Verifica no servidor se o intervalo desejado conflita com outra reserva. */
async function existeConflito(
  barbeiro: string,
  dataDia: string,
  hora: string,
  servico: string,
  ignorarId?: string,
) {
  const { db, agendamentos } = await import("@/lib/db.server");
  const { and, eq, ne } = await import("drizzle-orm");
  const { horaParaMinutos, duracaoServico, horarioCabeNoTurno } = await import("@/lib/duracao");
  if (!horarioCabeNoTurno(barbeiro, dataDia, hora, duracaoServico(servico))) return true;
  const rows = await db
    .select({ id: agendamentos.id, hora: agendamentos.hora, servico: agendamentos.servico })
    .from(agendamentos)
    .where(
      and(
        eq(agendamentos.barbeiro, barbeiro),
        eq(agendamentos.data, dataDia),
        ignorarId ? ne(agendamentos.id, ignorarId) : undefined,
      ),
    );
  const bloqueios = await bloqueiosComoReservas(barbeiro, dataDia);
  const inicio = horaParaMinutos(hora);
  const dur = duracaoServico(servico);
  return [...rows, ...bloqueios].some((r) => {
    const i = horaParaMinutos(r.hora);
    const d = duracaoServico(r.servico ?? "");
    return inicio < i + d && i < inicio + dur;
  });
}

export const criarAgendamento = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => criarInput.parse(data))
  .handler(async ({ data }) => {
    const { db, agendamentos, ehConflito } = await import("@/lib/db.server");
    const { eq } = await import("drizzle-orm");
    if (await existeConflito(data.barbeiro, data.data, data.hora, data.servico)) {
      return { ok: false as const, motivo: "ocupado" as const };
    }
    let row: { id: string };
    try {
      const [inserido] = await db
        .insert(agendamentos)
        .values({
          nome: data.nome,
          servico: data.servico,
          barbeiro: data.barbeiro,
          data: data.data,
          hora: data.hora,
          telefone: data.telefone ?? null,
        })
        .returning({ id: agendamentos.id });
      row = inserido!;
    } catch (e) {
      if (ehConflito(e)) return { ok: false as const, motivo: "ocupado" as const };
      throw e;
    }

    let confirmacaoEnviada = false;
    if (data.telefone) {
      const { enviarWhatsApp } = await import("@/lib/whatsapp.server");
      const { mensagemConfirmacaoCliente } = await import("@/lib/notificacoes");
      const res = await enviarWhatsApp(
        data.telefone,
        mensagemConfirmacaoCliente({
          nome: data.nome,
          servico: data.servico,
          barbeiro: data.barbeiro,
          data: data.data,
          hora: data.hora,
        }),
      ).catch(() => ({ enviado: false }));
      confirmacaoEnviada = res.enviado;
      if (res.enviado) {
        await db
          .update(agendamentos)
          .set({ confirmacaoEnviadaEm: new Date().toISOString() })
          .where(eq(agendamentos.id, row.id));
      }
    }

    return { ok: true as const, id: row.id, confirmacaoEnviada };
  });

export const listarMeusAgendamentos = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => idsInput.parse(data))
  .handler(async ({ data }) => {
    if (data.ids.length === 0) return [];
    const { db, agendamentos } = await import("@/lib/db.server");
    const { asc, inArray } = await import("drizzle-orm");
    return db
      .select({
        id: agendamentos.id,
        nome: agendamentos.nome,
        servico: agendamentos.servico,
        barbeiro: agendamentos.barbeiro,
        data: agendamentos.data,
        hora: agendamentos.hora,
      })
      .from(agendamentos)
      .where(inArray(agendamentos.id, data.ids))
      .orderBy(asc(agendamentos.data), asc(agendamentos.hora));
  });

export const cancelarAgendamento = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data }) => {
    const { db, agendamentos } = await import("@/lib/db.server");
    const { eq } = await import("drizzle-orm");
    const { dentroDaJanela } = await import("@/lib/horarios");
    const [atual] = await db
      .select({ data: agendamentos.data, hora: agendamentos.hora })
      .from(agendamentos)
      .where(eq(agendamentos.id, data.id));
    if (!atual) return { ok: false as const, motivo: "inexistente" as const };
    if (!dentroDaJanela(atual.data, atual.hora)) {
      return { ok: false as const, motivo: "prazo" as const };
    }
    await db.delete(agendamentos).where(eq(agendamentos.id, data.id));
    return { ok: true as const };
  });

export const reagendarAgendamento = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => reagendarInput.parse(data))
  .handler(async ({ data }) => {
    const { db, agendamentos, ehConflito } = await import("@/lib/db.server");
    const { eq } = await import("drizzle-orm");
    const { dentroDaJanela } = await import("@/lib/horarios");
    const [atual] = await db
      .select({
        data: agendamentos.data,
        hora: agendamentos.hora,
        servico: agendamentos.servico,
        barbeiro: agendamentos.barbeiro,
      })
      .from(agendamentos)
      .where(eq(agendamentos.id, data.id));
    if (!atual) return { ok: false as const, motivo: "inexistente" as const };
    if (!dentroDaJanela(atual.data, atual.hora) || !dentroDaJanela(data.data, data.hora)) {
      return { ok: false as const, motivo: "prazo" as const };
    }
    if (
      await existeConflito(atual.barbeiro, data.data, data.hora, atual.servico ?? "", data.id)
    ) {
      return { ok: false as const, motivo: "ocupado" as const };
    }
    let row;
    try {
      [row] = await db
        .update(agendamentos)
        .set({ data: data.data, hora: data.hora })
        .where(eq(agendamentos.id, data.id))
        .returning({
          id: agendamentos.id,
          nome: agendamentos.nome,
          servico: agendamentos.servico,
          barbeiro: agendamentos.barbeiro,
          data: agendamentos.data,
          hora: agendamentos.hora,
        });
    } catch (e) {
      if (ehConflito(e)) return { ok: false as const, motivo: "ocupado" as const };
      throw e;
    }
    if (!row) return { ok: false as const, motivo: "inexistente" as const };
    return { ok: true as const, agendamento: row };
  });
