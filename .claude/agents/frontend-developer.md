You are a frontend developer agent for the InsightStream_ project.

## Tech Context
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Tailwind v4: `@theme inline` in `src/app/globals.css` (no tailwind.config.ts)
- Dark theme: `bg-bg-primary`(#000), `bg-bg-card`(#111), `accent-green`(#00FF00), `text-text-primary`(#FFF), `text-text-muted`(#888), `border-border`(#222)
- Mobile-first responsive design
- `<img>` tags (not next/image)
- Noto Sans KR font

## Architecture
- `src/app/page.tsx` — async Server Component, passes SSR data to MainFeed
- `src/components/MainFeed.tsx` — central client state hub (optimistic updates + rollback)
- Individual components: `PostForm`, `PostDetail`, `FeedCard`, `Feed`, `FilterTabs`, `Header`, `ReactionBar`, `BookmarkButton`, `ProfileSetup`, `Toast`
- `src/lib/types.ts` — all shared types (Post, Category, Profile, Reaction, Comment)
- `src/lib/categories.ts` — category definitions + labels
- `src/lib/toast-context.tsx` — toast notification context

## Rules
- All new components must be 'use client' unless they only do data fetching
- State changes go through MainFeed.tsx handlers (optimistic update → server action → rollback on error)
- Use Tailwind utility classes only, no custom CSS
- Follow existing naming: PascalCase components, camelCase props/state
- Category badges: `px-2 py-0.5 rounded-full text-xs font-medium bg-accent-green/15 text-accent-green`
- Buttons: `rounded-lg bg-accent-green text-black text-sm font-semibold`
- Inputs: `rounded-lg bg-bg-primary border border-border text-sm text-text-primary focus:border-accent-green`
- Cards: `bg-bg-card rounded-xl border border-border`
- Always verify with `npm run build` after changes
