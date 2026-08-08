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

export const listarHorariosOcupados = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => slotsInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("agendamentos")
      .select("hora")
      .eq("barbeiro", data.barbeiro)
      .eq("data", data.data);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => r.hora);
  });

export const criarAgendamento = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => criarInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("agendamentos")
      .insert({
        nome: data.nome,
        servico: data.servico,
        barbeiro: data.barbeiro,
        data: data.data,
        hora: data.hora,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") {
        return { ok: false as const, motivo: "ocupado" as const };
      }
      throw new Error(error.message);
    }
    return { ok: true as const, id: row.id };
  });

export const listarMeusAgendamentos = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => idsInput.parse(data))
  .handler(async ({ data }) => {
    if (data.ids.length === 0) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("agendamentos")
      .select("id, nome, servico, barbeiro, data, hora")
      .in("id", data.ids)
      .order("data", { ascending: true })
      .order("hora", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const cancelarAgendamento = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { dentroDaJanela } = await import("@/lib/horarios");
    const { data: atual, error: erroBusca } = await supabaseAdmin
      .from("agendamentos")
      .select("data, hora")
      .eq("id", data.id)
      .maybeSingle();
    if (erroBusca) throw new Error(erroBusca.message);
    if (!atual) return { ok: false as const, motivo: "inexistente" as const };
    if (!dentroDaJanela(atual.data, atual.hora)) {
      return { ok: false as const, motivo: "prazo" as const };
    }
    const { error } = await supabaseAdmin.from("agendamentos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const reagendarAgendamento = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => reagendarInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { dentroDaJanela } = await import("@/lib/horarios");
    const { data: atual, error: erroBusca } = await supabaseAdmin
      .from("agendamentos")
      .select("data, hora")
      .eq("id", data.id)
      .maybeSingle();
    if (erroBusca) throw new Error(erroBusca.message);
    if (!atual) return { ok: false as const, motivo: "inexistente" as const };
    if (!dentroDaJanela(atual.data, atual.hora) || !dentroDaJanela(data.data, data.hora)) {
      return { ok: false as const, motivo: "prazo" as const };
    }
    const { data: row, error } = await supabaseAdmin
      .from("agendamentos")
      .update({ data: data.data, hora: data.hora })
      .eq("id", data.id)
      .select("id, nome, servico, barbeiro, data, hora")
      .maybeSingle();
    if (error) {
      if (error.code === "23505") {
        return { ok: false as const, motivo: "ocupado" as const };
      }
      throw new Error(error.message);
    }
    if (!row) return { ok: false as const, motivo: "inexistente" as const };
    return { ok: true as const, agendamento: row };
  });
