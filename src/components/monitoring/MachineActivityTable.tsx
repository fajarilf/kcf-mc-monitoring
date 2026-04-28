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
  activityPeriodHours,
  getMachineSegments,
  type ActivityPeriod,
} from "@/lib/mock-data";
import { statusColorClass, statusLabel } from "@/lib/status";

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

  const events = useMemo(() => {
    if (now === null) return [];
    const totalHours = activityPeriodHours[period];
    const segments = getMachineSegments(machineId, period);
    const anchor = now - totalHours * HOUR_MS;
    return segments
      .map((seg) => {
        const start = new Date(anchor + seg.start * HOUR_MS);
        const end = new Date(anchor + (seg.start + seg.duration) * HOUR_MS);
        return {
          start,
          end,
          duration: seg.duration,
          status: seg.status,
        };
      })
      .reverse();
  }, [machineId, period, now]);

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
