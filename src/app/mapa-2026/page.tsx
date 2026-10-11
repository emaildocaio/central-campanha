import { MapaEleicaoMulti } from "@/components/mapa-eleicao-multi";
import { getCandidatosAno } from "@/lib/candidatos-data";

export const metadata = {
  title: "Mapa Eleitoral — Eleição 2026",
};

export default function Mapa2026Page() {
  return <MapaEleicaoMulti ano={2026} candidatos={getCandidatosAno(2026)} />;
}
