import { MACHINE_STATUS } from "@/lib/status";

export interface Machine {
  id: string;
  name: string;
  status: MACHINE_STATUS;
  currentProduct: string;
  operators: string[];
  elapsedSeconds: number;
  productCount: number;
}

export const machines: Machine[] = [
  {
    id: "M001",
    name: "Machine A",
    status: MACHINE_STATUS.RUNNING,
    currentProduct: "Bracket Type-X",
    operators: ["Budi Santoso", "Siti Rahma"],
    elapsedSeconds: 3600,
    productCount: 142,
  },
  {
    id: "M002",
    name: "Machine B",
    status: MACHINE_STATUS.RUNNING,
    currentProduct: "Plate Y-200",
    operators: ["Siti Rahma", "Andi Wijaya", "Dewi Lestari"],
    elapsedSeconds: 1820,
    productCount: 88,
  },
  {
    id: "M003",
    name: "Machine C",
    status: MACHINE_STATUS.DANDORI,
    currentProduct: "Shaft Z-12",
    operators: ["Andi Wijaya", "Rizky Pratama"],
    elapsedSeconds: 540,
    productCount: 36,
  },
  {
    id: "M004",
    name: "Machine D",
    status: MACHINE_STATUS.OFF,
    currentProduct: "-",
    operators: ["Lina Marlina", "Tono Setiawan"],
    elapsedSeconds: 0,
    productCount: 0,
  },
  {
    id: "M005",
    name: "Machine E",
    status: MACHINE_STATUS.RUNNING,
    currentProduct: "Gear G-08",
    operators: ["Dewi Lestari", "Maya Putri", "Budi Santoso"],
    elapsedSeconds: 7320,
    productCount: 305,
  },
  {
    id: "M006",
    name: "Machine F",
    status: MACHINE_STATUS.CYOKOTEI,
    currentProduct: "Housing H-04",
    operators: ["Rizky Pratama", "Lina Marlina"],
    elapsedSeconds: 240,
    productCount: 12,
  },
  {
    id: "M007",
    name: "Machine G",
    status: MACHINE_STATUS.RUNNING,
    currentProduct: "Cover C-15",
    operators: ["Lina Marlina", "Tono Setiawan"],
    elapsedSeconds: 980,
    productCount: 47,
  },
  {
    id: "M008",
    name: "Machine H",
    status: MACHINE_STATUS.OFF,
    currentProduct: "-",
    operators: ["Tono Setiawan", "Maya Putri"],
    elapsedSeconds: 0,
    productCount: 0,
  },
  {
    id: "M009",
    name: "Machine I",
    status: MACHINE_STATUS.RUNNING,
    currentProduct: "Frame F-22",
    operators: ["Tono Setiawan", "Andi Wijaya", "Maya Putri"],
    elapsedSeconds: 4200,
    productCount: 191,
  },
  {
    id: "M010",
    name: "Machine J",
    status: MACHINE_STATUS.CYOKOTEI,
    currentProduct: "Hinge HN-3",
    operators: ["Maya Putri", "Budi Santoso"],
    elapsedSeconds: 120,
    productCount: 8,
  },
];

export interface GanttSegment {
  status: MACHINE_STATUS;
  start: number; // hours from beginning of period (0-based)
  duration: number; // hours
}

export interface GanttRow {
  machineId: string;
  machineName: string;
  segments: GanttSegment[];
}

function buildSegments(totalHours: number, seed: number): GanttSegment[] {
  const segments: GanttSegment[] = [];
  let cursor = 0;
  let i = 0;
  const statuses: MACHINE_STATUS[] = [
    MACHINE_STATUS.RUNNING,
    MACHINE_STATUS.RUNNING,
    MACHINE_STATUS.DANDORI,
    MACHINE_STATUS.RUNNING,
    MACHINE_STATUS.OFF,
    MACHINE_STATUS.RUNNING,
    MACHINE_STATUS.CYOKOTEI,
  ];
  while (cursor < totalHours) {
    const remaining = totalHours - cursor;
    const dur = Math.min(remaining, 0.5 + ((seed * (i + 1)) % 7) * 0.4);
    segments.push({
      status: statuses[(seed + i) % statuses.length],
      start: cursor,
      duration: dur,
    });
    cursor += dur;
    i++;
  }
  return segments;
}

function buildRows(totalHours: number, seedOffset: number): GanttRow[] {
  return machines.map((m, idx) => ({
    machineId: m.id,
    machineName: m.name,
    segments: buildSegments(totalHours, idx + seedOffset),
  }));
}

export const ganttData: {
  today: GanttRow[];
  lastThreeDays: GanttRow[];
  lastWeek: GanttRow[];
  lastMonth: GanttRow[];
} = {
  today: buildRows(24, 1),
  lastThreeDays: buildRows(3 * 24, 7),
  lastWeek: buildRows(7 * 24, 3),
  lastMonth: buildRows(30 * 24, 5),
};

export type ActivityPeriod = "lastThreeDays" | "lastWeek" | "lastMonth";

export const activityPeriodHours: Record<ActivityPeriod, number> = {
  lastThreeDays: 3 * 24,
  lastWeek: 7 * 24,
  lastMonth: 30 * 24,
};

export const activityPeriodLabel: Record<ActivityPeriod, string> = {
  lastThreeDays: "Last 3 Days",
  lastWeek: "Last Week",
  lastMonth: "Last Month",
};

export function getMachineSegments(
  machineId: string,
  period: ActivityPeriod,
): GanttSegment[] {
  const row = ganttData[period].find((r) => r.machineId === machineId);
  return row?.segments ?? [];
}

export function getDailyHoursByStatus(
  machineId: string,
  period: ActivityPeriod,
): Record<MACHINE_STATUS, number[]> {
  const totalHours = activityPeriodHours[period];
  const segments = getMachineSegments(machineId, period);
  const days = Math.ceil(totalHours / 24);
  const result: Record<MACHINE_STATUS, number[]> = {
    [MACHINE_STATUS.OFF]: new Array(days).fill(0) as number[],
    [MACHINE_STATUS.RUNNING]: new Array(days).fill(0) as number[],
    [MACHINE_STATUS.CYOKOTEI]: new Array(days).fill(0) as number[],
    [MACHINE_STATUS.DANDORI]: new Array(days).fill(0) as number[],
    [MACHINE_STATUS.SETUP]: new Array(days).fill(0) as number[],
  };
  for (const seg of segments) {
    let s = seg.start;
    const e = seg.start + seg.duration;
    while (s < e) {
      const day = Math.min(days - 1, Math.floor(s / 24));
      const dayEnd = (day + 1) * 24;
      const portion = Math.min(e, dayEnd) - s;
      result[seg.status][day] += portion;
      s += portion;
    }
  }
  return result;
}

export function getDailyActiveHours(
  machineId: string,
  period: ActivityPeriod,
): number[] {
  return getDailyHoursByStatus(machineId, period)[MACHINE_STATUS.RUNNING];
}

export type UserStatus = "pending" | "approved" | "rejected";
export type UserRole = "admin" | "user";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  registeredAt: string;
}

export const initialUsers: AppUser[] = [
  {
    id: "U001",
    name: "Admin KCF",
    email: "admin@kcf.com",
    password: "admin123",
    role: "admin",
    status: "approved",
    registeredAt: "2024-01-01T08:00:00Z",
  },
  {
    id: "U002",
    name: "John Doe",
    email: "john@kcf.com",
    password: "user123",
    role: "user",
    status: "pending",
    registeredAt: "2024-06-15T10:30:00Z",
  },
  {
    id: "U003",
    name: "Jane Smith",
    email: "jane@kcf.com",
    password: "user123",
    role: "user",
    status: "pending",
    registeredAt: "2024-07-02T14:20:00Z",
  },
  {
    id: "U004",
    name: "Ahmad Fauzi",
    email: "ahmad@kcf.com",
    password: "user123",
    role: "user",
    status: "approved",
    registeredAt: "2024-04-10T09:00:00Z",
  },
  {
    id: "U005",
    name: "Rina Kartika",
    email: "rina@kcf.com",
    password: "user123",
    role: "user",
    status: "rejected",
    registeredAt: "2024-05-22T11:45:00Z",
  },
];
