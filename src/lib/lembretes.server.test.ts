import { describe, expect, it, vi } from "vitest";
import { responderLembretes } from "./lembretes.server";

const request = (token = "test-cron") => new Request("https://example.test/api/public/hooks/lembretes", {
  method: "POST", headers: { authorization: `Bearer ${token}` },
});

describe("scheduled reminders", () => {
  it("does not access bookings when the scheduler secret is missing", async () => {
    const processar = vi.fn();
    const res = await responderLembretes(request(), { provedorConfigurado: true }, processar);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: false, enviados: 0, motivo: "rotina_nao_configurada" });
    expect(processar).not.toHaveBeenCalled();
  });
  it("rejects unauthorized calls before accessing bookings", async () => {
    const processar = vi.fn();
    const res = await responderLembretes(request("wrong"), { segredo: "test-cron", provedorConfigurado: true }, processar);
    expect(res.status).toBe(401);
    expect(processar).not.toHaveBeenCalled();
  });
  it("skips database access when WhatsApp is not connected", async () => {
    const processar = vi.fn();
    const res = await responderLembretes(request(), { segredo: "test-cron", provedorConfigurado: false }, processar);
    expect(await res.json()).toEqual({ ok: true, enviados: 0, motivo: "whatsapp_nao_configurado" });
    expect(processar).not.toHaveBeenCalled();
  });
  it("reports database failures as retryable without exposing details", async () => {
    const res = await responderLembretes(request(), { segredo: "test-cron", provedorConfigurado: true }, async () => { throw new Error("private upstream details"); });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ ok: false, motivo: "processamento_indisponivel", tentarNovamenteEmSegundos: 60 });
  });
  it("returns the actual processed count on success", async () => {
    const res = await responderLembretes(request(), { segredo: "test-cron", provedorConfigurado: true }, async () => 2);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, enviados: 2 });
  });
});