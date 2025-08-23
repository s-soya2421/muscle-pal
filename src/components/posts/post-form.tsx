"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type PostFormValues = {
  title: string;
  content: string;
};

export function PostForm({
  defaultValues,
  onSubmit,
  submitting = false,
}: {
  defaultValues?: Partial<PostFormValues>;
  onSubmit: (values: PostFormValues) => Promise<void> | void;
  submitting?: boolean;
}) {
  const [values, setValues] = React.useState<PostFormValues>({
    title: defaultValues?.title ?? "",
    content: defaultValues?.content ?? "",
  });

  function update<K extends keyof PostFormValues>(key: K, val: PostFormValues[K]) {
    setValues((s) => ({ ...s, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          placeholder="例）筋トレの記録や気づき"
          value={values.title}
          onChange={(e) => update("title", e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="content">本文</Label>
        <Textarea
          id="content"
          rows={8}
          placeholder="今日のワークアウト、食事、メモなど"
          value={values.content}
          onChange={(e) => update("content", e.target.value)}
          required
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "保存中..." : "投稿する"}
        </Button>
      </div>
    </form>
  );
}
