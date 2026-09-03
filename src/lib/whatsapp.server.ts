/**
 * Envio automático de mensagens no WhatsApp do cliente.
 * Suporta Meta WhatsApp Cloud API ou Twilio, conforme os segredos configurados.
 * Sem credenciais, apenas registra no log (e o site continua funcionando).
 */

/** Normaliza um telefone brasileiro para o formato internacional (55DDDNNNNNNNN). */
export function normalizarTelefone(bruto: string): string | null {
  const so = (bruto ?? "").replace(/\D/g, "");
  if (!so) return null;
  const com55 = so.startsWith("55") ? so : `55${so}`;
  // 55 + DDD (2) + 8 ou 9 dígitos
  if (com55.length < 12 || com55.length > 13) return null;
  return com55;
}

export type ResultadoEnvio = { enviado: boolean; motivo?: string };

export async function enviarWhatsApp(telefone: string, texto: string): Promise<ResultadoEnvio> {
  const numero = normalizarTelefone(telefone);
  if (!numero) return { enviado: false, motivo: "telefone_invalido" };

  const metaToken = process.env["WHATSAPP_TOKEN"];
  const metaPhoneId = process.env["WHATSAPP_PHONE_ID"];
  if (metaToken && metaPhoneId) {
    const res = await fetch(`https://graph.facebook.com/v21.0/${metaPhoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${metaToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numero,
        type: "text",
        text: { preview_url: false, body: texto },
      }),
    });
    if (!res.ok) {
      console.error("Falha no envio WhatsApp (Meta):", res.status, await res.text());
      return { enviado: false, motivo: "erro_provedor" };
    }
    return { enviado: true };
  }

  const sid = process.env["TWILIO_ACCOUNT_SID"];
  const token = process.env["TWILIO_AUTH_TOKEN"];
  const from = process.env["TWILIO_WHATSAPP_FROM"];
  if (sid && token && from) {
    const body = new URLSearchParams({
      From: from.startsWith("whatsapp:") ? from : `whatsapp:+${from.replace(/\D/g, "")}`,
      To: `whatsapp:+${numero}`,
      Body: texto,
    });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      console.error("Falha no envio WhatsApp (Twilio):", res.status, await res.text());
      return { enviado: false, motivo: "erro_provedor" };
    }
    return { enviado: true };
  }

  console.warn("WhatsApp automático não configurado — mensagem não enviada para", numero);
  return { enviado: false, motivo: "sem_provedor" };
}
