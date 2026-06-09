"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PulseChrome } from "@/components/PulseChrome";
import { useDemoState, control } from "@/components/useDemoState";
import { buildReservationCsv, MissingFieldError } from "@/lib/csv";
import type { Divergence, HealState, Instance } from "@/lib/types";

interface ExportPayload {
  rows: Record<string, unknown>[];
}

type Phase = "idle" | "error" | "healing" | "success";

const CSV_FILENAME = "tablefront-reservations.csv";
// Narratable gap between detect and heal so the "healing" beat is visible on
// both the user view and /differ (matches the operator-view analyzing flourish).
const HEAL_DELAY_MS = 1500;

function downloadCsv(csv: string, name: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ReservationsPage() {
  const { state } = useDemoState();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [errorMsg, setErrorMsg] = useState(
    'CSV export failed: expected field "party_size" was undefined for one or more rows.',
  );
  const [localError, setLocalError] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const lastHeal = useRef<HealState | null>(null);
  const hadFailure = useRef(false);
  const downloadedFor = useRef<string | null>(null);

  const active: Instance | undefined = state?.instances.find(
    (i) => i.id === state.activeInstanceId,
  );
  const healState = active?.healState ?? "armed";

  // Display phase is derived from server truth (healState), with a brief local
  // optimistic error so the failure shows the instant the user clicks.
  const phase: Phase = useMemo(() => {
    if (healState === "healed") return "success";
    if (healState === "detecting") return hadFailure.current ? "healing" : "idle";
    if (healState === "broken") return "error";
    return localError ? "error" : "idle"; // armed
  }, [healState, localError]);

  const fetchRows = useCallback(async (): Promise<Record<string, unknown>[]> => {
    const res = await fetch("/api/export/activities", { cache: "no-store" });
    const data: ExportPayload = await res.json();
    setRows(data.rows);
    return data.rows;
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // The export the user clicks — builds the CSV exactly as the stem does.
  const runExport = useCallback(async () => {
    if (!active || triggering) return;

    // RETRY on a known-broken instance => let Differ heal it autonomously
    // (detect -> brief healing beat -> apply divergence). The healed effect
    // below then auto-retries the export and downloads a valid CSV.
    if (active.healState === "broken" || localError) {
      setTriggering(true);
      try {
        hadFailure.current = true;
        await control({ action: "capture-break", instanceId: active.id }); // idempotent: ensure broken
        await control({ action: "detect", instanceId: active.id });
        await new Promise((r) => setTimeout(r, HEAL_DELAY_MS));
        await control({ action: "heal", instanceId: active.id });
      } finally {
        setTriggering(false);
      }
      return;
    }

    // FIRST attempt: build exactly as the stem does => throws under drift.
    const data = await fetchRows();
    const divs = state?.divergences.filter((d) => d.instanceId === active.id) ?? [];
    try {
      const csv = buildReservationCsv(data, divs);
      downloadCsv(csv, CSV_FILENAME);
    } catch (err) {
      hadFailure.current = true;
      setLocalError(true);
      setErrorMsg(
        err instanceof MissingFieldError
          ? err.message
          : "CSV export failed unexpectedly.",
      );
      // Report the runtime failure to Differ's signal plane.
      await control({ action: "capture-break", instanceId: active.id });
    }
  }, [active, fetchRows, state, localError, triggering]);

  // Autonomous heal: when the operator's heal lands (healState -> "healed"),
  // the previously broken export retries itself and downloads a valid CSV.
  useEffect(() => {
    const prev = lastHeal.current;
    lastHeal.current = healState;
    if (!active) return;

    if (
      healState === "healed" &&
      hadFailure.current &&
      downloadedFor.current !== active.id
    ) {
      downloadedFor.current = active.id;
      (async () => {
        const data = await fetchRows();
        const divs =
          state?.divergences.filter((d) => d.instanceId === active.id) ?? [];
        // Heal guard (PRD §7): guaranteed=true => always a valid CSV.
        const csv = buildReservationCsv(data, divs, true);
        downloadCsv(csv, CSV_FILENAME);
      })();
    }

    // A genuine reset (or switching to a pristine instance) moves a non-armed
    // state back to "armed". Only then do we clear local failure flags.
    if (prev && prev !== "armed" && healState === "armed") {
      hadFailure.current = false;
      downloadedFor.current = null;
      setLocalError(false);
    }
  }, [healState, active, fetchRows, state]);

  return (
    <PulseChrome>
      <div className="animate-rise">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">
          Reservation ledger
        </h1>
        <p className="mt-2 max-w-xl text-lg text-pulse-muted">
          Every booking, all locations. Export the month&rsquo;s reservations to
          CSV for accounting and end-of-period reporting.
        </p>

        {/* Export panel — the cold path. Failures must read from the back of a room. */}
        <ExportPanel
          phase={phase}
          errorMsg={errorMsg}
          instanceLabel={active?.label ?? ""}
          rowCount={rows.length}
          disabled={!active}
          busy={triggering}
          onExport={runExport}
        />

        <ReservationTable rows={rows} />
      </div>
    </PulseChrome>
  );
}

function ExportPanel({
  phase,
  errorMsg,
  instanceLabel,
  rowCount,
  disabled,
  busy,
  onExport,
}: {
  phase: Phase;
  errorMsg: string;
  instanceLabel: string;
  rowCount: number;
  disabled: boolean;
  busy: boolean;
  onExport: () => void;
}) {
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-pulse-line bg-pulse-card">
      <div className="flex flex-wrap items-center gap-4 px-6 py-5">
        <div>
          <h2 className="font-display text-xl font-bold">Export to CSV</h2>
          <p className="text-sm text-pulse-muted">
            {rowCount || 13} reservations · {instanceLabel || "loading…"}
          </p>
        </div>
        <button
          onClick={onExport}
          disabled={disabled || busy || phase === "healing"}
          className={`ml-auto rounded-full px-6 py-3 font-display text-base font-bold transition ${
            phase === "error"
              ? "bg-pulse-coral text-white"
              : "bg-pulse-ink text-pulse-bg hover:opacity-90"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {phase === "error" ? "Retry export" : "Export to CSV"}
        </button>
      </div>

      {phase === "error" && (
        <div className="animate-signal-in border-t-2 border-pulse-coral bg-pulse-coral/10 px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-pulse-coral text-sm font-bold text-white">
              !
            </span>
            <div>
              <p className="font-display text-lg font-bold text-pulse-coral">
                Export failed
              </p>
              <p className="mt-1 font-mono text-sm text-pulse-ink/80">{errorMsg}</p>
            </div>
          </div>
        </div>
      )}

      {phase === "healing" && (
        <div className="animate-signal-in border-t border-pulse-line bg-pulse-lime/15 px-6 py-4">
          <p className="flex items-center gap-2.5 text-sm font-semibold text-pulse-lime-deep">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pulse-lime-deep/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pulse-lime-deep" />
            </span>
            Differ is healing this for you&hellip;
          </p>
        </div>
      )}

      {phase === "success" && (
        <div className="animate-signal-in border-t-2 border-pulse-lime bg-pulse-lime/15 px-6 py-5">
          <p className="flex items-center gap-2.5 font-display text-lg font-bold text-pulse-lime-deep">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-pulse-lime-deep text-sm text-pulse-lime">
              &#10003;
            </span>
            Export complete — {CSV_FILENAME} downloaded.
          </p>
        </div>
      )}
    </section>
  );
}

function ReservationTable({ rows }: { rows: Record<string, unknown>[] }) {
  // The on-page preview is lenient (reads whichever party field is present),
  // so the page looks healthy. Only the strict CSV builder breaks on drift.
  const STATUS: Record<string, string> = {
    confirmed: "bg-pulse-lime/30 text-pulse-lime-deep",
    seated: "bg-amber-100 text-amber-800",
    completed: "bg-pulse-line text-pulse-muted",
    "no-show": "bg-pulse-coral/15 text-pulse-coral",
  };
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-bold">All reservations</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-pulse-line bg-pulse-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-pulse-line text-xs uppercase tracking-wide text-pulse-muted">
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Time</th>
              <th className="px-5 py-3 font-semibold">Guest</th>
              <th className="px-5 py-3 font-semibold tabular-nums">Party</th>
              <th className="px-5 py-3 font-semibold">Area</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pulse-line">
            {rows.map((r, i) => {
              const status = String(r.status);
              return (
                <tr key={i} className="hover:bg-pulse-bg">
                  <td className="px-5 py-3 font-mono text-xs">{String(r.date)}</td>
                  <td className="px-5 py-3">{String(r.time)}</td>
                  <td className="px-5 py-3 font-medium">{String(r.guest)}</td>
                  <td className="px-5 py-3 tabular-nums">
                    {String((r.party_size ?? r.covers) as number)}
                  </td>
                  <td className="px-5 py-3">{String(r.area)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS[status] ?? ""}`}
                    >
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
