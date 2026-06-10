import { getZonas, type AnoEleicao } from "@/lib/votos-data";
import { getBairroParaRA } from "@/lib/regioes-admin";
import { KpiEleitoresRA, type EleitoresRA } from "@/components/kpi-eleitores-ra";

export const metadata = {
  title: "KPIs — Eleitores a conquistar",
};

// Agrega o contexto eleitoral por Região Administrativa (zona -> bairro-sede -> RA).
function eleitoresPorRA(ano: AnoEleicao): EleitoresRA[] {
  const raDe = getBairroParaRA();
  const map = new Map<string, EleitoresRA>();
  for (const z of getZonas(ano)) {
    const ra = raDe.get(z.bairro) ?? { numero: "", nome: "Sem RA" };
    const cur =
      map.get(ra.nome) ?? {
        numero: ra.numero,
        nome: ra.nome,
        aptos: 0,
        comparecimento: 0,
        abstencao: 0,
        brancosNulos: 0,
        legenda: 0,
        potencial: 0,
      };
    cur.aptos += z.aptosZona;
    cur.comparecimento += z.comparecimentoZona;
    cur.abstencao += z.abstencaoZona;
    cur.brancosNulos += z.brancosZona + z.nulosZona;
    cur.legenda += z.legendaZona;
    cur.potencial += z.brancosZona + z.nulosZona + z.legendaZona;
    map.set(ra.nome, cur);
  }
  return [...map.values()];
}

export default function EleitoresPorRaPage() {
  return (
    <KpiEleitoresRA
      dados={{ 2022: eleitoresPorRA(2022), 2024: eleitoresPorRA(2024) }}
    />
  );
}
