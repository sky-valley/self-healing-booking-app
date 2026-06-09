// CSV builder for the reservations export. It reads `row.party_size`.
//
// The reservations API was changed to return `covers` (a backend field rename),
// so `party_size` is now undefined and this throws — the real, user-visible
// break on the export surface.

export class MissingFieldError extends Error {
  constructor(public field: string) {
    super(
      `CSV export failed: expected field "${field}" was undefined for one or more rows.`,
    );
    this.name = "MissingFieldError";
  }
}

export const CSV_COLUMNS = [
  "date",
  "time",
  "guest",
  "party_size",
  "area",
  "status",
] as const;

type RawRow = Record<string, unknown>;

/** Build the reservations CSV, reading `party_size` from each row. */
export function buildReservationCsv(rows: RawRow[]): string {
  const lines = [CSV_COLUMNS.join(",")];
  for (const row of rows) {
    const party = row.party_size;
    if (party === undefined) throw new MissingFieldError("party_size");
    lines.push(
      [row.date, row.time, row.guest, party, row.area, row.status].join(","),
    );
  }
  return lines.join("\n");
}
