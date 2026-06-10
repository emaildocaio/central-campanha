import { getBairros } from "@/lib/votos-data";
import { getBairroParaRA } from "@/lib/regioes-admin";
import { KpiVotosBairro, type BairroKpi } from "@/components/kpi-votos-bairro";

export const metadata = {
  title: "KPIs — Votos por bairro",
};

export default function VotosPorBairroPage() {
  const arr2022 = getBairros(2022);
  const arr2024 = getBairros(2024);
  const v2022 = new Map(arr2022.map((b) => [b.nome, b.votos]));
  const v2024 = new Map(arr2024.map((b) => [b.nome, b.votos]));
  const total2022 = arr2022.reduce((s, b) => s + b.votos, 0);
  const total2024 = arr2024.reduce((s, b) => s + b.votos, 0);
  const raDe = getBairroParaRA();

  const nomes = new Set<string>();
  for (const [n, v] of v2022) if (v > 0) nomes.add(n);
  for (const [n, v] of v2024) if (v > 0) nomes.add(n);

  const bairros: BairroKpi[] = [...nomes].map((nome) => {
    const a = v2022.get(nome) ?? 0;
    const b = v2024.get(nome) ?? 0;
    const s22 = total2022 ? a / total2022 : 0;
    const s24 = total2024 ? b / total2024 : 0;
    const ra = raDe.get(nome);
    return {
      nome,
      raNome: ra?.nome ?? "—",
      raNum: ra?.numero ?? "",
      v2022: a,
      v2024: b,
      share2022: s22,
      share2024: s24,
      deltaVotos: b - a,
      deltaShare: s24 - s22,
    };
  });

  return (
    <KpiVotosBairro bairros={bairros} totais={{ 2022: total2022, 2024: total2024 }} />
  );
}
