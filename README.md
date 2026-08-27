# نجوم القيادة — Leadership Stars

Phone-first Arabic (RTL) web app for tracking a 6-month youth leadership program:
daily reading and habit logging, monthly application exercises, attendance, and
weighted monthly scoring across participant / parent / supervisor roles.

## Stack

TanStack Start (SSR) · React 19 · TanStack Router + React Query · Tailwind CSS v4 ·
shadcn/ui · Supabase (Postgres + Auth + Storage + RLS)

## Setup

```bash
npm install
cp .env.example .env   # fill in your Supabase project values
npm run dev
```

## Database

Migrations live in `supabase/migrations/`. With the Supabase CLI linked to your project:

```bash
supabase db push
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (Nitro, `cloudflare-module` preset) |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
