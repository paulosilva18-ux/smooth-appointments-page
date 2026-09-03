ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS lembrete_enviado_em timestamptz,
  ADD COLUMN IF NOT EXISTS confirmacao_enviada_em timestamptz;