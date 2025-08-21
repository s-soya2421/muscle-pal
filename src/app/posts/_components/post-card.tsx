"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Post } from "../page";

export function PostCard({ post }: { post: Post }) {
  const created = new Date(post.created_at);
  const when = created.toLocaleString();

  const initials =
    (post.profiles?.username || "U S")
      .split(" ")
      .map((s) => s?.[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "US";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <Avatar>
          {post.profiles?.avatar_url && <AvatarImage src={post.profiles.avatar_url} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="grid gap-1">
          <CardTitle className="text-base leading-tight">
            {post.profiles?.username ?? "ユーザー"}
          </CardTitle>
          <span className="text-xs text-muted-foreground">{when}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="whitespace-pre-wrap text-sm">{post.content}</p>
        {post.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image_url}
            alt="post image"
            className="rounded-xl border object-cover"
          />
        ) : null}
        <div className="flex items-center gap-2 pt-1">
          <Button variant="secondary" size="sm" disabled>
            いいね {post.like_count ?? 0}
          </Button>
          <Button variant="ghost" size="sm" disabled>
            コメント {post.comment_count ?? 0}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
