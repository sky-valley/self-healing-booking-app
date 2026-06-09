// ADAPTATION PLANE (simulated)
// Turns a recommendation into a divergence version + immutable divergence
// artifact, scoped to a single instance — WITHOUT mutating the stem. This is
// the moat: the heal is a per-instance divergence layered on top of canonical
// source, not an edit to shared code.

import type { Divergence, Recommendation } from "@/lib/types";

export interface AdaptationPlane {
  apply(rec: Recommendation, id: string, createdAt: string): Divergence;
}

export const adaptationPlane: AdaptationPlane = {
  apply(rec, id, createdAt) {
    return Object.freeze({
      id,
      version: "v1",
      instanceId: rec.instanceId,
      surface: rec.surface,
      createdAt,
      immutable: true as const,
      recommendationId: rec.id,
      transform: rec.transform,
    });
  },
};
