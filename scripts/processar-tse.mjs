// =========================================================================
// Pipeline TSE -> datasets do dashboard (Renato Pellizzari)
// -------------------------------------------------------------------------
// Lê os arquivos OFICIAIS do TSE (ISO-8859-1, separador ';') e gera JSONs
// UTF-8 enxutos em src/data/eleicoes/, consumidos pela camada de dados do
// dashboard. Substitui as transcrições de prints (src/lib/votos-raw.ts).
//
// Uso:  node scripts/processar-tse.mjs
//
// Sem dependências externas — só Node (node:fs, node:readline).
// =========================================================================

import { createReadStream } from "node:fs";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(__dirname, "..");
const SAIDA = join(RAIZ, "src", "data", "eleicoes");

// --- Candidato / cargo por ano -------------------------------------------
const CAPITAL = "RIO DE JANEIRO";
const ANOS = {
  2022: { sq: "190001639149", cargo: "Deputado Estadual" },
  2024: { sq: "190002266214", cargo: "Vereador" },
};

// --- Caminhos dos CSVs do TSE --------------------------------------------
const ARQ = {
  cand2022: join(RAIZ, "data/votacao_candidato_munzona_2022/votacao_candidato_munzona_2022_RJ.csv"),
  cand2024: join(RAIZ, "votacao_candidato_munzona_2024/votacao_candidato_munzona_2024_RJ.csv"),
  det2022: join(RAIZ, "data/detalhe_votacao_munzona_2022/detalhe_votacao_munzona_2022_RJ.csv"),
  det2024: join(RAIZ, "data/detalhe_votacao_munzona_2024/detalhe_votacao_munzona_2024_RJ.csv"),
  secao2022: join(RAIZ, "votacao_secao_2022_RJ/votacao_secao_2022_RJ.csv"),
  geojson: join(RAIZ, "public/geo/rj-municipios.geojson"),
};

// --- Mapa zona -> bairro predominante (rótulo das zonas no dashboard) -----
// Substitui o antigo mapa hardcoded "bairro-sede". Agora é DATA-DERIVED:
// gerado por scripts/locais-bairro.mjs (bairro com mais locais de votação na
// zona, via CEP do TSE × base RUACEP) e lido de zona-bairro.json em main().
// >>> Rode `node scripts/locais-bairro.mjs` ANTES deste script. <<<
let ZONA_BAIRRO = {};

// --- Mapa município (normalizado) -> região (enum do projeto) ------------
const REGIAO = {
  "RIO DE JANEIRO": "Metropolitana", "NITEROI": "Metropolitana", "SAO GONCALO": "Metropolitana",
  "MARICA": "Metropolitana", "ITABORAI": "Metropolitana", "TANGUA": "Metropolitana",
  "RIO BONITO": "Metropolitana", "CACHOEIRAS DE MACACU": "Metropolitana",
  "GUAPIMIRIM": "Metropolitana", "MAGE": "Metropolitana",
  "DUQUE DE CAXIAS": "Baixada Fluminense", "SAO JOAO DE MERITI": "Baixada Fluminense",
  "NILOPOLIS": "Baixada Fluminense", "NOVA IGUACU": "Baixada Fluminense",
  "BELFORD ROXO": "Baixada Fluminense", "MESQUITA": "Baixada Fluminense",
  "QUEIMADOS": "Baixada Fluminense", "JAPERI": "Baixada Fluminense",
  "SEROPEDICA": "Baixada Fluminense", "PARACAMBI": "Baixada Fluminense",
  "ANGRA DOS REIS": "Costa Verde", "PARATY": "Costa Verde", "MANGARATIBA": "Costa Verde",
  "ITAGUAI": "Costa Verde",
  "CABO FRIO": "Região dos Lagos", "ARMACAO DOS BUZIOS": "Região dos Lagos",
  "ARRAIAL DO CABO": "Região dos Lagos", "SAO PEDRO DA ALDEIA": "Região dos Lagos",
  "IGUABA GRANDE": "Região dos Lagos", "ARARUAMA": "Região dos Lagos",
  "SAQUAREMA": "Região dos Lagos", "SILVA JARDIM": "Região dos Lagos",
  "RIO DAS OSTRAS": "Região dos Lagos", "CASIMIRO DE ABREU": "Região dos Lagos",
  "CAMPOS DOS GOYTACAZES": "Norte Fluminense", "MACAE": "Norte Fluminense",
  "SAO JOAO DA BARRA": "Norte Fluminense", "SAO FIDELIS": "Norte Fluminense",
  "CARAPEBUS": "Norte Fluminense", "CONCEICAO DE MACABU": "Norte Fluminense",
  "QUISSAMA": "Norte Fluminense", "SAO FRANCISCO DE ITABAPOANA": "Norte Fluminense",
  "CARDOSO MOREIRA": "Norte Fluminense",
  "ITAPERUNA": "Noroeste Fluminense", "BOM JESUS DO ITABAPOANA": "Noroeste Fluminense",
  "NATIVIDADE": "Noroeste Fluminense", "PORCIUNCULA": "Noroeste Fluminense",
  "VARRE-SAI": "Noroeste Fluminense", "LAJE DO MURIAE": "Noroeste Fluminense",
  "MIRACEMA": "Noroeste Fluminense", "SANTO ANTONIO DE PADUA": "Noroeste Fluminense",
  "APERIBE": "Noroeste Fluminense", "CAMBUCI": "Noroeste Fluminense",
  "ITAOCARA": "Noroeste Fluminense", "SAO JOSE DE UBA": "Noroeste Fluminense",
  "ITALVA": "Noroeste Fluminense",
  "PETROPOLIS": "Serrana", "TERESOPOLIS": "Serrana", "NOVA FRIBURGO": "Serrana",
  "BOM JARDIM": "Serrana", "CANTAGALO": "Serrana", "CORDEIRO": "Serrana",
  "DUAS BARRAS": "Serrana", "MACUCO": "Serrana", "SAO JOSE DO VALE DO RIO PRETO": "Serrana",
  "SUMIDOURO": "Serrana", "CARMO": "Serrana", "SANTA MARIA MADALENA": "Serrana",
  "TRAJANO DE MORAES": "Serrana", "SAO SEBASTIAO DO ALTO": "Serrana",
  "VOLTA REDONDA": "Médio Paraíba", "BARRA MANSA": "Médio Paraíba", "RESENDE": "Médio Paraíba",
  "ITATIAIA": "Médio Paraíba", "PORTO REAL": "Médio Paraíba", "QUATIS": "Médio Paraíba",
  "PINHEIRAL": "Médio Paraíba", "BARRA DO PIRAI": "Médio Paraíba", "VALENCA": "Médio Paraíba",
  "RIO DAS FLORES": "Médio Paraíba", "PIRAI": "Médio Paraíba", "RIO CLARO": "Médio Paraíba",
  "TRES RIOS": "Centro-Sul", "PARAIBA DO SUL": "Centro-Sul", "SAPUCAIA": "Centro-Sul",
  "COMENDADOR LEVY GASPARIAN": "Centro-Sul", "AREAL": "Centro-Sul",
  "MIGUEL PEREIRA": "Centro-Sul", "PATY DO ALFERES": "Centro-Sul", "VASSOURAS": "Centro-Sul",
  "MENDES": "Centro-Sul", "ENGENHEIRO PAULO DE FRONTIN": "Centro-Sul",
};

// -------------------------------------------------------------------------
// Utilidades
// -------------------------------------------------------------------------
const norm = (s) =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();

function parseLinha(linha) {
  // separa por ';' respeitando aspas duplas, e remove as aspas das pontas
  const campos = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') aspas = !aspas;
    else if (c === ";" && !aspas) { campos.push(atual); atual = ""; }
    else atual += c;
  }
  campos.push(atual);
  return campos;
}

async function lerLinhas(caminho, onLinha) {
  const rl = createInterface({
    input: createReadStream(caminho, { encoding: "latin1" }),
    crlfDelay: Infinity,
  });
  let primeira = true;
  let n = 0;
  for await (const linha of rl) {
    if (primeira) { primeira = false; continue; } // pula cabeçalho
    if (!linha) continue;
    onLinha(parseLinha(linha));
    n++;
  }
  return n;
}

const num = (v) => {
  const x = parseInt(v, 10);
  return Number.isFinite(x) ? x : 0;
};

// -------------------------------------------------------------------------
// 1) Índices de coluna (0-based) por layout
// -------------------------------------------------------------------------
const C = {
  // votacao_candidato_munzona
  cand: { cdMun: 13, nmMun: 14, zona: 15, cargo: 17, sq: 18, urna: 19, nmUrna: 21, partido: 35, votos: 45 },
  // detalhe_votacao_munzona
  det: { cdMun: 13, nmMun: 14, zona: 15, cargo: 17, aptos: 18, comp: 23, abst: 25, validos: 29, legenda: 32, brancos: 40, nulos: 41 },
  // votacao_secao (2022)
  sec: { nmMun: 14, zona: 15, secao: 16, cargo: 18, sq: 23, votos: 21, nrLocal: 22, nmLocal: 24, endereco: 25 },
};

// -------------------------------------------------------------------------
// 2) Geojson: nome normalizado -> { ibge, nomeOficial }
// -------------------------------------------------------------------------
async function carregarGeojson() {
  const raw = await readFile(ARQ.geojson, "utf8");
  const fc = JSON.parse(raw);
  const mapa = new Map();
  for (const f of fc.features || []) {
    const p = f.properties || {};
    const nome = p.name || p.nome || p.NOME || "";
    const ibge = p.id || p.ibge || p.CD_MUN || null;
    if (nome) mapa.set(norm(nome), { ibge: String(ibge), nomeOficial: nome });
  }
  return mapa;
}

// zona -> bairro predominante (data-derived por scripts/locais-bairro.mjs)
async function carregarZonaBairro() {
  try {
    return JSON.parse(await readFile(join(SAIDA, "zona-bairro.json"), "utf8"));
  } catch {
    console.warn("  [aviso] zona-bairro.json ausente — rode `node scripts/locais-bairro.mjs` antes; rótulos de bairro por zona ficarão vazios.");
    return {};
  }
}

// nº real de bairros com voto do Renato (capital), de renato-bairros-{ano}.json
async function contarBairrosComVoto(ano) {
  try {
    const arr = JSON.parse(await readFile(join(SAIDA, `renato-bairros-${ano}.json`), "utf8"));
    return arr.filter((b) => b.votos > 0).length;
  } catch {
    return 0;
  }
}

// -------------------------------------------------------------------------
// 3) Processa um ano no nível candidato×munzona
//    -> votos do Renato por zona (capital), por município (estado),
//       e ranking dos concorrentes por zona (capital).
// -------------------------------------------------------------------------
async function processarCandidato(ano) {
  const { sq, cargo } = ANOS[ano];
  const arquivo = ano === 2022 ? ARQ.cand2022 : ARQ.cand2024;

  const renatoZona = new Map();          // zona -> votos (capital)
  const renatoMunicipio = new Map();     // cdMun -> { nome, votos }
  const zonaCandidatos = new Map();      // zona(capital) -> Map(sq -> {nmUrna, urna, partido, votos})

  await lerLinhas(arquivo, (f) => {
    if (f[C.cand.cargo] !== cargo) return;
    const nmMun = f[C.cand.nmMun];
    const zona = num(f[C.cand.zona]);
    const votos = num(f[C.cand.votos]);
    const ehRenato = f[C.cand.sq] === sq;

    // município (somente Renato — para o mapa estadual de 2022)
    if (ehRenato) {
      const cd = f[C.cand.cdMun];
      const m = renatoMunicipio.get(cd) || { nome: nmMun, votos: 0 };
      m.votos += votos;
      renatoMunicipio.set(cd, m);
    }

    // tudo abaixo é só capital (dashboard da cidade do Rio)
    if (nmMun !== CAPITAL) return;

    if (ehRenato) renatoZona.set(zona, (renatoZona.get(zona) || 0) + votos);

    // ranking de concorrentes por zona
    let cands = zonaCandidatos.get(zona);
    if (!cands) { cands = new Map(); zonaCandidatos.set(zona, cands); }
    const k = f[C.cand.sq];
    const c = cands.get(k) || {
      nome: f[C.cand.nmUrna], urna: f[C.cand.urna], partido: f[C.cand.partido], votos: 0,
    };
    c.votos += votos;
    cands.set(k, c);
  });

  return { renatoZona, renatoMunicipio, zonaCandidatos };
}

// -------------------------------------------------------------------------
// 4) Processa o detalhe (contexto eleitoral) por munzona.
//    -> por zona (capital) e por município (estado), só para o cargo do ano.
// -------------------------------------------------------------------------
async function processarDetalhe(ano) {
  const { cargo } = ANOS[ano];
  const arquivo = ano === 2022 ? ARQ.det2022 : ARQ.det2024;

  const zonaCtx = new Map();      // zona(capital) -> {aptos,comp,abst,validos,brancos,nulos}
  const municipioCtx = new Map(); // cdMun -> {nome, validos, comp}

  await lerLinhas(arquivo, (f) => {
    if (f[C.det.cargo] !== cargo) return;
    const nmMun = f[C.det.nmMun];
    const cd = f[C.det.cdMun];

    const mc = municipioCtx.get(cd) || { nome: nmMun, validos: 0, comp: 0 };
    mc.validos += num(f[C.det.validos]);
    mc.comp += num(f[C.det.comp]);
    municipioCtx.set(cd, mc);

    if (nmMun !== CAPITAL) return;
    const zona = num(f[C.det.zona]);
    const z = zonaCtx.get(zona) || { aptos: 0, comp: 0, abst: 0, validos: 0, legenda: 0, brancos: 0, nulos: 0 };
    z.aptos += num(f[C.det.aptos]);
    z.comp += num(f[C.det.comp]);
    z.abst += num(f[C.det.abst]);
    z.validos += num(f[C.det.validos]);
    z.legenda += num(f[C.det.legenda]);
    z.brancos += num(f[C.det.brancos]);
    z.nulos += num(f[C.det.nulos]);
    zonaCtx.set(zona, z);
  });

  return { zonaCtx, municipioCtx };
}

// -------------------------------------------------------------------------
// 5) Votação por SEÇÃO (2022) -> votos do Renato por LOCAL de votação (capital).
// -------------------------------------------------------------------------
async function processarSecao2022() {
  const sq = ANOS[2022].sq;
  const locais = new Map(); // chave zona|nrLocal -> {zona, nrLocal, nome, endereco, votos}
  let total = 0;

  await lerLinhas(ARQ.secao2022, (f) => {
    if (f[C.sec.sq] !== sq) return;
    if (f[C.sec.nmMun] !== CAPITAL) return;
    const zona = num(f[C.sec.zona]);
    const nrLocal = f[C.sec.nrLocal];
    const votos = num(f[C.sec.votos]);
    const chave = `${zona}|${nrLocal}`;
    const l = locais.get(chave) || {
      zona, nrLocal, nome: f[C.sec.nmLocal], endereco: f[C.sec.endereco], votos: 0,
    };
    l.votos += votos;
    locais.set(chave, l);
    total += votos;
  });

  return { locais, total };
}

// -------------------------------------------------------------------------
// Orquestração
// -------------------------------------------------------------------------
async function main() {
  await mkdir(SAIDA, { recursive: true });
  const geo = await carregarGeojson();
  console.log(`geojson: ${geo.size} municípios carregados`);
  ZONA_BAIRRO = await carregarZonaBairro();
  console.log(`zona->bairro: ${Object.keys(ZONA_BAIRRO).length} zonas rotuladas (data-derived)`);

  const renatoZonas = {};
  const rankingZonas = {};
  const meta = {};

  for (const ano of [2022, 2024]) {
    console.log(`\n=== Processando ${ano} (${ANOS[ano].cargo}) ===`);
    const cand = await processarCandidato(ano);
    const det = await processarDetalhe(ano);

    // ---- renato-zonas[ano]: votos por zona + contexto + % reais ----
    const zonas = [...cand.renatoZona.entries()]
      .map(([zona, votos]) => {
        const ctx = det.zonaCtx.get(zona) || {};
        const validos = ctx.validos || 0;
        const comp = ctx.comp || 0;
        return {
          zona,
          bairro: ZONA_BAIRRO[zona] || "—",
          votos,
          validosZona: validos,
          comparecimentoZona: comp,
          aptosZona: ctx.aptos || 0,
          abstencaoZona: ctx.abst || 0,
          legendaZona: ctx.legenda || 0,
          brancosZona: ctx.brancos || 0,
          nulosZona: ctx.nulos || 0,
          pctValidos: validos ? +(votos / validos).toFixed(6) : 0,
          pctComparecimento: comp ? +(votos / comp).toFixed(6) : 0,
        };
      })
      .sort((a, b) => b.votos - a.votos);
    renatoZonas[ano] = zonas;

    // ---- ranking-zonas[ano]: posição do Renato + top concorrentes ----
    const rk = {};
    for (const [zona, cands] of cand.zonaCandidatos) {
      const lista = [...cands.values()].sort((a, b) => b.votos - a.votos);
      // posição do Renato na zona (busca pelo nome de urna)
      const idxRenato = lista.findIndex((c) => c.nome && norm(c.nome).includes("RENATO PELLIZZARI"));
      rk[zona] = {
        totalCandidatos: lista.length,
        posicaoRenato: idxRenato >= 0 ? idxRenato + 1 : null,
        votosRenato: idxRenato >= 0 ? lista[idxRenato].votos : 0,
        top: lista.slice(0, 15).map((c, i) => ({
          posicao: i + 1, nome: c.nome, urna: c.urna, partido: c.partido, votos: c.votos,
        })),
      };
    }
    rankingZonas[ano] = rk;

    // ---- meta[ano] ----
    const totalCapital = zonas.reduce((s, z) => s + z.votos, 0);
    const ctxCapital = [...det.zonaCtx.values()].reduce(
      (a, z) => ({ validos: a.validos + z.validos, comp: a.comp + z.comp }),
      { validos: 0, comp: 0 }
    );
    let totalEstado = 0, municipiosComVoto = 0;
    for (const m of cand.renatoMunicipio.values()) {
      totalEstado += m.votos;
      if (m.votos > 0) municipiosComVoto++;
    }
    meta[ano] = {
      cargo: ANOS[ano].cargo,
      totalEstado,
      totalCapital,
      municipiosComVoto,
      municipiosTotal: cand.renatoMunicipio.size,
      zonasCapital: zonas.length,
      bairrosComVoto: (await contarBairrosComVoto(ano)) || new Set(zonas.map((z) => z.bairro)).size,
      validosCapital: ctxCapital.validos,
      comparecimentoCapital: ctxCapital.comp,
      pctValidosCapital: ctxCapital.validos ? +(totalCapital / ctxCapital.validos).toFixed(6) : 0,
    };

    // ---- municipios (somente 2022, eleição estadual) ----
    if (ano === 2022) {
      const munic = [...cand.renatoMunicipio.entries()]
        .map(([cd, m]) => {
          const chave = norm(m.nome);
          const g = geo.get(chave);
          const mc = det.municipioCtx.get(cd);
          const validos = mc ? mc.validos : 0;
          return {
            cdTse: cd,
            nome: m.nome,
            nomeOficial: g ? g.nomeOficial : m.nome,
            ibge: g ? g.ibge : null,
            regiao: REGIAO[chave] || null,
            votos: m.votos,
            validos,
            pctValidos: validos ? +(m.votos / validos).toFixed(6) : 0,
          };
        })
        .sort((a, b) => b.votos - a.votos);
      await escrever("renato-municipios-2022.json", munic);

      const semRegiao = munic.filter((m) => !m.regiao).map((m) => m.nome);
      const semIbge = munic.filter((m) => !m.ibge).map((m) => m.nome);
      if (semRegiao.length) console.warn(`  [aviso] sem região: ${semRegiao.join(", ")}`);
      if (semIbge.length) console.warn(`  [aviso] sem IBGE (não casou no geojson): ${semIbge.join(", ")}`);
      console.log(`  municípios: ${munic.length} | estado: ${totalEstado} | capital: ${totalCapital}`);
    } else {
      console.log(`  zonas: ${zonas.length} | capital: ${totalCapital}`);
    }
  }

  // ---- locais de votação do Renato (2022, capital) ----
  console.log(`\n=== Processando seção 2022 (local de votação) — arquivo grande, aguarde ===`);
  const sec = await processarSecao2022();
  const locais = [...sec.locais.values()]
    .map((l) => ({ ...l, bairro: ZONA_BAIRRO[l.zona] || "—" }))
    .sort((a, b) => b.votos - a.votos);
  await escrever("renato-locais-2022.json", locais);
  console.log(`  locais de votação (capital): ${locais.length} | soma: ${sec.total}`);

  // ---- grava os arquivos consolidados ----
  await escrever("renato-zonas.json", renatoZonas);
  await escrever("ranking-zonas.json", rankingZonas);
  await escrever("meta.json", meta);

  console.log("\n✅ Datasets gerados em src/data/eleicoes/");
}

async function escrever(nome, dados) {
  await writeFile(join(SAIDA, nome), JSON.stringify(dados, null, 2) + "\n", "utf8");
}

main().catch((e) => { console.error(e); process.exit(1); });
