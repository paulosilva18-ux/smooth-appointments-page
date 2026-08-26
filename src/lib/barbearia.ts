export const BARBEIROS: { nome: string; whatsapp: string; display: string }[] = [
  { nome: "Fabrício", whatsapp: "5581992022522", display: "(81) 99202-2522" },
  { nome: "Victor Paz", whatsapp: "5581989312949", display: "(81) 98931-2949" },
];


export const INSTAGRAM = "fabriciobarbeiro_oficial";
export const ENDERECO = "Avenida Mário Leite, 1 — Vila Operária, Escada/PE";

export const HORARIO_FUNCIONAMENTO = [
  { dias: "Segunda a quinta", horas: ["08:30 – 12:00", "14:00 – 19:00"] },
  { dias: "Sexta e sábado", horas: ["07:30 – 19:00"] },
  { dias: "Domingo", horas: ["Fechado"] },
];

export type Servico = {
  nome: string;
  categoria: string;
  tempo: string;
  preco: string;
  desc?: string;
};

export const SERVICOS: Servico[] = [
  { nome: "Corte", categoria: "Corte", tempo: "40 min", preco: "R$ 30" },
  { nome: "Corte com barba", categoria: "Corte", tempo: "1 h", preco: "R$ 40" },
  {
    nome: "Corte com pigmentação",
    categoria: "Pigmentação",
    tempo: "1 h 10 min",
    preco: "R$ 60",
  },
  {
    nome: "Corte com barba e pigmentação",
    categoria: "Pigmentação",
    tempo: "1 h 30 min",
    preco: "R$ 70",
  },
  {
    nome: "Corte com luzes",
    categoria: "Luzes",
    tempo: "2 h 30 min",
    preco: "R$ 100",
    desc: "Tempo pode oscilar: são cerca de 40 min de espera para a luz agir.",
  },
  { nome: "Barba", categoria: "Barba e barba terapia", tempo: "25 min", preco: "R$ 20" },
  {
    nome: "Barba terapia com toalha quente",
    categoria: "Barba e barba terapia",
    tempo: "1 h 30 min",
    preco: "R$ 60",
  },
  { nome: "Sobrancelha", categoria: "Corte", tempo: "20 min", preco: "R$ 10" },
];

export const CATEGORIAS = [
  {
    nome: "Corte",
    img: "/images/servico-corte.jpg",
    desc: "Máquina, tesoura e acabamento na navalha.",
  },
  {
    nome: "Barba e barba terapia",
    img: "/images/servico-barba.jpg",
    desc: "Desenho na navalha e ritual com toalha quente.",
  },
  {
    nome: "Pigmentação",
    img: "/images/servico-pigmentacao.jpg",
    desc: "Preenchimento de falhas com efeito natural.",
  },
  {
    nome: "Luzes",
    img: "/images/servico-toalha.jpg",
    desc: "Descoloração e luzes com tonalização.",
  },
  {
    nome: "Alisamento",
    img: "/images/servico-corte.jpg",
    desc: "Alinhamento e redução de volume. Valor sob consulta.",
  },
  {
    nome: "Produtos",
    img: "/images/servico-pigmentacao.jpg",
    desc: "Pomadas, óleos e cosméticos disponíveis na loja.",
  },
];
