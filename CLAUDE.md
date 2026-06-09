# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack personal finance tracker with a React web client, a React Native + Expo mobile client, a Supabase (Postgres) backend with Row-Level Security, and a thin Node.js (Express) AI server. Transactions can be added by voice/natural language, parsed into structured fields by an LLM (provider-agnostic; Gemini by default, Anthropic supported).

The repo is named `GraphQL` for historical reasons (an Apollo GraphQL server was implemented earlier and then removed once the direct-Supabase architecture proved sufficient — see "Architecture decision" below).

## Development Commands

### Web client (React + Vite)
```bash
cd client
npm run dev        # Dev server at http://localhost:5173
npm run build      # Production build
npm run lint       # ESLint
npm run preview    # Preview production build
npm test           # Run Vitest once
npm run test:watch # Vitest in watch mode
```

### Mobile client (React Native + Expo)
```bash
cd mobile
npm start                  # Metro / dev server
npm test                   # Run Jest once (32 tests across 5 suites)
npm run test:watch         # Jest in watch mode
npx expo start --dev-client  # Connect Metro to a custom EAS dev build
eas build --profile development --platform android  # Build a new dev client
```

### Server (Node.js + Express)
```bash
cd server
npm start          # Express at http://localhost:4000
npm run dev        # Same, with nodemon
npm test           # Run Vitest once (14 tests: LLM provider selection + AI parsing)
```

Run the server only if you need the AI parsing endpoint (`/api/parse-transaction`). All data operations (transactions, categories, dashboard) talk to Supabase directly from each client and work without the server running.

## Architecture decision: no GraphQL

The project briefly had an Apollo GraphQL server in front of Supabase. Each resolver was a thin proxy: it verified the JWT, built an RLS-scoped Supabase client, and called the same `supabase.from(...).select(...)` the JS client could call directly from the browser. Removing it lost no capability:

- The Supabase JS client already gives typed queries, nested selects across foreign keys, and realtime — the things GraphQL is usually adopted for.
- Row-Level Security policies in Postgres enforce per-user access at the DB layer, so duplicating ownership checks in resolvers was redundant.
- Removing the GraphQL layer also removed one network hop, one server to maintain, and a few hundred lines of duplicated logic.

The server is now a small Express app that exists for one reason: to keep the LLM API keys server-side. That's the only thing that has to be on a server.

## Data flow

```
# Primary path — clients read/write Supabase directly
React Components / RN Screens  →  React Query (services/*)  →  Supabase (Postgres, RLS)

# AI path — the only thing either client calls on the server
QuickModal / TransactionFormScreen (voice)  →  services/ai.js  →  POST /api/parse-transaction  →  LLM provider
```

## Backend (`server/`)
- `src/index.js` — Express app: helmet, CORS (`ALLOWED_ORIGINS`), rate limiting (100 req / 15 min), `/health` check, and `/api/parse-transaction` (JWT-verified via `supabaseAdmin.auth.getUser`, fetches the user's categories with an RLS-scoped client, then calls `parseTransaction`).
- `services/supabase.js` — Supabase clients: `supabaseAdmin` (service-role, bypasses RLS) and `createUserClient(jwt)` (per-request, RLS-scoped).
- `services/ai.js` — `parseTransaction(text, categories, today)`: builds the system prompt, calls the selected LLM, then parses + validates the JSON response.
- `services/llm/` — provider-agnostic LLM layer (see below).

### LLM layer (`server/services/llm/`)
- `index.js` — `getLLM()` reads `LLM_PROVIDER` (default `gemini`), returns the matching adapter, throws on an unknown value.
- `gemini.js` / `anthropic.js` — each exports `chat(system, user) => Promise<string>`, hiding the provider's SDK shape behind one interface.
- Switch providers by setting `LLM_PROVIDER=gemini` or `LLM_PROVIDER=anthropic` in `server/.env` and restarting — no code changes.
- Prompt-building and JSON validation live in `ai.js`, so they are shared across providers.

## Web client (`client/src/`)
- `main.jsx` — React Query (`QueryClientProvider`, 30s staleTime), `AuthProvider`, `ErrorBoundary`, Sonner toaster.
- `App.jsx` — tab-based routing: Dashboard / Transactions / Analytics.
- `lib/supabase.js` — browser Supabase client (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- `context/AuthContext.jsx` — Supabase auth (session, login/logout/sign-up; passes `signup_source: 'web'` so the email template can branch on origin).
- `services/` — data layer over Supabase: `transactions.js`, `categories.js`, `dashboard.js`; plus `ai.js` (REST call to the server's AI endpoint).
- `components/` — UI; `QuickModal.jsx` handles add/edit and voice input.
- `hooks/useQuickModal.js` — modal open/close state.
- `utils/` — helpers (e.g. `dateRanges.js`, `csvImport.js` + `parsers/`), with tests under `utils/__tests__/`.

## Mobile client (`mobile/src/`)
React Native + Expo (SDK 54). Reuses the web's Supabase + AI architecture; only the UI is new code.

- `App.js` — providers: React Query, SafeArea, `AuthProvider`, NavigationContainer wrapping the root navigator.
- `lib/supabase.js` — mobile Supabase client. Uses `AsyncStorage` for session persistence and an `AppState` listener to start/stop the token-refresh while foreground/background.
- `context/AuthContext.js` — mirrors the web (`signup_source: 'mobile'`); plus an OTP confirmation flow.
- `navigation/` — `RootNavigator` gates on session, `AuthNavigator` (Login / SignUp / VerifyOtp), `MainStack` (tabs + modal screens), `MainTabs` (Dashboard / Transactions / Analytics) with a profile icon in the header.
- `screens/` — `DashboardScreen`, `TransactionsScreen`, `AnalyticsScreen`, `TransactionFormScreen` (add/edit/delete with voice mic), `ProfileScreen`, `BudgetSettingScreen`, `ImportCSVScreen`, and the auth screens.
- `services/` — `transactions.js`, `categories.js`, `dashboard.js` are **copied verbatim from the web** (no DOM dependencies, RLS keeps them safe). `ai.js` is also a near-copy.
- `hooks/` — `useTransactions`, `useCategories`, `useDashboard`, `useVoiceInput`.
- `components/dashboard/`, `components/analytics/` — chart + insight building blocks (uses `react-native-gifted-charts`).
- `utils/` — `dateRanges.js` and `csvImport.js` + `parsers/` ported from the web. `format.js` is mobile-specific.

### Mobile-specific architecture notes
- **OTP email confirmation:** sign-up navigates to `VerifyOtpScreen`. The Supabase email template branches on `{{ .Data.signup_source }}` so mobile users get a 6-digit code (verified via `supabase.auth.verifyOtp`), web users get the legacy confirm link.
- **Voice input:** `useVoiceInput` wraps `expo-speech-recognition`; `try { require(...) }` around the import lets the same screen run in Expo Go (voice disabled) and in a dev build (voice enabled).
- **EAS dev build required for production-feel features:** voice input (`expo-speech-recognition`), CSV import (`expo-document-picker` + `expo-file-system`), and date picker (`@react-native-community/datetimepicker`) all need native modules. Build via `eas build --profile development --platform android`.

## Supabase database
- `transactions` — `id` (uuid), `user_id`, `amount`, `type` (`INCOME`|`EXPENSE`), `description`, `category_id`, `date` (YYYY-MM-DD).
- `categories` — `id` (uuid), `user_id`, `name`, `type`, `icon`, `color`, `is_system`.
- `profiles` — includes `monthly_budget` (used by the dashboard's budget card).
- Postgres RPCs: `get_dashboard_data`, `get_user_categories`, `get_category_spending`, `get_monthly_trends`.
- Row-Level Security scopes rows to the authenticated user; the AI server uses a per-request user client (`createUserClient`) so its category fetch respects RLS.
- Server env (`server/.env`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`.

## Voice / AI input
- **Web:** `QuickModal.jsx` uses `webkitSpeechRecognition` to capture speech.
- **Mobile:** `TransactionFormScreen` uses `useVoiceInput` → `expo-speech-recognition`.
- Both then POST the transcript to `/api/parse-transaction` (with the Supabase access token).
- The server verifies the JWT, fetches the user's categories (RLS-scoped), and calls `parseTransaction`, which routes through `getLLM()` to the configured provider.
- The provider returns JSON; `ai.js` strips fences, parses, and validates it, then the parsed fields auto-fill the form.
- Server env for AI: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `LLM_PROVIDER` (default `gemini`), optional `ANTHROPIC_MODEL` / `GEMINI_MODEL`. Clients use `VITE_API_URL` / `EXPO_PUBLIC_API_URL` (default `http://localhost:4000` — must be a LAN-reachable URL for mobile devices).

## Testing
- **Web client:** **Vitest** + **React Testing Library** + **jsdom**. Setup file loads `@testing-library/jest-dom`. Tests under `__tests__/` directories next to source.
- **Mobile client:** **Jest** + `jest-expo` preset + **@testing-library/react-native**. Setup file at `mobile/jest.setup.js` loads `@testing-library/jest-native/extend-expect`. 32 tests across 5 suites — including an explicit `signup_source: 'mobile'` assertion in AuthContext tests.
- **Server:** **Vitest**. 14 tests: LLM provider selection (`services/llm/__tests__/index.test.js`) and AI parsing (`services/__tests__/ai.test.js`). Server is CommonJS, so tests load modules-under-test via `createRequire`.
