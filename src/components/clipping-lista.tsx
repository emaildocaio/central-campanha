"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search, Newspaper, Tag } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatData } from "@/lib/format";
import { palavrasChaveDe, tagsDe, type Noticia } from "@/lib/clipping-data";

export function ClippingLista({ noticias }: { noticias: Noticia[] }) {
  const palavras = useMemo(() => palavrasChaveDe(noticias), [noticias]);
  const [palavra, setPalavra] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return noticias.filter((n) => {
      if (palavra && !tagsDe(n).includes(palavra)) return false;
      if (q && !(`${n.titulo} ${n.fonte}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [noticias, palavra, busca]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {palavras.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPalavra(null)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                palavra === null
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              Todas
            </button>
            {palavras.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPalavra(p)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  palavra === p
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título ou fonte…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center">
          <Newspaper className="size-7 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-600">
            Nenhuma notícia encontrada
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Ajuste a busca ou aguarde a próxima coleta do fluxo de notícias.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtradas.map((n) => (
            <li key={n.id}>
              <a
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 group-hover:text-blue-800">
                    {n.titulo}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span className="font-medium text-slate-600">{n.fonte}</span>
                    <span className="text-slate-300">·</span>
                    <span className="tabular-nums">{formatData(n.data)}</span>
                    <span className="text-slate-300">·</span>
                    {tagsDe(n).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                        title="Palavra-chave identificada no texto da notícia"
                      >
                        <Tag className="size-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <ExternalLink className="mt-0.5 size-4 shrink-0 text-slate-300 group-hover:text-blue-500" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
