export type Servico = {
  nome: string;
  categoria: string;
  tempo: string;
  preco: string;
  desc: string;
  img: string;
};

export const SERVICOS: Servico[] = [
  {
    nome: "Corte",
    categoria: "Corte",
    tempo: "40 min",
    preco: "R$ 30",
    desc: "Máquina, tesoura e acabamento na navalha.",
    img: "/images/servico-corte.jpg",
  },
  {
    nome: "Corte com barba",
    categoria: "Corte",
    tempo: "1 h",
    preco: "R$ 40",
    desc: "Corte completo com barba desenhada e finalizada.",
    img: "/images/servico-barba.jpg",
  },
  {
    nome: "Corte com pigmentação",
    categoria: "Pigmentação",
    tempo: "1 h 10 min",
    preco: "R$ 60",
    desc: "Corte com preenchimento de falhas em efeito natural.",
    img: "/images/servico-pigmentacao.jpg",
  },
  {
    nome: "Corte com barba e pigmentação",
    categoria: "Pigmentação",
    tempo: "1 h 30 min",
    preco: "R$ 70",
    desc: "Pacote completo: corte, barba e pigmentação.",
    img: "/images/servico-pigmentacao.jpg",
  },
  {
    nome: "Barba",
    categoria: "Barba e barba terapia",
    tempo: "25 min",
    preco: "R$ 20",
    desc: "Desenho, navalha e óleo finalizador.",
    img: "/images/servico-barba.jpg",
  },
  {
    nome: "Barba terapia com toalha quente",
    categoria: "Barba e barba terapia",
    tempo: "1 h 30 min",
    preco: "R$ 60",
    desc: "Ritual de vapor, hidratação e relaxamento.",
    img: "/images/servico-toalha.jpg",
  },
  {
    nome: "Corte com luzes",
    categoria: "Luzes",
    tempo: "2 h 30 min",
    preco: "R$ 100",
    desc: "Tempo pode oscilar: as luzes agem por cerca de 40 min.",
    img: "/images/servico-corte.jpg",
  },
  {
    nome: "Sobrancelha",
    categoria: "Corte",
    tempo: "20 min",
    preco: "R$ 10",
    desc: "Alinhamento e acabamento na navalha.",
    img: "/images/servico-corte.jpg",
  },
];

export const CATEGORIAS = [
  "Corte",
  "Barba e barba terapia",
  "Produtos",
  "Pigmentação",
  "Luzes",
  "Alisamento",
];

export const BARBEIROS = [
  { nome: "Fabrício", whatsapp: "5581992022522", telefone: "(81) 99202-2522" },
  { nome: "Victor Paz", whatsapp: "5581989312949", telefone: "(81) 98931-2949" },
];

export const INSTAGRAM = "fabriciobarbeiro_oficial";
export const INSTAGRAM_URL = "https://instagram.com/fabriciobarbeiro_oficial";
export const ENDERECO = "Avenida Mário Leite, 1 — Vila Operária, Escada / PE";
export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  ENDERECO,
)}`;

export const HORARIOS_FUNCIONAMENTO = [
  { dias: "Segunda a quinta", horas: "8:30 – 12:00 · 14:00 – 19:00" },
  { dias: "Sexta e sábado", horas: "7:30 – 19:00" },
  { dias: "Domingo", horas: "Fechado" },
];
