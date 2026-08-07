import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Instagram, MapPin, Phone, Scissors } from "lucide-react";

const heroImg = "/images/hero-barbearia.jpg";
import { BookingForm } from "@/components/barbearia/BookingForm";
import { BookingModal } from "@/components/barbearia/BookingModal";
import { MyBookings } from "@/components/barbearia/MyBookings";
import {
  BARBEIROS,
  CATEGORIAS,
  ENDERECO,
  HORARIO_FUNCIONAMENTO,
  INSTAGRAM,
  SERVICOS,
} from "@/lib/barbearia";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fabrício Barbeiro — Barbearia em Escada/PE | Agende no WhatsApp" },
      {
        name: "description",
        content:
          "Corte, barba e barba terapia, pigmentação, luzes e alisamento na Vila Operária, Escada/PE. Veja preços e tempos e agende pelo WhatsApp.",
      },
      { property: "og:title", content: "Fabrício Barbeiro — Barbearia em Escada/PE" },
      {
        property: "og:description",
        content:
          "Corte a partir de R$ 30, barba, pigmentação e luzes. Agendamento rápido pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ENDERECO)}`;


function Index() {
  const [open, setOpen] = useState(false);
  const [recarregar, setRecarregar] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 md:flex md:justify-between">
          <a href="#topo" className="flex min-w-0 items-center gap-2">
            <Scissors className="h-5 w-5 shrink-0 text-primary" />
            <span className="text-display truncate text-xl leading-none">
              Fabrício <span className="text-primary">Barbeiro</span>
            </span>
          </a>
          <nav className="hidden items-center gap-8 text-sm uppercase tracking-[0.2em] text-muted-foreground md:flex">
            <a href="#servicos" className="transition-colors hover:text-primary">
              Serviços
            </a>
            <a href="#precos" className="transition-colors hover:text-primary">
              Preços
            </a>
            <a href="#agendamento" className="transition-colors hover:text-primary">
              Agendamento
            </a>
            <a href="#contato" className="transition-colors hover:text-primary">
              Contato
            </a>
          </nav>
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 border border-primary px-6 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            Agendar
          </button>
        </div>
      </header>

      {/* Hero */}
      <section
        id="topo"
        className="relative flex h-[85vh] min-h-[560px] items-center justify-center overflow-hidden px-5 text-center"
      >
        <img
          src={heroImg}
          alt="Interior da barbearia Fabrício Barbeiro com cadeiras de couro e luz âmbar"
          width={1920}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background" />
        <div className="relative z-10 max-w-3xl pt-16">
          <p className="eyebrow">Escada · Pernambuco</p>
          <h1 className="text-display mt-5 text-6xl leading-[0.95] sm:text-7xl md:text-8xl">
            Corte, barba
            <br />
            <span className="text-primary">e barba terapia</span>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-base font-light leading-relaxed text-muted-foreground sm:text-lg">
            Pigmentação, luzes, alisamento e produtos. Escolha o serviço, veja o tempo
            e o valor e agende direto no WhatsApp.
          </p>

          <a
            href="#servicos"
            className="mt-10 inline-block bg-primary px-10 py-4 text-sm font-bold uppercase tracking-[0.25em] text-primary-foreground transition-colors hover:bg-primary/90"
            style={{ boxShadow: "var(--shadow-brass)" }}
          >
            Ver serviços
          </a>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="mx-auto max-w-6xl px-5 py-24">
        <div className="mb-16 text-center">
          <h2 className="text-display text-5xl">Nossos serviços</h2>
          <div className="mx-auto mt-4 h-1 w-16 bg-primary" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIAS.map((c) => (
            <article
              key={c.nome}
              className="group relative overflow-hidden border border-border p-8 transition-colors hover:border-primary/50"
            >
              <img
                src={c.img}
                alt=""
                aria-hidden="true"
                loading="lazy"
                width={800}
                height={1000}
                className="absolute inset-0 h-full w-full object-cover opacity-10 transition-all duration-700 group-hover:scale-105 group-hover:opacity-20"
              />
              <div className="relative">
                <h3 className="text-2xl transition-colors group-hover:text-primary">
                  {c.nome}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground">{c.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Tabela de preços e tempos */}
      <section
        id="precos"
        className="surface-grain border-y border-border bg-secondary/20 py-24"
      >
        <div className="mx-auto max-w-3xl px-5">
          <div className="mb-12 text-center">
            <h2 className="text-display text-5xl">Preços e tempos</h2>
            <div className="mx-auto mt-4 h-1 w-16 bg-primary" />
          </div>

          <ul className="divide-y divide-border border-y border-border">
            {SERVICOS.map((s) => (
              <li
                key={s.nome}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-5"
              >
                <div className="min-w-0">
                  <h3 className="text-xl leading-tight">{s.nome}</h3>
                  <p className="mt-1 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" /> {s.tempo}
                  </p>
                  {s.desc && (
                    <p className="mt-2 max-w-md text-xs text-muted-foreground">{s.desc}</p>
                  )}
                </div>
                <span className="text-xl font-bold text-primary">{s.preco}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Alisamento e produtos: valores sob consulta no WhatsApp.
          </p>
        </div>
      </section>


      {/* Agendamento */}
      <section
        id="agendamento"
        className="surface-grain border-y border-border bg-secondary/30 py-24"
      >
        <div className="mx-auto max-w-xl px-5">
          <div className="mb-12 text-center">
            <h2 className="text-display text-5xl">Agende seu horário</h2>
            <div className="mx-auto mt-4 h-1 w-16 bg-primary" />
            <p className="mt-6 font-light text-muted-foreground">
              Sem fila e sem ligação. Preencha em menos de um minuto e receba a
              confirmação direto no WhatsApp.
            </p>
          </div>
          <BookingForm onReservado={() => setRecarregar((n) => n + 1)} />
          <MyBookings recarregar={recarregar} />

        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-12 text-center md:grid-cols-3 md:text-left">
          <div>
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <Scissors className="h-5 w-5 text-primary" />
              <span className="text-display text-2xl leading-none">
                Fabrício <span className="text-primary">Barbeiro</span>
              </span>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Corte, barba e barba terapia, pigmentação, luzes, alisamento e produtos
              na Vila Operária, Escada/PE.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              Contatos
            </h3>
            <div className="mt-6 flex flex-col gap-3 text-sm">
              <a
                href={MAPS}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-center gap-3 text-muted-foreground transition-colors hover:text-primary md:justify-start"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {ENDERECO}
              </a>
              {BARBEIROS.map((b) => (
                <a
                  key={b.whatsapp}
                  href={`https://wa.me/${b.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 text-muted-foreground transition-colors hover:text-primary md:justify-start"
                >
                  <Phone className="h-4 w-4 shrink-0 text-primary" /> {b.nome} ·{" "}
                  {b.display}
                </a>
              ))}
              <a
                href={`https://instagram.com/${INSTAGRAM}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 text-muted-foreground transition-colors hover:text-primary md:justify-start"
              >
                <Instagram className="h-4 w-4 shrink-0 text-primary" /> @{INSTAGRAM}
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              Horário de funcionamento
            </h3>
            <div className="mt-6 space-y-4 text-sm text-muted-foreground">
              {HORARIO_FUNCIONAMENTO.map((h) => (
                <div key={h.dias}>
                  <p className="text-foreground">{h.dias}</p>
                  {h.horas.map((x) => (
                    <p key={x}>{x}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-16 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground/70">
          © {new Date().getFullYear()} Fabrício Barbeiro. Todos os direitos reservados.
        </p>
      </footer>


      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-primary px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:scale-105 md:hidden"
        style={{ boxShadow: "var(--shadow-brass)" }}
      >
        Agendar
      </button>

      <BookingModal
        open={open}
        onClose={() => setOpen(false)}
        onReservado={() => setRecarregar((n) => n + 1)}
      />
    </div>
  );
}

