import { describe, expect, it } from "vitest";
import { calcularFaturamento } from "./faturamento";

const agora = Date.parse("2026-10-21T12:00:00-03:00");
const atendimento = (data: string, hora: string, preco: number) => ({ data, hora, servico: `Corte (40 min · R$ ${preco})` });
const registros = [
  atendimento("2026-10-21", "09:00", 30),
  atendimento("2026-10-21", "11:40", 50),
  atendimento("2026-10-19", "09:00", 40),
  atendimento("2026-10-18", "09:00", 60),
  atendimento("2026-10-01", "09:00", 70),
  atendimento("2026-09-30", "09:00", 80),
  atendimento("2026-10-22", "09:00", 90),
];
describe("faturamento dos atendimentos concluídos", () => {
  it("soma apenas concluídos do dia", () => expect(calcularFaturamento(registros, agora).dia).toBe(30));
  it("soma a semana desde segunda sem incluir domingo anterior nem reservas futuras", () => expect(calcularFaturamento(registros, agora).semana).toBe(70));
  it("soma somente concluídos do mês atual", () => expect(calcularFaturamento(registros, agora).mes).toBe(200));
  it("inclui o serviço assim que termina", () => expect(calcularFaturamento(registros, agora + 20 * 60_000).dia).toBe(80));
  it("mantém a data de Pernambuco mesmo quando UTC já virou", () => {
    expect(calcularFaturamento([atendimento("2026-10-21", "18:00", 30)], Date.parse("2026-10-22T01:00:00Z")).dia).toBe(30);
  });
});