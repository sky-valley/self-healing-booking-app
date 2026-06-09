// In-memory demo store — the single source of truth both the user view and the
// Differ operator view poll. A module-level singleton (parked on globalThis so
// it survives dev HMR). No database: persistence is explicitly not the point.

import type { DemoState, Drift, Instance } from "@/lib/types";
import { signalPlane } from "@/lib/differ/signal-plane";
import { recommendationEngine } from "@/lib/differ/recommendation";
import { adaptationPlane } from "@/lib/differ/adaptation-plane";
import { STEM } from "@/lib/differ/stem";

const DRIFT: Drift = {
  enabled: true, // demo starts drifted: the break is already latent
  surface: "export",
  expectedField: "party_size",
  actualField: "covers",
  // The rename "happened 3 weeks ago" relative to the demo date (2026-06-09).
  changedAt: "2026-05-18T09:14:00.000Z",
};

function freshInstances(): Instance[] {
  return [
    {
      id: "A",
      label: "Marlowe — SF",
      hitExport: false,
      health: "healthy",
      healState: "armed",
    },
    {
      id: "B",
      label: "Toscano — LA",
      hitExport: false,
      health: "healthy",
      healState: "armed",
    },
  ];
}

function freshState(): DemoState {
  return {
    beat: 1,
    drift: { ...DRIFT },
    instances: freshInstances(),
    activeInstanceId: "A",
    signals: [],
    clusters: [],
    recommendations: [],
    divergences: [],
    stem: { ...STEM },
  };
}

interface StoreHolder {
  state: DemoState;
  seq: number;
}

const g = globalThis as unknown as { __differDemo?: StoreHolder };
const holder: StoreHolder = (g.__differDemo ??= { state: freshState(), seq: 0 });

function nextId(prefix: string): string {
  holder.seq += 1;
  return `${prefix}-${holder.seq}`;
}

function now(): string {
  return new Date().toISOString();
}

function instance(id: string): Instance | undefined {
  return holder.state.instances.find((i) => i.id === id);
}

export const store = {
  get(): DemoState {
    return holder.state;
  },

  reset(): DemoState {
    holder.state = freshState();
    return holder.state;
  },

  setActiveInstance(id: string): DemoState {
    if (instance(id)) holder.state.activeInstanceId = id;
    // Revealing the second, untouched instance is beat 5.
    if (id !== "A") holder.state.beat = Math.max(holder.state.beat, 5);
    return holder.state;
  },

  /**
   * Beat 2 — the cold path is hit and fails. The client reports the runtime
   * error; the signal plane captures it as an implicit signal.
   */
  captureBreak(instanceId: string): DemoState {
    const inst = instance(instanceId);
    if (!inst) return holder.state;
    inst.hitExport = true;

    // Don't re-capture an already-broken/healed instance.
    if (inst.healState === "armed") {
      const signal = signalPlane.capture(
        {
          instanceId,
          surface: "export",
          sessionKey: `sess-${instanceId.toLowerCase()}-export`,
          message:
            "TypeError in CSV builder: reading 'toString' of undefined (party_size)",
          missingField: "party_size",
        },
        nextId("sig"),
        now(),
      );
      holder.state.signals.push(signal);
      inst.healState = "broken";
      inst.health = "degraded";
    }
    holder.state.beat = Math.max(holder.state.beat, 2);
    return holder.state;
  },

  /**
   * Beat 3 — autonomous detection. Cluster the instance's signals, derive the
   * deterministic recommendation. No human approval step.
   */
  detect(instanceId: string): DemoState {
    const inst = instance(instanceId);
    if (!inst || inst.healState !== "broken") return holder.state;

    const instanceSignals = holder.state.signals.filter(
      (s) => s.instanceId === instanceId,
    );
    const clusters = signalPlane.cluster(instanceSignals);
    const cluster = clusters.find((c) => c.surface === "export");
    if (!cluster) return holder.state;

    // Replace any prior cluster/recommendation for this instance (idempotent).
    holder.state.clusters = [
      ...holder.state.clusters.filter((c) => c.instanceId !== instanceId),
      cluster,
    ];
    const rec = recommendationEngine.derive(cluster, holder.state.drift, nextId("rec"));
    holder.state.recommendations = [
      ...holder.state.recommendations.filter((r) => r.instanceId !== instanceId),
      rec,
    ];

    inst.healState = "detecting";
    holder.state.beat = Math.max(holder.state.beat, 3);
    return holder.state;
  },

  /**
   * Beat 4 — autonomous heal. The adaptation plane materializes an immutable,
   * instance-scoped divergence artifact. The stem is never touched.
   */
  heal(instanceId: string): DemoState {
    const inst = instance(instanceId);
    if (!inst) return holder.state;

    // Be forgiving on stage: if detect was skipped, run it inline.
    if (inst.healState === "broken") this.detect(instanceId);
    if (inst.healState !== "detecting") return holder.state;

    const rec = holder.state.recommendations.find((r) => r.instanceId === instanceId);
    if (!rec) return holder.state;

    if (!holder.state.divergences.some((d) => d.instanceId === instanceId)) {
      const divergence = adaptationPlane.apply(rec, nextId("div"), now());
      holder.state.divergences.push(divergence);
    }

    inst.healState = "healed";
    inst.health = "healthy"; // export surface restored for this instance
    holder.state.beat = Math.max(holder.state.beat, 4);
    return holder.state;
  },

  /** Divergences scoped to one instance — what the client applies before CSV build. */
  divergencesFor(instanceId: string) {
    return holder.state.divergences.filter((d) => d.instanceId === instanceId);
  },
};
