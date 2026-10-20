import { config as loadDotEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { parseEnvironment } from "../../config.js";
import { closeMongoConnection, connectMongo } from "../../infrastructure/database/mongoose.js";
import { ReleaseMonitorService } from "./monitor-service.js";

loadDotEnv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });
const config = parseEnvironment(process.env);

try {
  await connectMongo(config.mongoUri);
  const report = await new ReleaseMonitorService().run();
  console.log(JSON.stringify(report, null, 2));
  if (report.failedSources > 0) process.exitCode = 1;
} catch {
  // Driver errors can include connection details, so only report the failed operation name.
  console.error("Release monitoring could not complete; verify MongoDB connectivity and retry.");
  process.exitCode = 1;
} finally {
  await closeMongoConnection();
}
