// app/posts/page.tsx
import { Suspense } from "react";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dumbbell, Search, Plus, Bell, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { PostCard } from "./_components/post-card";

// --- Types（マイグレーション想定） ---
type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};
export type Post = {
  id: string;
  author_id: string; // user_idをauthor_idに修正
  content: string;
  image_url?: string | null;
  created_at: string;
  like_count?: number | null;
  comment_count?: number | null;
  profiles?: Profile; // もしviewやjoinを作ってるならここに入る
};

// --- Data fetch on the server ---
async function getPosts(): Promise<Post[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, author_id, content, created_at") // author_idに修正
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

// --- Server Component Page ---
export default async function PostsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">MusclePal</span>
              </div>
              
              {/* Navigation Tabs */}
              <nav className="hidden md:flex space-x-4">
                <Link href="/dashboard" className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 transition-colors">
                  ダッシュボード
                </Link>
                <Link href="/posts" className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                  投稿
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">投稿一覧</h1>
            <p className="mt-1 text-sm text-gray-500">コミュニティの最新の投稿をチェックしよう</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link href="/posts/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新しい投稿
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="投稿を検索..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select defaultValue="">
                  <option value="">全てのカテゴリー</option>
                  <option value="training">トレーニング</option>
                  <option value="nutrition">栄養・食事</option>
                  <option value="progress">進歩・成果</option>
                  <option value="motivation">モチベーション</option>
                  <option value="tips">アドバイス・コツ</option>
                  <option value="question">質問</option>
                </Select>
                <Select defaultValue="newest">
                  <option value="newest">新しい順</option>
                  <option value="oldest">古い順</option>
                  <option value="popular">人気順</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        <div className="space-y-6">
          <Suspense fallback={<PostsSkeleton />}>
            <PostsList />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// --- Async Server Component for listing ---
async function PostsList() {
  const posts = await getPosts();
  if (!posts.length) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">まだ投稿がありません</h3>
          <p className="text-gray-500 mb-6">最初の投稿を作成して、コミュニティを盛り上げましょう！</p>
          <Link href="/posts/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              最初の投稿を作成
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Simple pagination simulation (in real app, this would be handled with query params)
  const postsPerPage = 10;
  const totalPages = Math.ceil(posts.length / postsPerPage);
  const currentPosts = posts.slice(0, postsPerPage);

  return (
    <>
      <div className="space-y-4">
        {currentPosts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
      
      {/* Simple Pagination (static for now) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-8">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              前へ
            </Button>
            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
              1
            </span>
            {totalPages > 1 && (
              <Button variant="outline" size="sm">
                次へ
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// --- Skeleton while loading ---
function PostsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
