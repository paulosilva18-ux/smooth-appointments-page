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

export const agendaAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => agendaInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirEscopo } = await import("@/lib/painel.server");
    const { perfil, barbeiro } = await exigirEscopo(data.barbeiro ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = supabaseAdmin
      .from("agendamentos")
      .select("id, nome, servico, barbeiro, data, hora, created_at")
      .order("data", { ascending: true })
      .order("hora", { ascending: true });
    if (barbeiro) q = q.eq("barbeiro", barbeiro);
    if (data.data) q = q.eq("data", data.data);
    const { data: agendamentos, error } = await q;
    if (error) throw new Error(error.message);

    let qb = supabaseAdmin
      .from("bloqueios")
      .select("id, barbeiro, data, hora, motivo")
      .order("data", { ascending: true });
    if (barbeiro) qb = qb.eq("barbeiro", barbeiro);
    const { data: bloqueios } = await qb;

    const { data: barbeiros } = await supabaseAdmin
      .from("barbeiros")
      .select("id, slug, nome, whatsapp, display, ativo")
      .order("created_at", { ascending: true });

    return {
      perfil,
      agendamentos: agendamentos ?? [],
      bloqueios: bloqueios ?? [],
      barbeiros: barbeiros ?? [],
    };
  });

export const cancelarAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirEscopo } = await import("@/lib/painel.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { perfil } = await exigirEscopo(null);
    let q = supabaseAdmin.from("agendamentos").delete().eq("id", data.id);
    if (!perfil.admin) q = q.eq("barbeiro", perfil.nome);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const remarcarAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => remarcarInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirEscopo } = await import("@/lib/painel.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { perfil } = await exigirEscopo(null);
    let q = supabaseAdmin
      .from("agendamentos")
      .update({ data: data.data, hora: data.hora })
      .eq("id", data.id);
    if (!perfil.admin) q = q.eq("barbeiro", perfil.nome);
    const { data: row, error } = await q
      .select("id, nome, servico, barbeiro, data, hora, created_at")
      .maybeSingle();
    if (error) {
      if (error.code === "23505") return { ok: false as const, motivo: "ocupado" as const };
      throw new Error(error.message);
    }
    if (!row) return { ok: false as const, motivo: "inexistente" as const };
    return { ok: true as const, agendamento: row };
  });

export const criarBloqueio = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => bloqueioInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirEscopo } = await import("@/lib/painel.server");
    await exigirEscopo(data.barbeiro);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const linhas = data.diaInteiro
      ? [
          {
            barbeiro: data.barbeiro,
            data: data.data,
            hora: null,
            motivo: data.motivo ?? null,
          },
        ]
      : data.horas.map((h) => ({
          barbeiro: data.barbeiro,
          data: data.data,
          hora: h,
          motivo: data.motivo ?? null,
        }));
    if (linhas.length === 0) return { ok: false as const, motivo: "vazio" as const };
    const { error } = await supabaseAdmin.from("bloqueios").insert(linhas);
    if (error) throw new Error(error.message);
    return { ok: true as const, total: linhas.length };
  });

export const removerBloqueio = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirEscopo } = await import("@/lib/painel.server");
    const { perfil } = await exigirEscopo(null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("bloqueios").delete().eq("id", data.id);
    if (!perfil.admin) q = q.eq("barbeiro", perfil.nome);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const listarCatalogoAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { exigirAdmin } = await import("@/lib/painel.server");
  await exigirAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: servicos }, { data: barbeiros }] = await Promise.all([
    supabaseAdmin
      .from("servicos")
      .select("id, nome, categoria, duracao_min, preco, descricao, ativo, ordem")
      .order("ordem", { ascending: true }),
    supabaseAdmin
      .from("barbeiros")
      .select("id, slug, nome, whatsapp, display, ativo")
      .order("created_at", { ascending: true }),
  ]);
  return { servicos: servicos ?? [], barbeiros: barbeiros ?? [] };
});

export const salvarServico = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => servicoInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirAdmin } = await import("@/lib/painel.server");
    await exigirAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      nome: data.nome,
      categoria: data.categoria,
      duracao_min: data.duracao_min,
      preco: data.preco,
      descricao: data.descricao ?? null,
      ativo: data.ativo,
      ordem: data.ordem,
    };
    const { error } = data.id
      ? await supabaseAdmin.from("servicos").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("servicos").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const removerServico = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirAdmin } = await import("@/lib/painel.server");
    await exigirAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("servicos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const salvarBarbeiro = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => barbeiroInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirAdmin } = await import("@/lib/painel.server");
    await exigirAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      slug: data.slug,
      nome: data.nome,
      whatsapp: data.whatsapp,
      display: data.display,
      ativo: data.ativo,
    };
    const { error } = data.id
      ? await supabaseAdmin.from("barbeiros").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("barbeiros").insert(payload);
    if (error) {
      if (error.code === "23505") return { ok: false as const, motivo: "slug" as const };
      throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const removerBarbeiro = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => idInput.parse(d))
  .handler(async ({ data }) => {
    const { exigirAdmin } = await import("@/lib/painel.server");
    await exigirAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("barbeiros").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
