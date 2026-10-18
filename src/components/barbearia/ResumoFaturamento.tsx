import { useEffect, useState } from "react";
import { CalendarDays, CalendarRange, DollarSign } from "lucide-react";
import { calcularFaturamento, type AtendimentoFinanceiro } from "@/lib/faturamento";
import { formatarData, moeda } from "@/lib/painel";

export function ResumoFaturamento({ atendimentos }: { atendimentos: AtendimentoFinanceiro[] }) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);
  const resumo = calcularFaturamento(atendimentos, agora);
  const periodos = [
    { titulo: "Faturamento diário", valor: resumo.dia, periodo: formatarData(resumo.hoje), Icone: DollarSign },
    { titulo: "Faturamento semanal", valor: resumo.semana, periodo: `${formatarData(resumo.inicioSemana)} – ${formatarData(resumo.hoje)}`, Icone: CalendarRange },
    { titulo: "Faturamento mensal", valor: resumo.mes, periodo: `${formatarData(resumo.inicioMes)} – ${formatarData(resumo.hoje)}`, Icone: CalendarDays },
  ];
  return (
    <section aria-label="Resumo de faturamento" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {periodos.map(({ titulo, valor, periodo, Icone }) => (
          <article key={titulo} className="min-w-0 rounded-md border border-border bg-card p-5 text-card-foreground">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">{titulo}</h2>
              <Icone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            </div>
            <p className="mt-3 break-words text-2xl font-bold tabular-nums">{moeda(valor)}</p>
            <p className="mt-2 text-xs text-muted-foreground">{periodo}</p>
          </article>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Atendimentos concluídos · Semana de segunda a domingo</p>
    </section>
  );
}