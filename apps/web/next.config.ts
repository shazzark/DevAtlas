import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Workspace dependencies are hoisted to the monorepo root.
    root: path.resolve(process.cwd(), "../.."),
  },
};

export default nextConfig;
