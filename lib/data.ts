// Seed data for TableFront. In-memory only — persistence is not the point.

export interface SummaryStat {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
}

export interface ReservationSummary {
  time: string;
  guest: string;
  partySize: number;
  area: string;
  status: "confirmed" | "seated" | "completed" | "no-show";
}

/** Powers the dashboard via /api/summary. This shape NEVER drifts. */
export const SUMMARY = {
  venue: { name: "Marlowe", coversTonight: 86, floorPct: 92 },
  stats: [
    { label: "Tonight's covers", value: "86", delta: "+12 vs last Fri", trend: "up" },
    { label: "Reservations", value: "32", delta: "+4", trend: "up" },
    { label: "Seated now", value: "18", delta: "live", trend: "flat" },
    { label: "Avg party", value: "3.4", delta: "+0.2", trend: "up" },
  ] as SummaryStat[],
  recent: [
    { time: "6:00 PM", guest: "Okafor", partySize: 4, area: "Patio", status: "confirmed" },
    { time: "6:30 PM", guest: "Reyes", partySize: 2, area: "Bar", status: "seated" },
    { time: "7:00 PM", guest: "Chen", partySize: 6, area: "Main", status: "confirmed" },
    { time: "7:15 PM", guest: "Nguyen", partySize: 3, area: "Patio", status: "confirmed" },
    { time: "8:00 PM", guest: "Alvarez", partySize: 2, area: "Bar", status: "confirmed" },
  ] as ReservationSummary[],
};

/**
 * The full reservation ledger served by /api/export/activities.
 * The `covers` key here is the POST-RENAME (drifted) shape. The drift flag
 * in the API route decides whether rows are emitted as `covers` (drift on)
 * or `party_size` (legacy, pre-rename).
 */
export interface ReservationRecord {
  date: string;
  time: string;
  guest: string;
  covers: number;
  area: string;
  status: "confirmed" | "seated" | "completed" | "no-show";
}

export const RESERVATIONS: ReservationRecord[] = [
  { date: "2026-06-09", time: "6:00 PM", guest: "Okafor", covers: 4, area: "Patio", status: "confirmed" },
  { date: "2026-06-09", time: "7:00 PM", guest: "Chen", covers: 6, area: "Main", status: "confirmed" },
  { date: "2026-06-08", time: "8:15 PM", guest: "Reyes", covers: 2, area: "Bar", status: "completed" },
  { date: "2026-06-07", time: "7:30 PM", guest: "Nguyen", covers: 3, area: "Patio", status: "completed" },
  { date: "2026-06-06", time: "6:45 PM", guest: "Alvarez", covers: 5, area: "Main", status: "completed" },
  { date: "2026-06-06", time: "9:00 PM", guest: "Park", covers: 2, area: "Bar", status: "no-show" },
  { date: "2026-06-05", time: "7:00 PM", guest: "Hughes", covers: 4, area: "Main", status: "completed" },
  { date: "2026-06-04", time: "6:15 PM", guest: "Delgado", covers: 8, area: "Private", status: "completed" },
  { date: "2026-06-03", time: "8:00 PM", guest: "Ferreira", covers: 2, area: "Patio", status: "completed" },
  { date: "2026-06-01", time: "7:45 PM", guest: "Sato", covers: 3, area: "Bar", status: "completed" },
  { date: "2026-05-31", time: "6:30 PM", guest: "Brooks", covers: 4, area: "Main", status: "completed" },
  { date: "2026-05-30", time: "9:15 PM", guest: "Idris", covers: 2, area: "Bar", status: "completed" },
  { date: "2026-05-29", time: "7:00 PM", guest: "Costa", covers: 6, area: "Private", status: "completed" },
];
