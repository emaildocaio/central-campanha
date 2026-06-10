"use client";

import { useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { RIO_VIEWBOX } from "@/lib/rio-bairros-geo";
import type { BairroVotos } from "@/lib/votos-data";
import { formatNumero, formatPct } from "@/lib/format";

const SEM_DADOS = "#eef2f7";
const ESCALA = ["#dbeafe", "#93c5fd", "#60a5fa", "#3b82f6", "#1d4ed8"];

function corPara(votos: number, max: number): string {
  if (votos <= 0 || max <= 0) return SEM_DADOS;
  const r = votos / max;
  if (r <= 0.12) return ESCALA[0];
  if (r <= 0.28) return ESCALA[1];
  if (r <= 0.5) return ESCALA[2];
  if (r <= 0.75) return ESCALA[3];
  return ESCALA[4];
}

export function ElectoralMap({
  bairros,
  maxVotos,
  ano,
  cargo,
}: {
  bairros: BairroVotos[];
  maxVotos: number;
  ano: number;
  cargo: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const porNome = useMemo(() => {
    const m = new Map<string, BairroVotos>();
    for (const b of bairros) m.set(b.nome, b);
    return m;
  }, [bairros]);

  const ativoNome = selected ?? hover;
  const ativo = ativoNome ? porNome.get(ativoNome) ?? null : null;
  const hoverBairro = hover ? porNome.get(hover) ?? null : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div
          ref={wrapRef}
          className="relative w-full"
          onMouseMove={(e) => {
            const r = wrapRef.current?.getBoundingClientRect();
            if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
          }}
          onMouseLeave={() => {
            setHover(null);
            setPos(null);
          }}
        >
          <svg
            viewBox={RIO_VIEWBOX}
            className="h-auto w-full select-none"
            role="img"
            aria-label={`Mapa de votos por bairro — ${cargo} ${ano}`}
          >
            {bairros.map((b) => {
              const ativoAqui = b.nome === ativoNome;
              return (
                <path
                  key={b.nome}
                  d={b.d}
                  fill={corPara(b.votos, maxVotos)}
                  stroke={ativoAqui ? "#0f172a" : "#ffffff"}
                  strokeWidth={ativoAqui ? 1.4 : 0.5}
                  fillRule="evenodd"
                  className="cursor-pointer transition-[stroke] duration-100"
                  onMouseEnter={() => setHover(b.nome)}
                  onClick={() =>
                    setSelected((prev) => (prev === b.nome ? null : b.nome))
                  }
                />
              );
            })}
            {ativo && ativo.votos > 0 && (
              <text
                x={ativo.cx}
                y={ativo.cy}
                textAnchor="middle"
                className="pointer-events-none fill-slate-900 text-[11px] font-semibold"
                stroke="#ffffff"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {ativo.nome}
              </text>
            )}
          </svg>

          {hoverBairro && pos && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
              style={{ left: pos.x, top: pos.y }}
            >
              <span className="font-semibold">{hoverBairro.nome}</span>
              <span className="ml-2 tabular-nums text-slate-200">
                {hoverBairro.votos > 0
                  ? `${formatNumero(hoverBairro.votos)} votos`
                  : "sem votos"}
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span>Menos</span>
            {ESCALA.map((c) => (
              <span
                key={c}
                className="inline-block size-3.5 rounded-sm"
                style={{ backgroundColor: c }}
              />
            ))}
            <span>Mais</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block size-3.5 rounded-sm border border-slate-200"
              style={{ backgroundColor: SEM_DADOS }}
            />
            sem votos
          </span>
          <span className="text-slate-400">
            Clique em um bairro para fixar os detalhes.
          </span>
        </div>
      </div>

      <DetailPanel bairro={ativo} fixado={!!selected} cargo={cargo} ano={ano} />
    </div>
  );
}

function DetailPanel({
  bairro,
  fixado,
  cargo,
  ano,
}: {
  bairro: BairroVotos | null;
  fixado: boolean;
  cargo: string;
  ano: number;
}) {
  if (!bairro || bairro.votos <= 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
        <MapPin className="size-6 text-slate-300" />
        <p className="mt-2 text-sm font-medium text-slate-600">
          {bairro ? `${bairro.nome} — sem votos` : "Selecione um bairro"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Passe o mouse sobre o mapa ou clique em um bairro para ver a votação por
          zona eleitoral.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{bairro.nome}</h3>
          <p className="text-xs text-slate-500">{bairro.ra}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
          {fixado ? "fixado" : "prévia"}
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900 tabular-nums">
          {formatNumero(bairro.votos)}
        </span>
        <span className="text-sm text-slate-500">votos</span>
      </div>
      <p className="mt-0.5 text-xs text-slate-500">
        {formatPct(bairro.pctDoTotal, 1)} dos votos do candidato — {cargo} {ano}
      </p>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          {bairro.zonas.length === 1 ? "Zona eleitoral" : "Zonas eleitorais"}
        </p>
        <ul className="space-y-1.5">
          {bairro.zonas.map((z) => (
            <li
              key={z.zona}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-slate-600">
                Zona <span className="font-medium text-slate-800">{z.zona}</span>
              </span>
              <span className="tabular-nums text-slate-500">
                {formatNumero(z.votos)} votos · {formatPct(z.pct, 2)} da zona
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
