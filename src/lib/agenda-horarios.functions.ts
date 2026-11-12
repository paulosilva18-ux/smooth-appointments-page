import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { chaveHorario, horarioEditadoSchema } from "./agenda-config";

const alvo = z.object({ slug: z.enum(["fabricio", "victor"]) });

export const consultarHorarios = createServerFn({ method: "GET" }).handler(async () => {
  const { lerHorariosPublicos } = await import("./agenda-horarios.server");
  return lerHorariosPublicos();
});

export const salvarHorarios = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => alvo.extend({ horario: horarioEditadoSchema }).parse(input))
  .handler(async ({ data }) => {
    const { gravarHorarios } = await import("./agenda-edicao.server");
    return gravarHorarios(data);
  });

export const restaurarHorarios = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => alvo.extend({ chave: chaveHorario }).parse(input))
  .handler(async ({ data }) => {
    const { restaurarGrade } = await import("./agenda-edicao.server");
    return restaurarGrade(data);
  });
