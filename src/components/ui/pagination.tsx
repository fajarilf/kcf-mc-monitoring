import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function getPageItems(current: number, total: number): (number | "gap")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: (number | "gap")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("gap");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total - 1) items.push("gap");
  items.push(total);
  return items;
}

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Total number of records. When provided, shows "Showing X–Y of Z". */
  total?: number;
  /** Number of records per page. Required when `total` is provided. */
  pageSize?: number;
  /** When provided, renders a rows-per-page selector. */
  onPageSizeChange?: (size: number) => void;
};

export function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  pageSize,
  onPageSizeChange,
}: Props) {
  if (totalPages <= 1 && (total === undefined || total === 0)) return null;

  const rangeStart =
    total !== undefined && pageSize !== undefined && total > 0
      ? (page - 1) * pageSize + 1
      : 0;
  const rangeEnd =
    total !== undefined && pageSize !== undefined
      ? Math.min(page * pageSize, total)
      : 0;

  const pageItems = getPageItems(page, totalPages);

  return (
    <div className="flex items-center justify-between gap-4 border-t px-6 py-3">
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">
          {total === undefined ? "" : total === 0 ? "No results" : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
        </p>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Rows</span>
            <Select
              value={String(pageSize ?? 10)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        {pageItems.map((item, i) =>
          item === "gap" ? (
            <span
              key={`gap-${i}`}
              className="px-1.5 text-sm text-muted-foreground"
            >
              &hellip;
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? "default" : "outline"}
              size="icon"
              className="size-8"
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
