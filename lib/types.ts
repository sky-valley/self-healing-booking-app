// Shared domain types for the Differ self-healing CSV-export demo.
// These names deliberately mirror Differ's real architecture vocabulary
// (signal plane / recommendation / adaptation plane / divergence / stem)
// so the demo reads as a thin layer over the real platform.

export type Surface = "dashboard" | "export";

export type InstanceHealth = "healthy" | "degraded";

/** Per-instance lifecycle of the cold export path. */
export type HealState =
  | "armed" //   latent break present, never exercised
  | "broken" //  export was hit and failed; signal captured
  | "detecting" // signal clustered, recommendation being derived
  | "healed"; //  divergence applied, export works for this instance

export interface Instance {
  id: string;
  label: string;
  /** Has this instance ever exercised the export path? */
  hitExport: boolean;
  health: InstanceHealth;
  healState: HealState;
}

/** A backend contract change that drifted away from what the frontend expects. */
export interface Drift {
  enabled: boolean;
  surface: Surface;
  /** Field name the frontend's CSV builder still reads. */
  expectedField: string;
  /** Field name the backend now returns instead. */
  actualField: string;
  /** When the rename shipped — powers the "3 weeks ago, 0 user impact" story. */
  changedAt: string;
}

/** An implicit runtime signal captured by the signal plane. */
export interface Signal {
  id: string;
  capturedAt: string;
  instanceId: string;
  surface: Surface;
  /** Stable clustering key — session + surface. */
  sessionKey: string;
  kind: "runtime-error";
  message: string;
  /** The field access that returned undefined, if known. */
  missingField?: string;
}

/** A cluster of signals the signal plane has grouped by session + surface. */
export interface SignalCluster {
  id: string;
  sessionKey: string;
  surface: Surface;
  instanceId: string;
  signalIds: string[];
  count: number;
}

/** The remediation derived from a cluster. Deterministic, pre-defined for this scenario. */
export interface Recommendation {
  id: string;
  clusterId: string;
  instanceId: string;
  surface: Surface;
  /** Plain-language diagnosis for the operator view. */
  diagnosis: string;
  /** The contract mismatch, in concrete field terms. */
  mismatch: { expected: string; found: string };
  /** The transform the adaptation plane will materialize. */
  transform: FieldRemap;
  confidence: number;
}

/** A declarative, immutable transform spec. Interpreted, never code-injected. */
export interface FieldRemap {
  type: "field-remap";
  /** Source field present in the drifted payload. */
  from: string;
  /** Field name the stem's CSV builder expects. */
  to: string;
}

/** An immutable divergence artifact scoped to exactly one instance. */
export interface Divergence {
  id: string;
  version: string;
  instanceId: string;
  surface: Surface;
  createdAt: string;
  immutable: true;
  recommendationId: string;
  transform: FieldRemap;
}

/** The canonical source. Read-only in the demo; must stay visibly unchanged. */
export interface Stem {
  mutated: false;
  /** The field the canonical CSV builder references — never rewritten. */
  csvBuilderField: string;
  description: string;
}

export interface DemoState {
  /** 1..5 — the narrative beat the presenter has reached. */
  beat: number;
  drift: Drift;
  instances: Instance[];
  activeInstanceId: string;
  signals: Signal[];
  clusters: SignalCluster[];
  recommendations: Recommendation[];
  divergences: Divergence[];
  stem: Stem;
}
