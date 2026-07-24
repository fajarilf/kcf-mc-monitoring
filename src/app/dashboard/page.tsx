"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, Clock, PowerOff, Wrench, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { GanttBarChart } from "@/components/dashboard/GanttBarChart";
import { MachineCardCompact } from "@/components/dashboard/MachineCardCompact";
import { type GanttRow } from "@/lib/mock-data";
import { MACHINE_STATUS } from "@/lib/status";
import { useNowTicker } from "@/hooks/use-mounted-now";
import { useStatusTimelineHook } from "@/hooks/use-status-hook";
import type { MachineTimeline } from "@/model/status-model";
import { useMqttJson } from "@/hooks/use-mqtt";
import type { MqttResponses } from "@/types/mqtt-responses";
import { useMachineHook } from "@/hooks/use-machine";
import { MachineData } from "@/model/machine-model";

type ViewMode = "12h" | "24h";

const TICKS = 6;
const MS_PER_HOUR = 1000 * 60 * 60;

/**
 * Resolves the visible window from the current time.
 * 12h mode: Day shift 06:00→18:00, Night shift 18:00→06:00.
 * 24h mode: Full day 00:00→24:00.
 */
function getShiftWindow(nowMs: number, mode: ViewMode): { startMs: number; startHour: number; hours: number } {
  const base = new Date(nowMs);
  base.setMinutes(0, 0, 0);

  if (mode === "24h") {
    base.setHours(0, 0, 0, 0);
    return { startMs: base.getTime(), startHour: 0, hours: 24 };
  }

  // 12h shift mode
  const h = base.getHours();
  if (h >= 6 && h < 18) {
    base.setHours(6);
    return { startMs: base.getTime(), startHour: 6, hours: 12 };
  }
  // Night shift: 18:00 → 06:00. Before 06:00 the shift began the previous day.
  if (h < 6) base.setDate(base.getDate() - 1);
  base.setHours(18);
  return { startMs: base.getTime(), startHour: 18, hours: 12 };
}

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
 * Segment times are expressed as hours since the window start so they
 * line up with the chart's axis; open segments (end: null) run up to
 * `nowMs`. The API's numeric status maps directly onto the MACHINE_STATUS enum.
 */
function toGanttRows(
  data: MachineTimeline[],
  machineList: MachineData[],
  nowMs: number,
  windowStartMs: number,
  windowHours: number,
): GanttRow[] {
  const windowEndMs = windowStartMs + windowHours * MS_PER_HOUR;

  // Pre-index timelines by machineId for O(1) lookup.
  const timelineById = new Map<string, MachineTimeline>();
  for (const m of data) {
    timelineById.set(String(m.machineId), m);
  }

  const result: GanttRow[] = [];

  for (const machine of machineList) {
    const machineId = String(machine.id);
    const machineName = machine.name.toUpperCase();
    const machineTimeline = timelineById.get(machineId);
    const segment = machineTimeline?.production.flatMap((group) =>
      group.timeline.map((seg) => {
        const segStartMs = new Date(seg.start).getTime();
        const segEndMs = seg.end ? new Date(seg.end).getTime() : nowMs;
        const startMs = Math.max(windowStartMs, Math.min(windowEndMs, segStartMs));
        const endMs = Math.max(windowStartMs, Math.min(windowEndMs, segEndMs));
        const start = (startMs - windowStartMs) / MS_PER_HOUR;
        const end = (endMs - windowStartMs) / MS_PER_HOUR;
        return {
          status: seg.status,
          start,
          duration: end - start,
          userName: group.user,
          productPartNo: group.partNo,
        };
      }),
    ).filter((seg) => seg.duration > 0);

    result.push({ machineId, machineName, segments: segment ?? [] });
  }

  return result;
}

type MachineStatusDetail = {
  machine_id: number,
  status: MACHINE_STATUS,
}

export default function DashboardPage() {
  const now = useNowTicker(1000);
  const [viewMode, setViewMode] = useState<ViewMode>("24h");

  // Bucket time to 30s intervals so the chart data doesn't rebuild every second.
  // The 1s ticker is only needed for the query date range (which is day-granular).
  const chartNow = useMemo(() => now === null ? null : Math.floor(now / 30_000) * 30_000, [now]);

  const dateRange = useMemo(() => {
    if (!now) return { startDate: undefined, endDate: undefined };
    // For 24h mode, fetch 2 days to cover the full day
    const msBack = viewMode === "24h" ? 2 * 86_400_000 : 86_400_000;
    return {
      startDate: new Date(now - msBack).toISOString().split('T')[0],
      endDate: new Date(now).toISOString().split('T')[0],
    };
  }, [now, viewMode]);

  const timelineParams = useMemo(() => ({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  }), [dateRange.startDate, dateRange.endDate]);

  const { data: timelineData, isLoading: timelineLoading, refetch } = useStatusTimelineHook(timelineParams);

  const { data: machineData, isLoading: machineLoading } = useMachineHook();

  const isLoading = timelineLoading || machineLoading;

  const machines = useMemo<MachineStatusDetail[]>(() => {
    if (!timelineData?.data) return [];
    return timelineData.data.map((m) => {
      const allSegments = m.production.flatMap((g) => g.timeline);
      const last = allSegments[allSegments.length - 1];
      return {
        machine_id: m.machineId,
        status: last?.status ?? MACHINE_STATUS.OFF,
      };
    });
  }, [timelineData]);

  // Seed last-seen status from the timeline so the first MQTT tick that
  // simply echoes the current state does not trigger a redundant refetch.
  const lastStatusRef = useRef<Map<string, MACHINE_STATUS>>(new Map());
  useEffect(() => {
    if (!timelineData?.data) return;
    for (const m of timelineData.data) {
      const allSegments = m.production.flatMap((g) => g.timeline);
      const last = allSegments[allSegments.length - 1];
      if (last) lastStatusRef.current.set(String(m.machineId), last.status);
    }
  }, [timelineData]);

  useMqttJson<MqttResponses>("+", (payload, message) => {
    const id = message.topic.match(/^machine(\d+)$/)?.[1];
    if (!id || !payload.Machine) return;
    const incoming = payload.Machine.STATUS;
    const prev = lastStatusRef.current.get(id);
    lastStatusRef.current.set(id, incoming);
    if (prev !== undefined && prev !== incoming) refetch();
  });

  const counts = useMemo(() => {
    const by = (status: MACHINE_STATUS): number =>
      machines.filter((m) => m.status === status).length;
    return {
      running: by(MACHINE_STATUS.RUNNING),
      dandori: by(MACHINE_STATUS.DANDORI),
      cyokotei: by(MACHINE_STATUS.CYOKOTEI_STOP),
      setup: by(MACHINE_STATUS.SETUP),
      off: by(MACHINE_STATUS.OFF),
    };
  }, [machines]);

  const shift = useMemo(
    () => (chartNow === null ? null : getShiftWindow(chartNow, viewMode)),
    [chartNow, viewMode],
  );

  const rows = useMemo<GanttRow[]>(() => {
    if (chartNow === null || shift === null) return [];
    if (timelineData?.data && timelineData.data.length > 0) {
      return toGanttRows(timelineData.data, machineData?.data ?? [], chartNow, shift.startMs, shift.hours);
    }
    // No timeline yet — still render the chart with machines on the y-axis and
    // the time axis, just without any status segments.
    return [...(machineData?.data ?? [])]
      .sort((a, b) => a.id - b.id)
      .map((m) => ({
        machineId: String(m.id),
        machineName: m.name.toUpperCase(),
        segments: [],
      }));
  }, [timelineData, machineData, chartNow, shift]);

  const startHour = shift?.startHour ?? 0;
  const handleFormatTick = useCallback(
    (h: number) => formatClock(startHour + h, false),
    [startHour],
  );
  const handleFormatClock = useCallback(
    (h: number) => formatClock(startHour + h),
    [startHour],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Running"
          value={counts.running}
          icon={Activity}
          tone="green"
        />
        <StatCard
          label="Dandori"
          value={counts.dandori}
          icon={Clock}
          tone="yellow"
        />
        <StatCard
          label="Setup"
          value={counts.setup}
          icon={Wrench}
          tone="gray"
        />
        <StatCard
          label="Cyokotei Stop"
          value={counts.cyokotei}
          icon={XCircle}
          tone="red"
        />
        <StatCard label="Off" value={counts.off} icon={PowerOff} tone="black" />
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Loading machines…
        </p>
      ) : (
        <div className="overflow-hidden">
          <div className="flex gap-3 w-max animate-marquee hover:[animation-play-state:paused]">
            {[...(machineData?.data ?? []), ...(machineData?.data ?? [])].map((m, i) => (
              <div key={`${m.id}-${i}`} className="w-64 shrink-0">
                <Link
                  href={`/monitoring/${m.id}`}
                  aria-label={`View details for ${m.name}`}
                  className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MachineCardCompact machine={m} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <Card className="pe-2">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="mx-auto text-center">
            <CardTitle className="text-[20px] mb-2">Machine Activity Timeline</CardTitle>
          </div>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-32 rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12h">12 Hour</SelectItem>
              <SelectItem value="24h">24 Hour</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading timeline…
            </p>
          ) : (
            <GanttBarChart
              rows={rows}
              totalUnits={shift?.hours ?? 12}
              unitLabel="h"
              tickCount={viewMode === "24h" ? 12 : TICKS}
              formatTick={handleFormatTick}
              formatClock={handleFormatClock}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
