// =========================================================================
// Gera datasets por CANDIDATO × ANO (votos por bairro/zona/município) a partir
// das seções do TSE. Cobre Renato + parceiros/dobradas rastreados.
// Cada candidato é fixado pelo SQ (sequencial único) — resolvido na base, pra
// evitar homônimos e variação de grafia entre anos.
//
// Bairro (capital): usa o mapa local→bairro de 2022/2024 (CEP×RUACEP). Para
// 2018/2020 (sem cadastro próprio) reusa esse mapa por local (cdMun|zona|nº),
// já que os locais de votação são estáveis entre anos — reporta a cobertura.
// Município/região: exato (direto da seção).
//
// Uso:  node scripts/gerar-candidatos.mjs
// =========================================================================

import { createReadStream } from "node:fs";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(__dirname, "..");
const SAIDA = join(RAIZ, "src/data/eleicoes/candidatos");
const MAPA = join(RAIZ, "src/data/eleicoes/_locais-bairro-map.json");
const SECAO = (ano) => join(RAIZ, `votacao_secao_${ano}_RJ/votacao_secao_${ano}_RJ.csv`);
const CAPITAL = "RIO DE JANEIRO";

// índices 0-based (votacao_secao — layout idêntico 2018/2020/2022/2024)
const S = { cdMun: 13, nmMun: 14, zona: 15, cargo: 18, nmVotavel: 20, votos: 21, nrLocal: 22, sq: 23 };

// --- Registro dos candidatos rastreados (SQ por ano) ---------------------
const CANDIDATOS = [
  { slug: "renato-pellizzari", nome: "Renato Pellizzari", anos: {
    2022: { sq: "190001639149", cargo: "Deputado Estadual", partido: "PSB" },
    2024: { sq: "190002266214", cargo: "Vereador", partido: "PSB" },
  } },
  { slug: "marcelo-freixo", nome: "Marcelo Freixo", anos: {
    2018: { sq: "190000602109", cargo: "Deputado Federal", partido: "PSOL" },
    2022: { sq: "190001609389", cargo: "Governador", partido: "PSB" },
  } },
  { slug: "reimont", nome: "Reimont", anos: {
    2018: { sq: "190000613596", cargo: "Deputado Federal", partido: "PT" },
    2020: { sq: "190001022674", cargo: "Vereador", partido: "PT" },
    2022: { sq: "190001619218", cargo: "Deputado Federal", partido: "PT" },
  } },
  { slug: "renan-ferreirinha", nome: "Renan Ferreirinha", anos: {
    2018: { sq: "190000622928", cargo: "Deputado Estadual", partido: "PSB" },
    2022: { sq: "190001603419", cargo: "Deputado Federal", partido: "PSD" },
  } },
  { slug: "martha-rocha", nome: "Martha Rocha", anos: {
    2018: { sq: "190000622173", cargo: "Deputado Estadual", partido: "PDT" },
    2022: { sq: "190001654227", cargo: "Deputado Estadual", partido: "PDT" },
  } },
  { slug: "tatiana-roque", nome: "Tatiana Roque", anos: {
    2018: { sq: "190000602121", cargo: "Deputado Federal", partido: "PSOL" },
    2022: { sq: "190001645410", cargo: "Deputado Federal", partido: "PSB" },
    2024: { sq: "190002266175", cargo: "Vereador", partido: "PSB" },
  } },
  { slug: "heloisa-helena", nome: "Heloísa Helena", anos: {
    2022: { sq: "190001600476", cargo: "Deputado Federal", partido: "REDE" },
    2024: { sq: "190002142528", cargo: "Vereador", partido: "REDE" },
  } },
];

// Auto-verificação: total RJ esperado por SQ (levantado na base)
const ESPERADO = {
  "190000602109": 342491, "190000622928": 24854, "190000613596": 24509,
  "190000622173": 48949, "190000602121": 15789, "190001022674": 16082,
  "190001609389": 2300980, "190001603419": 40540, "190001619218": 39325,
  "190001600476": 38161, "190001645410": 30764, "190001654227": 61767,
  "190001639149": 19434, "190002266175": 16957, "190002142528": 11971,
  "190002266214": 6783,
};

// --- Município (normalizado) -> região (mesmo de processar-tse.mjs) ------
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

const norm = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
const num = (v) => { const x = parseInt(v, 10); return Number.isFinite(x) ? x : 0; };
function parseSemi(l) { const o = []; let a = "", q = false; for (const c of l) { if (c === '"') q = !q; else if (c === ";" && !q) { o.push(a); a = ""; } else a += c; } o.push(a); return o; }
async function lerLinhas(arq, onLinha) {
  const rl = createInterface({ input: createReadStream(arq, { encoding: "latin1" }), crlfDelay: Infinity });
  let h = true;
  for await (const l of rl) { if (h) { h = false; continue; } if (l) onLinha(parseSemi(l)); }
}

async function main() {
  await mkdir(SAIDA, { recursive: true });
  const mapaRaw = JSON.parse(await readFile(MAPA, "utf8"));
  // fallback ano-agnóstico p/ 2018/2020: cdMun|zona|nrLocal -> bairro (2024 > 2022)
  const fallback = new Map();
  for (const [k, v] of Object.entries(mapaRaw)) { const [ano, cd, z, l] = k.split("|"); if (ano === "2022") { const kk = `${cd}|${z}|${l}`; if (!fallback.has(kk)) fallback.set(kk, v); } }
  for (const [k, v] of Object.entries(mapaRaw)) { const [ano, cd, z, l] = k.split("|"); if (ano === "2024") fallback.set(`${cd}|${z}|${l}`, v); }
  const bairroDe = (ano, cd, z, l) => mapaRaw[`${ano}|${cd}|${z}|${l}`] ?? fallback.get(`${cd}|${z}|${l}`) ?? "";

  // índice p/ a UI: slug, nome, e anos disponíveis (com cargo/partido)
  const indice = CANDIDATOS.map((c) => ({
    slug: c.slug, nome: c.nome,
    anos: Object.fromEntries(Object.entries(c.anos).map(([a, d]) => [a, { cargo: d.cargo, partido: d.partido }])),
  }));
  await writeFile(join(SAIDA, "_candidatos.json"), JSON.stringify(indice, null, 2) + "\n");

  for (const ano of [2018, 2020, 2022, 2024]) {
    const alvo = new Map(); // sq -> candidato
    for (const c of CANDIDATOS) if (c.anos[ano]) alvo.set(c.anos[ano].sq, c);
    if (!alvo.size) { console.log(`\n${ano}: nenhum candidato rastreado`); continue; }
    console.log(`\n=== ${ano} (${alvo.size} candidatos) — lendo seção… ===`);
    const acc = new Map();
    for (const c of alvo.values()) acc.set(c.slug, { bairros: new Map(), bairroZonas: new Map(), zonas: new Map(), munis: new Map(), totalRJ: 0, totalCap: 0, capMapeado: 0 });

    await lerLinhas(SECAO(ano), (f) => {
      const c = alvo.get(f[S.sq]); if (!c) return;
      const a = acc.get(c.slug);
      const v = num(f[S.votos]);
      const mun = f[S.nmMun];
      a.totalRJ += v;
      a.munis.set(mun, (a.munis.get(mun) || 0) + v);
      if (mun === CAPITAL) {
        a.totalCap += v;
        const z = num(f[S.zona]);
        a.zonas.set(z, (a.zonas.get(z) || 0) + v);
        const b = bairroDe(ano, f[S.cdMun], f[S.zona], f[S.nrLocal]);
        if (b) {
          a.capMapeado += v;
          a.bairros.set(b, (a.bairros.get(b) || 0) + v);
          let bz = a.bairroZonas.get(b); if (!bz) { bz = new Map(); a.bairroZonas.set(b, bz); }
          bz.set(z, (bz.get(z) || 0) + v);
        }
      }
    });

    for (const c of alvo.values()) {
      const a = acc.get(c.slug); const d = c.anos[ano];
      const out = {
        slug: c.slug, nome: c.nome, ano, cargo: d.cargo, partido: d.partido ?? null,
        totalRJ: a.totalRJ, totalCapital: a.totalCap,
        coberturaBairro: a.totalCap ? +(a.capMapeado / a.totalCap).toFixed(4) : 0,
        bairros: [...a.bairros.entries()].map(([bairro, votos]) => ({
          bairro, votos,
          zonas: [...(a.bairroZonas.get(bairro) || new Map()).entries()].map(([zona, vz]) => ({ zona, votos: vz })).sort((x, y) => y.votos - x.votos),
        })).sort((x, y) => y.votos - x.votos),
        zonas: [...a.zonas.entries()].map(([zona, votos]) => ({ zona, votos })).sort((x, y) => y.votos - x.votos),
        municipios: [...a.munis.entries()].map(([nome, votos]) => ({ nome, votos, regiao: REGIAO[norm(nome)] ?? null })).sort((x, y) => y.votos - x.votos),
      };
      await writeFile(join(SAIDA, `${c.slug}-${ano}.json`), JSON.stringify(out) + "\n");
      const esp = ESPERADO[d.sq];
      const chk = esp == null ? "" : (esp === a.totalRJ ? " ✓" : ` ⚠️ esperado ${esp}`);
      console.log(`  ${c.slug.padEnd(20)} RJ=${String(a.totalRJ).padStart(8)} cap=${String(a.totalCap).padStart(7)} bairros=${out.bairros.length} cobertura=${(out.coberturaBairro * 100).toFixed(1)}%${chk}`);
    }
  }
  console.log("\n✅ datasets em src/data/eleicoes/candidatos/");
}

main().catch((e) => { console.error(e); process.exit(1); });
