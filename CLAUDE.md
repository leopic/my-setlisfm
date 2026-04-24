# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn start          # Expo dev server
yarn ios            # Run on iOS simulator
yarn android        # Run on Android emulator
yarn test           # Jest unit tests (watch mode off by default)
yarn lint           # ESLint check
yarn lint:fix       # ESLint auto-fix
yarn format         # Prettier format

# E2E (Maestro)
yarn test:e2e           # Full suite with seeded data
yarn test:e2e:empty     # Suite with empty DB
yarn test:e2e:seed      # Seed DB only
yarn test:e2e:clear     # Clear DB only
```

Run a single Jest test file:
```bash
yarn test src/__tests__/setlistApi.test.ts
```

## Architecture

This is an Expo Router (React Native) app that tracks a user's concert history by syncing with the Setlist.fm API and storing everything locally in SQLite.

### Navigation

Expo Router file-based routing with a native bottom tab bar (5 tabs):

```
app/
  _layout.tsx          ← root: DB init, auth gate (onboarding vs tabs)
  onboarding.tsx       ← first-run: enter Setlist.fm username + initial sync
  (tabs)/
    (home)/            ← dashboard: stats + sync trigger
    (concerts)/        ← concert list → setlist detail
    (artists)/         ← artist list → artist's concerts
    (venues)/          ← venues → geographic hierarchy (continent/country/city)
    (debug)/           ← dev-only: DB reset controls
```

### Data Flow

```
Setlist.fm API
    ↓  SetlistApiService  (rate-limited: 1 req/sec, retry with backoff)
    ↓  DataProcessor      (normalizes nested API response)
    ↓  dbOperations       (transactional upsert into SQLite)
    ↓  SyncContext        (broadcasts sync completion timestamp to all screens)
    ↓  Tab screens        (re-query DB on context change)
```

### Key Modules

| Path | Role |
|------|------|
| `src/services/setlistApi.ts` | API client — rate limiting, pagination, exponential backoff |
| `src/services/syncService.ts` | Orchestrates full sync: fetch pages until caught up, store username |
| `src/services/dataProcessor.ts` | Maps API shape → DB rows (idempotent upserts) |
| `src/database/schema.ts` | SQLite schema: 11 tables + indexes |
| `src/database/operations.ts` | All CRUD + complex join queries (stats, rankings, geo queries) |
| `src/context/SyncContext.tsx` | Context that propagates sync completion; screens subscribe to re-fetch |
| `src/i18n/en.ts` | All UI strings — add keys here for new copy |
| `src/utils/colors.ts` | `useColors()` hook — always use this for theme colors |

### Sync Behaviour

Sync is incremental: it stops when a fetched page contains no new setlists. This means re-syncs are cheap for users who sync frequently. The sync state (last sync timestamp, username) is stored in the `metadata` table.

### Database

`DatabaseManager` is a singleton. `DataProcessor` writes in dependency order inside a transaction:

`countries → cities → venues → artists → setlists → sets → songs`

All writes are idempotent — safe to run the same data twice.

### i18n

All user-facing strings go through `t()` from `react-i18next`. Keys live in `src/i18n/en.ts`. English is the only supported locale today; device locale detection is wired up for future expansion.

### Styling

Use `useColors()` for every color value — never hardcode hex. The hook reads the active color scheme (light/dark) and returns the correct palette. Layout uses React Native `StyleSheet`.

## Testing

- **Unit tests** live in `src/__tests__/` and cover `SetlistApiService` (rate limiting, retries, pagination) and `DataProcessor` (normalization).
- **E2E tests** live in `.maestro/` and use Maestro YAML. Screens expose `testID` props for selectors (e.g. `dashboard-screen`).

## Environment

Create a `.env` file at the repo root:
```
SETLISTFM_API_KEY=your_key_here
```

The key is injected at build time via `app.config.js` → `extra.setlistFmApiKey`.
