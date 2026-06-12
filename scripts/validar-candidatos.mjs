// =========================================================================
// Valida os datasets por candidato (src/data/eleicoes/candidatos/*.json)
// contra a base OFICIAL do TSE no disco:
//  • 2022/2024 -> cruza com votacao_candidato_munzona (agregação independente
//    da seção que gerou os datasets => cruzamento real entre 2 fontes do TSE).
//  • 2018/2020 -> re-soma da votacao_secao (fonte oficial desses anos).
// Também checa consistência interna: soma(municípios)=totalRJ, soma(zonas)=totalCapital.
//
// Uso: node scripts/validar-candidatos.mjs
// =========================================================================
import { createReadStream, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(__dirname, "..");
const DIR = join(RAIZ, "src/data/eleicoes/candidatos");
const CAPITAL = "RIO DE JANEIRO";

// SQ por candidato×ano (mesmo registro do gerador)
const SQ = {
  "renato-pellizzari": { 2022: "190001639149", 2024: "190002266214" },
  "marcelo-freixo": { 2018: "190000602109", 2022: "190001609389" },
  "reimont": { 2018: "190000613596", 2020: "190001022674", 2022: "190001619218" },
  "renan-ferreirinha": { 2018: "190000622928", 2022: "190001603419" },
  "martha-rocha": { 2018: "190000622173", 2022: "190001654227" },
  "tatiana-roque": { 2018: "190000602121", 2022: "190001645410", 2024: "190002266175" },
  "heloisa-helena": { 2022: "190001600476", 2024: "190002142528" },
};

const MUNZONA = {
  2022: join(RAIZ, "data/votacao_candidato_munzona_2022/votacao_candidato_munzona_2022_RJ.csv"),
  2024: join(RAIZ, "votacao_candidato_munzona_2024/votacao_candidato_munzona_2024_RJ.csv"),
};
const SECAO = (ano) => join(RAIZ, `votacao_secao_${ano}_RJ/votacao_secao_${ano}_RJ.csv`);
const M = { nmMun: 14, sq: 18, votos: 45 }; // candidato_munzona
const S = { nmMun: 14, sq: 23, votos: 21 }; // votacao_secao

const num = (v) => { const x = parseInt(v, 10); return Number.isFinite(x) ? x : 0; };
function pl(l) { const o = []; let a = "", q = false; for (const c of l) { if (c === '"') q = !q; else if (c === ";" && !q) { o.push(a); a = ""; } else a += c; } o.push(a); return o; }
async function ler(arq, cb) {
  const rl = createInterface({ input: createReadStream(arq, { encoding: "latin1" }), crlfDelay: Infinity });
  let h = true;
  for await (const l of rl) { if (h) { h = false; continue; } if (l) cb(pl(l)); }
}

async function main() {
  // (ano -> Map(sq -> slug))
  const porAno = {};
  for (const [slug, anos] of Object.entries(SQ))
    for (const [ano, sq] of Object.entries(anos)) (porAno[ano] ||= new Map()).set(sq, slug);

  // dataset (o que o app usa)
  const ds = {};
  for (const [slug, anos] of Object.entries(SQ))
    for (const ano of Object.keys(anos)) {
      const j = JSON.parse(await readFile(join(DIR, `${slug}-${ano}.json`), "utf8"));
      ds[`${slug}-${ano}`] = {
        totalRJ: j.totalRJ, totalCapital: j.totalCapital,
        somaMun: j.municipios.reduce((s, m) => s + m.votos, 0),
        somaZonas: j.zonas.reduce((s, z) => s + z.votos, 0),
      };
    }

  // recomputa da base oficial
  const of = {};
  for (const ano of Object.keys(porAno).sort()) {
    const alvo = porAno[ano];
    const usaMun = MUNZONA[ano] && existsSync(MUNZONA[ano]);
    const arq = usaMun ? MUNZONA[ano] : SECAO(ano);
    const idx = usaMun ? M : S;
    const acc = new Map();
    for (const sq of alvo.keys()) acc.set(sq, { rj: 0, cap: 0 });
    await ler(arq, (f) => {
      const a = acc.get(f[idx.sq]); if (!a) return;
      const v = num(f[idx.votos]); a.rj += v; if (f[idx.nmMun] === CAPITAL) a.cap += v;
    });
    for (const [sq, slug] of alvo) of[`${slug}-${ano}`] = { ...acc.get(sq), fonte: usaMun ? "munzona" : "seção" };
  }

  // relatório
  const ok = (a, b) => (a === b ? "OK" : `DIVERGE (${a} vs ${b})`);
  let falhas = 0;
  console.log("cand×ano                fonte     RJ(dataset=oficial)        capital(dataset=oficial)     soma_mun=RJ  soma_zonas=cap");
  for (const key of Object.keys(ds).sort()) {
    const d = ds[key], o = of[key];
    const rjOk = d.totalRJ === o.rj, capOk = d.totalCapital === o.cap;
    const munOk = d.somaMun === d.totalRJ, zonaOk = d.somaZonas === d.totalCapital;
    if (!(rjOk && capOk && munOk && zonaOk)) falhas++;
    console.log(
      `${key.padEnd(22)}  ${o.fonte.padEnd(8)}  ` +
      `${rjOk ? "✓ " + String(d.totalRJ).padStart(8) : "❌ " + d.totalRJ + "≠" + o.rj}   ` +
      `${capOk ? "✓ " + String(d.totalCapital).padStart(8) : "❌ " + d.totalCapital + "≠" + o.cap}   ` +
      `${munOk ? "✓" : "❌"}            ${zonaOk ? "✓" : "❌"}`,
    );
  }
  console.log(falhas === 0
    ? "\n✅ GARANTIDO: todos os totais batem com a base oficial do TSE."
    : `\n⚠️ ${falhas} candidato(s) com divergência — investigar.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
