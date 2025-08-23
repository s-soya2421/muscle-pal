"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Post } from "../page";

export function PostCard({ post }: { post: Post }) {
  const created = new Date(post.created_at);
  const when = created.toLocaleString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const displayName = post.profiles?.display_name || post.profiles?.username || 'ユーザー';
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
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <Avatar>
          {post.profiles?.avatar_url && <AvatarImage src={post.profiles.avatar_url} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="grid gap-1 flex-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base leading-tight">
              {displayName}
            </CardTitle>
            {post.post_type && post.post_type !== 'general' && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {getPostTypeLabel(post.post_type)}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{when}</span>
          {post.profiles?.fitness_level && (
            <span className="text-xs text-gray-500">
              {post.profiles.fitness_level === 'beginner' && '初心者'}
              {post.profiles.fitness_level === 'intermediate' && '中級者'}
              {post.profiles.fitness_level === 'advanced' && '上級者'}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="whitespace-pre-wrap text-sm">{post.content}</p>
        
        {/* タグ表示 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 場所表示 */}
        {post.location && (
          <p className="text-xs text-gray-500">📍 {post.location}</p>
        )}

        {/* ワークアウトデータ表示 */}
        {post.post_type === 'workout' && post.workout_data?.exercises && post.workout_data.exercises.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">ワークアウト詳細</h4>
            {post.workout_data.exercises.slice(0, 3).map((exercise: any, index: number) => (
              <div key={index} className="text-xs text-gray-600">
                <span className="font-medium">{exercise.name}</span>
                {exercise.sets && exercise.reps && (
                  <span> - {exercise.sets}セット × {exercise.reps}回</span>
                )}
                {exercise.weight && (
                  <span> ({exercise.weight}kg)</span>
                )}
              </div>
            ))}
            {post.workout_data.exercises.length > 3 && (
              <p className="text-xs text-gray-500">+{post.workout_data.exercises.length - 3}件の種目</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button variant="secondary" size="sm" disabled>
            いいね {post.like_count || 0}
          </Button>
          <Button variant="ghost" size="sm" disabled>
            コメント {post.comment_count || 0}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
