import { useEffect, useState } from "react";
import { CalendarDays, CalendarRange, DollarSign } from "lucide-react";
import { calcularFaturamento, type AtendimentoFinanceiro, type PeriodoFaturamento } from "@/lib/faturamento";
import { formatarData, moeda } from "@/lib/painel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function FaturamentoPorServico({ resumo }: { resumo: ReturnType<typeof calcularFaturamento> }) {
  const [periodo, setPeriodo] = useState<PeriodoFaturamento>("dia");
  const linhas = resumo.porServico[periodo];
  const quantidade = linhas.reduce((soma, linha) => soma + linha.quantidade, 0);
  return (
    <div className="space-y-3 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Faturamento por serviço</h2>
        <Tabs value={periodo} onValueChange={(valor) => {
          if (valor === "dia" || valor === "semana" || valor === "mes" || valor === "total") setPeriodo(valor);
        }}>
          <TabsList aria-label="Período do faturamento por serviço" className="max-w-full rounded-md">
            <TabsTrigger value="dia">Dia</TabsTrigger>
            <TabsTrigger value="semana">Semana</TabsTrigger>
            <TabsTrigger value="mes">Mês</TabsTrigger>
            <TabsTrigger value="total">Histórico</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="overflow-x-auto">
        <table aria-label="Valores faturados por serviço" className="w-full text-left text-sm text-foreground">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th scope="col" className="py-3 pr-3 font-medium">Serviço</th>
              <th scope="col" className="px-2 py-3 text-right font-medium">Qtd.</th>
              <th scope="col" className="py-3 pl-3 text-right font-medium">Faturado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {linhas.map((linha) => (
              <tr key={linha.servico}>
                <th scope="row" className="py-3 pr-3 font-normal break-words">{linha.servico}</th>
                <td className="px-2 py-3 text-right tabular-nums">{linha.quantidade}</td>
                <td className="py-3 pl-3 text-right font-medium tabular-nums whitespace-nowrap">{moeda(linha.centavos / 100)}</td>
              </tr>
            ))}
            {linhas.length === 0 && <tr><td colSpan={3} className="py-5 text-muted-foreground">Nenhum atendimento concluído com preço registrado neste período.</td></tr>}
          </tbody>
          <tfoot className="border-t border-border font-semibold">
            <tr>
              <th scope="row" className="py-3 pr-3">Total</th>
              <td className="px-2 py-3 text-right tabular-nums">{quantidade}</td>
              <td className="py-3 pl-3 text-right tabular-nums whitespace-nowrap">{moeda(resumo.centavos[periodo] / 100)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {resumo.semPreco[periodo] > 0 && <p role="status" className="text-sm text-destructive">{resumo.semPreco[periodo]} atendimento(s) sem preço válido registrado: não incluído(s) no total.</p>}
    </div>
  );
}

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
      <FaturamentoPorServico resumo={resumo} />
    </section>
  );
}