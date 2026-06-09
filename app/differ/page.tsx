"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDemoState, clockTime } from "@/components/useDemoState";
import type {
  DemoState,
  Divergence,
  Instance,
  Recommendation,
  Signal,
} from "@/lib/types";

const BEATS = [
  { n: 1, label: "Healthy" },
  { n: 2, label: "Break" },
  { n: 3, label: "Detect" },
  { n: 4, label: "Heal" },
  { n: 5, label: "Isolated" },
];

export default function DifferPage() {
  const { state, apply } = useDemoState(400);
  const [analyzing, setAnalyzing] = useState(false);
  const prevHeal = useRef<string | null>(null);

  const active = state?.instances.find((i) => i.id === state.activeInstanceId);

  // Brief, bounded "analyzing" flourish on entering detect — always resolves
  // to the deterministic recommendation already in state (PRD §7).
  useEffect(() => {
    const hs = active?.healState ?? null;
    if (prevHeal.current !== "detecting" && hs === "detecting") {
      setAnalyzing(true);
      const t = setTimeout(() => setAnalyzing(false), 1400);
      prevHeal.current = hs;
      return () => clearTimeout(t);
    }
    prevHeal.current = hs;
  }, [active?.healState]);

  const captureBreak = useCallback(() => {
    if (active) apply({ action: "capture-break", instanceId: active.id });
  }, [active, apply]);
  const detect = useCallback(() => {
    if (active) apply({ action: "detect", instanceId: active.id });
  }, [active, apply]);
  const heal = useCallback(() => {
    if (active) apply({ action: "heal", instanceId: active.id });
  }, [active, apply]);
  const reset = useCallback(() => apply({ action: "reset" }), [apply]);
  const toggleInstance = useCallback(() => {
    if (!state) return;
    const next = state.activeInstanceId === "A" ? "B" : "A";
    apply({ action: "set-instance", instanceId: next });
  }, [state, apply]);

  // Presenter hotkeys.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key.toLowerCase()) {
        case "b":
          captureBreak();
          break;
        case "d":
          detect();
          break;
        case "h":
          heal();
          break;
        case "t":
          toggleInstance();
          break;
        case "r":
          reset();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [captureBreak, detect, heal, toggleInstance, reset]);

  if (!state || !active) {
    return <div className="min-h-screen bg-differ-bg" />;
  }

  return (
    <div className="min-h-screen bg-differ-bg font-sans text-differ-text">
      <TopBar beat={state.beat} onReset={reset} />

      <div className="mx-auto grid max-w-[1500px] grid-cols-12 gap-4 px-5 py-5">
        {/* LEFT RAIL — fleet, drift, stem */}
        <div className="col-span-12 space-y-4 lg:col-span-3">
          <InstancePanel state={state} onToggle={toggleInstance} />
          <StemPanel state={state} />
        </div>

        {/* CENTER — signal plane + recommendation + adaptation */}
        <div className="col-span-12 space-y-4 lg:col-span-6">
          <SignalFeed signals={state.signals} instances={state.instances} />
          <RecommendationPanel
            state={state}
            active={active}
            analyzing={analyzing}
          />
        </div>

        {/* RIGHT — divergence artifacts + presenter controls */}
        <div className="col-span-12 space-y-4 lg:col-span-3">
          <DivergencePanel divergences={state.divergences} />
          <ControlDeck
            active={active}
            onBreak={captureBreak}
            onDetect={detect}
            onHeal={heal}
            onToggle={toggleInstance}
            onReset={reset}
          />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- top bar */

function TopBar({ beat, onReset }: { beat: number; onReset: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-differ-line bg-differ-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center gap-5 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-md border border-differ-cyan/40 bg-differ-cyan/10">
            <span className="h-2 w-2 rounded-full bg-differ-cyan shadow-[0_0_10px] shadow-differ-cyan" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-base font-bold tracking-tight text-white">
              DIFFER
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-differ-dim">
              self-healing control plane
            </p>
          </div>
        </div>

        <ol className="ml-4 flex items-center gap-1.5">
          {BEATS.map((b) => {
            const done = beat > b.n;
            const current = beat === b.n;
            return (
              <li
                key={b.n}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  current
                    ? "border-differ-cyan/60 bg-differ-cyan/15 text-differ-cyan"
                    : done
                      ? "border-differ-green/30 bg-differ-green/10 text-differ-green"
                      : "border-differ-line text-differ-dim"
                }`}
              >
                <span className="font-mono">{b.n}</span>
                {b.label}
              </li>
            );
          })}
        </ol>

        <button
          onClick={onReset}
          className="ml-auto rounded-md border border-differ-line px-3 py-1.5 font-mono text-xs text-differ-dim transition hover:border-differ-red/50 hover:text-differ-red"
        >
          reset (R)
        </button>
      </div>
    </header>
  );
}

/* ----------------------------------------------------------------- panels */

function Panel({
  title,
  meta,
  children,
  accent,
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={`rounded-xl border bg-differ-panel ${
        accent ? "border-differ-cyan/40" : "border-differ-line"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-differ-line px-4 py-2.5">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-differ-dim">
          {title}
        </h2>
        <div className="ml-auto">{meta}</div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}

function InstancePanel({
  state,
  onToggle,
}: {
  state: DemoState;
  onToggle: () => void;
}) {
  const HEALTH = {
    healthy: "var(--color-differ-green)",
    degraded: "var(--color-differ-red)",
  };
  const STATE_LABEL: Record<string, string> = {
    armed: "armed · latent",
    broken: "export failing",
    detecting: "healing",
    healed: "healed · diverged",
  };
  return (
    <Panel
      title="Instances"
      meta={
        <button
          onClick={onToggle}
          className="rounded border border-differ-line px-2 py-0.5 font-mono text-[10px] text-differ-dim hover:text-differ-text"
        >
          toggle (T)
        </button>
      }
    >
      <ul className="space-y-2">
        {state.instances.map((inst) => {
          const activeRow = inst.id === state.activeInstanceId;
          const hasDiv = state.divergences.some((d) => d.instanceId === inst.id);
          return (
            <li
              key={inst.id}
              className={`rounded-lg border px-3 py-2.5 transition ${
                activeRow
                  ? "border-differ-cyan/50 bg-differ-panel2"
                  : "border-differ-line"
              }`}
            >
              <div className="flex items-center gap-2">
                <Dot color={HEALTH[inst.health]} />
                <span className="font-mono text-sm text-white">
                  instance {inst.id}
                </span>
                <span className="text-xs text-differ-dim">{inst.label}</span>
                {activeRow && (
                  <span className="ml-auto rounded bg-differ-cyan/15 px-1.5 py-0.5 font-mono text-[10px] text-differ-cyan">
                    active
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-2 pl-4 font-mono text-[11px]">
                <span
                  className={
                    inst.healState === "armed"
                      ? "text-differ-dim"
                      : inst.healState === "healed"
                        ? "text-differ-green"
                        : "text-differ-amber"
                  }
                >
                  {STATE_LABEL[inst.healState]}
                </span>
                <span className="text-differ-dim">·</span>
                <span className={hasDiv ? "text-differ-green" : "text-differ-dim"}>
                  {hasDiv ? "1 divergence" : "0 divergences"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function StemPanel({ state }: { state: DemoState }) {
  const healed = state.divergences.length > 0;
  return (
    <Panel title="Stem (canonical source)" accent={healed}>
      <div className="flex items-center gap-2">
        <Dot color="var(--color-differ-green)" />
        <span className="font-display text-lg font-bold text-differ-green">
          UNCHANGED
        </span>
        <span className="ml-auto rounded bg-differ-panel2 px-2 py-0.5 font-mono text-[10px] text-differ-dim">
          read-only
        </span>
      </div>
      <p className="mt-2 font-mono text-[11px] leading-relaxed text-differ-dim">
        builder still references{" "}
        <span className="text-differ-text">{state.stem.csvBuilderField}</span>
        {healed && (
          <>
            {" "}
            — healed instances diverge{" "}
            <span className="text-differ-green">on top</span>, source never
            mutated.
          </>
        )}
      </p>
    </Panel>
  );
}

function SignalFeed({
  signals,
  instances,
}: {
  signals: Signal[];
  instances: Instance[];
}) {
  const label = (id: string) =>
    instances.find((i) => i.id === id)?.label ?? id;
  return (
    <Panel
      title="Signal plane"
      meta={
        <span className="font-mono text-[10px] text-differ-dim">
          {signals.length} signal{signals.length === 1 ? "" : "s"} · clustered by
          session + surface
        </span>
      }
    >
      {signals.length === 0 ? (
        <p className="py-6 text-center font-mono text-xs text-differ-dim">
          feed quiet — no runtime signals captured
        </p>
      ) : (
        <ul className="space-y-2">
          {signals.map((s) => (
            <li
              key={s.id}
              className="animate-signal-in rounded-lg border border-differ-red/30 bg-differ-red/5 px-3 py-2.5"
            >
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <Dot color="var(--color-differ-red)" />
                <span className="text-differ-red">{s.kind}</span>
                <span className="text-differ-dim">{s.sessionKey}</span>
                <span className="ml-auto text-differ-dim">
                  {clockTime(s.capturedAt)}
                </span>
              </div>
              <p className="mt-1.5 pl-4 font-mono text-xs text-differ-text">
                {s.message}
              </p>
              <p className="mt-1 pl-4 font-mono text-[10px] text-differ-dim">
                surface=<span className="text-differ-amber">{s.surface}</span> ·
                instance=<span className="text-white">{s.instanceId}</span> (
                {label(s.instanceId)})
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function RecommendationPanel({
  state,
  active,
  analyzing,
}: {
  state: DemoState;
  active: Instance;
  analyzing: boolean;
}) {
  const rec: Recommendation | undefined = state.recommendations.find(
    (r) => r.instanceId === active.id,
  );
  const healed = active.healState === "healed";

  if (active.healState === "armed" || active.healState === "broken") {
    return (
      <Panel title="Recommendation engine">
        <p className="py-8 text-center font-mono text-xs text-differ-dim">
          {active.healState === "broken"
            ? "signal captured — run detect to derive remediation"
            : "no active cluster"}
        </p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Recommendation engine"
      accent
      meta={
        rec && !analyzing ? (
          <span className="font-mono text-[10px] text-differ-cyan">
            confidence {(rec.confidence * 100).toFixed(0)}%
          </span>
        ) : null
      }
    >
      {analyzing || !rec ? (
        <Analyzing />
      ) : (
        <div className="animate-signal-in space-y-4">
          <p className="text-sm leading-relaxed text-differ-text">
            {rec.diagnosis}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <MismatchCard label="expected by frontend" value={rec.mismatch.expected} tone="red" />
            <MismatchCard label="found in payload" value={rec.mismatch.found} tone="amber" />
          </div>

          <div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-differ-dim">
              adaptation · field-remap
            </p>
            <pre className="overflow-x-auto rounded-lg border border-differ-line bg-differ-bg p-3 font-mono text-xs leading-relaxed">
              <code>
                <span className="text-differ-dim">{"// stem (unchanged)\n"}</span>
                <span className="text-differ-red">
                  {`- row.${rec.mismatch.expected}`}
                  <span className="text-differ-dim">
                    {"   // undefined under drift\n"}
                  </span>
                </span>
                <span className="text-differ-green">
                  {`+ row.${rec.mismatch.expected} ??= row.${rec.mismatch.found}`}
                  <span className="text-differ-dim">{"  // divergence v1\n"}</span>
                </span>
              </code>
            </pre>
          </div>

          {!healed && (
            <p className="font-mono text-[11px] text-differ-cyan">
              ▸ remediation ready · awaiting adaptation-plane apply (H)
            </p>
          )}
          {healed && (
            <p className="font-mono text-[11px] text-differ-green">
              ✓ applied autonomously · no human approval · instance {active.id} only
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}

function Analyzing() {
  const steps = [
    "clustering signals by session + surface",
    "diffing payload against expected contract",
    "matching renamed field by value compatibility",
    "deriving deterministic field-remap",
  ];
  return (
    <div className="space-y-3 py-2">
      <div className="relative h-1 overflow-hidden rounded-full bg-differ-line">
        <div className="absolute inset-y-0 w-1/3 animate-scan rounded-full bg-differ-cyan" />
      </div>
      <ul className="space-y-1.5 font-mono text-xs text-differ-dim">
        {steps.map((s, i) => (
          <li
            key={s}
            className="animate-signal-in flex items-center gap-2"
            style={{ animationDelay: `${i * 180}ms` }}
          >
            <span className="text-differ-cyan">▸</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MismatchCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "red" | "amber";
}) {
  const color = tone === "red" ? "text-differ-red" : "text-differ-amber";
  const border = tone === "red" ? "border-differ-red/30" : "border-differ-amber/30";
  return (
    <div className={`rounded-lg border ${border} bg-differ-bg px-3 py-2.5`}>
      <p className="font-mono text-[10px] uppercase tracking-wide text-differ-dim">
        {label}
      </p>
      <p className={`mt-1 font-mono text-sm ${color}`}>{value}</p>
    </div>
  );
}

function DivergencePanel({ divergences }: { divergences: Divergence[] }) {
  return (
    <Panel
      title="Divergence artifacts"
      meta={
        <span className="font-mono text-[10px] text-differ-dim">
          {divergences.length} · immutable
        </span>
      }
    >
      {divergences.length === 0 ? (
        <p className="py-6 text-center font-mono text-xs text-differ-dim">
          none — no instance has diverged from stem
        </p>
      ) : (
        <ul className="space-y-2">
          {divergences.map((d) => (
            <li
              key={d.id}
              className="animate-signal-in rounded-lg border border-differ-green/30 bg-differ-green/5 px-3 py-2.5"
            >
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="rounded bg-differ-green/15 px-1.5 py-0.5 text-differ-green">
                  {d.version}
                </span>
                <span className="text-white">instance {d.instanceId}</span>
                <span className="ml-auto text-differ-dim">🔒 immutable</span>
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-differ-text">
                {d.transform.type}:{" "}
                <span className="text-differ-amber">{d.transform.from}</span>
                <span className="text-differ-dim"> → </span>
                <span className="text-differ-green">{d.transform.to}</span>
              </p>
              <p className="mt-1 font-mono text-[10px] text-differ-dim">
                surface={d.surface} · scoped to instance {d.instanceId} ·{" "}
                {clockTime(d.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------- control deck */

function ControlDeck({
  active,
  onBreak,
  onDetect,
  onHeal,
  onToggle,
  onReset,
}: {
  active: Instance;
  onBreak: () => void;
  onDetect: () => void;
  onHeal: () => void;
  onToggle: () => void;
  onReset: () => void;
}) {
  // The single highlighted "next" action guides the presenter through the beats.
  const next =
    active.healState === "armed"
      ? "break"
      : active.healState === "broken"
        ? "detect"
        : active.healState === "detecting"
          ? "heal"
          : "toggle";

  const Btn = ({
    id,
    label,
    hint,
    onClick,
    tone = "neutral",
  }: {
    id: string;
    label: string;
    hint: string;
    onClick: () => void;
    tone?: "neutral" | "red" | "cyan" | "green";
  }) => {
    const primary = next === id;
    const toneRing =
      tone === "red"
        ? "border-differ-red/50 text-differ-red"
        : tone === "green"
          ? "border-differ-green/50 text-differ-green"
          : tone === "cyan"
            ? "border-differ-cyan/50 text-differ-cyan"
            : "border-differ-line text-differ-text";
    return (
      <button
        onClick={onClick}
        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${toneRing} ${
          primary
            ? "bg-differ-panel2 ring-1 ring-inset ring-current animate-pulse-ring"
            : "bg-differ-panel hover:bg-differ-panel2"
        }`}
      >
        <span className="grid h-6 w-6 place-items-center rounded border border-current font-mono text-xs">
          {hint}
        </span>
        <span className="font-mono text-sm">{label}</span>
        {primary && (
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider opacity-80">
            next
          </span>
        )}
      </button>
    );
  };

  return (
    <Panel title="Presenter controls">
      <div className="space-y-2">
        <Btn id="break" label="Trigger export break" hint="B" tone="red" onClick={onBreak} />
        <Btn id="detect" label="Detect (signal → rec)" hint="D" tone="cyan" onClick={onDetect} />
        <Btn id="heal" label="Heal (apply divergence)" hint="H" tone="green" onClick={onHeal} />
        <div className="my-2 h-px bg-differ-line" />
        <Btn id="toggle" label="Reveal other instance" hint="T" onClick={onToggle} />
        <Btn id="reset" label="Reset · re-arm break" hint="R" onClick={onReset} />
      </div>
      <p className="mt-3 font-mono text-[10px] leading-relaxed text-differ-dim">
        every beat is presenter-triggered. keys work anywhere on this view. the
        glowing control is the next narrative step.
      </p>
    </Panel>
  );
}
