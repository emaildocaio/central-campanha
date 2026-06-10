import type { ReactNode } from "react";
import { EmConstrucao } from "@/components/em-construcao";

export default function FinanceiroLayout({ children }: { children: ReactNode }) {
  return <EmConstrucao>{children}</EmConstrucao>;
}
