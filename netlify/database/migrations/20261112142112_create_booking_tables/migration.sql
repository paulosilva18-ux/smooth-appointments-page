CREATE TABLE "agendamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"nome" text NOT NULL,
	"servico" text NOT NULL,
	"barbeiro" text NOT NULL,
	"data" date NOT NULL,
	"hora" text NOT NULL,
	"telefone" text,
	"lembrete_enviado_em" timestamp with time zone,
	"confirmacao_enviada_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agendamentos_slot_unico" UNIQUE("barbeiro","data","hora")
);
--> statement-breakpoint
CREATE TABLE "barbeiros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" text NOT NULL UNIQUE,
	"nome" text NOT NULL,
	"whatsapp" text DEFAULT '' NOT NULL,
	"display" text DEFAULT '' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bloqueios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"barbeiro" text NOT NULL,
	"data" date NOT NULL,
	"hora" text,
	"motivo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servicos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"nome" text NOT NULL,
	"categoria" text NOT NULL,
	"duracao_min" integer DEFAULT 30 NOT NULL,
	"preco" numeric(10,2) DEFAULT '0' NOT NULL,
	"descricao" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
