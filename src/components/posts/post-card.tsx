import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type Post } from "./types";

export function PostCard({ post, className }: { post: Post; className?: string }) {
  return (
    <Card className={cn("rounded-2xl", className)}>
      <CardHeader>
        <CardTitle className="line-clamp-1">{post.title}</CardTitle>
        {post.author ? <CardDescription>by {post.author}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
          {post.content}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <Badge variant="secondary">{new Date(post.created_at).toLocaleString()}</Badge>
      </CardFooter>
    </Card>
  );
}
