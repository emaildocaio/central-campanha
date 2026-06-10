import { MapaEleicao } from "@/components/mapa-eleicao";

export const metadata = {
  title: "Mapa Eleitoral — Eleição 2024",
};

export default function Mapa2024Page() {
  return <MapaEleicao ano={2024} />;
}
