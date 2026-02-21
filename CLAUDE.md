# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs Express + Vite dev server together on port 5000)
npm run dev

# Type-check only (no emit)
npm run check

# Build for production (Vite for client, esbuild for server)
npm run build

# Run production build
npm run start

# Push schema changes to the database (no migration files generated)
npm run db:push
```

There is no test suite. There is no linter configured.

## Environment Variables

Required at runtime:
- `DATABASE_URL` — PostgreSQL connection string
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — Supabase project credentials
- `RESEND_API_KEY` — Email delivery via Resend

## Architecture Overview

This is a **full-stack monorepo** where a single Express server (port 5000) serves both the REST API (`/api/*`) and the React SPA (via Vite in dev, static files in production).

### Directory Layout

```
client/src/     # React frontend (Vite root)
server/         # Express backend
shared/         # Schema and types shared between both
```

Path aliases:
- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

### Authentication Flow

Authentication is handled entirely by **Supabase Auth** on the client side (`client/src/utils/supabaseClient.ts`). The `useAuth` hook (`client/src/hooks/useAuth.tsx`) wraps Supabase's session management.

Every API request attaches the Supabase JWT as `Authorization: Bearer <token>`. On the server, `server/lib/authMiddleware.ts` verifies the token via `supabaseService.auth.getUser(token)` and populates `req.user` (typed as `AuthenticatedRequest`). Protected routes apply `authenticateUser` middleware.

### Data Flow

```
client → apiRequest() (adds JWT) → Express API → storage.ts → Drizzle ORM → PostgreSQL
```

- **`server/storage.ts`** (66KB) is the primary data access layer — all DB queries go through it. Direct Drizzle queries in route handlers are the exception (used for complex joins).
- **`server/routes.ts`** registers the main `apiRouter` at `/api` and mounts two sub-routers:
  - `server/routes/company.ts` — company creation, membership, invitations, role-based access
  - `server/routes/timeTracking.ts` — work shifts, QR check-in/out, venue staff
- **`shared/schema.ts`** defines all 22 Drizzle table schemas and exports Zod insert/update schemas derived from them via `drizzle-zod`. These are imported directly by both server route handlers (for validation) and the client (for form types).

### Database Schema Notes

- `users`, `chefs`, `businesses`, `bookings` are **legacy tables** kept for backward compatibility. Active data lives in `chefProfiles`, `businessProfiles`, `gigs`, `gigApplications`, `gigInvoices`, `workShifts`, etc.
- Primary keys: UUIDs for active tables (Supabase user IDs used as foreign keys), serial integers for legacy tables.
- Schema changes: edit `shared/schema.ts`, then run `npm run db:push` (uses Drizzle Kit in push mode, no migration files).

### Frontend Patterns

- **Routing**: Wouter (`<Switch>` / `<Route>`) defined in `client/src/App.tsx`.
- **Server state**: TanStack Query. The default `queryFn` in `queryClient.ts` automatically attaches the Supabase JWT; query keys are API URL strings (e.g. `["/api/profiles/chef"]`).
- **Mutations**: Use `apiRequest(method, url, data)` from `lib/queryClient.ts`, then invalidate relevant queries.
- **Forms**: React Hook Form + Zod resolvers using schemas from `@shared/schema`.
- **UI**: shadcn/ui components (in `client/src/components/ui/`) built on Radix UI primitives. Do not modify these generated files directly — use them as-is.
- **Notifications**: `useNotifications` hook (context) handles in-app notifications; server-side `server/lib/notify.ts` creates DB records and `server/lib/email.ts` sends emails via Resend.

### Company & Role-Based Access

Companies (`companies` table) group multiple business profiles. Members have roles: `owner`, `admin`, `finance`, `viewer`. Company routes enforce these roles. Businesses link to companies via `businessCompanyLinks`; invitations tracked in `businessCompanyInvites`.

### Mobile

Capacitor wraps the web app for iOS/Android. The web app is the canonical implementation; native code in `android/` and `ios/` is generated/synced by Capacitor. Bundle ID: `co.thechefpantry.app`.
