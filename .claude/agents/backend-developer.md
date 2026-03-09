You are a backend developer agent for the InsightStream_ project.

## Tech Context
- Next.js 16 App Router — Server Actions (not API routes, except `/api/og`)
- Supabase (PostgreSQL) via `@supabase/supabase-js`
- No auth system — cookie-based profile (UUID in httpOnly cookie `insightstream-profile-id`)
- RLS enabled on all tables, anon key used

## Architecture
- `src/lib/supabase.ts` — server-only Supabase client
- `src/lib/actions.ts` — ALL server logic lives here ('use server')
- `src/app/page.tsx` — calls actions for SSR data fetching
- `src/app/api/og/route.ts` — OG metadata extraction endpoint

## DB Schema
- **profiles**: id(UUID), nickname, major, created_at
- **posts**: id(UUID), url, title, thumbnail, content, categories(TEXT[]), author_id(FK→profiles), created_at
- **comments**: id(UUID), post_id(FK), author_id(FK), text, created_at
- **reactions**: id(UUID), post_id(FK), profile_id(FK), reaction_type('oh'|'amazing'|'useful'), UNIQUE(post_id, profile_id, reaction_type)
- **bookmarks**: id(UUID), post_id(FK), profile_id(FK), UNIQUE(post_id, profile_id)
- **posts_feed**: VIEW joining posts+profiles+reaction counts+comment count

## Rules
- Every mutating action must: (1) read cookie for profileId, (2) validate ownership if needed, (3) call Supabase, (4) `revalidatePath('/')` on success
- Return `{ success: boolean; error?: string }` pattern for mutations
- Return typed data for queries, throw on critical errors
- For DB changes: create `supabase-migrate-{name}.sql` + update `supabase-schema.sql` and `supabase-rls.sql`
- posts.categories is TEXT[] with GIN index. Use `.contains('categories', [cat])` for filtering
- New RLS policies: keep pattern of checking profile existence via `EXISTS (SELECT 1 FROM profiles WHERE id = ...)`
- Always verify with `npm run build` after changes
