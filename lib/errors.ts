// Custom error classes for the Differ fault testbed.
//
// These give the signal pipeline a variety of *typed* errors to group and
// classify, beyond the MissingFieldError thrown by the CSV export (lib/csv.ts).
// Each carries structured context so capture can test field extraction.

/** A value failed validation (empty, out of range, wrong type). */
export class ValidationError extends Error {
  constructor(
    public field: string,
    reason: string,
  ) {
    super(`Validation failed for "${field}": ${reason}`);
    this.name = "ValidationError";
  }
}

/** A reservation status arrived that the UI has no mapping for. */
export class StatusUnknownError extends Error {
  constructor(public status: string) {
    super(`Unknown reservation status "${status}" — no UI mapping exists.`);
    this.name = "StatusUnknownError";
  }
}

/**
 * The booking write was rejected by the reservations store. Same contract
 * drift as the export (party_size -> covers), now on the *write* path so it
 * surfaces through a Server Action (onRequestError routeType: 'action').
 */
export class BookingWriteError extends Error {
  constructor(
    public field: string,
    public context?: Record<string, unknown>,
  ) {
    super(
      `Booking write failed: column "${field}" was rejected by the reservations store.`,
    );
    this.name = "BookingWriteError";
  }
}

/**
 * An upstream dependency failed. Constructed with a `cause` so capture can be
 * tested against Error cause chains, not just a flat message.
 */
export class UpstreamError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "UpstreamError";
  }
}
