"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import type { GanttRow } from "@/lib/mock-data";
import {
  MACHINE_STATUS,
  statusFillHex,
  statusLabel,
  withAlpha,
} from "@/lib/status";

interface Props {
  rows: GanttRow[];
  totalUnits: number;
  unitLabel: string;
  tickCount?: number;
  formatTick?: (n: number) => string;
  formatClock?: (unit: number) => string;
}

export const GanttBarChart = memo(function GanttBarChart({
  rows,
  totalUnits,
  unitLabel,
  tickCount = 6,
  formatTick,
  formatClock,
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

  const height = useMemo(() => Math.max(260, rows.length * 48), [rows.length]);

  const [hover, setHover] = useState<{
    label: string;
    statusLabel: string;
    start: number;
    end: number;
    x: number;
    y: number;
  } | null>(null);

  const tooltipText = useMemo(() => {
    if (!hover) return "";
    const dur = (hover.end - hover.start).toFixed(1);
    if (formatClock) {
      return `${hover.label} • ${hover.statusLabel} • ${formatClock(hover.start)} → ${formatClock(hover.end)} (${dur}${unitLabel})`;
    }
    return `${hover.label} • ${hover.statusLabel} • ${dur}${unitLabel}`;
  }, [hover, formatClock, unitLabel]);

  return (
    <div className="w-full">
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
              className="inline-block size-3 rounded-sm"
              style={{ backgroundColor: statusFillHex[s] }}
            />
            <span className="text-muted-foreground">{statusLabel[s]}</span>
          </div>
        ))}
      </div>
      <div style={{ height }} className="relative flex w-full select-none">
        <div
          className="flex flex-col shrink-0 pr-2 text-right"
          style={{ color: tickColor, fontSize: 12 }}
        >
          {rows.map((r) => (
            <div
              key={r.machineId}
              className="flex items-center"
              style={{ height: 48 }}
            >
              {r.machineName}
            </div>
          ))}
        </div>
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
                    top: -20,
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
          {rows.map((row) => (
            <div
              key={row.machineId}
              className="relative"
              style={{ height: 48 }}
            >
              {row.segments.map((seg, si) => {
                const leftPct = (seg.start / totalUnits) * 100;
                const widthPct = (seg.duration / totalUnits) * 100;
                const bgColor = withAlpha(statusFillHex[seg.status], 0.7);
                return (
                  <div
                    key={si}
                    className="absolute top-1 bottom-1 rounded-sm cursor-default"
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
                        x: rect.left - container.left,
                        y: rect.top - container.top,
                      });
                    }}
                    onMouseLeave={() => setHover(null)}
                  >
                    <div
                      className="invisible absolute inset-0 rounded-sm ring-1 ring-white/20 group-hover:visible"
                    />
                  </div>
                );
              })}
            </div>
          ))}
          {hover && (
            <div
              className="pointer-events-none absolute z-50 rounded-md border px-3 py-2 text-xs shadow-md whitespace-nowrap"
              style={{
                left: hover.x,
                top: hover.y - 8,
                transform: "translate(-50%, -100%)",
                backgroundColor: tooltipBg,
                color: tooltipFg,
                borderColor: gridColor,
              }}
            >
              {tooltipText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
