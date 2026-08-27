# Agent notes

TanStack Start + React 19 + Tailwind v4 app backed directly by Supabase.

- `src/routes/` — file-based routes (`routeTree.gen.ts` is generated, don't edit).
- `src/integrations/supabase/` — browser client, server (service-role) client, auth middleware.
- `supabase/migrations/` — schema, RLS, seed. Apply with `supabase db push`.
- Env lives in `.env` (see `.env.example`). Never commit real keys.
- UI copy is Arabic, RTL. No emojis in UI — use lucide icons.
