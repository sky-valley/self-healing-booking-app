"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PulseChrome } from "@/components/PulseChrome";
import { FaultButton } from "@/components/FaultButton";
import type { SummaryStat, ReservationSummary } from "@/lib/data";

interface Summary {
  venue: { name: string; coversTonight: number; floorPct: number };
  stats: SummaryStat[];
  recent: ReservationSummary[];
}

const STATUS: Record<string, string> = {
  confirmed: "bg-pulse-lime/30 text-pulse-lime-deep",
  seated: "bg-amber-100 text-amber-800",
  completed: "bg-pulse-line text-pulse-muted",
  "no-show": "bg-pulse-coral/15 text-pulse-coral",
};

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);

  // The dashboard depends ONLY on /api/summary — never the drifted export path.
  useEffect(() => {
    fetch("/api/summary", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <PulseChrome>
      {!data ? (
        <div className="h-64 animate-pulse rounded-2xl bg-pulse-line/50" />
      ) : (
        <div className="animate-rise">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-pulse-muted">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}{" "}
            · Dinner service
          </p>
          <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight">
            Good evening, {data.venue.name}.
          </h1>
          <p className="mt-3 max-w-lg text-lg text-pulse-muted">
            <span className="font-semibold text-pulse-ink">
              {data.venue.coversTonight} covers
            </span>{" "}
            booked tonight — {data.venue.floorPct}% of the floor. Doors at 5:30.
          </p>

          {/* stat strip — hairline-separated tiles, not cards */}
          <section className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-pulse-line md:grid-cols-4">
            {data.stats.map((s) => (
              <div key={s.label} className="bg-pulse-bg px-5 py-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-pulse-muted">
                  {s.label}
                </p>
                <p className="mt-2 font-display text-4xl font-bold tabular-nums">
                  {s.value}
                </p>
                <p
                  className={`mt-1 text-xs font-semibold ${
                    s.trend === "down" ? "text-pulse-coral" : "text-pulse-lime-deep"
                  }`}
                >
                  {s.delta}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-12">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl font-bold">Recent reservations</h2>
              <Link
                href="/history"
                className="text-sm font-semibold text-pulse-muted underline-offset-4 hover:text-pulse-ink hover:underline"
              >
                Full ledger &rarr;
              </Link>
            </div>
            <ul className="mt-5 divide-y divide-pulse-line rounded-2xl border border-pulse-line bg-pulse-card">
              {data.recent.map((r, i) => (
                <li key={i} className="flex items-center gap-4 px-5 py-4">
                  <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl bg-pulse-bg text-center font-display text-sm font-bold leading-tight tabular-nums">
                    {r.time.replace(" ", " ")}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{r.guest}</p>
                    <p className="text-sm text-pulse-muted">{r.area}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-6 text-right">
                    <span>
                      <span className="font-display text-lg font-bold tabular-nums">
                        {r.partySize}
                      </span>
                      <span className="ml-1 text-xs text-pulse-muted">guests</span>
                    </span>
                    <span
                      className={`w-24 rounded-full px-2.5 py-1 text-center text-xs font-semibold capitalize ${STATUS[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <FaultButton />
    </PulseChrome>
  );
}
