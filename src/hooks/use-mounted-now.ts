"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

let cached: number | null = null;
const subscribe = () => () => {};
const getClientSnapshot = (): number | null => {
  if (cached === null) cached = Date.now();
  return cached;
};
const getServerSnapshot = (): number | null => null;

export function useMountedNow(): number | null {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

export function useNowTicker(intervalMs: number): number | null {
  const initial = useMountedNow();
  const [ticked, setTicked] = useState<number | null>(null);

  useEffect(() => {
    if (initial === null) return;
    const id = setInterval(() => setTicked(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [initial, intervalMs]);

  return ticked ?? initial;
}