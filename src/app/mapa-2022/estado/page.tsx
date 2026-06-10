import Link from "next/link";
import { ArrowLeft, Landmark, MapPin, Trophy, Building2 } from "lucide-react";
import { Card, KpiCard, PageHeader, ProgressBar, Badge } from "@/components/ui";
import { MapaEstado } from "@/components/mapa-estado";
import {
  getMeta,
  getMunicipios2022ComGeo,
  getRegioes2022,
} from "@/lib/votos-data";
import { RJ_VIEWBOX } from "@/lib/rj-municipios-geo";
import { formatNumero, formatPct } from "@/lib/format";

export const metadata = {
  title: "Análise Estadual — Eleição 2022",
};

export default function MapaEstado2022Page() {
  const meta = getMeta(2022);
  const municipios = getMunicipios2022ComGeo();
  const maxVotos = municipios.reduce((m, x) => Math.max(m, x.votos), 0);
  const interior = municipios.filter(
    (m) => m.nome !== "RIO DE JANEIRO" && m.votos > 0,
  );
  const melhorInterior = interior[0];
  const regioes = getRegioes2022();
  const melhorRegiao = regioes[0];
  const votosInterior = meta.totalEstado - meta.totalVotos;

  return (
    <div>
      <PageHeader
        title="Análise Estadual — Eleição 2022"
        description="Votação de Renato Pellizzari para Deputado Estadual em todo o Rio de Janeiro, por município e região."
      >
        <Badge tone="violet">Deputado Estadual</Badge>
      </PageHeader>

      <Link
        href="/mapa-2022"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
      >
        <ArrowLeft className="size-4" /> Voltar ao mapa da cidade
      </Link>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Votos no estado"
          value={formatNumero(meta.totalEstado)}
          sub={`${formatNumero(meta.municipiosComVoto)} municípios`}
          icon={Landmark}
          tone="emerald"
        />
        <KpiCard
          label="Capital"
          value={formatNumero(meta.totalVotos)}
          sub={`${formatPct(meta.totalVotos / meta.totalEstado, 0)} do total`}
          icon={MapPin}
          tone="blue"
        />
        <KpiCard
          label="Interior"
          value={formatNumero(votosInterior)}
          sub={`${formatPct(votosInterior / meta.totalEstado, 0)} do total`}
          icon={MapPin}
          tone="violet"
        />
        <KpiCard
          label="Maior reduto fora da capital"
          value={melhorInterior ? melhorInterior.nomeOficial : "—"}
          sub={melhorInterior ? `${formatNumero(melhorInterior.votos)} votos` : undefined}
          icon={Trophy}
          tone="amber"
        />
      </div>

      <Card
        className="mt-4"
        title="Votos por município — estado do Rio de Janeiro"
        description="Cor por faixa de votos. A capital concentra a maior parte; o interior soma votos relevantes em redutos específicos."
      >
        <MapaEstado
          municipios={municipios}
          viewBox={RJ_VIEWBOX}
          totalEstado={meta.totalEstado}
        />
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          title="Todos os municípios"
          description={`${municipios.length} municípios — ${formatNumero(meta.totalEstado)} votos no estado`}
          className="lg:col-span-2"
          bodyClassName="p-0"
        >
          <div className="max-h-[520px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-3 py-3 font-medium">Município</th>
                  <th className="px-3 py-3 font-medium">Região</th>
                  <th className="px-3 py-3 text-right font-medium">Votos</th>
                  <th className="px-5 py-3 font-medium">% do estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {municipios.map((m, i) => (
                  <tr key={m.cdTse} className="hover:bg-slate-50/70">
                    <td className="px-5 py-2.5 tabular-nums text-slate-400">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">
                      {m.nomeOficial}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">{m.regiao}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium text-slate-800">
                      {formatNumero(m.votos)}
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          value={maxVotos ? m.votos / maxVotos : 0}
                          tone={m.nome === "RIO DE JANEIRO" ? "blue" : "emerald"}
                          className="w-24"
                        />
                        <span className="w-12 text-right text-xs tabular-nums text-slate-500">
                          {formatPct(
                            meta.totalEstado ? m.votos / meta.totalEstado : 0,
                            1,
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="Por região do estado"
          description="Inclui a capital na Metropolitana"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-slate-50">
            {regioes.map((r) => (
              <li key={r.regiao} className="px-5 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{r.regiao}</span>
                  <span className="tabular-nums text-slate-800">
                    {formatNumero(r.votos)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <ProgressBar
                    value={meta.totalEstado ? r.votos / meta.totalEstado : 0}
                    tone="emerald"
                  />
                  <span className="w-10 text-right text-xs tabular-nums text-slate-400">
                    {formatPct(meta.totalEstado ? r.votos / meta.totalEstado : 0, 0)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {r.municipios} {r.municipios === 1 ? "município" : "municípios"}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
        <Building2 className="size-3.5" />
        Fonte: TSE — votação nominal por município/zona (Deputado Estadual,
        2022). Geometria dos municípios: IBGE. Percentuais sobre os votos
        válidos do cargo.
      </p>
    </div>
  );
}
