import { diasAte } from "./format";
import { getVotos2022PorNome } from "./votos-data";
import type {
  Apoiador,
  Campanha,
  Despesa,
  Evento,
  Municipio,
  Receita,
  Regiao,
} from "./types";

const normMun = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();

// ---------------------------------------------------------------------------
// DADOS DE EXEMPLO (mock). Estrutura espelha as tabelas do Supabase em
// /supabase/schema.sql — trocar estas constantes por consultas ao banco
// quando conectar o Supabase real (ver README).
// ---------------------------------------------------------------------------

export const campanha: Campanha = {
  candidato: "Renato Pellizzari",
  cargo: "Deputado Estadual",
  partido: "PSB",
  numero: "40004",
  estado: "Rio de Janeiro",
  dataEleicao: "2026-10-04",
  metaVotos: 65_000,
  limiteGastoTSE: 1_150_000,
};

export const municipios: Municipio[] = [
  // Metropolitana
  { id: "rio", nome: "Rio de Janeiro", regiao: "Metropolitana", eleitorado: 4_800_000, metaVotos: 12_000, votosProjetados: 8_200, lideres: 14 },
  { id: "niteroi", nome: "Niterói", regiao: "Metropolitana", eleitorado: 400_000, metaVotos: 4_500, votosProjetados: 3_600, lideres: 6 },
  { id: "sao-goncalo", nome: "São Gonçalo", regiao: "Metropolitana", eleitorado: 780_000, metaVotos: 5_000, votosProjetados: 3_800, lideres: 7 },
  { id: "marica", nome: "Maricá", regiao: "Metropolitana", eleitorado: 140_000, metaVotos: 2_200, votosProjetados: 2_400, lideres: 4 },
  { id: "itaborai", nome: "Itaboraí", regiao: "Metropolitana", eleitorado: 180_000, metaVotos: 1_600, votosProjetados: 1_100, lideres: 3 },
  { id: "mage", nome: "Magé", regiao: "Metropolitana", eleitorado: 180_000, metaVotos: 1_500, votosProjetados: 950, lideres: 2 },
  { id: "itaguai", nome: "Itaguaí", regiao: "Metropolitana", eleitorado: 100_000, metaVotos: 900, votosProjetados: 700, lideres: 2 },
  { id: "seropedica", nome: "Seropédica", regiao: "Metropolitana", eleitorado: 65_000, metaVotos: 700, votosProjetados: 520, lideres: 1 },
  // Baixada Fluminense
  { id: "caxias", nome: "Duque de Caxias", regiao: "Baixada Fluminense", eleitorado: 640_000, metaVotos: 3_500, votosProjetados: 2_300, lideres: 5 },
  { id: "nova-iguacu", nome: "Nova Iguaçu", regiao: "Baixada Fluminense", eleitorado: 620_000, metaVotos: 3_200, votosProjetados: 2_100, lideres: 5 },
  { id: "belford-roxo", nome: "Belford Roxo", regiao: "Baixada Fluminense", eleitorado: 370_000, metaVotos: 2_000, votosProjetados: 1_250, lideres: 3 },
  { id: "meriti", nome: "São João de Meriti", regiao: "Baixada Fluminense", eleitorado: 340_000, metaVotos: 1_800, votosProjetados: 1_150, lideres: 3 },
  { id: "mesquita", nome: "Mesquita", regiao: "Baixada Fluminense", eleitorado: 135_000, metaVotos: 1_000, votosProjetados: 760, lideres: 2 },
  { id: "nilopolis", nome: "Nilópolis", regiao: "Baixada Fluminense", eleitorado: 125_000, metaVotos: 900, votosProjetados: 690, lideres: 2 },
  { id: "queimados", nome: "Queimados", regiao: "Baixada Fluminense", eleitorado: 110_000, metaVotos: 800, votosProjetados: 540, lideres: 1 },
  // Região dos Lagos
  { id: "cabo-frio", nome: "Cabo Frio", regiao: "Região dos Lagos", eleitorado: 170_000, metaVotos: 2_600, votosProjetados: 2_700, lideres: 6 },
  { id: "araruama", nome: "Araruama", regiao: "Região dos Lagos", eleitorado: 100_000, metaVotos: 1_500, votosProjetados: 1_650, lideres: 4 },
  { id: "saquarema", nome: "Saquarema", regiao: "Região dos Lagos", eleitorado: 75_000, metaVotos: 1_200, votosProjetados: 1_300, lideres: 3 },
  { id: "buzios", nome: "Armação dos Búzios", regiao: "Região dos Lagos", eleitorado: 25_000, metaVotos: 700, votosProjetados: 820, lideres: 3 },
  { id: "arraial", nome: "Arraial do Cabo", regiao: "Região dos Lagos", eleitorado: 25_000, metaVotos: 650, votosProjetados: 740, lideres: 3 },
  { id: "sao-pedro", nome: "São Pedro da Aldeia", regiao: "Região dos Lagos", eleitorado: 80_000, metaVotos: 1_100, votosProjetados: 1_180, lideres: 3 },
  { id: "rio-das-ostras", nome: "Rio das Ostras", regiao: "Região dos Lagos", eleitorado: 110_000, metaVotos: 1_300, votosProjetados: 1_240, lideres: 3 },
  // Norte Fluminense
  { id: "campos", nome: "Campos dos Goytacazes", regiao: "Norte Fluminense", eleitorado: 370_000, metaVotos: 2_400, votosProjetados: 1_500, lideres: 4 },
  { id: "macae", nome: "Macaé", regiao: "Norte Fluminense", eleitorado: 180_000, metaVotos: 1_600, votosProjetados: 1_180, lideres: 3 },
  // Noroeste Fluminense
  { id: "itaperuna", nome: "Itaperuna", regiao: "Noroeste Fluminense", eleitorado: 80_000, metaVotos: 900, votosProjetados: 600, lideres: 2 },
  // Serrana
  { id: "petropolis", nome: "Petrópolis", regiao: "Serrana", eleitorado: 240_000, metaVotos: 1_900, votosProjetados: 1_250, lideres: 3 },
  { id: "teresopolis", nome: "Teresópolis", regiao: "Serrana", eleitorado: 140_000, metaVotos: 1_100, votosProjetados: 780, lideres: 2 },
  { id: "friburgo", nome: "Nova Friburgo", regiao: "Serrana", eleitorado: 150_000, metaVotos: 1_200, votosProjetados: 820, lideres: 2 },
  // Médio Paraíba
  { id: "volta-redonda", nome: "Volta Redonda", regiao: "Médio Paraíba", eleitorado: 210_000, metaVotos: 1_800, votosProjetados: 1_200, lideres: 3 },
  { id: "barra-mansa", nome: "Barra Mansa", regiao: "Médio Paraíba", eleitorado: 140_000, metaVotos: 1_100, votosProjetados: 760, lideres: 2 },
  { id: "resende", nome: "Resende", regiao: "Médio Paraíba", eleitorado: 105_000, metaVotos: 900, votosProjetados: 640, lideres: 2 },
  // Costa Verde
  { id: "angra", nome: "Angra dos Reis", regiao: "Costa Verde", eleitorado: 150_000, metaVotos: 1_200, votosProjetados: 820, lideres: 2 },
  { id: "paraty", nome: "Paraty", regiao: "Costa Verde", eleitorado: 35_000, metaVotos: 450, votosProjetados: 300, lideres: 1 },
  // Centro-Sul
  { id: "tres-rios", nome: "Três Rios", regiao: "Centro-Sul", eleitorado: 65_000, metaVotos: 600, votosProjetados: 430, lideres: 1 },
];

export const apoiadores: Apoiador[] = [
  { id: "a01", nome: "Marcos Tavares", tipo: "Liderança", municipio: "Cabo Frio", regiao: "Região dos Lagos", telefone: "(22) 99812-4471", metaVotos: 1200, votosEstimados: 1340, status: "Ativo", responsavel: "Coord. Lagos", ultimoContato: "2026-05-28" },
  { id: "a02", nome: "Patrícia Gomes", tipo: "Liderança", municipio: "Niterói", regiao: "Metropolitana", telefone: "(21) 99654-7782", metaVotos: 1500, votosEstimados: 1280, status: "Ativo", responsavel: "Coord. Capital", ultimoContato: "2026-05-30" },
  { id: "a03", nome: "Cláudio Bittencourt", tipo: "Liderança", municipio: "São Gonçalo", regiao: "Metropolitana", telefone: "(21) 98233-1190", metaVotos: 1400, votosEstimados: 1010, status: "Ativo", responsavel: "Coord. Capital", ultimoContato: "2026-05-22" },
  { id: "a04", nome: "Rosângela Dias", tipo: "Cabo eleitoral", municipio: "Saquarema", regiao: "Região dos Lagos", telefone: "(22) 99471-2238", metaVotos: 600, votosEstimados: 680, status: "Ativo", responsavel: "Coord. Lagos", ultimoContato: "2026-05-29" },
  { id: "a05", nome: "Jorge Almeida", tipo: "Liderança", municipio: "Duque de Caxias", regiao: "Baixada Fluminense", telefone: "(21) 98119-5560", metaVotos: 1300, votosEstimados: 870, status: "Ativo", responsavel: "Coord. Baixada", ultimoContato: "2026-05-18" },
  { id: "a06", nome: "Fernanda Lopes", tipo: "Cabo eleitoral", municipio: "Nova Iguaçu", regiao: "Baixada Fluminense", telefone: "(21) 99002-3341", metaVotos: 700, votosEstimados: 520, status: "Ativo", responsavel: "Coord. Baixada", ultimoContato: "2026-05-25" },
  { id: "a07", nome: "Antônio Carlos Ribeiro", tipo: "Liderança", municipio: "Rio de Janeiro", regiao: "Metropolitana", telefone: "(21) 98877-6610", metaVotos: 2000, votosEstimados: 1450, status: "Ativo", responsavel: "Coord. Capital", ultimoContato: "2026-05-31" },
  { id: "a08", nome: "Beatriz Nogueira", tipo: "Voluntário", municipio: "Rio de Janeiro", regiao: "Metropolitana", telefone: "(21) 99334-8821", metaVotos: 300, votosEstimados: 210, status: "Ativo", responsavel: "Coord. Capital", ultimoContato: "2026-05-27" },
  { id: "a09", nome: "Sérgio Vasconcelos", tipo: "Liderança", municipio: "Maricá", regiao: "Metropolitana", telefone: "(21) 98445-9923", metaVotos: 900, votosEstimados: 1020, status: "Ativo", responsavel: "Coord. Capital", ultimoContato: "2026-05-30" },
  { id: "a10", nome: "Luciana Freitas", tipo: "Liderança", municipio: "Cabo Frio", regiao: "Região dos Lagos", telefone: "(22) 99560-1148", metaVotos: 800, votosEstimados: 760, status: "Ativo", responsavel: "Coord. Lagos", ultimoContato: "2026-05-26" },
  { id: "a11", nome: "Roberto Pinheiro", tipo: "Cabo eleitoral", municipio: "Armação dos Búzios", regiao: "Região dos Lagos", telefone: "(22) 99231-7765", metaVotos: 400, votosEstimados: 470, status: "Ativo", responsavel: "Coord. Lagos", ultimoContato: "2026-05-29" },
  { id: "a12", nome: "Mariana Castro", tipo: "Liderança", municipio: "Arraial do Cabo", regiao: "Região dos Lagos", telefone: "(22) 99118-3320", metaVotos: 450, votosEstimados: 510, status: "Ativo", responsavel: "Coord. Lagos", ultimoContato: "2026-05-28" },
  { id: "a13", nome: "Paulo Henrique Souza", tipo: "Liderança", municipio: "Petrópolis", regiao: "Serrana", telefone: "(24) 99845-2217", metaVotos: 1000, votosEstimados: 690, status: "Ativo", responsavel: "Coord. Serrana", ultimoContato: "2026-05-20" },
  { id: "a14", nome: "Aline Martins", tipo: "Cabo eleitoral", municipio: "Teresópolis", regiao: "Serrana", telefone: "(21) 99710-4456", metaVotos: 500, votosEstimados: 360, status: "Potencial", responsavel: "Coord. Serrana", ultimoContato: "2026-05-12" },
  { id: "a15", nome: "Wagner Oliveira", tipo: "Liderança", municipio: "Volta Redonda", regiao: "Médio Paraíba", telefone: "(24) 99332-8890", metaVotos: 1100, votosEstimados: 740, status: "Ativo", responsavel: "Coord. Interior", ultimoContato: "2026-05-23" },
  { id: "a16", nome: "Daniela Rocha", tipo: "Cabo eleitoral", municipio: "Barra Mansa", regiao: "Médio Paraíba", telefone: "(24) 99201-5512", metaVotos: 500, votosEstimados: 330, status: "Ativo", responsavel: "Coord. Interior", ultimoContato: "2026-05-21" },
  { id: "a17", nome: "Eduardo Lima", tipo: "Liderança", municipio: "Campos dos Goytacazes", regiao: "Norte Fluminense", telefone: "(22) 99876-3301", metaVotos: 1400, votosEstimados: 880, status: "Ativo", responsavel: "Coord. Interior", ultimoContato: "2026-05-19" },
  { id: "a18", nome: "Vanessa Cardoso", tipo: "Cabo eleitoral", municipio: "Macaé", regiao: "Norte Fluminense", telefone: "(22) 99443-1129", metaVotos: 700, votosEstimados: 560, status: "Ativo", responsavel: "Coord. Interior", ultimoContato: "2026-05-24" },
  { id: "a19", nome: "Gustavo Pereira", tipo: "Liderança", municipio: "Belford Roxo", regiao: "Baixada Fluminense", telefone: "(21) 98556-7740", metaVotos: 1000, votosEstimados: 620, status: "Ativo", responsavel: "Coord. Baixada", ultimoContato: "2026-05-17" },
  { id: "a20", nome: "Simone Barbosa", tipo: "Voluntário", municipio: "São João de Meriti", regiao: "Baixada Fluminense", telefone: "(21) 99008-2215", metaVotos: 250, votosEstimados: 180, status: "Potencial", responsavel: "Coord. Baixada", ultimoContato: "2026-05-10" },
  { id: "a21", nome: "Ricardo Mendes", tipo: "Liderança", municipio: "São Pedro da Aldeia", regiao: "Região dos Lagos", telefone: "(22) 99654-9981", metaVotos: 800, votosEstimados: 860, status: "Ativo", responsavel: "Coord. Lagos", ultimoContato: "2026-05-30" },
  { id: "a22", nome: "Tatiane Ferreira", tipo: "Cabo eleitoral", municipio: "Araruama", regiao: "Região dos Lagos", telefone: "(22) 99320-6674", metaVotos: 600, votosEstimados: 700, status: "Ativo", responsavel: "Coord. Lagos", ultimoContato: "2026-05-27" },
  { id: "a23", nome: "Felipe Andrade", tipo: "Voluntário", municipio: "Niterói", regiao: "Metropolitana", telefone: "(21) 99771-3308", metaVotos: 300, votosEstimados: 240, status: "Ativo", responsavel: "Coord. Capital", ultimoContato: "2026-05-26" },
  { id: "a24", nome: "Cristiane Moreira", tipo: "Liderança", municipio: "Rio das Ostras", regiao: "Região dos Lagos", telefone: "(22) 99115-4423", metaVotos: 900, votosEstimados: 820, status: "Ativo", responsavel: "Coord. Lagos", ultimoContato: "2026-05-25" },
  { id: "a25", nome: "Marcelo Teixeira", tipo: "Cabo eleitoral", municipio: "Nova Friburgo", regiao: "Serrana", telefone: "(22) 99887-1102", metaVotos: 600, votosEstimados: 410, status: "Potencial", responsavel: "Coord. Serrana", ultimoContato: "2026-05-09" },
  { id: "a26", nome: "Juliana Santos", tipo: "Liderança", municipio: "Angra dos Reis", regiao: "Costa Verde", telefone: "(24) 99443-7758", metaVotos: 900, votosEstimados: 600, status: "Ativo", responsavel: "Coord. Interior", ultimoContato: "2026-05-22" },
  { id: "a27", nome: "Bruno Carvalho", tipo: "Cabo eleitoral", municipio: "Resende", regiao: "Médio Paraíba", telefone: "(24) 99210-3340", metaVotos: 500, votosEstimados: 360, status: "Ativo", responsavel: "Coord. Interior", ultimoContato: "2026-05-18" },
  { id: "a28", nome: "Adriana Pires", tipo: "Voluntário", municipio: "Cabo Frio", regiao: "Região dos Lagos", telefone: "(22) 99662-1187", metaVotos: 200, votosEstimados: 160, status: "Ativo", responsavel: "Coord. Lagos", ultimoContato: "2026-05-28" },
  { id: "a29", nome: "Leonardo Azevedo", tipo: "Liderança", municipio: "Itaboraí", regiao: "Metropolitana", telefone: "(21) 98334-9920", metaVotos: 800, votosEstimados: 540, status: "Potencial", responsavel: "Coord. Capital", ultimoContato: "2026-05-08" },
  { id: "a30", nome: "Camila Nunes", tipo: "Cabo eleitoral", municipio: "Maricá", regiao: "Metropolitana", telefone: "(21) 99550-7763", metaVotos: 500, votosEstimados: 580, status: "Ativo", responsavel: "Coord. Capital", ultimoContato: "2026-05-31" },
  { id: "a31", nome: "Rafael Costa", tipo: "Doador", municipio: "Rio de Janeiro", regiao: "Metropolitana", telefone: "(21) 98112-4456", metaVotos: 0, votosEstimados: 0, status: "Ativo", responsavel: "Coord. Capital", ultimoContato: "2026-05-15" },
  { id: "a32", nome: "Letícia Ramos", tipo: "Voluntário", municipio: "Petrópolis", regiao: "Serrana", telefone: "(24) 99771-2230", metaVotos: 200, votosEstimados: 150, status: "Ativo", responsavel: "Coord. Serrana", ultimoContato: "2026-05-24" },
  { id: "a33", nome: "Diego Fernandes", tipo: "Cabo eleitoral", municipio: "Duque de Caxias", regiao: "Baixada Fluminense", telefone: "(21) 99334-8812", metaVotos: 600, votosEstimados: 430, status: "Ativo", responsavel: "Coord. Baixada", ultimoContato: "2026-05-20" },
  { id: "a34", nome: "Priscila Araújo", tipo: "Liderança", municipio: "Saquarema", regiao: "Região dos Lagos", telefone: "(22) 99118-6654", metaVotos: 700, votosEstimados: 720, status: "Ativo", responsavel: "Coord. Lagos", ultimoContato: "2026-05-29" },
  { id: "a35", nome: "Henrique Barros", tipo: "Cabo eleitoral", municipio: "Campos dos Goytacazes", regiao: "Norte Fluminense", telefone: "(22) 99554-3301", metaVotos: 500, votosEstimados: 320, status: "Potencial", responsavel: "Coord. Interior", ultimoContato: "2026-05-07" },
  { id: "a36", nome: "Renata Cunha", tipo: "Voluntário", municipio: "São Gonçalo", regiao: "Metropolitana", telefone: "(21) 99880-1123", metaVotos: 250, votosEstimados: 190, status: "Ativo", responsavel: "Coord. Capital", ultimoContato: "2026-05-23" },
  { id: "a37", nome: "Fábio Monteiro", tipo: "Liderança", municipio: "Volta Redonda", regiao: "Médio Paraíba", telefone: "(24) 99332-5567", metaVotos: 700, votosEstimados: 470, status: "Inativo", responsavel: "Coord. Interior", ultimoContato: "2026-04-12" },
  { id: "a38", nome: "Sabrina Lima", tipo: "Cabo eleitoral", municipio: "Itaperuna", regiao: "Noroeste Fluminense", telefone: "(22) 99221-7740", metaVotos: 500, votosEstimados: 330, status: "Ativo", responsavel: "Coord. Interior", ultimoContato: "2026-05-21" },
  { id: "a39", nome: "Alexandre Pinto", tipo: "Doador", municipio: "Niterói", regiao: "Metropolitana", telefone: "(21) 98445-6678", metaVotos: 0, votosEstimados: 0, status: "Ativo", responsavel: "Coord. Capital", ultimoContato: "2026-05-14" },
  { id: "a40", nome: "Carolina Duarte", tipo: "Voluntário", municipio: "Arraial do Cabo", regiao: "Região dos Lagos", telefone: "(22) 99662-8890", metaVotos: 150, votosEstimados: 130, status: "Potencial", responsavel: "Coord. Lagos", ultimoContato: "2026-05-06" },
];

export const eventos: Evento[] = [
  { id: "e01", titulo: "Reunião com lideranças da Baixada", tipo: "Reunião", inicio: "2026-05-22T19:00", municipio: "Nova Iguaçu", local: "Diretório municipal", status: "Realizado", publicoEstimado: 60, responsavel: "Coord. Baixada" },
  { id: "e02", titulo: "Caminhada no Centro", tipo: "Caminhada", inicio: "2026-05-25T09:00", municipio: "Cabo Frio", local: "Rua dos Biquínis", status: "Realizado", publicoEstimado: 200, responsavel: "Coord. Lagos" },
  { id: "e03", titulo: "Entrevista Rádio Litoral FM", tipo: "Entrevista", inicio: "2026-05-29T08:30", municipio: "Cabo Frio", local: "Estúdio Rádio Litoral", status: "Realizado", publicoEstimado: 0, responsavel: "Assessoria" },
  { id: "e04", titulo: "Plenária com voluntários", tipo: "Reunião", inicio: "2026-06-03T19:30", municipio: "Niterói", local: "Comitê Central", status: "Confirmado", publicoEstimado: 90, responsavel: "Coord. Capital" },
  { id: "e05", titulo: "Visita a associação de moradores", tipo: "Visita", inicio: "2026-06-05T15:00", municipio: "São Gonçalo", local: "Bairro Alcântara", status: "Confirmado", publicoEstimado: 50, responsavel: "Coord. Capital" },
  { id: "e06", titulo: "Live de prestação de contas", tipo: "Live", inicio: "2026-06-07T20:00", municipio: "Rio de Janeiro", local: "Instagram @renatopellizzari", status: "Confirmado", publicoEstimado: 0, responsavel: "Marketing" },
  { id: "e07", titulo: "Caminhada na orla", tipo: "Caminhada", inicio: "2026-06-08T09:00", municipio: "Saquarema", local: "Praia de Itaúna", status: "Confirmado", publicoEstimado: 250, responsavel: "Coord. Lagos" },
  { id: "e08", titulo: "Reunião com comerciantes", tipo: "Reunião", inicio: "2026-06-11T18:00", municipio: "Petrópolis", local: "ACIP - Centro", status: "Agendado", publicoEstimado: 70, responsavel: "Coord. Serrana" },
  { id: "e09", titulo: "Visita ao polo industrial", tipo: "Visita", inicio: "2026-06-12T10:00", municipio: "Volta Redonda", local: "Distrito Industrial", status: "Agendado", publicoEstimado: 40, responsavel: "Coord. Interior" },
  { id: "e10", titulo: "Carreata regional", tipo: "Carreata", inicio: "2026-06-14T16:00", municipio: "Araruama", local: "Concentração na Prainha", status: "Agendado", publicoEstimado: 400, responsavel: "Coord. Lagos" },
  { id: "e11", titulo: "Entrevista TV Norte", tipo: "Entrevista", inicio: "2026-06-17T12:00", municipio: "Campos dos Goytacazes", local: "Estúdio TV Norte", status: "Agendado", publicoEstimado: 0, responsavel: "Assessoria" },
  { id: "e12", titulo: "Reunião de coordenadores regionais", tipo: "Reunião", inicio: "2026-06-19T19:00", municipio: "Rio de Janeiro", local: "Comitê Central", status: "Agendado", publicoEstimado: 30, responsavel: "Coord. Geral" },
  { id: "e13", titulo: "Visita a feira livre", tipo: "Visita", inicio: "2026-06-21T08:00", municipio: "Duque de Caxias", local: "Feira do Centro", status: "Agendado", publicoEstimado: 120, responsavel: "Coord. Baixada" },
  { id: "e14", titulo: "Encontro com juventude", tipo: "Reunião", inicio: "2026-06-24T18:30", municipio: "Maricá", local: "Centro Cultural", status: "Agendado", publicoEstimado: 80, responsavel: "Coord. Capital" },
  { id: "e15", titulo: "Caminhada Búzios", tipo: "Caminhada", inicio: "2026-06-28T17:00", municipio: "Armação dos Búzios", local: "Rua das Pedras", status: "Agendado", publicoEstimado: 180, responsavel: "Coord. Lagos" },
  { id: "e16", titulo: "Comício de lançamento regional", tipo: "Comício", inicio: "2026-08-18T19:00", municipio: "Cabo Frio", local: "Praça Porto Rocha", status: "Agendado", publicoEstimado: 1500, responsavel: "Coord. Geral" },
  { id: "e17", titulo: "Reunião cancelada - agenda dupla", tipo: "Reunião", inicio: "2026-06-10T19:00", municipio: "Teresópolis", local: "Diretório municipal", status: "Cancelado", publicoEstimado: 40, responsavel: "Coord. Serrana" },
];

export const receitas: Receita[] = [
  { id: "r01", data: "2026-02-10", origem: "Recursos próprios do candidato", tipo: "Recurso próprio", valor: 60_000 },
  { id: "r02", data: "2026-02-25", origem: "Fundo Especial de Financiamento", tipo: "Fundo partidário", valor: 120_000 },
  { id: "r03", data: "2026-03-05", origem: "Vaquinha online - 1ª rodada", tipo: "Financiamento coletivo", valor: 18_500 },
  { id: "r04", data: "2026-03-18", origem: "Rafael Costa", tipo: "Pessoa física", valor: 15_000 },
  { id: "r05", data: "2026-03-28", origem: "Alexandre Pinto", tipo: "Pessoa física", valor: 12_000 },
  { id: "r06", data: "2026-04-08", origem: "Fundo Especial de Financiamento", tipo: "Fundo partidário", valor: 90_000 },
  { id: "r07", data: "2026-04-15", origem: "Doadores diversos (PF)", tipo: "Pessoa física", valor: 28_400 },
  { id: "r08", data: "2026-04-22", origem: "Vaquinha online - 2ª rodada", tipo: "Financiamento coletivo", valor: 22_100 },
  { id: "r09", data: "2026-05-06", origem: "Fundo Especial de Financiamento", tipo: "Fundo partidário", valor: 80_000 },
  { id: "r10", data: "2026-05-14", origem: "Doadores diversos (PF)", tipo: "Pessoa física", valor: 34_900 },
  { id: "r11", data: "2026-05-21", origem: "Recursos próprios do candidato", tipo: "Recurso próprio", valor: 25_000 },
  { id: "r12", data: "2026-05-29", origem: "Vaquinha online - 3ª rodada", tipo: "Financiamento coletivo", valor: 16_700 },
];

export const despesas: Despesa[] = [
  { id: "d01", data: "2026-02-14", descricao: "Aluguel do comitê central (fev)", categoria: "Aluguel", fornecedor: "Imobiliária Centro", valor: 8_000, status: "Pago" },
  { id: "d02", data: "2026-02-27", descricao: "Produção de adesivos e bandeiras", categoria: "Material de campanha", fornecedor: "Gráfica Litoral", valor: 22_000, status: "Pago" },
  { id: "d03", data: "2026-03-04", descricao: "Gestão de tráfego e impulsionamento", categoria: "Marketing digital", fornecedor: "Agência Onda Digital", valor: 18_000, status: "Pago" },
  { id: "d04", data: "2026-03-12", descricao: "Combustível - frota de campanha", categoria: "Combustível", fornecedor: "Posto Rodoviária", valor: 6_400, status: "Pago" },
  { id: "d05", data: "2026-03-20", descricao: "Equipe de coordenação regional", categoria: "Pessoal", fornecedor: "Folha de pessoal", valor: 32_000, status: "Pago" },
  { id: "d06", data: "2026-03-25", descricao: "Aluguel do comitê central (mar)", categoria: "Aluguel", fornecedor: "Imobiliária Centro", valor: 8_000, status: "Pago" },
  { id: "d07", data: "2026-04-02", descricao: "Camisetas e bonés", categoria: "Material de campanha", fornecedor: "Confecções RJ", valor: 19_500, status: "Pago" },
  { id: "d08", data: "2026-04-10", descricao: "Estrutura da plenária (som e palco)", categoria: "Eventos", fornecedor: "Eventos & Cia", valor: 12_800, status: "Pago" },
  { id: "d09", data: "2026-04-16", descricao: "Produção de vídeos para redes", categoria: "Marketing digital", fornecedor: "Estúdio Maré", valor: 14_200, status: "Pago" },
  { id: "d10", data: "2026-04-23", descricao: "Combustível - frota de campanha", categoria: "Combustível", fornecedor: "Posto Rodoviária", valor: 7_100, status: "Pago" },
  { id: "d11", data: "2026-04-28", descricao: "Aluguel do comitê central (abr)", categoria: "Aluguel", fornecedor: "Imobiliária Centro", valor: 8_000, status: "Pago" },
  { id: "d12", data: "2026-05-05", descricao: "Equipe de coordenação regional", categoria: "Pessoal", fornecedor: "Folha de pessoal", valor: 34_000, status: "Pago" },
  { id: "d13", data: "2026-05-09", descricao: "Impulsionamento de conteúdo", categoria: "Marketing digital", fornecedor: "Agência Onda Digital", valor: 20_000, status: "Pago" },
  { id: "d14", data: "2026-05-15", descricao: "Banners e faixas regionais", categoria: "Material de campanha", fornecedor: "Gráfica Litoral", valor: 16_300, status: "Pago" },
  { id: "d15", data: "2026-05-20", descricao: "Carreata - locação de carro de som", categoria: "Eventos", fornecedor: "Som Móvel RJ", valor: 9_400, status: "Pago" },
  { id: "d16", data: "2026-05-26", descricao: "Combustível - frota de campanha", categoria: "Combustível", fornecedor: "Posto Rodoviária", valor: 7_600, status: "Pendente" },
  { id: "d17", data: "2026-05-28", descricao: "Aluguel do comitê central (mai)", categoria: "Aluguel", fornecedor: "Imobiliária Centro", valor: 8_000, status: "Pendente" },
  { id: "d18", data: "2026-05-30", descricao: "Material gráfico - santinhos", categoria: "Material de campanha", fornecedor: "Gráfica Litoral", valor: 24_500, status: "Pendente" },
  { id: "d19", data: "2026-05-31", descricao: "Diárias de equipe volante", categoria: "Pessoal", fornecedor: "Folha de pessoal", valor: 11_000, status: "Pendente" },
];

// ---------------------------------------------------------------------------
// Seletores / agregações
// ---------------------------------------------------------------------------

export function getCampanha(): Campanha {
  return campanha;
}

export function getMunicipios(): Municipio[] {
  const votos2022 = getVotos2022PorNome();
  return municipios
    .map((m) => ({ ...m, votos2022: votos2022.get(normMun(m.nome)) ?? 0 }))
    .sort((a, b) => b.votosProjetados - a.votosProjetados);
}

export function getApoiadores(): Apoiador[] {
  return apoiadores;
}

export function getEventos(): Evento[] {
  return [...eventos].sort(
    (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime(),
  );
}

export function getProximosEventos(limite?: number): Evento[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const futuros = getEventos().filter(
    (e) => new Date(e.inicio).getTime() >= hoje.getTime() && e.status !== "Cancelado",
  );
  return typeof limite === "number" ? futuros.slice(0, limite) : futuros;
}

export interface RegiaoResumo {
  regiao: Regiao;
  meta: number;
  projetado: number;
  votos2022: number;
  eleitorado: number;
  municipios: number;
  lideres: number;
  pct: number;
}

export function getResumoPorRegiao(): RegiaoResumo[] {
  const votos2022 = getVotos2022PorNome();
  const map = new Map<Regiao, RegiaoResumo>();
  for (const m of municipios) {
    const r =
      map.get(m.regiao) ??
      { regiao: m.regiao, meta: 0, projetado: 0, votos2022: 0, eleitorado: 0, municipios: 0, lideres: 0, pct: 0 };
    r.meta += m.metaVotos;
    r.projetado += m.votosProjetados;
    r.votos2022 += votos2022.get(normMun(m.nome)) ?? 0;
    r.eleitorado += m.eleitorado;
    r.municipios += 1;
    r.lideres += m.lideres;
    map.set(m.regiao, r);
  }
  return [...map.values()]
    .map((r) => ({ ...r, pct: r.meta ? r.projetado / r.meta : 0 }))
    .sort((a, b) => b.projetado - a.projetado);
}

export function getTotaisVotos() {
  const votos2022map = getVotos2022PorNome();
  const projetado = municipios.reduce((s, m) => s + m.votosProjetados, 0);
  const metaMunicipios = municipios.reduce((s, m) => s + m.metaVotos, 0);
  const votos2022 = municipios.reduce(
    (s, m) => s + (votos2022map.get(normMun(m.nome)) ?? 0),
    0,
  );
  return { meta: campanha.metaVotos, projetado, metaMunicipios, votos2022 };
}

export function getResumoApoiadores() {
  const total = apoiadores.length;
  const ativos = apoiadores.filter((a) => a.status === "Ativo").length;
  const potenciais = apoiadores.filter((a) => a.status === "Potencial").length;
  const inativos = apoiadores.filter((a) => a.status === "Inativo").length;
  const liderancas = apoiadores.filter((a) => a.tipo === "Liderança").length;
  const votosEstimados = apoiadores.reduce((s, a) => s + a.votosEstimados, 0);
  return { total, ativos, potenciais, inativos, liderancas, votosEstimados };
}

export function getReceitas(): Receita[] {
  return receitas;
}

export function getDespesas(): Despesa[] {
  return despesas;
}

export function getResumoFinanceiro() {
  const totalReceitas = receitas.reduce((s, r) => s + r.valor, 0);
  const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0);
  const despesasPagas = despesas
    .filter((d) => d.status === "Pago")
    .reduce((s, d) => s + d.valor, 0);
  const despesasPendentes = totalDespesas - despesasPagas;
  const saldo = totalReceitas - totalDespesas;
  const caixaDisponivel = totalReceitas - despesasPagas;
  const pctLimite = totalDespesas / campanha.limiteGastoTSE;
  return {
    totalReceitas,
    totalDespesas,
    despesasPagas,
    despesasPendentes,
    saldo,
    caixaDisponivel,
    pctLimite,
    limite: campanha.limiteGastoTSE,
  };
}

export function getDespesasPorCategoria() {
  const map = new Map<string, number>();
  for (const d of despesas) map.set(d.categoria, (map.get(d.categoria) ?? 0) + d.valor);
  return [...map.entries()]
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);
}

export function getReceitasPorTipo() {
  const map = new Map<string, number>();
  for (const r of receitas) map.set(r.tipo, (map.get(r.tipo) ?? 0) + r.valor);
  return [...map.entries()]
    .map(([tipo, valor]) => ({ tipo, valor }))
    .sort((a, b) => b.valor - a.valor);
}

export interface FluxoMes {
  mes: string;
  ordem: string;
  receitas: number;
  despesas: number;
}

export function getFluxoMensal(): FluxoMes[] {
  const label = (ym: string) => {
    const d = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1);
    const s = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d);
    return s.charAt(0).toUpperCase() + s.slice(1).replace(".", "");
  };
  const map = new Map<string, FluxoMes>();
  const upsert = (ym: string) =>
    map.get(ym) ?? { mes: label(ym), ordem: ym, receitas: 0, despesas: 0 };
  for (const r of receitas) {
    const ym = r.data.slice(0, 7);
    const o = upsert(ym);
    o.receitas += r.valor;
    map.set(ym, o);
  }
  for (const d of despesas) {
    const ym = d.data.slice(0, 7);
    const o = upsert(ym);
    o.despesas += d.valor;
    map.set(ym, o);
  }
  return [...map.values()].sort((a, b) => a.ordem.localeCompare(b.ordem));
}

export function getDashboardKpis() {
  const votos = getTotaisVotos();
  const fin = getResumoFinanceiro();
  const ap = getResumoApoiadores();
  const proximos = getProximosEventos();
  const municipiosCobertos = municipios.filter((m) => m.lideres > 0).length;
  return {
    metaVotos: votos.meta,
    votosProjetados: votos.projetado,
    pctMeta: votos.projetado / votos.meta,
    totalApoiadores: ap.total,
    apoiadoresAtivos: ap.ativos,
    liderancas: ap.liderancas,
    totalEventosFuturos: proximos.length,
    proximoEvento: proximos[0] ?? null,
    saldo: fin.saldo,
    totalReceitas: fin.totalReceitas,
    totalDespesas: fin.totalDespesas,
    pctLimiteTSE: fin.pctLimite,
    municipiosCobertos,
    totalMunicipios: municipios.length,
    diasParaEleicao: diasAte(campanha.dataEleicao),
  };
}
