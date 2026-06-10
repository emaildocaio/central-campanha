"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { navItems, isActive } from "./nav-items";
import { cn } from "@/lib/cn";
import type { Campanha } from "@/lib/types";
import { diasAte, formatData } from "@/lib/format";

export function Topbar({ campanha }: { campanha: Campanha }) {
  const path = usePathname();
  const dias = diasAte(campanha.dataEleicao);
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="lg:hidden">
          <span className="text-sm font-semibold text-slate-900">{campanha.candidato}</span>
          <span className="ml-2 text-xs text-slate-500">{campanha.cargo}</span>
        </div>
        <div className="hidden text-sm text-slate-500 lg:block">
          Central de Campanha ·{" "}
          <span className="font-medium text-slate-700">
            {campanha.cargo} — {campanha.estado}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
          <CalendarClock className="size-4 text-blue-600" />
          <span className="text-xs text-slate-600">
            Eleição {formatData(campanha.dataEleicao)} ·{" "}
            <span className="font-semibold text-slate-900">faltam {dias} dias</span>
          </span>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:hidden">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, path);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
                active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
