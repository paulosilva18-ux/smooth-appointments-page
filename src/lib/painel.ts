/** Dados client-safe do painel administrativo. */
export const PAINEIS: { slug: string; nome: string }[] = [
  { slug: "fabricio", nome: "Fabrício" },
  { slug: "victor", nome: "Victor Paz" },
];

export function nomePorSlug(slug: string): string | null {
  return PAINEIS.find((p) => p.slug === slug)?.nome ?? null;
}

/** Lê o preço histórico em centavos, sem somas em ponto flutuante. */
export function precoDoServicoEmCentavos(servico: string): number | null {
  const texto = servico.match(/R\$\s*([\d.,]+)/)?.[1];
  if (!texto) return null;
  const normalizado = texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto;
  const partes = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalizado);
  if (!partes?.[1]) return null;
  const centavos = Number(partes[1]) * 100 + Number((partes[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(centavos) ? centavos : null;
}

/** Preço registrado no agendamento, nunca o preço atual do catálogo. */
export function precoDoServico(servico: string): number {
  return (precoDoServicoEmCentavos(servico) ?? 0) / 100;
}

export function moeda(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : iso;
}
