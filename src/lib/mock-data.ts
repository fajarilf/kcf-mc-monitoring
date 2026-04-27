export type MachineStatus = "active" | "idle" | "inactive";

export interface Machine {
  id: string;
  name: string;
  status: MachineStatus;
  currentProduct: string;
  operator: string;
  elapsedSeconds: number;
  productCount: number;
}

export const machines: Machine[] = [
  {
    id: "M001",
    name: "Machine A",
    status: "active",
    currentProduct: "Bracket Type-X",
    operator: "Budi Santoso",
    elapsedSeconds: 3600,
    productCount: 142,
  },
  {
    id: "M002",
    name: "Machine B",
    status: "active",
    currentProduct: "Plate Y-200",
    operator: "Siti Rahma",
    elapsedSeconds: 1820,
    productCount: 88,
  },
  {
    id: "M003",
    name: "Machine C",
    status: "idle",
    currentProduct: "Shaft Z-12",
    operator: "Andi Wijaya",
    elapsedSeconds: 540,
    productCount: 36,
  },
  {
    id: "M004",
    name: "Machine D",
    status: "inactive",
    currentProduct: "-",
    operator: "-",
    elapsedSeconds: 0,
    productCount: 0,
  },
  {
    id: "M005",
    name: "Machine E",
    status: "active",
    currentProduct: "Gear G-08",
    operator: "Dewi Lestari",
    elapsedSeconds: 7320,
    productCount: 305,
  },
  {
    id: "M006",
    name: "Machine F",
    status: "idle",
    currentProduct: "Housing H-04",
    operator: "Rizky Pratama",
    elapsedSeconds: 240,
    productCount: 12,
  },
  {
    id: "M007",
    name: "Machine G",
    status: "active",
    currentProduct: "Cover C-15",
    operator: "Lina Marlina",
    elapsedSeconds: 980,
    productCount: 47,
  },
  {
    id: "M008",
    name: "Machine H",
    status: "inactive",
    currentProduct: "-",
    operator: "-",
    elapsedSeconds: 0,
    productCount: 0,
  },
  {
    id: "M009",
    name: "Machine I",
    status: "active",
    currentProduct: "Frame F-22",
    operator: "Tono Setiawan",
    elapsedSeconds: 4200,
    productCount: 191,
  },
  {
    id: "M010",
    name: "Machine J",
    status: "idle",
    currentProduct: "Hinge HN-3",
    operator: "Maya Putri",
    elapsedSeconds: 120,
    productCount: 8,
  },
];

export interface GanttSegment {
  status: MachineStatus;
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
  const statuses: MachineStatus[] = [
    "active",
    "active",
    "idle",
    "active",
    "inactive",
    "active",
    "idle",
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
  lastWeek: GanttRow[];
  lastMonth: GanttRow[];
} = {
  today: buildRows(24, 1),
  lastWeek: buildRows(7 * 24, 3),
  lastMonth: buildRows(30 * 24, 5),
};

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
