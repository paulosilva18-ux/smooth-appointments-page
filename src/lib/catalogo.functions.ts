import { createServerFn } from "@tanstack/react-start";

/** Catálogo público (serviços e barbeiros ativos), com queda para os dados fixos. */
export const catalogoPublico = createServerFn({ method: "GET" }).handler(async () => {
  const { CATALOGO_PADRAO, formatarPreco, formatarTempo } = await import("@/lib/catalogo");
  try {
    const { db, servicos: sv, barbeiros: br } = await import("@/lib/db.server");
    const { asc, eq } = await import("drizzle-orm");
    const [servicos, barbeiros] = await Promise.all([
      db
        .select({
          nome: sv.nome,
          categoria: sv.categoria,
          duracao_min: sv.duracaoMin,
          preco: sv.preco,
          descricao: sv.descricao,
        })
        .from(sv)
        .where(eq(sv.ativo, true))
        .orderBy(asc(sv.ordem)),
      db
        .select({ nome: br.nome, whatsapp: br.whatsapp, display: br.display })
        .from(br)
        .where(eq(br.ativo, true))
        .orderBy(asc(br.createdAt)),
    ]);

    return {
      servicos:
        servicos && servicos.length > 0
          ? servicos.map((s) => ({
              nome: s.nome,
              categoria: s.categoria,
              tempo: formatarTempo(s.duracao_min),
              preco: formatarPreco(Number(s.preco)),
              ...(s.descricao ? { desc: s.descricao } : {}),
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
