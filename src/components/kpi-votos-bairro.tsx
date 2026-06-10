"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Landmark,
  Vote,
  ArrowDownRight,
  ArrowUpRight,
  Search,
} from "lucide-react";
import { Card, KpiCard } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatNumero, formatPct } from "@/lib/format";

export interface BairroKpi {
  nome: string;
  raNome: string;
  raNum: string;
  v2022: number;
  v2024: number;
  share2022: number;
  share2024: number;
  deltaVotos: number;
  deltaShare: number;
}

type Ordem = "reduto" | "perda" | "ganho";

const LIMIAR = 0.001; // 0,1 ponto percentual: abaixo disso, consideramos estável

function tendencia(deltaShare: number) {
  if (deltaShare > LIMIAR) return "ganho" as const;
  if (deltaShare < -LIMIAR) return "perda" as const;
  return "estavel" as const;
}

const fmtPp = (fracao: number) => {
  const pp = fracao * 100;
  const sinal = pp > 0 ? "+" : "";
  return `${sinal}${pp.toFixed(1).replace(".", ",")} pp`;
};

// normaliza p/ busca: sem acento, minúsculo (ex.: "saude" acha "Saúde")
const semAcento = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function KpiVotosBairro({
  bairros,
  totais,
}: {
  bairros: BairroKpi[];
  totais: { 2022: number; 2024: number };
}) {
  const [ordem, setOrdem] = useState<Ordem>("reduto");
  const [busca, setBusca] = useState("");

  const ganharam = bairros.filter((b) => tendencia(b.deltaShare) === "ganho").length;
  const perderam = bairros.filter((b) => tendencia(b.deltaShare) === "perda").length;

  const ordenados = useMemo(() => {
    const arr = [...bairros];
    if (ordem === "reduto") arr.sort((a, b) => b.v2022 - a.v2022);
    if (ordem === "perda") arr.sort((a, b) => a.deltaShare - b.deltaShare);
    if (ordem === "ganho") arr.sort((a, b) => b.deltaShare - a.deltaShare);
    return arr;
  }, [bairros, ordem]);

  const visiveis = useMemo(() => {
    const q = semAcento(busca);
    if (!q) return ordenados;
    return ordenados.filter((b) => semAcento(b.nome).includes(q));
  }, [ordenados, busca]);

  const botoes: { id: Ordem; label: string }[] = [
    { id: "reduto", label: "Maiores redutos (2022)" },
    { id: "perda", label: "Perderam força" },
    { id: "ganho", label: "Ganharam força" },
  ];

  return (
    <Card
      title="Votos por bairro — evolução 2022 → 2024"
      description="Compara a votação do candidato em cada bairro entre Deputado Estadual (2022) e Vereador (2024). Como são cargos de tamanhos diferentes, a evolução de força usa a participação (% dos votos do candidato)."
      bodyClassName="p-0"
    >
      <div className="grid grid-cols-2 gap-3 px-5 py-4 lg:grid-cols-4">
        <KpiCard
          label="Votos 2022 (Dep. Estadual)"
          value={formatNumero(totais[2022])}
          icon={Landmark}
          tone="blue"
        />
        <KpiCard
          label="Votos 2024 (Vereador)"
          value={formatNumero(totais[2024])}
          icon={Vote}
          tone="violet"
        />
        <KpiCard
          label="Ganharam força"
          value={`${ganharam} bairros`}
          sub="participação ↑ vs 2022"
          icon={ArrowUpRight}
          tone="emerald"
        />
        <KpiCard
          label="Perderam força"
          value={`${perderam} bairros`}
          sub="participação ↓ — atuar aqui"
          icon={ArrowDownRight}
          tone="rose"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Ordenar por
        </span>
        {botoes.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setOrdem(b.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              ordem === b.id
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {b.label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar bairro…"
            aria-label="Buscar bairro pelo nome"
            className="w-48 rounded-full border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-medium">Bairro</th>
              <th className="px-3 py-3 text-right font-medium">2022 · Dep. Est.</th>
              <th className="px-3 py-3 text-right font-medium">2024 · Vereador</th>
              <th className="px-5 py-3 text-right font-medium">Evolução (força)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {visiveis.map((b) => {
              const t = tendencia(b.deltaShare);
              const Icon =
                t === "ganho" ? TrendingUp : t === "perda" ? TrendingDown : Minus;
              const cor =
                t === "ganho"
                  ? "text-emerald-600"
                  : t === "perda"
                    ? "text-rose-600"
                    : "text-slate-400";
              return (
                <tr key={b.nome} className="hover:bg-slate-50/70">
                  <td className="px-5 py-2.5">
                    <div className="font-medium text-slate-800">{b.nome}</div>
                    <div className="text-xs text-slate-400">
                      {b.raNum ? `RA ${b.raNum} · ` : ""}
                      {b.raNome}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="tabular-nums font-medium text-slate-800">
                      {formatNumero(b.v2022)}
                    </div>
                    <div className="text-xs tabular-nums text-slate-400">
                      {formatPct(b.share2022, 1)}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="tabular-nums font-medium text-slate-800">
                      {formatNumero(b.v2024)}
                    </div>
                    <div className="text-xs tabular-nums text-slate-400">
                      {formatPct(b.share2024, 1)}
                    </div>
                  </td>
                  <td className="px-5 py-2.5">
                    <div className={cn("flex items-center justify-end gap-1.5 font-medium", cor)}>
                      <Icon className="size-4" />
                      <span className="tabular-nums">{fmtPp(b.deltaShare)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {visiveis.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-10 text-center text-sm text-slate-400"
                >
                  Nenhum bairro encontrado para “{busca}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
        <strong className="font-medium text-slate-500">Como ler:</strong> a coluna
        de evolução mede a variação da <em>participação</em> do bairro no total do
        candidato (em pontos percentuais). Verde = ganhou força relativa (manter o
        esforço); vermelho = perdeu força (priorizar para recuperar votos). Os
        votos absolutos caem de 2022 para 2024 porque Vereador é uma eleição menor
        que Deputado Estadual.
      </p>
    </Card>
  );
}
