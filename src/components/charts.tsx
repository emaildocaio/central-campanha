"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  ComposedChart,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { formatBRL, formatCompactoBRL, formatNumero } from "@/lib/format";

const CORES = [
  "#b0503f",
  "#d99a2b",
  "#8c3c2e",
  "#c6892a",
  "#7a6a5f",
  "#e3c488",
  "#9c4435",
  "#b9a78c",
];

const num = (v: unknown) => formatNumero(Number(v));
const brl = (v: unknown) => formatBRL(Number(v));

export function TopMunicipiosChart({
  data,
}: {
  data: { nome: string; projetado: number; meta: number }[];
}) {
  return (
    <div className="h-[380px] w-full">
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 8, right: 20, top: 4, bottom: 4 }}
          barCategoryGap={10}
        >
          <CartesianGrid horizontal={false} stroke="#f0e9d6" />
          <XAxis
            type="number"
            tickFormatter={num}
            fontSize={11}
            stroke="#b9a78c"
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="nome"
            width={140}
            fontSize={11}
            stroke="#574a40"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip formatter={num} cursor={{ fill: "#f3ecdb" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="meta" name="Meta" fill="#d6c5a3" radius={[0, 4, 4, 0]} barSize={8} />
          <Bar
            dataKey="projetado"
            name="Projetado"
            fill="#b0503f"
            radius={[0, 4, 4, 0]}
            barSize={8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VotosRegiaoChart({
  data,
}: {
  data: { regiao: string; projetado: number; meta: number }[];
}) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f0e9d6" />
          <XAxis
            dataKey="regiao"
            fontSize={10}
            stroke="#b9a78c"
            interval={0}
            angle={-20}
            textAnchor="end"
            height={70}
          />
          <YAxis fontSize={11} stroke="#b9a78c" tickFormatter={num} tickLine={false} />
          <Tooltip formatter={num} cursor={{ fill: "#f3ecdb" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="meta" name="Meta" fill="#d6c5a3" radius={[4, 4, 0, 0]} />
          <Bar dataKey="projetado" name="Projetado" fill="#b0503f" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({
  data,
  formato = "numero",
}: {
  data: { name: string; value: number }[];
  formato?: "numero" | "brl";
}) {
  const fmt = formato === "brl" ? brl : num;
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={96}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CORES[i % CORES.length]} />
            ))}
          </Pie>
          <Tooltip formatter={fmt} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FluxoChart({
  data,
}: {
  data: { mes: string; receitas: number; despesas: number }[];
}) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f0e9d6" />
          <XAxis dataKey="mes" fontSize={11} stroke="#b9a78c" tickLine={false} />
          <YAxis
            fontSize={11}
            stroke="#b9a78c"
            tickFormatter={(v) => formatCompactoBRL(Number(v))}
            tickLine={false}
            width={64}
          />
          <Tooltip formatter={brl} cursor={{ fill: "#f3ecdb" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="receitas"
            name="Receitas"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            barSize={18}
          />
          <Bar
            dataKey="despesas"
            name="Despesas"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            barSize={18}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MetaGauge({ value }: { value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="relative h-[230px] w-full">
      <ResponsiveContainer>
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          data={[{ value: pct }]}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: "#f0e9d6" }}
            dataKey="value"
            cornerRadius={12}
            fill="#b0503f"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900">{pct}%</span>
        <span className="text-xs text-slate-500">da meta projetada</span>
      </div>
    </div>
  );
}
