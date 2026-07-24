"use client";

import { useState } from "react";
import { Package, User, Hash } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MACHINE_STATUS,
  statusColorClass,
  statusLabel,
} from "@/lib/status";
import { MachineData, MachineInformation } from "@/model/machine-model";
import { useMqttJson } from "@/hooks/use-mqtt";
import { MqttResponses } from "@/types/mqtt-responses";

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
  [MACHINE_STATUS.DANDORI]: {
    ring: "ring-orange-500/30 dark:ring-orange-400/30",
    glow: "from-orange-500/10",
    dot: "bg-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.18)]",
    bar: "bg-orange-500",
  },
  [MACHINE_STATUS.CYOKOTEI_STOP]: {
    ring: "ring-rose-500/30 dark:ring-rose-400/30",
    glow: "from-rose-500/10",
    dot: "bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.18)]",
    bar: "bg-rose-500",
  },
  [MACHINE_STATUS.OFF]: {
    ring: "ring-black/30 dark:ring-white/30",
    glow: "from-black/10",
    dot: "bg-black shadow-[0_0_0_3px_rgba(0,0,0,0.18)]",
    bar: "bg-black",
  },
  [MACHINE_STATUS.SETUP]: {
    ring: "ring-gray-500/30 dark:ring-gray-400/30",
    glow: "from-gray-500/10",
    dot: "bg-gray-500 shadow-[0_0_0_3px_rgba(107,114,128,0.18)]",
    bar: "bg-gray-500",
  },
};

export function MachineCardCompact({ machine }: { machine: MachineData }) {
  const [cardDetail, setCardDetail] = useState<MachineInformation>();
  const [accent, setAccent] = useState(statusAccent[MACHINE_STATUS.OFF]);

  useMqttJson<MqttResponses>(`MACHINE${machine.id}`, (data) => {
    if (data?.Machine) {
      const { OPERATORNAME, WORKNAME, PRODUCTCOUNTER, STATUS } = data.Machine;
      setCardDetail({
        operator: OPERATORNAME?.replace(/^-+|-+$/g, ""),
        product: WORKNAME,
        counter_product: PRODUCTCOUNTER,
        timer_elapsed: 0,
        status: STATUS,
      });
      setAccent(statusAccent[STATUS]);
    }
  });

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col overflow-hidden ring-1 transition-all duration-200 py-1",
        "hover:-translate-y-0.5 hover:shadow-lg",
        accent.ring,
      )}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", accent.bar)}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-linear-to-br to-transparent opacity-60",
          accent.glow,
        )}
      />
      <CardHeader className="relative flex flex-row items-start justify-between gap-2 px-3 pt-2.5 pb-0">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-block size-1.5 rounded-full animate-pulse",
              accent.dot,
            )}
          />
          <CardTitle className="text-sm">{machine.name}</CardTitle>
        </div>
        <Badge
          variant="outline"
          className={cn("border text-[10px] px-1.5 py-0", statusColorClass[cardDetail?.status ?? MACHINE_STATUS.OFF])}
        >
          {statusLabel[cardDetail?.status ?? MACHINE_STATUS.OFF]}
        </Badge>
      </CardHeader>
      <CardContent className="relative flex flex-1 flex-col gap-1.5 px-3 pt-1 pb-2.5">
        <div className="flex items-center gap-2 text-lg text-muted-foreground">
          <Package className="size-6 shrink-0" />
          <span className="truncate">
            {cardDetail?.product || "-"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-lg text-muted-foreground">
          <User className="size-6 shrink-0" />
          <span className="truncate">
            {cardDetail?.operator || "-"}
          </span>
        </div>
        <div className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hash className="size-6 shrink-0" />
            <span>Products</span>
          </div>
          <span className="font-semibold tabular-nums">
            {cardDetail?.counter_product?.toLocaleString() || "-"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
