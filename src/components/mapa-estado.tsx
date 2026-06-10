"use client";

import { useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import type { MunicipioMapa } from "@/lib/votos-data";
import { formatNumero, formatPct } from "@/lib/format";

const SEM_DADOS = "#eef2f7";
const ESCALA = ["#dbeafe", "#93c5fd", "#60a5fa", "#3b82f6", "#1e40af"];
// Limiares fixos (votos) — a capital é outlier (>1000), então uma escala por
// faixas deixa o interior legível em vez de tudo claro.
const FAIXAS = [50, 150, 400, 1000];

function corPara(votos: number): string {
  if (votos <= 0) return SEM_DADOS;
  if (votos < FAIXAS[0]) return ESCALA[0];
  if (votos < FAIXAS[1]) return ESCALA[1];
  if (votos < FAIXAS[2]) return ESCALA[2];
  if (votos < FAIXAS[3]) return ESCALA[3];
  return ESCALA[4];
}

export function MapaEstado({
  municipios,
  viewBox,
  totalEstado,
}: {
  municipios: MunicipioMapa[];
  viewBox: string;
  totalEstado: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const porId = useMemo(() => {
    const m = new Map<string, MunicipioMapa>();
    for (const x of municipios) m.set(x.cdTse, x);
    return m;
  }, [municipios]);

  const ativoId = selected ?? hover;
  const ativo = ativoId ? porId.get(ativoId) ?? null : null;
  const hoverMun = hover ? porId.get(hover) ?? null : null;

  // desenha menores por cima para a capital (grande) não cobrir vizinhos no hover
  const ordenados = useMemo(
    () => [...municipios].sort((a, b) => b.votos - a.votos),
    [municipios],
  );

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
            viewBox={viewBox}
            className="h-auto w-full select-none"
            role="img"
            aria-label="Mapa de votos por município — Deputado Estadual 2022"
          >
            {ordenados.map((m) => {
              const ativoAqui = m.cdTse === ativoId;
              return (
                <path
                  key={m.cdTse}
                  d={m.d}
                  fill={corPara(m.votos)}
                  stroke={ativoAqui ? "#0f172a" : "#ffffff"}
                  strokeWidth={ativoAqui ? 1.2 : 0.4}
                  fillRule="evenodd"
                  className="cursor-pointer transition-[stroke] duration-100"
                  onMouseEnter={() => setHover(m.cdTse)}
                  onClick={() =>
                    setSelected((prev) => (prev === m.cdTse ? null : m.cdTse))
                  }
                />
              );
            })}
            {ativo && ativo.votos > 0 && (
              <text
                x={ativo.cx}
                y={ativo.cy}
                textAnchor="middle"
                className="pointer-events-none fill-slate-900 text-[12px] font-semibold"
                stroke="#ffffff"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {ativo.nomeOficial}
              </text>
            )}
          </svg>

          {hoverMun && pos && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
              style={{ left: pos.x, top: pos.y }}
            >
              <span className="font-semibold">{hoverMun.nomeOficial}</span>
              <span className="ml-2 tabular-nums text-slate-200">
                {hoverMun.votos > 0
                  ? `${formatNumero(hoverMun.votos)} votos`
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
          <span className="text-slate-400">
            Faixas: &lt;50 · 50–149 · 150–399 · 400–999 · 1.000+ votos. Clique
            para fixar.
          </span>
        </div>
      </div>

      <DetailPanel municipio={ativo} fixado={!!selected} totalEstado={totalEstado} />
    </div>
  );
}

function DetailPanel({
  municipio,
  fixado,
  totalEstado,
}: {
  municipio: MunicipioMapa | null;
  fixado: boolean;
  totalEstado: number;
}) {
  if (!municipio) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
        <MapPin className="size-6 text-slate-300" />
        <p className="mt-2 text-sm font-medium text-slate-600">
          Selecione um município
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Passe o mouse sobre o mapa ou clique em um município para ver a
          votação.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {municipio.nomeOficial}
          </h3>
          <p className="text-xs text-slate-500">{municipio.regiao ?? "—"}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
          {fixado ? "fixado" : "prévia"}
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900 tabular-nums">
          {formatNumero(municipio.votos)}
        </span>
        <span className="text-sm text-slate-500">votos</span>
      </div>
      <p className="mt-0.5 text-xs text-slate-500">
        {formatPct(totalEstado ? municipio.votos / totalEstado : 0, 1)} da
        votação no estado — Deputado Estadual 2022
      </p>

      <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">% dos votos válidos</dt>
          <dd className="tabular-nums font-medium text-slate-800">
            {formatPct(municipio.pctValidos, 3)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">Votos válidos no município</dt>
          <dd className="tabular-nums text-slate-600">
            {formatNumero(municipio.validos)}
          </dd>
        </div>
        {municipio.ibge && (
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Código IBGE</dt>
            <dd className="tabular-nums text-slate-600">{municipio.ibge}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
