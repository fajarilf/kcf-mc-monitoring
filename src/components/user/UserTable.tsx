"use client";

import { useMemo, useState } from "react";
import { Download, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { useUsersHook } from "@/hooks/use-user-hook";
import { userService } from "@/services/user-services";
import { exportListToExcel } from "@/lib/excel/export-list";
import { UserUpdateModal } from "./UserUpdateModal";
import type { UserData, UserParams } from "@/model/user-model";

const COLUMN_COUNT = 5;

export function UserTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const params = useMemo<UserParams>(
    () => ({ page, limit: pageSize, search: debouncedSearch, paginate: true }),
    [page, pageSize, debouncedSearch],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useUsersHook(params);

  const users = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPage = Math.max(1, pagination?.totalPages ?? 1);
  const total = pagination?.total ?? 0;
  // True while fetching a new page on top of already-rendered rows.
  const busy = isFetching && !isLoading;

  function handleUpdate(user: UserData) {
    setEditUser(user);
  }

  function handleDelete(user: UserData) {
    setDeleteTarget(user);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userService.delete(deleteTarget.id);
      toast.success(`User "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error("Failed to delete user");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await userService.get({ paginate: false });
      const allUsers: UserData[] = res.data ?? [];
      await exportListToExcel(
        "Users",
        [
          { header: "Name", key: "name", width: 25 },
          { header: "Role", key: "role", width: 15 },
          { header: "Group", key: "groupName", width: 20 },
          { header: "Machine", key: "machineName", width: 20 },
        ],
        allUsers.map((u) => ({
          name: u.name,
          role: u.role,
          groupName: u.groupName ?? "-",
          machineName: u.machineName ?? "-",
        })),
        "users.xlsx",
      );
      toast.success("Users exported");
    } catch (err) {
      toast.error("Failed to export users");
      console.error(err);
    } finally {
      setExporting(false);
    }
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
    <UserUpdateModal
      user={null}
      open={createOpen}
      onOpenChange={setCreateOpen}
      onSuccess={() => refetch()}
    />
    <ConfirmDialog
      open={!!deleteTarget}
      onOpenChange={(open) => !open && setDeleteTarget(null)}
      title="Delete user?"
      description={deleteTarget ? `"${deleteTarget.name}" will be permanently deleted.` : ""}
      loading={deleting}
      onConfirm={handleConfirmDelete}
    />
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Create User
        </Button>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
        >
          <Download className="mr-2 size-4" />
          {exporting ? "Exporting…" : "Export to Excel"}
        </Button>
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table className={cn("transition-opacity", busy && "opacity-60")}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <LoadingRows count={pageSize} />}

              {isError && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={COLUMN_COUNT}
                    className="py-16 text-center text-sm text-destructive"
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
                    className="py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="size-8 opacity-30" />
                      <p className="text-sm font-medium">No users found</p>
                      <p className="text-xs">
                        Try adjusting your search or create a new user.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !isError &&
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="pl-6 font-medium">{user.name}</TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.groupName || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.machineName || "-"}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdate(user)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          {!isError && (
            <Pagination
              page={page}
              totalPages={totalPage}
              onPageChange={setPage}
              total={total}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </CardContent>
      </Card>
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

function LoadingRows({ count = 10 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, row) => (
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
