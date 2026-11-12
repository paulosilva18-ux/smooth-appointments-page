import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { horarioEditadoSchema, slugDoNome, type HorarioEditado } from "./agenda-config";

export function normalizarHorarios(rows: { slug: string; chave: string; turnos: unknown; ultimo_inicio: string | null }[]): HorarioEditado[] {
  return rows.map((row) => ({ slug: row.slug, ...horarioEditadoSchema.parse(row) }));
}

/** Lê apenas a grade pública; nunca expõe clientes, sessões ou contatos. */
export async function lerHorariosPublicos(): Promise<HorarioEditado[]> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Não foi possível consultar os horários.");
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data, error } = await client.from("horarios_barbeiro").select("slug, chave, turnos, ultimo_inicio");
  if (error) throw new Error("Não foi possível consultar os horários.");
  return normalizarHorarios(data ?? []);
}

export async function lerHorariosServidor(nome: string): Promise<HorarioEditado[]> {
  const slug = slugDoNome(nome);
  if (!slug) return [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("horarios_barbeiro")
    .select("slug, chave, turnos, ultimo_inicio").eq("slug", slug);
  if (error) throw new Error("Não foi possível consultar os horários.");
  return normalizarHorarios(data ?? []);
}

export async function conflitoNaAgenda(nome: string, data: string, hora: string, servico: string, ignorarId?: string) {
  const horarios = await lerHorariosServidor(nome);
  const { horarioCabeNoTurno, horaParaMinutos, duracaoServico } = await import("./duracao");
  if (!horarioCabeNoTurno(nome, data, hora, duracaoServico(servico), horarios)) return true;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let query = supabaseAdmin.from("agendamentos").select("id, hora, servico").eq("barbeiro", nome).eq("data", data);
  if (ignorarId) query = query.neq("id", ignorarId);
  const [{ data: reservas, error }, { data: bloqueios, error: erroBloqueios }] = await Promise.all([
    query,
    supabaseAdmin.from("bloqueios").select("hora").eq("barbeiro", nome).eq("data", data),
  ]);
  if (error || erroBloqueios) throw new Error("Não foi possível verificar a agenda.");
  if (bloqueios?.some((b) => b.hora === null)) return true;
  const inicio = horaParaMinutos(hora);
  const fim = inicio + duracaoServico(servico);
  return [...(reservas ?? []), ...(bloqueios ?? []).flatMap((b) => b.hora ? [{ hora: b.hora, servico: "Bloqueado (30 min)" }] : [])]
    .some((r) => inicio < horaParaMinutos(r.hora) + duracaoServico(r.servico) && horaParaMinutos(r.hora) < fim);
}