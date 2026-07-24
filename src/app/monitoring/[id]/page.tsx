"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Hash, Loader2, Package, User as UserIcon, X, FileChartLineIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  formatHMS,
  MACHINE_STATUS,
  statusColorClass,
  statusLabel,
} from "@/lib/status";
import { MachineTimelineGantt } from "@/components/monitoring/MachineTimelineGantt";
import { MachineActivityTable } from "@/components/monitoring/MachineActivityTable";
import { useMachineByIdHook, useMachineHook } from "@/hooks/use-machine";
import { MachineInformation } from "@/model/machine-model";
import { useMqttJson } from "@/hooks/use-mqtt";
import { MqttResponses } from "@/types/mqtt-responses";
import { MachineDetailSkeleton } from "@/components/monitoring/Skeleton";
import { ExportPreview } from "@/components/monitoring/ExportPreview";
import { FillTemplateData } from "@/lib/template/fill-template";
import { useStatusTimelineByIdHook } from "@/hooks/use-status-hook";
import { useProductHook } from "@/hooks/use-product";
import type { ProductionGroup } from "@/model/status-model";
import type { ProductData } from "@/model/product-model";

const accentBar: Record<MACHINE_STATUS, string> = {
  [MACHINE_STATUS.OFF]: "bg-black",
  [MACHINE_STATUS.RUNNING]: "bg-emerald-500",
  [MACHINE_STATUS.CYOKOTEI_STOP]: "bg-rose-500",
  [MACHINE_STATUS.DANDORI]: "bg-orange-500",
  [MACHINE_STATUS.SETUP]: "bg-gray-500",
};

const accentDot: Record<MACHINE_STATUS, string> = {
  [MACHINE_STATUS.OFF]: "bg-black shadow-[0_0_0_3px_rgba(0,0,0,0.18)]",
  [MACHINE_STATUS.RUNNING]:
    "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]",
  [MACHINE_STATUS.CYOKOTEI_STOP]:
    "bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.18)]",
  [MACHINE_STATUS.DANDORI]:
    "bg-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.18)]",
  [MACHINE_STATUS.SETUP]:
    "bg-gray-500 shadow-[0_0_0_3px_rgba(107,114,128,0.18)]",
};

export default function MachineDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const machineId = params.id;
  const { data: machineData, isLoading: machineIdLoading, isError } = useMachineByIdHook(Number(machineId));
  const { data: machineList, isLoading: machineLoading } = useMachineHook();
  const [machineInfo, setMachineInfo] = useState<MachineInformation>();
  const [startDate, setStartDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const timelineParams = useMemo(
    () => ({ startDate, endDate }),
    [startDate, endDate],
  );
  const { data: timelineData } = useStatusTimelineByIdHook(
    Number(machineId),
    timelineParams,
  );
  const { data: productData } = useProductHook({ paginate: false });

  const [seconds, setSeconds] = useState(0);

  const [selectedPartNo, setSelectedPartNo] = useState<string | null>(null);

  // Excel preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<FillTemplateData[] | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const machine = machineData?.data;
  const timerBase = machineInfo?.timer_elapsed ?? 0;
  const prefTimerBase = useRef<number>(timerBase);
  const isLoading = machineIdLoading && machineLoading;

  useMqttJson<MqttResponses>(
    machine ? `MACHINE${machine?.id}` : null,
    (data) => {
      if (data?.Machine) {
        const { OPERATORNAME, WORKNAME, PRODUCTCOUNTER, TIMECOUNTER, STATUS } = data.Machine;
        setMachineInfo({
          operator: OPERATORNAME,
          product: WORKNAME,
          counter_product: PRODUCTCOUNTER,
          timer_elapsed: TIMECOUNTER,
          status: STATUS,
        });
        setSeconds(TIMECOUNTER);
      }
    })

  if (timerBase !== prefTimerBase.current) {
    setSeconds(timerBase);
    prefTimerBase.current = timerBase;
  }

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  function findMachineAndRedirect(name: string) {
    const selected = machineList?.data.find((m) => m.name === name);
    if (selected) {
      router.push(`/monitoring/${selected.id}`);
    }
  }

  function toDateString(iso: string): string {
    return iso.slice(0, 10);
  }

  function toTimeString(iso: string): string {
    return iso.slice(11, 16);
  }

  function durationMinutes(startIso: string, endIso: string | null): number {
    const start = new Date(startIso).getTime();
    const end = endIso ? new Date(endIso).getTime() : Date.now();
    return Math.round((end - start) / 60_000);
  }

  function buildRequestBodies(): FillTemplateData[] {
    let groups: ProductionGroup[] = timelineData?.data?.production ?? [];
    if (groups.length === 0) return [];

    if (selectedPartNo) groups = groups.filter((g) => g.partNo === selectedPartNo);
    if (groups.length === 0) return [];

    const machineName = machine?.name ?? "";
    const products: ProductData[] = productData?.data ?? [];

    const dandoriSegments = groups.flatMap((g) =>
      g.timeline.filter((s) => {
        if (s.status !== MACHINE_STATUS.DANDORI) return false;
        const endMs = s.end ? new Date(s.end).getTime() : Date.now();
        return endMs - new Date(s.start).getTime() >= 60_000;
      }),
    );
    const dandoriEntries = dandoriSegments.map((seg) => ({
      DandoriDate: toDateString(seg.start),
      DandoriStart: toTimeString(seg.start),
      DandoriEnd: seg.end ? toTimeString(seg.end) : toTimeString(new Date().toISOString()),
      DandoriDuration: durationMinutes(seg.start, seg.end),
    }));

    const problemEntries = groups.flatMap((g) =>
      g.timeline
        .filter((s) => {
          if (s.status !== MACHINE_STATUS.CYOKOTEI_STOP) return false;
          const endMs = s.end ? new Date(s.end).getTime() : Date.now();
          return endMs - new Date(s.start).getTime() >= 60_000;
        })
        .map((seg) => ({
          ProblemDate: toDateString(seg.start),
          ProblemStart: toTimeString(seg.start),
          ProblemEnd: seg.end ? toTimeString(seg.end) : toTimeString(new Date().toISOString()),
          ProblemDuration: durationMinutes(seg.start, seg.end),
          ProblemPIC: g.user || "-",
        })),
    );

    // Group production groups by partNo so multiple operators on the same
    // product end up in a single worksheet instead of duplicate sheets.
    const grouped = new Map<string, ProductionGroup[]>();
    for (const group of groups) {
      const key = group.partNo || "-";
      const arr = grouped.get(key);
      if (arr) arr.push(group);
      else grouped.set(key, [group]);
    }

    const result: FillTemplateData[] = [];

    for (const [partNo, mergedGroups] of grouped) {
      const product = products.find((p) => p.partNo === partNo);

      // Collect distinct operators across all merged groups
      const operators = [
        ...new Set(mergedGroups.map((g) => g.user).filter(Boolean)),
      ].join(", ") || "-";

      // Build production entries from all merged groups
      const productionEntries = mergedGroups.flatMap((group) =>
        group.timeline
          .filter((s) => {
            if (s.status === MACHINE_STATUS.DANDORI) return false;
            if (s.status === MACHINE_STATUS.CYOKOTEI_STOP) return false;
            const endMs = s.end ? new Date(s.end).getTime() : Date.now();
            return endMs - new Date(s.start).getTime() >= 60_000;
          })
          .map((seg) => ({
            ProductionDate: toDateString(seg.start),
            ProductionStart: toTimeString(seg.start),
            ProductionEnd: seg.end ? toTimeString(seg.end) : toTimeString(new Date().toISOString()),
            ProductionDuration: durationMinutes(seg.start, seg.end),
            Status: statusLabel[seg.status],
            ProductionPIC: group.user || "-",
          })),
      );

      const totalProduction = productionEntries.reduce(
        (sum, p) => sum + p.ProductionDuration,
        0,
      );

      // Sum quantity across all merged groups for the same product
      const totalCounterProduct = mergedGroups.reduce(
        (sum, g) => sum + g.quantity,
        0,
      );

      const rpm = product?.rpm ?? 60;
      const sumOfBottom = Number(rpm) * totalProduction;
      const resultValue = sumOfBottom > 0
        ? ((totalCounterProduct / sumOfBottom) * 100).toFixed(2)
        : "0";

      result.push({
        header: {
          Date: startDate === endDate ? startDate : `${startDate} ~ ${endDate}`,
          PartNo: partNo === "-" ? (product?.partNo ?? mergedGroups[0]?.partNo ?? "-") : partNo,
          PartName: product?.partName ?? mergedGroups[0]?.productName ?? "-",
          Customer: product?.customer ?? "-",
          Operators: operators,
          MachineName: machineName,
          Rpm: rpm.toString(),
          TotalCounterProduct: totalCounterProduct.toString(),
          SumofBottom: sumOfBottom.toString(),
          Result: resultValue,
        },
        dandori: dandoriEntries,
        production: productionEntries,
        problem: problemEntries,
        totalProduction,
      });
    }

    return result;
  }

  function handleExportClick() {
    const bodies = buildRequestBodies();
    setPreviewData(bodies);
    setDownloadError(null);
    setPreviewOpen(true);
  }

  async function handleDownload() {
    if (!previewData || previewData.length === 0) return;

    setDownloadLoading(true);
    setDownloadError(null);

    try {
      const response = await fetch('/api/export-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Export failed: ${errorText}`);
      }

      const blob = await response.blob();
      const dateStr = new Date().toISOString().split('T')[0];
      const machineName = machine?.name ?? "";
      const filename = `report-${machineName}-${dateStr}.xlsx`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setPreviewOpen(false);
    } catch (err) {
      console.error("Export download failed:", err);
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadLoading(false);
    }
  }

  if (isLoading) {
    return <MachineDetailSkeleton />;
  }

  if (!machineData?.data || isError) {
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

        <Button
          className="rounded-sm"
          variant="outline"
          aria-label="export"
          onClick={handleExportClick}
        >
          <FileChartLineIcon className="size-4"/> Generate Report
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Machine</span>
          <Select
            value={machine?.name}
            onValueChange={(value) => findMachineAndRedirect(String(value))}
          >
            <SelectTrigger className="w-40 rounded-sm">
              <SelectValue placeholder="Select machine" />
            </SelectTrigger>
            <SelectContent className="rounded-sm h-40" alignItemWithTrigger={false}>
              {machineList?.data.map((m) => (
                <SelectItem key={m.id} value={m.name}>
                  {m.name}
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
            accentBar[machineInfo?.status || MACHINE_STATUS.OFF],
          )}
        />
        <CardHeader className="pl-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-block size-2.5 rounded-full animate-pulse",
                    accentDot[machineInfo?.status || MACHINE_STATUS.OFF],
                  )}
                />
                <CardTitle className="text-2xl">{machine?.name}</CardTitle>
              </div>
              <CardDescription className="font-mono">
                {machine?.id}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={cn("border", statusColorClass[machineInfo?.status || MACHINE_STATUS.OFF])}
            >
              {statusLabel[machineInfo?.status || MACHINE_STATUS.OFF]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pl-6 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            icon={<Package className="size-4" />}
            label="Current Product"
            value={machineInfo?.product || "-"}
          />
          <Metric
            icon={<UserIcon className="size-4" />}
            label="Operator"
            value={machineInfo?.operator || "-"}
          />
          <Metric
            icon={<Hash className="size-4" />}
            label="Products"
            value={machineInfo?.counter_product?.toLocaleString() ?? "-"}
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
              Activity timeline for the selected period
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="h-9 w-auto bg-background rounded-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              className="h-9 w-auto bg-background rounded-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <MachineTimelineGantt machineId={machineId} startDate={startDate} endDate={endDate} selectedPartNo={selectedPartNo} onSelectedPartNoChange={setSelectedPartNo} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Most recent events first · {startDate === endDate
              ? new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : `${new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
            }
          </CardDescription>
          <Separator className="mt-2" />
        </CardHeader>
        <CardContent>
          <MachineActivityTable machineId={machineId} startDate={startDate} endDate={endDate} />
        </CardContent>
      </Card>

      {/* Excel Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between w-full">
              <span>Report Preview</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close"
              >
                <X />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto min-h-0 rounded-md border bg-white">
            {previewData && <ExportPreview data={previewData} />}
          </div>

          <DialogFooter>
            {downloadError && (
              <p className="text-xs text-destructive mr-auto">{downloadError}</p>
            )}
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={downloadLoading}
            >
              {downloadLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              {downloadLoading ? "Generating" : "Download"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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