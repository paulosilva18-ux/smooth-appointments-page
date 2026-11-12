import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const loginInput = z.object({
  slug: z.string().min(1).max(20),
  senha: z.string().min(1).max(200),
});

const slugInput = z.object({
  slug: z.string().min(1).max(20),
});

const acaoInput = slugInput.extend({
  id: z.string().uuid(),
});

const remarcarInput = acaoInput.extend({
  data: z.string().min(1).max(10),
  hora: z.string().min(1).max(10),
});

export const entrarPainel = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => loginInput.parse(data))
  .handler(async ({ data }) => {
    const { SLUG_SENHA, senhaConfere, sessaoPainel } = await import("@/lib/painel.server");
    const envName = SLUG_SENHA[data.slug];
    if (!envName) return { ok: false as const };
    const esperada = process.env[envName];
    if (!esperada || !senhaConfere(data.senha, esperada)) return { ok: false as const };
    const sess = await sessaoPainel();
    await sess.update({ barbeiro: data.slug });
    return { ok: true as const };
  });

export const sairPainel = createServerFn({ method: "POST" }).handler(async () => {
  const { sessaoPainel } = await import("@/lib/painel.server");
  const sess = await sessaoPainel();
  await sess.clear();
  return { ok: true as const };
});

export const statusPainel = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => slugInput.parse(data))
  .handler(async ({ data }) => {
    const { sessaoPainel } = await import("@/lib/painel.server");
    const sess = await sessaoPainel();
    return { autenticado: sess.data.barbeiro === data.slug };
  });

export const agendaDoBarbeiro = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => slugInput.parse(data))
  .handler(async ({ data }) => {
    const { exigirBarbeiro } = await import("@/lib/painel.server");
    const nome = await exigirBarbeiro(data.slug);
    const { db, agendamentos: ag, colunasAgendamento } = await import("@/lib/db.server");
    const { asc, eq } = await import("drizzle-orm");
    const rows = await db
      .select(colunasAgendamento)
      .from(ag)
      .where(eq(ag.barbeiro, nome))
      .orderBy(asc(ag.data), asc(ag.hora));
    return { nome, agendamentos: rows };
  });

export const cancelarComoBarbeiro = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => acaoInput.parse(data))
  .handler(async ({ data }) => {
    const { exigirBarbeiro } = await import("@/lib/painel.server");
    const nome = await exigirBarbeiro(data.slug);
    const { db, agendamentos: ag } = await import("@/lib/db.server");
    const { and, eq } = await import("drizzle-orm");
    await db.delete(ag).where(and(eq(ag.id, data.id), eq(ag.barbeiro, nome)));
    return { ok: true as const };
  });

export const remarcarComoBarbeiro = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => remarcarInput.parse(data))
  .handler(async ({ data }) => {
    const { exigirBarbeiro } = await import("@/lib/painel.server");
    const nome = await exigirBarbeiro(data.slug);
    const { db, agendamentos: ag, colunasAgendamento, ehConflito } = await import("@/lib/db.server");
    const { and, eq } = await import("drizzle-orm");
    const doBarbeiro = and(eq(ag.id, data.id), eq(ag.barbeiro, nome));
    const [atual] = await db.select({ servico: ag.servico }).from(ag).where(doBarbeiro);
    if (!atual) return { ok: false as const, motivo: "inexistente" as const };
    const { horarioCabeNoTurno, duracaoServico } = await import("@/lib/duracao");
    if (!horarioCabeNoTurno(nome, data.data, data.hora, duracaoServico(atual.servico)))
      return { ok: false as const, motivo: "ocupado" as const };
    let row;
    try {
      [row] = await db
        .update(ag)
        .set({ data: data.data, hora: data.hora })
        .where(doBarbeiro)
        .returning(colunasAgendamento);
    } catch (e) {
      if (ehConflito(e)) return { ok: false as const, motivo: "ocupado" as const };
      throw e;
    }
    if (!row) return { ok: false as const, motivo: "inexistente" as const };
    return { ok: true as const, agendamento: row };
  });
