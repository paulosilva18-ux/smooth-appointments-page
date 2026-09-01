import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { catalogoPublico } from "@/lib/catalogo.functions";
import { CATALOGO_PADRAO, type Catalogo } from "@/lib/catalogo";

/** Catálogo vindo do banco (gerenciado no /admin) com fallback imediato. */
export function useCatalogo(): Catalogo {
  const buscar = useServerFn(catalogoPublico);
  const { data } = useQuery({
    queryKey: ["catalogo-publico"],
    queryFn: () => buscar(),
    initialData: CATALOGO_PADRAO,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  return data ?? CATALOGO_PADRAO;
}
