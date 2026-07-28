import { Sparkles, CalendarRange, Send, Info } from "lucide-react";
import { KpiCard, PageHeader, Badge } from "@/components/ui";
import { PautaLista } from "@/components/pauta-lista";
import { getPauta } from "@/lib/pauta-data";
import { formatData } from "@/lib/format";

export const metadata = {
  title: "Pauta da Semana",
};

export default async function PautaPage() {
  const { ideias, exemplo, semana, atualizadoEm } = await getPauta();
  const prontas = ideias.filter((i) => i.selo === "pronto").length;
  const checar = ideias.filter((i) => i.selo === "checar").length;

  return (
    <div>
      <PageHeader
        title="Pauta da Semana"
        description="Ideias de mensagem para a Comunidade do WhatsApp, geradas toda segunda por um agente que cruza a base do candidato, o clipping da semana e a estrutura de grupos. Sugestões para o comitê revisar, editar e enviar. O agente nunca publica sozinho."
      >
        <Badge tone="violet">Comunidade · WhatsApp</Badge>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Ideias da semana" value={String(ideias.length)} icon={Sparkles} tone="violet" />
        <KpiCard label="Semana" value={semana ?? "—"} icon={CalendarRange} tone="blue" />
        <KpiCard
          label="Status"
          value={`${prontas} prontas`}
          sub={checar > 0 ? `${checar} para checar` : "todas prontas"}
          icon={Send}
          tone="emerald"
        />
        <KpiCard
          label="Atualizado em"
          value={atualizadoEm ? formatData(atualizadoEm) : "—"}
          sub={exemplo ? "dados de exemplo" : "última geração"}
          icon={CalendarRange}
          tone="slate"
        />
      </div>

      {exemplo && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <span>
            Exibindo <strong>exemplos</strong> gerados a partir do clipping real desta
            semana, para visualizar o formato. Quando o fluxo do n8n estiver publicando a
            pauta, defina a variável{" "}
            <code className="rounded bg-amber-100 px-1">PAUTA_FEED_URL</code> no{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code> (e no deploy) para
            exibir as ideias reais geradas toda segunda.
          </span>
        </div>
      )}

      <div className="mt-4">
        <PautaLista ideias={ideias} />
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Cada ideia vem com a mensagem pronta no tom do candidato, o público sugerido
        (Todos ou grupos específicos) e a fonte citada. Campanha é verdade: o que não tem
        fonte não vira afirmação. Revise e edite antes de enviar.
      </p>
    </div>
  );
}
