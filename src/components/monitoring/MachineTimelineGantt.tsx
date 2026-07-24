"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { GanttBarChart } from "@/components/dashboard/GanttBarChart";
import { type GanttRow, type GanttSegment } from "@/lib/mock-data";
import type { MachineTimeline } from "@/model/status-model";
import { useStatusTimelineByIdHook } from "@/hooks/use-status-hook";
import { useNowTicker } from "@/hooks/use-mounted-now";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { useUsersHook } from "@/hooks/use-user-hook";
import type { UserData } from "@/model/user-model";
import type { ProductData } from "@/model/product-model";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { MachineActivityChartSkeleton } from "./Skeleton";

const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_DAY = 24 * MS_PER_HOUR;

function formatClock(h: number, addSecond: boolean = true): string {
  const wrapped = ((h % 24) + 24) % 24;
  const hh = Math.floor(wrapped);
  const remaining = (wrapped - hh) * 60;
  const mm = Math.floor(remaining);
  const ss = Math.round((remaining - mm) * 60);

  return addSecond
    ? `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
    : `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function toSingleGanttRow(
  data: MachineTimeline | undefined,
  machineId: string,
  nowMs: number,
  windowStartMs: number,
  windowHours: number,
  productPartNoFilter?: string,
): GanttRow {
  const windowEndMs = windowStartMs + windowHours * MS_PER_HOUR;

  const groups = data?.production ?? [];
  const filtered = productPartNoFilter
    ? groups.filter((g) => g.partNo === productPartNoFilter)
    : groups;

  const segments: GanttSegment[] = filtered.flatMap((group) =>
    group.timeline.map((seg) => {
      const segStartMs = new Date(seg.start).getTime();
      const segEndMs = seg.end ? new Date(seg.end).getTime() : nowMs;
      const startMs = Math.max(
        windowStartMs,
        Math.min(windowEndMs, segStartMs),
      );
      const endMs = Math.max(
        windowStartMs,
        Math.min(windowEndMs, segEndMs),
      );
      const start = (startMs - windowStartMs) / MS_PER_HOUR;
      const end = (endMs - windowStartMs) / MS_PER_HOUR;
      return {
        status: seg.status,
        start,
        duration: end - start,
        userName: group.user,
        productPartNo: group.partNo,
      };
    }),
  ).filter((seg) => seg.duration > 0);

  return {
    machineId,
    machineName: data?.machineName?.toUpperCase() ?? machineId,
    segments,
  };
}

interface Props {
  machineId: string;
  startDate: string;
  endDate: string;
}

export function MachineTimelineGantt({ machineId, startDate, endDate }: Props) {
  const now = useNowTicker(1000);
  const chartNow = useMemo(
    () => (now === null ? null : Math.floor(now / 30_000) * 30_000),
    [now],
  );

  const [user, setUser] = useState<UserData | null>();
  const [product, setProduct] = useState<ProductData | null>();
  const [searchUser, setSearchUser] = useState<string>();

  const userInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearchUser = useDebouncedValue(searchUser);

  const { data: userData } = useUsersHook({ search: debouncedSearchUser });

  const userList: UserData[] = [
    { id: 0, name: "All User", role: "" },
    ...(userData?.data ?? []),
  ];

  const days = useMemo(() => {
    const start = new Date(startDate + "T00:00:00").getTime();
    const end = new Date(endDate + "T00:00:00").getTime();
    return Math.max(1, Math.round((end - start) / MS_PER_DAY) + 1);
  }, [startDate, endDate]);

  const windowHours = days * 24;

  const fetchStartDate = useMemo(() => {
    const d = new Date(startDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }, [startDate]);

  const { data: timelineData, isLoading } = useStatusTimelineByIdHook(
    parseInt(machineId),
    {
      startDate: fetchStartDate,
      endDate,
      userId: user?.id,
    },
  );

  const productList: ProductData[] = useMemo(() => {
    const groups = timelineData?.data?.production ?? [];
    const seen = new Map<string, ProductData>();
    for (const g of groups) {
      const partNo = g.partNo ?? "-";
      if (!seen.has(partNo)) {
        seen.set(partNo, {
          id: seen.size + 1,
          productNo: "",
          partName: g.productName ?? "",
          partNo: g.partNo ?? "",
        });
      }
    }
    return [
      { id: 0, productNo: "", partName: "", partNo: "All Part" },
      ...seen.values(),
    ];
  }, [timelineData?.data]);

  const windowStartMs = useMemo(() => {
    return new Date(startDate + "T00:00:00").getTime();
  }, [startDate]);

  const rows = useMemo<GanttRow[]>(() => {
    if (chartNow === null) return [];
    return [
      toSingleGanttRow(
        timelineData?.data,
        machineId,
        chartNow,
        windowStartMs,
        windowHours,
        product?.partNo,
      ),
    ];
  }, [timelineData?.data, machineId, chartNow, windowStartMs, windowHours, product?.partNo]);

  const handleFormatTick = useCallback(
    (h: number) => {
      if (days > 1 && h % 24 === 0) {
        const d = new Date(windowStartMs + h * MS_PER_HOUR);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
      return formatClock(h, false);
    },
    [windowStartMs, days],
  );
  const handleFormatClock = useCallback(
    (h: number) => {
      if (days > 1) {
        const d = new Date(windowStartMs + h * MS_PER_HOUR);
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `${dateStr} ${formatClock(h)}`;
      }
      return formatClock(h);
    },
    [windowStartMs, days],
  );

  if (isLoading) {
    return <MachineActivityChartSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="flex items-center justify-end gap-10">
        <Combobox
          items={productList}
          value={product}
          onValueChange={(data) => {
            if (data?.id === 0) setProduct(null);
            else setProduct(data);
            if (data) setTimeout(() => productInputRef.current?.blur(), 0);
          }}
          itemToStringLabel={(item: ProductData) => item.partNo}
        >
          <ComboboxInput
            ref={productInputRef}
            className="rounded-sm"
            placeholder="Select a Product"
            onFocus={() => {
              setProduct(null);
            }}
          />
          <ComboboxContent>
            <ComboboxEmpty>No Product Found</ComboboxEmpty>
            <ComboboxList>
              {(item: ProductData) => (
                <ComboboxItem key={item.id} value={item}>
                  {item.partNo}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <Combobox
          items={userList}
          value={user}
          onValueChange={(data) => {
            if (data?.id === 0) setUser(null);
            else setUser(data);
            if (data) setTimeout(() => userInputRef.current?.blur(), 0);
          }}
          onInputValueChange={(value) => setSearchUser(value)}
          itemToStringLabel={(item: UserData) => item.name}
        >
          <ComboboxInput
            ref={userInputRef}
            className="rounded-sm"
            placeholder="Select an User"
            onFocus={() => {
              setUser(null);
              setSearchUser(undefined);
            }}
          />
          <ComboboxContent>
            <ComboboxEmpty>No User Found</ComboboxEmpty>
            <ComboboxList>
              {(item: UserData) => (
                <ComboboxItem key={item.id} value={item}>
                  {item.name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      <GanttBarChart
        rows={rows}
        totalUnits={windowHours}
        unitLabel="h"
        tickCount={days === 1 ? 12 : Math.min(days, 10)}
        hideLabels
        formatTick={handleFormatTick}
        formatClock={handleFormatClock}
      />
    </div>
  );
}
