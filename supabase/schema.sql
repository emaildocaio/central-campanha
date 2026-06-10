-- =========================================================================
-- Central de Campanha — schema Supabase (PostgreSQL)
-- Espelha os tipos em src/lib/types.ts e os dados em src/lib/campaign-data.ts
-- Rode no SQL Editor do Supabase ou via `supabase db push`.
-- =========================================================================

-- Tipos (enums) -----------------------------------------------------------
create type regiao as enum (
  'Metropolitana', 'Baixada Fluminense', 'Região dos Lagos',
  'Norte Fluminense', 'Noroeste Fluminense', 'Serrana',
  'Médio Paraíba', 'Costa Verde', 'Centro-Sul'
);

create type tipo_apoiador  as enum ('Liderança', 'Cabo eleitoral', 'Voluntário', 'Doador');
create type status_apoiador as enum ('Ativo', 'Potencial', 'Inativo');

create type tipo_evento   as enum ('Comício', 'Reunião', 'Caminhada', 'Carreata', 'Entrevista', 'Visita', 'Live');
create type status_evento as enum ('Confirmado', 'Agendado', 'Realizado', 'Cancelado');

create type tipo_receita      as enum ('Pessoa física', 'Fundo partidário', 'Recurso próprio', 'Financiamento coletivo');
create type categoria_despesa as enum ('Material de campanha', 'Marketing digital', 'Pessoal', 'Combustível', 'Eventos', 'Aluguel', 'Outros');
create type status_despesa    as enum ('Pago', 'Pendente');

-- Configuração da campanha (linha única) ----------------------------------
create table campanha (
  id               smallint primary key default 1,
  candidato        text not null,
  cargo            text not null,
  partido          text,
  numero           text,
  estado           text not null,
  data_eleicao     date not null,
  meta_votos       integer not null,
  limite_gasto_tse numeric(12,2) not null,
  constraint campanha_singleton check (id = 1)
);

-- Municípios --------------------------------------------------------------
create table municipios (
  id               text primary key,
  nome             text not null,
  regiao           regiao not null,
  eleitorado       integer not null default 0,
  meta_votos       integer not null default 0,
  votos_projetados integer not null default 0,
  lideres          integer not null default 0
);

-- Apoiadores (CRM) --------------------------------------------------------
create table apoiadores (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  tipo            tipo_apoiador not null,
  municipio       text references municipios(id),
  regiao          regiao not null,
  telefone        text,
  meta_votos      integer not null default 0,
  votos_estimados integer not null default 0,
  status          status_apoiador not null default 'Potencial',
  responsavel     text,
  ultimo_contato  date,
  created_at      timestamptz not null default now()
);

-- Eventos (Agenda) --------------------------------------------------------
create table eventos (
  id               uuid primary key default gen_random_uuid(),
  titulo           text not null,
  tipo             tipo_evento not null,
  inicio           timestamptz not null,
  municipio        text references municipios(id),
  local            text,
  status           status_evento not null default 'Agendado',
  publico_estimado integer not null default 0,
  responsavel      text,
  created_at       timestamptz not null default now()
);

-- Receitas (doações) ------------------------------------------------------
create table receitas (
  id         uuid primary key default gen_random_uuid(),
  data       date not null,
  origem     text not null,
  tipo       tipo_receita not null,
  valor      numeric(12,2) not null,
  created_at timestamptz not null default now()
);

-- Despesas ----------------------------------------------------------------
create table despesas (
  id         uuid primary key default gen_random_uuid(),
  data       date not null,
  descricao  text not null,
  categoria  categoria_despesa not null,
  fornecedor text,
  valor      numeric(12,2) not null,
  status     status_despesa not null default 'Pendente',
  created_at timestamptz not null default now()
);

-- Índices úteis -----------------------------------------------------------
create index on apoiadores (regiao);
create index on apoiadores (status);
create index on eventos (inicio);
create index on municipios (regiao);

-- RLS ---------------------------------------------------------------------
-- Habilite o RLS e crie políticas conforme o seu modelo de acesso. Exemplo
-- (somente leitura pública — AJUSTE para produção, restringindo a usuários
-- autenticados da equipe de campanha):
alter table campanha   enable row level security;
alter table municipios enable row level security;
alter table apoiadores enable row level security;
alter table eventos    enable row level security;
alter table receitas   enable row level security;
alter table despesas   enable row level security;

-- create policy "leitura equipe" on apoiadores
--   for select using (auth.role() = 'authenticated');
