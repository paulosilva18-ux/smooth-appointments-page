import { SERVICOS, BARBEIROS, type Servico } from "@/lib/barbearia";

export type Profissional = { nome: string; whatsapp: string; display: string };
export type Catalogo = { servicos: Servico[]; barbeiros: Profissional[] };

export const CATALOGO_PADRAO: Catalogo = { servicos: SERVICOS, barbeiros: BARBEIROS };

export function formatarTempo(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

export function formatarPreco(valor: number): string {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "R$ 0";
  return Number.isInteger(n) ? `R$ ${n}` : `R$ ${n.toFixed(2).replace(".", ",")}`;
}
