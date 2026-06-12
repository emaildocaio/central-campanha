import { MapaEleicaoMulti } from "@/components/mapa-eleicao-multi";
import { getCandidatosAno } from "@/lib/candidatos-data";

export const metadata = {
  title: "Mapa Eleitoral — Eleição 2024",
};

export default function Mapa2024Page() {
  return <MapaEleicaoMulti ano={2024} candidatos={getCandidatosAno(2024)} />;
}
