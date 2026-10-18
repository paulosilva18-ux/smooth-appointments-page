import { describe, expect, it } from "vitest";
import { calcularFaturamento } from "./faturamento";
import { precoDoServicoEmCentavos } from "./painel";

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

describe("precisão e faturamento por serviço", () => {
  it("soma valores fracionários em centavos exatos", () => {
    const dados = [atendimento("2026-10-21", "09:00", 0.1), atendimento("2026-10-21", "10:00", 0.2)];
    const resumo = calcularFaturamento(dados, agora);
    expect(resumo.centavos.dia).toBe(30);
    expect(resumo.dia).toBe(0.3);
  });
  it("lê preços brasileiros com milhares e centavos", () => {
    expect(precoDoServicoEmCentavos("Luzes (40 min · R$ 1.234,56)")).toBe(123456);
    expect(precoDoServicoEmCentavos("Corte (40 min · R$ 30,50)")).toBe(3050);
    expect(precoDoServicoEmCentavos("Corte (40 min · R$ 30.50)")).toBe(3050);
  });
  it("agrupa o mesmo serviço preservando preços históricos diferentes", () => {
    const resumo = calcularFaturamento([atendimento("2026-10-21", "09:00", 30), atendimento("2026-10-21", "10:00", 35)], agora);
    expect(resumo.porServico.dia).toEqual([{ servico: "Corte", quantidade: 2, centavos: 6500 }]);
  });
  it("separa corte, corte com barba e só barba", () => {
    const dados = [
      atendimento("2026-10-21", "09:00", 30),
      { data: "2026-10-21", hora: "09:00", servico: "Corte com barba (40 min · R$ 50,50)" },
      { data: "2026-10-21", hora: "09:00", servico: "Barba (40 min · R$ 20)" },
    ];
    const resumo = calcularFaturamento(dados, agora);
    expect(resumo.porServico.dia).toEqual([
      { servico: "Corte com barba", quantidade: 1, centavos: 5050 },
      { servico: "Corte", quantidade: 1, centavos: 3000 },
      { servico: "Barba", quantidade: 1, centavos: 2000 },
    ]);
    expect(resumo.dia).toBe(100.5);
  });
  it("os detalhes reconciliam com cada total sem contar serviços futuros", () => {
    const resumo = calcularFaturamento(registros, agora);
    for (const periodo of ["dia", "semana", "mes", "total"] as const) {
      expect(resumo.porServico[periodo].reduce((s, linha) => s + linha.centavos, 0)).toBe(resumo.centavos[periodo]);
    }
    expect(resumo.porServico.dia[0]?.quantidade).toBe(1);
    expect(resumo.total).toBe(280);
  });
  it("sinaliza preço ausente em vez de inventar valor do catálogo", () => {
    const resumo = calcularFaturamento([{ data: "2026-10-21", hora: "09:00", servico: "Corte" }], agora);
    expect(resumo.semPreco.dia).toBe(1);
    expect(resumo.porServico.dia).toEqual([]);
    expect(precoDoServicoEmCentavos("Corte")).toBeNull();
  });
  it("muda o período automaticamente na virada do dia, semana e mês local", () => {
    const dados = [atendimento("2026-11-01", "09:00", 30)];
    const resumo = calcularFaturamento(dados, Date.parse("2026-11-02T00:00:00-03:00"));
    expect(resumo.dia).toBe(0);
    expect(resumo.semana).toBe(0);
    expect(resumo.mes).toBe(30);
    expect(resumo.total).toBe(30);
  });
});