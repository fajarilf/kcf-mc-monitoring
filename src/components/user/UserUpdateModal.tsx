"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { userService } from "@/services/user-services";
import { useMachineHook } from "@/hooks/use-machine";
import { useGroupHook } from "@/hooks/use-group";
import type { UserData } from "@/model/user-model";

type Props = {
  user: UserData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const ROLES = ["admin", "operator", "viewer"];

export function UserUpdateModal({ user, open, onOpenChange, onSuccess }: Props) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [role, setRole] = useState(user?.role ?? "");
  const { data: machineData } = useMachineHook();
  const { data: groupData } = useGroupHook();

  // Find matching ids from user's names (data may load after mount)
  const resolvedMachineId = machineData?.data?.find((m) => m.name === user?.machineName)?.id ?? null;
  const resolvedGroupId = groupData?.data?.find((g) => g.name === user?.groupName)?.id ?? null;

  const [machineId, setMachineId] = useState<number | null>(resolvedMachineId);
  const [groupId, setGroupId] = useState<number | null>(resolvedGroupId);
  const [submitting, setSubmitting] = useState(false);

  // Sync once data loads (component remounts on user change via key prop)
  if (machineId === null && resolvedMachineId !== null) setMachineId(resolvedMachineId);
  if (groupId === null && resolvedGroupId !== null) setGroupId(resolvedGroupId);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      await userService.update(user.id, {
        name,
        email: email || null,
        username: username || null,
        role: role || null,
        groupId: groupId ?? null,
        machineId: machineId ?? null,
      });
      toast.success(`User "${name}" updated`);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error("Failed to update user");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update User</DialogTitle>
          <DialogDescription>
            Edit user details and save changes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Machine</Label>
            <Select
              value={machineId?.toString() ?? ""}
              onValueChange={(v) => setMachineId(v ? Number(v) : null)}
              itemToStringLabel={(v) => machineData?.data?.find((m) => String(m.id) === v)?.name ?? ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select machine" />
              </SelectTrigger>
              <SelectContent>
                {machineData?.data?.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Group</Label>
            <Select
              value={groupId?.toString() ?? ""}
              onValueChange={(v) => setGroupId(v ? Number(v) : null)}
              itemToStringLabel={(v) => groupData?.data?.find((g) => String(g.id) === v)?.name ?? ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {groupData?.data?.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
