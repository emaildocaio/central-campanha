"use client";

import { useMemo, useState } from "react";
import { UserX, Ban, Ticket, Target } from "lucide-react";
import { Card, KpiCard, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatNumero, formatPct } from "@/lib/format";

export interface EleitoresRA {
  numero: string;
  nome: string;
  aptos: number;
  comparecimento: number;
  abstencao: number;
  brancosNulos: number;
  legenda: number;
  potencial: number; // brancosNulos + legenda (presentes que não escolheram candidato)
}

type Ano = 2022 | 2024;

const CARGO: Record<Ano, string> = {
  2022: "Deputado Estadual",
  2024: "Vereador",
};

const frac = (n: number, d: number) => (d > 0 ? n / d : 0);

export function KpiEleitoresRA({ dados }: { dados: Record<Ano, EleitoresRA[]> }) {
  const [ano, setAno] = useState<Ano>(2022);

  const ras = dados[ano];
  const ordenadas = useMemo(
    () => [...ras].sort((a, b) => b.potencial - a.potencial),
    [ras],
  );
  const maxPotencial = ordenadas[0]?.potencial ?? 0;

  const tot = useMemo(
    () =>
      ras.reduce(
        (a, r) => ({
          aptos: a.aptos + r.aptos,
          comparecimento: a.comparecimento + r.comparecimento,
          abstencao: a.abstencao + r.abstencao,
          brancosNulos: a.brancosNulos + r.brancosNulos,
          legenda: a.legenda + r.legenda,
          potencial: a.potencial + r.potencial,
        }),
        { aptos: 0, comparecimento: 0, abstencao: 0, brancosNulos: 0, legenda: 0, potencial: 0 },
      ),
    [ras],
  );

  return (
    <Card
      className="mt-4"
      title="Eleitores a conquistar por Região Administrativa"
      description="Quem compareceu mas não escolheu candidato (branco/nulo) ou votou só na legenda — votos potenciais a capturar. Mais a abstenção, por região."
      bodyClassName="p-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {([2022, 2024] as Ano[]).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAno(a)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                ano === a ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              {a} · {CARGO[a]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 py-4 lg:grid-cols-4">
        <KpiCard
          label="Abstenção"
          value={formatNumero(tot.abstencao)}
          sub={`${formatPct(frac(tot.abstencao, tot.aptos), 1)} dos aptos`}
          icon={UserX}
          tone="amber"
        />
        <KpiCard
          label="Não votaram em ninguém"
          value={formatNumero(tot.brancosNulos)}
          sub={`brancos + nulos · ${formatPct(frac(tot.brancosNulos, tot.comparecimento), 1)} dos presentes`}
          icon={Ban}
          tone="rose"
        />
        <KpiCard
          label="Só na legenda"
          value={formatNumero(tot.legenda)}
          sub={`${formatPct(frac(tot.legenda, tot.comparecimento), 1)} dos presentes`}
          icon={Ticket}
          tone="violet"
        />
        <KpiCard
          label="Potencial entre presentes"
          value={formatNumero(tot.potencial)}
          sub={`${formatPct(frac(tot.potencial, tot.comparecimento), 1)} de quem foi votar`}
          icon={Target}
          tone="blue"
        />
      </div>

      <div className="overflow-x-auto border-t border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-medium">Região administrativa</th>
              <th className="px-3 py-3 text-right font-medium">Aptos</th>
              <th className="px-3 py-3 text-right font-medium">Abstenção</th>
              <th className="px-3 py-3 text-right font-medium">Sem candidato</th>
              <th className="px-3 py-3 text-right font-medium">Só legenda</th>
              <th className="px-5 py-3 font-medium">Potencial (presentes)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {ordenadas.map((r) => (
              <tr key={r.nome} className="hover:bg-slate-50/70">
                <td className="px-5 py-2.5">
                  <span className="flex items-center gap-2">
                    <span className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 px-1.5 text-[11px] font-bold text-slate-500">
                      {r.numero || "—"}
                    </span>
                    <span className="font-medium text-slate-800">{r.nome}</span>
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                  {formatNumero(r.aptos)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="tabular-nums text-slate-700">{formatNumero(r.abstencao)}</div>
                  <div className="text-xs tabular-nums text-amber-600">
                    {formatPct(frac(r.abstencao, r.aptos), 1)}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="tabular-nums text-slate-700">{formatNumero(r.brancosNulos)}</div>
                  <div className="text-xs tabular-nums text-rose-600">
                    {formatPct(frac(r.brancosNulos, r.comparecimento), 1)}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="tabular-nums text-slate-700">{formatNumero(r.legenda)}</div>
                  <div className="text-xs tabular-nums text-violet-600">
                    {formatPct(frac(r.legenda, r.comparecimento), 1)}
                  </div>
                </td>
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <ProgressBar
                      value={frac(r.potencial, maxPotencial)}
                      tone="blue"
                      className="w-20"
                    />
                    <span className="w-16 text-right tabular-nums font-medium text-slate-800">
                      {formatNumero(r.potencial)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
        <strong className="font-medium text-slate-500">Como ler:</strong>{" "}
        <span className="text-rose-600">Sem candidato</span> = brancos + nulos
        (compareceram e não escolheram ninguém);{" "}
        <span className="text-violet-600">Só legenda</span> = votaram apenas no
        partido. Juntos formam o <span className="text-blue-700">potencial entre
        presentes</span> — eleitores que já vão às urnas e podem ser convertidos
        em voto nominal. Dados por zona eleitoral, agrupados na RA do bairro-sede
        da zona ({CARGO[ano]}, {ano}).
      </p>
    </Card>
  );
}
