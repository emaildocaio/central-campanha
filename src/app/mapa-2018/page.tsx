import { MapaEleicaoMulti } from "@/components/mapa-eleicao-multi";
import { getCandidatosAno } from "@/lib/candidatos-data";

export const metadata = {
  title: "Mapa Eleitoral — Eleição 2018",
};

export default function Mapa2018Page() {
  return <MapaEleicaoMulti ano={2018} candidatos={getCandidatosAno(2018)} />;
}
