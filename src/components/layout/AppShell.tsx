"use client";

import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useDatetime } from "@/hooks/use-datetime";
import { useMqttStatus } from "@/hooks/use-mqtt";
import { useApiHealthHook } from "@/hooks/use-machine";
import { cn } from "@/lib/utils";

const NAKED_ROUTES = ["/login", "/register"];

type ConnState = "ok" | "pending" | "down";

const TONE: Record<ConnState, string> = {
  ok: "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]",
  pending: "bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.18)]",
  down: "bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.18)]",
};

const STATE_LABEL: Record<ConnState, string> = {
  ok: "Connected",
  pending: "Connecting",
  down: "Disconnected",
};

/** Colored dot + name showing the live state of a connection. */
function ConnectionSign({ name, state }: { name: string; state: ConnState }) {
  return (
    <span
      className="flex items-center gap-2 text-sm text-muted-foreground"
      title={`${name}: ${STATE_LABEL[state]}`}
    >
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full transition-colors",
          TONE[state],
          state === "pending" && "animate-pulse",
        )}
      />
      <span className="hidden sm:inline">{name}</span>
    </span>
  );
}

function pageTitleFor(pathname: string): string {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname === "/monitoring" || pathname === "/monitoring/")
    return "Machine Monitoring";
  if (pathname.startsWith("/monitoring/")) return "Machine Detail";
  if (pathname.startsWith("/history")) return "History";
  if (pathname.startsWith("/user-management")) return "User Management";
  if (pathname.startsWith("/user")) return "User";
  if (pathname.startsWith("/qr-generator")) return "QR Generator";
  return "";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dateTime = useDatetime();
  const mqttStatus = useMqttStatus();

  const mqttState: ConnState =
    mqttStatus === "connected"
      ? "ok"
      : mqttStatus === "connecting" || mqttStatus === "reconnecting"
        ? "pending"
        : "down";

  // Poll the API on an interval — a 200 (query success) means the backend is
  // reachable; an error marks it down.
  const { status: apiStatus } = useApiHealthHook();
  const apiState: ConnState =
    apiStatus === "success" ? "ok" : apiStatus === "error" ? "down" : "pending";

  const naked = NAKED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );

  const formatDateTime = dateTime?.toLocaleString("en-US", {hour12: false});

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
            <ConnectionSign name="API" state={apiState} />
            <Separator orientation="vertical" className="mx-1 h-5" />
            <ConnectionSign name="MQTT" state={mqttState} />
            <Separator orientation="vertical" className="mx-1 h-5" />
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
