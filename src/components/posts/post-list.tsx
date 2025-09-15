import { PostCard } from "./post-card";
import type { Post } from "./types";

export function PostList({ posts }: { posts: Post[] }) {
  if (!posts?.length) return null;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}
