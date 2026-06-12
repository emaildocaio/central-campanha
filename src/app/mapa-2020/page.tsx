import { MapaEleicaoMulti } from "@/components/mapa-eleicao-multi";
import { getCandidatosAno } from "@/lib/candidatos-data";

export const metadata = {
  title: "Mapa Eleitoral — Eleição 2020",
};

export default function Mapa2020Page() {
  return <MapaEleicaoMulti ano={2020} candidatos={getCandidatosAno(2020)} />;
}
