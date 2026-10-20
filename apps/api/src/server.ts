import "dotenv/config";
import { parseEnvironment } from "./config.js";
import { buildApp } from "./app.js";

const config = parseEnvironment(process.env);
const app = buildApp(config);

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
