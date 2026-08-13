"use client";

import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import type { GanttRow } from "@/lib/mock-data";
import {
  MACHINE_STATUS,
  statusFillHex,
  statusLabel,
  withAlpha,
} from "@/lib/status";
import { useStatusTimelineLatestProductHook } from "@/hooks/use-status-hook";

interface Props {
  rows: GanttRow[];
  totalUnits: number;
  unitLabel: string;
  tickCount?: number;
  formatTick?: (n: number) => string;
  formatClock?: (unit: number) => string;
  hideLabels?: boolean;
  hideLegend?: boolean;
  rowHeight?: number;
  machineId?: string;
  nowMs?: number;
}

export const GanttBarChart = memo(function GanttBarChart({
  rows,
  totalUnits,
  unitLabel,
  tickCount = 6,
  formatTick,
  formatClock,
  hideLabels = false,
  hideLegend = false,
  rowHeight,
  machineId,
  nowMs,
}: Props) {
  const stepSize = Math.max(1, Math.round(totalUnits / tickCount));
  const ticks = useMemo(() => {
    const arr: number[] = [];
    for (let v = 0; v <= totalUnits; v += stepSize) arr.push(v);
    return arr;
  }, [totalUnits, stepSize]);

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const tickColor = isDark ? "rgb(203, 213, 225)" : "rgb(71, 85, 105)";
  const gridColor = isDark
    ? "rgba(148, 163, 184, 0.12)"
    : "rgba(100, 116, 139, 0.15)";
  const tooltipBg = isDark
    ? "rgba(15, 23, 42, 0.95)"
    : "rgba(255, 255, 255, 0.98)";
  const tooltipFg = isDark ? "rgb(241, 245, 249)" : "rgb(15, 23, 42)";

  const rowH = rowHeight ?? 48;
  const height = useMemo(
    () => Math.max(rows.length > 1 ? 260 : rowH, rows.length * rowH) + 24,
    [rows.length, rowH],
  );

  const { data: latestProductData } = useStatusTimelineLatestProductHook(
    machineId ? { machineId: Number(machineId), paginate: false } : { paginate: false },
  );

  const runningPcts = useMemo(() => {
    const fallbackNow = nowMs ?? new Date().getTime();
    const latestMap = new Map<string, { runningMin: number; totalMin: number }>();
    for (const m of latestProductData?.data ?? []) {
      let runningMin = 0;
      let totalMin = 0;
      for (const g of m.production) {
        for (const seg of g.timeline) {
          if (seg.status === MACHINE_STATUS.DANDORI || seg.status === MACHINE_STATUS.OFF) continue;
          const startMs = new Date(seg.start).getTime();
          const endMs = seg.end ? new Date(seg.end).getTime() : fallbackNow;
          const minutes = (endMs - startMs) / 60_000;
          if (minutes <= 0) continue;
          totalMin += minutes;
          if (seg.status === MACHINE_STATUS.RUNNING) runningMin += minutes;
        }
      }
      latestMap.set(String(m.machineId), { runningMin, totalMin });
    }

    return rows.map((r) => {
      const data = latestMap.get(r.machineId);
      if (!data || data.totalMin === 0) return 0;
      return (data.runningMin / data.totalMin) * 100;
    });
  }, [rows, latestProductData, nowMs]);

  const rowEnds = useMemo(
    () =>
      rows.map((r) => {
        if (r.segments.length === 0) return 0;
        return Math.max(...r.segments.map((s) => s.start + s.duration));
      }),
    [rows],
  );

  const [hover, setHover] = useState<{
    label: string;
    statusLabel: string;
    start: number;
    end: number;
    userName: string | null;
    productPartNo: string | null;
    x: number;
    y: number;
    containerWidth: number;
  } | null>(null);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [clampedX, setClampedX] = useState(0);

  useLayoutEffect(() => {
    if (!hover || !tooltipRef.current) return;
    const halfW = tooltipRef.current.offsetWidth / 2;
    const x = Math.max(halfW, Math.min(hover.x, hover.containerWidth - halfW));
    setClampedX(x);
  }, [hover]);

  const tooltipText = useMemo(() => {
    if (!hover) return "";
    const dur = (hover.end - hover.start).toFixed(1);
    if (formatClock) {
      return `${hover.label} • ${hover.statusLabel} • ${formatClock(hover.start)} → ${formatClock(hover.end)} (${dur}${unitLabel})`;
    }
    return `${hover.label} • ${hover.statusLabel} • ${dur}${unitLabel}`;
  }, [hover, formatClock, unitLabel]);

  return (
    <div className="w-full pe-6">
      {!hideLegend && (
        <div className="mb-3 flex flex-wrap gap-4 text-xs">
          {[
            MACHINE_STATUS.OFF,
            MACHINE_STATUS.RUNNING,
            MACHINE_STATUS.CYOKOTEI_STOP,
            MACHINE_STATUS.DANDORI,
            MACHINE_STATUS.SETUP,
          ].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className="inline-block size-3 rounded-none"
                style={{ backgroundColor: statusFillHex[s] }}
              />
              <span className="text-muted-foreground">{statusLabel[s]}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ height }} className="relative flex w-full select-none pb-6">
        {!hideLabels && (
          <div
            className="flex flex-col shrink-0 pr-2 text-right"
            style={{ color: tickColor, fontSize: 12 }}
          >
            {rows.map((r) => (
              <div
                key={r.machineId}
                className="flex items-center"
                style={{ height: rowH }}
              >
                {r.machineName}
              </div>
            ))}
          </div>
        )}
        <div className="relative flex-1">
          {ticks.map((t) => {
            const leftPct = (t / totalUnits) * 100;
            return (
              <div
                key={t}
                className="absolute top-0 bottom-0"
                style={{
                  left: `${leftPct}%`,
                  width: 1,
                  background: gridColor,
                }}
              >
                <span
                  className="absolute -translate-x-1/2 whitespace-nowrap"
                  style={{
                    bottom: -20,
                    left: 0,
                    color: tickColor,
                    fontSize: 12,
                  }}
                >
                  {formatTick ? formatTick(t) : `${t}${unitLabel}`}
                </span>
              </div>
            );
          })}
          {rows.map((row, i) => (
            <div
              key={row.machineId}
              className="relative"
              style={{ height: rowH }}
            >
              {(() => {
                const leftPct = (rowEnds[i] / totalUnits) * 100;
                const nearEdge = leftPct >= 90;
                const pct = runningPcts[i];
                if (pct <= 0) return null;
                return (
                  <span
                    className="absolute top-1/2 -translate-y-1/2 z-10 font-semibold whitespace-nowrap rounded px-1"
                    style={{
                      fontSize: 16,
                      ...(nearEdge
                        ? { right: 4 }
                        : { left: `calc(${leftPct}% + 4px)` }),
                      color: runningPcts[i] >= 85
                        ? statusFillHex[MACHINE_STATUS.RUNNING]
                        : runningPcts[i] >= 60
                          ? "#eab308"
                          : "#f43f5e",
                      backgroundColor: isDark
                        ? "rgba(15, 23, 42, 0.7)"
                        : "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    {runningPcts[i].toFixed(1)}%
                  </span>
                );
              })()}
              {row.segments.map((seg, si) => {
                const leftPct = (seg.start / totalUnits) * 100;
                const widthPct = (seg.duration / totalUnits) * 100;
                const bgColor = withAlpha(statusFillHex[seg.status], 0.7);
                return (
                  <div
                    key={si}
                    className="absolute top-3 bottom-3 rounded-none cursor-default"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: bgColor,
                    }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const container = e.currentTarget
                        .closest(".relative.flex.w-full")!
                        .getBoundingClientRect();
                      setHover({
                        label: row.machineName,
                        statusLabel: statusLabel[seg.status],
                        start: seg.start,
                        end: seg.start + seg.duration,
                        userName: seg.userName ?? null,
                        productPartNo: seg.productPartNo ?? null,
                        x: rect.left - container.left,
                        y: rect.top - container.top,
                        containerWidth: container.width,
                      });
                    }}
                    onMouseLeave={() => setHover(null)}
                  >
                    <div
                      className="invisible absolute inset-0 rounded-none ring-1 ring-white/20 group-hover:visible"
                    />
                  </div>
                );
              })}
            </div>
          ))}
          {hover && (
            <div
              ref={tooltipRef}
              className="pointer-events-none absolute z-50 rounded-md border px-3 py-2 text-xs shadow-md whitespace-nowrap"
              style={{
                left: clampedX,
                top: hover.y - 8,
                transform: "translate(-50%, -100%)",
                backgroundColor: tooltipBg,
                color: tooltipFg,
                borderColor: gridColor,
              }}
            >
              <div>activity: {tooltipText}</div>
              <div>operator: {hover.userName ?? "-"}</div>
              <div>part number: {hover.productPartNo ?? "-"}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
