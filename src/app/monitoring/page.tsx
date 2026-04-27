"use client";

import { MachineCard } from "@/components/monitoring/MachineCard";
import { machines } from "@/lib/mock-data";

export default function MonitoringPage() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {machines.map((m) => (
        <MachineCard key={m.id} machine={m} />
      ))}
    </div>
  );
}
