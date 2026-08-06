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
    const { error } = await supabaseAdmin.from("agendamentos").insert({
      nome: data.nome,
      servico: data.servico,
      barbeiro: data.barbeiro,
      data: data.data,
      hora: data.hora,
    });
    if (error) {
      if (error.code === "23505") {
        return { ok: false as const, motivo: "ocupado" as const };
      }
      throw new Error(error.message);
    }
    return { ok: true as const };
  });
