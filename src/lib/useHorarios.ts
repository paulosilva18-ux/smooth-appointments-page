import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { consultarHorarios } from "./agenda-horarios.functions";

export function useHorarios() {
  const consultar = useServerFn(consultarHorarios);
  return useQuery({
    queryKey: ["horarios-barbeiros"],
    queryFn: () => consultar(),
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
}