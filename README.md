# Central de Campanha — Renato Pellizzari

Dashboard de comando para a campanha a **Deputado Estadual (RJ)** — eleição de 04/10/2026.
Reúne CRM de apoiadores, mapa eleitoral, agenda de eventos e o financeiro da campanha em
um só lugar.

Construído com **Next.js (App Router)**, **TypeScript**, **Tailwind CSS v4** e **Recharts**.
Hoje roda com **dados de exemplo** (camada de dados tipada) e já vem com o **schema do
Supabase** pronto para plugar o banco real.

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Outros scripts:

```bash
npm run build   # build de produção (typecheck + compilação de todas as rotas)
npm run start   # serve o build de produção
npm run lint    # ESLint
```

## Módulos

| Rota           | Módulo               | O que mostra                                                        |
| -------------- | -------------------- | ------------------------------------------------------------------- |
| `/`            | Visão Geral          | KPIs gerais, votos por região, meta projetada, fluxo de caixa       |
| `/apoiadores`  | CRM de apoiadores    | Lista filtrável de lideranças, cabos eleitorais, voluntários, doadores |
| `/mapa`        | Mapa Eleitoral RJ    | Votos projetados x meta por município e por região                  |
| `/agenda`      | Agenda & eventos     | Comícios, reuniões, caminhadas e carreatas agrupados por data       |
| `/financeiro`  | Financeiro           | Receitas, despesas e acompanhamento do limite de gastos do TSE      |

## Estrutura

```
src/
  app/
    layout.tsx           # shell (sidebar + topbar) e metadados
    page.tsx             # Visão Geral
    apoiadores/page.tsx  # CRM
    mapa/page.tsx        # Mapa eleitoral
    agenda/page.tsx      # Agenda
    financeiro/page.tsx  # Financeiro
    globals.css          # tema claro (Tailwind v4)
  components/
    sidebar.tsx          # navegação lateral
    topbar.tsx           # contagem regressiva + nav mobile
    charts.tsx           # gráficos Recharts (client components)
    ui.tsx               # Card, KpiCard, Badge, PageHeader, etc.
    nav-items.ts         # rotas do menu
  lib/
    campaign-data.ts     # DADOS DE EXEMPLO + seletores (trocar por Supabase)
    types.ts             # tipos do domínio
    format.ts            # formatadores pt-BR (R$, datas, %)
    cn.ts                # utilitário de classes
supabase/
  schema.sql             # schema PostgreSQL (tabelas, enums, índices, RLS)
  seed.sql               # recorte de dados para popular o banco
.env.local.example       # variáveis do Supabase
```

## Conectar o Supabase (quando quiser sair dos dados de exemplo)

1. Crie um projeto em [supabase.com](https://supabase.com) e rode `supabase/schema.sql`
   no **SQL Editor** (ou `supabase db push`).
2. Rode `supabase/seed.sql` para popular com dados iniciais — ou carregue os seus.
3. Copie `.env.local.example` para `.env.local` e preencha:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
   ```

4. Instale o client: `npm install @supabase/supabase-js`.
5. Em `src/lib/campaign-data.ts`, troque o corpo dos seletores (`getApoiadores`,
   `getEventos`, `getReceitas`, etc.) por consultas ao Supabase. As assinaturas e os
   tipos de retorno já estão definidos em `src/lib/types.ts`, então as páginas não
   precisam mudar.

> A camada de dados foi desenhada de propósito assim: as páginas só conhecem os
> seletores, nunca a origem dos dados. Trocar exemplo → Supabase é mexer só em um arquivo.

## Notas

- Os valores financeiros seguem as regras de prestação de contas do TSE; o limite de
  gastos é configurável conforme o teto oficial da eleição.
- Datas no formato `YYYY-MM-DD` são tratadas como horário local para evitar erro de
  fuso (off-by-one).
