# TableFront — Differ self-healing demo (CSV export / internal drift)

A stage-ready demo: **Differ autonomously heals a frontend break caused by a
backend contract change, on a cold path nobody noticed was broken.**

TableFront is a (simulated) restaurant-reservations back-office. A backend field
rename (`party_size` → `covers`) shipped three weeks ago as a plausible cleanup.
The dashboard never touches that field, so the app looks perfectly healthy —
until someone clicks **Export to CSV** on the reservation ledger. Differ detects
the failure *where it actually happens* (in the operator's hands), heals **that
tenant's instance only** via an immutable divergence artifact, and leaves the
canonical source (the **stem**) and every other tenant untouched.

---

## Run it

```bash
npm install
npm run dev          # http://localhost:3000   (dev — has the small Next.js dev badge)
# or, for a clean stage build with no dev chrome:
npm run build && npm run start
```

No network required at runtime. Fonts are self-hosted at build time; the only
calls are same-origin `/api/*`. Works on conference wifi / fully offline.

### The two views (open both, side by side)

| Route      | Surface                  | Who looks at it                       |
| ---------- | ------------------------ | ------------------------------------- |
| `/`        | TableFront dashboard     | the audience — looks healthy all demo |
| `/history` | TableFront reservation ledger | where the operator clicks **Export** |
| `/differ`  | Differ operator view     | the **presenter** — drives every beat |

Put `/history` (or `/`) on the projector and `/differ` on your laptop. Both
poll shared state, so they stay in lockstep.

---

## Presenter cheat sheet

Everything is **presenter-triggered** from `/differ` — no timers that can desync
from your talk. The **glowing control is always the next narrative step.**

| Key | Action                          | Beat |
| --- | ------------------------------- | ---- |
| `B` | Trigger export break            | 2    |
| `D` | Detect (signal → recommendation)| 3    |
| `H` | Heal (apply divergence)         | 4    |
| `T` | Reveal the other tenant (B)     | 5    |
| `R` | Reset · re-arm the latent break | —    |

You can also click **Export to CSV** on `/history` to trigger the break naturally
(equivalent to `B`). The heal then auto-retries the export and a valid CSV
downloads on the operator's screen.

### Run of show

1. **Healthy** — `/` and `/history` look fine. `/differ` shows the drift badge:
   *"detected 3 weeks ago · 0 user impact."*
   > "Here's the app. Looks fine. It is fine — for everything most people do."
2. **Break** — click **Export to CSV** (or `B`). Big red *Export failed* panel;
   the dashboard stays green. Signal plane lights up.
   > "This didn't break today. The contract changed three weeks ago — but nobody
   > opens this screen until they need it. The first to find out is the user who
   > needed it."
3. **Detect** (`D`) — signal-plane clusters by session + surface; the
   recommendation engine derives the mismatch (`party_size` absent, `covers`
   present) and the remap. Brief analyzing flourish, deterministic result. No
   approval step.
   > "Differ saw the failure where it actually happened — not in a dashboard, in
   > the user's hands."
4. **Heal** (`H`) — the adaptation plane materializes an immutable, instance-
   scoped divergence. The export auto-retries and a valid CSV downloads.
   > "It fixed it. Per instance. Seconds, not a sprint."
5. **Isolated** (`T`) — Tenant B (never hit export) shows **0 divergences**;
   the divergence list has exactly one entry scoped to A; **stem: UNCHANGED.**
   > "The source never changed. We didn't ship a release to every restaurant for
   > a bug a few of them hit. We healed the ones who hit it."

Press `R` to re-arm and run it again.

---

## How it's built (and where the real platform drops in)

The Differ planes are **simulated behind clean interfaces** — swappable seams, so
this reads as a thin layer over the real stack, not a toy.

```
lib/
  store.ts                 in-memory orchestration (the demo's single source of truth)
  csv.ts                   the STEM's CSV builder — reads `party_size`, throws on drift
  data.ts                  seed reservation + summary data
  differ/
    signal-plane.ts        capture(runtime error) + cluster(by session + surface)
    recommendation.ts      derive(cluster) -> deterministic field-remap  (NO live LLM)
    adaptation-plane.ts    apply(recommendation) -> immutable, instance-scoped divergence
    stem.ts                the canonical source — read-only, never mutated
app/api/
  summary/                 /api/summary            stable, never drifts (powers dashboard)
  export/activities/       /api/export/activities  drift-controlled (powers the cold path)
  state/  control/         demo state + presenter actions
```

To wire the real platform, replace each `lib/differ/*` implementation at its
interface — the views and store are written against the interfaces, not the
simulations.

### Reliability (PRD §7)

- **No live LLM in the hot path.** The remediation for this scenario is known and
  pre-defined; detect resolves to the same field-remap every time. The
  "analyzing" animation is cosmetic and bounded (~1.4s).
- **The heal always succeeds.** The post-heal retry builds the CSV with a guard
  (`buildReservationCsv(..., guaranteed: true)`) that backfills any unexpected
  missing value, so a valid file downloads even if something upstream is off.
- **Fully autonomous.** Detect -> heal apply no human approval. The presenter only
  paces the beats for narration.

### The drift switch

`/api/export/activities` emits `covers` (post-rename, **demo default**) or
`party_size` (legacy) based on `drift.enabled` in `lib/store.ts`. The demo starts
drifted, so the break is already latent on load.
