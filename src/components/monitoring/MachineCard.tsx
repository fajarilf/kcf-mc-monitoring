"use client";

import { useEffect, useState } from "react";
import { Package, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Machine } from "@/lib/mock-data";
import {
  formatHMS,
  MACHINE_STATUS,
  statusColorClass,
  statusLabel,
} from "@/lib/status";

const statusAccent: Record<
  MACHINE_STATUS,
  { ring: string; glow: string; dot: string; bar: string }
> = {
  [MACHINE_STATUS.RUNNING]: {
    ring: "ring-emerald-500/30 dark:ring-emerald-400/30",
    glow: "from-emerald-500/10",
    dot: "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]",
    bar: "bg-emerald-500",
  },
  [MACHINE_STATUS.SETUP]: {
    ring: "ring-amber-500/30 dark:ring-amber-400/30",
    glow: "from-amber-500/10",
    dot: "bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.18)]",
    bar: "bg-amber-500",
  },
  [MACHINE_STATUS.CYOKOTEI_STOP]: {
    ring: "ring-rose-500/30 dark:ring-rose-400/30",
    glow: "from-rose-500/10",
    dot: "bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.18)]",
    bar: "bg-rose-500",
  },
  [MACHINE_STATUS.OFF]: {
    ring: "ring-slate-500/30 dark:ring-slate-400/30",
    glow: "from-slate-500/10",
    dot: "bg-slate-500 shadow-[0_0_0_3px_rgba(100,116,139,0.18)]",
    bar: "bg-slate-500",
  },
};

export function MachineCard({ machine }: { machine: Machine }) {
  const isRunning = machine.status === MACHINE_STATUS.RUNNING;
  const [seconds, setSeconds] = useState(machine.elapsedSeconds);
  const accent = statusAccent[machine.status];

  useEffect(() => {
    // if (!isRunning) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col overflow-hidden ring-1 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg",
        accent.ring,
      )}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1.5", accent.bar)}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-linear-to-br to-transparent opacity-60",
          accent.glow,
        )}
      />
      <CardHeader className="relative flex flex-row items-start justify-between gap-2 pl-5">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block size-2 rounded-full animate-pulse",
                accent.dot,
              )}
            />
            <CardTitle className="text-base">{machine.name}</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">{machine.id}</span>
        </div>
        <Badge
          variant="outline"
          className={cn("border", statusColorClass[machine.status])}
        >
          {statusLabel[machine.status]}
        </Badge>
      </CardHeader>
      <CardContent className="relative flex flex-1 flex-col gap-4 pl-5">
        <div className="flex gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="size-4 shrink-0" />
            <span className="truncate">
              <span className="text-foreground">
                {machine.currentProduct || "-"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="size-4 shrink-0" />
            <span className="truncate">
              <span className="text-foreground">
                {machine.operators[0]}
              </span>
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-muted/40 p-3 text-center backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Run Time
          </div>
          <div
            className={cn(
              "font-mono text-2xl font-semibold tracking-wider tabular-nums text-foreground",
              // isRunning ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {formatHMS(seconds)}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Products</span>
          <span className="font-semibold tabular-nums">
            {machine.productCount}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
