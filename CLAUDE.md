# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

StretchPlanner — a rule-based mobility/stretching coach. React + TypeScript SPA (Vite), Tailwind + shadcn-style UI primitives, Supabase for auth/data, Zustand for client state.

## Commands

Uses **pnpm** (see `pnpm-lock.yaml` and `package.json`'s `pnpm.onlyBuiltDependencies`). Do not switch to npm/yarn.

- `pnpm dev` — Vite dev server
- `pnpm build` — typecheck via `tsc -b` then Vite build. Use this to verify TS (there is no separate `typecheck` script)
- `pnpm preview` — serve the production build
- `pnpm test` — Vitest. There is no test watcher alias; use `pnpm test <pattern>` for a single file, `pnpm test -- --run` for a one-shot run
- No lint/format scripts are configured — rely on `tsc` strictness

## Architecture

**Routing shape** (`src/routes.tsx`): a single `<ProtectedRoute><AppShell/></ProtectedRoute>` parent wraps all app pages; `/login` is the only public route. `ProtectedRoute` gates on `useAppStore.session` and renders a loader while `authLoading` is true, so pages can assume a session exists. Unknown paths redirect to `/today`.

**Auth + global state** (`src/store/useAppStore.ts`): a single Zustand store holds `session`, `user`, `authLoading`. `App.tsx` calls `initAuth()` once in a `useEffect`; it primes the session from `supabase.auth.getSession()` and subscribes to `onAuthStateChange`, returning an unsubscribe. Auth uses Supabase magic-link (`signInWithOtp`) with `emailRedirectTo = origin + /today`. Do not introduce a second auth source of truth — add new global slices to this store.

**Supabase client** (`src/lib/supabase.ts`): a single client is created at module load. It falls back to placeholder URL/key strings so the app doesn't crash when env vars are missing; `isSupabaseConfigured` is the runtime guard (see `Login.tsx` for the pattern). Any page hitting Supabase should branch on this flag rather than assuming the client works.

**Phased build**: most pages under `src/pages/` are intentional 10-line placeholders announcing the phase they'll be built in (Schedule → Phase 3, Today → Phase 5, Assessment → Phase 8, etc.). Don't treat them as incomplete bugs. New feature work should be delivered phase-by-phase, stopping for user approval between phases.

**UI conventions**:
- shadcn-style primitives live in `src/components/ui/` (currently `button`, `input`). `components.json` is configured — add new primitives via `npx shadcn@latest add <name>` rather than hand-rolling.
- Use the `cn()` helper from `@/lib/utils` (clsx + tailwind-merge) for conditional classes.
- Theme is HSL CSS variables in `src/index.css` wired through `tailwind.config.js`; use semantic tokens (`bg-background`, `text-muted-foreground`, etc.) instead of raw Tailwind colors.
- `AppShell` renders a top nav on md+ and a fixed bottom nav on mobile — keep both in sync when adding routes.

**Path alias**: `@/*` → `src/*` is configured in both `tsconfig.app.json` and `vite.config.ts`. Always import via `@/...`, never deep relative paths.

**TS strictness**: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` are all on. Array/record access returns `T | undefined` — handle it.

**Domain types** (`src/lib/types.ts`): `Activity`, `RoutineType`, `Intensity`, `ExerciseCategory`, `WeakPoints`, `Profile` are the canonical types for the mobility coach domain. Extend these unions rather than introducing parallel string types elsewhere.

## Environment

`.env.local` holds `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. `.env.example` is checked in as a template. Vite requires a dev-server restart after changing env vars.
