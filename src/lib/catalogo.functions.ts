import { createServerFn } from "@tanstack/react-start";

/** Catálogo público (serviços e barbeiros ativos), com queda para os dados fixos. */
export const catalogoPublico = createServerFn({ method: "GET" }).handler(async () => {
  const { CATALOGO_PADRAO, formatarPreco, formatarTempo } = await import("@/lib/catalogo");
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: servicos }, { data: barbeiros }] = await Promise.all([
      supabaseAdmin
        .from("servicos")
        .select("nome, categoria, duracao_min, preco, descricao, ativo, ordem")
        .eq("ativo", true)
        .order("ordem", { ascending: true }),
      supabaseAdmin
        .from("barbeiros")
        .select("nome, whatsapp, display, ativo, created_at")
        .eq("ativo", true)
        .order("created_at", { ascending: true }),
    ]);

    return {
      servicos:
        servicos && servicos.length > 0
          ? servicos.map((s) => ({
              nome: s.nome,
              categoria: s.categoria,
              tempo: formatarTempo(s.duracao_min),
              preco: formatarPreco(Number(s.preco)),
              desc: s.descricao ?? undefined,
            }))
          : CATALOGO_PADRAO.servicos,
      barbeiros:
        barbeiros && barbeiros.length > 0
          ? barbeiros.map((b) => ({
              nome: b.nome,
              whatsapp: b.whatsapp,
              display: b.display,
            }))
          : CATALOGO_PADRAO.barbeiros,
    };
  } catch {
    return CATALOGO_PADRAO;
  }
});
