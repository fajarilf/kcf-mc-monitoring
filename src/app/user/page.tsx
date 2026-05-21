"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserTable } from "@/components/user/UserTable";
import { useAuth } from "@/lib/auth";

export default function UserPage() {
  const router = useRouter();
  const isLoggedIn = useAuth((s) => s.isLoggedIn);
  const [ready, setReady] = useState(false);

  // useEffect(() => {
  //   // Auth state is hydrated from localStorage on the client.
  //   // Wait one tick so the persisted Zustand store can load before deciding.
  //   const t = setTimeout(() => {
  //     if (!useAuth.getState().isLoggedIn) {
  //       router.replace("/login");
  //     } else {
  //       setReady(true);
  //     }
  //   }, 0);
  //   return () => clearTimeout(t);
  // }, [router]);

  // if (!ready || !isLoggedIn) {
  //   return (
  //     <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
  //       Checking authentication…
  //     </div>
  //   );
  // }

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
