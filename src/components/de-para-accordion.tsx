"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatNumero } from "@/lib/format";

export interface BairroVoto {
  nome: string;
  v2022: number;
  v2024: number;
}

export interface RAComVotos {
  chave: string;
  numero: string;
  nome: string;
  ordem: number;
  bairros: BairroVoto[];
  total2022: number;
  total2024: number;
}

type Ano = 2022 | 2024;

const CARGO: Record<Ano, string> = {
  2022: "Deputado Estadual",
  2024: "Vereador",
};

export function DeParaAccordion({
  regioes,
  totalCidade,
}: {
  regioes: RAComVotos[];
  totalCidade: Record<Ano, number>;
}) {
  const [ano, setAno] = useState<Ano>(2022);
  const votosBairro = (b: BairroVoto) => (ano === 2022 ? b.v2022 : b.v2024);
  const totalRA = (ra: RAComVotos) => (ano === 2022 ? ra.total2022 : ra.total2024);

  // ordena as RAs pela votação do ano selecionado (maiores redutos no topo),
  // com desempate pela ordem oficial da RA.
  const ordenadas = [...regioes].sort(
    (a, b) => totalRA(b) - totalRA(a) || a.ordem - b.ordem,
  );

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {([2022, 2024] as Ano[]).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAno(a)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                ano === a
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              {a} · {CARGO[a]}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          Total na cidade:{" "}
          <span className="font-semibold tabular-nums text-slate-900">
            {formatNumero(totalCidade[ano])}
          </span>{" "}
          votos
        </p>
      </div>

      <Card
        className="mt-4"
        title="Regiões administrativas e seus bairros"
        description={`Votos por bairro e total por região — ${CARGO[ano]}, ${ano}.`}
        bodyClassName="space-y-2"
      >
        {ordenadas.map((ra) => {
          const total = totalRA(ra);
          const bairros = [...ra.bairros].sort(
            (a, b) => votosBairro(b) - votosBairro(a) || a.nome.localeCompare(b.nome, "pt-BR"),
          );
          const maxBairro = bairros.reduce((m, b) => Math.max(m, votosBairro(b)), 0);
          return (
            <details
              key={ra.chave}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 px-1.5 text-xs font-bold text-blue-700">
                    {ra.numero || "—"}
                  </span>
                  <span className="truncate text-sm font-semibold text-slate-800">
                    {ra.nome}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-right">
                    <span className="block text-sm font-semibold tabular-nums text-slate-900">
                      {formatNumero(total)} votos
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {ra.bairros.length}{" "}
                      {ra.bairros.length === 1 ? "bairro" : "bairros"}
                    </span>
                  </span>
                  <ChevronDown className="size-4 text-slate-400 transition-transform group-open:rotate-180" />
                </span>
              </summary>

              <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-2">
                <ul className="divide-y divide-slate-100">
                  {bairros.map((b) => {
                    const v = votosBairro(b);
                    return (
                      <li
                        key={b.nome}
                        className="flex items-center justify-between gap-3 py-2 text-sm"
                      >
                        <span className={v > 0 ? "text-slate-700" : "text-slate-400"}>
                          {b.nome}
                        </span>
                        <span className="flex items-center gap-2">
                          {v > 0 && (
                            <ProgressBar
                              value={maxBairro ? v / maxBairro : 0}
                              tone="blue"
                              className="w-20"
                            />
                          )}
                          <span
                            className={cn(
                              "w-14 text-right tabular-nums",
                              v > 0 ? "font-medium text-slate-800" : "text-slate-300",
                            )}
                          >
                            {formatNumero(v)}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex items-center justify-between border-t-2 border-slate-200 py-2 text-sm">
                  <span className="font-semibold text-slate-700">
                    Total {ra.nome}
                  </span>
                  <span className="w-14 text-right font-bold tabular-nums text-slate-900">
                    {formatNumero(total)}
                  </span>
                </div>
              </div>
            </details>
          );
        })}
      </Card>
    </>
  );
}
