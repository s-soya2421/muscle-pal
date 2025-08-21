"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

export default function NewPostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    content: "",
    category: "",
    tags: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // TODO: 実際の投稿API呼び出し
      await new Promise(resolve => setTimeout(resolve, 1000)); // 仮の遅延
      
      // 投稿成功後、投稿一覧へリダイレクト
      router.push("/posts");
    } catch (error) {
      console.error("投稿の作成に失敗しました:", error);
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
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                {formData.content.length}/500文字
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">カテゴリー</Label>
              <Select 
                id="category"
                value={formData.category} 
                onChange={(e) => handleInputChange("category", e.target.value)}
              >
                <option value="">カテゴリーを選択してください</option>
                <option value="training">トレーニング</option>
                <option value="nutrition">栄養・食事</option>
                <option value="progress">進歩・成果</option>
                <option value="motivation">モチベーション</option>
                <option value="tips">アドバイス・コツ</option>
                <option value="question">質問</option>
                <option value="other">その他</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">タグ (任意)</Label>
              <Input
                id="tags"
                placeholder="例: 筋トレ, ベンチプレス, PR更新 (カンマ区切り)"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                関連するタグをカンマで区切って入力してください
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={!formData.content.trim() || isSubmitting} className="flex-1">
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