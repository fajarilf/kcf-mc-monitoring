"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDandoriReportHook } from "@/hooks/use-report";
import type { MonthlyValues } from "@/model/report-model";

const MONTHS: { key: keyof MonthlyValues; label: string }[] = [
  { key: "jan", label: "Jan" },
  { key: "feb", label: "Feb" },
  { key: "mar", label: "Mar" },
  { key: "apr", label: "Apr" },
  { key: "may", label: "May" },
  { key: "jun", label: "Jun" },
  { key: "jul", label: "Jul" },
  { key: "aug", label: "Aug" },
  { key: "sep", label: "Sep" },
  { key: "oct", label: "Oct" },
  { key: "nov", label: "Nov" },
  { key: "dec", label: "Dec" },
];

function formatValue(v: number | null): string {
  return v !== null ? String(v) : "-";
}

export default function MonthlyReportPage() {
  const { data, isLoading } = useDandoriReportHook();
  const operators = data?.data?.operators ?? [];
  const average = data?.data?.average;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Dandori Monthly Report</CardTitle>
          <CardDescription>
            Operator dandori performance by month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-card">
                    Operator Name
                  </TableHead>
                  {MONTHS.map((m) => (
                    <TableHead key={m.key} className="text-center">
                      {m.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-semibold">
                    Average
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={MONTHS.length + 2}
                      className="text-center text-muted-foreground"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : operators.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={MONTHS.length + 2}
                      className="text-center text-muted-foreground"
                    >
                      No data available.
                    </TableCell>
                  </TableRow>
                ) : (
                  operators.map((op) => (
                    <TableRow key={op.id}>
                      <TableCell className="sticky left-0 z-10 bg-card font-medium">
                        {op.name}
                      </TableCell>
                      {MONTHS.map((m) => (
                        <TableCell key={m.key} className="text-center tabular-nums">
                          {formatValue(op.months[m.key])}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold tabular-nums">
                        {formatValue(op.average)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {average && !isLoading && operators.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell className="sticky left-0 z-10 bg-card font-semibold">
                      Average
                    </TableCell>
                    {MONTHS.map((m) => (
                      <TableCell key={m.key} className="text-center font-semibold tabular-nums">
                        {formatValue(average[m.key])}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-bold tabular-nums">
                      {formatValue(average.overall)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
