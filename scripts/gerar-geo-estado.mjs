// =========================================================================
// Geojson dos municípios do RJ -> src/lib/rj-municipios-geo.ts
// -------------------------------------------------------------------------
// Projeta o geojson (lon/lat) para coordenadas de SVG (equiretangular com
// correção de cos(lat)) e emite um módulo TS com os paths já prontos — no
// mesmo padrão de src/lib/rio-bairros-geo.ts.
//
// Uso:  node scripts/gerar-geo-estado.mjs
// =========================================================================

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(__dirname, "..");
const GEOJSON = join(RAIZ, "public/geo/rj-municipios.geojson");
const SAIDA = join(RAIZ, "src/lib/rj-municipios-geo.ts");

const W = 1000; // largura do viewBox
const r1 = (n) => Math.round(n * 10) / 10;

const norm = (s) =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();

const fc = JSON.parse(await readFile(GEOJSON, "utf8"));

// bounds globais
let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
const scanBounds = (coords) => {
  for (const c of coords) {
    if (typeof c[0] === "number") {
      minLon = Math.min(minLon, c[0]); maxLon = Math.max(maxLon, c[0]);
      minLat = Math.min(minLat, c[1]); maxLat = Math.max(maxLat, c[1]);
    } else scanBounds(c);
  }
};
for (const f of fc.features) scanBounds(f.geometry.coordinates);

const latRef = ((minLat + maxLat) / 2) * (Math.PI / 180);
const kx = Math.cos(latRef);
const scale = W / ((maxLon - minLon) * kx);
const H = Math.round((maxLat - minLat) * scale);

const projX = (lon) => r1((lon - minLon) * kx * scale);
const projY = (lat) => r1((maxLat - lat) * scale);

function ringToPath(ring) {
  let d = "";
  ring.forEach(([lon, lat], i) => {
    d += `${i === 0 ? "M" : "L"}${projX(lon)} ${projY(lat)}`;
  });
  return d + "Z";
}

const itens = fc.features
  .map((f) => {
    const polys = f.geometry.coordinates; // Polygon: [ring, ...holes]
    const d = polys.map(ringToPath).join("");
    // centroide aproximado pelo anel externo
    const ext = polys[0];
    let sx = 0, sy = 0;
    for (const [lon, lat] of ext) { sx += projX(lon); sy += projY(lat); }
    const cx = r1(sx / ext.length);
    const cy = r1(sy / ext.length);
    return {
      id: String(f.properties.id ?? ""),
      nome: f.properties.name ?? "",
      chave: norm(f.properties.name ?? ""),
      d,
      cx,
      cy,
    };
  })
  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

const linhas = itens
  .map(
    (m) =>
      `  { id: ${JSON.stringify(m.id)}, nome: ${JSON.stringify(m.nome)}, chave: ${JSON.stringify(m.chave)}, cx: ${m.cx}, cy: ${m.cy}, d: ${JSON.stringify(m.d)} },`,
  )
  .join("\n");

const ts = `// GERADO AUTOMATICAMENTE por scripts/gerar-geo-estado.mjs — não editar a mão.
// Geometria dos municípios do RJ (IBGE), projetada para SVG
// (equiretangular, escala por cos(lat)). \`chave\` = nome normalizado p/ join.

export interface MunicipioGeo {
  id: string;
  nome: string;
  chave: string;
  cx: number;
  cy: number;
  d: string;
}

export const RJ_VIEWBOX_W = ${W};
export const RJ_VIEWBOX_H = ${H};
export const RJ_VIEWBOX = "0 0 ${W} ${H}";

export const municipiosGeo: MunicipioGeo[] = [
${linhas}
];
`;

await writeFile(SAIDA, ts, "utf8");
console.log(`✅ ${itens.length} municípios projetados -> src/lib/rj-municipios-geo.ts`);
console.log(`   viewBox 0 0 ${W} ${H} | bbox lon ${minLon.toFixed(2)}..${maxLon.toFixed(2)} lat ${minLat.toFixed(2)}..${maxLat.toFixed(2)}`);
