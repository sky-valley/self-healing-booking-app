// RECOMMENDATION (simulated, deterministic)
// From a signal cluster, derive the contract mismatch and the remediation.
//
// STAGE RELIABILITY (PRD §7): the remediation for this scenario is known and
// pre-defined. There is NO live LLM call in the hot path — detecting a missing
// expected field alongside a present renamed field resolves to the known-good
// field-remap every time. The operator view may animate "analyzing", but what
// the audience sees is always this deterministic result.

import type { Recommendation, SignalCluster, Drift } from "@/lib/types";

export interface RecommendationEngine {
  derive(
    cluster: SignalCluster,
    drift: Drift,
    id: string,
  ): Recommendation;
}

export const recommendationEngine: RecommendationEngine = {
  derive(cluster, drift, id) {
    const expected = drift.expectedField; // calories_burned
    const found = drift.actualField; // calories

    return {
      id,
      clusterId: cluster.id,
      instanceId: cluster.instanceId,
      surface: cluster.surface,
      diagnosis:
        `Export payload is missing expected field "${expected}". ` +
        `A renamed field "${found}" is present with a compatible value. ` +
        `This is a backend contract drift on the "${cluster.surface}" surface.`,
      mismatch: { expected, found },
      transform: { type: "field-remap", from: found, to: expected },
      confidence: 0.99,
    };
  },
};
