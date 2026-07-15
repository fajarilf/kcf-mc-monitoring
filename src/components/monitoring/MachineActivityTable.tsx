"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useMountedNow } from "@/hooks/use-mounted-now";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { statusColorClass, statusLabel } from "@/lib/status";
import { useStatusTimelineByIdHook } from "@/hooks/use-status-hook";
import { MachineActivityTableSkeleton } from "./Skeleton";

interface Props {
  machineId: string;
  startDate: string;
  endDate: string;
}

const HOUR_MS = 60 * 60 * 1000;

function formatDateTime(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function MachineActivityTable({ machineId, startDate, endDate }: Props) {
  const now = useMountedNow();

  const { data, isLoading } = useStatusTimelineByIdHook(parseInt(machineId), {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const events = useMemo(() => {
    if (!data?.data || now === null) return [];
    const dataMachine = data.data;
    const segments = dataMachine.timeline.map((seg) => {
      const start = new Date(seg.start);
      const end = seg.end ? new Date(seg.end) : new Date();
      return {
        start,
        end,
        duration: (new Date(end).getTime() - new Date(start).getTime()) / HOUR_MS,
        status: seg.status,
      };
    })
    return segments.reverse();
  }, [data?.data, now]);

  if (isLoading) {
    return <MachineActivityTableSkeleton/>
  }

  return (
    <div className="max-h-105 overflow-y-auto rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                No activity recorded for this period.
              </TableCell>
            </TableRow>
          ) : (
            events.map((e, i) => (
              <TableRow key={i}>
                <TableCell className="tabular-nums">
                  {formatDateTime(e.start)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatDateTime(e.end)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatDuration(e.duration)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("border", statusColorClass[e.status])}
                  >
                    {statusLabel[e.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}