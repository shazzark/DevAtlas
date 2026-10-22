import { config as loadDotEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { parseEnvironment } from "./config.js";
import { buildApp } from "./app.js";

// Resolve the API's own environment file even when the workspace is launched from the repository root.
loadDotEnv({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const config = parseEnvironment(process.env);
const app = await buildApp(config);

try {
  await app.listen({ host: config.host, port: config.port });
} catch {
  app.log.error("API server failed to start");
  process.exitCode = 1;
}

async function shutdown() {
  await app.close();
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
