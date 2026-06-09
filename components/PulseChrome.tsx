"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/history", label: "Reservations" },
];

export function PulseChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-full bg-pulse-bg text-pulse-ink">
      <header className="sticky top-0 z-20 border-b border-pulse-line bg-pulse-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-8 px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-pulse-ink">
              <TableMark />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">
              TableFront
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-semibold">
            {NAV.map((n) => {
              const active = path === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded-full px-4 py-1.5 transition ${
                    active
                      ? "bg-pulse-ink text-pulse-bg"
                      : "text-pulse-muted hover:text-pulse-ink"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-pulse-lime/25 px-3 py-1 text-xs font-semibold text-pulse-lime-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-pulse-lime-deep" />
              All systems healthy
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}

function TableMark() {
  // Fork & knife — unmistakably dining.
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M5 2v5m0 0c0 1-1 1.4-1 2.2V14m0-4.8c0-.8 1-1.2 1-2.2M5 2v2.2M4 2v2.5"
        stroke="var(--color-pulse-lime)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 2c-1 0-1.6 1.4-1.6 3s.6 2.2 1.6 2.2m0 0V14m0-6.8c1 0 1.6-.6 1.6-2.2S12 2 11 2"
        stroke="var(--color-pulse-lime)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
