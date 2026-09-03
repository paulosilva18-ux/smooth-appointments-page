/** Gera slots de 30 em 30 min, incluindo o horário final. */
function faixa(inicio: string, fim: string): string[] {
  const [hi, mi] = inicio.split(":").map(Number) as [number, number];
  const [hf, mf] = fim.split(":").map(Number) as [number, number];
  const out: string[] = [];
  for (let m = hi * 60 + mi; m <= hf * 60 + mf; m += 30) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

export const HORARIOS = [...faixa("09:00", "12:00"), ...faixa("14:00", "19:00")];

/** Faixas por dia da semana (0 = domingo). */
const AGENDA_SEMANA: Record<string, Record<number, [string, string][]>> = {
  "Fabrício": {
    1: [["09:00", "12:00"], ["14:00", "19:00"]],
    2: [["09:00", "12:00"], ["14:00", "19:00"]],
    3: [["09:00", "12:00"], ["14:00", "19:00"]],
    4: [["09:00", "12:00"], ["14:00", "19:00"]],
    5: [["09:00", "12:00"], ["14:00", "19:00"]],
    6: [["09:00", "12:00"], ["14:00", "19:00"]],
  },
  "Victor Paz": {
    1: [["10:00", "13:00"], ["15:00", "19:00"]],
    2: [["09:00", "13:00"], ["15:00", "19:00"]],
    3: [["10:00", "13:00"], ["15:00", "19:00"]],
    4: [["10:00", "13:00"], ["15:00", "19:00"]],
    5: [["09:00", "13:00"], ["15:00", "19:00"]],
    6: [["09:00", "13:00"], ["15:00", "19:00"]],
  },
};

/** Grade completa do barbeiro (união de todos os dias) — usada como fallback. */
export const HORARIOS_POR_BARBEIRO: Record<string, string[]> = Object.fromEntries(
  Object.entries(AGENDA_SEMANA).map(([nome, dias]) => [
    nome,
    [...new Set(Object.values(dias).flatMap((fs) => fs.flatMap(([a, b]) => faixa(a, b))))].sort(),
  ]),
);

function diaSemana(data?: string): number | null {
  if (!data) return null;
  const t = Date.parse(`${data}T12:00:00-03:00`);
  if (Number.isNaN(t)) return null;
  return new Date(t).getUTCDay();
}

export function horariosDoBarbeiro(nome: string, data?: string): string[] {
  const semana = AGENDA_SEMANA[nome];
  if (!semana) return HORARIOS;
  const dow = diaSemana(data);
  if (dow === null) return HORARIOS_POR_BARBEIRO[nome] ?? HORARIOS;
  return (semana[dow] ?? []).flatMap(([a, b]) => faixa(a, b));
}

const STORAGE_KEY = "fb-agendamentos";

/** Janela mínima (em horas) para cancelar ou remarcar um horário. */
export const JANELA_CANCELAMENTO_HORAS = 3;

export const POLITICA_CANCELAMENTO = `Cancelamentos e remarcações são permitidos até ${JANELA_CANCELAMENTO_HORAS} horas antes do horário marcado. Depois disso, fale direto com o barbeiro no WhatsApp.`;

/** Converte data (YYYY-MM-DD) + hora (HH:MM) no fuso de Pernambuco (UTC-3). */
export function instanteAgendamento(data: string, hora: string): number {
  return Date.parse(`${data}T${hora}:00-03:00`);
}

export function dentroDaJanela(data: string, hora: string, agora = Date.now()): boolean {
  const inicio = instanteAgendamento(data, hora);
  if (Number.isNaN(inicio)) return true;
  return inicio - agora >= JANELA_CANCELAMENTO_HORAS * 60 * 60 * 1000;
}

export function lidosIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function salvarId(id: string) {
  if (typeof window === "undefined") return;
  const ids = lidosIds();
  if (!ids.includes(id)) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, id]));
  }
}

export function removerId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(lidosIds().filter((v) => v !== id)),
  );
}
