import type { MachineStatus } from "@/lib/mock-data";

export const statusLabel: Record<MachineStatus, string> = {
  active: "Active",
  idle: "Idle",
  inactive: "Inactive",
};

export const statusColorClass: Record<MachineStatus, string> = {
  active:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  idle:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  inactive:
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
};

export const statusFillHex: Record<MachineStatus, string> = {
  active: "#10b981",
  idle: "#f59e0b",
  inactive: "#f43f5e",
};

export function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}
