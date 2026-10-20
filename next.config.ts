import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep file resolution scoped to this repository when ancestor lockfiles exist.
    root: process.cwd(),
  },
};

export default nextConfig;
