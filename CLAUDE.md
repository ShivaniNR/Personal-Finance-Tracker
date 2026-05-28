# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack personal finance tracker with a React frontend, a Supabase (Postgres) backend with Row-Level Security, and an Apollo GraphQL server. Transactions can be added by voice/natural language, parsed into structured fields by an LLM (provider-agnostic; Gemini by default, Anthropic supported).

## Development Commands

### Client (React + Vite)
```bash
cd client
npm run dev        # Dev server at http://localhost:5173
npm run build      # Production build
npm run lint       # ESLint
npm run preview    # Preview production build
npm test           # Run Vitest once
npm run test:watch # Vitest in watch mode
```

### Server (Node.js + Apollo)
```bash
cd server
npm start          # Apollo Server at http://localhost:4000 (nodemon via npm run dev)
npm run dev        # Same, explicit nodemon
npm test           # Run Vitest once (no server tests yet)
```

Run the server only if you need the AI parsing endpoint (`/api/parse-transaction`). The client's data operations (transactions, categories, dashboard) talk to Supabase directly and work without the server running.

## Architecture

### Data Flow

There are two distinct paths:

```
# Primary path — client reads/writes Supabase directly
React Components → React Query (client/src/services/*) → Supabase (Postgres, RLS)

# AI path — the only thing the client calls on the server
QuickModal (voice) → client/src/services/ai.js → POST /api/parse-transaction → LLM provider
```

The Apollo GraphQL server (`server/src/`) implements the same transaction/category/dashboard operations against Supabase, but the **current client does not consume the GraphQL API** — it uses Supabase directly. The GraphQL layer is implemented and auth/RLS-aware, but presently unused by the client except for the REST AI endpoint hosted on the same Express app.

### Backend (`server/`)
- `src/index.js` — Express app: helmet, CORS (`ALLOWED_ORIGINS`), rate limiting (100 req / 15 min), the `/health` check, the `/api/parse-transaction` AI endpoint, and the Apollo `/graphql` endpoint with JWT auth
- `src/schema.js` — GraphQL type definitions (Transaction, DashboardData, CategorySummary, MonthlyStats, Category)
- `src/resolvers.js` — GraphQL resolvers; query Supabase directly and validate mutation input with Zod
- `services/supabase.js` — Supabase clients: `supabaseAdmin` (service-role, bypasses RLS) and `createUserClient(jwt)` (per-request, RLS-scoped)
- `services/validation.js` — Zod schemas for mutation input (`AddTransactionInput`, `UpdateTransactionInput`, `DeleteTransactionInput`)
- `services/ai.js` — `parseTransaction(text, categories)`: builds the system prompt, calls the selected LLM, then parses + validates the JSON response
- `services/llm/` — provider-agnostic LLM layer (see below)

### LLM Layer (`server/services/llm/`)
- `index.js` — `getLLM()` reads `LLM_PROVIDER` (default `gemini`), returns the matching adapter, throws on an unknown value
- `gemini.js` / `anthropic.js` — each exports `chat(system, user) => Promise<string>`, hiding the provider's SDK shape behind one interface
- Switch providers by setting `LLM_PROVIDER=gemini` or `LLM_PROVIDER=anthropic` in `server/.env` and restarting — no code changes
- Prompt-building and JSON validation live in `ai.js`, so they are shared across providers

### Frontend (`client/src/`)
- `main.jsx` — React Query (`QueryClientProvider`, 30s staleTime), `AuthProvider`, `ErrorBoundary`, Sonner toaster
- `App.jsx` — Tab-based routing: Dashboard / Transactions / Analytics
- `lib/supabase.js` — browser Supabase client (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- `context/AuthContext.jsx` — Supabase auth (session, login/logout)
- `services/` — data layer over Supabase: `transactions.js`, `categories.js`, `dashboard.js`; plus `ai.js` (REST call to the server's AI endpoint)
- `components/` — UI; `QuickModal.jsx` handles add/edit and voice input
- `hooks/useQuickModal.js` — modal open/close state
- `utils/` — helpers (e.g. `dateRanges.js`), with tests under `utils/__tests__/`

### Supabase Database
- `transactions` — `id` (uuid), `user_id`, `amount`, `type` (`INCOME`|`EXPENSE`), `description`, `category_id`, `date` (YYYY-MM-DD)
- `categories` — `id` (uuid), `user_id`, `name`, `type`, `icon`, `color`, `is_system`
- Postgres RPCs: `get_dashboard_data`, `get_user_categories`
- Row-Level Security scopes rows to the authenticated user; the server uses a per-request user client (`createUserClient`) so resolvers respect RLS
- Server env (`server/.env`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`

### GraphQL Operations (server-side, implemented; not currently called by the client)
- Queries: `transactions`, `dashboard`, `transactionsByCategory`, `searchTransactions`, `getUserCategories`
- Mutations: `addTransaction`, `updateTransaction`, `deleteTransaction`
- `/graphql` requires a Supabase JWT (`Authorization: Bearer <token>`); the context verifies it and builds an RLS-scoped client

### Voice / AI Input
- `QuickModal.jsx` uses `webkitSpeechRecognition` to capture speech, then sends the transcript to `client/src/services/ai.js`
- That posts to `POST /api/parse-transaction` (with the Supabase access token) on the server
- The server verifies the JWT, fetches the user's categories (RLS-scoped), and calls `parseTransaction`, which routes through `getLLM()` to the configured provider
- The provider returns JSON; `ai.js` strips fences, parses, and validates it, then the parsed fields auto-fill the form
- Server env for AI: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `LLM_PROVIDER` (default `gemini`), optional `ANTHROPIC_MODEL` / `GEMINI_MODEL`; client uses `VITE_API_URL` (defaults to `http://localhost:4000`)

### Testing
- Client uses **Vitest** + **React Testing Library** + **jsdom**, configured in `client/vite.config.js` (`environment: 'jsdom'`, `setupFiles: './src/test/setup.js'`, `globals: true`)
- `client/src/test/setup.js` loads `@testing-library/jest-dom` matchers
- Tests live next to source under `__tests__/` directories
- Server has `vitest` wired into its `test` script but no tests yet
