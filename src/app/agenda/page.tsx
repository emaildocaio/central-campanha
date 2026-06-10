"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, CalendarClock, CheckCircle2, Users, MapPin } from "lucide-react";
import { Badge, Card, KpiCard, PageHeader, StatusBadge } from "@/components/ui";
import { getEventos } from "@/lib/campaign-data";
import {
  diasAte,
  formatData,
  formatHora,
  formatNumero,
  nomeDiaSemana,
} from "@/lib/format";
import type { Evento } from "@/lib/types";

const TIPOS = [
  "Comício",
  "Reunião",
  "Caminhada",
  "Carreata",
  "Entrevista",
  "Visita",
  "Live",
] as const;
const STATUS = ["Confirmado", "Agendado", "Realizado", "Cancelado"] as const;

function capitalizar(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function AgendaPage() {
  const todos = getEventos();
  const [tipo, setTipo] = useState("todos");
  const [status, setStatus] = useState("todos");

  const resumo = useMemo(() => {
    const confirmados = todos.filter((e) => e.status === "Confirmado").length;
    const proximos7 = todos.filter((e) => {
      const d = diasAte(e.inicio);
      return d >= 0 && d <= 7 && e.status !== "Cancelado";
    }).length;
    const realizados = todos.filter((e) => e.status === "Realizado").length;
    const publicoFuturo = todos
      .filter((e) => diasAte(e.inicio) >= 0 && e.status !== "Cancelado")
      .reduce((s, e) => s + e.publicoEstimado, 0);
    return { confirmados, proximos7, realizados, publicoFuturo };
  }, [todos]);

  const filtrados = useMemo(
    () =>
      todos.filter(
        (e) =>
          (tipo === "todos" || e.tipo === tipo) &&
          (status === "todos" || e.status === status),
      ),
    [todos, tipo, status],
  );

  const grupos = useMemo(() => {
    const map = new Map<string, Evento[]>();
    for (const e of filtrados) {
      const dia = e.inicio.slice(0, 10);
      const arr = map.get(dia) ?? [];
      arr.push(e);
      map.set(dia, arr);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtrados]);

  const selectClass =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none";

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Compromissos, comícios, caminhadas e visitas da campanha."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Confirmados"
          value={formatNumero(resumo.confirmados)}
          icon={CalendarCheck}
          tone="emerald"
        />
        <KpiCard
          label="Próximos 7 dias"
          value={formatNumero(resumo.proximos7)}
          icon={CalendarClock}
          tone="blue"
        />
        <KpiCard
          label="Realizados"
          value={formatNumero(resumo.realizados)}
          icon={CheckCircle2}
          tone="slate"
        />
        <KpiCard
          label="Público estimado"
          value={formatNumero(resumo.publicoFuturo)}
          sub="Eventos futuros"
          icon={Users}
          tone="amber"
        />
      </div>

      <Card className="mt-4" bodyClassName="p-3">
        <div className="flex flex-wrap items-center gap-2">
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
          <span className="ml-auto text-xs text-slate-500">
            {filtrados.length} evento(s)
          </span>
        </div>
      </Card>

      <div className="mt-4 space-y-5">
        {grupos.map(([dia, evts]) => (
          <div key={dia}>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800">
                {capitalizar(nomeDiaSemana(dia))}
              </h3>
              <span className="text-xs text-slate-400">{formatData(dia)}</span>
            </div>
            <div className="space-y-2">
              {evts.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="w-14 shrink-0 text-center">
                    <div className="text-sm font-semibold text-slate-900">
                      {formatHora(e.inicio)}
                    </div>
                  </div>
                  <div className="h-10 w-px shrink-0 bg-slate-100" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-800">{e.titulo}</span>
                      <Badge tone="slate">{e.tipo}</Badge>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="size-3.5" />
                      {e.local} · {e.municipio}
                    </div>
                  </div>
                  {e.publicoEstimado > 0 && (
                    <div className="hidden text-right sm:block">
                      <div className="text-sm font-medium text-slate-700">
                        {formatNumero(e.publicoEstimado)}
                      </div>
                      <div className="text-xs text-slate-400">público</div>
                    </div>
                  )}
                  <div className="hidden text-xs text-slate-400 md:block">{e.responsavel}</div>
                  <StatusBadge status={e.status} />
                </div>
              ))}
            </div>
          </div>
        ))}
        {grupos.length === 0 && (
          <Card>
            <p className="py-8 text-center text-sm text-slate-400">
              Nenhum evento encontrado com os filtros atuais.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
