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

/** Candidatos rastreados que concorreram no ano (ordenados p/ o seletor). */
export function getCandidatosAno(ano: number): CandidatoAnoDados[] {
  return TODOS.filter((c) => c.ano === ano).sort((a, b) => ordem(a.slug) - ordem(b.slug));
}

/** Anos com pelo menos um candidato rastreado. */
export function getAnosComCandidatos(): number[] {
  return [...new Set(TODOS.map((c) => c.ano))].sort((a, b) => a - b);
}
