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
