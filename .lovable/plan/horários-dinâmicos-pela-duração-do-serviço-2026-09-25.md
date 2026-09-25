# Horários dinâmicos pela duração do serviço

## Objetivo
Fazer a agenda ocupar somente o período exato de cada serviço e liberar o próximo início no minuto em que o atendimento anterior termina.

## Implementação
- Calcular intervalos livres dentro de cada turno do barbeiro, descontando reservas e bloqueios existentes.
- Oferecer horários regulares e acrescentar automaticamente o término exato de cada atendimento, como 09:40 ou 11:20.
- Impedir que um novo serviço ultrapasse a pausa entre turnos ou o horário de fechamento.
- Aplicar a mesma disponibilidade ao agendamento inicial e à remarcação do cliente.
- Reforçar a validação final no servidor para rejeitar horários fora do expediente ou que tenham sido ocupados simultaneamente.

## Validação
- Testar cenários de 40 minutos e 1h20, incluindo término exato, pausa e fechamento.
- Confirmar que agendamento e remarcação exibem os mesmos horários válidos.
- Verificar que o projeto continua sem erros.
