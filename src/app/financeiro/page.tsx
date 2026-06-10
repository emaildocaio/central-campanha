import { TrendingUp, TrendingDown, Wallet, Gauge, AlertTriangle } from "lucide-react";
import { Card, KpiCard, PageHeader, StatusBadge } from "@/components/ui";
import { DonutChart, FluxoChart } from "@/components/charts";
import {
  getDespesas,
  getDespesasPorCategoria,
  getFluxoMensal,
  getReceitas,
  getReceitasPorTipo,
  getResumoFinanceiro,
} from "@/lib/campaign-data";
import { formatBRL, formatData, formatPct } from "@/lib/format";

export default function FinanceiroPage() {
  const fin = getResumoFinanceiro();
  const fluxo = getFluxoMensal();
  const recTipo = getReceitasPorTipo().map((r) => ({ name: r.tipo, value: r.valor }));
  const despCat = getDespesasPorCategoria().map((d) => ({
    name: d.categoria,
    value: d.valor,
  }));
  const receitas = [...getReceitas()].sort((a, b) => b.data.localeCompare(a.data));
  const despesas = [...getDespesas()].sort((a, b) => b.data.localeCompare(a.data));
  const limiteTone = fin.pctLimite > 0.7 ? "amber" : "emerald";

  return (
    <div>
      <PageHeader
        title="Financeiro de Campanha"
        description="Receitas, despesas e acompanhamento do limite de gastos do TSE."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Arrecadado"
          value={formatBRL(fin.totalReceitas)}
          icon={TrendingUp}
          tone="emerald"
        />
        <KpiCard
          label="Gasto"
          value={formatBRL(fin.totalDespesas)}
          sub={`${formatBRL(fin.despesasPendentes)} pendente`}
          icon={TrendingDown}
          tone="rose"
        />
        <KpiCard
          label="Caixa disponível"
          value={formatBRL(fin.caixaDisponivel)}
          sub={`Saldo líquido ${formatBRL(fin.saldo)}`}
          icon={Wallet}
          tone="blue"
        />
        <KpiCard
          label="Limite TSE"
          value={formatPct(fin.pctLimite)}
          sub={`Teto ${formatBRL(fin.limite)}`}
          icon={Gauge}
          tone={limiteTone}
          progress={fin.pctLimite}
        />
      </div>

      {fin.despesasPendentes > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="size-5 shrink-0" />
          <span>
            Há <strong>{formatBRL(fin.despesasPendentes)}</strong> em despesas pendentes de
            pagamento. Regularize antes do prazo da prestação de contas.
          </span>
        </div>
      )}

      <Card className="mt-4" title="Arrecadação x Despesas" description="Evolução mensal">
        <FluxoChart data={fluxo} />
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Receitas por origem" description="De onde vêm os recursos">
          <DonutChart data={recTipo} formato="brl" />
        </Card>
        <Card title="Despesas por categoria" description="Para onde vai o gasto">
          <DonutChart data={despCat} formato="brl" />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card bodyClassName="p-0" title={`Receitas (${receitas.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-3 py-3 font-medium">Origem</th>
                  <th className="px-3 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {receitas.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 whitespace-nowrap text-slate-500">
                      {formatData(r.data)}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{r.origem}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">{r.tipo}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium text-emerald-700">
                      {formatBRL(r.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card bodyClassName="p-0" title={`Despesas (${despesas.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-3 py-3 font-medium">Descrição</th>
                  <th className="px-3 py-3 font-medium">Categoria</th>
                  <th className="px-3 py-3 text-right font-medium">Valor</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {despesas.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 whitespace-nowrap text-slate-500">
                      {formatData(d.data)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-slate-700">{d.descricao}</div>
                      <div className="text-xs text-slate-400">{d.fornecedor}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">{d.categoria}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium text-slate-800">
                      {formatBRL(d.valor)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Os valores seguem as regras de prestação de contas do TSE. O limite de gastos é
        configurável conforme o teto oficial da eleição.
      </p>
    </div>
  );
}
