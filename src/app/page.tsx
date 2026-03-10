import MainFeed from '@/components/MainFeed';
import { getProfile, fetchPosts, fetchBookmarkIds, fetchUserReactions } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [profile, posts] = await Promise.all([getProfile(), fetchPosts()]);
  const [bookmarkIds, userReactions] = profile
    ? await Promise.all([fetchBookmarkIds(), fetchUserReactions(posts.map((p) => p.id))])
    : [[], {}];

  return (
    <div className="min-h-screen bg-bg-primary">
      <main className="max-w-2xl mx-auto pb-8">
        <MainFeed
          initialPosts={posts}
          profile={profile}
          initialBookmarkIds={bookmarkIds}
          userReactions={userReactions}
        />
      </main>
    </div>
  );
}
