"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Target } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/kpis/votos-por-bairro", label: "Votos por bairro", icon: BarChart3 },
  { href: "/kpis/eleitores-por-ra", label: "Eleitores a conquistar", icon: Target },
];

export function KpiTabs() {
  const path = usePathname();
  return (
    <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = path === href || path.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
