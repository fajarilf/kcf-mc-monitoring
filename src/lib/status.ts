export enum MACHINE_STATUS {
  OFF,
  RUNNING,
  CYOKOTEI_STOP,
  DANDORI,
  SETUP,
}

export const statusLabel: Record<MACHINE_STATUS, string> = {
  [MACHINE_STATUS.OFF]: "Off",
  [MACHINE_STATUS.RUNNING]: "Running",
  [MACHINE_STATUS.CYOKOTEI_STOP]: "Cyokotei Stop",
  [MACHINE_STATUS.DANDORI]: "Dandori",
  [MACHINE_STATUS.SETUP]: "Setup",
};

export const statusColorClass: Record<MACHINE_STATUS, string> = {
  [MACHINE_STATUS.OFF]:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
  [MACHINE_STATUS.RUNNING]:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  [MACHINE_STATUS.CYOKOTEI_STOP]:
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
  [MACHINE_STATUS.DANDORI]:
    "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
  [MACHINE_STATUS.SETUP]:
    "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-500/30",
};

export const statusFillHex: Record<MACHINE_STATUS, string> = {
  [MACHINE_STATUS.OFF]: "#000000", // hitam (black)
  [MACHINE_STATUS.RUNNING]: "#10b981", // hijau (green)
  [MACHINE_STATUS.CYOKOTEI_STOP]: "#f43f5e", // merah (red)
  [MACHINE_STATUS.DANDORI]: "#f97316", // oranye (orange)
  [MACHINE_STATUS.SETUP]: "#6b7280", // gray
};

export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

export function formatHMS(totalSeconds: number): string {
  if (!totalSeconds) return "--:--:--";

  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}
