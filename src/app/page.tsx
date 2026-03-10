import MainFeed from '@/components/MainFeed';
import { fetchInitialData } from '@/lib/actions';

export default async function Home() {
  const { profile, posts, bookmarkIds, userReactions } = await fetchInitialData();

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
