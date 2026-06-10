"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// /kpis é só um atalho para a primeira aba de KPIs. No export estático (GitHub
// Pages) o redirect() de servidor não funciona de forma confiável e ignora o
// basePath; então redirecionamos no cliente — useRouter().replace já prefixa o
// basePath automaticamente (local: /kpis/...; produção: /central-campanha/kpis/...).
export default function KpisPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/kpis/votos-por-bairro");
  }, [router]);
  return null;
}
