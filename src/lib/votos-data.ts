import { bairrosGeo, type BairroGeo } from "./rio-bairros-geo";
import { municipiosGeo } from "./rj-municipios-geo";
import zonasJson from "@/data/eleicoes/renato-zonas.json";
import metaJson from "@/data/eleicoes/meta.json";
import municipiosJson from "@/data/eleicoes/renato-municipios-2022.json";
import rankingJson from "@/data/eleicoes/ranking-zonas.json";
import bairros2022Json from "@/data/eleicoes/renato-bairros-2022.json";
import bairros2024Json from "@/data/eleicoes/renato-bairros-2024.json";
import locais2022Json from "@/data/eleicoes/renato-locais-bairro-2022.json";
import locais2024Json from "@/data/eleicoes/renato-locais-bairro-2024.json";

// ---------------------------------------------------------------------------
// Camada de dados eleitorais — fonte: arquivos OFICIAIS do TSE, processados
// por scripts/processar-tse.mjs (ver src/data/eleicoes/*.json).
// Substitui as transcrições de prints que existiam em votos-raw.ts.
// ---------------------------------------------------------------------------

export type AnoEleicao = 2022 | 2024;

/** Votação do candidato em uma zona eleitoral da cidade do Rio, com contexto. */
export interface ZonaVoto {
  zona: number;
  bairro: string;
  votos: number;
  /** Fração sobre os votos válidos da zona (compatível com o campo antigo `pct`). */
  pct: number;
  pctValidos: number;
  pctComparecimento: number;
  validosZona: number;
  comparecimentoZona: number;
  aptosZona: number;
  abstencaoZona: number;
  legendaZona: number;
  brancosZona: number;
  nulosZona: number;
}

/** Votação do candidato em um município do RJ (eleição estadual de 2022). */
export interface MunicipioVoto {
  cdTse: string;
  nome: string;
  nomeOficial: string;
  ibge: string | null;
  regiao: string | null;
  votos: number;
  validos: number;
  pctValidos: number;
}

/** Votação do candidato em um local de votação (agregado das seções). */
export interface LocalVoto {
  zona: number;
  bairro: string;
  nrLocal: string;
  nome: string;
  endereco: string;
  votos: number;
}

/** Concorrência por zona: posição do candidato e os mais votados do cargo. */
export interface RankingZona {
  totalCandidatos: number;
  posicaoRenato: number | null;
  votosRenato: number;
  top: { posicao: number; nome: string; urna: string; partido: string; votos: number }[];
}

export interface EleicaoMeta {
  ano: AnoEleicao;
  cargo: string;
  resumo: string;
  totalVotos: number;        // votos na cidade do Rio (foco do mapa)
  totalEstado: number;       // votos em todo o RJ (relevante na eleição estadual)
  pctCidade: number;         // fração sobre os votos válidos da cidade
  totalZonas: number;
  totalBairros: number;
  municipiosComVoto: number;
  comparecimentoCidade: number;
  validosCidade: number;
}

/** Quebra da votação de um bairro por zona eleitoral (bairro cruza zonas). */
export interface BairroZonaVoto {
  zona: number;
  votos: number;
  /** Votos do bairro nessa zona ÷ votos válidos da zona. */
  pct: number;
}

export interface BairroVotos extends BairroGeo {
  votos: number;
  pctDoTotal: number;
  zonas: BairroZonaVoto[];
}

// --- Tipagem dos JSONs importados -----------------------------------------
type ZonasRaw = Record<string, Omit<ZonaVoto, "pct">[]>;
type MetaRaw = Record<
  string,
  {
    cargo: string;
    totalEstado: number;
    totalCapital: number;
    municipiosComVoto: number;
    zonasCapital: number;
    bairrosComVoto: number;
    validosCapital: number;
    comparecimentoCapital: number;
    pctValidosCapital: number;
  }
>;
type RankingRaw = Record<string, Record<string, RankingZona>>;

const ZONAS = zonasJson as ZonasRaw;
const META = metaJson as MetaRaw;
const RANKING = rankingJson as RankingRaw;

// Votos por bairro REAIS (CEP do TSE × base RUACEP) — ver scripts/locais-bairro.mjs
type BairroAggRaw = { bairro: string; votos: number; totalCargo: number; locais: number; pctNoBairro: number };
const BAIRROS: Record<AnoEleicao, BairroAggRaw[]> = {
  2022: bairros2022Json as BairroAggRaw[],
  2024: bairros2024Json as BairroAggRaw[],
};
const LOCAIS_BAIRRO: Record<AnoEleicao, LocalVoto[]> = {
  2022: locais2022Json as LocalVoto[],
  2024: locais2024Json as LocalVoto[],
};
const chaveBairro = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();

const RESUMO: Record<AnoEleicao, string> = {
  2022: "Votos por zona eleitoral na cidade do Rio de Janeiro — Deputado Estadual, 2022. O candidato também recebeu votos em todo o estado (ver votação por município).",
  2024: "Votos por zona eleitoral na cidade do Rio de Janeiro — Vereador, 2024.",
};

// --- Seletores --------------------------------------------------------------

/** Zonas do candidato no ano, já ordenadas da maior para a menor votação. */
export function getZonas(ano: AnoEleicao): ZonaVoto[] {
  return (ZONAS[String(ano)] ?? [])
    .map((z) => ({ ...z, pct: z.pctValidos }))
    .sort((a, b) => b.votos - a.votos);
}

export function getMeta(ano: AnoEleicao): EleicaoMeta {
  const m = META[String(ano)];
  return {
    ano,
    cargo: m.cargo,
    resumo: RESUMO[ano],
    totalVotos: m.totalCapital,
    totalEstado: m.totalEstado,
    pctCidade: m.pctValidosCapital,
    totalZonas: m.zonasCapital,
    totalBairros: getBairros(ano).filter((b) => b.votos > 0).length,
    municipiosComVoto: m.municipiosComVoto,
    comparecimentoCidade: m.comparecimentoCapital,
    validosCidade: m.validosCapital,
  };
}

/**
 * Todos os bairros da cidade com a votação REAL agregada (0 onde não há voto).
 * Fonte: votos por local de votação (TSE) com o bairro obtido por CEP × RUACEP,
 * não mais o antigo rótulo bairro-sede da zona. Cada bairro pode cruzar zonas.
 */
export function getBairros(ano: AnoEleicao): BairroVotos[] {
  const votosPorBairro = new Map<string, number>();
  for (const b of BAIRROS[ano]) votosPorBairro.set(chaveBairro(b.bairro), b.votos);
  const total = BAIRROS[ano].reduce((s, b) => s + b.votos, 0);

  // quebra por zona (a partir dos locais): bairro -> { zona -> votos }
  const validosPorZona = new Map(getZonas(ano).map((z) => [z.zona, z.validosZona]));
  const zonasPorBairro = new Map<string, Map<number, number>>();
  for (const l of LOCAIS_BAIRRO[ano]) {
    if (!l.bairro || l.votos <= 0) continue;
    const k = chaveBairro(l.bairro);
    let zm = zonasPorBairro.get(k);
    if (!zm) { zm = new Map(); zonasPorBairro.set(k, zm); }
    zm.set(l.zona, (zm.get(l.zona) ?? 0) + l.votos);
  }
  const zonasDoBairro = (k: string): BairroZonaVoto[] => {
    const zm = zonasPorBairro.get(k);
    if (!zm) return [];
    return [...zm.entries()]
      .map(([zona, votos]) => {
        const val = validosPorZona.get(zona) ?? 0;
        return { zona, votos, pct: val ? votos / val : 0 };
      })
      .sort((a, b) => b.votos - a.votos);
  };

  const usados = new Set<string>();
  const out: BairroVotos[] = bairrosGeo.map((g) => {
    const k = chaveBairro(g.nome);
    usados.add(k);
    const votos = votosPorBairro.get(k) ?? 0;
    return { ...g, votos, pctDoTotal: total ? votos / total : 0, zonas: zonasDoBairro(k) };
  });
  // bairros reais sem geometria oficial (raríssimo) — entram p/ não perder votos
  for (const b of BAIRROS[ano]) {
    const k = chaveBairro(b.bairro);
    if (usados.has(k) || b.votos <= 0) continue;
    usados.add(k);
    out.push({
      nome: b.bairro, ra: "—", rp: "—", d: "", cx: 0, cy: 0,
      votos: b.votos, pctDoTotal: total ? b.votos / total : 0, zonas: zonasDoBairro(k),
    });
  }
  return out;
}

export function getMaxVotosBairro(ano: AnoEleicao): number {
  let max = 0;
  for (const b of getBairros(ano)) if (b.votos > max) max = b.votos;
  return max;
}

/** Votação por município no estado (eleição estadual de 2022). */
export function getMunicipios2022(): MunicipioVoto[] {
  return municipiosJson as MunicipioVoto[];
}

/** Votação por município agregada por região (2022). */
export function getRegioes2022(): { regiao: string; votos: number; municipios: number }[] {
  const acc = new Map<string, { votos: number; municipios: number }>();
  for (const m of getMunicipios2022()) {
    if (m.votos <= 0) continue;
    const r = m.regiao ?? "Sem região";
    const cur = acc.get(r) ?? { votos: 0, municipios: 0 };
    cur.votos += m.votos;
    cur.municipios += 1;
    acc.set(r, cur);
  }
  return [...acc.entries()]
    .map(([regiao, v]) => ({ regiao, ...v }))
    .sort((a, b) => b.votos - a.votos);
}

/** Locais de votação do candidato na cidade do Rio (2022), por votos. */
export function getLocais2022(limite?: number): LocalVoto[] {
  const l = LOCAIS_BAIRRO[2022];
  return limite ? l.slice(0, limite) : l;
}

/** Concorrência em uma zona específica (posição do candidato e mais votados). */
export function getRankingZona(ano: AnoEleicao, zona: number): RankingZona | null {
  return RANKING[String(ano)]?.[String(zona)] ?? null;
}

// --- Mapa do estado (2022) + integração com dados de planejamento ----------

const normNome = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();

export interface MunicipioMapa extends MunicipioVoto {
  d: string;
  cx: number;
  cy: number;
}

/** Municípios de 2022 com a geometria SVG do estado acoplada (para o mapa). */
export function getMunicipios2022ComGeo(): MunicipioMapa[] {
  const geoPorChave = new Map(municipiosGeo.map((g) => [g.chave, g]));
  return getMunicipios2022()
    .map((m) => {
      const g = geoPorChave.get(normNome(m.nome));
      return { ...m, d: g?.d ?? "", cx: g?.cx ?? 0, cy: g?.cy ?? 0 };
    })
    .filter((m) => m.d);
}

/** Mapa nome-normalizado -> votos do candidato em 2022 (para cruzar com outras fontes). */
export function getVotos2022PorNome(): Map<string, number> {
  return new Map(getMunicipios2022().map((m) => [normNome(m.nome), m.votos]));
}
