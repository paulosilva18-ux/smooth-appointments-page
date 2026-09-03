import { BARBEIROS } from "@/lib/barbearia";

export type TipoAviso = "reserva" | "cancelamento" | "reagendamento";

export type DadosAviso = {
  nome: string;
  servico: string;
  barbeiro: string;
  data: string;
  hora: string;
  /** Data/hora anteriores — usadas no aviso de reagendamento. */
  dataAnterior?: string;
  horaAnterior?: string;
};

export function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : iso;
}

export function montarMensagem(tipo: TipoAviso, d: DadosAviso): string {
  const base = [
    `Nome: ${d.nome}`,
    `Serviço: ${d.servico}`,
    `Data: ${formatarData(d.data)}`,
    `Horário: ${d.hora}`,
  ];

  if (tipo === "reserva") {
    return [
      `✅ *Nova reserva* — ${d.barbeiro}`,
      "",
      ...base,
      "",
      "Confirma pra mim, por favor?",
    ].join("\n");
  }

  if (tipo === "cancelamento") {
    return [
      `❌ *Cancelamento* — ${d.barbeiro}`,
      "",
      ...base,
      "",
      "O horário foi liberado na agenda do site.",
    ].join("\n");
  }

  return [
    `🔁 *Reagendamento* — ${d.barbeiro}`,
    "",
    `Nome: ${d.nome}`,
    `Serviço: ${d.servico}`,
    d.dataAnterior && d.horaAnterior
      ? `Antes: ${formatarData(d.dataAnterior)} às ${d.horaAnterior}`
      : "",
    `Agora: ${formatarData(d.data)} às ${d.hora}`,
    "",
    "Pode confirmar o novo horário?",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Mensagem de confirmação enviada automaticamente ao cliente. */
export function mensagemConfirmacaoCliente(d: DadosAviso): string {
  return [
    `✅ *Agendamento confirmado!*`,
    "",
    `Olá, ${d.nome}! Seu horário na Fabrício Barbeiro está confirmado.`,
    "",
    `Serviço: ${d.servico}`,
    `Barbeiro: ${d.barbeiro}`,
    `Data: ${formatarData(d.data)}`,
    `Horário: ${d.hora}`,
    "",
    "Endereço: Avenida Mário Leite, 1 — Vila Operária, Escada/PE",
    "",
    "Não precisa aguardar confirmação: o horário já está reservado na agenda.",
    "Vamos te lembrar 1h30 antes do atendimento.",
  ].join("\n");
}

/** Lembrete enviado automaticamente 1h30 antes do atendimento. */
export function mensagemLembreteCliente(d: DadosAviso): string {
  return [
    `⏰ *Lembrete do seu horário*`,
    "",
    `Olá, ${d.nome}! Faltam 1h30 para o seu atendimento.`,
    "",
    `Serviço: ${d.servico}`,
    `Barbeiro: ${d.barbeiro}`,
    `Hoje às ${d.hora}`,
    "",
    "Endereço: Avenida Mário Leite, 1 — Vila Operária, Escada/PE",
    "Até já! 💈",
  ].join("\n");
}

export function linkWhatsApp(tipo: TipoAviso, d: DadosAviso): string {
  const prof = BARBEIROS.find((b) => b.nome === d.barbeiro) ?? BARBEIROS[0]!;
  return `https://wa.me/${prof.whatsapp}?text=${encodeURIComponent(montarMensagem(tipo, d))}`;
}

/** Abre o WhatsApp com o aviso pronto. Retorna false se o navegador bloquear. */
export function avisarWhatsApp(tipo: TipoAviso, d: DadosAviso): boolean {
  const url = linkWhatsApp(tipo, d);
  const win = typeof window !== "undefined" ? window.open(url, "_blank", "noopener") : null;
  return !!win;
}
