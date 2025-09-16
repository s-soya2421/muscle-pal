import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getPostById, getPostComments } from '@/app/actions/posts';
import { PostImageGallery } from '../_components/post-image-gallery';
import { ReplySection } from '../_components/reply-section';
import { LikeButton } from '@/components/posts/like-button';
import { MainLayout } from '@/components/layout/main-layout';
import { getPostImageUrls } from '@/lib/image-utils';

interface PostDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const resolvedParams = await params;
  
  try {
    const [post, comments] = await Promise.all([
      getPostById(resolvedParams.id),
      getPostComments(resolvedParams.id)
    ]);
    
    if (!post) {
      notFound();
    }

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
          <Avatar className="w-12 h-12 flex-shrink-0">
            {post.profiles?.avatar_url && <AvatarImage src={post.profiles.avatar_url} alt={post.profiles?.display_name || ''} />}
            <AvatarFallback>
              {(post.profiles?.display_name || post.profiles?.username || 'U').split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          {/* Post Content */}
          <div className="flex-1 min-w-0">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-gray-900">
                  {post.profiles?.display_name || post.profiles?.username || 'Unknown User'}
                </span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-500">
                  {new Date(post.created_at).toLocaleString('ja-JP')}
                </span>
                {post.post_type && post.post_type !== 'general' && (
                  <>
                    <span className="text-gray-500">·</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {post.post_type === 'workout' && 'ワークアウト'}
                      {post.post_type === 'progress' && '進歩報告'}
                      {post.post_type === 'motivation' && 'モチベーション'}
                    </span>
                  </>
                )}
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Location */}
            {post.location && (
              <p className="text-sm text-gray-500 mt-1">📍 {post.location}</p>
            )}

            {/* Post Content */}
            <div className="mt-2">
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>
            </div>

            {/* Images */}
            {getPostImageUrls(post).length > 0 && (
              <div className="mt-3">
                <PostImageGallery images={getPostImageUrls(post)} />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-12 mt-3 text-gray-500">
              <LikeButton 
                postId={post.id}
                initialLikeCount={post.like_count || 0}
                initialIsLiked={post.is_liked || false}
                size="sm"
              />
              <button className="flex items-center gap-2 hover:text-blue-500 transition-colors group">
                <div className="p-2 rounded-full group-hover:bg-blue-50">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="text-sm">{post.comment_count || 0}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-green-500 transition-colors group">
                <div className="p-2 rounded-full group-hover:bg-green-50">
                  <Share2 className="w-4 h-4" />
                </div>
                <span className="text-sm">シェア</span>
              </button>
            </div>
          </div>
        </div>

        {/* Replies Section */}
        <div className="mt-6">
          <ReplySection postId={post.id} replies={comments || []} />
        </div>
      </div>
    </MainLayout>
  );
  } catch (error) {
    console.error('投稿詳細の取得エラー:', error);
    notFound();
  }
}