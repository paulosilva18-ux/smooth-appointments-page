-- =============================================
-- SCHEMA NOVO - BARBEARIA ROYAL (CORRIGIDO)
-- 
-- INSTRUÇÕES:
-- 1. Acesse https://supabase.com/dashboard
-- 2. Selecione seu projeto
-- 3. Vá em "SQL Editor" no menu lateral
-- 4. Cole todo este conteúdo e clique em "Run"
-- =============================================

-- Limpar tudo que existia (tabelas, politicas, etc)
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.business_hours CASCADE;

-- =============================================
-- 1. TABELA DE SERVIÇOS
-- =============================================
CREATE TABLE public.services (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price       DECIMAL(10,2) NOT NULL,
    duration_min INT NOT NULL DEFAULT 30,
    image_url   TEXT,
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- 2. TABELA DE AGENDAMENTOS
-- CORREÇÃO PRINCIPAL: service_id agora é TEXT
-- Aceita UUID (uuid do supabase) e strings personalizadas (srv-corte etc)
-- =============================================
CREATE TABLE public.bookings (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id    TEXT,                  -- TEXT aceita qualquer formato de ID
    service_title VARCHAR(255) NOT NULL,
    client_name   VARCHAR(255) NOT NULL,
    client_phone  VARCHAR(50) NOT NULL,
    booking_date  DATE NOT NULL,
    booking_time  VARCHAR(10) NOT NULL,
    status        VARCHAR(20) DEFAULT 'confirmed'
                  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes         TEXT DEFAULT '',
    created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- 3. INSERIR OS 4 SERVIÇOS PADRÃO DA BARBEARIA
-- =============================================
INSERT INTO public.services (title, description, price, duration_min, image_url) VALUES
(
  'Corte de Cabelo',
  'Corte tradicional ou moderno (máquina/tesoura) finalizado com lavagem e pomada modeladora.',
  45.00, 30, '/images/corte_cabelo.png'
),
(
  'Corte + Barba',
  'Combo completo de corte de cabelo e alinhamento de barba com terapia de toalha morna.',
  80.00, 60, '/images/corte_barba.png'
),
(
  'Pigmentação',
  'Disfarce ou preenchimento natural de falhas no cabelo ou na barba com técnica exclusiva.',
  55.00, 45, '/images/pigmentacao.png'
),
(
  'Toalha Quente',
  'Relaxamento facial, esfoliação leve e preparo térmico dos poros para um barbear perfeito.',
  40.00, 30, '/images/toalha_quente.png'
);

-- =============================================
-- 4. SEGURANÇA (RLS)
-- =============================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings  ENABLE ROW LEVEL SECURITY;

-- Serviços: qualquer pessoa pode ler
CREATE POLICY "servicos_leitura_publica"
  ON public.services FOR SELECT USING (true);

-- Agendamentos: qualquer pessoa pode criar, ler, atualizar e deletar
CREATE POLICY "agendamentos_insercao_publica"
  ON public.bookings FOR INSERT WITH CHECK (true);

CREATE POLICY "agendamentos_leitura_publica"
  ON public.bookings FOR SELECT USING (true);

CREATE POLICY "agendamentos_atualizacao_publica"
  ON public.bookings FOR UPDATE USING (true);

CREATE POLICY "agendamentos_exclusao_publica"
  ON public.bookings FOR DELETE USING (true);

-- =============================================
-- 5. ATIVAR REALTIME (notificações em tempo real)
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
