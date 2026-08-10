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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("agendamentos")
      .select("id, nome, servico, barbeiro, data, hora, created_at")
      .eq("barbeiro", nome)
      .order("data", { ascending: true })
      .order("hora", { ascending: true });
    if (error) throw new Error(error.message);
    return { nome, agendamentos: rows ?? [] };
  });

export const cancelarComoBarbeiro = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => acaoInput.parse(data))
  .handler(async ({ data }) => {
    const { exigirBarbeiro } = await import("@/lib/painel.server");
    const nome = await exigirBarbeiro(data.slug);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("agendamentos")
      .delete()
      .eq("id", data.id)
      .eq("barbeiro", nome);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const remarcarComoBarbeiro = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => remarcarInput.parse(data))
  .handler(async ({ data }) => {
    const { exigirBarbeiro } = await import("@/lib/painel.server");
    const nome = await exigirBarbeiro(data.slug);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("agendamentos")
      .update({ data: data.data, hora: data.hora })
      .eq("id", data.id)
      .eq("barbeiro", nome)
      .select("id, nome, servico, barbeiro, data, hora, created_at")
      .maybeSingle();
    if (error) {
      if (error.code === "23505") return { ok: false as const, motivo: "ocupado" as const };
      throw new Error(error.message);
    }
    if (!row) return { ok: false as const, motivo: "inexistente" as const };
    return { ok: true as const, agendamento: row };
  });
