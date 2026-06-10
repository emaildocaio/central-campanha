"use client";

import { useMemo, useState } from "react";
import { Search, MapPin, Building2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumero } from "@/lib/format";

export interface ItemBusca {
  nome: string;
  tipo: "bairro" | "municipio";
  contexto: string;
  votos: number;
}

// normaliza p/ busca: sem acento, minúsculo (ex.: "saude" acha "Saúde")
const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function BuscaLocais({
  itens,
  placeholder,
  comMunicipios = false,
}: {
  itens: ItemBusca[];
  placeholder: string;
  comMunicipios?: boolean;
}) {
  const [q, setQ] = useState("");

  const resultados = useMemo(() => {
    const k = norm(q);
    if (!k) return [];
    return itens
      .filter((i) => norm(i.nome).includes(k))
      .sort((a, b) => b.votos - a.votos)
      .slice(0, 40);
  }, [itens, q]);

  const buscando = q.trim().length > 0;

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </div>

      {buscando &&
        (resultados.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-slate-400">
            Nenhum {comMunicipios ? "bairro ou município" : "bairro"} encontrado
            para “{q.trim()}”.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-50 overflow-hidden rounded-lg border border-slate-100">
            {resultados.map((r) => (
              <li
                key={`${r.tipo}-${r.nome}`}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn(
                      "inline-flex size-7 shrink-0 items-center justify-center rounded-md",
                      r.tipo === "municipio"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-blue-50 text-blue-600",
                    )}
                  >
                    {r.tipo === "municipio" ? (
                      <Building2 className="size-4" />
                    ) : (
                      <MapPin className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {r.nome}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {r.tipo === "municipio" ? "Município" : "Bairro"}
                      {r.contexto ? ` · ${r.contexto}` : ""}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block tabular-nums text-sm font-semibold text-slate-800">
                    {formatNumero(r.votos)}
                  </span>
                  <span className="block text-[11px] text-slate-400">votos</span>
                </span>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
