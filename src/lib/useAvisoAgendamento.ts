import { useCallback, useEffect, useRef, useState } from "react";

type AgendamentoAviso = {
  id: string;
  nome: string;
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
      const quantidade = agendamentos.filter((a) => !conhecidos.current?.has(a.id)).length;
      if (quantidade) {
        setNovas((n) => n + quantidade);
        if (somAtivo) tocar();
      }
    }
    conhecidos.current = atuais;
  }, [agendamentos, escopo, somAtivo, tocar]);

  useEffect(() => () => {
    void audio.current?.close();
  }, []);

  const ativarSom = useCallback(async () => {
    if (somAtivo) {
      setSomAtivo(false);
      return;
    }
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      setSomAtivo(audio.current.state === "running");
    } catch {
      setSomAtivo(false);
    }
  }, [somAtivo]);

  return { ativarSom, somAtivo, novas, limparNovas: () => setNovas(0) };
}