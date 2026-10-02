import { useCallback, useEffect, useRef, useState } from "react";

type AgendamentoAviso = {
  id: string;
  nome: string;
  servico: string;
  barbeiro: string;
  data: string;
  hora: string;
};

/** A primeira agenda recebida serve de referência; só reservas novas disparam aviso. */
export function useAvisoAgendamento(
  agendamentos: AgendamentoAviso[] | undefined,
  escopo: string,
) {
  const conhecidos = useRef<Set<string> | null>(null);
  const escopoAnterior = useRef(escopo);
  const audio = useRef<AudioContext | null>(null);
  const [somAtivo, setSomAtivo] = useState(false);
  const [novas, setNovas] = useState(0);
  const [permissao, setPermissao] = useState<NotificationPermission | "indisponivel">("indisponivel");

  useEffect(() => {
    const atualizarPermissao = () => {
      setPermissao("Notification" in window && window.isSecureContext ? Notification.permission : "indisponivel");
    };
    atualizarPermissao();
    window.addEventListener("focus", atualizarPermissao);
    return () => window.removeEventListener("focus", atualizarPermissao);
  }, []);

  const ativarNotificacoes = useCallback(async () => {
    if (!("Notification" in window) || !window.isSecureContext) return;
    try {
      const resultado = await Notification.requestPermission();
      setPermissao(resultado);
    } catch {
      setPermissao(Notification.permission);
    }
  }, []);

  const tocar = useCallback(() => {
    const contexto = audio.current;
    if (!contexto || contexto.state !== "running") return;
    const inicio = contexto.currentTime;
    for (const [indice, frequencia] of [740, 988].entries()) {
      const oscilador = contexto.createOscillator();
      const volume = contexto.createGain();
      const tempo = inicio + indice * 0.22;
      oscilador.type = "sine";
      oscilador.frequency.setValueAtTime(frequencia, tempo);
      volume.gain.setValueAtTime(0.0001, tempo);
      volume.gain.exponentialRampToValueAtTime(0.18, tempo + 0.025);
      volume.gain.exponentialRampToValueAtTime(0.0001, tempo + 0.19);
      oscilador.connect(volume).connect(contexto.destination);
      oscilador.start(tempo);
      oscilador.stop(tempo + 0.2);
    }
  }, []);

  useEffect(() => {
    if (escopoAnterior.current !== escopo) {
      escopoAnterior.current = escopo;
      conhecidos.current = null;
      setNovas(0);
    }
    if (!agendamentos) return;
    const atuais = new Set(agendamentos.map((a) => a.id));
    if (conhecidos.current) {
      const novasReservas = agendamentos.filter((a) => !conhecidos.current?.has(a.id));
      if (novasReservas.length) {
        setNovas((n) => n + novasReservas.length);
        if (somAtivo) tocar();
        if (document.visibilityState === "hidden" && "Notification" in window && Notification.permission === "granted") {
          for (const reserva of novasReservas) {
            try {
              const notificacao = new Notification(`Nova reserva · ${reserva.barbeiro}`, {
                body: `${reserva.nome} · ${reserva.servico} · ${reserva.data.split("-").reverse().join("/")} às ${reserva.hora}`,
                tag: `reserva-${reserva.id}`,
              });
              notificacao.onclick = () => {
                window.focus();
                notificacao.close();
              };
            } catch {
              // Alguns navegadores não permitem notificações via página, mesmo com permissão.
            }
          }
        }
      }
    }
    conhecidos.current = atuais;
  }, [agendamentos, escopo, somAtivo, tocar]);

  useEffect(() => {
    let montado = true;
    const liberarSom = () => {
      try {
        audio.current ??= new AudioContext();
        void audio.current.resume().then(() => {
          if (montado) setSomAtivo(audio.current?.state === "running");
        }).catch(() => {
          if (montado) setSomAtivo(false);
        });
      } catch {
        if (montado) setSomAtivo(false);
      }
    };

    // Tenta iniciar imediatamente; se o navegador impedir, qualquer interação libera o áudio.
    liberarSom();
    document.addEventListener("pointerdown", liberarSom);
    document.addEventListener("keydown", liberarSom);
    return () => {
      montado = false;
      document.removeEventListener("pointerdown", liberarSom);
      document.removeEventListener("keydown", liberarSom);
      void audio.current?.close();
      audio.current = null;
    };
  }, []);

  return { somAtivo, novas, limparNovas: () => setNovas(0), permissao, ativarNotificacoes };
}