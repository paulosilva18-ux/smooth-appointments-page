import { describe, expect, it } from "vitest";
import { horarioEditadoSchema, podeEditarHorario, type HorarioEditado } from "./agenda-config";
import { configuracaoDoBarbeiro } from "./horarios";
import { horarioCabeNoTurno, horariosDisponiveis } from "./duracao";

const semanal: HorarioEditado = {
  slug: "fabricio",
  chave: "semana:1",
  turnos: [
    ["09:00", "12:00"],
    ["14:00", "18:00"],
  ],
  ultimo_inicio: "18:00",
  extras: [],
  retirados: [],
};

describe("edição independente dos horários", () => {
  it("Fabrício edita apenas a própria agenda", () => {
    expect(podeEditarHorario({ slug: "fabricio", admin: false }, "fabricio")).toBe(true);
    expect(podeEditarHorario({ slug: "fabricio", admin: false }, "victor")).toBe(false);
  });
  it("Victor edita apenas a própria agenda", () => {
    expect(podeEditarHorario({ slug: "victor", admin: false }, "victor")).toBe(true);
    expect(podeEditarHorario({ slug: "victor", admin: false }, "fabricio")).toBe(false);
  });
  it("preserva a exceção de 13 de novembro quando edita a semana", () => {
    expect(
      configuracaoDoBarbeiro("Fabrício", "2026-11-13", [{ ...semanal, chave: "semana:5" }]).turnos,
    ).toEqual([
      ["09:00", "13:00"],
      ["14:00", "20:30"],
    ]);
  });
  it("uma data editada prevalece só naquela data", () => {
    const data = {
      ...semanal,
      chave: "2026-11-16",
      turnos: [["10:00", "11:00"]] as [string, string][],
      ultimo_inicio: null,
    };
    expect(configuracaoDoBarbeiro("Fabrício", "2026-11-16", [semanal, data]).turnos).toEqual([
      ["10:00", "11:00"],
    ]);
    expect(configuracaoDoBarbeiro("Fabrício", "2026-11-23", [semanal, data]).turnos).toEqual(
      semanal.turnos,
    );
  });
  it("um corte de 40 minutos às 09:00 continua liberando 09:40", () => {
    const livres = horariosDisponiveis(
      "Fabrício",
      "2026-11-16",
      [{ hora: "09:00", servico: "Corte (40 min)" }],
      40,
      [semanal],
    );
    expect(livres[0]).toBe("09:40");
    expect(livres).not.toContain("09:30");
  });
  it("libera vaga extra fora dos turnos apenas para o barbeiro e a data escolhidos", () => {
    const extra = {
      ...semanal,
      chave: "2026-12-06",
      turnos: [],
      ultimo_inicio: null,
      extras: ["10:00"],
    };
    expect(horariosDisponiveis("Fabrício", "2026-12-06", [], 40, [extra])).toEqual(["10:00"]);
    expect(horariosDisponiveis("Victor Paz", "2026-12-06", [], 40, [extra])).toEqual([]);
    expect(horariosDisponiveis("Fabrício", "2026-12-13", [], 40, [extra])).toEqual([]);
  });
  it("vaga extra nunca sobrepõe serviço existente", () => {
    const extra = { ...semanal, extras: ["09:20"] };
    expect(
      horariosDisponiveis(
        "Fabrício",
        "2026-11-16",
        [{ hora: "09:00", servico: "Corte (40 min)" }],
        40,
        [extra],
      ),
    ).not.toContain("09:20");
  });
  it("retirar 10:00 bloqueia seus 30 minutos e serviços que os atravessam", () => {
    const config = { ...semanal, retirados: ["10:00"] };
    expect(horarioCabeNoTurno("Fabrício", "2026-11-16", "10:00", 40, [config])).toBe(false);
    expect(horarioCabeNoTurno("Fabrício", "2026-11-16", "09:40", 40, [config])).toBe(false);
    expect(horarioCabeNoTurno("Fabrício", "2026-11-16", "10:30", 40, [config])).toBe(true);
  });
  it("preserva a pausa e o limite final escolhido", () => {
    expect(horarioCabeNoTurno("Fabrício", "2026-11-16", "11:30", 40, [semanal])).toBe(false);
    expect(horarioCabeNoTurno("Fabrício", "2026-11-16", "18:00", 40, [semanal])).toBe(true);
    expect(horarioCabeNoTurno("Fabrício", "2026-11-16", "18:01", 40, [semanal])).toBe(false);
  });
  it("rejeita turnos sobrepostos e datas inválidas", () => {
    expect(
      horarioEditadoSchema.safeParse({
        ...semanal,
        turnos: [
          ["09:00", "12:00"],
          ["11:00", "18:00"],
        ],
      }).success,
    ).toBe(false);
    expect(horarioEditadoSchema.safeParse({ ...semanal, chave: "2026-02-30" }).success).toBe(false);
  });
});
