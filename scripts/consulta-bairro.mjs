// =========================================================================
// Consulta: votos por candidato (e eleitos) em um BAIRRO da cidade do Rio
// -------------------------------------------------------------------------
// Cruza locais-bairro.csv (local -> bairro) × votacao_secao (votos/candidato
// por local) × votacao_candidato_munzona (status ELEITO + nome/partido).
//
// Uso:
//   node scripts/consulta-bairro.mjs "Praça da Bandeira"            # 2022 e 2024
//   node scripts/consulta-bairro.mjs "Tijuca" 2024                 # só 2024
//   node scripts/consulta-bairro.mjs "Centro" 2022 --eleitos --top=5
//   node scripts/consulta-bairro.mjs "Copacabana" 2022 --cargo="Deputado Federal"
//   node scripts/consulta-bairro.mjs "Centro" 2024 --municipio="RIO DE JANEIRO" --json
//
// Flags: --top=N (def 10) · --eleitos (só eleitos) · --cargo="..." ·
//        --municipio="..." (def RIO DE JANEIRO) · --json (imprime JSON)
//
// Ver docs/ESPEC-base-bairros.md (receitas 6.4/6.5). Brutos do TSE: latin1, ';'.
// =========================================================================

import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(__dirname, "..");
const LOCAIS_BAIRRO_CSV = join(RAIZ, "src/data/eleicoes/locais-bairro.csv");
const SECAO = {
  2022: join(RAIZ, "votacao_secao_2022_RJ/votacao_secao_2022_RJ.csv"),
  2024: join(RAIZ, "votacao_secao_2024_RJ/votacao_secao_2024_RJ.csv"),
};
const CAND = {
  2022: join(RAIZ, "data/votacao_candidato_munzona_2022/votacao_candidato_munzona_2022_RJ.csv"),
  2024: join(RAIZ, "votacao_candidato_munzona_2024/votacao_candidato_munzona_2024_RJ.csv"),
};
const CARGO_PADRAO = { 2022: "Deputado Estadual", 2024: "Vereador" };
const ELEITO = new Set(["ELEITO", "ELEITO POR QP", "ELEITO POR MÉDIA"]);

// índices 0-based (ver docs/ESPEC-base-bairros.md §5)
const S = { cdMun: 13, nmMun: 14, zona: 15, cargo: 18, nmVotavel: 20, votos: 21, nrLocal: 22, sq: 23 };
const C = { nmMun: 14, cargo: 17, sq: 18, nrCand: 19, nmUrna: 21, partido: 35, sit: 49 };

// ---- utils --------------------------------------------------------------
const norm = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
const num = (v) => { const x = parseInt(v, 10); return Number.isFinite(x) ? x : 0; };
function pl(l) { const o = []; let a = "", q = false; for (const c of l) { if (c === '"') q = !q; else if (c === ";" && !q) { o.push(a); a = ""; } else a += c; } o.push(a); return o; }
function csvParse(line) { const o = []; let a = "", q = false; for (let i = 0; i < line.length; i++) { const c = line[i]; if (c === '"') { if (q && line[i + 1] === '"') { a += '"'; i++; } else q = !q; } else if (c === "," && !q) { o.push(a); a = ""; } else a += c; } o.push(a); return o; }
async function lerLatin1(arq, onLinha) {
  const rl = createInterface({ input: createReadStream(arq, { encoding: "latin1" }), crlfDelay: Infinity });
  let head = true;
  for await (const l of rl) { if (head) { head = false; continue; } if (l) onLinha(pl(l)); }
}

// ---- args ---------------------------------------------------------------
const ARGS = process.argv.slice(2);
const flag = (n, d) => { const a = ARGS.find((x) => x.startsWith(`--${n}=`)); return a ? a.split("=").slice(1).join("=") : d; };
const pos = ARGS.filter((a) => !a.startsWith("--"));
const bairroArg = pos[0];
const anoArg = pos[1] || flag("ano");
const TOP = Number(flag("top", 10));
const SO_ELEITOS = ARGS.includes("--eleitos");
const JSON_OUT = ARGS.includes("--json");
const MUNICIPIO = norm(flag("municipio", "RIO DE JANEIRO"));

if (!bairroArg) {
  console.error('Uso: node scripts/consulta-bairro.mjs "<bairro>" [ano] [--top=N] [--eleitos] [--cargo="..."] [--municipio="..."] [--json]');
  process.exit(1);
}

// ---- 1) locais do bairro (de locais-bairro.csv) -------------------------
async function locaisDoBairro(ano) {
  const txt = await readFile(LOCAIS_BAIRRO_CSV, "utf8");
  const linhas = txt.split("\n");
  const chaves = new Set();           // `${cdMun}|${zona}|${nrLocal}`
  const nomesBairro = new Set();      // grafias de bairro_final que casaram
  let nLocais = 0;
  const alvo = norm(bairroArg);
  for (let i = 1; i < linhas.length; i++) {
    if (!linhas[i]) continue;
    const c = csvParse(linhas[i].replace(/^﻿/, ""));
    // ano,cd_municipio,municipio,zona,nr_local,nm_local,end,cep,btse,bruacep,bfinal,fonte,oficial,lat,lon
    if (c[0] !== String(ano)) continue;
    if (norm(c[2]) !== MUNICIPIO) continue;
    if (norm(c[10]) !== alvo) continue;
    chaves.add(`${c[1]}|${c[3]}|${c[4]}`);
    nomesBairro.add(c[10]);
    nLocais++;
  }
  return { chaves, nomesBairro: [...nomesBairro], nLocais };
}

// sugestão se o bairro não existir
async function sugerirBairros() {
  const txt = await readFile(LOCAIS_BAIRRO_CSV, "utf8");
  const set = new Set();
  for (const l of txt.split("\n").slice(1)) {
    if (!l) continue; const c = csvParse(l.replace(/^﻿/, ""));
    if (norm(c[2]) === MUNICIPIO && c[10]) set.add(c[10]);
  }
  const alvo = norm(bairroArg);
  return [...set].filter((b) => norm(b).includes(alvo) || alvo.includes(norm(b))).slice(0, 12);
}

// ---- 2) votos por candidato no bairro (votacao_secao) -------------------
async function votosNoBairro(ano, cargo, chaves) {
  const cargoN = norm(cargo);
  const porSq = new Map(); // sq -> { sq, nome, votos }
  await lerLatin1(SECAO[ano], (f) => {
    if (norm(f[S.nmMun]) !== MUNICIPIO) return;
    if (norm(f[S.cargo]) !== cargoN) return;
    if (!chaves.has(`${f[S.cdMun]}|${f[S.zona]}|${f[S.nrLocal]}`)) return;
    const sq = f[S.sq];
    let r = porSq.get(sq);
    if (!r) { r = { sq, nome: f[S.nmVotavel], votos: 0 }; porSq.set(sq, r); }
    r.votos += num(f[S.votos]);
  });
  return porSq;
}

// ---- 3) status eleito + nome/partido (votacao_candidato_munzona) --------
async function infoCandidatos(ano, cargo, sqsAlvo) {
  const cargoN = norm(cargo);
  const info = new Map(); // sq -> { nmUrna, partido, nrCand, eleito, sit }
  await lerLatin1(CAND[ano], (f) => {
    if (norm(f[C.cargo]) !== cargoN) return;
    const sq = f[C.sq];
    if (!sqsAlvo.has(sq) || info.has(sq)) return;
    info.set(sq, {
      nmUrna: f[C.nmUrna], partido: f[C.partido], nrCand: f[C.nrCand],
      sit: f[C.sit], eleito: ELEITO.has((f[C.sit] || "").toUpperCase()),
    });
  });
  return info;
}

// ---- run ----------------------------------------------------------------
function fmt(n) { return n.toLocaleString("pt-BR"); }

async function consultar(ano) {
  const cargo = flag("cargo", CARGO_PADRAO[ano] || "");
  const { chaves, nomesBairro, nLocais } = await locaisDoBairro(ano);
  if (!chaves.size) {
    const sug = await sugerirBairros();
    console.log(`\n${ano}: bairro "${bairroArg}" não encontrado em ${MUNICIPIO}.` +
      (sug.length ? ` Você quis dizer: ${sug.join(" · ")}?` : ""));
    return null;
  }
  const porSq = await votosNoBairro(ano, cargo, chaves);
  const info = await infoCandidatos(ano, cargo, new Set(porSq.keys()));
  // só candidatos reais (remove VOTO NULO/BRANCO e voto de legenda — não estão no cadastro)
  let lista = [...porSq.values()]
    .filter((r) => info.has(r.sq))
    .map((r) => {
      const c = info.get(r.sq);
      return {
        nome: c.nmUrna || r.nome, partido: c.partido || "", numero: c.nrCand || "",
        votosNoBairro: r.votos, eleito: !!c.eleito, situacao: c.sit || "",
      };
    });
  const totalCandidatos = lista.length;
  if (SO_ELEITOS) lista = lista.filter((x) => x.eleito);
  lista.sort((a, b) => b.votosNoBairro - a.votosNoBairro);
  const topN = lista.slice(0, TOP);

  if (JSON_OUT) {
    console.log(JSON.stringify({ ano, cargo, bairro: nomesBairro.join("/"), locais: nLocais, candidatosNoBairro: totalCandidatos, candidatos: topN }, null, 2));
    return topN;
  }

  console.log(`\n=== ${nomesBairro.join(" / ")} — ${ano} (${cargo}) ===`);
  console.log(`${nLocais} locais de votação · ${totalCandidatos} candidatos com voto no bairro${SO_ELEITOS ? ` · mostrando ${lista.length} eleitos` : ""}`);
  console.log("pos  votos  el  nº     partido  candidato");
  topN.forEach((x, i) => {
    console.log(
      `${String(i + 1).padStart(3)}  ${String(fmt(x.votosNoBairro)).padStart(6)}  ${x.eleito ? "✔" : " "}  ` +
      `${String(x.numero).padStart(5)}  ${String(x.partido).padEnd(7)}  ${x.nome}`,
    );
  });
  const eleitos = lista.filter((x) => x.eleito).slice(0, 5);
  if (!SO_ELEITOS && eleitos.length) {
    console.log(`Top 5 ELEITOS no bairro: ${eleitos.map((x) => `${x.nome} (${x.partido}, ${fmt(x.votosNoBairro)})`).join(" · ")}`);
  }
  return topN;
}

const anos = anoArg ? [Number(anoArg)] : [2022, 2024];
for (const ano of anos) {
  if (!SECAO[ano]) { console.error(`ano ${ano} não suportado (use 2022 ou 2024)`); continue; }
  if (!existsSync(SECAO[ano])) { console.error(`\n${ano}: ${SECAO[ano]} ausente — baixe o votacao_secao do TSE.`); continue; }
  await consultar(ano);
}
