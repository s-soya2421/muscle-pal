import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PostsEmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <p className="text-lg font-semibold">まだ投稿がありません</p>
        <p className="text-sm text-muted-foreground">最初の一歩を踏み出しましょう。</p>
        <Button onClick={onCreate}>新規投稿</Button>
      </CardContent>
    </Card>
  );
}
