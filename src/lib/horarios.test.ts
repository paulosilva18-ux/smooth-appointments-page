import { describe, expect, it } from "vitest";
import { turnosDoBarbeiro } from "./horarios";
import { horarioCabeNoTurno, horariosDisponiveis } from "./duracao";

describe("agenda semanal de Fabrício", () => {
  it.each([
    ["2026-10-19", [["09:00", "12:00"], ["14:00", "18:00"]]],
    ["2026-10-20", [["09:00", "12:00"], ["14:00", "18:00"]]],
    ["2026-10-21", [["09:00", "12:00"], ["14:00", "18:00"]]],
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

  it("não permite atravessar a pausa nem iniciar depois do limite final", () => {
    expect(horarioCabeNoTurno("Fabrício", "2026-10-23", "12:30", 40)).toBe(false);
    expect(horarioCabeNoTurno("Fabrício", "2026-10-23", "18:50", 40)).toBe(true);
    expect(horarioCabeNoTurno("Fabrício", "2026-10-23", "19:00", 40)).toBe(true);
    expect(horarioCabeNoTurno("Fabrício", "2026-10-23", "19:31", 40)).toBe(false);
    expect(horariosDisponiveis("Fabrício", "2026-10-21", [], 40).some((hora) => hora >= "14:00")).toBe(true);
  });

  it("libera 18:00 como último horário da quarta", () => {
    expect(horarioCabeNoTurno("Fabrício", "2026-10-21", "17:20", 40)).toBe(true);
    expect(horarioCabeNoTurno("Fabrício", "2026-10-21", "17:30", 40)).toBe(true);
    expect(horarioCabeNoTurno("Fabrício", "2026-10-21", "18:00", 40)).toBe(true);
    expect(horarioCabeNoTurno("Fabrício", "2026-10-21", "18:30", 40)).toBe(false);
    const livres = horariosDisponiveis("Fabrício", "2026-10-21", [{ hora: "14:00", servico: "Corte (40 min)" }], 40);
    expect(livres).toContain("14:40");
    expect(livres).not.toContain("14:00");
    expect(livres).not.toContain("14:30");
    expect(livres).toContain("18:00");
    expect(livres[livres.length - 1]).toBe("18:00");
  });

  it.each([
    ["2026-10-19", "18:00", "18:01"],
    ["2026-10-20", "18:00", "18:01"],
    ["2026-10-21", "18:00", "18:01"],
    ["2026-10-22", "19:00", "19:01"],
    ["2026-10-23", "19:30", "19:31"],
    ["2026-10-24", "18:30", "18:31"],
  ])("libera o último início de %s às %s para todos os serviços", (data, limite, depois) => {
    for (const duracao of [20, 25, 40, 80, 120, 240]) {
      expect(horarioCabeNoTurno("Fabrício", data, limite, duracao)).toBe(true);
      expect(horarioCabeNoTurno("Fabrício", data, depois, duracao)).toBe(false);
      const livres = horariosDisponiveis("Fabrício", data, [], duracao);
      expect(livres[livres.length - 1]).toBe(limite);
    }
  });

  it("mantém a agenda flexível até o último início mesmo terminando depois do turno", () => {
    const livres = horariosDisponiveis("Fabrício", "2026-10-19", [{ hora: "17:00", servico: "Corte (40 min)" }], 40);
    expect(livres).toContain("17:40");
    expect(livres).toContain("18:00");
    expect(livres).not.toContain("17:30");
    expect(livres).not.toContain("18:30");
  });

  it("bloqueia o último início quando outro serviço ainda o ocupa", () => {
    const livres = horariosDisponiveis("Fabrício", "2026-10-19", [{ hora: "17:40", servico: "Corte (40 min)" }], 40);
    expect(livres).not.toContain("18:00");
    expect(livres).not.toContain("18:20");
  });

  it("bloqueia um último horário já reservado", () => {
    const livres = horariosDisponiveis("Fabrício", "2026-10-23", [{ hora: "19:30", servico: "Corte (40 min)" }], 40);
    expect(livres).not.toContain("19:30");
    expect(livres).not.toContain("19:00");
  });

  it.each([
    ["2026-10-19", "12:00"],
    ["2026-10-20", "12:00"],
    ["2026-10-21", "12:00"],
    ["2026-10-22", "12:00"],
    ["2026-10-23", "13:00"],
    ["2026-10-24", "13:00"],
  ])("preserva a pausa da manhã de %s", (data, limiteManha) => {
    expect(horarioCabeNoTurno("Fabrício", data, limiteManha, 40)).toBe(false);
    expect(horarioCabeNoTurno("Fabrício", data, "13:30", 40)).toBe(false);
  });

  it("mantém domingo fechado", () => {
    expect(horariosDisponiveis("Fabrício", "2026-10-25", [], 40)).toEqual([]);
    expect(horarioCabeNoTurno("Fabrício", "2026-10-25", "18:00", 40)).toBe(false);
  });

  it.each([
    ["2026-10-19", [["10:00", "12:00"], ["15:00", "18:00"]]],
    ["2026-10-20", [["10:00", "12:00"], ["15:00", "18:00"]]],
    ["2026-10-21", [["10:00", "12:00"], ["15:00", "18:00"]]],
    ["2026-10-22", [["10:00", "12:00"], ["15:00", "18:00"]]],
    ["2026-10-23", [["09:30", "12:00"], ["15:00", "18:00"]]],
    ["2026-10-24", [["10:00", "12:00"], ["14:00", "18:00"]]],
    ["2026-10-25", []],
  ])("aplica os turnos de Victor em %s", (data, turnos) => {
    expect(turnosDoBarbeiro("Victor Paz", data as string)).toEqual(turnos);
  });

  it.each(["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24"])("não altera os limites de Victor em %s", (data) => {
    expect(horarioCabeNoTurno("Victor Paz", data, "18:20", 40)).toBe(false);
    expect(horarioCabeNoTurno("Victor Paz", data, "19:00", 40)).toBe(false);
    expect(horarioCabeNoTurno("Victor Paz", data, "17:20", 40)).toBe(true);
    expect(horarioCabeNoTurno("Victor Paz", data, "15:30", 40)).toBe(true);
    expect(horarioCabeNoTurno("Victor Paz", data, "13:00", 40)).toBe(false);
  });

  it("aplica as datas especiais de novembro", () => {
    expect(turnosDoBarbeiro("Fabrício", "2026-11-13")).toEqual([["09:00", "13:00"], ["14:00", "20:30"]]);
    expect(horarioCabeNoTurno("Fabrício", "2026-11-20", "20:30", 40)).toBe(true);
    expect(turnosDoBarbeiro("Fabrício", "2026-11-21")).toEqual([["08:00", "13:00"], ["14:00", "19:30"]]);
    expect(turnosDoBarbeiro("Fabrício", "2026-11-19")).toEqual([["08:30", "11:00"], ["14:00", "19:30"]]);
    expect(turnosDoBarbeiro("Victor Paz", "2026-11-13")).toEqual([["09:00", "13:00"], ["15:00", "19:00"]]);
    expect(turnosDoBarbeiro("Victor Paz", "2026-11-19")).toEqual([["09:00", "12:00"], ["15:00", "19:00"]]);
    expect(turnosDoBarbeiro("Victor Paz", "2026-11-20")).toEqual([["09:00", "12:00"], ["14:00", "19:00"]]);
    expect(turnosDoBarbeiro("Victor Paz", "2026-11-14")).toEqual([["09:00", "12:00"], ["14:00", "19:00"]]);
    expect(turnosDoBarbeiro("Fabrício", "2026-11-27")).toEqual([["09:30", "13:00"], ["14:00", "19:30"]]);
  });

  it("dia 19: manhã das 08:30 às 11:00, último encaixe às 10:00", () => {
    expect(horarioCabeNoTurno("Fabrício", "2026-11-19", "08:30", 40)).toBe(true);
    expect(horarioCabeNoTurno("Fabrício", "2026-11-19", "10:00", 40)).toBe(true);
    expect(horarioCabeNoTurno("Fabrício", "2026-11-19", "10:30", 40)).toBe(false);
    expect(horarioCabeNoTurno("Fabrício", "2026-11-19", "11:00", 40)).toBe(false);
    const livres = horariosDisponiveis("Fabrício", "2026-11-19", [], 40);
    expect(livres).toContain("08:30");
    expect(livres).toContain("10:00");
    expect(livres).not.toContain("10:30");
    expect(livres).toContain("14:00");
  });

  it("dia 13: último horário de Victor às 19:00, podendo terminar depois", () => {
    expect(horarioCabeNoTurno("Victor Paz", "2026-11-13", "19:00", 40)).toBe(true);
    expect(horarioCabeNoTurno("Victor Paz", "2026-11-13", "19:30", 40)).toBe(false);
    expect(horariosDisponiveis("Victor Paz", "2026-11-13", [], 40)).toContain("19:00");
  });

  it("abre apenas o domingo 22/11", () => {
    expect(turnosDoBarbeiro("Victor Paz", "2026-11-22")).toEqual([]);
    for (const b of ["Fabrício"]) {
      expect(turnosDoBarbeiro(b, "2026-11-22")).toEqual([["10:00", "13:00"], ["15:00", "18:00"]]);
      expect(horariosDisponiveis(b, "2026-11-22", [], 40)).toContain("10:00");
      expect(turnosDoBarbeiro(b, "2026-11-29")).toEqual([]);
    }
  });
});
