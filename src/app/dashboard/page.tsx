"use client";

import { useMemo } from "react";
import { Activity, PowerOff, Wrench, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { GanttBarChart } from "@/components/dashboard/GanttBarChart";
import { machines, type GanttRow } from "@/lib/mock-data";
import { MACHINE_STATUS } from "@/lib/status";
import { useNowTicker } from "@/hooks/use-mounted-now";
import { useStatusTimelineHook } from "@/hooks/use-status-timeline-hook";
import type { MachineTimeline } from "@/model/status-timeline-model";

const TICKS = 6;
const MS_PER_HOUR = 1000 * 60 * 60;

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

/**
 * Converts the status-timeline API payload into Gantt rows.
 * Segment times are expressed as hours since local midnight so they line up
 * with the chart's 0–24h axis; open segments (end: null) run up to `nowMs`.
 * The API's numeric status maps directly onto the MACHINE_STATUS enum.
 */
function toGanttRows(data: MachineTimeline[], nowMs: number): GanttRow[] {
  const midnight = new Date(nowMs);
  midnight.setHours(0, 0, 0, 0);
  const dayStart = midnight.getTime();

  return data.map((machine) => ({
    machineId: String(machine.machineId),
    machineName: machine.machineName,
    segments: machine.timeline
      .map((seg) => {
        const startH = (new Date(seg.start).getTime() - dayStart) / MS_PER_HOUR;
        const endMs = seg.end ? new Date(seg.end).getTime() : nowMs;
        const endH = (endMs - dayStart) / MS_PER_HOUR;
        // Clamp to the visible 0–24h window.
        const start = Math.max(0, Math.min(24, startH));
        const end = Math.max(0, Math.min(24, endH));
        return {
          status: seg.status,
          start,
          duration: end - start,
        };
      })
      .filter((seg) => seg.duration > 0),
  }));
}

export default function DashboardPage() {
  const now = useNowTicker(1000);
  const { data, isLoading, isError, error } = useStatusTimelineHook();

  const counts = useMemo(() => {
    const by = (status: MACHINE_STATUS) =>
      machines.filter((m) => m.status === status).length;
    return {
      running: by(MACHINE_STATUS.RUNNING),
      setup: by(MACHINE_STATUS.SETUP),
      cyokotei: by(MACHINE_STATUS.CYOKOTEI_STOP),
      off: by(MACHINE_STATUS.OFF),
    };
  }, []);

  const hourOfDay = useMemo(() => {
    if (now === null) return 24;
    const d = new Date(now);
    return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  }, [now]);

  const rows = useMemo<GanttRow[]>(() => {
    if (!data?.data || now === null) return [];
    return toGanttRows(data.data, now);
  }, [data, now]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Running"
          value={counts.running}
          icon={Activity}
          tone="green"
        />
        <StatCard
          label="Setup"
          value={counts.setup}
          icon={Wrench}
          tone="yellow"
        />
        <StatCard
          label="Cyokotei Stop"
          value={counts.cyokotei}
          icon={XCircle}
          tone="red"
        />
        <StatCard label="Off" value={counts.off} icon={PowerOff} tone="gray" />
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
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading timeline…
            </p>
          ) : isError ? (
            <p className="py-12 text-center text-sm text-destructive">
              {error?.response?.data ??
                error?.message ??
                "Failed to load timeline."}
            </p>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No timeline data available.
            </p>
          ) : (
            <GanttBarChart
              rows={rows}
              totalUnits={24}
              unitLabel="h"
              tickCount={TICKS}
              formatTick={(h) => formatClock(h, false)}
              formatClock={formatClock}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
