import { MapPin, Building2 } from "lucide-react";
import { KpiCard, PageHeader, Badge } from "@/components/ui";
import { getRegioesAdmin, getTotaisDePara } from "@/lib/regioes-admin";
import { getBairros } from "@/lib/votos-data";
import {
  DeParaAccordion,
  type RAComVotos,
} from "@/components/de-para-accordion";
import { formatNumero } from "@/lib/format";

export const metadata = {
  title: "De Para — Regiões Administrativas",
};

export default function DeParaPage() {
  const ras = getRegioesAdmin();
  const totais = getTotaisDePara();

  // votos do candidato por bairro (capital), agregados das zonas eleitorais
  const v2022 = new Map(getBairros(2022).map((b) => [b.nome, b.votos]));
  const v2024 = new Map(getBairros(2024).map((b) => [b.nome, b.votos]));

  const regioes: RAComVotos[] = ras.map((ra) => {
    const bairros = ra.bairros.map((nome) => ({
      nome,
      v2022: v2022.get(nome) ?? 0,
      v2024: v2024.get(nome) ?? 0,
    }));
    return {
      chave: ra.chave,
      numero: ra.numero,
      nome: ra.nome,
      ordem: ra.ordem,
      bairros,
      total2022: bairros.reduce((s, b) => s + b.v2022, 0),
      total2024: bairros.reduce((s, b) => s + b.v2024, 0),
    };
  });

  const totalCidade = {
    2022: regioes.reduce((s, r) => s + r.total2022, 0),
    2024: regioes.reduce((s, r) => s + r.total2024, 0),
  };

  return (
    <div>
      <PageHeader
        title="De Para — Regiões Administrativas"
        description="Clique em uma região administrativa para ver os bairros que a compõem, com os votos do candidato por bairro e o total da região. Começando pela cidade do Rio de Janeiro."
      >
        <Badge tone="blue">Cidade do Rio de Janeiro</Badge>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <KpiCard
          label="Regiões administrativas"
          value={formatNumero(totais.regioes)}
          icon={MapPin}
          tone="blue"
        />
        <KpiCard
          label="Bairros"
          value={formatNumero(totais.bairros)}
          icon={Building2}
          tone="violet"
        />
      </div>

      <DeParaAccordion regioes={regioes} totalCidade={totalCidade} />

      <p className="mt-4 text-xs text-slate-400">
        Votos agregados por bairro-sede das zonas eleitorais (fonte: TSE).
        Bairros sem zona eleitoral aparecem com 0. Limite de bairros e regiões
        administrativas: Prefeitura do Rio (Data.Rio). Próximas etapas podem
        incluir outros municípios do estado.
      </p>
    </div>
  );
}
