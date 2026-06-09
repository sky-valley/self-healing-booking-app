// /api/control — presenter actions. Every beat is presenter-triggered through
// here; nothing runs on a timer that could desync from the talk.

import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

type Action =
  | { action: "reset" }
  | { action: "set-instance"; instanceId: string }
  | { action: "capture-break"; instanceId: string }
  | { action: "detect"; instanceId: string }
  | { action: "heal"; instanceId: string };

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Action;
  const active = store.get().activeInstanceId;

  switch (body.action) {
    case "reset":
      store.reset();
      break;
    case "set-instance":
      store.setActiveInstance(body.instanceId);
      break;
    case "capture-break":
      store.captureBreak(body.instanceId ?? active);
      break;
    case "detect":
      store.detect(body.instanceId ?? active);
      break;
    case "heal":
      store.heal(body.instanceId ?? active);
      break;
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }

  return NextResponse.json(store.get());
}
