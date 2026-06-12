import {
  LayoutDashboard,
  Gauge,
  BarChart3,
  Target,
  Users,
  Map,
  Landmark,
  Vote,
  ListTree,
  Newspaper,
  CalendarDays,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: NavItem[];
  /** Seção ainda em desenvolvimento — exibida em cinza (muted) na navegação. */
  emConstrucao?: boolean;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Visão Geral", icon: LayoutDashboard, emConstrucao: true },
  {
    href: "/kpis",
    label: "KPIs",
    icon: Gauge,
    children: [
      { href: "/kpis/votos-por-bairro", label: "Votos por bairro", icon: BarChart3 },
      { href: "/kpis/eleitores-por-ra", label: "Eleitores a conquistar", icon: Target },
    ],
  },
  { href: "/apoiadores", label: "Apoiadores", icon: Users, emConstrucao: true },
  { href: "/mapa", label: "Mapa Eleitoral", icon: Map, emConstrucao: true },
  { href: "/mapa-2018", label: "Eleição 2018", icon: Landmark },
  { href: "/mapa-2020", label: "Eleição 2020", icon: Vote },
  { href: "/mapa-2022", label: "Eleição 2022", icon: Landmark },
  { href: "/mapa-2024", label: "Eleição 2024", icon: Vote },
  { href: "/de-para", label: "De Para", icon: ListTree },
  { href: "/clipping", label: "Clipping de Notícias", icon: Newspaper },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, emConstrucao: true },
  { href: "/financeiro", label: "Financeiro", icon: Wallet, emConstrucao: true },
];

export function isActive(href: string, path: string): boolean {
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}

/** Itens de navegação achatados (inclui sub-itens) — útil para títulos de página. */
export const flatNavItems: NavItem[] = navItems.flatMap((item) =>
  item.children ? [item, ...item.children] : [item],
);

export function pageTitle(path: string): string {
  // prioriza o item mais específico (sub-rota) quando houver
  const exato = flatNavItems.find((n) => n.href === path);
  if (exato) return exato.label;
  const item = flatNavItems.find((n) => isActive(n.href, path));
  return item?.label ?? "Central de Campanha";
}
