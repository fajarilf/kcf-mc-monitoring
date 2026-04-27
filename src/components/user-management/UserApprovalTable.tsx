"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppUser, UserStatus } from "@/lib/mock-data";
import { useUsersStore } from "@/lib/users-store";
import { cn } from "@/lib/utils";

const filterOptions: { value: "all" | UserStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const statusBadgeClass: Record<UserStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

export function UserApprovalTable() {
  const users = useUsersStore((s) => s.users);
  const setStatus = useUsersStore((s) => s.setStatus);

  const [filter, setFilter] = useState<"all" | UserStatus>("all");
  const [confirmReject, setConfirmReject] = useState<AppUser | null>(null);

  const filtered = users.filter((u) =>
    filter === "all" ? true : u.status === filter,
  );

  const handleApprove = (user: AppUser) => {
    setStatus(user.id, "approved");
    toast.success(`Approved ${user.name}`);
  };

  const handleConfirmReject = () => {
    if (!confirmReject) return;
    setStatus(confirmReject.id, "rejected");
    toast.warning(`Rejected ${confirmReject.name}`);
    setConfirmReject(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as "all" | UserStatus)}
      >
        <TabsList>
          {filterOptions.map((opt) => (
            <TabsTrigger key={opt.value} value={opt.value}>
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Registered At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.registeredAt), "yyyy-MM-dd HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border capitalize",
                        statusBadgeClass[user.status],
                      )}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={user.status === "approved"}
                        onClick={() => handleApprove(user)}
                      >
                        <Check className="size-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={user.status === "rejected"}
                        onClick={() => setConfirmReject(user)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="size-4" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!confirmReject}
        onOpenChange={(open) => !open && setConfirmReject(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject user?</DialogTitle>
            <DialogDescription>
              {confirmReject
                ? `This will reject ${confirmReject.name} (${confirmReject.email}). They will not be able to log in.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReject(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
