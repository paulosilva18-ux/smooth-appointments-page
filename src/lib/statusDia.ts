import { useEffect, useState } from "react";

/** Data local (America/Recife) no formato YYYY-MM-DD */
export function hojeLocalIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Recife",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Recalcula sozinho na virada do dia. */
export function useHojeIso(): string {
  const [hoje, setHoje] = useState(hojeLocalIso);
  useEffect(() => {
    const t = setInterval(() => {
      const atual = hojeLocalIso();
      setHoje((prev) => (prev === atual ? prev : atual));
    }, 30_000);
    return () => clearInterval(t);
  }, []);
  return hoje;
}

export type StatusDia = "passado" | "hoje" | "futuro";

export function statusDoDia(data: string, hoje: string): StatusDia {
  if (data < hoje) return "passado";
  if (data === hoje) return "hoje";
  return "futuro";
}

/** Classes de borda/fundo do cartão conforme o dia. */
export function classesStatus(status: StatusDia): string {
  if (status === "passado") return "border-rose-500/50 bg-rose-500/10";
  return "border-emerald-500/50 bg-emerald-500/10";
}

export function rotuloStatus(status: StatusDia): { texto: string; classe: string } {
  if (status === "passado")
    return { texto: "Realizado", classe: "bg-rose-500/20 text-rose-300 border border-rose-500/40" };
  if (status === "hoje")
    return { texto: "Hoje", classe: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" };
  return {
    texto: "Agendado",
    classe: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  };
}
