// SIGNAL PLANE (simulated)
// Captures implicit runtime signals where failures actually happen — in the
// user's hands — and clusters them by session + surface. In the real platform
// this is a distributed ingestion plane; here it is a pure, in-memory seam.

import type { Signal, SignalCluster, Surface } from "@/lib/types";

export interface CaptureInput {
  instanceId: string;
  surface: Surface;
  sessionKey: string;
  message: string;
  missingField?: string;
}

export interface SignalPlane {
  capture(input: CaptureInput, id: string, capturedAt: string): Signal;
  cluster(signals: Signal[]): SignalCluster[];
}

export const signalPlane: SignalPlane = {
  capture(input, id, capturedAt) {
    return {
      id,
      capturedAt,
      instanceId: input.instanceId,
      surface: input.surface,
      sessionKey: input.sessionKey,
      kind: "runtime-error",
      message: input.message,
      missingField: input.missingField,
    };
  },

  // Group signals by their stable session+surface key. One cluster per
  // (sessionKey, surface, instance) — the unit Differ reasons over.
  cluster(signals) {
    const byKey = new Map<string, Signal[]>();
    for (const s of signals) {
      const key = `${s.instanceId}::${s.sessionKey}::${s.surface}`;
      const bucket = byKey.get(key) ?? [];
      bucket.push(s);
      byKey.set(key, bucket);
    }
    return [...byKey.entries()].map(([key, bucket]) => ({
      id: `cluster-${key}`,
      sessionKey: bucket[0].sessionKey,
      surface: bucket[0].surface,
      instanceId: bucket[0].instanceId,
      signalIds: bucket.map((s) => s.id),
      count: bucket.length,
    }));
  },
};
