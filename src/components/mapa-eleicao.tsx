import Link from "next/link";
import { Vote, MapPin, Layers, Trophy, Building2, Landmark, ArrowRight } from "lucide-react";
import { Card, KpiCard, PageHeader, ProgressBar, Badge } from "@/components/ui";
import { ElectoralMap } from "@/components/electoral-map";
import {
  getBairros,
  getLocais2022,
  getMaxVotosBairro,
  getMeta,
  getZonas,
  type AnoEleicao,
} from "@/lib/votos-data";
import { formatNumero, formatPct } from "@/lib/format";

export function MapaEleicao({ ano }: { ano: AnoEleicao }) {
  const meta = getMeta(ano);
  const bairros = getBairros(ano);
  const maxVotos = getMaxVotosBairro(ano);
  const ranking = bairros
    .filter((b) => b.votos > 0)
    .sort((a, b) => b.votos - a.votos);
  const zonas = getZonas(ano);
  const melhor = ranking[0];

  // Eleição de 2022 (Deputado Estadual) tem votação em todo o estado.
  const ehEstadual = ano === 2022;
  const votosInterior = meta.totalEstado - meta.totalVotos;
  const locais = ehEstadual ? getLocais2022(12) : [];
  const maxLocal = locais[0]?.votos ?? 0;

  const descricao = ehEstadual ? (
    <>
      Votos por zona eleitoral na cidade do Rio de Janeiro — Deputado Estadual,
      2022. O candidato também recebeu votos em todo o estado (
      <Link
        href="/mapa-2022/estado"
        className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
      >
        ver votação por município
      </Link>
      ).
    </>
  ) : (
    meta.resumo
  );

  return (
    <div>
      <PageHeader title={`Mapa Eleitoral — Eleição ${ano}`} description={descricao}>
        <Badge tone="violet">{meta.cargo}</Badge>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {ehEstadual ? (
          <KpiCard
            label="Votos no estado"
            value={formatNumero(meta.totalEstado)}
            sub={`${formatNumero(meta.municipiosComVoto)} municípios do RJ`}
            icon={Landmark}
            tone="emerald"
          />
        ) : null}
        <KpiCard
          label={ehEstadual ? "Votos na cidade" : "Total de votos"}
          value={formatNumero(meta.totalVotos)}
          sub={`${formatPct(meta.pctCidade, 2)} dos votos válidos da cidade`}
          icon={Vote}
          tone="blue"
        />
        {!ehEstadual ? (
          <KpiCard
            label="Bairros com voto"
            value={formatNumero(meta.totalBairros)}
            icon={MapPin}
            tone="violet"
          />
        ) : null}
        <KpiCard
          label="Zonas eleitorais"
          value={formatNumero(meta.totalZonas)}
          sub="na cidade do Rio"
          icon={Layers}
          tone="slate"
        />
        <KpiCard
          label="Melhor bairro"
          value={melhor ? melhor.nome : "—"}
          sub={melhor ? `${formatNumero(melhor.votos)} votos` : undefined}
          icon={Trophy}
          tone="amber"
        />
      </div>

      {ehEstadual && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-slate-700">
          <Landmark className="size-4 text-emerald-600" />
          <span>
            Como <strong>Deputado Estadual</strong>, a votação ocorre em todo o
            RJ:{" "}
            <strong className="tabular-nums">
              {formatNumero(meta.totalVotos)}
            </strong>{" "}
            na capital ({formatPct(meta.totalVotos / meta.totalEstado, 0)}) e{" "}
            <strong className="tabular-nums">
              {formatNumero(votosInterior)}
            </strong>{" "}
            no interior ({formatPct(votosInterior / meta.totalEstado, 0)}).
          </span>
        </div>
      )}

      <Card
        className="mt-4"
        title="Votos por bairro — cidade do Rio de Janeiro"
        description="Votos somados pelo bairro real de cada local de votação (CEP do TSE cruzado com a base RUACEP). Passe o mouse ou clique para ver os detalhes."
      >
        <ElectoralMap
          bairros={bairros}
          maxVotos={maxVotos}
          ano={ano}
          cargo={meta.cargo}
        />
      </Card>

      {ehEstadual && (
        <Link
          href="/mapa-2022/estado"
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-5 py-4 transition-colors hover:bg-blue-50"
        >
          <span className="flex items-center gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Landmark className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-800">
                Ver análise do estado inteiro
              </span>
              <span className="block text-xs text-slate-500">
                Mapa do RJ e votação nos {formatNumero(meta.municipiosComVoto)}{" "}
                municípios — {formatNumero(votosInterior)} votos no interior
              </span>
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-blue-700" />
        </Link>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          title="Bairros com mais votos"
          description={`${ranking.length} bairros com votação registrada na cidade`}
          className="lg:col-span-2"
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Bairro</th>
                  <th className="px-3 py-3 font-medium">Região Adm.</th>
                  <th className="px-3 py-3 text-right font-medium">Zonas</th>
                  <th className="px-3 py-3 text-right font-medium">Votos</th>
                  <th className="px-5 py-3 font-medium">% do total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ranking.map((b) => (
                  <tr key={b.nome} className="hover:bg-slate-50/70">
                    <td className="px-5 py-2.5 font-medium text-slate-800">
                      {b.nome}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">{b.ra}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                      {b.zonas.length}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium text-slate-800">
                      {formatNumero(b.votos)}
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          value={b.votos / meta.totalVotos}
                          tone="blue"
                          className="w-24"
                        />
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
          title="Zonas com mais votos"
          description="Maiores votações por zona eleitoral"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-slate-50">
            {zonas.slice(0, 12).map((z) => (
              <li
                key={z.zona}
                className="flex items-center justify-between px-5 py-2.5 text-sm"
              >
                <span className="text-slate-700">
                  <span className="font-semibold text-slate-900">Zona {z.zona}</span>
                  <span className="ml-2 text-xs text-slate-400">{z.bairro}</span>
                </span>
                <span className="text-right">
                  <span className="tabular-nums font-medium text-slate-800">
                    {formatNumero(z.votos)}
                  </span>
                  <span className="ml-2 text-xs tabular-nums text-slate-400">
                    {formatPct(z.pctValidos, 2)} dos válidos
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {ehEstadual && locais.length > 0 && (
        <Card
          className="mt-4"
          title="Locais de votação com mais votos — cidade do Rio"
          description="Onde o candidato mais recebeu votos (apuração por seção). Útil para planejar presença em 2026."
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Local de votação</th>
                  <th className="px-3 py-3 font-medium">Bairro</th>
                  <th className="px-3 py-3 text-right font-medium">Zona</th>
                  <th className="px-3 py-3 text-right font-medium">Votos</th>
                  <th className="px-5 py-3 font-medium">Peso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {locais.map((l) => (
                  <tr key={`${l.zona}-${l.nrLocal}`} className="hover:bg-slate-50/70">
                    <td className="px-5 py-2.5 font-medium text-slate-800">
                      <span className="flex items-center gap-2">
                        <Building2 className="size-3.5 shrink-0 text-slate-400" />
                        {l.nome}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">{l.bairro}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                      {l.zona}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium text-slate-800">
                      {formatNumero(l.votos)}
                    </td>
                    <td className="px-5 py-2.5">
                      <ProgressBar
                        value={maxLocal ? l.votos / maxLocal : 0}
                        tone="violet"
                        className="w-24"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="mt-4 text-xs text-slate-400">
        Fonte: TSE — resultados oficiais por município, zona e seção (votação
        nominal apurada). Percentuais calculados sobre os votos válidos do cargo.
        Geometria dos bairros: Data.Rio (Prefeitura do Rio); municípios: IBGE.
      </p>
    </div>
  );
}
