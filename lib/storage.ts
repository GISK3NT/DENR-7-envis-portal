import path from "node:path";

/**
 * Root directory for everything the app writes at runtime: the SQLite database,
 * requester attachments and the reply outbox.
 *
 * Defaults to the project directory. On platforms with an ephemeral filesystem
 * (Railway, Fly.io, Render) mount a volume and set ENVIS_STORAGE_ROOT to it so
 * requests and emails survive a redeploy.
 */
export function storageRoot(): string {
  return process.env.ENVIS_STORAGE_ROOT ?? process.cwd();
}

/** Resolve a path inside the storage root. */
export function storagePath(...parts: string[]): string {
  return path.join(storageRoot(), ...parts);
}
