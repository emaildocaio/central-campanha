"use client";

import { useMemo, useState } from "react";
import { Vote, MapPin, Layers, Trophy, Landmark, Users } from "lucide-react";
import { Card, KpiCard, PageHeader, Badge, ProgressBar } from "@/components/ui";
import { ElectoralMap } from "@/components/electoral-map";
import { bairrosGeo } from "@/lib/rio-bairros-geo";
import type { BairroVotos } from "@/lib/votos-data";
import { formatNumero, formatPct } from "@/lib/format";
import { cn } from "@/lib/cn";

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();

export interface BairroVotoCand {
  bairro: string;
  votos: number;
  zonas: { zona: number; votos: number }[];
}
export interface CandidatoAnoDados {
  slug: string;
  nome: string;
  cargo: string;
  partido: string | null;
  situacao?: "Eleito" | "Suplente" | "Não eleito";
  totalRJ: number;
  totalCapital: number;
  coberturaBairro: number;
  bairros: BairroVotoCand[];
  zonas: { zona: number; votos: number }[];
  municipios: { nome: string; votos: number; regiao: string | null }[];
}

const tituloCase = (s: string) =>
  s.toLowerCase().replace(/(^|\s|\(|-)([a-zà-ú])/g, (_, p, c) => p + c.toUpperCase());

export function MapaEleicaoMulti({
  ano,
  candidatos,
}: {
  ano: number;
  candidatos: CandidatoAnoDados[];
}) {
  const [slug, setSlug] = useState(candidatos[0]?.slug ?? "");
  const [busca, setBusca] = useState("");
  const cand = candidatos.find((c) => c.slug === slug) ?? candidatos[0];

  // votos do candidato por bairro (normalizado) -> {votos, zonas}
  const porBairro = useMemo(() => {
    const m = new Map<string, BairroVotoCand>();
    for (const b of cand.bairros) m.set(norm(b.bairro), b);
    return m;
  }, [cand]);

  // mescla geometria (capital) com os votos do candidato
  const bairros: BairroVotos[] = useMemo(
    () =>
      bairrosGeo.map((g) => {
        const v = porBairro.get(norm(g.nome));
        const votos = v?.votos ?? 0;
        return {
          ...g,
          votos,
          pctDoTotal: cand.totalCapital ? votos / cand.totalCapital : 0,
          zonas: (v?.zonas ?? []).map((z) => ({ zona: z.zona, votos: z.votos, pct: 0 })),
        };
      }),
    [porBairro, cand],
  );
  const maxVotos = useMemo(() => bairros.reduce((mx, b) => Math.max(mx, b.votos), 0), [bairros]);
  const rankingBairros = useMemo(
    () => bairros.filter((b) => b.votos > 0).sort((a, b) => b.votos - a.votos),
    [bairros],
  );
  const melhor = rankingBairros[0];

  // votos por região (a partir dos municípios)
  const regioes = useMemo(() => {
    const m = new Map<string, { votos: number; municipios: number }>();
    for (const mu of cand.municipios) {
      if (mu.votos <= 0) continue;
      const r = mu.regiao ?? "Sem região";
      const cur = m.get(r) ?? { votos: 0, municipios: 0 };
      cur.votos += mu.votos;
      cur.municipios += 1;
      m.set(r, cur);
    }
    return [...m.entries()].map(([regiao, v]) => ({ regiao, ...v })).sort((a, b) => b.votos - a.votos);
  }, [cand]);
  const topMunicipios = useMemo(
    () => cand.municipios.filter((m) => m.votos > 0).slice(0, 12),
    [cand],
  );
  const foraCapital = cand.totalRJ - cand.totalCapital;

  return (
    <div>
      <PageHeader
        title={`Mapa Eleitoral — Eleição ${ano}`}
        description="Selecione um candidato para ver onde ele teve votos — por bairro (capital), zona e município/região do estado. Útil para planejar reuniões conjuntas e dobradas por região."
      >
        <Badge tone="violet">{cand.cargo}</Badge>
      </PageHeader>

      {/* Seletor de candidato */}
      <Card className="mb-4" bodyClassName="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Users className="size-5 shrink-0 text-slate-400" />
          <label htmlFor="cand" className="text-sm font-medium text-slate-600">
            Candidato:
          </label>
          <select
            id="cand"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="min-w-[220px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {candidatos.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nome} — {c.cargo}
                {c.partido ? ` (${c.partido})` : ""}
                {c.situacao ? ` · ${c.situacao}` : ""}
              </option>
            ))}
          </select>
          {cand.partido ? <Badge tone="slate">{cand.partido}</Badge> : null}
          {cand.situacao ? (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                cand.situacao === "Eleito"
                  ? "bg-emerald-100 text-emerald-700"
                  : cand.situacao === "Suplente"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600",
              )}
            >
              {cand.situacao === "Eleito" ? "✓ Eleito" : cand.situacao}
            </span>
          ) : null}
          <span className="text-xs text-slate-400">
            {candidatos.length} candidato{candidatos.length > 1 ? "s" : ""} rastreado
            {candidatos.length > 1 ? "s" : ""} em {ano}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Votos no estado (RJ)"
          value={formatNumero(cand.totalRJ)}
          sub={foraCapital > 0 ? `${formatNumero(foraCapital)} fora da capital` : "só capital"}
          icon={Landmark}
          tone="emerald"
        />
        <KpiCard
          label="Votos na capital"
          value={formatNumero(cand.totalCapital)}
          sub="cidade do Rio"
          icon={Vote}
          tone="blue"
        />
        <KpiCard
          label="Melhor bairro"
          value={melhor ? melhor.nome : "—"}
          sub={melhor ? `${formatNumero(melhor.votos)} votos` : undefined}
          icon={Trophy}
          tone="amber"
        />
        <KpiCard
          label="Bairros com voto"
          value={formatNumero(rankingBairros.length)}
          sub={`cobertura ${formatPct(cand.coberturaBairro, 0)} dos votos`}
          icon={Layers}
          tone="violet"
        />
      </div>

      <Card
        className="mt-4"
        title={`Votos por bairro — ${cand.nome} (capital)`}
        description="Votos somados pelo bairro real de cada local de votação. Passe o mouse ou clique para ver os detalhes por zona."
      >
        <ElectoralMap bairros={bairros} maxVotos={maxVotos} ano={ano} cargo={cand.cargo} />
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="Bairros com mais votos"
          description={`${rankingBairros.length} bairros com votação na capital`}
          bodyClassName="p-0"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar bairro…"
              aria-label="Buscar bairro"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Bairro</th>
                  <th className="px-3 py-3 text-right font-medium">Votos</th>
                  <th className="px-5 py-3 font-medium">% do candidato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rankingBairros
                  .filter((b) => !busca.trim() || norm(b.nome).includes(norm(busca)))
                  .slice(0, 40)
                  .map((b) => (
                  <tr key={b.nome} className="hover:bg-slate-50/70">
                    <td className="px-5 py-2.5">
                      <div className="font-medium text-slate-800">{b.nome}</div>
                      <div className="text-xs text-slate-400">{b.ra}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium text-slate-800">
                      {formatNumero(b.votos)}
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={b.pctDoTotal} tone="blue" className="w-24" />
                        <span className="w-12 text-right text-xs tabular-nums text-slate-500">
                          {formatPct(b.pctDoTotal, 1)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="Votos por região do estado"
          description="Distribuição no RJ — base para reuniões conjuntas por região"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-slate-50">
            {regioes.map((r) => (
              <li key={r.regiao} className="flex items-center justify-between px-5 py-2.5 text-sm">
                <span className="text-slate-700">
                  <span className="font-medium text-slate-800">{r.regiao}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {r.municipios} município{r.municipios > 1 ? "s" : ""}
                  </span>
                </span>
                <span className="text-right">
                  <span className="tabular-nums font-medium text-slate-800">
                    {formatNumero(r.votos)}
                  </span>
                  <span className="ml-2 text-xs tabular-nums text-slate-400">
                    {formatPct(cand.totalRJ ? r.votos / cand.totalRJ : 0, 1)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Municípios com mais votos
            </p>
            <ul className="space-y-1.5">
              {topMunicipios.map((m) => (
                <li key={m.nome} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{tituloCase(m.nome)}</span>
                  <span className="tabular-nums text-slate-500">{formatNumero(m.votos)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {cand.coberturaBairro < 0.999 && (
        <p className="mt-4 rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-2.5 text-xs text-amber-700">
          Nota: em {ano} o bairro de cada local foi obtido reusando o mapa de
          2022/2024 (locais estáveis) — cobertura de{" "}
          <strong>{formatPct(cand.coberturaBairro, 1)}</strong> dos votos da capital.
          Município e região são exatos.
        </p>
      )}

      <p className="mt-2 text-xs text-slate-400">
        Fonte: TSE — votação nominal apurada por seção. Bairros: Data.Rio (capital);
        regiões: divisão do estado do RJ.
      </p>
    </div>
  );
}
