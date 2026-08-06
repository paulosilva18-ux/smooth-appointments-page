import { useState } from "react";

const SERVICOS = [
  "Corte",
  "Barba",
  "Corte + Barba",
  "Pigmentação",
  "Toalha Quente",
] as const;

const HORARIOS = [
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

const WHATSAPP = "5511999999999";

const fieldClass =
  "w-full rounded-sm border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground";

export function BookingForm({ compact = false }: { compact?: boolean }) {
  const [nome, setNome] = useState("");
  const [servico, setServico] = useState<string>(SERVICOS[0]);
  const [data, setData] = useState("");
  const [hora, setHora] = useState(HORARIOS[0]);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const texto = `Olá! Quero agendar um horário.%0A%0ANome: ${nome}%0AServiço: ${servico}%0AData: ${data}%0AHorário: ${hora}`;
    window.open(`https://wa.me/${WHATSAPP}?text=${texto}`, "_blank", "noopener");
    setEnviado(true);
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-5" : "space-y-6"}>
      <div>
        <label className={labelClass} htmlFor="nome">
          Seu nome
        </label>
        <input
          id="nome"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Como podemos te chamar?"
          className={fieldClass}
        />
      </div>

      <div>
        <span className={labelClass}>Serviço</span>
        <div className="flex flex-wrap gap-2">
          {SERVICOS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setServico(s)}
              className={`rounded-sm border px-4 py-2 text-sm transition-colors ${
                servico === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-muted-foreground hover:border-primary hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="data">
            Data
          </label>
          <input
            id="data"
            type="date"
            required
            value={data}
            onChange={(e) => setData(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="hora">
            Horário
          </label>
          <select
            id="hora"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className={fieldClass}
          >
            {HORARIOS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-sm bg-primary px-6 py-4 text-sm font-bold uppercase tracking-[0.25em] text-primary-foreground transition-transform hover:scale-[1.01] active:scale-100"
        style={{ boxShadow: "var(--shadow-brass)" }}
      >
        Confirmar agendamento
      </button>

      <p className="text-center text-xs text-muted-foreground">
        {enviado
          ? "Pedido enviado no WhatsApp — confirmamos em instantes."
          : "A confirmação é finalizada pelo WhatsApp da barbearia."}
      </p>
    </form>
  );
}
