"use client";

import { useMemo, useState } from "react";
import { Cpu, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useMachineHook } from "@/hooks/use-machine";
import { MachineUpdateModal } from "./MachineUpdateModal";
import type { MachineData } from "@/model/machine-model";

const COLUMN_COUNT = 4;

export function MachineListTable() {
  const [editMachine, setEditMachine] = useState<MachineData | null>(null);
  const { data, isLoading, refetch } = useMachineHook();

  const machines = useMemo(() => {
    const list = data?.data ?? [];
    return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
  }, [data?.data]);

  return (
    <>
      <MachineUpdateModal
        key={editMachine?.id}
        machine={editMachine}
        open={!!editMachine}
        onOpenChange={(open) => !open && setEditMachine(null)}
        onSuccess={() => refetch()}
      />
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    {Array.from({ length: COLUMN_COUNT }).map((_, col) => (
                      <TableCell
                        key={col}
                        className={
                          col === 0
                            ? "pl-6"
                            : col === COLUMN_COUNT - 1
                              ? "pr-6"
                              : ""
                        }
                      >
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : machines.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={COLUMN_COUNT} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Cpu className="size-8 opacity-30" />
                      <p className="text-sm font-medium">No machines found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                machines.map((machine) => (
                  <TableRow key={machine.id}>
                    <TableCell className="pl-6 font-medium">
                      {machine.name}
                    </TableCell>
                    <TableCell>{machine.order ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(machine.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditMachine(machine)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
