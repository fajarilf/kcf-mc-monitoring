"use client";

import { useEffect, useMemo, useRef } from "react";
import { Activity, PowerOff, Wrench, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { GanttBarChart } from "@/components/dashboard/GanttBarChart";
import { type GanttRow } from "@/lib/mock-data";
import { MACHINE_STATUS } from "@/lib/status";
import { useNowTicker } from "@/hooks/use-mounted-now";
import { useStatusTimelineHook } from "@/hooks/use-status-hook";
import type { MachineTimeline } from "@/model/status-model";
import { useMqttJson } from "@/hooks/use-mqtt";
import type { MqttResponses } from "@/types/mqtt-responses";
import { useMachineHook } from "@/hooks/use-machine";
import { MachineData } from "@/model/machine-model";

const TICKS = 6;
const MS_PER_HOUR = 1000 * 60 * 60;
const SHIFT_HOURS = 12;

/**
 * Resolves the visible 12-hour shift window from the current time.
 * Day shift runs 06:00→18:00; once the clock passes 18:00 (and until the
 * next 06:00) it flips to the night shift 18:00→06:00.
 */
function getShiftWindow(nowMs: number): { startMs: number; startHour: number } {
  const base = new Date(nowMs);
  base.setMinutes(0, 0, 0);
  const h = base.getHours();

  if (h >= 6 && h < 18) {
    base.setHours(6);
    return { startMs: base.getTime(), startHour: 6 };
  }
  // Night shift: 18:00 → 06:00. Before 06:00 the shift began the previous day.
  if (h < 6) base.setDate(base.getDate() - 1);
  base.setHours(18);
  return { startMs: base.getTime(), startHour: 18 };
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
 * Segment times are expressed as hours since the shift window start so they
 * line up with the chart's 0–12h axis; open segments (end: null) run up to
 * `nowMs`. The API's numeric status maps directly onto the MACHINE_STATUS enum.
 */
function toGanttRows(
  data: MachineTimeline[],
  machineList: MachineData[],
  nowMs: number,
  windowStartMs: number,
): GanttRow[] {
  const windowEndMs = windowStartMs + SHIFT_HOURS * MS_PER_HOUR;

  // Order rows deterministically by machine id so the y-axis doesn't flip
  // when the machine API returns rows in a different order than the timeline.
  const result: GanttRow[] = [];

  for (const machine of machineList) {
    const machineId =  String(machine.id);
    const machineName = machine.name.toUpperCase();
    const machineTimeline = data.find((m) => String(m.machineId) === machineId)
    const segment = machineTimeline?.timeline
      .map((seg) => {
        const segStartMs = new Date(seg.start).getTime();
        const segEndMs = seg.end ? new Date(seg.end).getTime() : nowMs;
        // Clamp to the visible 12h shift window, then express in hours from its start.
        const startMs = Math.max(windowStartMs, Math.min(windowEndMs, segStartMs));
        const endMs = Math.max(windowStartMs, Math.min(windowEndMs, segEndMs));
        const start = (startMs - windowStartMs) / MS_PER_HOUR;
        const end = (endMs - windowStartMs) / MS_PER_HOUR;
        return {
          status: seg.status,
          start,
          duration: end - start,
        };
      })
      // Drop segments that fall entirely outside the visible window — after
      // clamping they collapse to zero duration and would draw a stray bar.
      .filter((seg) => seg.duration > 0)

    result.push({machineId, machineName, segments: segment ?? []})
  }

  return result;
}

type MachineStatusDetail = {
  machine_id: number,
  status: MACHINE_STATUS,
}

export default function DashboardPage() {
  const now = useNowTicker(1000);
  const dateRange = useMemo(() => {
    if (!now) return { startDate: undefined, endDate: undefined };
    return {
      startDate: new Date(now - 86_400_000).toISOString().split('T')[0],
      endDate: new Date(now).toISOString().split('T')[0],
    };
  }, [now]);

  const { data: timelineData, isLoading: timelineLoading, refetch } = useStatusTimelineHook({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: machineData, isLoading: machineLoading } = useMachineHook();

  const isLoading = timelineLoading || machineLoading;

  const machines = useMemo<MachineStatusDetail[]>(() => {
    if (!timelineData?.data) return [];
    return timelineData.data.map((m) => ({
      machine_id: m.machineId,
      status: m.timeline[m.timeline.length - 1]?.status ?? MACHINE_STATUS.OFF,
    }));
  }, [timelineData]);

  // Seed last-seen status from the timeline so the first MQTT tick that
  // simply echoes the current state does not trigger a redundant refetch.
  const lastStatusRef = useRef<Map<string, MACHINE_STATUS>>(new Map());
  useEffect(() => {
    if (!timelineData?.data) return;
    for (const m of timelineData.data) {
      const last = m.timeline[m.timeline.length - 1];
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
      setup: by(MACHINE_STATUS.DANDORI),
      cyokotei: by(MACHINE_STATUS.CYOKOTEI),
      off: by(MACHINE_STATUS.OFF),
    };
  }, [machines]);

  const shift = useMemo(
    () => (now === null ? null : getShiftWindow(now)),
    [now],
  );

  const rows = useMemo<GanttRow[]>(() => {
    if (now === null || shift === null) return [];
    if (timelineData?.data && timelineData.data.length > 0) {
      return toGanttRows(timelineData.data, machineData?.data ?? [], now, shift.startMs);
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
  }, [timelineData, machineData, now, shift]);

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
            <CardTitle className="text-[20px] mb-2">Machine Activity Timeline</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading timeline…
            </p>
          ) : (
            <GanttBarChart
              rows={rows}
              totalUnits={SHIFT_HOURS}
              unitLabel="h"
              tickCount={TICKS}
              formatTick={(h) => formatClock((shift?.startHour ?? 0) + h, false)}
              formatClock={(h) => formatClock((shift?.startHour ?? 0) + h)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
