import { sql } from "drizzle-orm";
import { boolean, date, integer, numeric, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

const criadoEm = () => timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow();
const atualizadoEm = () =>
  timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`);

export const agendamentos = pgTable(
  "agendamentos",
  {
    id: uuid().primaryKey().defaultRandom(),
    nome: text().notNull(),
    servico: text().notNull(),
    barbeiro: text().notNull(),
    data: date({ mode: "string" }).notNull(),
    hora: text().notNull(),
    telefone: text(),
    lembreteEnviadoEm: timestamp("lembrete_enviado_em", { withTimezone: true, mode: "string" }),
    confirmacaoEnviadaEm: timestamp("confirmacao_enviada_em", { withTimezone: true, mode: "string" }),
    createdAt: criadoEm(),
  },
  (t) => [unique("agendamentos_slot_unico").on(t.barbeiro, t.data, t.hora)],
);

export const bloqueios = pgTable("bloqueios", {
  id: uuid().primaryKey().defaultRandom(),
  barbeiro: text().notNull(),
  data: date({ mode: "string" }).notNull(),
  hora: text(),
  motivo: text(),
  createdAt: criadoEm(),
});

export const servicos = pgTable("servicos", {
  id: uuid().primaryKey().defaultRandom(),
  nome: text().notNull(),
  categoria: text().notNull(),
  duracaoMin: integer("duracao_min").notNull().default(30),
  preco: numeric({ precision: 10, scale: 2, mode: "number" }).notNull().default(0),
  descricao: text(),
  ativo: boolean().notNull().default(true),
  ordem: integer().notNull().default(0),
  createdAt: criadoEm(),
  updatedAt: atualizadoEm(),
});

export const barbeiros = pgTable("barbeiros", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  nome: text().notNull(),
  whatsapp: text().notNull().default(""),
  display: text().notNull().default(""),
  ativo: boolean().notNull().default(true),
  createdAt: criadoEm(),
  updatedAt: atualizadoEm(),
});
