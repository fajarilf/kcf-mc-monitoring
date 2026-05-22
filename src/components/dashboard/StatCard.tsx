import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "green" | "yellow" | "red" | "gray";
}

const toneStyles: Record<
  StatCardProps["tone"],
  { wrap: string; icon: string; ring: string }
> = {
  green: {
    wrap: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    icon: "",
    ring: "ring-emerald-500/20",
  },
  yellow: {
    wrap: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    icon: "",
    ring: "ring-amber-500/20",
  },
  red: {
    wrap: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    icon: "",
    ring: "ring-rose-500/20",
  },
  gray: {
    wrap: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
    icon: "",
    ring: "ring-slate-500/20",
  },
};

export function StatCard({ label, value, icon: Icon, tone }: StatCardProps) {
  const t = toneStyles[tone];
  return (
    <Card
      className={cn(
        "ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        t.ring,
      )}
    >
      <CardContent className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl",
            t.wrap,
          )}
        >
          <Icon className="size-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-3xl font-semibold leading-tight tabular-nums">
            {value}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
