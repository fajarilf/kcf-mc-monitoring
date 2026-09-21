"use client";

import { useMemo, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { useDandoriReportHook, useProductionRecordsHook } from "@/hooks/use-report";
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

function DandoriTab() {
  const { data, isLoading } = useDandoriReportHook();
  const operators = data?.data?.operators ?? [];
  const average = data?.data?.average;

  return (
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
  );
}

function AchievementsTab() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: prodData, isLoading: prodLoading } = useProductionRecordsHook({
    page,
    limit: pageSize,
    paginate: true,
  });

  const pagination = prodData?.pagination;

  const productionRows = useMemo(() => {
    const records = prodData?.data ?? [];
    return records.flatMap((record) =>
      record.operator.map((op) => ({
        date: record.date,
        machine: record.machine.code,
        itemNo: record.item.no,
        itemName: record.item.name,
        speedMinute: record.speed.minute,
        speedHour: record.speed.hour,
        operator: op.name,
        dandoriTime: record.times.dandori,
        runningTime: record.times.running,
        productQuantity: record.productQuantity,
        operatingRate: record.operatingRate,
      })),
    );
  }, [prodData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements Forging</CardTitle>
        <CardDescription>Production records</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead>Item No</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Speed (M)</TableHead>
                <TableHead className="text-right">Speed (H)</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead className="text-right">Dandori T.</TableHead>
                <TableHead className="text-right">Running T.</TableHead>
                <TableHead className="text-right">Product Qty</TableHead>
                <TableHead className="text-right">Operating Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prodLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : productionRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center text-muted-foreground"
                  >
                    No data available.
                  </TableCell>
                </TableRow>
              ) : (
                productionRows.map((row, i) => (
                  <TableRow key={`${row.date}-${row.machine}-${row.operator}-${i}`}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.machine}</TableCell>
                    <TableCell>{row.itemNo}</TableCell>
                    <TableCell>{row.itemName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.speedMinute}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.speedHour}
                    </TableCell>
                    <TableCell>{row.operator}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.dandoriTime}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.runningTime}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.productQuantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.operatingRate}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {pagination && (
          <div className="mt-4">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MonthlyReportPage() {
  const [activeTab, setActiveTab] = useState("dandori");

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line">
          <TabsTrigger value="dandori">Dandori Monthly Report</TabsTrigger>
          <TabsTrigger value="achievements">Achievements Forging</TabsTrigger>
        </TabsList>
        {activeTab === "dandori" && (
          <TabsContent value="dandori">
            <DandoriTab />
          </TabsContent>
        )}
        {activeTab === "achievements" && (
          <TabsContent value="achievements">
            <AchievementsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
