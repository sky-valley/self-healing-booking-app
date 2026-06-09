// STEM — the canonical source. Read-only in the demo.
// The CSV builder in the stem still references the pre-drift field. Healing
// happens via divergence ON TOP of the stem; the stem itself is never written.

import type { Stem } from "@/lib/types";

export const STEM: Stem = {
  mutated: false,
  csvBuilderField: "party_size",
  description:
    "lib/csv: row => [date, time, guest, row.party_size, area, status]",
};
