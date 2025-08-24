import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MainLayout } from '@/components/layout/main-layout';

export default function PostDetailLoading() {
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
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/posts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">投稿</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-3">
        <div className="flex gap-3">
          {/* Avatar */}
          <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
          
          {/* Post Content */}
          <div className="flex-1 min-w-0">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm">
                <Skeleton className="h-4 w-20" />
                <span className="text-gray-500">·</span>
                <Skeleton className="h-4 w-16" />
              </div>
              <Button variant="ghost" size="sm">
                <div className="w-4 h-4" />
              </Button>
            </div>

            {/* Post Content */}
            <div className="mt-2 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>

            {/* Images Skeleton */}
            <div className="mt-3">
              <Skeleton className="w-full h-64 rounded-lg" />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-12 mt-3">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        </div>

        {/* Replies Section */}
        <div className="mt-6 space-y-4">
          <Skeleton className="h-6 w-24" />
          
          {/* Reply Input Skeleton */}
          <div className="flex gap-3">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-20 w-full rounded-lg" />
              <div className="flex justify-end">
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>

          {/* Replies Skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <span className="text-gray-500">·</span>
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}