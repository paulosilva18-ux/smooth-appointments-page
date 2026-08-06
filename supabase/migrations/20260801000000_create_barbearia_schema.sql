-- =============================================
-- SCHEMA DO BANCO DE DADOS SUPABASE FOR BARBEARIA
-- =============================================

-- 1. TABELA DE SERVIÇOS
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_min INT NOT NULL DEFAULT 30,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE AGENDAMENTOS
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    service_title VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE HORÁRIOS DE FUNCIONAMENTO
CREATE TABLE IF NOT EXISTS public.business_hours (
    id SERIAL PRIMARY KEY,
    day_of_week INT NOT NULL UNIQUE, -- 0 (Dom) a 6 (Sáb)
    day_name VARCHAR(20) NOT NULL,
    open_time VARCHAR(10) NOT NULL,
    close_time VARCHAR(10) NOT NULL,
    is_open BOOLEAN DEFAULT true
);

-- SEED INICIAL DOS 4 SERVIÇOS
INSERT INTO public.services (title, description, price, duration_min, image_url) VALUES
('Corte de Cabelo', 'Corte tradicional ou moderno (máquina/tesoura) finalizado com pomada modeladora.', 45.00, 30, '/images/corte_cabelo.png'),
('Corte + Barba', 'Combo completo de corte de cabelo e alinhamento de barba com terapia de toalha morna.', 80.00, 60, '/images/corte_barba.png'),
('Pigmentação', 'Disfarce ou preenchimento natural de falhas no cabelo ou na barba com técnica exclusiva.', 55.00, 45, '/images/pigmentacao.png'),
('Toalha Quente', 'Relaxamento facial, esfoliação leve e preparo térmico dos poros para um barbear perfeito.', 40.00, 30, '/images/toalha_quente.png')
ON CONFLICT DO NOTHING;

-- SEED HORÁRIOS DE FUNCIONAMENTO (Terça a Sábado: 09:00 as 20:00)
INSERT INTO public.business_hours (day_of_week, day_name, open_time, close_time, is_open) VALUES
(0, 'Domingo', '09:00', '13:00', false),
(1, 'Segunda-feira', '09:00', '18:00', false),
(2, 'Terça-feira', '09:00', '20:00', true),
(3, 'Quarta-feira', '09:00', '20:00', true),
(4, 'Quinta-feira', '09:00', '20:00', true),
(5, 'Sexta-feira', '09:00', '20:00', true),
(6, 'Sábado', '08:00', '19:00', true)
ON CONFLICT (day_of_week) DO NOTHING;

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para leitura de serviços e inserção de agendamentos
CREATE POLICY "Permitir leitura pública de serviços" ON public.services FOR SELECT USING (true);
CREATE POLICY "Permitir criação pública de agendamentos" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir leitura de agendamentos" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Permitir atualização de agendamentos" ON public.bookings FOR UPDATE USING (true);
CREATE POLICY "Permitir leitura de horários" ON public.business_hours FOR SELECT USING (true);
