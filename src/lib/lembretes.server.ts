type ConfiguracaoLembretes = {
  segredo?: string | undefined;
  provedorConfigurado: boolean;
};

async function segredoIgual(recebido: string, esperado: string) {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(recebido)),
    crypto.subtle.digest("SHA-256", encoder.encode(esperado)),
  ]);
  const bytesA = new Uint8Array(a);
  const bytesB = new Uint8Array(b);
  let diferenca = 0;
  for (let i = 0; i < bytesA.length; i++) diferenca |= (bytesA[i] ?? 0) ^ (bytesB[i] ?? 0);
  return diferenca === 0;
}

/** Keep scheduled failures isolated from the public booking experience. */
export async function responderLembretes(
  request: Request,
  configuracao: ConfiguracaoLembretes,
  processar: () => Promise<number>,
): Promise<Response> {
  if (!configuracao.segredo) {
    // An inactive scheduler is an expected no-op, not a page-level failure.
    return Response.json({ ok: false, enviados: 0, motivo: "rotina_nao_configurada" });
  }
  const auth = request.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ") || !(await segredoIgual(auth.slice(7), configuracao.segredo))) {
    return Response.json({ ok: false, motivo: "nao_autorizado" }, { status: 401 });
  }
  if (!configuracao.provedorConfigurado) {
    return Response.json({ ok: true, enviados: 0, motivo: "whatsapp_nao_configurado" });
  }
  try {
    return Response.json({ ok: true, enviados: await processar() });
  } catch {
    // Do not log booking data, credentials, or upstream response bodies.
    console.warn("Lembretes: processamento indisponível; tentar novamente mais tarde.");
    return Response.json(
      { ok: false, motivo: "processamento_indisponivel", tentarNovamenteEmSegundos: 60 },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}