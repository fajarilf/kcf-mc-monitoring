"use client";

import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useTheme } from "next-themes";
import {
  MACHINE_STATUS,
  statusFillHex,
  statusLabel,
  withAlpha,
} from "@/lib/status";
import { useMountedNow } from "@/hooks/use-mounted-now";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { useStatusActivityHook } from "@/hooks/use-status-hook";
import { MachineActivity } from "@/model/status-model";
import { useUsersHook } from "@/hooks/use-user-hook";
import { UserData } from "@/model/user-model";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "../ui/combobox";
import { MachineActivityChartSkeleton } from "./Skeleton";
import { useProductHook } from "@/hooks/use-product";
import { ProductData } from "@/model/product-model";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
);

interface Props {
  machineId: string;
  startDate: string;
  endDate: string;
}

const STATUSES: MACHINE_STATUS[] = [
  MACHINE_STATUS.OFF,
  MACHINE_STATUS.RUNNING,
  MACHINE_STATUS.CYOKOTEI_STOP,
  MACHINE_STATUS.DANDORI,
  MACHINE_STATUS.SETUP,
];

function generateDateRange(startDate: string, endDate: string): Date[] {
  if (!startDate || !endDate) return [];

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function getTotalHoursByStatus(
  activityData: MachineActivity[],
  dateRange: Date[],
): Record<MACHINE_STATUS, number[]> {
  const result: Record<MACHINE_STATUS, number[]> = {
    [MACHINE_STATUS.OFF]: [],
    [MACHINE_STATUS.RUNNING]: [],
    [MACHINE_STATUS.CYOKOTEI_STOP]: [],
    [MACHINE_STATUS.DANDORI]: [],
    [MACHINE_STATUS.SETUP]: [],
  };

  for (const date of dateRange) {
    const dayData = activityData.find(
      (d) => new Date(d.date).toLocaleDateString() === date.toLocaleDateString(),
    );

    const dailyTotals: Record<MACHINE_STATUS, number> = {
      [MACHINE_STATUS.OFF]: 0,
      [MACHINE_STATUS.RUNNING]: 0,
      [MACHINE_STATUS.CYOKOTEI_STOP]: 0,
      [MACHINE_STATUS.DANDORI]: 0,
      [MACHINE_STATUS.SETUP]: 0,
    };

    if (dayData) {
      for (const detail of dayData.details) {
        dailyTotals[detail.code] += detail.totalTime / 3600;
      }
    }

    for (const status of STATUSES) {
      result[status].push(dailyTotals[status]);
    }
  }

  return result;
}

export function MachineActivityChart({ machineId, startDate, endDate }: Props) {
  const { resolvedTheme } = useTheme();
  const now = useMountedNow();
  const [user, setUser] = useState<UserData | null>();
  const [product, setProduct] = useState<ProductData | null>();
  const [searchUser, setSearchUser] = useState<string>();
  const [searchProduct, setSearcProduct] = useState<string>();

  const debouncedSearchUser = useDebouncedValue(searchUser);
  const debouncedSearchProduct = useDebouncedValue(searchProduct);

  const mounted = now !== null;
  const isDark = mounted && resolvedTheme === "dark";

  const dateRange = useMemo<Date[]>(() => {
    return generateDateRange(startDate, endDate);
  }, [startDate, endDate]);

  const { data: userData, isLoading: userLoading } = useUsersHook({
    search: debouncedSearchUser
  });
  const { data: productData, isLoading: productLoading } = useProductHook({
    search: debouncedSearchProduct,
    paginate: debouncedSearchProduct === ""
  });
  const { data: activityData, isLoading: activityLoading } = useStatusActivityHook({
    machineId: parseInt(machineId),
    userId: user?.id,
    productId: product?.id,
    startDate: dateRange[0]?.toISOString(),
    endDate: dateRange[dateRange.length - 1]?.toISOString(),
  });

  const userList: UserData[] = [{id: 0, name: "All User", role: ""}, ...(userData?.data ?? [])];
  const productList: ProductData[] = [{id: 0, productNo: "", partName: "", partNo: "All Part" }, ...(productData?.data ?? [])]

  const isLoading = userLoading && activityLoading && productLoading;

  const tickColor = isDark ? "rgb(203, 213, 225)" : "rgb(71, 85, 105)";
  const gridColor = isDark
    ? "rgba(148, 163, 184, 0.12)"
    : "rgba(100, 116, 139, 0.15)";
  const tooltipBg = isDark
    ? "rgba(15, 23, 42, 0.95)"
    : "rgba(255, 255, 255, 0.98)";
  const tooltipFg = isDark ? "rgb(241, 245, 249)" : "rgb(15, 23, 42)";
  const legendColor = isDark ? "rgb(226, 232, 240)" : "rgb(30, 41, 59)";

  const data = useMemo(() => {
    const hoursByStatus = getTotalHoursByStatus(activityData?.data || [], dateRange);

    const labels = dateRange.map((d) =>
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    );

    const datasets = STATUSES.map((status) => {
      const color = statusFillHex[status];

      return {
        label: statusLabel[status],
        data: hoursByStatus[status],
        backgroundColor: withAlpha(color, 0.8),
        borderColor: color,
        borderWidth: 1,
      };
    });

    return { labels, datasets } as ChartData<"bar">;
  }, [dateRange, activityData?.data]);

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "end",
        labels: {
          color: legendColor,
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipFg,
        bodyColor: tooltipFg,
        borderColor: gridColor,
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${(ctx.parsed.y as number).toFixed(1)} h`,
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        ticks: { color: tickColor, autoSkip: true, maxRotation: 0 },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
      y: {
        min: 0,
        max: 24,
        ticks: {
          color: tickColor,
          stepSize: 4,
          callback: (v) => `${v}h`,
        },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
    },
  };

  if (isLoading) {
    return <MachineActivityChartSkeleton/>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-10">
        <Combobox
          items={productList}
          value={product}
          onValueChange={(data) => {
            if (data?.id === 0) setProduct(undefined);
            else setProduct(data);
          }}
          onInputValueChange={(value) => setSearcProduct(value)}
          itemToStringLabel={(item: ProductData) => item.partNo}
        >
          <ComboboxInput className="rounded-sm" placeholder="Select a Product"/>
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
            if (data?.id === 0) setUser(undefined);
            else setUser(data);
          }}
          onInputValueChange={(value) => setSearchUser(value)}
          itemToStringLabel={(item: UserData) => item.name}
        >
          <ComboboxInput className="rounded-sm" placeholder="Select an User"/>
          <ComboboxContent>
            <ComboboxEmpty>No User Found</ComboboxEmpty>
            <ComboboxList>
              {(item: UserData) => (
                <ComboboxItem key={item.id} value={item}>
                  { item.name }
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      <div className="h-70 w-full">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
