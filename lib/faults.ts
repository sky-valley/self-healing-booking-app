// Single source of truth for every deliberate fault in this testbed.
//
// Both the on-screen post-it (components/FaultPostit.tsx) and the Fault Lab
// page (app/faults/page.tsx) render from this list, so the "how to replicate"
// instructions can never drift from the actual triggers. Plain data only — no
// JSX — so it's importable from both server and client components.

export type FaultGroup = "Server" | "Client" | "Data";

export interface Fault {
  id: string;
  /** Short human title. */
  title: string;
  group: FaultGroup;
  /** What the capture infra observes, e.g. "onRequestError · routeType: route". */
  capture: string;
  /** Step-by-step: where to click / what to do to fire it. */
  steps: string[];
  /** Optional direct link (use a full-page nav for server 500s). */
  href?: string;
  /** Label for the link. */
  cta?: string;
  /** True when the trigger lives as a button on the Fault Lab page. */
  inLab?: boolean;
}

export const FAULTS: Fault[] = [
  // ---- Server lanes (onRequestError) ----
  {
    id: "api-500",
    title: "API route 500",
    group: "Server",
    capture: "onRequestError · routeType: route · node",
    steps: [
      "Dashboard → Fault injection → click “Throw a 500”.",
      "Or open /api/boom directly.",
    ],
    href: "/api/boom?label=postit",
    cta: "Hit /api/boom",
  },
  {
    id: "render-500",
    title: "Page render 500",
    group: "Server",
    capture: "onRequestError · routeType: render · node",
    steps: ["Open the /boom page (throws during server render)."],
    href: "/boom",
    cta: "Open /boom",
  },
  {
    id: "edge-500",
    title: "Edge-runtime 500",
    group: "Server",
    capture: "onRequestError · routeType: route · edge",
    steps: ["Open /api/boom-edge (throws inside the Edge runtime)."],
    href: "/api/boom-edge?label=postit",
    cta: "Hit /api/boom-edge",
  },
  {
    id: "action-500",
    title: "Server Action throw",
    group: "Server",
    capture: "onRequestError · routeType: action · node",
    steps: [
      "Go to New booking.",
      "Fill anything in and click “Save reservation”.",
      "The Server Action throws on the write (covers/party_size drift).",
    ],
    href: "/reservations/new",
    cta: "New booking",
  },
  {
    id: "proxy-500",
    title: "Proxy throw",
    group: "Server",
    // Returns 500, but note: the proxy runs in the edge layer and its throw is
    // NOT delivered to onRequestError — a real capture blind spot to verify.
    capture: "proxy layer 500 · NOT seen by onRequestError",
    steps: ["Open /boom-proxy — proxy.ts throws before the route renders."],
    href: "/boom-proxy",
    cta: "Open /boom-proxy",
  },
  {
    id: "stream-500",
    title: "Streaming mid-stream throw",
    group: "Server",
    capture: "onRequestError · routeType: render · streaming",
    steps: [
      "Open /boom-stream.",
      "The shell flushes (200), then a suspended child throws mid-stream.",
    ],
    href: "/boom-stream",
    cta: "Open /boom-stream",
  },
  {
    id: "flaky-500",
    title: "Flaky / intermittent 500",
    group: "Server",
    capture: "onRequestError · routeType: route · ~50%",
    steps: [
      "Hit /api/boom-flaky a few times.",
      "Fails about half the time — good for dedup / heal-verification.",
    ],
    href: "/api/boom-flaky",
    cta: "Hit /api/boom-flaky",
  },

  // ---- Data drift ----
  {
    id: "csv-drift",
    title: "CSV export contract drift",
    group: "Data",
    capture: "client · MissingFieldError (catch → display → rethrow)",
    steps: [
      "Go to Reservations.",
      "Click “Export to CSV”.",
      "Builder reads party_size; API now returns covers → throws.",
    ],
    href: "/history",
    cta: "Reservations",
  },

  // ---- Client lanes ----
  {
    id: "render-boundary",
    title: "Client render crash (boundary)",
    group: "Client",
    capture: "React error boundary · error.tsx · unstable_retry",
    steps: [
      "Open /crash → click “Crash this segment”.",
      "app/crash/error.tsx catches it; “Try again” recovers.",
    ],
    href: "/crash",
    cta: "Open /crash",
  },
  {
    id: "global-boundary",
    title: "Global render crash",
    group: "Client",
    capture: "global-error.tsx (root boundary)",
    steps: [
      "Open /crash-global → click “Crash the whole app”.",
      "No local boundary → bubbles to app/global-error.tsx.",
    ],
    href: "/crash-global",
    cta: "Open /crash-global",
  },
  {
    id: "unhandled-rejection",
    title: "Unhandled promise rejection",
    group: "Client",
    capture: "window.onunhandledrejection",
    steps: ["Fault Lab → click “Unhandled rejection”."],
    href: "/faults",
    cta: "Fault Lab",
    inLab: true,
  },
  {
    id: "sync-throw",
    title: "Uncaught error in event handler",
    group: "Client",
    capture: "window.onerror (not caught by boundaries)",
    steps: ["Fault Lab → click “Throw in handler”."],
    href: "/faults",
    cta: "Fault Lab",
    inLab: true,
  },
  {
    id: "non-error-throw",
    title: "Non-Error value thrown",
    group: "Client",
    capture: "rejection with a plain object (serialization edge case)",
    steps: ["Fault Lab → click “Throw non-Error”."],
    href: "/faults",
    cta: "Fault Lab",
    inLab: true,
  },
  {
    id: "cause-chain",
    title: "Error with cause chain",
    group: "Client",
    capture: "UpstreamError { cause } via rejection",
    steps: ["Fault Lab → click “Throw with cause”."],
    href: "/faults",
    cta: "Fault Lab",
    inLab: true,
  },
  {
    id: "type-error",
    title: "TypeError (null drift)",
    group: "Client",
    capture: "window.onerror · undefined.toUpperCase()",
    steps: ["Fault Lab → click “TypeError”."],
    href: "/faults",
    cta: "Fault Lab",
    inLab: true,
  },
];

export const FAULT_GROUPS: FaultGroup[] = ["Server", "Data", "Client"];

export function faultsByGroup(group: FaultGroup): Fault[] {
  return FAULTS.filter((f) => f.group === group);
}
