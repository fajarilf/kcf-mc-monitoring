"use client";

import { MachineListTable } from "@/components/machine/MachineListTable";

export default function ListMachinePage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold">Machine List</h2>
        <p className="text-sm text-muted-foreground">
          View and update machine details.
        </p>
      </div>
      <MachineListTable />
    </div>
  );
}
