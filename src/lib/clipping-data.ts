// ---------------------------------------------------------------------------
// Clipping de notícias — camada de dados.
// As notícias são coletadas por um fluxo do n8n (Google News, 2x/dia,
// incremental) e expostas como JSON. O painel lê desse feed via a variável de
// ambiente CLIPPING_FEED_URL; sem ela, mostra exemplos para visualizar o layout.
// Contrato esperado do feed: { atualizadoEm?: string, noticias: Noticia[] }
//   (ou simplesmente um array de Noticia).
// ---------------------------------------------------------------------------

export interface Noticia {
  id: string;
  titulo: string;
  link: string;
  fonte: string;
  /** Data de publicação (ISO 8601). */
  data: string;
  palavraChave: string;
}

export interface ClippingResultado {
  noticias: Noticia[];
  exemplo: boolean;
  atualizadoEm: string | null;
}

const EXEMPLOS: Noticia[] = [
  {
    id: "ex1",
    titulo: "Renato Pellizzari participa de plenária com lideranças na Baixada Fluminense",
    link: "https://news.google.com/search?q=%22Renato%20Pellizzari%22&hl=pt-BR&gl=BR&ceid=BR:pt-BR",
    fonte: "Exemplo · G1",
    data: "2026-05-29",
    palavraChave: "Renato Pellizzari",
  },
  {
    id: "ex2",
    titulo: "Pré-candidatos a deputado estadual intensificam agenda na Região dos Lagos",
    link: "https://news.google.com/search?q=%22Renato%20Pellizzari%22&hl=pt-BR&gl=BR&ceid=BR:pt-BR",
    fonte: "Exemplo · O Globo",
    data: "2026-05-24",
    palavraChave: "Renato Pellizzari",
  },
  {
    id: "ex3",
    titulo: "PSB define estratégia para as eleições de 2026 no Rio de Janeiro",
    link: "https://news.google.com/search?q=%22Renato%20Pellizzari%22&hl=pt-BR&gl=BR&ceid=BR:pt-BR",
    fonte: "Exemplo · Extra",
    data: "2026-05-18",
    palavraChave: "Renato Pellizzari",
  },
];

export async function getClipping(): Promise<ClippingResultado> {
  const url = process.env.CLIPPING_FEED_URL;
  if (url) {
    try {
      // `force-cache` torna o fetch estático (resolvido no build) — compatível com
      // `output: export` do GitHub Pages. O clipping é um snapshot do momento do
      // deploy; para atualizá-lo, basta republicar (push na main / re-run do deploy).
      const res = await fetch(url, { cache: "force-cache" });
      if (res.ok) {
        const data = await res.json();
        const noticias: Noticia[] = Array.isArray(data) ? data : (data.noticias ?? []);
        return {
          noticias: ordenar(noticias),
          exemplo: false,
          atualizadoEm: Array.isArray(data) ? null : (data.atualizadoEm ?? null),
        };
      }
    } catch {
      // cai no fallback de exemplos
    }
  }
  return { noticias: ordenar(EXEMPLOS), exemplo: true, atualizadoEm: null };
}

function ordenar(noticias: Noticia[]): Noticia[] {
  return [...noticias].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );
}

/** Palavras-chave identificadas no texto de uma notícia (o campo pode ter várias, separadas por vírgula). */
export function tagsDe(noticia: Noticia): string[] {
  return noticia.palavraChave
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function palavrasChaveDe(noticias: Noticia[]): string[] {
  const set = new Set<string>();
  for (const n of noticias) for (const p of tagsDe(n)) set.add(p);
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function fontesDe(noticias: Noticia[]): number {
  return new Set(noticias.map((n) => n.fonte)).size;
}
