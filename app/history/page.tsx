"use client";

import { useCallback, useEffect, useState } from "react";
import { PulseChrome } from "@/components/PulseChrome";
import { buildReservationCsv, MissingFieldError } from "@/lib/csv";

interface ExportPayload {
  rows: Record<string, unknown>[];
}

type Phase = "idle" | "error" | "success";

const CSV_FILENAME = "tablefront-reservations.csv";

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
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchRows = useCallback(async (): Promise<Record<string, unknown>[]> => {
    const res = await fetch("/api/export/activities", { cache: "no-store" });
    const data: ExportPayload = await res.json();
    setRows(data.rows);
    return data.rows;
  }, []);

  useEffect(() => {
    fetch("/api/export/activities", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: ExportPayload) => setRows(data.rows));
  }, []);

  // The export the user clicks. The CSV builder reads `party_size`; the backend
  // now returns `covers`, so this throws and the export fails.
  const runExport = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await fetchRows();
      const csv = buildReservationCsv(data);
      downloadCsv(csv, CSV_FILENAME);
      setPhase("success");
    } catch (err) {
      (window as any).posthog?.capture("$exception", {
        $exception_type: err instanceof MissingFieldError ? "MissingFieldError" : "Error",
        $exception_message: err instanceof Error ? err.message : String(err),
      });
      setPhase("error");
      setErrorMsg(
        err instanceof MissingFieldError
          ? err.message
          : "CSV export failed unexpectedly.",
      );
    } finally {
      setBusy(false);
    }
  }, [busy, fetchRows]);

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

        <ExportPanel
          phase={phase}
          errorMsg={errorMsg}
          rowCount={rows.length}
          busy={busy}
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
  rowCount,
  busy,
  onExport,
}: {
  phase: Phase;
  errorMsg: string;
  rowCount: number;
  busy: boolean;
  onExport: () => void;
}) {
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-pulse-line bg-pulse-card">
      <div className="flex flex-wrap items-center gap-4 px-6 py-5">
        <div>
          <h2 className="font-display text-xl font-bold">Export to CSV</h2>
          <p className="text-sm text-pulse-muted">
            {rowCount || 13} reservations · TableFront
          </p>
        </div>
        <button
          onClick={onExport}
          disabled={busy}
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
  // The on-page preview reads whichever party field is present, so the table
  // still renders even though the strict CSV export breaks on the rename.
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
