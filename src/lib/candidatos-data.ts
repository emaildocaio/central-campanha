// ---------------------------------------------------------------------------
// Camada de dados dos candidatos rastreados (Renato + parceiros/dobradas).
// Datasets gerados por scripts/gerar-candidatos.mjs — votos por bairro/zona/
// município por candidato×ano, a partir das seções do TSE.
// ---------------------------------------------------------------------------
import type { CandidatoAnoDados } from "@/components/mapa-eleicao-multi";

import renato2022 from "@/data/eleicoes/candidatos/renato-pellizzari-2022.json";
import renato2024 from "@/data/eleicoes/candidatos/renato-pellizzari-2024.json";
import freixo2018 from "@/data/eleicoes/candidatos/marcelo-freixo-2018.json";
import freixo2022 from "@/data/eleicoes/candidatos/marcelo-freixo-2022.json";
import reimont2018 from "@/data/eleicoes/candidatos/reimont-2018.json";
import reimont2020 from "@/data/eleicoes/candidatos/reimont-2020.json";
import reimont2022 from "@/data/eleicoes/candidatos/reimont-2022.json";
import renan2018 from "@/data/eleicoes/candidatos/renan-ferreirinha-2018.json";
import renan2022 from "@/data/eleicoes/candidatos/renan-ferreirinha-2022.json";
import martha2018 from "@/data/eleicoes/candidatos/martha-rocha-2018.json";
import martha2022 from "@/data/eleicoes/candidatos/martha-rocha-2022.json";
import tatiana2018 from "@/data/eleicoes/candidatos/tatiana-roque-2018.json";
import tatiana2022 from "@/data/eleicoes/candidatos/tatiana-roque-2022.json";
import tatiana2024 from "@/data/eleicoes/candidatos/tatiana-roque-2024.json";
import heloisa2022 from "@/data/eleicoes/candidatos/heloisa-helena-2022.json";
import heloisa2024 from "@/data/eleicoes/candidatos/heloisa-helena-2024.json";

type ComAno = CandidatoAnoDados & { ano: number };

const TODOS = [
  renato2022, renato2024, freixo2018, freixo2022, reimont2018, reimont2020, reimont2022,
  renan2018, renan2022, martha2018, martha2022, tatiana2018, tatiana2022, tatiana2024,
  heloisa2022, heloisa2024,
] as unknown as ComAno[];

// Ordem de exibição no seletor: Renato primeiro, depois os parceiros.
const ORDEM = [
  "renato-pellizzari", "marcelo-freixo", "reimont", "renan-ferreirinha",
  "martha-rocha", "tatiana-roque", "heloisa-helena",
];
const ordem = (slug: string) => {
  const i = ORDEM.indexOf(slug);
  return i < 0 ? 999 : i;
};

// Situação (eleito/suplente/não eleito) por candidato×ano. Fontes oficiais:
//  • 2022/2024 — TSE (candidato_munzona, campo DS_SIT_TOT_TURNO).
//  • 2018 estaduais — ALERJ, Lista de deputados da 12ª legislatura (eleitos 2018).
//  • 2018 federais — Câmara dos Deputados / 56ª legislatura (Freixo eleito; Reimont
//    e Tatiana não assumiram = suplentes).
//  • 2020 — vereadores eleitos na cidade do Rio (Reimont, PT, reeleito).
const SITUACAO: Record<string, "Eleito" | "Suplente" | "Não eleito"> = {
  "marcelo-freixo-2018": "Eleito",
  "reimont-2018": "Suplente",
  "renan-ferreirinha-2018": "Eleito",
  "martha-rocha-2018": "Eleito",
  "tatiana-roque-2018": "Suplente",
  "reimont-2020": "Eleito",
  "renato-pellizzari-2022": "Suplente",
  "marcelo-freixo-2022": "Não eleito",
  "reimont-2022": "Eleito",
  "renan-ferreirinha-2022": "Suplente",
  "martha-rocha-2022": "Eleito",
  "tatiana-roque-2022": "Suplente",
  "heloisa-helena-2022": "Suplente",
  "renato-pellizzari-2024": "Suplente",
  "tatiana-roque-2024": "Eleito",
  "heloisa-helena-2024": "Suplente",
};

/** Candidatos rastreados que concorreram no ano (ordenados p/ o seletor). */
export function getCandidatosAno(ano: number): CandidatoAnoDados[] {
  return TODOS.filter((c) => c.ano === ano)
    .sort((a, b) => ordem(a.slug) - ordem(b.slug))
    .map((c) => ({ ...c, situacao: SITUACAO[`${c.slug}-${c.ano}`] }));
}

/** Anos com pelo menos um candidato rastreado. */
export function getAnosComCandidatos(): number[] {
  return [...new Set(TODOS.map((c) => c.ano))].sort((a, b) => a - b);
}
