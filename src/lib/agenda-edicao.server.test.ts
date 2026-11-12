import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exigirPerfil: vi.fn(),
  from: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
  lerHorariosServidor: vi.fn(),
}));

vi.mock("./painel.server", () => ({
  exigirPerfil: mocks.exigirPerfil,
  SLUG_NOME: { fabricio: "Fabrício", victor: "Victor Paz" },
}));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock("./agenda-horarios.server", () => ({ lerHorariosServidor: mocks.lerHorariosServidor }));

import { gravarHorarios, restaurarGrade } from "./agenda-edicao.server";
type SaveInput = {
  data: {
    slug: "fabricio" | "victor";
    horario: {
      chave: string;
      turnos: [string, string][];
      ultimo_inicio: string | null;
      extras: string[];
      retirados: string[];
    };
  };
};
const saveHandler = (input: SaveInput) => gravarHorarios(input.data);
const restoreHandler = (input: { data: { slug: "fabricio" | "victor"; chave: string } }) =>
  restaurarGrade(input.data);
const input: SaveInput = {
  data: {
    slug: "fabricio",
    horario: {
      chave: "2026-12-07",
      turnos: [],
      ultimo_inicio: null,
      extras: ["21:00"],
      retirados: [],
    },
  },
};

beforeEach(() => vi.resetAllMocks());
describe("proteção das edições de agenda", () => {
  it("impede gravação sem sessão antes de consultar dados", async () => {
    mocks.exigirPerfil.mockRejectedValue(new Error("NAO_AUTORIZADO"));
    await expect(saveHandler(input)).rejects.toThrow("NAO_AUTORIZADO");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("Victor não consegue adicionar horário na tabela de Fabrício", async () => {
    mocks.exigirPerfil.mockResolvedValue({ slug: "victor", admin: false });
    await expect(saveHandler(input)).rejects.toThrow("NAO_AUTORIZADO");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("Fabrício não consegue restaurar horários de Victor", async () => {
    mocks.exigirPerfil.mockResolvedValue({ slug: "fabricio", admin: false });
    await expect(restoreHandler({ data: { slug: "victor", chave: "2026-12-08" } })).rejects.toThrow(
      "NAO_AUTORIZADO",
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("adiciona 21:00 sem apagar nem remarcar reservas existentes", async () => {
    mocks.exigirPerfil.mockResolvedValue({ slug: "fabricio", admin: false });
    mocks.upsert.mockResolvedValue({ error: null });
    const gte = vi
      .fn()
      .mockResolvedValue({
        data: [{ data: "2026-12-07", hora: "09:00", servico: "Corte (40 min)" }],
        error: null,
      });
    const eq = vi.fn(() => ({ gte }));
    const select = vi.fn(() => ({ eq }));
    mocks.from.mockImplementation((table: string) =>
      table === "horarios_barbeiro" ? { upsert: mocks.upsert } : { select },
    );
    mocks.lerHorariosServidor.mockResolvedValue([{ slug: "fabricio", ...input.data.horario }]);
    const result = await saveHandler(input);
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "fabricio", chave: "2026-12-07", extras: ["21:00"] }),
      { onConflict: "slug,chave" },
    );
    expect(result.foraDoHorario).toBe(1);
    expect(select).toHaveBeenCalledWith("data, hora, servico");
    expect(mocks.from.mock.calls.map(([table]) => table)).toEqual([
      "horarios_barbeiro",
      "agendamentos",
    ]);
  });
});
