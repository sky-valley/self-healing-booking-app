// CSV builder — this is the STEM's view of the export. It reads
// `row.party_size`, the pre-drift field name. When the backend drifts
// (`party_size` -> `covers`), this throws, producing the visible break.
//
// Divergences are applied as a pre-pass on top of the raw rows. The builder
// itself is never changed — that is the point. The stem still reads
// `party_size`; a divergence makes that field present for one instance.

import type { Divergence, FieldRemap } from "@/lib/types";

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

/** Apply instance-scoped divergence transforms to raw rows (immutable copies). */
export function applyDivergences(rows: RawRow[], divergences: Divergence[]): RawRow[] {
  const remaps = divergences
    .map((d) => d.transform)
    .filter((t): t is FieldRemap => t.type === "field-remap");
  if (remaps.length === 0) return rows;

  return rows.map((row) => {
    const next = { ...row };
    for (const { from, to } of remaps) {
      if (next[to] === undefined && next[from] !== undefined) {
        next[to] = next[from];
      }
    }
    return next;
  });
}

/**
 * Build the CSV exactly as the stem does — reading `party_size`.
 *
 * Pre-heal (no divergence) against drifted data: `party_size` is undefined and
 * this THROWS — the legible, dramatic break.
 *
 * @param guaranteed When true (the post-heal retry path, PRD §7), a final
 *   guard backfills any still-missing value so the export ALWAYS yields a valid
 *   CSV on stage, even if something upstream is unexpected.
 */
export function buildReservationCsv(
  rows: RawRow[],
  divergences: Divergence[],
  guaranteed = false,
): string {
  const adapted = applyDivergences(rows, divergences);

  const lines = [CSV_COLUMNS.join(",")];
  for (const row of adapted) {
    let party = row.party_size; // <- the stem reads this exact field
    if (party === undefined) {
      if (!guaranteed) throw new MissingFieldError("party_size");
      // Heal guard: never ship a broken file once we've committed to healing.
      party = row.covers ?? 0;
    }
    lines.push(
      [row.date, row.time, row.guest, party, row.area, row.status].join(","),
    );
  }
  return lines.join("\n");
}
