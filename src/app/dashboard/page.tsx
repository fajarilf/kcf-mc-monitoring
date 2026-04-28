"use client";

import { useMemo } from "react";
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
import { ganttData, machines, type GanttRow } from "@/lib/mock-data";
import { useNowTicker } from "@/hooks/use-mounted-now";

const TICKS = 6;

function formatClock(h: number, addSecond: boolean = true): string {
  const wrapped = ((h % 24) + 24) % 24;
  const hh = Math.floor(wrapped);
  const remaining = (wrapped - hh) * 60;
  const mm = Math.floor(remaining);
  const ss = Math.round((remaining - mm) * 60);

  const clockFormat: string = addSecond ? 
    `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`:
    `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;

  return clockFormat;
}

function truncateRows(rows: GanttRow[], cutoffHours: number): GanttRow[] {
  return rows.map((row) => ({
    ...row,
    segments: row.segments
      .filter((seg) => seg.start < cutoffHours)
      .map((seg) => {
        const remaining = cutoffHours - seg.start;
        return {
          ...seg,
          duration: Math.min(seg.duration, remaining),
        };
      }),
  }));
}

export default function DashboardPage() {
  const now = useNowTicker(1000);

  const counts = useMemo(() => {
    return {
      running: machines.filter((m) => m.status === "active").length,
      idle: machines.filter((m) => m.status === "idle").length,
      inactive: machines.filter((m) => m.status === "inactive").length,
    };
  }, []);

  const { rows, hourOfDay } = useMemo(() => {
    const fullRows = ganttData.today;
    if (now === null) {
      return { rows: fullRows, hourOfDay: 24 };
    }
    const d = new Date(now);
    const h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
    return { rows: truncateRows(fullRows, h), hourOfDay: h };
  }, [now]);

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
              Live status timeline · {formatClock(hourOfDay)}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <GanttBarChart
            rows={rows}
            totalUnits={24}
            unitLabel="h"
            tickCount={TICKS}
            formatTick={(h) => formatClock(h, false)}
            formatClock={formatClock}
          />
        </CardContent>
      </Card>
    </div>
  );
}