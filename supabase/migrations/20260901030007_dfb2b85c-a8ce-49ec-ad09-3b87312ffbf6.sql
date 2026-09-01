CREATE TABLE public.bloqueios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbeiro text NOT NULL,
  data date NOT NULL,
  hora text,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bloqueios TO service_role;
ALTER TABLE public.bloqueios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Somente o servidor gerencia bloqueios" ON public.bloqueios FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text NOT NULL,
  duracao_min integer NOT NULL DEFAULT 30,
  preco numeric(10,2) NOT NULL DEFAULT 0,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.servicos TO service_role;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Somente o servidor gerencia servicos" ON public.servicos FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.barbeiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  whatsapp text NOT NULL DEFAULT '',
  display text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.barbeiros TO service_role;
ALTER TABLE public.barbeiros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Somente o servidor gerencia barbeiros" ON public.barbeiros FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_servicos_updated_at BEFORE UPDATE ON public.servicos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_barbeiros_updated_at BEFORE UPDATE ON public.barbeiros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.servicos (nome, categoria, duracao_min, preco, descricao, ordem) VALUES
  ('Corte', 'Corte', 40, 30, NULL, 1),
  ('Corte com barba', 'Corte', 60, 40, NULL, 2),
  ('Corte com pigmentação', 'Pigmentação', 70, 60, NULL, 3),
  ('Corte com barba e pigmentação', 'Pigmentação', 90, 70, NULL, 4),
  ('Corte com luzes', 'Luzes', 150, 100, 'Tempo pode oscilar: são cerca de 40 min de espera para a luz agir.', 5),
  ('Barba', 'Barba e barba terapia', 25, 20, NULL, 6),
  ('Barba terapia com toalha quente', 'Barba e barba terapia', 90, 60, NULL, 7),
  ('Sobrancelha', 'Corte', 20, 10, NULL, 8);

INSERT INTO public.barbeiros (slug, nome, whatsapp, display) VALUES
  ('fabricio', 'Fabrício', '5581992022522', '(81) 99202-2522'),
  ('victor', 'Victor Paz', '5581989312949', '(81) 98931-2949');