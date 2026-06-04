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
import {
  type ActivityPeriod,
} from "@/lib/mock-data";
import { statusColorClass, statusLabel } from "@/lib/status";
import { useStatusTimelineByIdHook } from "@/hooks/use-status-hook";
import { helper } from "@/lib/helper";

interface Props {
  machineId: string;
  period: ActivityPeriod;
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

export function MachineActivityTable({ machineId, period }: Props) {
  const now = useMountedNow();

  const dateRange = useMemo<Date[]>(() => {
    return helper.generateDateRange(period);
  }, [period]);

  const { data } = useStatusTimelineByIdHook(parseInt(machineId), {
    startDate: dateRange[0]?.toISOString().split("T")[0] ?? "",
    endDate: dateRange[dateRange.length - 1]?.toISOString().split("T")[0] ?? "",
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
