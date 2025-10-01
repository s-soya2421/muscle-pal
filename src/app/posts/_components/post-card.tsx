"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LikeButton } from "@/components/posts/like-button";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import type { Post } from "@/types/supabase";
import { MockPost } from "@/lib/mock-data";
import { PostImageGallery } from "./post-image-gallery";
import { getPostImageUrls } from "@/lib/image-utils";

interface PostCardProps {
  post: Post | MockPost;
}

export function PostCard({ post }: PostCardProps) {
  // MockPost と Post の両方に対応
  const isPost = 'created_at' in post;
  const created = isPost ? new Date(post.created_at) : null;
  const when = isPost ? created?.toLocaleString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : (post as MockPost).timestamp;

  const displayName = isPost 
    ? 'ユーザー'  // TODO: プロフィール情報を取得
    : (post as MockPost).author;
  const initials = displayName
    .split(" ")
    .map((s) => s?.[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "US";

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'workout': return 'ワークアウト';
      case 'progress': return '進歩報告';
      case 'motivation': return 'モチベーション';
      default: return null;
    }
  };

  return (
    <div className="flex gap-3">
      <Link href={`/posts/${post.id}`} className="flex-shrink-0">
        <Avatar>
          {/* TODO: プロフィール画像を取得 */}
          {!isPost && (post as MockPost).authorAvatar && <AvatarImage src={(post as MockPost).authorAvatar || ''} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/posts/${post.id}`} className="font-semibold text-gray-900 hover:underline">
            {displayName}
          </Link>
          <span className="text-gray-500">·</span>
          <span className="text-gray-500">{when}</span>
          {isPost && (post as Post).post_type && (post as Post).post_type !== 'general' && (
            <>
              <span className="text-gray-500">·</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {getPostTypeLabel((post as Post).post_type || 'general')}
              </span>
            </>
          )}
          {!isPost && (post as MockPost).workoutType && (
            <>
              <span className="text-gray-500">·</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {(post as MockPost).workoutType}
              </span>
            </>
          )}
        </div>
        
        <Link href={`/posts/${post.id}`} className="block hover:opacity-75 transition-opacity mt-2">
          <p className="whitespace-pre-wrap text-gray-900 leading-relaxed">{post.content}</p>
        </Link>
        
        {/* タグ表示 */}
        {isPost && (post as Post).tags && (post as Post).tags!.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(post as Post).tags!.map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 場所表示 */}
        {isPost && (post as Post).location && (
          <p className="text-sm text-gray-500 mt-2">📍 {String((post as Post).location)}</p>
        )}
        {!isPost && (post as MockPost).location && (
          <p className="text-sm text-gray-500 mt-2">📍 {String((post as MockPost).location)}</p>
        )}

        {/* 画像表示 */}
        {getPostImageUrls(post).length > 0 && (
          <div className="mt-3">
            <PostImageGallery images={getPostImageUrls(post)} />
          </div>
        )}

        {/* TODO: ワークアウトデータ表示 */}
        {/* {false && isPost && (post as Post).post_type === 'workout' && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">ワークアウト詳細</h4>
            {((post as Post).workout_data!.exercises as Array<Record<string, unknown>>).slice(0, 3).map((exercise: Record<string, unknown>, index: number) => (
              <div key={index} className="text-xs text-gray-600">
                <span className="font-medium">{exercise.name as string}</span>
                {exercise.sets && exercise.reps && (
                  <span> - {exercise.sets as number}セット × {exercise.reps as number}回</span>
                )}
                {exercise.weight && (
                  <span> ({exercise.weight as number}kg)</span>
                )}
              </div>
            ))}
            {((post as Post).workout_data!.exercises as Array<Record<string, unknown>>).length > 3 && (
              <p className="text-xs text-gray-500">+{((post as Post).workout_data!.exercises as Array<Record<string, unknown>>).length - 3}件の種目</p>
            )}
          </div>
        )} */}

        <div className="flex items-center gap-12 mt-3 text-gray-500">
          {isPost ? (
            <LikeButton 
              postId={post.id}
              initialLikeCount={(post as Post).like_count || 0}
              initialIsLiked={false} // TODO: いいね状態を取得
              size="sm"
            />
          ) : (
            <button className="flex items-center gap-2 hover:text-red-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-red-50">
                ❤️
              </div>
              <span className="text-sm">{(post as MockPost).likes}</span>
            </button>
          )}
          <Link href={`/posts/${post.id}`} className="flex items-center gap-2 hover:text-blue-500 transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-blue-50">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-sm">{isPost ? ((post as Post).comment_count || 0) : (post as MockPost).comments}</span>
          </Link>
          <button className="flex items-center gap-2 hover:text-green-500 transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-green-50">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
