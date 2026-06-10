import {
  Target,
  Users,
  CalendarDays,
  Wallet,
  Gauge,
  MapPin,
} from "lucide-react";
import { Card, KpiCard, PageHeader, ProgressBar, StatusBadge } from "@/components/ui";
import {
  DonutChart,
  FluxoChart,
  MetaGauge,
  VotosRegiaoChart,
} from "@/components/charts";
import {
  getDashboardKpis,
  getDespesasPorCategoria,
  getFluxoMensal,
  getMunicipios,
  getProximosEventos,
  getResumoFinanceiro,
  getResumoPorRegiao,
} from "@/lib/campaign-data";
import {
  formatBRL,
  formatDataCurta,
  formatNumero,
  formatPct,
} from "@/lib/format";

const REGIAO_CURTA: Record<string, string> = {
  Metropolitana: "Metrop.",
  "Baixada Fluminense": "Baixada",
  "Região dos Lagos": "Lagos",
  "Norte Fluminense": "Norte",
  "Noroeste Fluminense": "Noroeste",
  Serrana: "Serrana",
  "Médio Paraíba": "M. Paraíba",
  "Costa Verde": "C. Verde",
  "Centro-Sul": "Centro-Sul",
};

export default function DashboardPage() {
  const kpis = getDashboardKpis();
  const fin = getResumoFinanceiro();
  const regioes = getResumoPorRegiao().map((r) => ({
    regiao: REGIAO_CURTA[r.regiao] ?? r.regiao,
    projetado: r.projetado,
    meta: r.meta,
  }));
  const fluxo = getFluxoMensal();
  const despCat = getDespesasPorCategoria().map((d) => ({
    name: d.categoria,
    value: d.valor,
  }));
  const topMunicipios = getMunicipios().slice(0, 7);
  const proximos = getProximosEventos(5);
  const limiteTone = kpis.pctLimiteTSE > 0.7 ? "amber" : "blue";

  return (
    <div>
      <PageHeader
        title="Visão Geral"
        description="Panorama da campanha — votos, equipe, agenda e finanças em um só lugar."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Votos projetados"
          value={formatNumero(kpis.votosProjetados)}
          sub={`Meta ${formatNumero(kpis.metaVotos)} · ${formatPct(kpis.pctMeta)}`}
          icon={Target}
          tone="blue"
          progress={kpis.pctMeta}
        />
        <KpiCard
          label="Apoiadores"
          value={formatNumero(kpis.totalApoiadores)}
          sub={`${kpis.apoiadoresAtivos} ativos · ${kpis.liderancas} lideranças`}
          icon={Users}
          tone="violet"
        />
        <KpiCard
          label="Próximos eventos"
          value={formatNumero(kpis.totalEventosFuturos)}
          sub={
            kpis.proximoEvento
              ? `Próx.: ${kpis.proximoEvento.titulo} (${formatDataCurta(kpis.proximoEvento.inicio)})`
              : "Sem eventos futuros"
          }
          icon={CalendarDays}
          tone="amber"
        />
        <KpiCard
          label="Caixa"
          value={formatBRL(fin.saldo)}
          sub={`Arrecadado ${formatBRL(fin.totalReceitas)}`}
          icon={Wallet}
          tone="emerald"
        />
        <KpiCard
          label="Limite TSE"
          value={formatPct(kpis.pctLimiteTSE)}
          sub={`${formatBRL(fin.totalDespesas)} de ${formatBRL(fin.limite)}`}
          icon={Gauge}
          tone={limiteTone}
          progress={kpis.pctLimiteTSE}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          title="Votos por região"
          description="Projeção atual x meta por região do estado"
          className="lg:col-span-2"
        >
          <VotosRegiaoChart data={regioes} />
        </Card>
        <Card title="Progresso da meta" description="Votos projetados sobre a meta total">
          <MetaGauge value={kpis.pctMeta} />
          <div className="mt-2 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-lg font-semibold text-slate-900">
                {formatNumero(kpis.votosProjetados)}
              </div>
              <div className="text-xs text-slate-500">Projetados</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-lg font-semibold text-slate-900">
                {formatNumero(kpis.metaVotos)}
              </div>
              <div className="text-xs text-slate-500">Meta</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Arrecadação x Despesas" description="Evolução mensal da campanha">
          <FluxoChart data={fluxo} />
        </Card>
        <Card title="Despesas por categoria" description="Distribuição do gasto total">
          <DonutChart data={despCat} formato="brl" />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Próximos compromissos" description="Agenda dos próximos dias">
          <ul className="divide-y divide-slate-100">
            {proximos.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <span className="text-sm font-bold leading-none">
                    {formatDataCurta(e.inicio).split(" ")[0]}
                  </span>
                  <span className="text-[10px] uppercase">
                    {formatDataCurta(e.inicio).split(" ")[1]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">
                    {e.titulo}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {e.tipo} · {e.municipio}
                  </div>
                </div>
                <StatusBadge status={e.status} />
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Municípios em destaque"
          description="Projeção 2026 x votos reais de 2022"
          action={
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="size-3.5" /> {kpis.municipiosCobertos}/{kpis.totalMunicipios}{" "}
              cobertos
            </span>
          }
        >
          <ul className="space-y-3">
            {topMunicipios.map((m) => {
              const pct = m.votosProjetados / m.metaVotos;
              return (
                <li key={m.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{m.nome}</span>
                    <span className="text-slate-500">
                      {formatNumero(m.votosProjetados)} / {formatNumero(m.metaVotos)}
                    </span>
                  </div>
                  <ProgressBar
                    value={pct}
                    tone={pct >= 1 ? "emerald" : "blue"}
                    className="mt-1.5"
                  />
                  <div className="mt-1 text-xs text-slate-400">
                    Votos reais 2022:{" "}
                    <span className="font-medium text-emerald-600">
                      {formatNumero(m.votos2022 ?? 0)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
