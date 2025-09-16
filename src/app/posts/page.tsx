// app/posts/page.tsx
import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "./_components/post-card";
import { CreatePostForm } from "./_components/create-post-form";
import { MainLayout } from "@/components/layout/main-layout";

// --- Types ---
import type { Post, Profile } from "@/types/supabase";

// --- Data fetch on the server ---
async function getPostsData(): Promise<Post[]> {
  try {
    const { getPosts } = await import('@/app/actions/posts');
    return await getPosts({ limit: 20 });
  } catch (error) {
    console.error('投稿取得エラー:', error);
    return [];
  }
}

// --- PostsList Server Component ---
async function PostsList() {
  const posts = await getPostsData();
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>まだ投稿がありません</p>
        <p className="text-sm mt-2">最初の投稿をしてみましょう！</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {posts.map((post) => (
        <div key={post.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );
}

// --- Loading Component ---
function PostsLoading() {
  return (
    <div className="divide-y">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="px-4 py-3">
          <div className="flex gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-4 mt-3">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Server Component Page ---
export default async function PostsPage() {
  return (
    <MainLayout
      rightSidebar={
        <div className="space-y-4">
          {/* トレンド */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">今話題のトレーニング</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">#自重トレーニング</div>
                <div className="text-gray-500">2,543件の投稿</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">#プロテイン</div>
                <div className="text-gray-500">1,827件の投稿</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">#ランニング</div>
                <div className="text-gray-500">967件の投稿</div>
              </div>
            </CardContent>
          </Card>
          
          {/* おすすめユーザー */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">おすすめのユーザー</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {['筋トレマスター', 'ランニングコーチ', 'フィットネスアドバイザー'].map((name) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
                    <div>
                      <div className="text-sm font-medium">{name}</div>
                      <div className="text-xs text-gray-500">@{name.toLowerCase()}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">フォロー</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      }
    >
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">ホーム</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="divide-y">
        {/* 投稿フォーム */}
        <div className="p-4 border-b-8 border-gray-100">
          <CreatePostForm />
        </div>

        {/* 投稿一覧 */}
        <div>
          <Suspense fallback={<PostsLoading />}>
            <PostsList />
          </Suspense>
        </div>
      </div>
    </MainLayout>
  );
}