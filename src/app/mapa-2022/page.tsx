import { MapaEleicao } from "@/components/mapa-eleicao";

export const metadata = {
  title: "Mapa Eleitoral — Eleição 2022",
};

export default function Mapa2022Page() {
  return <MapaEleicao ano={2022} />;
}
