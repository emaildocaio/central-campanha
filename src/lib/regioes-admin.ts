import { bairrosGeo } from "./rio-bairros-geo";

// ---------------------------------------------------------------------------
// "De Para" geográfico — Região Administrativa (RA) -> bairros.
// Cidade do Rio de Janeiro: 33 RAs oficiais, 163 bairros (fonte: Data.Rio).
// O campo `ra` dos bairros vem em caixa-alta sem acento; aqui mapeamos para a
// grafia oficial (número romano + nome) e ordenamos pela numeração da RA.
// ---------------------------------------------------------------------------

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();

const RA_INFO: Record<string, { ordem: number; numero: string; nome: string }> = {
  PORTUARIA: { ordem: 1, numero: "I", nome: "Portuária" },
  CENTRO: { ordem: 2, numero: "II", nome: "Centro" },
  "RIO COMPRIDO": { ordem: 3, numero: "III", nome: "Rio Comprido" },
  BOTAFOGO: { ordem: 4, numero: "IV", nome: "Botafogo" },
  COPACABANA: { ordem: 5, numero: "V", nome: "Copacabana" },
  LAGOA: { ordem: 6, numero: "VI", nome: "Lagoa" },
  "SAO CRISTOVAO": { ordem: 7, numero: "VII", nome: "São Cristóvão" },
  TIJUCA: { ordem: 8, numero: "VIII", nome: "Tijuca" },
  "VILA ISABEL": { ordem: 9, numero: "IX", nome: "Vila Isabel" },
  RAMOS: { ordem: 10, numero: "X", nome: "Ramos" },
  PENHA: { ordem: 11, numero: "XI", nome: "Penha" },
  INHAUMA: { ordem: 12, numero: "XII", nome: "Inhaúma" },
  MEIER: { ordem: 13, numero: "XIII", nome: "Méier" },
  IRAJA: { ordem: 14, numero: "XIV", nome: "Irajá" },
  MADUREIRA: { ordem: 15, numero: "XV", nome: "Madureira" },
  JACAREPAGUA: { ordem: 16, numero: "XVI", nome: "Jacarepaguá" },
  BANGU: { ordem: 17, numero: "XVII", nome: "Bangu" },
  "CAMPO GRANDE": { ordem: 18, numero: "XVIII", nome: "Campo Grande" },
  "SANTA CRUZ": { ordem: 19, numero: "XIX", nome: "Santa Cruz" },
  "ILHA DO GOVERNADOR": { ordem: 20, numero: "XX", nome: "Ilha do Governador" },
  PAQUETA: { ordem: 21, numero: "XXI", nome: "Paquetá" },
  ANCHIETA: { ordem: 22, numero: "XXII", nome: "Anchieta" },
  "SANTA TEREZA": { ordem: 23, numero: "XXIII", nome: "Santa Teresa" },
  "BARRA DA TIJUCA": { ordem: 24, numero: "XXIV", nome: "Barra da Tijuca" },
  PAVUNA: { ordem: 25, numero: "XXV", nome: "Pavuna" },
  GUARATIBA: { ordem: 26, numero: "XXVI", nome: "Guaratiba" },
  ROCINHA: { ordem: 27, numero: "XXVII", nome: "Rocinha" },
  JACAREZINHO: { ordem: 28, numero: "XXVIII", nome: "Jacarezinho" },
  "COMPLEXO DO ALEMAO": { ordem: 29, numero: "XXIX", nome: "Complexo do Alemão" },
  "COMPLEXO DA MARE": { ordem: 30, numero: "XXX", nome: "Maré" },
  "VIGARIO GERAL": { ordem: 31, numero: "XXXI", nome: "Vigário Geral" },
  REALENGO: { ordem: 32, numero: "XXXII", nome: "Realengo" },
  "CIDADE DE DEUS": { ordem: 33, numero: "XXXIII", nome: "Cidade de Deus" },
};

const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

export interface RegiaoAdmin {
  chave: string;
  numero: string;
  nome: string;
  ordem: number;
  bairros: string[];
}

/** Regiões administrativas da cidade do Rio com seus bairros (ordenadas pela RA). */
export function getRegioesAdmin(): RegiaoAdmin[] {
  const map = new Map<string, string[]>();
  for (const b of bairrosGeo) {
    const chave = norm(b.ra);
    const arr = map.get(chave);
    if (arr) arr.push(b.nome);
    else map.set(chave, [b.nome]);
  }
  return [...map.entries()]
    .map(([chave, bairros]) => {
      const info = RA_INFO[chave];
      return {
        chave,
        numero: info?.numero ?? "",
        nome: info?.nome ?? titleCase(chave),
        ordem: info?.ordem ?? 999,
        bairros: bairros.sort((a, b) => a.localeCompare(b, "pt-BR")),
      };
    })
    .sort((a, b) => a.ordem - b.ordem);
}

export function getTotaisDePara(): { regioes: number; bairros: number } {
  return { regioes: new Set(bairrosGeo.map((b) => norm(b.ra))).size, bairros: bairrosGeo.length };
}

/** Mapa nome do bairro -> sua região administrativa (número + nome). */
export function getBairroParaRA(): Map<string, { numero: string; nome: string }> {
  const m = new Map<string, { numero: string; nome: string }>();
  for (const ra of getRegioesAdmin()) {
    for (const bairro of ra.bairros) m.set(bairro, { numero: ra.numero, nome: ra.nome });
  }
  return m;
}
