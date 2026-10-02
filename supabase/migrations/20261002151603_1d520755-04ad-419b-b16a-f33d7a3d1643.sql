CREATE OR REPLACE FUNCTION public.proteger_intervalo_agendamento() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  dur_nova integer;
  dur_outra integer;
  outra record;
  trecho text;
  horas text;
  minutos text;
  inicio_novo integer;
  inicio_outra integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.barbeiro || '|' || NEW.data::text));
  IF NEW.hora !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN RAISE EXCEPTION 'Horário inválido' USING ERRCODE = '23514'; END IF;
  trecho := substring(NEW.servico from '\(([^)]*)\)');
  horas := substring(coalesce(trecho, '') from '([0-9]+)\s*h');
  minutos := substring(coalesce(trecho, '') from '([0-9]+)\s*min');
  dur_nova := coalesce(horas::integer, 0) * 60 + coalesce(minutos::integer, 0);
  IF dur_nova <= 0 THEN
    SELECT duracao_min INTO dur_nova FROM public.servicos WHERE lower(nome) = lower(trim(split_part(NEW.servico, '(', 1))) ORDER BY ativo DESC LIMIT 1;
  END IF;
  dur_nova := coalesce(nullif(dur_nova, 0), 30);
  inicio_novo := split_part(NEW.hora, ':', 1)::integer * 60 + split_part(NEW.hora, ':', 2)::integer;
  FOR outra IN SELECT id, hora, servico FROM public.agendamentos
    WHERE barbeiro = NEW.barbeiro AND data = NEW.data AND id IS DISTINCT FROM NEW.id
  LOOP
    trecho := substring(outra.servico from '\(([^)]*)\)');
    horas := substring(coalesce(trecho, '') from '([0-9]+)\s*h');
    minutos := substring(coalesce(trecho, '') from '([0-9]+)\s*min');
    dur_outra := coalesce(horas::integer, 0) * 60 + coalesce(minutos::integer, 0);
    IF dur_outra <= 0 THEN
      SELECT duracao_min INTO dur_outra FROM public.servicos WHERE lower(nome) = lower(trim(split_part(outra.servico, '(', 1))) ORDER BY ativo DESC LIMIT 1;
    END IF;
    dur_outra := coalesce(nullif(dur_outra, 0), 30);
    inicio_outra := split_part(outra.hora, ':', 1)::integer * 60 + split_part(outra.hora, ':', 2)::integer;
    IF inicio_novo < inicio_outra + dur_outra AND inicio_outra < inicio_novo + dur_nova THEN
      RAISE EXCEPTION 'Horário ocupado' USING ERRCODE = '23505';
    END IF;
  END LOOP;
  RETURN NEW;
END; $$;
CREATE TRIGGER proteger_intervalo_agendamento BEFORE INSERT OR UPDATE OF barbeiro, data, hora, servico ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.proteger_intervalo_agendamento();