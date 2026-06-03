"use client";

import Link from "next/link";
import { MachineCard, MachineCardSkeleton } from "@/components/monitoring/MachineCard";
import { useMachineHook } from "@/hooks/use-machine";

export default function MonitoringPage() {
  const { data, isLoading, isError, error, } = useMachineHook()

  if (isError) {
    return (
      <p className="py-12 text-center text-sm text-destructive">
        {error?.message ?? "Failed to load machines."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {isLoading
        ? <MachineCardSkeleton />
        : data?.data.map((m) => (
            <Link
              key={m.id}
              href={`/monitoring/${m.id}`}
              aria-label={`View details for ${m.name}`}
              className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MachineCard machine={m} />
            </Link>
          ))}
    </div>
  );
}