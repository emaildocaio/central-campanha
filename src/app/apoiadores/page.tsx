"use client";

import { useMemo, useState } from "react";
import { Search, Users, UserCheck, Crown, Vote } from "lucide-react";
import { Badge, Card, KpiCard, PageHeader, StatusBadge } from "@/components/ui";
import { getApoiadores, getResumoApoiadores } from "@/lib/campaign-data";
import { formatData, formatNumero } from "@/lib/format";

const TIPOS = ["Liderança", "Cabo eleitoral", "Voluntário", "Doador"] as const;
const STATUS = ["Ativo", "Potencial", "Inativo"] as const;

export default function ApoiadoresPage() {
  const todos = getApoiadores();
  const resumo = getResumoApoiadores();
  const regioes = useMemo(
    () => [...new Set(todos.map((a) => a.regiao))].sort(),
    [todos],
  );

  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [regiao, setRegiao] = useState("todas");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return todos
      .filter((a) => {
        const matchBusca =
          !q ||
          a.nome.toLowerCase().includes(q) ||
          a.municipio.toLowerCase().includes(q);
        const matchTipo = tipo === "todos" || a.tipo === tipo;
        const matchStatus = status === "todos" || a.status === status;
        const matchRegiao = regiao === "todas" || a.regiao === regiao;
        return matchBusca && matchTipo && matchStatus && matchRegiao;
      })
      .sort((a, b) => b.votosEstimados - a.votosEstimados);
  }, [todos, busca, tipo, status, regiao]);

  const votosFiltrados = filtrados.reduce((s, a) => s + a.votosEstimados, 0);

  const selectClass =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none";

  return (
    <div>
      <PageHeader
        title="Apoiadores"
        description="Lideranças, cabos eleitorais, voluntários e doadores da campanha."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total" value={formatNumero(resumo.total)} icon={Users} tone="blue" />
        <KpiCard
          label="Ativos"
          value={formatNumero(resumo.ativos)}
          sub={`${resumo.potenciais} potenciais`}
          icon={UserCheck}
          tone="emerald"
        />
        <KpiCard
          label="Lideranças"
          value={formatNumero(resumo.liderancas)}
          icon={Crown}
          tone="violet"
        />
        <KpiCard
          label="Votos estimados"
          value={formatNumero(resumo.votosEstimados)}
          sub="Soma das estimativas da rede"
          icon={Vote}
          tone="amber"
        />
      </div>

      <Card className="mt-4" bodyClassName="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou município…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={selectClass}>
            <option value="todos">Todos os tipos</option>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={selectClass}
          >
            <option value="todos">Todos os status</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={regiao}
            onChange={(e) => setRegiao(e.target.value)}
            className={selectClass}
          >
            <option value="todas">Todas as regiões</option>
            {regioes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="mt-4" bodyClassName="p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Lista de apoiadores</h2>
          <span className="text-xs text-slate-500">
            {filtrados.length} de {todos.length} · {formatNumero(votosFiltrados)} votos estimados
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-3 py-3 font-medium">Tipo</th>
                <th className="px-3 py-3 font-medium">Município</th>
                <th className="px-3 py-3 font-medium">Responsável</th>
                <th className="px-3 py-3 text-right font-medium">Meta</th>
                <th className="px-3 py-3 text-right font-medium">Estimado</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Últ. contato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtrados.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-800">{a.nome}</div>
                    <div className="text-xs text-slate-400">{a.telefone}</div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone="slate">{a.tipo}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-slate-700">{a.municipio}</div>
                    <div className="text-xs text-slate-400">{a.regiao}</div>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{a.responsavel}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-600">
                    {a.metaVotos ? formatNumero(a.metaVotos) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium text-slate-800">
                    {a.votosEstimados ? formatNumero(a.votosEstimados) : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-500">{formatData(a.ultimoContato)}</td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">
                    Nenhum apoiador encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
