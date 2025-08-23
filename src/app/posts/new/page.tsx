"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

export default function NewPostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    content: "",
    privacy: "public"
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formDataObj = new FormData();
      formDataObj.append("content", formData.content);
      formDataObj.append("privacy", formData.privacy);

      // Server Actionを呼び出し
      const { createPost } = await import("@/app/actions/posts");
      await createPost(formDataObj);
      
      // 投稿成功後、投稿一覧へリダイレクト
      router.push("/posts");
    } catch (error) {
      console.error("投稿の作成に失敗しました:", error);
      setError(error instanceof Error ? error.message : "投稿に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            ダッシュボードに戻る
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">新しい投稿</h1>
        <p className="text-muted-foreground mt-2">
          あなたのフィットネスの進歩や体験をシェアしましょう！
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>投稿を作成</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="content">投稿内容 *</Label>
              <Textarea
                id="content"
                placeholder="今日のトレーニングはどうでしたか？達成したことや感じたことを書いてください..."
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                required
                rows={6}
                maxLength={500}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                {formData.content.length}/500文字
              </p>
            </div>


            <div className="space-y-2">
              <Label htmlFor="privacy">公開設定</Label>
              <Select 
                id="privacy"
                value={formData.privacy} 
                onChange={(e) => handleInputChange("privacy", e.target.value)}
              >
                <option value="public">公開（全員が見れます）</option>
                <option value="followers">フォロワーのみ</option>
                <option value="private">非公開（自分のみ）</option>
              </Select>
            </div>


            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={!formData.content.trim() || isSubmitting} 
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "投稿中..." : "投稿する"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                キャンセル
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}