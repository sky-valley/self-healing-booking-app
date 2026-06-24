import { PulseChrome } from "@/components/PulseChrome";
import { ClientFaults } from "@/components/ClientFaults";
import { FAULT_GROUPS, faultsByGroup } from "@/lib/faults";

// Fault Lab — the home base for every deliberate fault. Server-rendered catalog
// (from lib/faults.ts) plus the interactive client triggers.
export default function FaultLabPage() {
  return (
    <PulseChrome>
      <div className="animate-rise">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-pulse-muted">
          Differ testbed
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
          Fault Lab
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-pulse-muted">
          Every deliberate fault, by capture lane. Each one is real and uncaught
          so the error-capture infra observes it end to end.
        </p>

        <div className="mt-8 space-y-8">
          {FAULT_GROUPS.map((group) => (
            <section key={group}>
              <h2 className="font-display text-2xl font-bold">{group}</h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-pulse-line bg-pulse-card">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-pulse-line text-xs uppercase tracking-wide text-pulse-muted">
                      <th className="px-5 py-3 font-semibold">Fault</th>
                      <th className="px-5 py-3 font-semibold">Capture lane</th>
                      <th className="px-5 py-3 font-semibold">How to replicate</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pulse-line">
                    {faultsByGroup(group).map((f) => (
                      <tr key={f.id} className="align-top hover:bg-pulse-bg">
                        <td className="px-5 py-3 font-semibold">{f.title}</td>
                        <td className="px-5 py-3 font-mono text-xs text-pulse-muted">
                          {f.capture}
                        </td>
                        <td className="px-5 py-3 text-pulse-ink/80">
                          <ol className="list-decimal space-y-0.5 pl-4">
                            {f.steps.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ol>
                        </td>
                        <td className="px-5 py-3">
                          {f.href && (
                            <a
                              href={f.href}
                              className="inline-block rounded-full bg-pulse-ink px-4 py-1.5 text-xs font-semibold text-pulse-bg transition hover:opacity-90"
                            >
                              {f.cta ?? "Go"}
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          <ClientFaults />
        </div>
      </div>
    </PulseChrome>
  );
}
