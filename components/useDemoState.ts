"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DemoState } from "@/lib/types";

export type ControlAction =
  | { action: "reset" }
  | { action: "set-instance"; instanceId: string }
  | { action: "capture-break"; instanceId: string }
  | { action: "detect"; instanceId: string }
  | { action: "heal"; instanceId: string };

export async function control(body: ControlAction): Promise<DemoState> {
  const res = await fetch("/api/control", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

/** Poll the shared demo state so both views stay synchronized with the presenter. */
export function useDemoState(intervalMs = 450) {
  const [state, setState] = useState<DemoState | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      setState(await res.json());
    } catch {
      /* transient — keep last good state */
    }
  }, []);

  useEffect(() => {
    refresh();
    timer.current = setInterval(refresh, intervalMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [refresh, intervalMs]);

  // Optimistic local apply so presenter clicks feel instant, then reconcile.
  const apply = useCallback(
    async (body: ControlAction) => {
      const next = await control(body);
      setState(next);
      return next;
    },
    [],
  );

  return { state, refresh, apply };
}

export function relativeTime(iso: string, nowMs = Date.now()): string {
  const then = new Date(iso).getTime();
  const sec = Math.max(0, Math.round((nowMs - then) / 1000));
  const day = Math.floor(sec / 86400);
  if (day >= 14) return `${Math.round(day / 7)} weeks ago`;
  if (day >= 7) return `1 week ago`;
  if (day >= 1) return `${day} day${day === 1 ? "" : "s"} ago`;
  const hr = Math.floor(sec / 3600);
  if (hr >= 1) return `${hr}h ago`;
  const min = Math.floor(sec / 60);
  if (min >= 1) return `${min}m ago`;
  return `${sec}s ago`;
}

export function clockTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
