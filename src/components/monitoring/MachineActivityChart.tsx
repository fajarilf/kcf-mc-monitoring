"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useTheme } from "next-themes";
import {
  activityPeriodHours,
  getDailyHoursByStatus,
  type ActivityPeriod,
  type MachineStatus,
} from "@/lib/mock-data";
import { statusFillHex, statusLabel, withAlpha } from "@/lib/status";
import { useMountedNow } from "@/hooks/use-mounted-now";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

interface Props {
  machineId: string;
  period: ActivityPeriod;
}

const STATUSES: MachineStatus[] = ["active", "idle", "inactive"];

export function MachineActivityChart({ machineId, period }: Props) {
  const { resolvedTheme } = useTheme();
  const now = useMountedNow();
  const mounted = now !== null;
  const isDark = mounted && resolvedTheme === "dark";

  const tickColor = isDark ? "rgb(203, 213, 225)" : "rgb(71, 85, 105)";
  const gridColor = isDark
    ? "rgba(148, 163, 184, 0.12)"
    : "rgba(100, 116, 139, 0.15)";
  const tooltipBg = isDark
    ? "rgba(15, 23, 42, 0.95)"
    : "rgba(255, 255, 255, 0.98)";
  const tooltipFg = isDark ? "rgb(241, 245, 249)" : "rgb(15, 23, 42)";
  const legendColor = isDark ? "rgb(226, 232, 240)" : "rgb(30, 41, 59)";

  const data = useMemo(() => {
    const hoursByStatus = getDailyHoursByStatus(machineId, period);
    const totalHours = activityPeriodHours[period];
    const days = Math.ceil(totalHours / 24);
    const anchor = now ?? 0;
    const labels = Array.from({ length: days }, (_, i) => {
      const d = new Date(anchor);
      d.setDate(d.getDate() - (days - 1 - i));
      return now === null
        ? ""
        : d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
    });

    const datasets = STATUSES.map((status) => {
      const color = statusFillHex[status];

      return {
        label: statusLabel[status],
        data: hoursByStatus[status],
        borderColor: color,
        backgroundColor: withAlpha(color, 0.18),
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: color,
        borderWidth: 2,
      };
    });

    return { labels, datasets } as ChartData<"line">;
  }, [machineId, period, now]);

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "end",
        labels: {
          color: legendColor,
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipFg,
        bodyColor: tooltipFg,
        borderColor: gridColor,
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${(ctx.parsed.y as number).toFixed(1)} h`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: tickColor, autoSkip: true, maxRotation: 0 },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
      y: {
        min: 0,
        max: 24,
        ticks: {
          color: tickColor,
          stepSize: 4,
          callback: (v) => `${v}h`,
        },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
    },
  };

  return (
    <div className="h-70 w-full">
      <Line data={data} options={options} />
    </div>
  );
}