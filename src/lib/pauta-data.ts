// ---------------------------------------------------------------------------
// Pauta da Semana — camada de dados.
// 10 ideias de mensagem para a Comunidade do WhatsApp, geradas toda segunda 08h
// por um agente no n8n que cruza a base do candidato (eixos, personas, voz), o
// clipping da semana (temas e adversários) e a estrutura de grupos. O painel lê
// do feed via a variável de ambiente PAUTA_FEED_URL; sem ela, mostra exemplos.
// Contrato do feed: { semana?, atualizadoEm?, ideias: Ideia[] } (ou um array).
// O agente apenas SUGERE. Nada é publicado sozinho: o comitê revisa, edita e envia.
// ---------------------------------------------------------------------------

export interface Fonte {
  veiculo: string;
  link: string;
  /** Data de publicação (ISO 8601). */
  data: string;
}

export type Selo = "pronto" | "checar";

export interface Ideia {
  id: string;
  /** Ângulo / título curto da ideia. */
  titulo: string;
  /** Público-alvo: ["Todos"] ou nomes de grupos da comunidade. */
  publico: string[];
  /** Mensagem pronta para o WhatsApp (com quebras de linha). */
  mensagem: string;
  fontes: Fonte[];
  persona?: string;
  eixo?: string;
  selo: Selo;
  porqueAgora?: string;
}

export interface PautaResultado {
  semana: string | null;
  ideias: Ideia[];
  exemplo: boolean;
  atualizadoEm: string | null;
}

const EXEMPLOS: Ideia[] = [
  {
    id: "ex1",
    titulo: "Flip 2026 em Paraty: cultura é desenvolvimento",
    publico: ["Cultura com o Pelli", "Costa Verde"],
    persona: "Cultura",
    eixo: "Cultura",
    porqueAgora: "A Flip 2026 acontece esta semana em Paraty (Costa Verde).",
    mensagem:
      "🎭 *A Flip é a prova viva de que cultura é desenvolvimento.*\n\nComeça em Paraty a Festa Literária Internacional, um dos maiores encontros de literatura do país, aqui no nosso Rio. 📚\n\nComo professor, vejo de perto: cultura não é gasto, é investimento. Move a economia, gera emprego, atrai turismo e forma gente que pensa.\n\nUm estado que valoriza sua cultura aposta no próprio futuro. Vamos juntos defender a cultura fluminense como direito e como caminho.\n\nQual autor ou autora do Rio não pode faltar na sua estante? 👇",
    fontes: [
      {
        veiculo: "O Dia",
        data: "2026-07-22",
        link: "https://news.google.com/rss/articles/CBMitwFBVV95cUxOQXd4U1o0eExCS01ILTVCSnVDYW9TVnR2a0o0ODlIM0l2YzgwblpmaGwyRXU2UzdNRWdRYW9IdkpBQ1ZjdktjWWVLc3k5cG5jSnZNZllsZm04VnVfWFExLXZKRHdvdHhGOFA3YnpoRFl3Q3h5SUQtUUdfMS1jaFV1LUpmM1NlQVRVanVPVkxtUDRLZDlTcVk0QVRKaVV1c1hfUGo0ai15M1FqNEhNc2lDQzBwQ0Nwbm8?oc=5",
      },
    ],
    selo: "pronto",
  },
  {
    id: "ex2",
    titulo: "Conhecimento vira desenvolvimento: educação no centro",
    publico: ["Todos", "Educação com o Pelli"],
    persona: "Professor-Gestor",
    eixo: "Educação",
    porqueAgora: "Debate público esta semana sobre o desenvolvimento do Brasil.",
    mensagem:
      "🚀 *Conhecimento é o que separa um país que sonha de um país que constrói.*\n\nEssa semana teve debate sobre por que o Brasil ainda não virou uma superpotência. Pra mim, a resposta passa por um lugar só: a *sala de aula*.\n\nNenhuma nação se desenvolveu sem investir pesado em educação, ciência e tecnologia. É assim que conhecimento vira emprego, inovação e soberania.\n\nO Rio tem talento de sobra. Falta um Estado que coloque a educação no centro. É por isso que eu tô nessa.\n\nO que falta pro Rio virar referência em ciência e tecnologia? 👇",
    fontes: [
      {
        veiculo: "Mshale",
        data: "2026-07-22",
        link: "https://news.google.com/rss/articles/CBMiW0FVX3lxTE5oOUg1RkVRaERJVWhsbWZYdzRZUGVCNURsdXp0Vm1yNmdUN0k4Wm9yN2FCWHlBRklldGt2ak5zYVUwbXJXTGVyaTRFZkRNN1hRdm96VEVGSTRIQm8?oc=5",
      },
    ],
    selo: "pronto",
  },
  {
    id: "ex3",
    titulo: "Energia é soberania e emprego para o fluminense",
    publico: ["Todos"],
    persona: "Construtor",
    eixo: "Outros eixos",
    porqueAgora: "Debate sobre um pacto pela energia soberana no Rio, 27/07.",
    mensagem:
      "⚡ *Energia é soberania. E soberania é projeto de país.*\n\nRolou no Rio um debate sobre a urgência de um pacto pela energia nacional e soberana. Parece distante, mas mexe com a sua conta de luz, com o emprego e com a nossa indústria.\n\nO Rio é um estado de energia: petróleo, gás e cada vez mais renováveis. Não podemos ser só quem extrai. Temos que ser quem transforma e gera emprego aqui dentro.\n\nDefender a nossa energia é defender o trabalho do fluminense.\n\nVocê sente no bolso o preço da energia hoje? 👇",
    fontes: [
      {
        veiculo: "Senge RJ",
        data: "2026-07-27",
        link: "https://news.google.com/rss/articles/CBMi1AFBVV95cUxOLXNFMHNBT0lVU3NkNjFQaUVLX0tGT01zR2hOY0VOU01FeU1TYW9CYjhzamx0TFFaMUpjUUlEdldUVHBMRUF0Q3RNYmpKQVFrMGxzSXZFSUU0QjNBWHZlaDBvX2FKVEIyUnBFbUhGRVQ4Zk9ULTRrVk4yTmtaMjdUWGNkc29McmNuN0tZUFpvNWRtaTNadUdiM3hFQ0RCd0ZfLUtLMUVJb1pxVlNYSFdjNTQtTVRJTXJtZXVHTW1BYjFYMXdwUzdOVWg3dTBvU3hraVNueQ?oc=5",
      },
    ],
    selo: "pronto",
  },
  {
    id: "ex4",
    titulo: "Leitura de cenário: Quaest para o Senado (uso interno)",
    publico: ["Uso interno (Politburo)"],
    eixo: "Cenário",
    porqueAgora: "Pesquisa Quaest divulgada em 27/07.",
    mensagem:
      "🔒 *Uso interno, não publicar na comunidade.*\n\nPesquisa Quaest desta semana para o Senado no RJ: Benedita da Silva (PT) com 11% e Marcelo Crivella (Republicanos) com 8% lideram a disputa pelas duas vagas.\n\nÉ contexto pra coordenação, não vira post: é corrida de Senado (não a do Pelli) e citar mexe com adversários. Serve pra leitura de cenário e alinhamento de discurso.",
    fontes: [
      {
        veiculo: "Band / Quaest",
        data: "2026-07-27",
        link: "https://news.google.com/rss/articles/CBMizAFBVV95cUxNSEJNTGtjVFFhQ0FDc1NtV0JaQjJNOVE4WU9BVzdmVlFWVWx6aG1ja2o1UUxvWlhVcFowVkR4c2FwMUdsaF9qcTVMYzVBS19ieVhzdjRkWG00RlBWeWV5REctU0VxcjlnRFpveTU2alJQMHlVMXNBYktmRjUtZHBPYVlGY1VMaWsyYWNpZEFNY1NZLW84QkpsWXU1QW82YW5hRWU3T2kzUVhBTk5kNlUycTllVzRVNjNLWVJMLWtXZzhFYjEwMnlaSDVEOEw?oc=5",
      },
    ],
    selo: "checar",
  },
];

export async function getPauta(): Promise<PautaResultado> {
  const url = process.env.PAUTA_FEED_URL;
  if (url) {
    try {
      // `force-cache` torna o fetch estático (resolvido no build) — compatível
      // com `output: export` do GitHub Pages. A pauta é um snapshot do deploy;
      // para atualizar, basta republicar (o workflow do n8n roda toda segunda).
      const res = await fetch(url, { cache: "force-cache" });
      if (res.ok) {
        const data = await res.json();
        const ideias: Ideia[] = Array.isArray(data) ? data : (data.ideias ?? []);
        return {
          ideias,
          exemplo: false,
          semana: Array.isArray(data) ? null : (data.semana ?? null),
          atualizadoEm: Array.isArray(data) ? null : (data.atualizadoEm ?? null),
        };
      }
    } catch {
      // cai no fallback de exemplos
    }
  }
  return {
    ideias: EXEMPLOS,
    exemplo: true,
    semana: "28/07 a 03/08/2026",
    atualizadoEm: null,
  };
}

/** Lista de públicos distintos (para os filtros), com "Todos" sempre primeiro. */
export function publicosDe(ideias: Ideia[]): string[] {
  const s = new Set<string>();
  for (const i of ideias) for (const g of i.publico) s.add(g);
  return [...s].sort((a, b) =>
    a === "Todos" ? -1 : b === "Todos" ? 1 : a.localeCompare(b, "pt-BR"),
  );
}
