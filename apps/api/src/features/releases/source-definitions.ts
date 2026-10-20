export type ReleaseSourceKind = "npm-latest" | "node-dist-index" | "github-releases" | "manual";

export type ReleaseSourceDefinition = {
  sourceKey: string;
  technologySlug: string;
  technologyName: string;
  kind: ReleaseSourceKind;
  endpoint: string | null;
  officialUrl: string;
};

// Only fixed, reviewed official endpoints are polled; other official pages remain manual sources.
export const releaseSourceDefinitions: ReleaseSourceDefinition[] = [
  { sourceKey: "manual:javascript", technologySlug: "javascript", technologyName: "JavaScript", kind: "manual", endpoint: null, officialUrl: "https://tc39.es/ecma262/" },
  { sourceKey: "npm:typescript", technologySlug: "typescript", technologyName: "TypeScript", kind: "npm-latest", endpoint: "https://registry.npmjs.org/typescript/latest", officialUrl: "https://github.com/microsoft/TypeScript/releases" },
  { sourceKey: "npm:react", technologySlug: "react", technologyName: "React", kind: "npm-latest", endpoint: "https://registry.npmjs.org/react/latest", officialUrl: "https://github.com/facebook/react/releases" },
  { sourceKey: "npm:next", technologySlug: "nextjs", technologyName: "Next.js", kind: "npm-latest", endpoint: "https://registry.npmjs.org/next/latest", officialUrl: "https://github.com/vercel/next.js/releases" },
  { sourceKey: "nodejs:dist-index", technologySlug: "nodejs", technologyName: "Node.js", kind: "node-dist-index", endpoint: "https://nodejs.org/dist/index.json", officialUrl: "https://nodejs.org/en/about/previous-releases" },
  { sourceKey: "npm:express", technologySlug: "express", technologyName: "Express", kind: "npm-latest", endpoint: "https://registry.npmjs.org/express/latest", officialUrl: "https://github.com/expressjs/express/releases" },
  { sourceKey: "manual:postgresql", technologySlug: "postgresql", technologyName: "PostgreSQL", kind: "manual", endpoint: null, officialUrl: "https://www.postgresql.org/support/versioning/" },
  { sourceKey: "manual:mongodb", technologySlug: "mongodb", technologyName: "MongoDB", kind: "manual", endpoint: null, officialUrl: "https://www.mongodb.com/docs/manual/release-notes/" },
  { sourceKey: "manual:git", technologySlug: "git", technologyName: "Git", kind: "manual", endpoint: null, officialUrl: "https://git-scm.com/downloads" },
  { sourceKey: "github:docker-engine", technologySlug: "docker", technologyName: "Docker", kind: "github-releases", endpoint: "https://api.github.com/repos/moby/moby/releases?per_page=30", officialUrl: "https://github.com/moby/moby/releases" },
  { sourceKey: "npm:vitest", technologySlug: "vitest", technologyName: "Vitest", kind: "npm-latest", endpoint: "https://registry.npmjs.org/vitest/latest", officialUrl: "https://github.com/vitest-dev/vitest/releases" },
  { sourceKey: "npm:socket.io", technologySlug: "socketio", technologyName: "Socket.IO", kind: "npm-latest", endpoint: "https://registry.npmjs.org/socket.io/latest", officialUrl: "https://github.com/socketio/socket.io/releases" },
];
