import { z } from "zod";

export type Turno = [string, string];
export type HorarioEditado = {
  slug: string;
  chave: string;
  turnos: Turno[];
  ultimo_inicio: string | null;
};

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido.");
export const chaveHorario = z.string().refine((value) => {
  if (/^semana:[0-6]$/.test(value)) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Informe uma data válida.");

export const horarioEditadoSchema = z.object({
  chave: chaveHorario,
  turnos: z.array(z.tuple([hora, hora])).max(4),
  ultimo_inicio: hora.nullable(),
}).superRefine((value, ctx) => {
  value.turnos.forEach(([inicio, fim], index) => {
    const anterior = value.turnos[index - 1];
    if (inicio >= fim || (anterior && inicio <= anterior[1])) {
      ctx.addIssue({ code: "custom", message: "Os turnos devem estar em ordem, sem sobreposição, e o início deve ser anterior ao fim." });
    }
  });
  const fim = value.turnos[value.turnos.length - 1]?.[1];
  if (value.ultimo_inicio !== null && value.ultimo_inicio !== fim) {
    ctx.addIssue({ code: "custom", message: "O último início deve ser o fim do último turno." });
  }
});

export function podeEditarHorario(perfil: { slug: string; admin: boolean }, slug: string) {
  return ["fabricio", "victor"].includes(slug) && (perfil.admin || perfil.slug === slug);
}

export function slugDoNome(nome: string) {
  return nome === "Fabrício" ? "fabricio" : nome === "Victor Paz" ? "victor" : null;
}