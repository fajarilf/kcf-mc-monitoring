"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { ArrowLeft, Package, User } from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import Link from "next/link";

export function MachineCardSkeleton() {
  return (
    <Card
      className={cn(
        "relative flex h-full flex-col overflow-hidden ring-1",
        "ring-slate-500/20 dark:ring-slate-400/20",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5 bg-muted"
      />
      <CardHeader className="relative flex flex-row items-start justify-between gap-2 pl-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-2 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </CardHeader>
      <CardContent className="relative flex flex-1 flex-col gap-4 pl-5">
        <div className="flex gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Package className="size-4 shrink-0 text-muted-foreground/50" />
            <Skeleton className="h-3.5 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <User className="size-4 shrink-0 text-muted-foreground/50" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-muted/40 p-3 text-center backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Run Time
          </div>
          <div className="mt-1 flex justify-center">
            <Skeleton className="h-7 w-32" />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Products</span>
          <Skeleton className="h-4 w-8" />
        </div>
      </CardContent>
    </Card>
  );
}

export function MachineDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            render={<Link href="/monitoring" />}
            size="icon"
            variant="ghost"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="text-sm text-muted-foreground">
            Viewing details for
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Machine</span>
          <Skeleton className="h-9 w-40 rounded-sm" />
        </div>
      </div>

      <Card className="relative overflow-hidden ring-1 ring-border/60">
        <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-muted" />
        <CardHeader className="pl-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="size-2.5 rounded-full" />
                <Skeleton className="h-7 w-40" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pl-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border/50 bg-muted/40 p-3"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-40 rounded-sm" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-2 h-4 w-56" />
          <Separator className="mt-2" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}