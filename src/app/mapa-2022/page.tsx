import { MapaEleicaoMulti } from "@/components/mapa-eleicao-multi";
import { getCandidatosAno } from "@/lib/candidatos-data";

export const metadata = {
  title: "Mapa Eleitoral — Eleição 2022",
};

export default function Mapa2022Page() {
  return <MapaEleicaoMulti ano={2022} candidatos={getCandidatosAno(2022)} />;
}
