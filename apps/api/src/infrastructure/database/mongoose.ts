import mongoose from "mongoose";

const SERVER_SELECTION_TIMEOUT_MS = 5_000;
let connectionAttempt: Promise<void> | undefined;

export class MissingMongoUriError extends Error {
  constructor() {
    super("MongoDB is not configured");
    this.name = "MissingMongoUriError";
  }
}

export async function checkMongoReadiness(uri: string | undefined): Promise<void> {
  if (!uri) throw new MissingMongoUriError();

  if (mongoose.connection.readyState !== 1) {
    connectionAttempt ??= mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    }).then(() => undefined).catch((error: unknown) => {
      connectionAttempt = undefined;
      throw error;
    });
    await connectionAttempt;
  }

  const database = mongoose.connection.db;
  if (!database) throw new Error("MongoDB connection is not ready");
  await database.admin().ping();
}

export async function closeMongoConnection(): Promise<void> {
  connectionAttempt = undefined;
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
