"use client";

import { useMemo, useState } from "react";
import { Activity, PauseCircle, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { GanttBarChart } from "@/components/dashboard/GanttBarChart";
import { ganttData, machines } from "@/lib/mock-data";

type Period = "today" | "lastWeek" | "lastMonth";

const periodConfig: Record<
  Period,
  { label: string; totalUnits: number; unitLabel: string; ticks: number; formatTick?: (n: number) => string }
> = {
  today: {
    label: "Today",
    totalUnits: 24,
    unitLabel: "h",
    ticks: 6,
    formatTick: (h: number) => `${String(h % 24).padStart(2, "0")}:00`,
  },
  lastWeek: {
    label: "Last Week",
    totalUnits: 7 * 24,
    unitLabel: "h",
    ticks: 7,
    formatTick: (h: number) => `D${Math.round(h / 24) + 1}`,
  },
  lastMonth: {
    label: "Last Month",
    totalUnits: 30 * 24,
    unitLabel: "h",
    ticks: 10,
    formatTick: (h: number) => `D${Math.round(h / 24) + 1}`,
  },
};

export default function DashboardPage() {
  const [period] = useState<Period>("today");

  const counts = useMemo(() => {
    return {
      running: machines.filter((m) => m.status === "active").length,
      idle: machines.filter((m) => m.status === "idle").length,
      inactive: machines.filter((m) => m.status === "inactive").length,
    };
  }, []);

  const cfg = periodConfig[period];
  const rows =
    period === "today"
      ? ganttData.today
      : period === "lastWeek"
        ? ganttData.lastWeek
        : ganttData.lastMonth;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Active"
          value={counts.running}
          icon={Activity}
          tone="green"
        />
        <StatCard
          label="Idle"
          value={counts.idle}
          icon={PauseCircle}
          tone="yellow"
        />
        <StatCard
          label="Inactive"
          value={counts.inactive}
          icon={XCircle}
          tone="red"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="mx-auto text-center">
            <CardTitle className="text-[20px] mb-2">Machine Activity</CardTitle>
            <CardDescription>
              Status timeline across all machines
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <GanttBarChart
            rows={rows}
            totalUnits={cfg.totalUnits}
            unitLabel={cfg.unitLabel}
            tickCount={cfg.ticks}
            formatTick={cfg.formatTick}
          />
        </CardContent>
      </Card>
    </div>
  );
}
