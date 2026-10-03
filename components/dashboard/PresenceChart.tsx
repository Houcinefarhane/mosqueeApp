"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

export interface PresenceChartPoint {
  date: string;
  dateFull: string;
  presents: number;
  absents: number;
}

interface PresenceChartProps {
  data: PresenceChartPoint[];
  title?: string;
  subtitle?: string;
}

interface TooltipPayloadItem {
  dataKey: string;
  name: string;
  value: number;
  color: string;
  payload: PresenceChartPoint;
}

const COLORS = {
  present: "#16A34A",
  absent: "#DC2626",
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;
  const total = point.presents + point.absents;

  return (
    <div className="min-w-[180px] rounded-xl border border-primary/10 bg-white px-3.5 py-3 shadow-lg">
      <p className="mb-2.5 text-xs font-semibold capitalize text-foreground">
        {point.dateFull}
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-6 text-sm">
          <span className="flex items-center gap-2 text-gray-600">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: COLORS.present }}
            />
            Présents
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {point.presents}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6 text-sm">
          <span className="flex items-center gap-2 text-gray-600">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: COLORS.absent }}
            />
            Absents
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {point.absents}
          </span>
        </div>
      </div>
      <div className="mt-2.5 border-t border-gray-100 pt-2 text-xs text-gray-500">
        Total enregistré : <span className="font-medium text-foreground">{total}</span>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent: "green" | "red" | "neutral";
}) {
  const accentClasses = {
    green: "bg-success/10 text-success ring-success/20",
    red: "bg-danger/10 text-danger ring-danger/20",
    neutral: "bg-primary/5 text-primary-dark ring-primary/10",
  };

  return (
    <div
      className={`rounded-lg px-3 py-2.5 ring-1 ${accentClasses[accent]}`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold tabular-nums leading-tight">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] opacity-70">{hint}</p> : null}
    </div>
  );
}

export default function PresenceChart({
  data,
  title = "Présences — 30 derniers jours",
  subtitle = "Répartition quotidienne des présences et absences",
}: PresenceChartProps) {
  const totals = data.reduce(
    (acc, d) => ({
      presents: acc.presents + d.presents,
      absents: acc.absents + d.absents,
    }),
    { presents: 0, absents: 0 }
  );
  const recorded = totals.presents + totals.absents;
  const avgPresentPerDay =
    data.length > 0 ? Math.round(totals.presents / data.length) : 0;
  const avgAbsentPerDay =
    data.length > 0 ? Math.round(totals.absents / data.length) : 0;

  const maxDaily = data.reduce(
    (max, d) => Math.max(max, d.presents + d.absents),
    0
  );
  const yMax = maxDaily > 0 ? Math.ceil(maxDaily * 1.15) : 5;

  const tickIndices = new Set<number>();
  if (data.length > 0) {
    const step = Math.max(1, Math.floor(data.length / 6));
    for (let i = 0; i < data.length; i += step) tickIndices.add(i);
    tickIndices.add(data.length - 1);
  }

  const chartBody =
    data.length === 0 ? (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        Aucune donnée de présence disponible
      </div>
    ) : (
      <div className="h-56 w-full min-w-0 sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
            barCategoryGap="20%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              interval={0}
              tickFormatter={(value, index) =>
                tickIndices.has(index) ? value : ""
              }
              dy={6}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={[0, yMax]}
              width={32}
            />
            {avgPresentPerDay > 0 ? (
              <ReferenceLine
                y={avgPresentPerDay}
                stroke="#16A34A"
                strokeDasharray="4 4"
                strokeOpacity={0.45}
              />
            ) : null}
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(15, 81, 50, 0.04)" }}
            />
            <Bar
              dataKey="presents"
              name="Présents"
              stackId="presence"
              fill={COLORS.present}
              radius={[0, 0, 0, 0]}
              maxBarSize={18}
            />
            <Bar
              dataKey="absents"
              name="Absents"
              stackId="presence"
              fill={COLORS.absent}
              radius={[3, 3, 0, 0]}
              maxBarSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );

  return (
    <Card className="overflow-hidden p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-4 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </div>
        {data.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 font-medium text-success">
              <span className="h-2 w-2 rounded-full bg-success" />
              Présents
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-1 font-medium text-danger">
              <span className="h-2 w-2 rounded-full bg-danger" />
              Absents
            </span>
          </div>
        ) : null}
      </div>

      {data.length > 0 ? (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <SummaryStat
            label="Présences"
            value={totals.presents.toLocaleString("fr-FR")}
            hint="sur 30 jours"
            accent="green"
          />
          <SummaryStat
            label="Absences"
            value={totals.absents.toLocaleString("fr-FR")}
            hint="sur 30 jours"
            accent="red"
          />
          <SummaryStat
            label="Moyenne / jour"
            value={`${avgPresentPerDay} présents`}
            hint={`${avgAbsentPerDay} absents en moyenne`}
            accent="neutral"
          />
          <SummaryStat
            label="Total enregistré"
            value={recorded.toLocaleString("fr-FR")}
            hint="sur 30 jours"
            accent="neutral"
          />
        </div>
      ) : null}

      {chartBody}
    </Card>
  );
}
