"use client";

import { UserTable } from "@/components/user/UserTable";

export default function UserPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold">User</h2>
        <p className="text-sm text-muted-foreground">
          List of registered users.
        </p>
      </div>
      <UserTable />
    </div>
  );
}
