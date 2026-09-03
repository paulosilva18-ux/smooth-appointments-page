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
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { horariosDoBarbeiro } = await import("@/lib/horarios");
  const { data: rows } = await supabaseAdmin
    .from("bloqueios")
    .select("hora")
    .eq("barbeiro", barbeiro)
    .eq("data", dataDia);
  const lista = rows ?? [];
  if (lista.some((r) => !r.hora)) {
    return horariosDoBarbeiro(barbeiro, dataDia).map((h) => ({ hora: h, servico: "Bloqueado (30 min)" }));
  }
  return lista
    .filter((r): r is { hora: string } => Boolean(r.hora))
    .map((r) => ({ hora: r.hora, servico: "Bloqueado (30 min)" }));
}

export const listarHorariosOcupados = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => slotsInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("agendamentos")
      .select("hora, servico")
      .eq("barbeiro", data.barbeiro)
      .eq("data", data.data);
    if (error) throw new Error(error.message);
    const reservas = (rows ?? []).map((r) => ({ hora: r.hora, servico: r.servico ?? "" }));
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
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { horaParaMinutos, duracaoServico } = await import("@/lib/duracao");
  let q = supabaseAdmin
    .from("agendamentos")
    .select("id, hora, servico")
    .eq("barbeiro", barbeiro)
    .eq("data", dataDia);
  if (ignorarId) q = q.neq("id", ignorarId);
  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);
  const bloqueios = await bloqueiosComoReservas(barbeiro, dataDia);
  const inicio = horaParaMinutos(hora);
  const dur = duracaoServico(servico);
  return [...(rows ?? []), ...bloqueios].some((r) => {
    const i = horaParaMinutos(r.hora);
    const d = duracaoServico(r.servico ?? "");
    return inicio < i + d && i < inicio + dur;
  });
}

export const criarAgendamento = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => criarInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (await existeConflito(data.barbeiro, data.data, data.hora, data.servico)) {
      return { ok: false as const, motivo: "ocupado" as const };
    }
    const { data: row, error } = await supabaseAdmin
      .from("agendamentos")
      .insert({
        nome: data.nome,
        servico: data.servico,
        barbeiro: data.barbeiro,
        data: data.data,
        hora: data.hora,
        telefone: data.telefone ?? null,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") {
        return { ok: false as const, motivo: "ocupado" as const };
      }
      throw new Error(error.message);
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
        await supabaseAdmin
          .from("agendamentos")
          .update({ confirmacao_enviada_em: new Date().toISOString() })
          .eq("id", row.id);
      }
    }

    return { ok: true as const, id: row.id, confirmacaoEnviada };
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
      .select("data, hora, servico, barbeiro")
      .eq("id", data.id)
      .maybeSingle();
    if (erroBusca) throw new Error(erroBusca.message);
    if (!atual) return { ok: false as const, motivo: "inexistente" as const };
    if (!dentroDaJanela(atual.data, atual.hora) || !dentroDaJanela(data.data, data.hora)) {
      return { ok: false as const, motivo: "prazo" as const };
    }
    if (
      await existeConflito(atual.barbeiro, data.data, data.hora, atual.servico ?? "", data.id)
    ) {
      return { ok: false as const, motivo: "ocupado" as const };
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
