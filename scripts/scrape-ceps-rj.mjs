// =========================================================================
// Base de CEPs do estado do RJ (fonte: ruacep.com.br)
// -------------------------------------------------------------------------
// Monta um CSV com TODO o estado do RJ no nível de logradouro:
//   uf, municipio, ibge, bairro, cep, logradouro, complemento, url
//
// Estratégia (híbrida):
//   1) sitemap   -> 4 sitemaps do RJ (~110k URLs) dão municipio/bairro/cep/rua
//   2) municipios-> /rj/municipios/  -> slug -> { nome acentuado, ibge, faixa }
//   3) bairros   -> /rj/{mun}/bairros/ -> (mun,bairro) -> { nome acentuado, faixa }
//   4) enrich    -> /rj/{mun}/logradouros/N/ -> nome de rua acentuado + complemento
//                   (cache resumível por município em scripts/.cache-ceps/)
//   5) build     -> junta tudo -> public/geo/ceps-rj.csv (+ resumo por bairro)
//
// Uso:
//   node scripts/scrape-ceps-rj.mjs --selftest        # testa parsers no HTML salvo
//   node scripts/scrape-ceps-rj.mjs municipios        # cacheia municípios
//   node scripts/scrape-ceps-rj.mjs bairros           # cacheia bairros
//   node scripts/scrape-ceps-rj.mjs sitemap           # cacheia sitemap
//   node scripts/scrape-ceps-rj.mjs build             # gera CSV (com o que houver)
//   node scripts/scrape-ceps-rj.mjs enrich            # raspa logradouros (longo)
//   node scripts/scrape-ceps-rj.mjs base              # municipios+bairros+sitemap+build
//   node scripts/scrape-ceps-rj.mjs all               # base + enrich + build
//
// Flags: --conc=6  --limit-mun=NN  --only=mun-slug,mun-slug
// =========================================================================

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(__dirname, "..");
const CACHE = join(__dirname, ".cache-ceps");
const SAIDA_CSV = join(RAIZ, "public/geo/ceps-rj.csv");
const SAIDA_BAIRROS = join(RAIZ, "public/geo/ceps-rj-bairros.csv");

const BASE = "https://www.ruacep.com.br";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const SITEMAPS = ["000000", "030000", "060000", "090000"].map(
  (n) => `${BASE}/sitemap_rj_${n}.xml`,
);

// ---- flags simples ------------------------------------------------------
const ARGS = process.argv.slice(2);
const flag = (nome, def) => {
  const a = ARGS.find((x) => x.startsWith(`--${nome}=`));
  return a ? a.split("=")[1] : def;
};
const CONC = Number(flag("conc", 6));
const LIMIT_MUN = flag("limit-mun") ? Number(flag("limit-mun")) : null;
const ONLY = flag("only") ? flag("only").split(",").map((s) => s.trim()) : null;

// =========================================================================
// utilitários
// =========================================================================
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, { retries = 4, timeout = 30000 } = {}) {
  let ultimoErro;
  for (let t = 0; t <= retries; t++) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeout);
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9" },
        signal: ctrl.signal,
      });
      clearTimeout(id);
      if (r.status === 404) return { status: 404, html: "" };
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { status: 200, html: await r.text() };
    } catch (e) {
      clearTimeout(id);
      ultimoErro = e;
      if (t < retries) await sleep(500 * 2 ** t + Math.random() * 300);
    }
  }
  throw new Error(`falha em ${url}: ${ultimoErro?.message}`);
}

// pool de concorrência: roda fn(item,i) com no máx. `conc` em paralelo
async function pool(items, conc, fn) {
  const ret = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(conc, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      ret[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return ret;
}

const PALAVRAS_MIN = new Set([
  "de", "da", "do", "das", "dos", "e", "a", "o", "as", "os",
  "du", "del", "la", "com", "sem", "sob", "sobre", "ao", "à",
]);
// de-slug -> "rua-visconde-de-itaborai" => "Rua Visconde de Itaborai"
// (sem acento; usado só na base rápida; o enrich sobrescreve com o nome real)
function deslug(slug) {
  const toks = slug.split("-");
  // separa número final (grande usuário): "...-vargas-19" => "..., 19"
  let numero = null;
  if (toks.length > 1 && /^\d+$/.test(toks[toks.length - 1])) numero = toks.pop();
  const nome = toks
    .map((w, i) =>
      i > 0 && PALAVRAS_MIN.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
  return numero ? `${nome}, ${numero}` : nome;
}

// limpa texto de HTML: tags, entidades comuns, espaços
function limpaTexto(s) {
  return (s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&aacute;/gi, "á").replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í").replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú").replace(/&atilde;/gi, "ã")
    .replace(/&otilde;/gi, "õ").replace(/&ccedil;/gi, "ç")
    .replace(/&ecirc;/gi, "ê").replace(/&acirc;/gi, "â").replace(/&ocirc;/gi, "ô")
    .replace(/&agrave;/gi, "à").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/\s+/g, " ")
    .trim();
}

const fmtCep = (cep8) => `${cep8.slice(0, 5)}-${cep8.slice(5)}`;

// maior número de página citado na paginação de um tipo (/<kind>/N/)
function maxPagina(html, kind) {
  const re = new RegExp(`/${kind}/(\\d+)/`, "g");
  let m, max = 1;
  while ((m = re.exec(html))) max = Math.max(max, +m[1]);
  return max;
}

// CSV (RFC-4180): aspas se tiver vírgula/aspas/quebra
function csvCampo(v) {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const csvLinha = (arr) => arr.map(csvCampo).join(",");

// =========================================================================
// parsers
// =========================================================================

// /rj/municipios/ -> [{slug, nome, ibge, cepIni, cepFim, ddd}]
function parseMunicipios(html) {
  const out = [];
  const re =
    /<a href="https:\/\/www\.ruacep\.com\.br\/rj\/([^"/]+)\/bairros\/"[^>]*>\s*<strong>([^<]+?),\s*RJ\s*<\/strong>/g;
  let m;
  while ((m = re.exec(html))) {
    const slug = m[1];
    const nome = limpaTexto(m[2]);
    // bloco a partir daqui até o próximo link de município, p/ pegar IBGE/CEP/DDD
    const resto = html.slice(m.index, m.index + 600);
    const cep = resto.match(/CEP:\s*(\d{5}-\d{3})\s*à\s*(\d{5}-\d{3})/);
    const ibge = resto.match(/IBGE:\s*(\d+)/);
    const ddd = resto.match(/DDD:\s*(\d+)/);
    out.push({
      slug,
      nome,
      ibge: ibge ? ibge[1] : "",
      cepIni: cep ? cep[1] : "",
      cepFim: cep ? cep[2] : "",
      ddd: ddd ? ddd[1] : "",
    });
  }
  return out;
}

// /rj/{mun}/bairros/ -> {bairros:[{slug,nome,cepIni,cepFim}], maxPage}
function parseBairros(html) {
  const out = [];
  const re =
    /<a href="https:\/\/www\.ruacep\.com\.br\/rj\/[^"/]+\/([^"/]+)\/logradouros\/"[^>]*>\s*<strong>([^<]+)<\/strong>/g;
  let m;
  while ((m = re.exec(html))) {
    const slug = m[1];
    const nome = limpaTexto(m[2]);
    const resto = html.slice(m.index, m.index + 400);
    const cep = resto.match(/CEP:\s*(\d{5}-\d{3})\s*à\s*(\d{5}-\d{3})/);
    out.push({
      slug,
      nome,
      cepIni: cep ? cep[1] : "",
      cepFim: cep ? cep[2] : "",
    });
  }
  return { bairros: out, maxPage: maxPagina(html, "bairros") };
}

// /rj/{mun}/logradouros/N/ (ou /rj/{mun}/{bairro}/logradouros/N/)
// -> {entries:[{url,munSlug,bairroSlug,cep,endereco,complemento}], maxPage}
function parseLogradouros(html) {
  // 1) acha todas as âncoras de entrada (endereço no <strong>, demais campos na URL)
  const reAnchor =
    /<a href="(https:\/\/www\.ruacep\.com\.br\/rj\/([^"/]+)\/([^"/]+)\/(\d{8})-[^"]*\/)"\s+class="text-decoration-none">\s*<strong>([^<]+)<\/strong>\s*<\/a>/g;
  const anc = [];
  let m;
  while ((m = reAnchor.exec(html)))
    anc.push({
      idx: m.index, end: reAnchor.lastIndex,
      url: m[1], munSlug: m[2], bairroSlug: m[3], cep8: m[4],
      endereco: limpaTexto(m[5]),
    });
  // 2) p/ cada âncora, lê a "cauda" até a próxima entrada (máx 600 chars):
  //    CEP na linha "CEP: ..." e complemento no <small> logo após o CEP
  const out = [];
  for (let i = 0; i < anc.length; i++) {
    const a = anc[i];
    const fim = anc[i + 1] ? Math.min(anc[i + 1].idx, a.end + 600) : a.end + 600;
    const cauda = html.slice(a.end, fim);
    const cepM = cauda.match(/CEP:\s*(\d{5}-\d{3})/);
    const compM = cauda.match(/CEP:\s*\d{5}-\d{3}[\s\S]{0,160}?<small>([\s\S]*?)<\/small>/);
    out.push({
      url: a.url,
      munSlug: a.munSlug,
      bairroSlug: a.bairroSlug,
      cep: cepM ? cepM[1] : fmtCep(a.cep8),
      endereco: a.endereco,
      complemento: compM ? limpaTexto(compM[1]) : "",
    });
  }
  return { entries: out, maxPage: maxPagina(html, "logradouros") };
}

// =========================================================================
// estágios
// =========================================================================
async function garanteCache() {
  if (!existsSync(CACHE)) await mkdir(CACHE, { recursive: true });
}

async function estagioMunicipios() {
  await garanteCache();
  const todos = [];
  for (let p = 1; p <= 6; p++) {
    const url = p === 1 ? `${BASE}/rj/municipios/` : `${BASE}/rj/municipios/${p}/`;
    const { status, html } = await fetchText(url);
    if (status === 404) break;
    const lista = parseMunicipios(html);
    todos.push(...lista);
    const max = maxPagina(html, "municipios");
    if (p >= max) break;
  }
  // dedup por slug
  const mapa = {};
  for (const m of todos) if (!mapa[m.slug]) mapa[m.slug] = m;
  await writeFile(join(CACHE, "municipios.json"), JSON.stringify(mapa, null, 2));
  console.log(`✅ municipios: ${Object.keys(mapa).length} (esperado 92)`);
  return mapa;
}

async function carregaMunicipios() {
  const f = join(CACHE, "municipios.json");
  if (!existsSync(f)) return estagioMunicipios();
  return JSON.parse(await readFile(f, "utf8"));
}

async function estagioBairros() {
  await garanteCache();
  const muns = await carregaMunicipios();
  let slugs = Object.keys(muns).sort();
  if (ONLY) slugs = slugs.filter((s) => ONLY.includes(s));
  if (LIMIT_MUN) slugs = slugs.slice(0, LIMIT_MUN);

  const mapa = {}; // "mun|bairro" -> {munSlug,bairroSlug,nome,cepIni,cepFim}
  let totalBairros = 0;
  await pool(slugs, CONC, async (mun) => {
    let p = 1, max = 1;
    do {
      const url =
        p === 1
          ? `${BASE}/rj/${mun}/bairros/`
          : `${BASE}/rj/${mun}/bairros/${p}/`;
      const { status, html } = await fetchText(url);
      if (status === 404) break;
      const { bairros, maxPage } = parseBairros(html);
      if (p === 1) max = maxPage;
      for (const b of bairros) {
        mapa[`${mun}|${b.slug}`] = { munSlug: mun, bairroSlug: b.slug, ...b };
        totalBairros++;
      }
      p++;
    } while (p <= max);
  });
  await writeFile(join(CACHE, "bairros.json"), JSON.stringify(mapa, null, 2));
  console.log(`✅ bairros: ${Object.keys(mapa).length} pares (mun|bairro)`);
  return mapa;
}

async function carregaBairros() {
  const f = join(CACHE, "bairros.json");
  if (!existsSync(f)) return estagioBairros();
  return JSON.parse(await readFile(f, "utf8"));
}

async function estagioSitemap() {
  await garanteCache();
  const linhas = [];
  for (const url of SITEMAPS) {
    const { html } = await fetchText(url);
    const locs = [...html.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((x) =>
      x[1].trim(),
    );
    for (const u of locs) {
      const seg = u.replace(`${BASE}/`, "").replace(/\/$/, "").split("/");
      if (seg.length !== 4) continue; // [rj, mun, bairro, cep-rua]
      const mm = seg[3].match(/^(\d{8})-(.*)$/);
      if (!mm) continue;
      linhas.push({
        munSlug: seg[1],
        bairroSlug: seg[2],
        cep: fmtCep(mm[1]),
        ruaSlug: mm[2],
        url: u,
      });
    }
  }
  await writeFile(join(CACHE, "sitemap.json"), JSON.stringify(linhas));
  console.log(`✅ sitemap: ${linhas.length} CEPs (esperado ~110476)`);
  return linhas;
}

async function carregaSitemap() {
  const f = join(CACHE, "sitemap.json");
  if (!existsSync(f)) return estagioSitemap();
  return JSON.parse(await readFile(f, "utf8"));
}

// enrich: raspa /rj/{mun}/{bairro}/logradouros/ (traz complemento), cache por município
async function estagioEnrich() {
  await garanteCache();
  const muns = await carregaMunicipios();
  const bairros = await carregaBairros();
  let slugs = Object.keys(muns).sort();
  if (ONLY) slugs = slugs.filter((s) => ONLY.includes(s));
  if (LIMIT_MUN) slugs = slugs.slice(0, LIMIT_MUN);

  // agrupa bairros por município
  const bairrosPorMun = {};
  for (const v of Object.values(bairros))
    (bairrosPorMun[v.munSlug] ||= []).push(v.bairroSlug);

  const progresso = await lerProgresso();
  const pendentes = slugs.filter((s) => !progresso[s]);
  console.log(
    `enrich (bairro-level): ${slugs.length} munis | feitos ${slugs.length - pendentes.length} | pendentes ${pendentes.length} | conc ${CONC}`,
  );
  let totalCeps = 0;
  for (const v of Object.values(progresso)) totalCeps += v.ceps || 0;

  for (let n = 0; n < pendentes.length; n++) {
    const mun = pendentes[n];
    const t0 = Date.now();
    const bs = (bairrosPorMun[mun] || []).slice().sort();

    // fase 1: página 1 de cada bairro (descobre maxPage)
    const p1 = await pool(bs, CONC, async (b) => {
      const { status, html } = await fetchText(`${BASE}/rj/${mun}/${b}/logradouros/`);
      if (status === 404) return { entries: [], maxPage: 1 };
      const r = parseLogradouros(html);
      return { entries: r.entries, maxPage: r.maxPage };
    });
    // fase 2: páginas 2..maxPage de cada bairro
    const tarefas = [];
    p1.forEach((r, j) => {
      for (let p = 2; p <= r.maxPage; p++) tarefas.push({ b: bs[j], p });
    });
    const extra = await pool(tarefas, CONC, async ({ b, p }) => {
      const { status, html } = await fetchText(`${BASE}/rj/${mun}/${b}/logradouros/${p}/`);
      return status === 404 ? [] : parseLogradouros(html).entries;
    });

    // junta + dedup por url
    const porUrl = {};
    for (const r of p1) for (const e of r.entries) porUrl[e.url] = e;
    for (const arr of extra) for (const e of arr) porUrl[e.url] = e;
    const entradas = Object.values(porUrl);

    await writeFile(
      join(CACHE, `log-${mun}.jsonl`),
      entradas.map((e) => JSON.stringify(e)).join("\n"),
    );
    progresso[mun] = { ceps: entradas.length, bairros: bs.length, paginas: bs.length + tarefas.length };
    await gravarProgresso(progresso);
    totalCeps += entradas.length;
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(
      `  [${String(n + 1).padStart(3)}/${pendentes.length}] ${mun.padEnd(26)} ${String(bs.length).padStart(3)}bai ${String(bs.length + tarefas.length).padStart(4)}pg ${String(entradas.length).padStart(6)}cep ${dt}s | acum ${totalCeps}`,
    );
  }
  console.log(`✅ enrich concluído. CEPs coletados: ${totalCeps}`);
}

async function lerProgresso() {
  const f = join(CACHE, "_progresso.json");
  return existsSync(f) ? JSON.parse(await readFile(f, "utf8")) : {};
}
async function gravarProgresso(p) {
  await writeFile(join(CACHE, "_progresso.json"), JSON.stringify(p, null, 2));
}

// carrega todos os log-*.jsonl -> mapa url -> {endereco,complemento}
async function carregaEnrich() {
  const mapa = {};
  if (!existsSync(CACHE)) return mapa;
  const arqs = (await readdir(CACHE)).filter(
    (a) => a.startsWith("log-") && a.endsWith(".jsonl"),
  );
  for (const a of arqs) {
    const txt = await readFile(join(CACHE, a), "utf8");
    for (const linha of txt.split("\n")) {
      if (!linha.trim()) continue;
      const e = JSON.parse(linha);
      mapa[e.url] = e;
    }
  }
  return mapa;
}

// build: junta sitemap + municipios + bairros + enrich -> CSV
async function estagioBuild() {
  const [sitemap, muns, bairros, enrich] = await Promise.all([
    carregaSitemap(),
    carregaMunicipios(),
    carregaBairros(),
    carregaEnrich(),
  ]);
  const temEnrich = Object.keys(enrich).length;
  console.log(
    `build: ${sitemap.length} CEPs | municipios ${Object.keys(muns).length} | bairros ${Object.keys(bairros).length} | enriquecidos ${temEnrich}`,
  );

  const header = [
    "uf", "municipio", "ibge", "bairro", "cep", "logradouro", "complemento", "url",
  ];
  const linhas = [csvLinha(header)];

  let semEnrich = 0;
  // ordena por municipio, bairro, cep p/ leitura agradável
  sitemap.sort(
    (a, b) =>
      a.munSlug.localeCompare(b.munSlug) ||
      a.bairroSlug.localeCompare(b.bairroSlug) ||
      a.cep.localeCompare(b.cep),
  );

  for (const r of sitemap) {
    const mun = muns[r.munSlug];
    const bai = bairros[`${r.munSlug}|${r.bairroSlug}`];
    const en = enrich[r.url];
    if (!en) semEnrich++;
    const municipio = mun?.nome || deslug(r.munSlug);
    const bairro = bai?.nome || deslug(r.bairroSlug);
    const logradouro = en?.endereco || deslug(r.ruaSlug);
    const complemento = en?.complemento || "";
    const ibge = mun?.ibge || "";
    linhas.push(
      csvLinha([
        "RJ", municipio, ibge, bairro, r.cep, logradouro, complemento, r.url,
      ]),
    );
  }

  await mkdir(dirname(SAIDA_CSV), { recursive: true });
  await writeFile(SAIDA_CSV, "﻿" + linhas.join("\n") + "\n", "utf8");
  console.log(
    `✅ ${SAIDA_CSV}  (${sitemap.length} linhas | sem enrich ${semEnrich})`,
  );

  // resumo por bairro
  const hb = ["uf", "municipio", "ibge", "bairro", "cep_inicio", "cep_fim", "qtd_ceps"];
  const contagem = {};
  for (const r of sitemap) {
    const k = `${r.munSlug}|${r.bairroSlug}`;
    contagem[k] = (contagem[k] || 0) + 1;
  }
  const lb = [csvLinha(hb)];
  for (const k of Object.keys(bairros).sort()) {
    const b = bairros[k];
    const mun = muns[b.munSlug];
    lb.push(
      csvLinha([
        "RJ", mun?.nome || deslug(b.munSlug), mun?.ibge || "",
        b.nome, b.cepIni, b.cepFim, contagem[k] || 0,
      ]),
    );
  }
  await writeFile(SAIDA_BAIRROS, "﻿" + lb.join("\n") + "\n", "utf8");
  console.log(`✅ ${SAIDA_BAIRROS}  (${Object.keys(bairros).length} bairros)`);
}

// =========================================================================
// selftest: valida parsers no HTML salvo em /tmp
// =========================================================================
async function selftest() {
  const checks = [];
  const ver = (cond, msg) => {
    checks.push(cond);
    console.log(`${cond ? "✓" : "✗"} ${msg}`);
  };

  if (existsSync("/tmp/muni1.html")) {
    const html = await readFile("/tmp/muni1.html", "utf8");
    const lista = parseMunicipios(html);
    ver(lista.length >= 20, `municipios: >=20 na pág1 (got ${lista.length})`);
    const angra = lista.find((m) => m.slug === "angra-dos-reis");
    ver(
      angra && angra.nome === "Angra dos Reis" && angra.ibge === "3300100",
      `municipios: Angra "${angra?.nome}" ibge=${angra?.ibge} cep=${angra?.cepIni}..${angra?.cepFim}`,
    );
  } else console.log("(sem /tmp/muni1.html)");

  if (existsSync("/tmp/bai1.html")) {
    const html = await readFile("/tmp/bai1.html", "utf8");
    const { bairros } = parseBairros(html);
    ver(bairros.length >= 10, `bairros: >=10 na pág1 (got ${bairros.length})`);
    const adri = bairros.find((b) => b.slug === "adrianopolis");
    ver(
      adri && adri.nome === "Adrianópolis",
      `bairros: Adrianópolis "${adri?.nome}" cep=${adri?.cepIni}..${adri?.cepFim}`,
    );
  } else console.log("(sem /tmp/bai1.html)");

  if (existsSync("/tmp/list1.html")) {
    const html = await readFile("/tmp/list1.html", "utf8");
    const { entries, maxPage } = parseLogradouros(html);
    ver(entries.length === 20, `bairro-level: 20 entradas (got ${entries.length})`);
    ver(maxPage === 30, `bairro-level: maxPage 30 (got ${maxPage})`);
    const e0 = entries[0];
    ver(
      e0.endereco === "Praça Academia" && e0.cep === "20020-030",
      `bairro-level entrada[0]: "${e0.endereco}" ${e0.cep} bairro=${e0.bairroSlug}`,
    );
    ver(entries.every((e) => /^\d{5}-\d{3}$/.test(e.cep)), `bairro-level: todos CEPs no formato`);
  } else console.log("(sem /tmp/list1.html)");

  if (existsSync("/tmp/city1.html")) {
    const html = await readFile("/tmp/city1.html", "utf8");
    const { entries, maxPage } = parseLogradouros(html);
    ver(entries.length === 20, `city-level: 20 entradas (got ${entries.length})`);
    ver(maxPage === 1454, `city-level: maxPage 1454 (got ${maxPage})`);
    const bairrosDistintos = new Set(entries.map((e) => e.bairroSlug)).size;
    ver(bairrosDistintos >= 2, `city-level: bairro vem da URL (${bairrosDistintos} distintos na pág1)`);
    console.log("   amostra city:", entries.slice(0, 3).map((e) => `${e.bairroSlug}/${e.cep} ${e.endereco}`).join(" | "));
  } else console.log("(sem /tmp/city1.html)");

  if (existsSync("/tmp/arr-bairro.html")) {
    const html = await readFile("/tmp/arr-bairro.html", "utf8");
    const { entries } = parseLogradouros(html);
    ver(entries.length === 2, `arr-bairro: 2 entradas (got ${entries.length})`);
    ver(
      /Loja A/.test(entries[0]?.complemento || "") &&
        entries[0]?.endereco === "Avenida Getúlio Vargas, 19",
      `arr-bairro: endereço+complemento -> "${entries[0]?.endereco}" | "${entries[0]?.complemento}"`,
    );
  } else console.log("(sem /tmp/arr-bairro.html)");

  const todosOk = checks.every(Boolean);
  console.log(todosOk ? "\n✅ selftest OK" : "\n❌ selftest FALHOU");
  if (!todosOk) process.exitCode = 1;
}

// =========================================================================
// dispatch
// =========================================================================
let cmd = ARGS.find((a) => !a.startsWith("--")) || "all";
if (ARGS.includes("--selftest")) cmd = "selftest";
const t0 = Date.now();
switch (cmd) {
  case "selftest": await selftest(); break;
  case "municipios": await estagioMunicipios(); break;
  case "bairros": await estagioBairros(); break;
  case "sitemap": await estagioSitemap(); break;
  case "enrich": await estagioEnrich(); break;
  case "build": await estagioBuild(); break;
  case "base":
    await estagioMunicipios();
    await estagioBairros();
    await estagioSitemap();
    await estagioBuild();
    break;
  case "all":
    await estagioMunicipios();
    await estagioBairros();
    await estagioSitemap();
    await estagioBuild();
    await estagioEnrich();
    await estagioBuild();
    break;
  default:
    console.log(`comando desconhecido: ${cmd}`);
    process.exitCode = 1;
}
console.log(`(${((Date.now() - t0) / 1000).toFixed(1)}s)`);
