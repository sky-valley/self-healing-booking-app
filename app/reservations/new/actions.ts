"use server";

import { BookingWriteError } from "@/lib/errors";

// The booking-save Server Action. Submitting the form POSTs here; the throw
// surfaces through onRequestError with routeType: 'action' — the mutation
// capture lane. It's the same party_size -> covers contract drift as the CSV
// export, now on the WRITE path: the store rejects the renamed column.
export async function createBooking(formData: FormData) {
  const guest = String(formData.get("guest") ?? "").trim();
  const partySize = Number(formData.get("partySize"));
  const area = String(formData.get("area") ?? "");

  throw new BookingWriteError("covers", { guest, partySize, area });
}
