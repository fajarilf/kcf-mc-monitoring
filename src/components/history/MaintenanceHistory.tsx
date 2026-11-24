"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
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
import { useMachineHook } from "@/hooks/use-machine";
import { useMaintenanceHistoryHook } from "@/hooks/use-maintenance";
import { MACHINE_STATUS, statusColorClass, statusLabel } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { MaintenanceHistoryParams } from "@/model/maintenance-model";

const ALL = "all";
const STATUS_OPTIONS = Object.values(MACHINE_STATUS).filter(
  (value): value is MACHINE_STATUS => typeof value === "number",
);

function formatMaintenanceDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const totalSeconds = Math.floor(seconds);
  return `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;
}

export function MaintenanceHistory() {
  const [machineId, setMachineId] = useState(ALL);
  const [code, setCode] = useState(ALL);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data: machineList } = useMachineHook();

  const params = useMemo<MaintenanceHistoryParams>(() => {
    const filters: MaintenanceHistoryParams = { page, limit: pageSize, paginate: true };
    if (machineId !== ALL) filters.machineId = Number(machineId);
    if (code !== ALL) filters.code = Number(code) as MACHINE_STATUS;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    return filters;
  }, [machineId, code, startDate, endDate, page, pageSize]);

  const { data, isLoading, isFetching, isError } = useMaintenanceHistoryHook(params);
  const rows = data?.data ?? [];
  const total = data?.pagination?.total ?? rows.length;
  const hasFilters = machineId !== ALL || code !== ALL || startDate !== "" || endDate !== "";

  function handleSelect(setter: (value: string) => void) {
    return (value: string | null) => {
      setter(value ?? ALL);
      setPage(1);
    };
  }

  function handleDate(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function resetFilters() {
    setMachineId(ALL);
    setCode(ALL);
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  return (
    <section className="flex flex-col gap-6" aria-labelledby="maintenance-history-title">
      <div className="flex flex-col gap-1">
        <h2 id="maintenance-history-title" className="text-2xl font-semibold">
          Maintenance History
        </h2>
        <p className="text-sm text-muted-foreground">
          Review machine maintenance activity, operators, and durations.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b bg-muted/30 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-1.5">
              <Label htmlFor="maintenance-machine" className="text-xs text-muted-foreground">
                Machine
              </Label>
              <Select value={machineId} onValueChange={handleSelect(setMachineId)}>
                <SelectTrigger id="maintenance-machine" className="h-9 rounded-md bg-background">
                  <SelectValue placeholder="All machines">
                    {(value) =>
                      !value || value === ALL
                        ? "All machines"
                        : machineList?.data.find((machine) => String(machine.id) === String(value))?.name ?? "All machines"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-md" alignItemWithTrigger={false}>
                  <SelectItem value={ALL}>All machines</SelectItem>
                  {machineList?.data.map((machine) => (
                    <SelectItem key={machine.id} value={String(machine.id)}>
                      {machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="maintenance-status" className="text-xs text-muted-foreground">
                Status
              </Label>
              <Select value={code} onValueChange={handleSelect(setCode)}>
                <SelectTrigger id="maintenance-status" className="h-9 rounded-md bg-background">
                  <SelectValue placeholder="All statuses">
                    {(value) => !value || value === ALL
                      ? "All statuses"
                      : statusLabel[Number(value) as MACHINE_STATUS]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-md" alignItemWithTrigger={false}>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={String(status)}>
                      {statusLabel[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="maintenance-start-date" className="text-xs text-muted-foreground">
                Start date
              </Label>
              <Input
                id="maintenance-start-date"
                type="date"
                className="h-9 bg-background"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => handleDate(setStartDate, event.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="maintenance-end-date" className="text-xs text-muted-foreground">
                End date
              </Label>
              <Input
                id="maintenance-end-date"
                type="date"
                className="h-9 bg-background"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => handleDate(setEndDate, event.target.value)}
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
                  <TableHead>Operator</TableHead>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Part No</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="pr-6">Maintenance Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: Math.min(pageSize, 10) }).map((_, index) => (
                    <TableRow key={index} className="hover:bg-transparent">
                      <TableCell colSpan={7} className="px-6 py-3">
                        <div className="h-5 w-full animate-pulse rounded bg-muted" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center text-destructive" role="alert">
                      Failed to load maintenance history. Please try again.
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="size-8 opacity-30" />
                        <p className="text-sm font-medium">No maintenance records found</p>
                        <p className="text-xs">Try adjusting your filters or date range.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="pl-6 font-medium">{row.machineName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("border", statusColorClass[row.code])}>
                          {statusLabel[row.code] ?? "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.userName || "—"}</TableCell>
                      <TableCell>{row.productPartName || "—"}</TableCell>
                      <TableCell>{row.productPartNo || "—"}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatMaintenanceDuration(row.duration)}
                      </TableCell>
                      <TableCell className="min-w-48 max-w-sm whitespace-normal pr-6 text-muted-foreground">
                        {row.maintenanceDetails.length > 0 ? (
                          <ul className="space-y-2">
                            {row.maintenanceDetails.map((detail) => (
                              <li key={detail.id}>
                                <span className="font-medium text-foreground">
                                  {detail.maintenanceOperatorName || "—"}
                                </span>
                                {" — "}{detail.reason || "—"}
                              </li>
                            ))}
                          </ul>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={page}
            totalPages={data?.pagination?.totalPages ?? 1}
            onPageChange={setPage}
            total={total}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>
    </section>
  );
}
