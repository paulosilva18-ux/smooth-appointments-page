import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export type PainelSession = { barbeiro?: string };

export const SLUG_SENHA: Record<string, string> = {
  fabricio: "SENHA_PAINEL_FABRICIO",
  victor: "SENHA_PAINEL_VICTOR",
  admin: "SENHA_PAINEL_ADMIN",
};

export const SLUG_NOME: Record<string, string> = {
  fabricio: "Fabrício",
  victor: "Victor Paz",
  admin: "Administração",
};

export function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "fb-painel",
    maxAge: 60 * 60 * 12,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

export function senhaConfere(input: string, esperada: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(esperada, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function sessaoPainel() {
  return useSession<PainelSession>(sessionConfig());
}

/** Garante que o usuário está logado no painel do slug informado. */
export async function exigirBarbeiro(slug: string): Promise<string> {
  const sess = await sessaoPainel();
  const atual = sess.data.barbeiro;
  if (!atual || atual !== slug || !SLUG_NOME[slug]) {
    throw new Error("NAO_AUTORIZADO");
  }
  return SLUG_NOME[slug]!;
}

export type Perfil = { slug: string; nome: string; admin: boolean };

/** Resolve o nome do barbeiro pelo slug, preferindo o cadastro no banco. */
export async function nomeDoSlug(slug: string): Promise<string | null> {
  if (slug === "admin") return SLUG_NOME["admin"]!;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("barbeiros")
      .select("nome")
      .eq("slug", slug)
      .maybeSingle();
    if (data?.nome) return data.nome;
  } catch {
    /* usa o mapa fixo abaixo */
  }
  return SLUG_NOME[slug] ?? null;
}

export async function perfilAtual(): Promise<Perfil | null> {
  const sess = await sessaoPainel();
  const slug = sess.data.barbeiro;
  if (!slug) return null;
  const nome = await nomeDoSlug(slug);
  if (!nome) return null;
  return { slug, nome, admin: slug === "admin" };
}

export async function exigirPerfil(): Promise<Perfil> {
  const p = await perfilAtual();
  if (!p) throw new Error("NAO_AUTORIZADO");
  return p;
}

export async function exigirAdmin(): Promise<Perfil> {
  const p = await exigirPerfil();
  if (!p.admin) throw new Error("NAO_AUTORIZADO");
  return p;
}

/**
 * Garante permissão sobre a agenda de um barbeiro.
 * Admin pode qualquer um; barbeiro só a própria agenda.
 */
export async function exigirEscopo(nomeAlvo?: string | null): Promise<{
  perfil: Perfil;
  barbeiro: string | null;
}> {
  const perfil = await exigirPerfil();
  if (perfil.admin) return { perfil, barbeiro: nomeAlvo ?? null };
  if (nomeAlvo && nomeAlvo !== perfil.nome) throw new Error("NAO_AUTORIZADO");
  return { perfil, barbeiro: perfil.nome };
}
