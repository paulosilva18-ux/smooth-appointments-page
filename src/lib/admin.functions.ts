import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const loginInput = z.object({
  usuario: z.string().min(1).max(30),
  senha: z.string().min(1).max(200),
});

const agendaInput = z.object({
  barbeiro: z.string().max(120).nullable().optional(),
  data: z.string().max(10).nullable().optional(),
});

const idInput = z.object({ id: z.string().uuid() });

const remarcarInput = idInput.extend({
  data: z.string().min(1).max(10),
  hora: z.string().min(1).max(10),
});

const bloqueioInput = z.object({
  barbeiro: z.string().min(1).max(120),
  data: z.string().min(1).max(10),
  horas: z.array(z.string().min(1).max(10)).max(40),
  diaInteiro: z.boolean(),
  motivo: z.string().max(200).optional(),
});

const servicoInput = z.object({
  id: z.string().uuid().nullable().optional(),
  nome: z.string().min(1).max(120),
  categoria: z.string().min(1).max(80),
  duracao_min: z.number().int().min(5).max(600),
  preco: z.number().min(0).max(100000),
  descricao: z.string().max(300).nullable().optional(),
  ativo: z.boolean(),
  ordem: z.number().int().min(0).max(999),
});

const barbeiroInput = z.object({
  id: z.string().uuid().nullable().optional(),
  slug: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[a-z0-9-]+$/),
  nome: z.string().min(1).max(120),
  whatsapp: z.string().max(20),
  display: z.string().max(30),
  ativo: z.boolean(),
});

export const entrarAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => loginInput.parse(d))
  .handler(async ({ data }) => {
    const { SLUG_SENHA, senhaConfere, sessaoPainel, nomeDoSlug } = await import(
      "@/lib/painel.server"
    );
    const slug = data.usuario.trim().toLowerCase();
    const envName = SLUG_SENHA[slug];
    if (!envName) return { ok: false as const };
    const esperada = process.env[envName];
    if (!esperada || !senhaConfere(data.senha, esperada)) return { ok: false as const };
    const sess = await sessaoPainel();
    await sess.update({ barbeiro: slug });
    const nome = (await nomeDoSlug(slug)) ?? slug;
    return { ok: true as const, perfil: { slug, nome, admin: slug === "admin" } };
  });

export const sairAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { sessaoPainel } = await import("@/lib/painel.server");
  const sess = await sessaoPainel();
  await sess.clear();
  return { ok: true as const };
});

export const statusAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { perfilAtual } = await import("@/lib/painel.server");
  return { perfil: await perfilAtual() };
});

async function banco() {
  const mod = await import("@/lib/db.server");
  const orm = await import("drizzle-orm");
  return { ...mod, ...orm };
}

export const agendaAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => agendaInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirEscopo } = await import("@/lib/painel.server");
    const { perfil, barbeiro } = await exigirEscopo(data.barbeiro ?? null);
    const { db, agendamentos: ag, bloqueios: bl, barbeiros: br, colunasAgendamento, and, eq, asc } =
      await banco();

    const [agendamentos, bloqueios, barbeiros] = await Promise.all([
      db
        .select(colunasAgendamento)
        .from(ag)
        .where(
          and(
            barbeiro ? eq(ag.barbeiro, barbeiro) : undefined,
            data.data ? eq(ag.data, data.data) : undefined,
          ),
        )
        .orderBy(asc(ag.data), asc(ag.hora)),
      db
        .select({ id: bl.id, barbeiro: bl.barbeiro, data: bl.data, hora: bl.hora, motivo: bl.motivo })
        .from(bl)
        .where(barbeiro ? eq(bl.barbeiro, barbeiro) : undefined)
        .orderBy(asc(bl.data)),
      db
        .select({
          id: br.id,
          slug: br.slug,
          nome: br.nome,
          whatsapp: br.whatsapp,
          display: br.display,
          ativo: br.ativo,
        })
        .from(br)
        .orderBy(asc(br.createdAt)),
    ]);

    return { perfil, agendamentos, bloqueios, barbeiros };
  });

export const cancelarAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirEscopo } = await import("@/lib/painel.server");
    const { perfil } = await exigirEscopo(null);
    const { db, agendamentos: ag, and, eq } = await banco();
    await db
      .delete(ag)
      .where(and(eq(ag.id, data.id), perfil.admin ? undefined : eq(ag.barbeiro, perfil.nome)));
    return { ok: true as const };
  });

export const remarcarAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => remarcarInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirEscopo } = await import("@/lib/painel.server");
    const { perfil } = await exigirEscopo(null);
    const { db, agendamentos: ag, colunasAgendamento, ehConflito, and, eq } = await banco();
    const [atual] = await db
      .select({ id: ag.id, barbeiro: ag.barbeiro, servico: ag.servico })
      .from(ag)
      .where(eq(ag.id, data.id));
    if (!atual || (!perfil.admin && atual.barbeiro !== perfil.nome))
      return { ok: false as const, motivo: "inexistente" as const };
    const { horarioCabeNoTurno, duracaoServico } = await import("@/lib/duracao");
    if (!horarioCabeNoTurno(atual.barbeiro, data.data, data.hora, duracaoServico(atual.servico)))
      return { ok: false as const, motivo: "ocupado" as const };
    let row;
    try {
      [row] = await db
        .update(ag)
        .set({ data: data.data, hora: data.hora })
        .where(and(eq(ag.id, data.id), perfil.admin ? undefined : eq(ag.barbeiro, perfil.nome)))
        .returning(colunasAgendamento);
    } catch (e) {
      if (ehConflito(e)) return { ok: false as const, motivo: "ocupado" as const };
      throw e;
    }
    if (!row) return { ok: false as const, motivo: "inexistente" as const };
    return { ok: true as const, agendamento: row };
  });

export const criarBloqueio = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => bloqueioInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirEscopo } = await import("@/lib/painel.server");
    await exigirEscopo(data.barbeiro);
    const { db, bloqueios } = await banco();
    const linhas: {
      barbeiro: string;
      data: string;
      hora: string | null;
      motivo: string | null;
    }[] = data.diaInteiro
      ? [{ barbeiro: data.barbeiro, data: data.data, hora: null, motivo: data.motivo ?? null }]
      : data.horas.map((h) => ({
          barbeiro: data.barbeiro,
          data: data.data,
          hora: h,
          motivo: data.motivo ?? null,
        }));
    if (linhas.length === 0) return { ok: false as const, motivo: "vazio" as const };
    await db.insert(bloqueios).values(linhas);
    return { ok: true as const, total: linhas.length };
  });

export const removerBloqueio = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirEscopo } = await import("@/lib/painel.server");
    const { perfil } = await exigirEscopo(null);
    const { db, bloqueios: bl, and, eq } = await banco();
    await db
      .delete(bl)
      .where(and(eq(bl.id, data.id), perfil.admin ? undefined : eq(bl.barbeiro, perfil.nome)));
    return { ok: true as const };
  });

export const listarCatalogoAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { exigirAdmin } = await import("@/lib/painel.server");
  await exigirAdmin();
  const { db, servicos: sv, barbeiros: br, asc } = await banco();
  const [servicos, barbeiros] = await Promise.all([
    db
      .select({
        id: sv.id,
        nome: sv.nome,
        categoria: sv.categoria,
        duracao_min: sv.duracaoMin,
        preco: sv.preco,
        descricao: sv.descricao,
        ativo: sv.ativo,
        ordem: sv.ordem,
      })
      .from(sv)
      .orderBy(asc(sv.ordem)),
    db
      .select({
        id: br.id,
        slug: br.slug,
        nome: br.nome,
        whatsapp: br.whatsapp,
        display: br.display,
        ativo: br.ativo,
      })
      .from(br)
      .orderBy(asc(br.createdAt)),
  ]);
  return { servicos, barbeiros };
});

export const salvarServico = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => servicoInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirAdmin } = await import("@/lib/painel.server");
    await exigirAdmin();
    const { db, servicos, eq } = await banco();
    const payload = {
      nome: data.nome,
      categoria: data.categoria,
      duracaoMin: data.duracao_min,
      preco: data.preco,
      descricao: data.descricao ?? null,
      ativo: data.ativo,
      ordem: data.ordem,
    };
    if (data.id) await db.update(servicos).set(payload).where(eq(servicos.id, data.id));
    else await db.insert(servicos).values(payload);
    return { ok: true as const };
  });

export const removerServico = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirAdmin } = await import("@/lib/painel.server");
    await exigirAdmin();
    const { db, servicos, eq } = await banco();
    await db.delete(servicos).where(eq(servicos.id, data.id));
    return { ok: true as const };
  });

export const salvarBarbeiro = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => barbeiroInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirAdmin } = await import("@/lib/painel.server");
    await exigirAdmin();
    const { db, barbeiros, ehConflito, eq } = await banco();
    const payload = {
      slug: data.slug,
      nome: data.nome,
      whatsapp: data.whatsapp,
      display: data.display,
      ativo: data.ativo,
    };
    try {
      if (data.id) await db.update(barbeiros).set(payload).where(eq(barbeiros.id, data.id));
      else await db.insert(barbeiros).values(payload);
    } catch (e) {
      if (ehConflito(e)) return { ok: false as const, motivo: "slug" as const };
      throw e;
    }
    return { ok: true as const };
  });

export const removerBarbeiro = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirAdmin } = await import("@/lib/painel.server");
    await exigirAdmin();
    const { db, barbeiros, eq } = await banco();
    await db.delete(barbeiros).where(eq(barbeiros.id, data.id));
    return { ok: true as const };
  });
