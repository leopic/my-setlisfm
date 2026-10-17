# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn start          # Expo dev server
yarn ios            # Run on iOS simulator
yarn android        # Run on Android emulator
yarn test           # Jest unit + integration tests (watch mode off by default)
yarn lint           # ESLint check — fails on any warning (--max-warnings 0)
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

## Quality gates

Two layers, both required — never bypass either:

- **Pre-commit** (husky + lint-staged): runs `eslint --fix` on staged `.ts`/`.tsx`.
  Formatting is repaired in place and restaged; anything unfixable blocks the commit.
- **CI** (`.github/workflows/ci.yml`): `yarn install --immutable`, then lint, tests and
  `tsc --noEmit` on every PR and push to `main`.

`prettier/prettier` is an `error` and `yarn lint` runs with `--max-warnings 0`, so a
warning fails the build. That is deliberate: as a warning it let ~2500 violations
accumulate, because ESLint exits 0 on warnings.

The hook only lints staged files. Types and tests are CI's job.

`expo-doctor` also runs in CI.

## Architecture

This is an Expo Router (React Native) app that tracks a user's concert history by syncing with the Setlist.fm API and storing everything locally in SQLite.

### Navigation

Expo Router file-based routing with a native bottom tab bar (5 tabs):

```
app/
  _layout.tsx          ← root: DB init, auth gate (onboarding vs tabs)
  onboarding.tsx       ← first-run: enter Setlist.fm username + initial sync
  (tabs)/
    (home)/            ← dashboard + settings (username, sync, clear data)
    (concerts)/        ← concert list → setlist detail
    (artists)/         ← artist list → artist's concerts
    (venues)/          ← venues → geographic hierarchy (continent/country/city)
    (stats)/           ← charts and insights + world map
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
| `src/database/schema.ts` | SQLite schema: 9 tables + indexes |
| `src/database/operations.ts` | All CRUD + complex join queries (stats, rankings, geo queries) |
| `src/contexts/SyncContext.tsx` | Context that propagates sync completion; screens subscribe to re-fetch |
| `src/i18n/en.ts` | All UI strings — add keys here for new copy |
| `src/utils/colors.ts` | `useChronicleColors()` hook — always use this for theme colors |
| `src/utils/typography.ts` | `Type` scale (Space Grotesk) — spread it into text styles |

### Sync Behaviour

Sync is incremental: it stops when a fetched page contains no new setlists. This means re-syncs are cheap for users who sync frequently. The sync state (last sync timestamp, username) is stored in the `metadata` table.

### Database

`DatabaseManager` is a singleton. `DataProcessor` writes in dependency order inside a transaction:

`countries → cities → venues → artists → setlists → sets → songs`

All writes are idempotent — safe to run the same data twice.

### i18n

All user-facing strings go through `t()` from `react-i18next`. Keys live in `src/i18n/en.ts`. English is the only supported locale today; device locale detection is wired up for future expansion.

ESLint (`i18next/no-literal-string`) fails on copy written straight into JSX, as text or as a copy prop (`title`, `placeholder`, `accessibilityLabel`…). It can't see strings outside JSX, so `Alert.alert` messages and helpers that build display text (e.g. `src/utils/date.ts`) need the same care by hand. A real exception (a brand name) gets an inline disable with the reason. Only the props listed in `eslint.config.js` are checked, so a component with a new copy prop (say `subtitle`) needs it added there.

### Styling

Use `useChronicleColors()` for every color value — never hardcode hex. The hook reads the active color scheme (light/dark) and returns the Chronicle palette. Text styles start from `Type` in `src/utils/typography.ts`. Layout uses React Native `StyleSheet`.

## Testing

- **Unit tests** live in `src/__tests__/`: the API client (rate limiting, retries, pagination), sync, `DataProcessor` (normalization), database queries and pure utils.
- **Integration tests** live in `src/__tests__/integration/` and render the real `app/` routes headlessly with `renderRouter` from `expo-router/testing-library`. SQLite is Node's built-in `node:sqlite` in memory (`test/expoSqliteNode.ts`), seeded from the same fixture as Maestro (`.maestro/fixtures/seed.sql`). Under Jest the native tab bar isn't rendered (switch tabs with `openTab`), and lists need `layOutLists()` before their rows are tappable; helpers live in `test/screen.ts`. Rendering, events and the helpers are async (RNTL 14), so always `await` them.
- **E2E tests** live in `.maestro/` and use Maestro YAML. Screens expose `testID` props for selectors (e.g. `dashboard-screen`).

### When to run Maestro

Maestro doesn't run on PRs (the CI runner's simulator is too flaky); the headless
integration tests cover screens and navigation there. What only Maestro catches is a
Release build that won't launch or crashes natively, so **any native change must pass
Maestro both locally and on CI before merging**: Expo SDK or `expo-*` bumps, React
Native, dependencies with native code, `app.config.js` and its plugins, including
Dependabot PRs for any of these. The `Native fingerprint` check comments on any PR that
changes the iOS fingerprint as a reminder; it doesn't block merging.

- Locally: `yarn test:e2e` needs a booted simulator with the app installed and launched
  once (it seeds the app's database, so use a dedicated simulator, not one with real data).
- On CI: `gh workflow run e2e.yml --ref <branch>`. The native build is cached by
  fingerprint, but caches from a PR branch aren't shared, so the first run on a branch
  usually rebuilds from scratch (~27 min); re-runs on the same branch take ~9 min.

A run where no flow executed ("iOS driver not ready in time") is the runner, not the
app — re-run it. A flow that ran and failed is a real failure.

## Environment

Create a `.env` file at the repo root:
```
SETLISTFM_API_KEY=your_key_here
```

The key is injected at build time via `app.config.js` → `extra.setlistFmApiKey`.
