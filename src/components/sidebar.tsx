"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems, isActive } from "./nav-items";
import { cn } from "@/lib/cn";

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-slate-900 text-slate-100 lg:flex">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
          Central de Campanha
        </div>
        <div className="mt-1 text-lg font-semibold leading-tight">Renato Pellizzari</div>
        <div className="text-xs text-slate-400">Deputado Estadual · RJ</div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon, children, emConstrucao }) => {
          const active = isActive(href, path);
          return (
            <div key={href}>
              <Link
                href={href}
                title={emConstrucao ? "Em construção" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  emConstrucao
                    ? active
                      ? "bg-white/5 text-slate-400"
                      : "text-slate-500 hover:bg-white/5 hover:text-slate-400"
                    : active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="size-[18px]" />
                {label}
              </Link>
              {children && active && (
                <div className="ml-[26px] mt-1 space-y-1 border-l border-white/10 pl-3">
                  {children.map(({ href: subHref, label: subLabel, icon: SubIcon }) => {
                    const subActive = isActive(subHref, path);
                    return (
                      <Link
                        key={subHref}
                        href={subHref}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition",
                          subActive
                            ? "bg-blue-500/20 text-white"
                            : "text-slate-400 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <SubIcon className="size-4" />
                        {subLabel}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-5 py-4 text-[11px] leading-relaxed text-slate-400">
        Dados de exemplo · v0.1
        <br />
        Eleições 2026
      </div>
    </aside>
  );
}
