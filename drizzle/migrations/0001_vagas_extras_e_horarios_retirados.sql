ALTER TABLE public.horarios_barbeiro ADD COLUMN extras jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.horarios_barbeiro ADD COLUMN retirados jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.horarios_barbeiro ADD CONSTRAINT horarios_extras_array CHECK (jsonb_typeof(extras) = 'array');
ALTER TABLE public.horarios_barbeiro ADD CONSTRAINT horarios_retirados_array CHECK (jsonb_typeof(retirados) = 'array');