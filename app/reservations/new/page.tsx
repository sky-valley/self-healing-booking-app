import { PulseChrome } from "@/components/PulseChrome";
import { createBooking } from "./actions";

// Server Component. The <form action={createBooking}> wires a Server Action;
// submitting it throws on the server (routeType: 'action'). The thrown error
// is caught by the segment boundary in ./error.tsx.
export default function NewBookingPage() {
  return (
    <PulseChrome>
      <div className="animate-rise max-w-xl">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">
          New booking
        </h1>
        <p className="mt-2 text-lg text-pulse-muted">
          Add a reservation. Saving calls a{" "}
          <span className="font-semibold text-pulse-ink">Server Action</span>,
          which throws on the write — the{" "}
          <code className="font-mono text-sm">routeType: &apos;action&apos;</code>{" "}
          capture lane.
        </p>

        <form
          action={createBooking}
          className="mt-8 space-y-5 rounded-2xl border border-pulse-line bg-pulse-card p-6"
        >
          <Field label="Guest name">
            <input
              name="guest"
              required
              defaultValue="Okafor"
              className="w-full rounded-lg border border-pulse-line bg-pulse-bg px-3 py-2 text-sm outline-none focus:border-pulse-ink"
            />
          </Field>

          <div className="flex gap-4">
            <Field label="Party size">
              <input
                name="partySize"
                type="number"
                min={1}
                defaultValue={4}
                className="w-full rounded-lg border border-pulse-line bg-pulse-bg px-3 py-2 text-sm tabular-nums outline-none focus:border-pulse-ink"
              />
            </Field>
            <Field label="Area">
              <select
                name="area"
                defaultValue="Patio"
                className="w-full rounded-lg border border-pulse-line bg-pulse-bg px-3 py-2 text-sm outline-none focus:border-pulse-ink"
              >
                <option>Patio</option>
                <option>Bar</option>
                <option>Main</option>
                <option>Private</option>
              </select>
            </Field>
          </div>

          <button
            type="submit"
            className="rounded-full bg-pulse-ink px-6 py-3 font-display text-base font-bold text-pulse-bg transition hover:opacity-90"
          >
            Save reservation
          </button>
        </form>
      </div>
    </PulseChrome>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block flex-1">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-pulse-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
