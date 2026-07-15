"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useUsersHook } from "@/hooks/use-user-hook";
import { UserUpdateModal } from "./UserUpdateModal";
import type { UserData, UserParams } from "@/model/user-model";

const PAGE_SIZE = 10;
const COLUMN_COUNT = 7;

/** Builds a compact page list, inserting "gap" markers for large page counts. */
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

export function UserTable() {
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState<UserData | null>(null);

  const params = useMemo<UserParams>(
    () => ({ page, limit: PAGE_SIZE, search: "", paginate: true }),
    [page],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useUsersHook(params);

  const users = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPage = Math.max(1, pagination?.totalPages ?? 1);
  const total = pagination?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = (page - 1) * PAGE_SIZE + users.length;
  const pageItems = getPageItems(page, totalPage);
  // True while fetching a new page on top of already-rendered rows.
  const busy = isFetching && !isLoading;

  function handleUpdate(user: UserData) {
    setEditUser(user);
  }

  function handleDelete(user: UserData) {
    // TODO: wire up the delete action (confirm + call API).
    console.log("delete user", user.id);
  }

  return (
    <>
    <UserUpdateModal
      key={editUser?.id}
      user={editUser}
      open={!!editUser}
      onOpenChange={(open) => !open && setEditUser(null)}
      onSuccess={() => refetch()}
    />
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className={cn("transition-opacity", busy && "opacity-60")}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Name</TableHead>
            {/* <TableHead>Email</TableHead>
            <TableHead>Username</TableHead> */}
            <TableHead>Role</TableHead>
            <TableHead>Group</TableHead>
            <TableHead>Machine</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <LoadingRows />}

          {isError && (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={COLUMN_COUNT}
                className="h-24 text-center text-sm text-destructive"
              >
                Failed to load users
                {error?.response?.data || error?.message
                  ? ` — ${error.response?.data || error.message}`
                  : ""}
                .
              </TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && users.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={COLUMN_COUNT}
                className="h-24 text-center text-sm text-muted-foreground"
              >
                No users found.
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            !isError &&
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="pl-4 font-medium">{user.name}</TableCell>
                {/* <TableCell className="text-muted-foreground">
                  {user.email || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.username || "-"}
                </TableCell> */}
                <TableCell>
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.groupName || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.machineName || "-"}
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdate(user)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(user)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {!isError && (
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading users…"
              : total > 0
                ? `Showing ${rangeStart}–${rangeEnd} of ${total} users`
                : "No users to show"}
          </p>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft />
              Prev
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
                  size="sm"
                  variant={item === page ? "default" : "outline"}
                  className="min-w-8"
                  onClick={() => setPage(item)}
                >
                  {item}
                </Button>
              ),
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPage || isLoading}
              onClick={() => setPage((p) => Math.min(totalPage, p + 1))}
            >
              Next
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role?.toLowerCase() === "admin";
  return (
    <Badge variant={isAdmin ? "default" : "secondary"} className="capitalize">
      {role || "-"}
    </Badge>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, row) => (
        <TableRow key={row} className="hover:bg-transparent">
          {Array.from({ length: COLUMN_COUNT }).map((_, col) => (
            <TableCell key={col} className="first:pl-4 last:pr-4">
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
