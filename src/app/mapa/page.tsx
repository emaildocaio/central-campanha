import Link from "next/link";
import { Target, TrendingUp, MapPin, Crown } from "lucide-react";
import { Card, KpiCard, PageHeader, ProgressBar, type Tone } from "@/components/ui";
import { TopMunicipiosChart } from "@/components/charts";
import {
  getMunicipios,
  getResumoPorRegiao,
  getTotaisVotos,
  municipios as todosMunicipios,
} from "@/lib/campaign-data";
import { formatNumero, formatPct } from "@/lib/format";

function toneFor(pct: number): Tone {
  if (pct >= 1) return "emerald";
  if (pct >= 0.7) return "blue";
  return "amber";
}

export default function MapaPage() {
  const totais = getTotaisVotos();
  const regioes = getResumoPorRegiao();
  const municipios = getMunicipios();
  const top = municipios.slice(0, 12).map((m) => ({
    nome: m.nome,
    projetado: m.votosProjetados,
    meta: m.metaVotos,
  }));
  const pctGlobal = totais.projetado / totais.metaMunicipios;
  const lideresTotal = todosMunicipios.reduce((s, m) => s + m.lideres, 0);
  const cobertos = todosMunicipios.filter((m) => m.lideres > 0).length;

  return (
    <div>
      <PageHeader
        title="Mapa Eleitoral"
        description="Desempenho de votos por região e município do estado do Rio de Janeiro."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Meta (municípios)"
          value={formatNumero(totais.metaMunicipios)}
          icon={Target}
          tone="slate"
        />
        <KpiCard
          label="Votos projetados"
          value={formatNumero(totais.projetado)}
          sub={`${formatPct(pctGlobal)} da meta`}
          icon={TrendingUp}
          tone="blue"
          progress={pctGlobal}
        />
        <KpiCard
          label="Municípios cobertos"
          value={`${cobertos}/${todosMunicipios.length}`}
          icon={MapPin}
          tone="violet"
        />
        <KpiCard
          label="Lideranças no mapa"
          value={formatNumero(lideresTotal)}
          icon={Crown}
          tone="amber"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card
          title="Top municípios"
          description="Maiores projeções de votos x meta"
          className="lg:col-span-3"
        >
          <TopMunicipiosChart data={top} />
        </Card>

        <Card
          title="Desempenho por região"
          description="Projeção sobre a meta regional"
          className="lg:col-span-2"
          bodyClassName="space-y-4"
        >
          {regioes.map((r) => (
            <div key={r.regiao}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{r.regiao}</span>
                <span className="tabular-nums text-slate-500">
                  {formatNumero(r.projetado)} / {formatNumero(r.meta)} · {formatPct(r.pct)}
                </span>
              </div>
              <ProgressBar value={r.pct} tone={toneFor(r.pct)} className="mt-1.5" />
              <div className="mt-1 text-xs text-slate-400">
                {r.municipios} municípios · {r.lideres} lideranças ·{" "}
                <span className="text-emerald-600">
                  {formatNumero(r.votos2022)} votos em 2022
                </span>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card className="mt-4" bodyClassName="p-0">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Todos os municípios</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Município</th>
                <th className="px-3 py-3 font-medium">Região</th>
                <th className="px-3 py-3 text-right font-medium">Eleitorado</th>
                <th className="px-3 py-3 text-right font-medium">Lideranças</th>
                <th className="px-3 py-3 text-right font-medium">Votos 2022</th>
                <th className="px-3 py-3 text-right font-medium">Meta</th>
                <th className="px-3 py-3 text-right font-medium">Projetado</th>
                <th className="px-5 py-3 font-medium">Atingido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {municipios.map((m) => {
                const pct = m.votosProjetados / m.metaVotos;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-medium text-slate-800">{m.nome}</td>
                    <td className="px-3 py-3 text-slate-500">{m.regiao}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-600">
                      {formatNumero(m.eleitorado)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-600">
                      {m.lideres}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium text-emerald-700">
                      {formatNumero(m.votos2022 ?? 0)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-600">
                      {formatNumero(m.metaVotos)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium text-slate-800">
                      {formatNumero(m.votosProjetados)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={pct} tone={toneFor(pct)} className="w-24" />
                        <span className="w-10 text-right text-xs tabular-nums text-slate-500">
                          {formatPct(pct)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        <span className="font-medium text-emerald-600">Votos 2022</span> são a
        votação real do candidato para Deputado Estadual (fonte: TSE). Meta e
        Projetado são o planejamento da campanha de 2026. Veja o detalhamento em{" "}
        <Link href="/mapa-2022/estado" className="text-blue-700 hover:underline">
          Análise Estadual 2022
        </Link>
        .
      </p>
    </div>
  );
}
