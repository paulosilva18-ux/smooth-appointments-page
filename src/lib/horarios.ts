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
