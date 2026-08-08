export const HORARIOS = [
  "07:30",
  "08:30",
  "09:30",
  "10:30",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

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
