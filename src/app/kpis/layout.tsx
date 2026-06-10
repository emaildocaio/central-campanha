import { PageHeader, Badge } from "@/components/ui";
import { KpiTabs } from "@/components/kpi-tabs";

export default function KpisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader
        title="KPIs"
        description="Indicadores de acompanhamento e inteligência eleitoral da campanha."
      >
        <Badge tone="blue">Cidade do Rio de Janeiro</Badge>
      </PageHeader>

      <KpiTabs />

      {children}
    </div>
  );
}
