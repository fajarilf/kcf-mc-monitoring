"use client";

import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delayMs` have
 * passed without a change. Useful for throttling search input before it feeds
 * a query so every keystroke does not trigger a refetch.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
