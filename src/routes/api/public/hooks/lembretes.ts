import { createFileRoute } from "@tanstack/react-router";
import { instanteAgendamento } from "@/lib/horarios";
import { mensagemLembreteCliente } from "@/lib/notificacoes";

const ANTECEDENCIA_MIN = 90;
const TOLERANCIA_MIN = 15;

async function processar() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { enviarWhatsApp } = await import("@/lib/whatsapp.server");

  const agora = Date.now();
  const hoje = new Date(agora - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const amanha = new Date(agora + 21 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: rows, error } = await supabaseAdmin
    .from("agendamentos")
    .select("id, nome, servico, barbeiro, data, hora, telefone, lembrete_enviado_em")
    .in("data", [hoje, amanha])
    .is("lembrete_enviado_em", null)
    .not("telefone", "is", null);
  if (error) throw new Error(error.message);

  let enviados = 0;
  for (const r of rows ?? []) {
    const faltamMin = (instanteAgendamento(r.data, r.hora) - agora) / 60000;
    if (faltamMin > ANTECEDENCIA_MIN || faltamMin < ANTECEDENCIA_MIN - TOLERANCIA_MIN) continue;
    const res = await enviarWhatsApp(
      r.telefone!,
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
      await supabaseAdmin
        .from("agendamentos")
        .update({ lembrete_enviado_em: new Date().toISOString() })
        .eq("id", r.id);
    }
  }
  return enviados;
}

export const Route = createFileRoute("/api/public/hooks/lembretes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const segredo = process.env["CRON_SECRET"];
        if (segredo) {
          const auth = request.headers.get("authorization") ?? "";
          if (auth.replace("Bearer ", "") !== segredo) {
            return new Response("Unauthorized", { status: 401 });
          }
        }
        try {
          const enviados = await processar();
          return Response.json({ ok: true, enviados });
        } catch (e) {
          console.error("lembretes:", e);
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});
