CREATE TABLE public.agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  servico TEXT NOT NULL,
  barbeiro TEXT NOT NULL,
  data DATE NOT NULL,
  hora TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agendamentos_slot_unico UNIQUE (barbeiro, data, hora)
);

GRANT ALL ON public.agendamentos TO service_role;

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Somente o servidor gerencia agendamentos"
  ON public.agendamentos FOR ALL TO service_role
  USING (true) WITH CHECK (true);