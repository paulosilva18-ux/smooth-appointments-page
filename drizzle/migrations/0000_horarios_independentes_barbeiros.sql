CREATE TABLE public.horarios_barbeiro (
  slug text NOT NULL REFERENCES public.barbeiros(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  chave text NOT NULL,
  turnos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ultimo_inicio text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (slug, chave),
  CONSTRAINT horarios_chave_valida CHECK (chave ~ '^semana:[0-6]$' OR chave ~ '^\d{4}-\d{2}-\d{2}$'),
  CONSTRAINT horarios_turnos_array CHECK (jsonb_typeof(turnos) = 'array'),
  CONSTRAINT horarios_ultimo_inicio_valido CHECK (ultimo_inicio IS NULL OR ultimo_inicio ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);
GRANT SELECT ON public.horarios_barbeiro TO anon;
GRANT ALL ON public.horarios_barbeiro TO service_role;
ALTER TABLE public.horarios_barbeiro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consulta publica de horarios" ON public.horarios_barbeiro FOR SELECT TO anon USING (true);
CREATE POLICY "Servidor gerencia horarios" ON public.horarios_barbeiro FOR ALL TO service_role USING (true) WITH CHECK (true);