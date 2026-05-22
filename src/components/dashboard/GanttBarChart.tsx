"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useTheme } from "next-themes";
import type { GanttRow } from "@/lib/mock-data";
import {
  MACHINE_STATUS,
  statusFillHex,
  statusLabel,
  withAlpha,
} from "@/lib/status";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Props {
  rows: GanttRow[];
  totalUnits: number;
  unitLabel: string;
  tickCount?: number;
  formatTick?: (n: number) => string;
  formatClock?: (unit: number) => string;
}

type FloatBar = [number, number] | null;

export function GanttBarChart({
  rows,
  totalUnits,
  unitLabel,
  tickCount = 6,
  formatTick,
  formatClock,
}: Props) {
  const { data, segLabelsByDataset } = useMemo(() => {
    const labels = rows.map((r) => r.machineName);
    const maxSegments = rows.reduce(
      (m, r) => Math.max(m, r.segments.length),
      0,
    );

    const segLabelsByDataset: string[][] = [];

    const datasets = Array.from({ length: maxSegments }, (_, slot) => {
      const slotData: FloatBar[] = rows.map((r) => {
        const seg = r.segments[slot];
        return seg ? [seg.start, seg.start + seg.duration] : null;
      });
      const backgroundColor = rows.map((r) => {
        const seg = r.segments[slot];
        return seg ? withAlpha(statusFillHex[seg.status], 0.70) : "rgba(0,0,0,0)";
      });
      segLabelsByDataset.push(
        rows.map((r) => {
          const seg = r.segments[slot];
          return seg ? statusLabel[seg.status] : "";
        }),
      );
      return {
        label: `slot-${slot}`,
        data: slotData as unknown as number[],
        backgroundColor,
        borderWidth: 0,
        borderSkipped: false as const,
        grouped: false,
        barPercentage: 0.85,
        categoryPercentage: 0.8,
      };
    });

    return {
      data: { labels, datasets } as ChartData<"bar">,
      segLabelsByDataset,
    };
  }, [rows]);

  const stepSize = Math.max(1, Math.round(totalUnits / tickCount));

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipFg,
        bodyColor: tooltipFg,
        borderColor: gridColor,
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: () => "",
          label: (ctx) => {
            const raw = ctx.raw as FloatBar;
            if (!raw) return "";
            const machine = ctx.label;
            const status =
              segLabelsByDataset[ctx.datasetIndex]?.[ctx.dataIndex] ?? "";
            const dur = (raw[1] - raw[0]).toFixed(1);
            if (formatClock) {
              return `${machine} • ${status} • ${formatClock(raw[0])} → ${formatClock(raw[1])} (${dur}${unitLabel})`;
            }
            return `${machine} • ${status} • ${dur}${unitLabel}`;
          },
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: totalUnits,
        ticks: {
          stepSize,
          color: tickColor,
          callback: (value) =>
            formatTick ? formatTick(Number(value)) : `${value}${unitLabel}`,
          autoSkip: false,
          maxRotation: 0,
        },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
      y: {
        grid: { display: false },
        ticks: { autoSkip: false, color: tickColor },
        border: { color: gridColor },
      },
    },
  };

  const height = Math.max(260, rows.length * 48);

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap gap-4 text-xs">
        {[
          MACHINE_STATUS.OFF,
          MACHINE_STATUS.RUNNING,
          MACHINE_STATUS.CYOKOTEI_STOP,
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
      <div style={{ height }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
