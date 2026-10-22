import { config as loadDotEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { parseEnvironment } from "../../config.js";
import { TechnologyModel } from "../technologies/model.js";
import { closeMongoConnection, connectMongo } from "../../infrastructure/database/mongoose.js";
import { StackGuideModel } from "./model.js";

const verifiedAt = new Date("2026-10-22T00:00:00.000Z");

const guides = [
  {
    slug: "node-express-postgresql-rest-api", title: "Build a REST API with Node.js, Express, and PostgreSQL",
    summary: "Connect Express route handlers to PostgreSQL through a small connection pool and parameterized queries.", technologySlugs: ["nodejs", "express", "postgresql"],
    prerequisites: ["JavaScript modules and async functions", "Basic HTTP methods and JSON", "A PostgreSQL database available locally or through a trusted provider"],
    compatibility: ["Choose a supported Node.js runtime and verify the installed Express and node-postgres versions against their official guides.", "The sample uses ECMAScript modules; configure the package accordingly."],
    architecture: "Node.js runs the process. Express maps HTTP requests to handlers. A bounded node-postgres Pool reuses database connections; SQL values are passed as parameters so user input is not concatenated into query text. Keep request parsing, validation, and database access separate as the API grows.",
    steps: [
      { title: "Create the application and install packages", explanation: "Initialize an ECMAScript module project and add Express and the PostgreSQL client. Keep connection configuration in environment variables.", code: { title: "Install dependencies", language: "bash", code: "npm init -y\nnpm install express pg", explanation: "Express handles HTTP routing; pg supplies the node-postgres Pool and query APIs." } },
      { title: "Create a small server and pool", explanation: "The pool avoids opening a new database connection for every request. Use a deployment-provided connection string and do not commit credentials.", code: { title: "Server and parameterized query", language: "javascript", code: "import express from 'express';\nimport pg from 'pg';\n\nconst databaseUrl = process.env.DATABASE_URL;\nif (!databaseUrl) throw new Error('DATABASE_URL is required');\nconst app = express();\nconst pool = new pg.Pool({ connectionString: databaseUrl });\napp.use(express.json());\n\napp.get('/health', (_request, response) => response.json({ status: 'ok' }));\napp.get('/tasks', async (_request, response, next) => {\n  try {\n    const result = await pool.query('SELECT id, title FROM tasks ORDER BY id');\n    response.json(result.rows);\n  } catch (error) { next(error); }\n});\n\napp.listen(process.env.PORT ?? 3000);", explanation: "The value is read from process configuration. Parameter placeholders such as $1 should be used whenever query values come from a request." } },
      { title: "Add a schema and a parameterized create route", explanation: "Create a tasks table with a generated key and required title. Insert request values using query parameters, then verify that GET and POST requests return the expected JSON.", code: { title: "Schema and create route", language: "javascript", code: "await pool.query(`CREATE TABLE IF NOT EXISTS tasks (\n  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  title TEXT NOT NULL,\n  completed BOOLEAN NOT NULL DEFAULT FALSE\n)`);\n\napp.post('/tasks', async (request, response, next) => {\n  const title = typeof request.body?.title === 'string' ? request.body.title.trim() : '';\n  if (!title || title.length > 200) return response.status(400).json({ error: 'Invalid title' });\n  try {\n    const result = await pool.query(\n      'INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, completed',\n      [title],\n    );\n    return response.status(201).json(result.rows[0]);\n  } catch (error) { next(error); }\n});", explanation: "The table constraint protects stored data and the $1 parameter keeps user text separate from SQL syntax." } },
    ],
    troubleshooting: [
      { problem: "The API cannot connect to PostgreSQL", solution: "Check that the database is reachable from the API process, the connection string is set, and the database accepts the selected TLS and authentication settings." },
      { problem: "A request hangs after a query error", solution: "Pass async handler errors to Express error handling and ensure the pool is closed during process shutdown." },
      { problem: "SQL fails when a title contains punctuation", solution: "Pass user values through query parameters such as $1 instead of building SQL by concatenating strings." },
    ],
    references: [
      { label: "Express installation", url: "https://expressjs.com/en/starter/installing/" },
      { label: "node-postgres connection configuration", url: "https://node-postgres.com/features/connecting" },
      { label: "node-postgres parameterized queries", url: "https://node-postgres.com/features/queries" },
      { label: "Node.js introduction", url: "https://nodejs.org/learn/getting-started/introduction-to-nodejs" },
    ],
  },
  {
    slug: "react-typescript-components", title: "Build React components with TypeScript",
    summary: "Use typed props and event handlers to make component inputs clear and catch mismatches during development.", technologySlugs: ["react", "typescript"],
    prerequisites: ["Basic JavaScript and JSX", "A React project with TypeScript and React type definitions"],
    compatibility: ["Use the TypeScript setup documented by the selected React framework or build tool.", "The examples use JSX in a .tsx file and do not depend on a specific React release."],
    architecture: "React components receive props and return UI. TypeScript describes the shape of those inputs and checks component usage before JavaScript executes. Keep domain types near the code that owns them, and pass only the data a child needs.",
    steps: [
      { title: "Define a component contract", explanation: "Describe required and optional props with a named type when that makes the interface easier to reuse.", code: { title: "Typed component", language: "tsx", code: "type GreetingProps = {\n  name: string;\n  emphasis?: boolean;\n};\n\nexport function Greeting({ name, emphasis = false }: GreetingProps) {\n  return <p className={emphasis ? 'emphasis' : undefined}>Hello, {name}</p>;\n}", explanation: "The required name prop is checked at call sites; emphasis is optional and receives a default." } },
      { title: "Pass values through JSX", explanation: "Use the component contract where the component is rendered. A misspelled or missing required prop is reported by the type checker.", code: { title: "Render a component", language: "tsx", code: "import { Greeting } from './greeting';\n\nexport function WelcomePanel() {\n  return <section><Greeting name=\"Ada\" emphasis /></section>;\n}", explanation: "JSX attributes map to the declared component props." } },
      { title: "Type event handlers when extracting them", explanation: "Inline handlers are often inferred. When a handler is shared or extracted, use the React event type that matches the element.", code: { title: "Typed input event", language: "tsx", code: "import { useState } from 'react';\n\nexport function NameField() {\n  const [name, setName] = useState('');\n  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {\n    setName(event.currentTarget.value);\n  }\n  return <input value={name} onChange={handleChange} />;\n}", explanation: "The event type exposes the input element's value without an unsafe cast." } },
    ],
    troubleshooting: [
      { problem: "TypeScript does not parse JSX in the file", solution: "Use the .tsx extension and a JSX compiler setting supported by the chosen framework." },
      { problem: "React types cannot be found", solution: "Follow the framework's TypeScript setup and ensure compatible React type packages are installed." },
      { problem: "An optional prop behaves as required", solution: "Mark the property optional with ? and provide a default where the component needs one." },
    ],
    references: [
      { label: "React: Using TypeScript", url: "https://react.dev/learn/typescript" },
      { label: "React: Quick Start", url: "https://react.dev/learn" },
      { label: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html" },
    ],
  },
  {
    slug: "nextjs-mongodb-data-access", title: "Connect a Next.js application to MongoDB",
    summary: "Keep database access on the server and return only the fields a page needs to render.", technologySlugs: ["nextjs", "mongodb"],
    prerequisites: ["Basic Next.js App Router and React knowledge", "A MongoDB deployment and server-only connection configuration", "Familiarity with async JavaScript"],
    compatibility: ["Follow the current Next.js App Router and MongoDB Node.js driver documentation for runtime support.", "Keep the URI in a server-side environment variable and never prefix it with a public-client environment key."],
    architecture: "A Next.js Server Component can call a server-only data access module. That module creates or reuses a MongoDB client and queries a collection. Database credentials remain on the server; the component serializes only the fields it needs into rendered output.",
    steps: [
      { title: "Install and configure the MongoDB driver", explanation: "Use the official Node.js driver and provide a MongoDB URI through server-side configuration. Restrict the database user's permissions to the needed database and collections.", code: { title: "Install the driver", language: "bash", code: "npm install mongodb", explanation: "The official MongoDB Node.js driver provides the client and collection APIs." } },
      { title: "Create a server-only data helper", explanation: "Place database code in a module imported only from server code. Reuse a connected client rather than creating a new connection for each page request.", code: { title: "Read records on the server", language: "typescript", code: "import 'server-only';\nimport { MongoClient } from 'mongodb';\n\nconst uri = process.env.MONGODB_URI;\nif (!uri) throw new Error('MONGODB_URI is required');\n\nconst client = new MongoClient(uri);\nexport async function listArticles() {\n  await client.connect();\n  return client.db().collection('articles')\n    .find({}, { projection: { title: 1, summary: 1 } })\n    .toArray();\n}", explanation: "The projection limits fields returned by the query. In a long-lived server, manage the client lifecycle according to the driver's connection guidance." } },
      { title: "Render the result from an App Router page", explanation: "Keep the page as a Server Component unless browser interaction is needed. Handle an empty collection with an intentional empty state.", code: { title: "Server-rendered page", language: "tsx", code: "import { listArticles } from '@/lib/articles';\n\nexport default async function ArticlesPage() {\n  const articles = await listArticles();\n  return <main><h1>Articles</h1>{articles.length === 0\n    ? <p>No articles are available yet.</p>\n    : <ul>{articles.map((article) => <li key={String(article._id)}>{article.title}</li>)}</ul>}\n  </main>;\n}", explanation: "The database call runs on the server; no MongoDB URI or driver is sent to the browser." } },
    ],
    troubleshooting: [
      { problem: "The build reports a missing MongoDB URI", solution: "Set the variable in the server runtime environment and keep it out of browser-exposed variables." },
      { problem: "A server component cannot import the database helper", solution: "Check that the helper is not imported by a Client Component and that it is marked server-only." },
      { problem: "Connection attempts accumulate during development", solution: "Reuse the driver client according to its official connection lifecycle guidance instead of opening a client for every query." },
    ],
    references: [
      { label: "Next.js Server and Client Components", url: "https://nextjs.org/docs/app/getting-started/server-and-client-components" },
      { label: "Next.js installation and environment setup", url: "https://nextjs.org/docs/app/getting-started/installation" },
      { label: "MongoDB Node.js driver", url: "https://www.mongodb.com/docs/drivers/node/current/" },
      { label: "MongoDB Node.js driver quick start", url: "https://www.mongodb.com/docs/drivers/node/current/get-started/" },
    ],
  },
  {
    slug: "react-node-socketio-chat", title: "Connect React and Node.js with Socket.IO",
    summary: "Exchange named real-time events between a React client and a Node.js Socket.IO server.", technologySlugs: ["react", "nodejs", "socketio"],
    prerequisites: ["Basic React state and effects", "Node.js modules and event callbacks", "HTTP and browser origin basics"],
    compatibility: ["Use matching Socket.IO client and server protocol-compatible releases as described in the official documentation.", "Configure the allowed client origin for the local and deployed environments."],
    architecture: "The Node.js process hosts an HTTP server and attaches the Socket.IO server to it. The React client opens a Socket.IO connection and subscribes to named events. Events are transient unless the application adds persistence and recovery; authentication and authorization must be enforced server-side.",
    steps: [
      { title: "Install the Socket.IO server and client", explanation: "Use the official setup for the selected Node.js server and install the matching browser client package in the React application.", code: { title: "Install packages", language: "bash", code: "npm install socket.io socket.io-client", explanation: "The server and client libraries implement the Socket.IO protocol and event API." } },
      { title: "Attach Socket.IO to an HTTP server", explanation: "Attach the Socket.IO server to the same HTTP server that listens for requests. Validate event payloads before broadcasting them.", code: { title: "Server event", language: "javascript", code: "import { createServer } from 'node:http';\nimport { Server } from 'socket.io';\n\nconst httpServer = createServer();\nconst io = new Server(httpServer, { cors: { origin: process.env.WEB_ORIGIN } });\nio.on('connection', (socket) => {\n  socket.on('chat:send', (payload) => {\n    const text = payload && typeof payload.text === 'string' ? payload.text.trim() : '';\n    if (!text || text.length > 1000) return;\n    io.emit('chat:message', { text });\n  });\n});\nhttpServer.listen(process.env.PORT ?? 3001);", explanation: "The server checks message shape and length. Production applications should also authorize senders and persist messages that must survive disconnects." } },
      { title: "Subscribe and send from React", explanation: "Create the connection in an effect, remove listeners during cleanup, and keep the client out of server-rendered code. Replace the local server origin with configuration supported by the chosen frontend tool.", code: { title: "React chat component", language: "tsx", code: "import { useEffect, useRef, useState } from 'react';\nimport type { FormEvent } from 'react';\nimport { io } from 'socket.io-client';\n\nexport function ChatFeed() {\n  const [messages, setMessages] = useState<string[]>([]);\n  const [draft, setDraft] = useState('');\n  const socketRef = useRef<ReturnType<typeof io> | null>(null);\n  useEffect(() => {\n    const socket = io('http://localhost:3001');\n    socketRef.current = socket;\n    const onMessage = (message: { text: string }) => setMessages((current) => [...current, message.text]);\n    socket.on('chat:message', onMessage);\n    return () => { socket.off('chat:message', onMessage); socket.disconnect(); socketRef.current = null; };\n  }, []);\n  function send(event: FormEvent) {\n    event.preventDefault();\n    const text = draft.trim();\n    if (!text) return;\n    socketRef.current?.emit('chat:send', { text });\n    setDraft('');\n  }\n  return <><form onSubmit={send}><input value={draft} onChange={(event) => setDraft(event.currentTarget.value)} /><button>Send</button></form><ul>{messages.map((message, index) => <li key={index}>{message}</li>)}</ul></>;\n}", explanation: "Effect cleanup prevents a removed component from leaving an active connection or duplicate listener." } },
    ],
    troubleshooting: [
      { problem: "The browser connection is rejected", solution: "Check the configured origin and Socket.IO server CORS policy, transport settings, and network path." },
      { problem: "Messages appear twice after navigation", solution: "Remove the exact listener and close the socket during effect cleanup." },
      { problem: "A disconnected client misses messages", solution: "Do not assume reconnecting replays every event; add persistence or an explicit recovery strategy when message delivery matters." },
    ],
    references: [
      { label: "Socket.IO documentation", url: "https://socket.io/docs/v4/" },
      { label: "Socket.IO chat tutorial", url: "https://socket.io/get-started/chat/" },
      { label: "Socket.IO handling disconnections", url: "https://socket.io/docs/v4/tutorial/handling-disconnections" },
      { label: "React Quick Start", url: "https://react.dev/learn" },
    ],
  },
  {
    slug: "express-mongodb-api", title: "Build an Express API backed by MongoDB",
    summary: "Separate Express route handling from MongoDB collection access and validate request data at the boundary.", technologySlugs: ["express", "mongodb", "nodejs"],
    prerequisites: ["Basic JavaScript and HTTP", "An Express application", "A MongoDB database and least-privilege application user"],
    compatibility: ["Use a Node.js runtime supported by your selected Express and MongoDB driver releases.", "The sample uses ECMAScript modules and asynchronous route handlers."],
    architecture: "Express receives and validates HTTP input, a route handler calls a focused data function, and the MongoDB driver reads or writes a collection. Keep secrets in environment configuration. Add indexes to support measured query patterns and constrain the fields returned to clients.",
    steps: [
      { title: "Install the driver and JSON middleware", explanation: "Follow the official Express and MongoDB driver installation instructions, then parse request JSON before routes that use it.", code: { title: "Install dependencies", language: "bash", code: "npm install express mongodb", explanation: "Express provides routing; the MongoDB Node.js driver provides collection operations." } },
      { title: "Connect and define a read endpoint", explanation: "Create a shared MongoClient for the process, require the connection string from server-side configuration, await the connection before serving database requests, and return a deliberately limited projection.", code: { title: "Express and MongoDB route", language: "javascript", code: "import express from 'express';\nimport { MongoClient } from 'mongodb';\n\nconst uri = process.env.MONGODB_URI;\nif (!uri) throw new Error('MONGODB_URI is required');\nconst app = express();\napp.use(express.json());\nconst client = new MongoClient(uri);\nawait client.connect();\nconst tasks = client.db().collection('tasks');\n\napp.get('/tasks', async (_request, response, next) => {\n  try {\n    const rows = await tasks.find({}, { projection: { title: 1, completed: 1 } }).toArray();\n    response.json(rows);\n  } catch (error) { next(error); }\n});\napp.listen(process.env.PORT ?? 3000);", explanation: "A shared client manages connections. Add schema validation and pagination before exposing this pattern to untrusted or high-volume requests." } },
      { title: "Add a validated create operation", explanation: "Reject missing or oversized input before writing, then return the new identifier and safe public fields. Never accept collection names or database operators directly from request data.", code: { title: "Validate a task title", language: "javascript", code: "app.post('/tasks', async (request, response, next) => {\n  try {\n    const title = typeof request.body?.title === 'string' ? request.body.title.trim() : '';\n    if (!title || title.length > 200) return response.status(400).json({ error: 'Invalid title' });\n    const result = await tasks.insertOne({ title, completed: false });\n    return response.status(201).json({ id: result.insertedId, title, completed: false });\n  } catch (error) { next(error); }\n});", explanation: "Validation limits the accepted shape before it reaches the database driver." } },
    ],
    troubleshooting: [
      { problem: "MongoDB reports authentication or selection errors", solution: "Verify the server-side URI, network allowlist, database user permissions, and TLS settings without printing the URI to logs." },
      { problem: "Requests return internal driver errors", solution: "Use a centralized Express error handler that logs safe diagnostics and returns a generic response to clients." },
      { problem: "Queries slow down as data grows", solution: "Measure the query shape, add an index that matches it, and avoid loading unbounded result sets." },
    ],
    references: [
      { label: "Express middleware guide", url: "https://expressjs.com/en/guide/using-middleware/" },
      { label: "MongoDB Node.js driver quick start", url: "https://www.mongodb.com/docs/drivers/node/current/quick-start/" },
      { label: "MongoDB Node.js driver CRUD", url: "https://www.mongodb.com/docs/drivers/node/current/crud/" },
      { label: "Node.js environment variables", url: "https://nodejs.org/api/environment_variables.html" },
    ],
  },
  {
    slug: "nodejs-docker-container", title: "Package a Node.js service with Docker",
    summary: "Build an image from a Node.js application, keep dependencies reproducible, and provide a simple runtime health endpoint.", technologySlugs: ["nodejs", "docker"],
    prerequisites: ["A Node.js application with a start script", "Docker installed and running", "Basic understanding of images and containers"],
    compatibility: ["Node.js 24 is listed as LTS in the official release schedule as of 2026-10-22; review current patch and image security status before deployment.", "The example uses npm and a lockfile; adapt commands if the project uses another package manager."],
    architecture: "Docker builds an image from a Dockerfile and runs the application in an isolated container. A multi-stage build separates dependency installation from the final runtime image. Configuration such as secrets and ports is supplied at runtime rather than baked into the image.",
    steps: [
      { title: "Make the application configurable", explanation: "Listen on the configured port and bind to an address reachable from the container network. Keep runtime configuration outside source control.", code: { title: "Node.js HTTP server", language: "javascript", code: "import { createServer } from 'node:http';\n\nconst server = createServer((_request, response) => {\n  response.writeHead(200, { 'content-type': 'application/json' });\n  response.end(JSON.stringify({ status: 'ok' }));\n});\nserver.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');", explanation: "Binding to all container interfaces lets Docker port forwarding reach the server." } },
      { title: "Create a production image", explanation: "Use a maintained Node.js base image, copy the lockfile before source for stable dependency installation, and run the existing application start command.", code: { title: "Dockerfile", language: "dockerfile", code: "FROM node:24-alpine AS dependencies\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\n\nFROM node:24-alpine AS runtime\nENV NODE_ENV=production\nWORKDIR /app\nCOPY --from=dependencies /app/node_modules ./node_modules\nCOPY . .\nUSER node\nEXPOSE 3000\nCMD [\"node\", \"src/server.js\"]", explanation: "Review and update the base image tag to a supported, patched release; the version shown is an illustration and is not a compatibility recommendation." } },
      { title: "Build and run locally", explanation: "Build the image, run it with a local port mapping, and check the health endpoint. Do not pass production secrets in a committed Dockerfile.", code: { title: "Build and run", language: "bash", code: "docker build -t node-service .\ndocker run --rm -p 3000:3000 node-service\ncurl http://localhost:3000/health", explanation: "The host port maps to the container port so the local health response can be inspected." } },
    ],
    troubleshooting: [
      { problem: "The container starts but the host cannot connect", solution: "Confirm the server binds to 0.0.0.0 inside the container and that the host port is mapped to the correct container port." },
      { problem: "The build cannot find package files", solution: "Check the build context and ensure the expected package manifest and lockfile are copied from the Docker build context." },
      { problem: "A new dependency is missing in the image", solution: "Rebuild the image after updating and committing the lockfile; do not rely on a host node_modules folder." },
    ],
    references: [
      { label: "Docker Node.js guide", url: "https://docs.docker.com/guides/nodejs/" },
      { label: "Dockerfile reference", url: "https://docs.docker.com/reference/dockerfile/" },
      { label: "Node.js introduction", url: "https://nodejs.org/learn/getting-started/introduction-to-nodejs" },
      { label: "Node.js releases", url: "https://nodejs.org/en/about/previous-releases" },
      { label: "Official Node.js image", url: "https://hub.docker.com/_/node" },
    ],
  },
  {
    slug: "nodejs-typescript-runtime", title: "Use TypeScript in a Node.js service",
    summary: "Choose a TypeScript execution or compilation workflow deliberately and keep runtime module settings aligned with the package.", technologySlugs: ["nodejs", "typescript"],
    prerequisites: ["JavaScript modules and npm", "Node.js and TypeScript basics", "A small server or command-line project"],
    compatibility: ["Node.js TypeScript support and TypeScript compiler behavior differ; follow the current official Node.js and TypeScript documentation for the selected runtime path.", "The example uses TypeScript compilation and an ECMAScript module package."],
    architecture: "TypeScript checks source types during development. A compiler workflow emits JavaScript that Node.js executes. Keeping type checking and runtime execution separate makes it clear which configuration controls language checks and which controls module loading.",
    steps: [
      { title: "Install TypeScript and configure module intent", explanation: "Install TypeScript locally for repeatable project commands. Declare the package module format instead of relying on an accidental default.", code: { title: "Initialize the project", language: "bash", code: "npm init -y\nnpm install --save-dev typescript\nnpx tsc --init", explanation: "A local compiler version makes developer and CI behavior reproducible." } },
      { title: "Write a typed service function", explanation: "Keep plain TypeScript types at application boundaries and compile the source before executing it with Node.js.", code: { title: "Typed input validation", language: "typescript", code: "type CreateTaskInput = { title: string };\ntype Task = { id: number; title: string; completed: boolean };\n\nexport function createTask(input: CreateTaskInput, id: number): Task {\n  const title = input.title.trim();\n  if (!title) throw new Error('Task title is required');\n  return { id, title, completed: false };\n}", explanation: "Types describe the expected shapes, while runtime checks still validate data received from outside the program." } },
      { title: "Type-check, compile, and run", explanation: "Use a strict compiler configuration suited to Node.js ECMAScript modules. Set package.json to type module and add typecheck, build, and start scripts that run tsc --noEmit, tsc, and node dist/server.js respectively.", code: { title: "tsconfig.json", language: "json", code: "{\n  \"compilerOptions\": {\n    \"target\": \"ES2022\",\n    \"module\": \"NodeNext\",\n    \"moduleResolution\": \"NodeNext\",\n    \"rootDir\": \"src\",\n    \"outDir\": \"dist\",\n    \"strict\": true\n  }\n}", explanation: "The compiler module settings match Node.js's package module format and keep emitted files in dist." } },
    ],
    troubleshooting: [
      { problem: "Node.js rejects an import in emitted output", solution: "Align TypeScript module settings with package.json and the Node.js module format used by the project." },
      { problem: "A type error appears only in CI", solution: "Use the project-local compiler and run the same typecheck script in both development and CI." },
      { problem: "Untrusted request data passes type checking", solution: "TypeScript types disappear at runtime; validate external JSON with runtime checks or a schema library." },
    ],
    references: [
      { label: "Node.js TypeScript support", url: "https://nodejs.org/api/typescript.html" },
      { label: "Node.js ECMAScript modules", url: "https://nodejs.org/api/esm.html" },
      { label: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html" },
    ],
  },
  {
    slug: "react-vitest-components", title: "Test React components with Vitest",
    summary: "Use a fast test runner to check component output and behavior while keeping tests focused on observable results.", technologySlugs: ["react", "vitest"],
    prerequisites: ["React components and props", "A project using Vite-compatible tooling", "Basic assertions and test organization"],
    compatibility: ["Vitest is built on Vite; check the current Vitest guide for supported Vite, Node.js, and browser environment requirements.", "React component tests that use DOM APIs need a configured DOM environment and testing utilities."],
    architecture: "A test imports a component, renders it in an appropriate environment, and asserts what a user can observe. Keep pure logic tests separate from DOM interaction tests. Vitest supplies the runner and assertion APIs; a React testing library can provide semantic rendering and queries.",
    steps: [
      { title: "Install and configure the test runner", explanation: "Add Vitest, the React Vite plugin, a DOM environment, and a React testing utility for tests that render components. Keep browser-only APIs mocked or avoided in unit tests.", code: { title: "Install test dependencies", language: "bash", code: "npm install --save-dev vitest jsdom @vitejs/plugin-react @testing-library/react @testing-library/dom", explanation: "Vitest runs tests; the React plugin transforms JSX, jsdom supplies a DOM-like environment, and Testing Library renders and queries components." } },
      { title: "Write a small component", explanation: "Expose behavior through accessible text and controls so tests can check the same interface users interact with.", code: { title: "Greeting component", language: "tsx", code: "export function Greeting({ name }: { name: string }) {\n  return <h1>Hello, {name}</h1>;\n}", explanation: "The component has a clear input and an observable heading." } },
      { title: "Assert an observable result", explanation: "Use a DOM testing utility configured for React to render the component and query it by its accessible role and name. Run Vitest in CI mode for a one-shot result.", code: { title: "Component test shape", language: "tsx", code: "import { describe, expect, it } from 'vitest';\nimport { render, screen } from '@testing-library/react';\nimport { Greeting } from './greeting';\n\ndescribe('Greeting', () => {\n  it('shows the supplied name', () => {\n    render(<Greeting name=\"Ada\" />);\n    expect(screen.getByRole('heading', { name: 'Hello, Ada' })).toBeTruthy();\n  });\n});", explanation: "A role-based query checks the rendered interface instead of component internals. Install the React testing utility and its DOM matchers as the project requires." } },
    ],
    troubleshooting: [
      { problem: "JSX cannot be transformed in a test", solution: "Use a Vite-compatible React plugin and test configuration consistent with the application build." },
      { problem: "The test fails because document is undefined", solution: "Configure a DOM environment such as jsdom for the tests that need browser APIs." },
      { problem: "A test passes but misses user-visible behavior", solution: "Query by accessible role, label, or visible text and exercise the interaction a user would perform." },
    ],
    references: [
      { label: "Vitest getting started", url: "https://vitest.dev/guide/" },
      { label: "Vitest component testing features", url: "https://vitest.dev/guide/features" },
      { label: "React Quick Start", url: "https://react.dev/learn" },
      { label: "Testing Library React", url: "https://testing-library.com/docs/react-testing-library/intro/" },
    ],
  },
];

loadDotEnv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });
const config = parseEnvironment(process.env);
if (!config.mongoUri) throw new Error("MONGODB_URI or DATABASE_URL is required to seed stack guides");

try {
  await connectMongo(config.mongoUri);
  await TechnologyModel.init();
  await StackGuideModel.init();
  const techs = await TechnologyModel.find({ slug: { $in: [...new Set(guides.flatMap((guide) => guide.technologySlugs))] }, status: "published" }).select({ slug: 1 }).lean();
  const publishedSlugs = new Set(techs.map((technology) => technology.slug));
  const missing = [...new Set(guides.flatMap((guide) => guide.technologySlugs))].filter((slug) => !publishedSlugs.has(slug));
  if (missing.length) throw new Error(`Published technology records are missing: ${missing.join(", ")}`);

  await Promise.all(guides.map((guide) => StackGuideModel.updateOne(
    { slug: guide.slug },
    { $setOnInsert: { ...guide, lastVerifiedAt: verifiedAt, status: "review" } },
    { upsert: true, runValidators: true },
  )));
  console.log(`Ensured ${guides.length} source-backed Stack Guides in review status; code examples have not been represented as execution-tested.`);
} catch {
  console.error("Stack Guide seeding could not complete; verify MongoDB connectivity and the published technology catalog.");
  process.exitCode = 1;
} finally {
  await closeMongoConnection();
}
