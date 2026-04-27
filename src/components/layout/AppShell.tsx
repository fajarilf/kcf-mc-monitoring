"use client";

import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useDatetime } from "@/hooks/use-datetime";

const NAKED_ROUTES = ["/login", "/register"];

function pageTitleFor(pathname: string): string {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/monitoring")) return "Machine Monitoring";
  if (pathname.startsWith("/history")) return "History";
  if (pathname.startsWith("/user-management")) return "User Management";
  return "";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dateTime = useDatetime();

  const naked = NAKED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );

  const formatDateTime = dateTime.toLocaleString("en-US", {hour12: false});

  if (naked) {
    return <div className="min-h-svh flex flex-col">{children}</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="glass-header sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <h1 className="text-sm font-semibold tracking-normal">
            {pageTitleFor(pathname)}
          </h1>
          <div className="ml-auto flex items-center gap-1">
            <h1 className="text-sm tracking-wide">
              {formatDateTime}
            </h1>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <ThemeToggle />
          </div>
        </header>
        <div className="flex min-w-0 flex-1 flex-col p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
