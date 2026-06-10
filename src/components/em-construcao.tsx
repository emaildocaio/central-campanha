import type { ReactNode } from "react";
import { Construction } from "lucide-react";

/**
 * Envolve páginas ainda não finalizadas: mostra um aviso de "Página em
 * construção" e renderiza o conteúdo abaixo em cinza claro e estático
 * (não-interativo) — uma prévia esmaecida do que está por vir.
 */
export function EmConstrucao({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="mb-5 flex items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4">
        <Construction className="size-8 shrink-0 text-slate-400" />
        <div>
          <div className="text-xl font-semibold text-slate-600">
            Página em construção
          </div>
          <div className="text-sm text-slate-400">
            Esta seção ainda está sendo desenvolvida. O conteúdo abaixo é uma
            prévia estática.
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none select-none opacity-40 grayscale"
        aria-hidden="true"
      >
        {children}
      </div>
    </div>
  );
}
