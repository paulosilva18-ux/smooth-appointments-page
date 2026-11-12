import { podeEditarHorario, type HorarioEditado } from "./agenda-config";

export async function gravarHorarios(data: {
  slug: "fabricio" | "victor";
  horario: Omit<HorarioEditado, "slug">;
}) {
  const { exigirPerfil, SLUG_NOME } = await import("./painel.server");
  const perfil = await exigirPerfil();
  if (!podeEditarHorario(perfil, data.slug)) throw new Error("NAO_AUTORIZADO");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("horarios_barbeiro")
    .upsert(
      { slug: data.slug, ...data.horario, updated_at: new Date().toISOString() },
      { onConflict: "slug,chave" },
    );
  if (error) throw new Error("Não foi possível salvar os horários.");
  const nome = SLUG_NOME[data.slug] ?? "";
  const { data: reservas, error: erroReservas } = await supabaseAdmin
    .from("agendamentos")
    .select("data, hora, servico")
    .eq("barbeiro", nome)
    .gte("data", new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10));
  if (erroReservas) return { ok: true as const, foraDoHorario: null };
  const { lerHorariosServidor } = await import("./agenda-horarios.server");
  const { horarioCabeNoTurno, duracaoServico } = await import("./duracao");
  const horarios = await lerHorariosServidor(nome);
  const foraDoHorario = (reservas ?? []).filter(
    (r) => !horarioCabeNoTurno(nome, r.data, r.hora, duracaoServico(r.servico), horarios),
  ).length;
  return { ok: true as const, foraDoHorario };
}

export async function restaurarGrade(data: { slug: "fabricio" | "victor"; chave: string }) {
  const { exigirPerfil } = await import("./painel.server");
  const perfil = await exigirPerfil();
  if (!podeEditarHorario(perfil, data.slug)) throw new Error("NAO_AUTORIZADO");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("horarios_barbeiro")
    .delete()
    .eq("slug", data.slug)
    .eq("chave", data.chave);
  if (error) throw new Error("Não foi possível restaurar os horários.");
  return { ok: true as const };
}
