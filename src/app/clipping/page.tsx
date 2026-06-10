import { Newspaper, RadioTower, Tag, Clock, Info } from "lucide-react";
import { KpiCard, PageHeader, Badge } from "@/components/ui";
import { ClippingLista } from "@/components/clipping-lista";
import {
  fontesDe,
  getClipping,
  palavrasChaveDe,
} from "@/lib/clipping-data";
import { formatData } from "@/lib/format";

export const metadata = {
  title: "Clipping de Notícias",
};

export default async function ClippingPage() {
  const { noticias, exemplo, atualizadoEm } = await getClipping();
  const palavras = palavrasChaveDe(noticias);

  return (
    <div>
      <PageHeader
        title="Clipping de Notícias"
        description="Monitoramento diário no Google News dos principais políticos do Rio de Janeiro. Coleta automática (2x ao dia, incremental) via fluxo do n8n."
      >
        <Badge tone="blue">Políticos do RJ · 2026</Badge>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Notícias coletadas"
          value={String(noticias.length)}
          icon={Newspaper}
          tone="blue"
        />
        <KpiCard
          label="Fontes"
          value={String(fontesDe(noticias))}
          icon={RadioTower}
          tone="violet"
        />
        <KpiCard
          label="Políticos monitorados"
          value={String(palavras.length)}
          sub={palavras.slice(0, 2).join(", ")}
          icon={Tag}
          tone="slate"
        />
        <KpiCard
          label="Atualizado em"
          value={atualizadoEm ? formatData(atualizadoEm) : "—"}
          sub={exemplo ? "dados de exemplo" : "última coleta"}
          icon={Clock}
          tone="emerald"
        />
      </div>

      {exemplo && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <span>
            Exibindo <strong>exemplos</strong> para visualizar o layout. Quando o
            fluxo do n8n estiver publicando o feed, defina a variável{" "}
            <code className="rounded bg-amber-100 px-1">CLIPPING_FEED_URL</code> no{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code> para
            exibir as notícias reais coletadas do Google News.
          </span>
        </div>
      )}

      <div className="mt-4">
        <ClippingLista noticias={noticias} />
      </div>

      <p className="mt-4 text-xs text-slate-400">
        As notícias são coletadas do Google News pelo fluxo do n8n e atualizadas
        de forma incremental. Clique em um item para abrir a matéria na fonte
        original.
      </p>
    </div>
  );
}
