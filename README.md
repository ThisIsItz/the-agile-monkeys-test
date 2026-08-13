# Headless CMS Admin

A small headless CMS admin application built as a frontend-focused take-home exercise.

The application allows users to define content schemas, create and manage entries from those schemas, reference content across schemas, preview the impact of schema changes, and keep multiple clients in sync through real-time updates.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Mantine
- Mantine Form
- React Router
- Socket.IO Client
- Lucide

### Backend

- Node.js
- Express
- TypeScript
- SQLite with `better-sqlite3`
- Socket.IO
- Zod

### Testing

- Vitest
- React Testing Library
- jsdom
- In-memory SQLite for backend tests

## Requirements

- Node.js 22.12 or newer
- npm

## Install and Run

Install dependencies:

```bash
npm install
```

The app is split into a Vite frontend and an Express API, so start each in its own terminal:

```bash
npm run dev         # frontend, with /api and /socket.io proxied to the API
npm run dev:server  # API + Socket.IO server on port 3001
```

Open the URL printed by Vite in the terminal.

No additional configuration, environment variables, database setup, migrations, or external accounts are required for local development.

On first run, the application automatically creates the local SQLite database and seeds a small amount of sample content so the main functionality can be explored immediately. The seed includes related `Author` and `Book` schemas and example entries, and only runs once per database — deleting sample content through the application will not cause it to be recreated on the next restart.

## Available Commands

```bash
npm run dev         # start the frontend dev server
npm run dev:server  # start the API and Socket.IO server
npm run build       # type-check and build the frontend for production
npm run preview     # preview the production build locally
npm test            # run the test suite in watch mode
npm run test:run    # run the test suite once
npm run typecheck   # run TypeScript project checks
npm run lint        # run ESLint
```

## Features

### Schemas

Schemas can be created, edited and deleted. Each schema is a named collection of fields that defines the shape of its entries.

Supported field types are:

- Text
- Number
- Boolean
- Date
- Reference

Fields can also be marked as required. Reference fields point to another schema and allow relationships between content types.

### Entries

Entries are created and edited through a form generated from their schema's field definitions, and validated accordingly.

### Schema Change Preview

Editing a schema previews the impact of the change—such as fields being removed, retyped, or made required—on existing entries before it is applied.

### Schema Evolution

- **Safe field migrations** — unambiguous type conversions (e.g. `"1993"` ↔ `1993`) are applied automatically; ambiguous values (e.g. `"vintage"` → number) are left untouched rather than guessed.
- **Needs review flow** — entries left with incompatible data are flagged `Needs review`, with the affected field highlighted in the entry editor until fixed and saved. Tracked in navigation state rather than persisted, so it's ephemeral (lost on refresh)—an intentional scope trade-off.
- **Schema deletion preview** — deleting a schema previews how many entries would be removed, and is blocked while another schema still references it.

### Read API

Besides the admin CRUD API, content is exposed read-only by schema name for external consumption:

- `GET /api/content/:schemaName` — all entries for a schema
- `GET /api/content/:schemaName/:entryId` — a single entry

Fields are keyed by name instead of internal ID, decoupling consumers from schema internals.

### Real-time Sync

Schema and entry changes made in one client are broadcast to all connected clients via Socket.IO, so open browser tabs stay in sync automatically.
