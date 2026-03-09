import MainFeed from '@/components/MainFeed';
import { getProfile, fetchPosts, fetchBookmarkIds, fetchUserReactions } from '@/lib/actions';

export default async function Home() {
  const profile = await getProfile();
  const posts = await fetchPosts();
  const bookmarkIds = profile ? await fetchBookmarkIds() : [];
  const userReactions = profile
    ? await fetchUserReactions(posts.map((p) => p.id))
    : {};

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
