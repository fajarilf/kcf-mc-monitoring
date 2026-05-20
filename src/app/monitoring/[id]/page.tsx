"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Hash, Package, User as UserIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  activityPeriodLabel,
  machines,
  type ActivityPeriod,
} from "@/lib/mock-data";
import { formatHMS, statusColorClass, statusLabel } from "@/lib/status";
import { MachineActivityChart } from "@/components/monitoring/MachineActivityChart";
import { MachineActivityTable } from "@/components/monitoring/MachineActivityTable";

const PERIODS: ActivityPeriod[] = ["lastThreeDays", "lastWeek", "lastMonth"];

const accentBar: Record<string, string> = {
  active: "bg-emerald-500",
  idle: "bg-amber-500",
  inactive: "bg-rose-500",
};

const accentDot: Record<string, string> = {
  active: "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]",
  idle: "bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.18)]",
  inactive: "bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.18)]",
};

export default function MachineDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const machineId = params.id;
  const machine = useMemo(
    () => machines.find((m) => m.id === machineId),
    [machineId],
  );

  const [period, setPeriod] = useState<ActivityPeriod>("lastWeek");
  const [seconds, setSeconds] = useState(machine?.elapsedSeconds ?? 0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeconds(machine?.elapsedSeconds ?? 0);
  }, [machine?.id, machine?.elapsedSeconds]);

  // const isRunning = machine?.status === "active";
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!machine) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-medium">Machine not found</p>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find a machine with id{" "}
          <span className="font-mono">{machineId}</span>.
        </p>
        <Button render={<Link href="/monitoring" />} variant="outline">
          <ArrowLeft className="size-4" />
          Back to monitoring
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            render={<Link href="/monitoring" />}
            size="icon"
            variant="ghost"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="text-sm text-muted-foreground">
            Viewing details for
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Machine</span>
          <Select
            value={machine.id}
            onValueChange={(id) => router.push(`/monitoring/${id}`)}
          >
            <SelectTrigger className="w-40 rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-sm h-40" alignItemWithTrigger={false}>
              {machines.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} · {m.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="relative overflow-hidden ring-1 ring-border/60">
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 w-1.5",
            accentBar[machine.status],
          )}
        />
        <CardHeader className="pl-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-block size-2.5 rounded-full animate-pulse",
                    accentDot[machine.status],
                    // isRunning && "animate-pulse",
                  )}
                />
                <CardTitle className="text-2xl">{machine.name}</CardTitle>
              </div>
              <CardDescription className="font-mono">
                {machine.id}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={cn("border", statusColorClass[machine.status])}
            >
              {statusLabel[machine.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pl-6 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            icon={<Package className="size-4" />}
            label="Current Product"
            value={machine.currentProduct || "-"}
          />
          <Metric
            icon={<UserIcon className="size-4" />}
            label="Operator"
            value={machine.operators[0]}
          />
          <Metric
            icon={<Hash className="size-4" />}
            label="Products"
            value={machine.productCount.toLocaleString()}
            mono
          />
          <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Run Time
            </div>
            <div
              className={cn(
                "font-mono text-2xl font-semibold tracking-wider tabular-nums",
              )}
            >
              {formatHMS(seconds)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Activity</CardTitle>
            <CardDescription>
              Hours per day by status across the selected period
            </CardDescription>
          </div>
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as ActivityPeriod)}
          >
            <SelectTrigger className="w-40 rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-sm" alignItemWithTrigger={false}>
              {PERIODS.map((p) => (
                <SelectItem key={p} value={p}>
                  {activityPeriodLabel[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <MachineActivityChart machineId={machine.id} period={period} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Most recent events first · {activityPeriodLabel[period]}
          </CardDescription>
          <Separator className="mt-2" />
        </CardHeader>
        <CardContent>
          <MachineActivityTable machineId={machine.id} period={period} />
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "mt-1 truncate text-base font-medium",
          mono && "font-mono tabular-nums",
        )}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}
