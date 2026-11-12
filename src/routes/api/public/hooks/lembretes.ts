import { createFileRoute } from "@tanstack/react-router";
import { instanteAgendamento } from "@/lib/horarios";
import { mensagemLembreteCliente } from "@/lib/notificacoes";

const ANTECEDENCIA_MIN = 60;
const TOLERANCIA_MIN = 15;

async function processar() {
  const { db, agendamentos: ag } = await import("@/lib/db.server");
  const { and, eq, inArray, isNotNull, isNull } = await import("drizzle-orm");
  const { enviarWhatsApp } = await import("@/lib/whatsapp.server");

  const agora = Date.now();
  const hoje = new Date(agora - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const amanha = new Date(agora + 21 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const rows = await db
    .select({
      id: ag.id,
      nome: ag.nome,
      servico: ag.servico,
      barbeiro: ag.barbeiro,
      data: ag.data,
      hora: ag.hora,
      telefone: ag.telefone,
    })
    .from(ag)
    .where(
      and(inArray(ag.data, [hoje, amanha]), isNull(ag.lembreteEnviadoEm), isNotNull(ag.telefone)),
    );

  let enviados = 0;
  for (const r of rows) {
    if (!r.telefone) continue;
    const faltamMin = (instanteAgendamento(r.data, r.hora) - agora) / 60000;
    if (faltamMin > ANTECEDENCIA_MIN || faltamMin < ANTECEDENCIA_MIN - TOLERANCIA_MIN) continue;
    const res = await enviarWhatsApp(
      r.telefone,
      mensagemLembreteCliente({
        nome: r.nome,
        servico: r.servico ?? "",
        barbeiro: r.barbeiro,
        data: r.data,
        hora: r.hora,
      }),
    ).catch(() => ({ enviado: false }));
    if (res.enviado) {
      enviados += 1;
      await db
        .update(ag)
        .set({ lembreteEnviadoEm: new Date().toISOString() })
        .where(eq(ag.id, r.id));
    }
  }
  return enviados;
}

export const Route = createFileRoute("/api/public/hooks/lembretes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { responderLembretes } = await import("@/lib/lembretes.server");
        return responderLembretes(request, {
          segredo: process.env["CRON_SECRET"],
          provedorConfigurado: Boolean(
            (process.env["WHATSAPP_TOKEN"] && process.env["WHATSAPP_PHONE_ID"]) ||
            (process.env["TWILIO_ACCOUNT_SID"] && process.env["TWILIO_AUTH_TOKEN"] && process.env["TWILIO_WHATSAPP_FROM"]),
          ),
        }, processar);
      },
    },
  },
});
