import { describe, expect, it } from "vitest";
import { turnosDoBarbeiro } from "./horarios";
import { horarioCabeNoTurno, horariosDisponiveis } from "./duracao";

describe("agenda semanal de Fabrício", () => {
  it.each([
    ["2026-10-19", [["09:00", "12:00"], ["14:00", "18:00"]]],
    ["2026-10-20", [["09:00", "12:00"], ["14:00", "18:00"]]],
    ["2026-10-21", [["09:00", "12:00"]]],
    ["2026-10-22", [["08:30", "12:00"], ["14:00", "19:00"]]],
    ["2026-10-23", [["09:30", "13:00"], ["14:00", "19:30"]]],
    ["2026-10-24", [["08:00", "13:00"], ["14:00", "18:30"]]],
    ["2026-10-25", []],
  ])("aplica os turnos de %s", (data, turnos) => {
    expect(turnosDoBarbeiro("Fabrício", data as string)).toEqual(turnos);
  });

  it("libera 09:40 depois do corte de 40 minutos às 09:00", () => {
    const livres = horariosDisponiveis("Fabrício", "2026-10-19", [{ hora: "09:00", servico: "Corte (40 min)" }], 40);
    expect(livres[0]).toBe("09:40");
    expect(livres).not.toContain("09:30");
  });

  it("libera o término exato de outros serviços sem arredondar", () => {
    const livres = horariosDisponiveis("Fabrício", "2026-10-19", [{ hora: "10:00", servico: "Corte com barba (1 h 20 min)" }], 40);
    expect(livres).toContain("11:20");
    expect(livres).not.toContain("11:00");
  });

  it("não permite atravessar a pausa ou o fechamento", () => {
    expect(horarioCabeNoTurno("Fabrício", "2026-10-23", "12:30", 40)).toBe(false);
    expect(horarioCabeNoTurno("Fabrício", "2026-10-23", "18:50", 40)).toBe(true);
    expect(horarioCabeNoTurno("Fabrício", "2026-10-23", "19:00", 40)).toBe(false);
    expect(horariosDisponiveis("Fabrício", "2026-10-21", [], 40).some((hora) => hora >= "12:00")).toBe(false);
  });
});