// =========================================================================
// Locais de votação (TSE) -> bairro, via CEP × base RUACEP
// -------------------------------------------------------------------------
// Fase "map":  lê eleitorado_local_votacao 2022/2024 (RJ), pega CEP de cada
//   local e cruza com public/geo/ceps-rj.csv (RUACEP) -> bairro canônico.
//   Fallback: NM_BAIRRO do próprio TSE. Saída: src/data/eleicoes/
//   locais-bairro.csv  (+ relatório de cobertura/divergência).
//
// Fase "votos": junta votacao_secao 2022/2024 (votos por candidato×seção)
//   com o mapa local->bairro -> votos por candidato por bairro.
//   Foco: Renato Pellizzari na capital. Saída: renato-bairros-{ano}.json.
//
// Uso:  node scripts/locais-bairro.mjs map
//       node scripts/locais-bairro.mjs votos
//       node scripts/locais-bairro.mjs all
// =========================================================================

import { createReadStream } from "node:fs";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(__dirname, "..");
const SAIDA = join(RAIZ, "src/data/eleicoes");
const RUACEP_CSV = join(RAIZ, "public/geo/ceps-rj.csv");

const CAPITAL = "RIO DE JANEIRO";
const ANOS = {
  2022: { sq: "190001639149", cargo: "Deputado Estadual" },
  2024: { sq: "190002266214", cargo: "Vereador" },
};
const LOCAIS = {
  2022: join(RAIZ, "data/eleitorado_local_votacao_2022/eleitorado_local_votacao_2022.csv"),
  2024: join(RAIZ, "data/eleitorado_local_votacao_2024/eleitorado_local_votacao_2024.csv"),
};
const SECAO = {
  2022: join(RAIZ, "votacao_secao_2022_RJ/votacao_secao_2022_RJ.csv"),
  2024: join(RAIZ, "votacao_secao_2024_RJ/votacao_secao_2024_RJ.csv"),
};

// índices (0-based)
const L = { uf: 6, cdMun: 7, nmMun: 8, zona: 9, secao: 10, nrLocal: 14, nmLocal: 15, endereco: 18, bairro: 19, cep: 20, lat: 22, lon: 23, eleitores: 34 };
const S = { cdMun: 13, nmMun: 14, zona: 15, secao: 16, cargo: 18, votos: 21, nrLocal: 22, sq: 23, nmLocal: 24, endereco: 25 };

// -------------------------------------------------------------------------
const norm = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
const soDig = (s) => (s || "").replace(/\D/g, "");
const cepFmt = (d) => (d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : d);

function parseSemi(linha) {
  const campos = []; let atual = "", aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') aspas = !aspas;
    else if (c === ";" && !aspas) { campos.push(atual); atual = ""; }
    else atual += c;
  }
  campos.push(atual); return campos;
}
async function lerLinhas(caminho, onLinha) {
  const rl = createInterface({ input: createReadStream(caminho, { encoding: "latin1" }), crlfDelay: Infinity });
  let primeira = true;
  for await (const linha of rl) {
    if (primeira) { primeira = false; continue; }
    if (!linha) continue;
    onLinha(parseSemi(linha));
  }
}
function csvParse(line) {
  const o = []; let a = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { a += '"'; i++; } else q = !q; }
    else if (c === "," && !q) { o.push(a); a = ""; }
    else a += c;
  }
  o.push(a); return o;
}
function csvCampo(v) { const s = v == null ? "" : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
const csvLinha = (a) => a.map(csvCampo).join(",");

// -------------------------------------------------------------------------
// dicionário RUACEP: cep(8 díg) -> { municipio, bairro }
// -------------------------------------------------------------------------
async function carregarRuacep() {
  const txt = await readFile(RUACEP_CSV, "utf8");
  const linhas = txt.split("\n");
  const mapa = new Map();
  for (let i = 1; i < linhas.length; i++) {
    if (!linhas[i]) continue;
    const c = csvParse(linhas[i]);            // uf,municipio,ibge,bairro,cep,logradouro,complemento,url
    const cep = soDig(c[4]);
    if (cep.length !== 8) continue;
    if (!mapa.has(cep)) mapa.set(cep, { municipio: c[1], bairro: c[3] });
  }
  return mapa;
}

// -------------------------------------------------------------------------
// Canonização de bairros da CAPITAL para o conjunto oficial (rio-bairros-geo)
// -------------------------------------------------------------------------
async function carregarOficiais() {
  const ts = await readFile(join(RAIZ, "src/lib/rio-bairros-geo.ts"), "utf8");
  const mapa = new Map(); // norm -> nome display
  for (const m of ts.matchAll(/nome:\s*"([^"]+)"/g)) mapa.set(norm(m[1]), m[1]);
  return mapa;
}
// nomes que TSE/RUACEP usam fora do padrão oficial -> nome oficial
const ALIASES = {
  "BRAZ DE PINA": "Brás de Pina",
  "OSWALDO CRUZ": "Osvaldo Cruz",
  "RECREIO": "Recreio dos Bandeirantes",
  "FREGUESIA JPA": "Freguesia (Jacarepaguá)",
  "FREGUESIA (ILHA DO GOVERNADOR)": "Freguesia (Ilha)",
  "FUNDAO": "Cidade Universitária",
  "NOVA SEPETIBA": "Sepetiba",
  "ILHA DE GUARATIBA": "Guaratiba",
  "JARDIM BANGU": "Bangu",
  "RIO DAS PEDRAS": "Jacarepaguá",
  "BAIRRO DE FATIMA": "Cidade Nova",
  "TUBIACANGA": "Galeão", // vila no N. da Ilha do Gov.; oficialmente dentro de Galeão
};
function titulo(s) {
  return s.toLowerCase().replace(/\s+/g, " ").trim()
    .replace(/\b([a-zà-ú])([a-zà-ú]*)/g, (_, a, b) =>
      ["de","da","do","das","dos","e"].includes(a + b) ? a + b : a.toUpperCase() + b);
}
// raw -> nome de bairro canônico (só vale o conjunto oficial p/ a capital)
function canonBairro(raw, cepDig, oficiais, capital) {
  if (!raw) return "";
  const n = norm(raw);
  if (capital && n === "FREGUESIA")
    return cepDig.startsWith("219") ? "Freguesia (Ilha)" : "Freguesia (Jacarepaguá)";
  if (capital && ALIASES[n]) return ALIASES[n];
  if (capital && oficiais.has(n)) return oficiais.get(n);
  return raw === raw.toUpperCase() ? titulo(raw) : raw; // fora do oficial: arruma caixa
}

// -------------------------------------------------------------------------
// Fase MAP
// -------------------------------------------------------------------------
// "mesmo bairro" sob formas diferentes? (norm igual, alias, ou um contém o outro)
function mesmoBairro(a, b) {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}

async function faseMap() {
  await mkdir(SAIDA, { recursive: true });
  const ruacep = await carregarRuacep();
  const oficiais = await carregarOficiais();
  console.log(`RUACEP: ${ruacep.size} CEPs | oficiais (capital): ${oficiais.size} bairros`);

  const linhasOut = [csvLinha([
    "ano", "cd_municipio", "municipio", "zona", "nr_local", "nm_local",
    "endereco", "cep", "bairro_tse", "bairro_ruacep", "bairro_final", "fonte", "oficial", "lat", "lon",
  ])];
  const mapaParaVotos = {}; // `${ano}|${cdMun}|${zona}|${nrLocal}` -> bairro_final
  const zbCount = {};       // zona(capital) -> { bairro: nº de locais } p/ rótulo da zona

  for (const ano of [2022, 2024]) {
    const vistos = new Set();
    let total = 0, comCep = 0, casouRuacep = 0, viaRuacep = 0, viaTse = 0, semBairro = 0;
    let oficialN = 0, divForma = 0, divReal = 0;
    await lerLinhas(LOCAIS[ano], (f) => {
      if (f[L.uf] !== "RJ") return;
      const chave = `${f[L.cdMun]}|${f[L.zona]}|${f[L.nrLocal]}`;
      if (vistos.has(chave)) return;
      vistos.add(chave);
      total++;
      const capital = f[L.nmMun] === CAPITAL;
      const cepd = soDig(f[L.cep]);
      const bTseRaw = (f[L.bairro] || "").trim();
      const hit = cepd.length === 8 ? ruacep.get(cepd) : null;
      // Na capital, só confia no bairro do RUACEP se o CEP pertence à própria
      // capital. CEPs de divisa às vezes apontam p/ município vizinho (ex.:
      // 25565 → São João de Meriti), o que mandaria o local p/ um bairro errado;
      // nesses casos cai no NM_BAIRRO do TSE (que conhece o município real).
      const hitMunicipioOk = hit && (!capital || norm(hit.municipio) === norm(CAPITAL));
      const bRuaRaw = hitMunicipioOk ? hit.bairro : "";
      if (cepd.length === 8) comCep++;
      if (hit) casouRuacep++;

      const bRuaCanon = bRuaRaw ? canonBairro(bRuaRaw, cepd, oficiais, capital) : "";
      const bTseCanon = bTseRaw ? canonBairro(bTseRaw, cepd, oficiais, capital) : "";
      const bairroFinal = bRuaCanon || bTseCanon || "";
      const fonte = bRuaCanon ? "ruacep-cep" : bTseCanon ? "tse" : "—";
      if (fonte === "ruacep-cep") viaRuacep++; else if (fonte === "tse") viaTse++; else semBairro++;
      const oficial = capital && oficiais.has(norm(bairroFinal));
      if (oficial) oficialN++;
      if (bRuaCanon && bTseCanon && norm(bRuaCanon) !== norm(bTseCanon)) {
        if (mesmoBairro(bRuaCanon, bTseCanon)) divForma++; else divReal++;
      }

      mapaParaVotos[`${ano}|${chave}`] = bairroFinal;
      if (capital && bairroFinal) {
        (zbCount[f[L.zona]] ||= {})[bairroFinal] =
          (zbCount[f[L.zona]][bairroFinal] || 0) + 1;
      }
      linhasOut.push(csvLinha([
        ano, f[L.cdMun], f[L.nmMun], f[L.zona], f[L.nrLocal], f[L.nmLocal],
        f[L.endereco], cepd.length === 8 ? cepFmt(cepd) : "", bTseRaw, bRuaRaw,
        bairroFinal, fonte, oficial ? "sim" : "", f[L.lat], f[L.lon],
      ]));
    });
    console.log(
      `\n${ano}: ${total} locais (RJ) | com CEP ${pct(comCep, total)} | casou RUACEP ${casouRuacep} (${pct(casouRuacep, total)})\n` +
      `   bairro final: via RUACEP ${viaRuacep} + via TSE ${viaTse} | sem bairro ${semBairro} | oficial(capital) ${oficialN}\n` +
      `   divergência RUACEP×TSE: mesma(forma) ${divForma} | bairro diferente ${divReal} (${pct(divReal, casouRuacep)})`,
    );
  }

  // zona -> bairro predominante (bairro com mais locais na zona) p/ rótulo no dashboard
  const zonaBairro = {};
  for (const [zona, cont] of Object.entries(zbCount)) {
    zonaBairro[zona] = Object.entries(cont).sort((a, b) => b[1] - a[1])[0][0];
  }

  await writeFile(join(SAIDA, "locais-bairro.csv"), "﻿" + linhasOut.join("\n") + "\n", "utf8");
  await writeFile(join(SAIDA, "_locais-bairro-map.json"), JSON.stringify(mapaParaVotos), "utf8");
  await writeFile(join(SAIDA, "zona-bairro.json"), JSON.stringify(zonaBairro, null, 2) + "\n", "utf8");
  console.log(`\n✅ src/data/eleicoes/locais-bairro.csv (${linhasOut.length - 1} locais 2022+2024)`);
  console.log(`✅ src/data/eleicoes/zona-bairro.json (${Object.keys(zonaBairro).length} zonas rotuladas)`);
  return mapaParaVotos;
}
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + "%" : "—");

// -------------------------------------------------------------------------
// Fase VOTOS: votacao_secao × mapa local→bairro -> votos por bairro (capital)
// -------------------------------------------------------------------------
const num = (v) => { const x = parseInt(v, 10); return Number.isFinite(x) ? x : 0; };
async function escrever(nome, dados) {
  await writeFile(join(SAIDA, nome), JSON.stringify(dados, null, 2) + "\n", "utf8");
}
async function faseVotos() {
  const mapa = JSON.parse(await readFile(join(SAIDA, "_locais-bairro-map.json"), "utf8"));
  for (const ano of [2022, 2024]) {
    const { sq, cargo } = ANOS[ano];
    const perLocal = new Map(); // key -> {zona,nrLocal,nome,endereco,bairro,renato,total}
    await lerLinhas(SECAO[ano], (f) => {
      if (norm(f[S.cargo]) !== norm(cargo)) return;  // 2022 vem em MAIÚSCULAS
      if (f[S.nmMun] !== CAPITAL) return;            // foco: cidade do Rio
      const key = `${ano}|${f[S.cdMun]}|${f[S.zona]}|${f[S.nrLocal]}`;
      let l = perLocal.get(key);
      if (!l) {
        l = { zona: +f[S.zona], nrLocal: f[S.nrLocal], nome: f[S.nmLocal],
              endereco: f[S.endereco], bairro: mapa[key] || "", renato: 0, total: 0 };
        perLocal.set(key, l);
      }
      const v = num(f[S.votos]);
      l.total += v;                                   // total nominal do cargo no local
      if (f[S.sq] === sq) l.renato += v;
    });

    // agrega por bairro
    const bairros = new Map();
    let comB = 0, semB = 0;
    for (const l of perLocal.values()) {
      if (l.bairro) comB++; else semB++;
      const b = l.bairro || "(sem bairro)";
      const x = bairros.get(b) || { bairro: b, votos: 0, totalCargo: 0, locais: 0 };
      x.votos += l.renato; x.totalCargo += l.total; x.locais++;
      bairros.set(b, x);
    }
    const lista = [...bairros.values()]
      .map((x) => ({ ...x, pctNoBairro: x.totalCargo ? +(x.votos / x.totalCargo).toFixed(5) : 0 }))
      .sort((a, b) => b.votos - a.votos);
    await escrever(`renato-bairros-${ano}.json`, lista);

    // detalhe por local (só onde Renato teve voto)
    const locais = [...perLocal.values()]
      .filter((l) => l.renato > 0)
      .map((l) => ({ zona: l.zona, nrLocal: l.nrLocal, nome: l.nome, endereco: l.endereco, bairro: l.bairro, votos: l.renato }))
      .sort((a, b) => b.votos - a.votos);
    await escrever(`renato-locais-bairro-${ano}.json`, locais);

    const tot = lista.reduce((s, x) => s + x.votos, 0);
    console.log(`\n${ano} (${cargo}): Renato capital = ${tot} votos | ${lista.length} bairros | locais c/ bairro ${comB}/${comB + semB}`);
    console.log("   top 10 bairros: " + lista.slice(0, 10).map((x) => `${x.bairro} ${x.votos}`).join(" · "));
  }
  console.log(`\n✅ renato-bairros-{2022,2024}.json + renato-locais-bairro-{2022,2024}.json`);
}

// -------------------------------------------------------------------------
// dispatch
// -------------------------------------------------------------------------
const cmd = process.argv.slice(2).find((a) => !a.startsWith("--")) || "all";
const t0 = Date.now();
if (cmd === "map" || cmd === "all") await faseMap();
if (cmd === "votos" || cmd === "all") await faseVotos();
console.log(`(${((Date.now() - t0) / 1000).toFixed(1)}s)`);
