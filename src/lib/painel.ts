/** Dados client-safe do painel administrativo. */
export const PAINEIS: { slug: string; nome: string }[] = [
  { slug: "fabricio", nome: "Fabrício" },
  { slug: "victor", nome: "Victor Paz" },
];

export function nomePorSlug(slug: string): string | null {
  return PAINEIS.find((p) => p.slug === slug)?.nome ?? null;
}

/** Extrai o valor em reais de uma descrição como "Corte (40 min · R$ 30)". */
export function precoDoServico(servico: string): number {
  const m = servico.match(/R\$\s*([\d.,]+)/);
  if (!m) return 0;
  const n = Number(m[1]!.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function moeda(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : iso;
}
