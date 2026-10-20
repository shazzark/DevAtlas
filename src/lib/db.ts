import "server-only";
import mongoose, { type Connection } from "mongoose";

const SERVER_SELECTION_TIMEOUT_MS = 5_000;

type ConnectionCache = {
  connection: Connection | null;
  promise: Promise<Connection> | null;
};

declare global {
  // Reuse the connection and in-flight connection attempt across Next.js HMR reloads.
  var mongooseConnectionCache: ConnectionCache | undefined;
}

const cache = (globalThis.mongooseConnectionCache ??= {
  connection: null,
  promise: null,
});

export class MissingMongoUriError extends Error {
  constructor() {
    super("MONGODB_URI is not configured");
    this.name = "MissingMongoUriError";
  }
}

/** Resolve only after the MongoDB connection is established. */
export async function connectToDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new MissingMongoUriError();
  }

  if (cache.connection?.readyState === 1) {
    return;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      })
      .then((instance) => instance.connection)
      .catch((error: unknown) => {
        // Let a later request retry after a transient connection failure.
        cache.promise = null;
        throw error;
      });
  }

  const connection = await cache.promise;
  if (connection.readyState !== 1) {
    cache.connection = null;
    cache.promise = null;
    throw new Error("MongoDB connection was not established");
  }

  cache.connection = connection;
}
