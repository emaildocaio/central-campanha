"use client";

import { useMemo, useState } from "react";
import { Copy, Check, ExternalLink, Users, ShieldAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatData } from "@/lib/format";
import { publicosDe, type Ideia } from "@/lib/pauta-data";

function PublicoBadge({ nome }: { nome: string }) {
  const todos = nome === "Todos";
  const interno = nome.toLowerCase().includes("interno");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        todos
          ? "bg-blue-50 text-blue-700"
          : interno
            ? "bg-slate-200 text-slate-600"
            : "bg-violet-50 text-violet-700",
      )}
    >
      <Users className="size-3" />
      {nome}
    </span>
  );
}

function SeloBadge({ selo }: { selo: Ideia["selo"] }) {
  if (selo === "pronto") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <CircleCheck className="size-3" /> pronto pra enviar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      <ShieldAlert className="size-3" /> checar antes
    </span>
  );
}

function IdeiaCard({ ideia }: { ideia: Ideia }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(ideia.mensagem);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // navegador sem permissão de clipboard — ignora
    }
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">{ideia.titulo}</h3>
        <SeloBadge selo={ideia.selo} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {ideia.publico.map((p) => (
          <PublicoBadge key={p} nome={p} />
        ))}
        {ideia.eixo && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {ideia.eixo}
          </span>
        )}
      </div>

      {ideia.porqueAgora && (
        <p className="mt-2 text-xs text-slate-500">
          <span className="font-medium text-slate-600">Por que agora:</span>{" "}
          {ideia.porqueAgora}
        </p>
      )}

      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Mensagem para o WhatsApp
          </span>
          <button
            type="button"
            onClick={copiar}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
              copiado
                ? "bg-emerald-100 text-emerald-700"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100",
            )}
          >
            {copiado ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {ideia.mensagem}
        </p>
      </div>

      {ideia.fontes.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Fonte:</span>
          {ideia.fontes.map((f, i) => (
            <a
              key={i}
              href={f.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
            >
              {f.veiculo}
              <span className="text-slate-400">· {formatData(f.data)}</span>
              <ExternalLink className="size-3 text-slate-400" />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

export function PautaLista({ ideias }: { ideias: Ideia[] }) {
  const publicos = useMemo(() => publicosDe(ideias), [ideias]);
  const [filtro, setFiltro] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    if (!filtro) return ideias;
    return ideias.filter((i) => i.publico.includes(filtro));
  }, [ideias, filtro]);

  return (
    <div>
      {publicos.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFiltro(null)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filtro === null
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            Todos os públicos
          </button>
          {publicos.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setFiltro(p)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filtro === p
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {filtradas.map((ideia) => (
          <IdeiaCard key={ideia.id} ideia={ideia} />
        ))}
      </div>

      {filtradas.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">
          Nenhuma ideia para esse público.
        </p>
      )}
    </div>
  );
}
