import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const directory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "server-only": path.join(directory, "src/test/server-only.ts") },
  },
  test: {
    environment: "node",
    clearMocks: true,
    restoreMocks: true,
    include: ["src/**/*.test.ts"],
  },
});
