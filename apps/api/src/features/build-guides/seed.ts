import { config as loadDotEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { parseEnvironment } from "../../config.js";
import { closeMongoConnection, connectMongo } from "../../infrastructure/database/mongoose.js";
import { TechnologyModel } from "../technologies/model.js";
import { BuildGuideModel } from "./model.js";

const lastVerifiedAt = new Date("2026-10-22T00:00:00.000Z");

const guides = [
  {
    slug: "rest-task-api-node-express-postgresql",
    title: "Build a REST Task API with Node.js, Express, and PostgreSQL",
    summary: "Create a small HTTP API that validates task input and stores task records in PostgreSQL.",
    learningObjectives: ["Map HTTP methods and paths to Express handlers.", "Use PostgreSQL constraints and parameterized queries for task data.", "Exercise the API with repeatable HTTP tests."],
    prerequisites: ["Node.js and npm installed", "Basic JavaScript, HTTP, and SQL knowledge", "A local PostgreSQL database or a configured development database"],
    technologySlugs: ["nodejs", "express", "postgresql"],
    architecture: "A Node.js process hosts an Express application. JSON request handlers validate inputs, then call a PostgreSQL connection pool. SQL constraints provide a second line of data integrity; parameterized queries keep values separate from SQL syntax. The project stores only task records, so the first version can use one table and a small set of routes.",
    steps: [
      {
        title: "Create the project and install dependencies", objective: "Set up an Express application with a PostgreSQL client.",
        explanation: "Initialize a package and install Express and node-postgres. Keep the database URL in local or deployment environment configuration, and set the project module type to ECMAScript modules if using import syntax.",
        decision: "Use node-postgres Pool so requests reuse a bounded set of connections instead of opening a new database connection for each route.",
        examples: [
          { title: "Project setup", language: "bash", code: "npm init -y\nnpm pkg set type=module\nnpm install express pg", explanation: "The package declaration aligns Node.js module loading with the import syntax in later examples." },
          { title: "Environment configuration", language: "bash", code: "DATABASE_URL=postgres://dev_user:dev_password@localhost:5432/tasks_dev\nPORT=3000", explanation: "Use local development credentials only in an untracked environment file; replace them with deployment-managed configuration outside development." },
        ],
      },
      {
        title: "Define the task table", objective: "Store a task title and completion state with database constraints.",
        explanation: "Create a table before starting the API. Generated identifiers avoid relying on user-provided IDs, and the NOT NULL constraint keeps incomplete records out of storage.",
        decision: "Keep the first schema small. Add columns and indexes when the product requirements and query patterns call for them.",
        examples: [
          { title: "tasks.sql", language: "sql", code: "CREATE TABLE IF NOT EXISTS tasks (\n  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),\n  completed BOOLEAN NOT NULL DEFAULT FALSE,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);", explanation: "The primary key and checks enforce core data rules even if a future route forgets to validate an input." },
        ],
      },
      {
        title: "Add list and create routes", objective: "Read tasks and insert new tasks through JSON endpoints.",
        explanation: "Parse JSON at the application boundary, reject invalid titles, and pass the title as a query parameter. Express 5 forwards rejected async handlers to error handling; this example keeps route failures explicit with try/catch.",
        decision: "Return a limited set of public fields and use SQL parameters rather than joining request text into the query string.",
        examples: [
          { title: "server.js", language: "javascript", code: "import express from 'express';\nimport pg from 'pg';\n\nconst connectionString = process.env.DATABASE_URL;\nif (!connectionString) throw new Error('DATABASE_URL is required');\nconst app = express();\nconst pool = new pg.Pool({ connectionString });\napp.use(express.json());\n\napp.get('/tasks', async (_request, response, next) => {\n  try {\n    const result = await pool.query(\n      'SELECT id, title, completed, created_at FROM tasks ORDER BY id'\n    );\n    return response.json(result.rows);\n  } catch (error) { next(error); }\n});\n\napp.post('/tasks', async (request, response, next) => {\n  const title = typeof request.body?.title === 'string' ? request.body.title.trim() : '';\n  if (!title || title.length > 200) return response.status(400).json({ error: 'Invalid title' });\n  try {\n    const result = await pool.query(\n      'INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, completed, created_at',\n      [title]\n    );\n    return response.status(201).json(result.rows[0]);\n  } catch (error) { next(error); }\n});\n\napp.listen(Number(process.env.PORT ?? 3000));", explanation: "The handler validates request data before the database call, and $1 carries the value as data rather than SQL syntax." },
        ],
      },
      {
        title: "Exercise the API", objective: "Check the empty list, creation response, and persisted list result.",
        explanation: "Start the server after applying the schema. Send one create request, then list tasks and confirm the returned title and generated ID. A test runner can repeat these checks against an isolated test database.",
        decision: "Separate HTTP behavior checks from production data. Tests should use a dedicated database and clean up rows they create.",
        examples: [
          { title: "Manual HTTP checks", language: "bash", code: "curl http://localhost:3000/tasks\ncurl -X POST http://localhost:3000/tasks -H 'content-type: application/json' -d '{\"title\":\"Write integration tests\"}'\ncurl http://localhost:3000/tasks", explanation: "The first request lists records, the second creates one, and the final request confirms persistence." },
          { title: "Node.js test runner shape", language: "javascript", code: "import test from 'node:test';\nimport assert from 'node:assert/strict';\n\ntest('POST creates a task that GET can read', async () => {\n  const created = await fetch('http://localhost:3000/tasks', {\n    method: 'POST', headers: { 'content-type': 'application/json' },\n    body: JSON.stringify({ title: 'Check persistence' }),\n  });\n  assert.equal(created.status, 201);\n  const task = await created.json();\n  assert.equal(task.title, 'Check persistence');\n});", explanation: "Run node --test after starting the API and configuring its isolated test database. The test checks the observable HTTP contract." },
        ],
      },
    ],
    testingInstructions: [
      { title: "Create the schema", command: "psql \"$DATABASE_URL\" -f tasks.sql", expectedResult: "PostgreSQL reports that the tasks table was created or already exists." },
      { title: "Start the API", command: "node server.js", expectedResult: "The process listens on the configured port without printing the database URL." },
      { title: "Run HTTP tests", command: "node --test", expectedResult: "The create-task test receives 201 and sees the saved title when reading the record." },
      { title: "Check invalid input", command: "curl -i -X POST http://localhost:3000/tasks -H 'content-type: application/json' -d '{\"title\":\" \"}'", expectedResult: "The API returns 400 and does not insert a row." },
    ],
    commonErrors: [
      { problem: "The API cannot connect to PostgreSQL", cause: "The database URL is unset, credentials are wrong, or PostgreSQL is not reachable from the process.", solution: "Check local database status and the server-side DATABASE_URL without pasting credentials into logs or source control." },
      { problem: "A task title breaks an SQL statement", cause: "Request text was concatenated into SQL instead of passed as a parameter.", solution: "Use placeholders such as $1 and pass values in the query parameter array." },
      { problem: "A route error returns an unclear response", cause: "The API has no consistent error handler or leaks raw database errors.", solution: "Add centralized Express error handling that logs safe diagnostics and returns a stable public error shape." },
      { problem: "Integration tests change development data", cause: "The test process is using the development database.", solution: "Use a dedicated test database and isolate or remove records created by each test." },
    ],
    outcome: "A small REST API lists and creates task records, rejects invalid titles, and persists accepted tasks in PostgreSQL. The included examples are instructional and have not been represented as execution-tested.",
    references: [
      { label: "Express 5 Hello World", url: "https://expressjs.com/en/5x/starter/hello-world/" },
      { label: "Express installation", url: "https://expressjs.com/en/starter/installing/" },
      { label: "node-postgres connection configuration", url: "https://node-postgres.com/features/connecting" },
      { label: "node-postgres queries", url: "https://node-postgres.com/features/queries" },
      { label: "Node.js test runner", url: "https://nodejs.org/api/test.html" },
    ],
  },
  {
    slug: "real-time-chat-react-node-socketio",
    title: "Build a Real-Time Chat with React, Node.js, and Socket.IO",
    summary: "Send validated chat messages from a React client through a Node.js Socket.IO server to connected clients.",
    learningObjectives: ["Define named events for a real-time feature.", "Manage Socket.IO client connections within React component lifecycles.", "Validate message payloads and understand what disconnect recovery does not guarantee."],
    prerequisites: ["Basic React components, state, and effects", "Node.js modules and event handlers", "A browser and two local client tabs for manual testing"],
    technologySlugs: ["react", "nodejs", "socketio"],
    architecture: "A Node.js HTTP server hosts a Socket.IO server. Each React client opens a Socket.IO connection, sends a `chat:send` event, and listens for `chat:message`. The server validates messages before broadcasting. This in-memory example is intentionally small: it does not authenticate users, store history, or guarantee delivery to clients that are offline.",
    steps: [
      {
        title: "Create the server and client projects", objective: "Install Socket.IO on the Node.js server and in the React application.",
        explanation: "Create separate server and web workspaces or folders. Install matching Socket.IO server and client packages, then configure the development client origin on the server.",
        decision: "Keep browser and server dependencies in their respective workspaces so server modules and secrets never enter the browser bundle.",
        examples: [
          { title: "Install server dependency", language: "bash", code: "npm install socket.io", explanation: "Install this in the Node.js server workspace." },
          { title: "Install client dependency", language: "bash", code: "npm install socket.io-client", explanation: "Install this in the React workspace that runs in the browser." },
        ],
      },
      {
        title: "Define validated server events", objective: "Receive a bounded text message and broadcast the accepted payload.",
        explanation: "Attach Socket.IO to a Node.js HTTP server and validate the shape and length of every incoming message before broadcasting it.",
        decision: "The server owns validation and event naming. Client-side checks improve usability but cannot replace server-side checks.",
        examples: [
          { title: "server.js", language: "javascript", code: "import { createServer } from 'node:http';\nimport { Server } from 'socket.io';\n\nconst httpServer = createServer();\nconst io = new Server(httpServer, {\n  cors: { origin: process.env.WEB_ORIGIN },\n});\nio.on('connection', (socket) => {\n  socket.on('chat:send', (payload) => {\n    const text = payload && typeof payload.text === 'string' ? payload.text.trim() : '';\n    if (!text || text.length > 1000) return;\n    io.emit('chat:message', { text });\n  });\n});\nhttpServer.listen(Number(process.env.PORT ?? 3001));", explanation: "The server checks message type and size. Production chat also needs an identity and authorization policy, and durable storage if messages must survive restarts or disconnects." },
        ],
      },
      {
        title: "Connect the React client", objective: "Subscribe to messages and remove the connection when the component unmounts.",
        explanation: "Create the socket in an effect, keep a reference for sending, and clean up its listener and connection when React removes the component. Replace the local origin with configuration supported by the selected React build tool.",
        decision: "The socket is an external system, so the effect lifecycle owns connection setup and cleanup. A single connection is reused for both receiving and sending.",
        examples: [
          { title: "ChatFeed.tsx", language: "tsx", code: "import { useEffect, useRef, useState } from 'react';\nimport type { FormEvent } from 'react';\nimport { io } from 'socket.io-client';\n\nexport function ChatFeed() {\n  const [messages, setMessages] = useState<string[]>([]);\n  const [draft, setDraft] = useState('');\n  const socketRef = useRef<ReturnType<typeof io> | null>(null);\n  useEffect(() => {\n    const socket = io('http://localhost:3001');\n    socketRef.current = socket;\n    const onMessage = (message: { text: string }) => setMessages((items) => [...items, message.text]);\n    socket.on('chat:message', onMessage);\n    return () => { socket.off('chat:message', onMessage); socket.disconnect(); socketRef.current = null; };\n  }, []);\n  function send(event: FormEvent) {\n    event.preventDefault();\n    const text = draft.trim();\n    if (!text || text.length > 1000) return;\n    socketRef.current?.emit('chat:send', { text });\n    setDraft('');\n  }\n  return <><form onSubmit={send}><label>Message <input value={draft} onChange={(event) => setDraft(event.currentTarget.value)} /></label><button type='submit'>Send</button></form><ul>{messages.map((message, index) => <li key={index}>{message}</li>)}</ul></>;\n}", explanation: "The client checks empty input for usability; the server remains authoritative. Effect cleanup prevents duplicate event listeners and stale connections." },
        ],
      },
      {
        title: "Try two connected clients", objective: "See an event sent from one browser tab appear in another.",
        explanation: "Start the Node.js server and React application using their development commands. Open the app in two tabs, send a message in one, and confirm both clients receive the broadcast. Refresh one tab to observe reconnection behavior.",
        decision: "A manual two-client check makes the realtime path observable without implying durable delivery, load testing, or production readiness.",
        examples: [
          { title: "Event contract", language: "javascript", code: "// Client to server\nsocket.emit('chat:send', { text: 'Hello from tab one' });\n\n// Server to every connected client\nio.emit('chat:message', { text: 'Hello from tab one' });", explanation: "Both sides agree on event names and payload shape. Validate that shape at the server boundary." },
        ],
      },
    ],
    testingInstructions: [
      { title: "Start the realtime server", command: "node server.js", expectedResult: "The Socket.IO server listens on port 3001 or the configured PORT." },
      { title: "Start the React development server", command: "npm run dev", expectedResult: "The browser client loads and connects to the configured Socket.IO origin." },
      { title: "Check message fan-out", command: "Open two browser tabs, send a message in one tab, and inspect both message lists.", expectedResult: "Both connected clients display the accepted message once." },
      { title: "Check cleanup and reconnect", command: "Refresh one tab and send a new message from the other.", expectedResult: "The refreshed client reconnects and receives new messages; prior missed events are not assumed to replay." },
    ],
    commonErrors: [
      { problem: "The browser cannot establish a connection", cause: "The server origin or CORS origin does not match the browser app, or the server is not listening.", solution: "Check the configured client URL, server port, allowed origin, and browser network console." },
      { problem: "A message listener runs more than once", cause: "A previous connection or event listener was not removed when the component unmounted.", solution: "Remove the same event handler and disconnect the socket in the effect cleanup function." },
      { problem: "Messages disappear after a server restart", cause: "The example broadcasts in-memory events and has no message store.", solution: "Persist messages and define a history or recovery endpoint if the product requires durable chat." },
      { problem: "A user sends a payload with unexpected fields or size", cause: "The client is treated as trusted input.", solution: "Validate message shape and size on the server and add authentication and authorization before exposing chat publicly." },
    ],
    outcome: "Two connected React clients can exchange bounded text messages through a Node.js Socket.IO server. The sample is a local learning outcome, not a persistent or authenticated chat service, and its code has not been represented as execution-tested.",
    references: [
      { label: "Socket.IO chat tutorial", url: "https://socket.io/get-started/chat/" },
      { label: "Socket.IO documentation", url: "https://socket.io/docs/v4/" },
      { label: "Socket.IO handling disconnections", url: "https://socket.io/docs/v4/tutorial/handling-disconnections" },
      { label: "React Quick Start", url: "https://react.dev/learn" },
      { label: "React effects", url: "https://react.dev/learn/synchronizing-with-effects" },
    ],
  },
  {
    slug: "nextjs-mongodb-full-stack-crud",
    title: "Build a Full-Stack CRUD App with Next.js and MongoDB",
    summary: "Create a server-rendered task list and Route Handlers for creating, updating, and deleting MongoDB records.",
    learningObjectives: ["Read MongoDB data in a Next.js Server Component.", "Use App Router Route Handlers for CRUD operations.", "Keep database credentials and validation on the server."],
    prerequisites: ["Node.js and npm installed", "Basic React and Next.js App Router knowledge", "A local MongoDB deployment or MongoDB Atlas database with a restricted development user"],
    technologySlugs: ["nextjs", "mongodb"],
    architecture: "Next.js App Router owns the pages and same-origin Route Handlers. A server-only MongoDB module reuses a driver connection. The page queries task records on the server; client interactions call the app's Route Handlers, which validate request data and perform database operations. The MongoDB URI stays in the server runtime environment.",
    steps: [
      {
        title: "Create the Next.js app and install the driver", objective: "Set up an App Router project with the official MongoDB Node.js driver.",
        explanation: "Create a TypeScript App Router application and install the MongoDB driver. Put the development URI in a local environment file that is not committed. Never expose it through a NEXT_PUBLIC_ variable.",
        decision: "Use a same-origin Route Handler for browser mutations so the browser never connects directly to MongoDB.",
        examples: [
          { title: "Install the MongoDB driver", language: "bash", code: "npm install mongodb", explanation: "The official Node.js driver provides the client and collection APIs." },
          { title: "Server environment", language: "bash", code: "MONGODB_URI=mongodb://127.0.0.1:27017/devatlas_tasks\nMONGODB_DATABASE=devatlas_tasks", explanation: "Use a least-privilege development account for a hosted database and keep this file out of source control." },
        ],
      },
      {
        title: "Create a reusable server-only database module", objective: "Reuse the MongoDB client and return a database handle to server code.",
        explanation: "Keep the connection helper outside client components and reuse its in-flight connection promise. Reset a failed promise so a later request can retry after the database becomes available.",
        decision: "A long-lived client reuses its connection pool across requests, while a rejected promise must not permanently prevent retries.",
        examples: [
          { title: "lib/mongodb.ts", language: "typescript", code: "import 'server-only';\nimport { Db, MongoClient } from 'mongodb';\n\nconst uri = process.env.MONGODB_URI;\nif (!uri) throw new Error('MONGODB_URI is required');\nconst client = new MongoClient(uri);\nlet connection: Promise<MongoClient> | undefined;\n\nexport async function getDatabase(): Promise<Db> {\n  connection ??= client.connect().catch((error) => {\n    connection = undefined;\n    throw error;\n  });\n  const connectedClient = await connection;\n  return connectedClient.db(process.env.MONGODB_DATABASE);\n}", explanation: "This helper is server-only and shares a client connection. A deployment should also define safe startup, timeout, and shutdown behavior for its runtime." },
        ],
      },
      {
        title: "Add collection validation and Route Handlers", objective: "Implement list, create, update, and delete operations through the Next.js server.",
        explanation: "Route Handlers use the Web Request and Response APIs. Validate JSON before persistence, accept only expected fields, and use an ObjectId parsed from a path parameter instead of passing arbitrary client values to MongoDB.",
        decision: "Keep the route handlers as a small transport boundary and return only public fields. The GET method reads fresh data; it is not opted into static caching.",
        examples: [
          { title: "app/api/tasks/route.ts", language: "typescript", code: "import { ObjectId } from 'mongodb';\nimport { getDatabase } from '@/lib/mongodb';\n\nexport async function GET() {\n  const db = await getDatabase();\n  const tasks = await db.collection('tasks').find({}).sort({ _id: -1 }).limit(100).toArray();\n  return Response.json(tasks.map(({ _id, title, completed }) => ({ id: String(_id), title, completed })));\n}\n\nexport async function POST(request: Request) {\n  const body: unknown = await request.json();\n  const title = body && typeof body === 'object' && 'title' in body && typeof body.title === 'string' ? body.title.trim() : '';\n  if (!title || title.length > 200) return Response.json({ error: 'Invalid title' }, { status: 400 });\n  const db = await getDatabase();\n  const task = { title, completed: false };\n  const result = await db.collection('tasks').insertOne(task);\n  return Response.json({ id: String(result.insertedId), ...task }, { status: 201 });\n}\n\nexport async function PATCH(request: Request) {\n  const url = new URL(request.url);\n  const id = url.searchParams.get('id');\n  if (!id || !ObjectId.isValid(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });\n  const body: unknown = await request.json();\n  if (!body || typeof body !== 'object' || !('completed' in body) || typeof body.completed !== 'boolean') {\n    return Response.json({ error: 'Invalid completed value' }, { status: 400 });\n  }\n  const db = await getDatabase();\n  const result = await db.collection('tasks').updateOne({ _id: new ObjectId(id) }, { $set: { completed: body.completed } });\n  return result.matchedCount ? Response.json({ id, completed: body.completed }) : Response.json({ error: 'Not found' }, { status: 404 });\n}\n\nexport async function DELETE(request: Request) {\n  const id = new URL(request.url).searchParams.get('id');\n  if (!id || !ObjectId.isValid(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });\n  const db = await getDatabase();\n  const result = await db.collection('tasks').deleteOne({ _id: new ObjectId(id) });\n  return result.deletedCount ? new Response(null, { status: 204 }) : Response.json({ error: 'Not found' }, { status: 404 });\n}", explanation: "Each method validates client-controlled data before using it. For larger applications, split CRUD methods across resource routes and add pagination and authentication as requirements demand." },
          { title: "app/page.tsx", language: "tsx", code: "import { getDatabase } from '@/lib/mongodb';\nimport { TaskBoard } from './task-board';\n\nexport default async function HomePage() {\n  const db = await getDatabase();\n  const tasks = await db.collection('tasks').find({}).sort({ _id: -1 }).limit(100).toArray();\n  const initialTasks = tasks.map((task) => ({ id: String(task._id), title: task.title, completed: task.completed }));\n  return <main><h1>Tasks</h1><TaskBoard initialTasks={initialTasks} /></main>;\n}", explanation: "This Server Component queries MongoDB without sending connection code or credentials to the browser, then passes only serializable task fields to the interactive client component." },
        ],
      },
      {
        title: "Add an interactive form and verify CRUD behavior", objective: "Create, complete, and remove tasks using the same-origin API.",
        explanation: "A small Client Component can call the Route Handlers and refresh the page after each successful mutation. Test invalid inputs and unknown IDs as well as the normal flow.",
        decision: "The browser holds user input and calls the app API; it never imports the MongoDB helper or receives database credentials.",
        examples: [
          { title: "app/task-board.tsx", language: "tsx", code: "'use client';\n\nimport { useState } from 'react';\nimport type { FormEvent } from 'react';\n\ntype Task = { id: string; title: string; completed: boolean };\nexport function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {\n  const [tasks, setTasks] = useState(initialTasks);\n  const [title, setTitle] = useState('');\n  const [message, setMessage] = useState('');\n  async function create(event: FormEvent) {\n    event.preventDefault();\n    const response = await fetch('/api/tasks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title }) });\n    if (!response.ok) { setMessage('Could not create task'); return; }\n    const task: Task = await response.json();\n    setTasks((items) => [task, ...items]);\n    setTitle('');\n    setMessage('Task created');\n  }\n  async function toggle(task: Task) {\n    const completed = !task.completed;\n    const response = await fetch(`/api/tasks?id=${encodeURIComponent(task.id)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ completed }) });\n    if (!response.ok) { setMessage('Could not update task'); return; }\n    setTasks((items) => items.map((item) => item.id === task.id ? { ...item, completed } : item));\n  }\n  async function remove(task: Task) {\n    const response = await fetch(`/api/tasks?id=${encodeURIComponent(task.id)}`, { method: 'DELETE' });\n    if (!response.ok) { setMessage('Could not delete task'); return; }\n    setTasks((items) => items.filter((item) => item.id !== task.id));\n    setMessage('Task deleted');\n  }\n  return <><form onSubmit={create}><label>New task <input value={title} onChange={(event) => setTitle(event.currentTarget.value)} /></label><button type='submit'>Add task</button></form><p role='status'>{message}</p><ul>{tasks.map((task) => <li key={task.id}><span>{task.completed ? '✓ ' : ''}{task.title}</span><button type='button' onClick={() => void toggle(task)}>{task.completed ? 'Reopen' : 'Complete'}</button><button type='button' onClick={() => void remove(task)}>Delete</button></li>)}</ul></>;\n}", explanation: "The Client Component owns form state and calls same-origin handlers. The server handlers remain responsible for validating each request." },
          { title: "CRUD request examples", language: "bash", code: "curl http://localhost:3000/api/tasks\ncurl -X POST http://localhost:3000/api/tasks -H 'content-type: application/json' -d '{\"title\":\"Read the MongoDB docs\"}'\ncurl -X PATCH 'http://localhost:3000/api/tasks?id=<task-id>' -H 'content-type: application/json' -d '{\"completed\":true}'\ncurl -X DELETE 'http://localhost:3000/api/tasks?id=<task-id>'", explanation: "Replace <task-id> with the id returned by POST; each operation goes through a Next.js Route Handler." },
        ],
      },
    ],
    testingInstructions: [
      { title: "Start Next.js", command: "npm run dev", expectedResult: "The App Router application starts and serves the task page." },
      { title: "Check creation and listing", command: "POST a valid task to /api/tasks, then GET /api/tasks", expectedResult: "POST returns 201 and GET includes the created task with an ID." },
      { title: "Check update and delete", command: "PATCH a task with completed=true, then DELETE it by id", expectedResult: "PATCH returns the updated state; DELETE returns 204 and a subsequent GET no longer includes it." },
      { title: "Check invalid input", command: "POST an empty title and PATCH using an invalid id", expectedResult: "The API returns 400 and makes no malformed database write." },
    ],
    commonErrors: [
      { problem: "MongoDB configuration is missing at runtime", cause: "The server environment variable was not configured or was exposed under the wrong name.", solution: "Set MONGODB_URI and MONGODB_DATABASE in the Next.js server runtime; do not use a NEXT_PUBLIC_ prefix." },
      { problem: "The MongoDB module is included in a Client Component", cause: "A client-marked component imported a server-only data helper.", solution: "Call the database from a Server Component or Route Handler and pass only serializable public data to client components." },
      { problem: "A route accepts unexpected update fields", cause: "The request body is passed directly into a MongoDB update operation.", solution: "Validate each field and construct a server-owned update object instead of spreading the body into a query." },
      { problem: "The connection fails once and every request keeps failing", cause: "A rejected connection promise remains cached.", solution: "Clear the cached promise on rejection so a later request can retry; also inspect the safe server-side connection error." },
    ],
    outcome: "A Next.js task page reads task data on the server and same-origin Route Handlers support create, read, update, and delete operations backed by MongoDB. The sample is a local learning project and has not been represented as execution-tested.",
    references: [
      { label: "Next.js installation", url: "https://nextjs.org/docs/app/getting-started/installation" },
      { label: "Next.js Server and Client Components", url: "https://nextjs.org/docs/app/getting-started/server-and-client-components" },
      { label: "Next.js Route Handlers", url: "https://nextjs.org/docs/app/getting-started/route-handlers" },
      { label: "Next.js data fetching", url: "https://nextjs.org/docs/app/getting-started/fetching-data" },
      { label: "MongoDB Node.js driver get started", url: "https://www.mongodb.com/docs/drivers/node/current/get-started/" },
      { label: "MongoDB CRUD operations", url: "https://www.mongodb.com/docs/drivers/node/current/crud/" },
    ],
  },
];

loadDotEnv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });
const config = parseEnvironment(process.env);
if (!config.mongoUri) throw new Error("MONGODB_URI or DATABASE_URL is required to seed build guides");

try {
  await connectMongo(config.mongoUri);
  await TechnologyModel.init();
  await BuildGuideModel.init();
  const requestedSlugs = [...new Set(guides.flatMap((guide) => guide.technologySlugs))];
  const technologies = await TechnologyModel.find({ slug: { $in: requestedSlugs }, status: "published" }).select({ slug: 1 }).lean();
  const availableSlugs = new Set(technologies.map((technology) => technology.slug));
  const missing = requestedSlugs.filter((slug) => !availableSlugs.has(slug));
  if (missing.length) throw new Error(`Published technology records are missing: ${missing.join(", ")}`);

  await Promise.all(guides.map((guide) => BuildGuideModel.updateOne(
    { slug: guide.slug },
    { $setOnInsert: { ...guide, lastVerifiedAt, status: "review" } },
    { upsert: true, runValidators: true },
  )));
  console.log(`Ensured ${guides.length} Build Guides in review status; examples have not been represented as execution-tested.`);
} catch {
  console.error("Build Guide seeding could not complete; verify MongoDB connectivity and the published technology catalog.");
  process.exitCode = 1;
} finally {
  await closeMongoConnection();
}
