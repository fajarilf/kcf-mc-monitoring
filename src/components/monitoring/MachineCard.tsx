"use client";

import { useState } from "react";
import { Package, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatHMS,
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

export function MachineCard({ machine }: { machine: MachineData }) {
  const [seconds, setSeconds] = useState<number>(0);
  const [cardDetail, setCardDetail] = useState<MachineInformation>();
  const [accent, setAccent] = useState(statusAccent[MACHINE_STATUS.OFF]);

  // useMqttSubscription(`MACHINE${machine.id}`, (data) => {
  //   console.log(`mqtt: ${data.payload}`)
  // })

  useMqttJson<MqttResponses>(`MACHINE${machine.id}`, (data) => {
    if (data?.Machine) {
      const { OPERATORNAME, WORKNAME, PRODUCTCOUNTER, TIMECOUNTER, STATUS } = data.Machine;
      setCardDetail({
        operator: OPERATORNAME,
        product: WORKNAME,
        counter_product: PRODUCTCOUNTER,
        timer_elapsed: TIMECOUNTER,
        status: STATUS,
      });
      setSeconds(TIMECOUNTER);
      setAccent(statusAccent[STATUS]);
    }

    // console.log(`mqtt: ${data}`)
  })

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col overflow-hidden ring-1 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg",
        accent.ring,
      )}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1.5", accent.bar)}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-linear-to-br to-transparent opacity-60",
          accent.glow,
        )}
      />
      <CardHeader className="relative flex flex-row items-start justify-between gap-2 pl-5">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block size-2 rounded-full animate-pulse",
                accent.dot,
              )}
            />
            <CardTitle className="text-base">{machine.name}</CardTitle>
          </div>
          {/* <span className="text-xs text-muted-foreground">{machine.id}</span> */}
        </div>
        <Badge
          variant="outline"
          className={cn("border", statusColorClass[cardDetail?.status ?? MACHINE_STATUS.OFF])}
        >
          {statusLabel[cardDetail?.status ?? MACHINE_STATUS.OFF]}
        </Badge>
      </CardHeader>
      <CardContent className="relative flex flex-1 flex-col gap-4 pl-5">
        <div className="flex-row gap-4 text-sm">
          <div className="flex-row items-center gap-2 text-muted-foreground">
            <span className="flex gap-2 font-bold items-center">
              <Package className="size-4 shrink-0" /> 
              Work Name
            </span>
            <span className="truncate ml-6">
              <span className="text-foreground py-1 px-2">
                {cardDetail?.product || "-"}
              </span>
            </span>
          </div>
          <div className="flex-row items-center gap-2 text-muted-foreground">
            <span className="flex gap-2 font-bold items-center">
              <User className="size-4 shrink-0" /> 
              Worker / Operator
            </span>
            <span className="truncate ml-6">
              <span className="text-foreground py-1 px-2">
                {cardDetail?.operator || "-"}
              </span>
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-muted/40 p-3 text-center backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            TIME
          </div>
          <div
            className={cn(
              "font-mono text-2xl font-semibold tracking-wider tabular-nums text-foreground",
              // isRunning ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {formatHMS(seconds)}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Products</span>
          <span className="font-semibold tabular-nums">
            {cardDetail?.counter_product || "-"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
