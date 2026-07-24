"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import {
  Card,
  CardContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { useMachineHook } from "@/hooks/use-machine";
import { useAlarmHistoryHook } from "@/hooks/use-alarm";
import type {
  AlarmHistory,
  AlarmHistoryParams,
  AlarmStatus,
} from "@/model/alarm-model";

const ALL = "all";

const STATUS_OPTIONS: AlarmStatus[] = ["triggered", "recovered"];

const statusStyle: Record<
  AlarmStatus,
  { label: string; dot: string; badge: string }
> = {
  triggered: {
    label: "Triggered",
    dot: "bg-rose-500",
    badge:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
  },
  recovered: {
    label: "Recovered",
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  },
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDuration(trigger: string, recover: string | null): string {
  if (!recover) return "Ongoing";
  const ms = new Date(recover).getTime() - new Date(trigger).getTime();
  if (ms < 0) return "—";
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function StatusPill({ status }: { status: AlarmStatus }) {
  const s = statusStyle[status] ?? statusStyle.triggered;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        s.badge,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          s.dot,
          status === "triggered" && "animate-pulse",
        )}
      />
      {s.label}
    </span>
  );
}

export default function HistoryPage() {
  const [machineId, setMachineId] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: machineList } = useMachineHook();

  const params = useMemo<AlarmHistoryParams>(() => {
    const p: AlarmHistoryParams = { page, limit: pageSize, paginate: true };
    if (machineId !== ALL) p.machineId = Number(machineId);
    if (status !== ALL) p.status = status as AlarmStatus;
    if (startDate) p.startDate = startDate;
    if (endDate) p.endDate = endDate;
    return p;
  }, [machineId, status, startDate, endDate, page, pageSize]);

  const { data, isLoading, isFetching } = useAlarmHistoryHook(params);

  const rows: AlarmHistory[] = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? rows.length;

  const hasFilters =
    machineId !== ALL || status !== ALL || startDate !== "" || endDate !== "";

  // Any filter change resets to the first page.
  function handleSelect(setter: (v: string) => void) {
    return (value: string | null) => {
      setter(value ?? ALL);
      setPage(1);
    };
  }

  function handleDate(setter: (v: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  function resetFilters() {
    setMachineId(ALL);
    setStatus(ALL);
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-2xl font-semibold">
            Alarm History
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Review when machine alarms were triggered and when they recovered.
        </p>
      </div>

      <Card className="overflow-hidden">
        {/* Filter toolbar */}
        <div className="flex flex-col gap-4 border-b bg-muted/30 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Machine</Label>
              <Select
                value={machineId}
                onValueChange={handleSelect(setMachineId)}
              >
                <SelectTrigger className="h-9 rounded-md bg-background">
                  <SelectValue placeholder="All machines">
                    {(value) =>
                      !value || value === ALL
                        ? "All machines"
                        : machineList?.data.find(
                            (m) => String(m.id) === String(value),
                          )?.name ?? "All machines"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-md" alignItemWithTrigger={false}>
                  <SelectItem value={ALL}>All machines</SelectItem>
                  {machineList?.data.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={handleSelect(setStatus)}>
                <SelectTrigger className="h-9 rounded-md bg-background">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="rounded-md" alignItemWithTrigger={false}>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusStyle[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                Start date
              </Label>
              <Input
                id="startDate"
                type="date"
                className="h-9 bg-background"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => handleDate(setStartDate)(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                End date
              </Label>
              <Input
                id="endDate"
                type="date"
                className="h-9 bg-background"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => handleDate(setEndDate)(e.target.value)}
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            disabled={!hasFilters}
            className="shrink-0 self-start lg:self-end"
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>

        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {total} record{total === 1 ? "" : "s"} found
          </CardTitle>
          {isFetching && !isLoading && (
            <span className="text-xs text-muted-foreground">Updating…</span>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Machine</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Triggered</TableHead>
                  <TableHead>Recovered</TableHead>
                  <TableHead className="pr-6 text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      <TableCell colSpan={6} className="px-6 py-3">
                        <div className="h-5 w-full animate-pulse rounded bg-muted" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="size-8 opacity-30" />
                        <p className="text-sm font-medium">No alarms found</p>
                        <p className="text-xs">
                          Try adjusting your filters or date range.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id} className="group">
                      <TableCell className="pl-6 font-medium">
                        {row.machineName}
                      </TableCell>
                      <TableCell>
                        <StatusPill status={row.status} />
                      </TableCell>
                      <TableCell
                        className="max-w-xs truncate text-muted-foreground"
                        title={row.message}
                      >
                        {row.message || "—"}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatDateTime(row.triggerTime)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatDateTime(row.recoverTime)}
                      </TableCell>
                      <TableCell className="pr-6 text-right font-medium tabular-nums">
                        {formatDuration(row.triggerTime, row.recoverTime)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            total={total}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
