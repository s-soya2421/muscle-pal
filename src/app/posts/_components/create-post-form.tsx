"use client";

import * as React from "react";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { createPost } from "@/app/actions/posts";

export function CreatePostForm() {
  const supabase = createBrowserClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // best-effort のUX: ログイン状態でボタン制御
  React.useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setAuthed(Boolean(data.user));
    });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function onAction(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createPost(formData);
        formRef.current?.reset(); // テキストエリアをクリア
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("投稿に失敗しました");
        }
      }
    });
  }

  return (
    <form ref={formRef} action={onAction} className="space-y-3">
      <Textarea
        id="content"
        name="content"
        placeholder="今日のトレ進捗や気づきをシェア…"
        required
      />
      {/* 画像URLカラムがある前提。不要ならこのinputを削除 */}
      <input type="url" name="image_url" className="hidden" aria-hidden="true" />

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {authed ? "" : "投稿するにはログインが必要です"}
        </div>
        <Button type="submit" disabled={!authed || isPending}>
          {isPending ? "投稿中…" : "投稿"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
